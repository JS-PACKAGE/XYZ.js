import type { Scene } from './scene.js';
import { GameObject } from './game-object.js';
import { Object3D } from './object3d.js';
import type { SceneObject } from './scene-object.js';
import { Text2D } from './text2d.js';
import { assertJsonValue, StorageError, type JsonValue } from './storage.js';

export interface Serializable {
  serialize(): JsonValue;
  restore(data: JsonValue): void | Promise<void>;
}
export type SceneSnapshot = {
  version: 1;
  objects: { [id: string]: JsonValue };
};

export function isSceneSnapshot(value: JsonValue): value is SceneSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    value.version === 1 &&
    typeof value.objects === 'object' &&
    value.objects !== null &&
    !Array.isArray(value.objects)
  );
}
export interface SnapshotRestoreReport {
  restored: string[];
  unknown: string[];
  missing: string[];
}
export type UnknownSnapshotPolicy = 'ignore' | 'error';

/** Explicit stable-id registry. Never creates objects, components, assets or scenes. */
export class Serializer {
  private readonly entries = new Map<
    string,
    { object: SceneObject; state: Serializable }
  >();
  constructor(private readonly scene: Scene) {}
  register(
    id: string,
    object: SceneObject,
    state: Serializable = sceneObjectState(object),
  ): () => void {
    if (!id || this.entries.has(id))
      throw new StorageError(
        'invalid',
        'Snapshot id must be nonempty and unique.',
      );
    if (!this.scene.has(object))
      throw new StorageError(
        'invalid',
        'Snapshot object must belong to this Scene.',
      );
    if (
      !state ||
      typeof state.serialize !== 'function' ||
      typeof state.restore !== 'function'
    )
      throw new StorageError('invalid', 'Invalid Serializable adapter.');
    const entry = { object, state };
    this.entries.set(id, entry);
    return () => {
      if (this.entries.get(id) === entry) this.entries.delete(id);
    };
  }
  capture(): SceneSnapshot {
    const objects: { [id: string]: JsonValue } = Object.create(null) as {
      [id: string]: JsonValue;
    };
    for (const [id, entry] of this.entries) {
      if (!this.scene.has(entry.object) || entry.object.destroyed) continue;
      const data = entry.state.serialize();
      assertJsonValue(data);
      objects[id] = data;
    }
    return JSON.parse(JSON.stringify({ version: 1, objects })) as SceneSnapshot;
  }
  /** Live, sequential restoration: custom async adapters can partially mutate before failure.
   * Use rebuildContentScene/ContentLoadCoordinator for isolated candidate publication instead. */
  async restore(
    snapshot: SceneSnapshot,
    policy: UnknownSnapshotPolicy = 'ignore',
  ): Promise<SnapshotRestoreReport> {
    assertJsonValue(snapshot);
    if (
      snapshot.version !== 1 ||
      !snapshot.objects ||
      Array.isArray(snapshot.objects) ||
      typeof snapshot.objects !== 'object'
    )
      throw new StorageError('invalid', 'Invalid SceneSnapshot.');
    if (policy !== 'ignore' && policy !== 'error')
      throw new StorageError('invalid', 'Invalid unknown-id policy.');
    const active = new Map(
      [...this.entries].filter(
        ([, entry]) => this.scene.has(entry.object) && !entry.object.destroyed,
      ),
    );
    const unknown = Object.keys(snapshot.objects).filter(
      (id) => !active.has(id),
    );
    const missing = [...active.keys()].filter(
      (id) => !Object.hasOwn(snapshot.objects, id),
    );
    if (policy === 'error' && (unknown.length || missing.length))
      throw new StorageError(
        'invalid',
        `Snapshot id mismatch: unknown [${unknown}], missing [${missing}].`,
      );
    const restored: string[] = [];
    for (const [id, entry] of active) {
      if (!Object.hasOwn(snapshot.objects, id)) continue;
      await entry.state.restore(snapshot.objects[id]);
      restored.push(id);
    }
    return { restored, unknown, missing };
  }
}

