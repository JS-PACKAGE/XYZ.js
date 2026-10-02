import { describe, expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Vector3 } from '../packages/math/src/index.js';
import {
  BoxCollider3D,
  CapsuleCollider3D,
  PlaneCollider3D,
  RigidBody3D,
  CharacterController3D,
  type Collider3D,
  type CharacterControllerOptions3D,
} from '../packages/core/src/physics3d/index.js';
function solid(
  scene: Scene,
  collider: Collider3D,
  position: Readonly<Vector3> = new Vector3(),
): Object3D {
  const object = new Object3D();
  object.position.set(position.x, position.y, position.z);
  object.collider = collider;
  return scene.add(object);
}
function character(
  scene: Scene,
  position: Readonly<Vector3> = new Vector3(0, 0.753, 0),
  options: CharacterControllerOptions3D = {},
): CharacterController3D {
  return new CharacterController3D(
    solid(scene, new CapsuleCollider3D(0.25, 1), position),
    scene.physics3D,
    options,
  );
}

describe('swept upright capsule movement', () => {
  it('slides along a real box face while grounding, rather than clamping an AABB', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    solid(
      scene,
      new BoxCollider3D(new Vector3(0.5, 2, 3)),
      new Vector3(2, 2, 0),
    );
    const controller = character(scene, new Vector3(0, 0.753, 0), {
      stepHeight: 0,
    });
    const result = controller.move(new Vector3(3, -0.1, 2));
    expect(controller.object.position.x).toBeCloseTo(1.2475, 3);
    expect(controller.object.position.z).toBeCloseTo(2, 4);
    expect(controller.object.position.y).toBeGreaterThan(0.749);
    expect(result.grounded).toBe(true);
    expect(result.blocked).toBe(true);
    expect(result.contacts.some((hit) => hit.normal.x < -0.99)).toBe(true);
    expect(result.displacement.z).toBeCloseTo(2, 4);
    controller.destroy();
    scene.destroy();
  });

  it('climbs a supported step and rejects one above its configured height', () => {
    for (const height of [0.2, 0.6]) {
      const scene = new Scene();
      solid(scene, new PlaneCollider3D());
      solid(
        scene,
        new BoxCollider3D(new Vector3(0.5, height / 2, 1)),
        new Vector3(1.5, height / 2, 0),
      );
      const controller = character(scene, new Vector3(0, 0.753, 0), {
        stepHeight: 0.3,
      });
      const result = controller.move(new Vector3(1.5, -0.02, 0));
      if (height === 0.2) {
        expect(controller.object.position.x).toBeGreaterThan(1.4);
        expect(controller.object.position.y).toBeCloseTo(0.953, 3);
        expect(result.grounded).toBe(true);
      } else {
        expect(controller.object.position.x).toBeLessThan(0.9);
        expect(controller.object.position.y).toBeLessThan(0.8);
        expect(result.blocked).toBe(true);
      }
      controller.destroy();
      scene.destroy();
    }
  });

  it('does not step through a low ceiling or invent ground after walking off an edge', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    solid(
      scene,
      new BoxCollider3D(new Vector3(0.5, 0.1, 1)),
      new Vector3(1.5, 0.1, 0),
    );
    solid(
      scene,
      new BoxCollider3D(new Vector3(2, 0.1, 1)),
      new Vector3(1, 1.7, 0),
    );
    const controller = character(scene, new Vector3(0, 0.753, 0), {
      stepHeight: 0.3,
    });
    controller.move(new Vector3(1.5, -0.02, 0));
    expect(controller.object.position.x).toBeLessThan(1);
    expect(controller.object.position.y).toBeLessThan(0.8);
    controller.destroy();
    scene.destroy();
    const edgeScene = new Scene();
    solid(
      edgeScene,
      new BoxCollider3D(new Vector3(0.5, 0.25, 0.5)),
      new Vector3(0, -0.25, 0),
    );
    const edge = character(edgeScene);
    expect(edge.move(new Vector3(0, -0.01, 0)).grounded).toBe(true);
    expect(edge.move(new Vector3(2, 0, 0)).grounded).toBe(false);
    expect(edge.object.position.x).toBeCloseTo(2, 4);
    edge.destroy();
    edgeScene.destroy();
  });

  it('ascends walkable slopes and refuses upward movement induced by steep collision normals', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D(new Vector3(-0.5, 1, 0)));
    const controller = character(scene, new Vector3(0, 0.7795085, 0), {
      stepHeight: 0,
      maxSlopeAngle: Math.PI / 4,
    });
    const result = controller.move(new Vector3(1, -0.1, 0));
    expect(controller.object.position.x).toBeGreaterThan(0.6);
    expect(controller.object.position.y).toBeGreaterThan(1);
    expect(result.grounded).toBe(true);
    controller.destroy();
    scene.destroy();
    const steepScene = new Scene();
    solid(steepScene, new PlaneCollider3D(new Vector3(-2, 1, 0)));
    const steep = character(steepScene, new Vector3(0, 1.07, 0), {
      stepHeight: 0,
      maxSlopeAngle: Math.PI / 4,
    });
    const blocked = steep.move(new Vector3(1, -0.1, 0));
    expect(steep.object.position.y).toBeLessThan(1.08);
    expect(steep.object.position.x).toBeLessThan(0.02);
    expect(blocked.grounded).toBe(false);
    expect(blocked.blocked).toBe(true);
    steep.destroy();
    steepScene.destroy();
  });

  it('ungrounds jumps and snaps bounded downhill motion back to a walkable surface', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    const controller = character(scene);
    expect(controller.move(new Vector3(0, -0.01, 0)).grounded).toBe(true);
    expect(controller.move(new Vector3(0, 0.2, 0)).grounded).toBe(false);
    expect(controller.object.position.y).toBeGreaterThan(0.9);
    expect(controller.move(new Vector3(0, -0.5, 0)).grounded).toBe(true);
    expect(controller.object.position.y).toBeCloseTo(0.753, 2);
    controller.destroy();
    scene.destroy();
  });

  it('pushes dynamic bodies and delivers real simulation contact transitions', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    const crate = solid(
      scene,
      new BoxCollider3D(new Vector3(0.3, 0.3, 0.3)),
      new Vector3(1, 0.3, 0),
    );
    crate.body = new RigidBody3D({ lockRotation: true });
    const controller = character(scene, new Vector3(0, 0.753, 0), {
      stepHeight: 0,
    });
    let start = 0,
      end = 0;
    crate.addEventListener('collisionstart', (event) => {
      if (
        (event as CustomEvent<{ other: Object3D }>).detail.other ===
        controller.object
      )
        start++;
    });
    crate.addEventListener('collisionend', (event) => {
      if (
        (event as CustomEvent<{ other: Object3D }>).detail.other ===
        controller.object
      )
        end++;
    });
    controller.move(new Vector3(1, 0, 0));
    expect(crate.body.velocity.x).toBeGreaterThan(0.5);
    scene.physics3D.update(1 / 120);
    expect(crate.position.x).toBeGreaterThan(1);
    // Approach the moving crate to establish a skin-gap contact before the simulation step.
    crate.body.velocity.set(0, 0, 0);
    controller.move(new Vector3(0.1, 0, 0));
    crate.body.velocity.set(0, 0, 0);
    scene.physics3D.update(1 / 120);
    expect(start).toBeGreaterThan(0);
    scene.remove(controller.object);
    expect(end).toBeGreaterThan(0);
    controller.destroy();
    controller.object.destroy();
    scene.destroy();
  });

  it('recovers shallow initial penetration geometrically and rejects recovery above the bound', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    const controller = character(scene, new Vector3(0, 0.7, 0));
    controller.move(new Vector3(0.1, 0, 0));
    expect(controller.object.position.y).toBeGreaterThan(0.75);
    expect(controller.object.position.x).toBeCloseTo(0.1, 4);
    const trapped = character(scene, new Vector3(3, 0.3, 0), {
      maxRecoveryDistance: 0.05,
    });
    expect(() => trapped.move(new Vector3(0.1, 0, 0))).toThrow();
    expect(trapped.object.position.y).toBeCloseTo(0.3, 5);
    expect(trapped.object.position.x).toBe(3);
    controller.destroy();
    trapped.destroy();
    scene.destroy();
  });

  it('stops motion after removal/destroy and releases only an auto-owned body', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    const controller = character(scene);
    scene.remove(controller.object);
    expect(() => controller.move(new Vector3(1, 0, 0))).toThrow();
    scene.add(controller.object);
    controller.destroy();
    expect(controller.object.body).toBeUndefined();
    expect(() => controller.move(new Vector3(1, 0, 0))).toThrow();
    const borrowed = solid(
      scene,
      new CapsuleCollider3D(0.25, 1),
      new Vector3(2, 0.753, 0),
    );
    const body = new RigidBody3D({ type: 'kinematic' });
    borrowed.body = body;
    const other = new CharacterController3D(borrowed, scene.physics3D);
    other.destroy();
    expect(borrowed.body).toBe(body);
    scene.destroy();
    expect(body.owner).toBeUndefined();
  });
});

