import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';

// Player is represented by a box mesh. Movement is camera-relative when using chase camera.
// Collision: axis-by-axis swept AABB resolution against level platform Box3s.
export class Player {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.speed = options.speed ?? 8;
    this.jumpStrength = options.jumpStrength ?? 10;
    this.gravity = options.gravity ?? -30;
    this.playerSize = options.size ?? [1, 1, 1];
    this.mesh = this._createMesh();
    this.scene.add(this.mesh);

    // AABB collider (Box3) and debug helper
    this.collider = new THREE.Box3().setFromObject(this.mesh);
    this.helper = new ColliderHelper(this.collider, 0xff0000);
    this.scene.add(this.helper.mesh);

    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = false;
  }

  _createMesh() {
    const geo = new THREE.BoxGeometry(this.playerSize[0], this.playerSize[1], this.playerSize[2]);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff5555 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, 2, 8);
    m.castShadow = true;
    return m;
  }

  setPosition(vec3) {
    this.mesh.position.copy(vec3);
    this._updateCollider();
  }

  _updateCollider() {
    this.collider.setFromObject(this.mesh);
  }

  // movementDir: Vector3 - desired translation in world units (not velocity)
  // delta: seconds
  // platforms: array of meshes with userData.collider (Box3)
  moveAndCollide(movementDir, delta, platforms) {
    // movementDir is desired displacement (meters) over this frame (already multiplied by speed*delta)
    // We'll perform axis-by-axis swept resolution: X then Y then Z (order chosen for stability)
    const half = new THREE.Vector3(this.playerSize[0] / 2, this.playerSize[1] / 2, this.playerSize[2] / 2);

    const start = this.mesh.position.clone();
    const next = start.clone().add(movementDir);

    // We'll move axis-by-axis, testing collisions with platform Box3s
    const axes = ['x', 'y', 'z'];
    const pos = start.clone();

    for (const axis of axes) {
      pos[axis] = next[axis];

      // build temp box at pos
      const min = new THREE.Vector3(pos.x - half.x, pos.y - half.y, pos.z - half.z);
      const max = new THREE.Vector3(pos.x + half.x, pos.y + half.y, pos.z + half.z);
      const tempBox = new THREE.Box3(min, max);

      let collided = false;

      for (const plat of platforms) {
        const platBox = plat.userData.collider;
        if (!platBox) continue;
        if (tempBox.intersectsBox(platBox)) {
          collided = true;
          // Resolve overlap depending on axis direction
          if (axis === 'y') {
            if (movementDir.y > 0) {
              // moving up - push below platform
              pos.y = platBox.min.y - half.y - 0.0001;
              this.velocity.y = 0;
            } else {
              // moving down - land on top
              pos.y = platBox.max.y + half.y + 0.0001;
              this.velocity.y = 0;
              this.onGround = true;
            }
          } else if (axis === 'x') {
            if (movementDir.x > 0) {
              pos.x = platBox.min.x - half.x - 0.0001;
            } else {
              pos.x = platBox.max.x + half.x + 0.0001;
            }
            this.velocity.x = 0;
          } else if (axis === 'z') {
            if (movementDir.z > 0) {
              pos.z = platBox.min.z - half.z - 0.0001;
            } else {
              pos.z = platBox.max.z + half.z + 0.0001;
            }
            this.velocity.z = 0;
          }
          // after resolving one collider we break and continue axis loop (handles multiple colliders next axis)
          break;
        }
      }
      if (!collided && axis === 'y') {
        // if no collision on Y this frame, we're in air
        this.onGround = false;
      }
    }

    // write back final position
    this.mesh.position.copy(pos);
    this._updateCollider();
    this.helper.update();
  }

  // Update: compute movement from inputs and camera, then moveAndCollide
  // camForward, camRight: normalized vectors in world XZ-plane used to orient movement
  update(delta, input, cameraOrientation, platforms) {
    // cameraOrientation: { forward: Vector3 (y=0), right: Vector3 (y=0) } used to map WASD to world movement
    // input: an InputManager instance or object with keys: KeyW..KeyS.. etc.

    // Build desired movement in XZ
    const move = new THREE.Vector3();
    if (input.isKey('KeyW')) move.add(cameraOrientation.forward);
    if (input.isKey('KeyS')) move.sub(cameraOrientation.forward);
    if (input.isKey('KeyA')) move.sub(cameraOrientation.right);
    if (input.isKey('KeyD')) move.add(cameraOrientation.right);
    move.normalize();

    // Integrate horizontal velocity
    const horiz = move.multiplyScalar(this.speed * delta);
    // Apply gravity to velocity.y
    this.velocity.y += this.gravity * delta;

    // Jump
    if (input.isKey('Space') && this.onGround) {
      this.velocity.y = this.jumpStrength;
      this.onGround = false;
    }

    // Compose movement vector for this frame
    const movementThisFrame = new THREE.Vector3(horiz.x, this.velocity.y * delta, horiz.z);

    // Move & resolve collisions
    this.moveAndCollide(movementThisFrame, delta, platforms);
  }

  toggleHelperVisible(v) {
    this.helper.setVisible(v);
  }
}