/** Built-in adapters are explicit; other SceneObjects require caller-authored state. */
export function sceneObjectState(
  object: SceneObject,
  custom?: Serializable,
): Serializable {
  if (object instanceof GameObject) return gameObjectState(object, custom);
  if (object instanceof Object3D) return object3DState(object, custom);
  if (custom) return custom;
  throw new StorageError(
    'invalid',
    'This SceneObject requires an explicit Serializable adapter.',
  );
}

/** Local TRS/visibility and existing rigid-body state; assets and colliders stay factory-authored. */
export function object3DState(
  object: Object3D,
  custom?: Serializable,
): Serializable {
  return {
    serialize(): JsonValue {
      const result: { [key: string]: JsonValue } = {
        transform: [
          object.position.x,
          object.position.y,
          object.position.z,
          object.rotation.x,
          object.rotation.y,
          object.rotation.z,
          object.rotation.w,
          object.scale.x,
          object.scale.y,
          object.scale.z,
        ],
        visible: object.visible,
      };
      const body = object.body;
      if (body)
        result.body = {
          type: body.type,
          lockRotation: body.lockRotation,
          allowSleep: body.allowSleep,
          continuous: body.continuous,
          mass: body.mass,
          restitution: body.restitution,
          friction: body.friction,
          linearDamping: body.linearDamping,
          angularDamping: body.angularDamping,
          gravityScale: body.gravityScale,
          velocity: [body.velocity.x, body.velocity.y, body.velocity.z],
          angularVelocity: [
            body.angularVelocity.x,
            body.angularVelocity.y,
            body.angularVelocity.z,
          ],
          force: [body.force.x, body.force.y, body.force.z],
          torque: [body.torque.x, body.torque.y, body.torque.z],
          sleeping: body.isSleeping,
        };
      if (custom) result.custom = custom.serialize();
      return result;
    },
    async restore(data: JsonValue): Promise<void> {
      assertJsonValue(data);
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new StorageError('invalid', 'Invalid Object3D snapshot.');
      const transform = data.transform;
      const saved = data.body;
      const body = object.body;
      const finiteArray = (
        value: JsonValue | undefined,
        count: number,
      ): value is number[] =>
        Array.isArray(value) &&
        value.length === count &&
        value.every((n) => typeof n === 'number' && Number.isFinite(n));
      if (!finiteArray(transform, 10))
        throw new StorageError(
          'invalid',
          'Object3D snapshot does not match the adapter.',
        );
      const rotationLength = Math.hypot(
        transform[3],
        transform[4],
        transform[5],
        transform[6],
      );
      if (
        !Number.isFinite(rotationLength) ||
        rotationLength === 0 ||
        typeof data.visible !== 'boolean' ||
        Object.hasOwn(data, 'custom') !== (custom !== undefined) ||
        (body !== undefined && saved === undefined) ||
        (saved !== undefined &&
          (!body ||
            !saved ||
            typeof saved !== 'object' ||
            Array.isArray(saved) ||
            saved.type !== body.type ||
            saved.lockRotation !== body.lockRotation ||
            saved.allowSleep !== body.allowSleep ||
            saved.continuous !== body.continuous ||
            typeof saved.mass !== 'number' ||
            saved.mass <= 0 ||
            typeof saved.restitution !== 'number' ||
            saved.restitution < 0 ||
            saved.restitution > 1 ||
            typeof saved.friction !== 'number' ||
            saved.friction < 0 ||
            typeof saved.linearDamping !== 'number' ||
            saved.linearDamping < 0 ||
            typeof saved.angularDamping !== 'number' ||
            saved.angularDamping < 0 ||
            typeof saved.gravityScale !== 'number' ||
            !finiteArray(saved.velocity, 3) ||
            !finiteArray(saved.angularVelocity, 3) ||
            !finiteArray(saved.force, 3) ||
            !finiteArray(saved.torque, 3) ||
            typeof saved.sleeping !== 'boolean' ||
            (saved.sleeping &&
              (body.type !== 'dynamic' ||
                !body.allowSleep ||
                saved.velocity.some((n) => n !== 0) ||
                saved.angularVelocity.some((n) => n !== 0) ||
                saved.force.some((n) => n !== 0) ||
                saved.torque.some((n) => n !== 0)))))
      )
        throw new StorageError(
          'invalid',
          'Object3D snapshot does not match the adapter.',
        );
      if (custom && Object.hasOwn(data, 'custom'))
        await custom.restore(data.custom);
      object.position.set(transform[0], transform[1], transform[2]);
      object.rotation.set(
        transform[3],
        transform[4],
        transform[5],
        transform[6],
      );
      object.scale.set(transform[7], transform[8], transform[9]);
      object.visible = data.visible;
      object.validatePhysics();
      if (body && saved && typeof saved === 'object' && !Array.isArray(saved)) {
        body.mass = saved.mass as number;
        body.restitution = saved.restitution as number;
        body.friction = saved.friction as number;
        body.linearDamping = saved.linearDamping as number;
        body.angularDamping = saved.angularDamping as number;
        body.gravityScale = saved.gravityScale as number;
        // A live restore replaces both public force vectors and previously sampled world impulses.
        body.clearForces();
        for (const key of [
          'velocity',
          'angularVelocity',
          'force',
          'torque',
        ] as const) {
          const vector = saved[key] as number[];
          body[key].set(vector[0], vector[1], vector[2]);
        }
        body.wake();
        if (saved.sleeping) body.sleep();
      }
    },
  };
}