describe('moving support and transactional stance', () => {
  it('inherits lift translation, yaw rotation and pending motion only once per epoch', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    platform.body = new RigidBody3D({ type: 'kinematic' });
    const controller = character(scene, new Vector3(1, 0.753, 0));
    try {
      const initial = controller.move(new Vector3(), { epoch: 0 });
      expect(initial.support).toBe(platform);
      const baseY = controller.object.position.y;
      platform.position.set(0.4, -0.05, 0);
      const lifted = controller.move(new Vector3(), { epoch: 1 });
      expect(controller.object.position.x).toBeCloseTo(1.4, 5);
      expect(controller.object.position.y).toBeCloseTo(baseY + 0.2, 5);
      expect(lifted.carriedDisplacement.x).toBeCloseTo(0.4, 5);
      expect(lifted.carriedDisplacement.y).toBeCloseTo(0.2, 5);
      platform.position.x = 0.6;
      const repeated = controller.move(new Vector3(), { epoch: 1 });
      expect(repeated.carriedDisplacement.x).toBeCloseTo(0, 8);
      expect(controller.object.position.x).toBeCloseTo(1.4, 5);
      controller.move(new Vector3(), { epoch: 2 });
      expect(controller.object.position.x).toBeCloseTo(1.6, 5);
      platform.rotation.setFromEuler(0, Math.PI / 2, 0);
      const rotated = controller.move(new Vector3(), { epoch: 3 });
      expect(controller.object.position.x).toBeCloseTo(0.6, 5);
      expect(controller.object.position.z).toBeCloseTo(-1, 5);
      expect(rotated.supportYawDelta).toBeCloseTo(Math.PI / 2, 5);
      expect(controller.object.rotation.x).toBe(0);
      expect(controller.object.rotation.z).toBe(0);
      expect(controller.object.rotation.y).toBeCloseTo(Math.SQRT1_2, 5);
      expect(rotated.grounded).toBe(true);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('recovers onto a tilting walkable support without tilting the upright capsule', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    const controller = character(scene, new Vector3(1, 0.753, 0));
    try {
      controller.move(new Vector3());
      platform.rotation.setFromEuler(0, 0, 0.2);
      const result = controller.move(new Vector3());
      expect(result.unresolvedPenetration).toBe(false);
      expect(result.grounded).toBe(true);
      expect(result.support).toBe(platform);
      expect(controller.object.position.y).toBeGreaterThan(0.9);
      expect(controller.object.rotation.x).toBe(0);
      expect(controller.object.rotation.z).toBe(0);
      expect(
        scene.physics3D.canPlaceCapsule(
          controller.object,
          controller.object.collider as CapsuleCollider3D,
          controller.object.position,
          { ignore: controller.object },
        ),
      ).toBe(true);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('detaches a jump before inheriting changed support motion', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    const controller = character(scene);
    try {
      controller.move(new Vector3());
      platform.position.x = 1;
      const result = controller.move(new Vector3(0, 0.3, 0));
      expect(result.supportDetached).toBe('jump');
      expect(result.support).toBeUndefined();
      expect(result.grounded).toBe(false);
      expect(result.carriedDisplacement.length()).toBe(0);
      expect(controller.object.position.x).toBe(0);
      expect(result.displacement.y).toBeCloseTo(0.3, 5);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('rejects stale support generations, destruction and externally teleported rider anchors', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    const controller = character(scene);
    try {
      controller.move(new Vector3());
      scene.remove(platform);
      platform.position.x = 1;
      scene.add(platform);
      const readded = controller.move(new Vector3());
      expect(readded.supportDetached).toBe('removed');
      expect(readded.carriedDisplacement.length()).toBe(0);
      expect(controller.object.position.x).toBe(0);
      expect(readded.support).toBe(platform);
      controller.object.position.x = 10;
      const teleported = controller.move(new Vector3());
      expect(teleported.supportDetached).toBe('teleport');
      expect(teleported.support).toBeUndefined();
      expect(teleported.carriedDisplacement.length()).toBe(0);
      controller.object.position.x = 0;
      controller.move(new Vector3());
      platform.destroy();
      const destroyed = controller.move(new Vector3());
      expect(destroyed.supportDetached).toBe('removed');
      expect(destroyed.support).toBeUndefined();
      expect(destroyed.grounded).toBe(false);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('treats excessive support travel as teleport rather than sweeping the rider across the scene', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(1, 0.25, 1)),
      new Vector3(0, -0.25, 0),
    );
    const controller = character(scene, undefined, {
      maxSupportDisplacement: 2,
    });
    try {
      controller.move(new Vector3());
      platform.position.x = 10;
      const result = controller.move(new Vector3());
      expect(result.supportDetached).toBe('support-teleport');
      expect(result.support).toBeUndefined();
      expect(result.carriedDisplacement.length()).toBe(0);
      expect(controller.object.position.x).toBe(0);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('sweeps inherited motion into a wall and retains the free sliding component', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    solid(
      scene,
      new BoxCollider3D(new Vector3(0.1, 2, 3)),
      new Vector3(1, 2, 0),
    );
    const controller = character(scene, undefined, { stepHeight: 0 });
    try {
      controller.move(new Vector3());
      platform.position.x = 2;
      platform.position.z = 1;
      const result = controller.move(new Vector3());
      expect(result.carryBlocked).toBe(true);
      expect(result.blocked).toBe(true);
      expect(result.supportDisplacement.x).toBeCloseTo(2, 5);
      expect(result.carriedDisplacement.x).toBeLessThan(0.65);
      expect(controller.object.position.x).toBeLessThan(0.65);
      expect(controller.object.position.z).toBeCloseTo(1, 5);
      expect(result.contacts.some((hit) => hit.normal.x < -0.99)).toBe(true);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('does not recover a blocked lift through the ceiling after its sweep stops', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.1, 3)),
      new Vector3(0, 1.8, 0),
    );
    const controller = character(scene);
    try {
      controller.move(new Vector3());
      platform.position.y += 0.5;
      const result = controller.move(new Vector3());
      expect(result.carryBlocked).toBe(true);
      expect(controller.object.position.y + 0.75).toBeLessThan(1.7);
      expect(result.carriedDisplacement.y).toBeGreaterThan(0.18);
      expect(result.carriedDisplacement.y).toBeLessThan(0.2);
      expect(result.recoveryDisplacement.y).toBeCloseTo(0, 8);
      expect(result.supportDetached).toBe('blocked');
      expect(result.unresolvedPenetration).toBe(true);
      const stoppedY = controller.object.position.y;
      expect(() => controller.move(new Vector3())).toThrow(Error);
      expect(controller.object.position.y).toBe(stoppedY);
      platform.position.y -= 0.5;
      const resumed = controller.move(new Vector3(0, -0.4, 0));
      expect(resumed.unresolvedPenetration).toBe(false);
      expect(resumed.grounded).toBe(true);
      expect(resumed.support).toBe(platform);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('checks the rotating support arc instead of teleporting between its endpoints', () => {
    const scene = new Scene();
    const platform = solid(
      scene,
      new BoxCollider3D(new Vector3(3, 0.25, 3)),
      new Vector3(0, -0.25, 0),
    );
    solid(
      scene,
      new BoxCollider3D(new Vector3(0.12, 1, 0.12)),
      new Vector3(Math.SQRT2, 1, -Math.SQRT2),
    );
    const controller = character(scene, new Vector3(2, 0.753, 0), {
      stepHeight: 0,
    });
    try {
      controller.move(new Vector3());
      platform.rotation.setFromEuler(0, Math.PI / 2, 0);
      const result = controller.move(new Vector3());
      expect(result.carryBlocked).toBe(true);
      expect(result.contacts.some((hit) => hit.object !== platform)).toBe(true);
      expect(
        Math.hypot(
          controller.object.position.x,
          controller.object.position.z + 2,
        ),
      ).toBeGreaterThan(0.05);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });

  it('keeps feet fixed when crouching, retains a blocked capsule and stands after clearing the ceiling', () => {
    const scene = new Scene();
    solid(scene, new PlaneCollider3D());
    const controller = character(scene, undefined, { crouchHeight: 0.25 });
    try {
      controller.move(new Vector3());
      const feet = controller.object.position.y - 0.75;
      const crouched = controller.setStance('crouching');
      expect(crouched.changed).toBe(true);
      expect(controller.object.position.y - 0.375).toBeCloseTo(feet, 8);
      const capsule = controller.object.collider;
      const ceiling = solid(
        scene,
        new BoxCollider3D(new Vector3(2, 0.1, 2)),
        new Vector3(0, 1.15, 0),
      );
      const beforeY = controller.object.position.y;
      const rejected = controller.setStance('standing');
      expect(rejected.blocked).toBe(true);
      expect(rejected.changed).toBe(false);
      expect(rejected.stance).toBe('crouching');
      expect(controller.object.collider).toBe(capsule);
      expect(controller.object.position.y).toBe(beforeY);
      controller.move(new Vector3(3, -0.01, 0));
      const feetBeforeStanding = controller.object.position.y - 0.375;
      const standing = controller.setStance('standing');
      expect(standing.blocked).toBe(false);
      expect(standing.changed).toBe(true);
      expect(standing.stance).toBe('standing');
      expect(controller.object.position.y - 0.75).toBeCloseTo(
        feetBeforeStanding,
        5,
      );
      expect(scene.physics3D.has(ceiling)).toBe(true);
    } finally {
      controller.destroy();
      scene.destroy();
    }
  });
});
