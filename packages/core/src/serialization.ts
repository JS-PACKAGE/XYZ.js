import type { Scene } from './scene.js';
import type { GameObject } from './game-object.js';
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
    { object: GameObject; state: Serializable }
  >();
  constructor(private readonly scene: Scene) {}
  register(
    id: string,
    object: GameObject,
    state: Serializable = gameObjectState(object),
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