/** Local transform, visibility, opacity, Text2D content and existing body velocity. Custom state is explicit. */
export function gameObjectState(
  object: GameObject,
  custom?: Serializable,
): Serializable {
  return {
    serialize(): JsonValue {
      const result: { [key: string]: JsonValue } = {
        transform: [
          object.position.x,
          object.position.y,
          object.rotation,
          object.scale.x,
          object.scale.y,
          object.pivot.x,
          object.pivot.y,
          object.skew.x,
          object.skew.y,
        ],
        visible: object.visible,
        opacity: object.opacity,
      };
      if (object.body)
        result.body = [
          object.body.velocity.x,
          object.body.velocity.y,
          object.body.angularVelocity,
        ];
      if (object instanceof Text2D) result.text = object.text;
      if (custom) result.custom = custom.serialize();
      return result;
    },
    async restore(data: JsonValue): Promise<void> {
      assertJsonValue(data);
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new StorageError('invalid', 'Invalid object snapshot.');
      const transform = data.transform;
      const body = data.body;
      if (
        !Array.isArray(transform) ||
        transform.length !== 9 ||
        !transform.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
        typeof data.visible !== 'boolean' ||
        typeof data.opacity !== 'number' ||
        data.opacity < 0 ||
        data.opacity > 1 ||
        (body !== undefined &&
          (!object.body ||
            !Array.isArray(body) ||
            body.length !== 3 ||
            !body.every((n) => typeof n === 'number' && Number.isFinite(n)))) ||
        (data.text !== undefined &&
          (!(object instanceof Text2D) || typeof data.text !== 'string')) ||
        (Object.hasOwn(data, 'custom') && !custom)
      )
        throw new StorageError(
          'invalid',
          'Object snapshot does not match the adapter.',
        );
      if (object instanceof Text2D && typeof data.text === 'string')
        await object.setText(data.text);
      if (custom && Object.hasOwn(data, 'custom'))
        await custom.restore(data.custom);
      const values = transform as number[];
      object.position.set(values[0], values[1]);
      object.rotation = values[2];
      object.scale.set(values[3], values[4]);
      object.pivot.set(values[5], values[6]);
      object.skew.set(values[7], values[8]);
      object.visible = data.visible;
      object.opacity = data.opacity;
      if (object.body && Array.isArray(body)) {
        object.body.velocity.set(body[0] as number, body[1] as number);
        object.body.angularVelocity = body[2] as number;
        object.body.clearForces();
      }
    },
  };
}
