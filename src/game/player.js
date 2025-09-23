import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.speed = options.speed ?? 8;
    this.jumpStrength = options.jumpStrength ?? 10;
    this.gravity = options.gravity ?? -30;
    this.size = options.size ?? [1, 1, 1];
    this.mesh = new THREE.Group(); // placeholder until model loads
    this.scene.add(this.mesh);
    this.collider = new THREE.Box3();
    this.helper = new ColliderHelper(this.collider, 0xff0000);
    this.scene.add(this.helper.mesh);
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this._airTime = 0; // time spent not snapping to ground
    this._airThreshold = 0.08; // seconds before considered truly in air
    this._loadModel();
  }

  // Helper: Raycast down from player center to find the highest platform below
  snapToGround(platforms) {
    this._updateCollider();
    const rayOrigin = new THREE.Vector3(
      this.mesh.position.x,
      this.collider.max.y + 0.01,
      this.mesh.position.z
    );
    let highestY = -Infinity;
    platforms.forEach(plat => {
      const platBox = plat.userData.collider;
      if (
        rayOrigin.x >= platBox.min.x && rayOrigin.x <= platBox.max.x &&
        rayOrigin.z >= platBox.min.z && rayOrigin.z <= platBox.max.z
      ) {
        if (platBox.max.y > highestY && platBox.max.y <= rayOrigin.y) {
          highestY = platBox.max.y;
        }
      }
    });
    if (highestY > -Infinity) {
      // Move player so bottom of collider sits on platform
      const playerHeight = this.collider.max.y - this.collider.min.y;
      this.mesh.position.y = highestY + playerHeight / 2;
      this._updateCollider();
      if (this.helper) this.helper.update();
    }
  }

  async _loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'src/assets/low_poly_school_boy_zombie_apocalypse_rigged/scene.gltf',
      (gltf) => {
        // Remove placeholder children
        while (this.mesh.children.length > 0) {
          this.mesh.remove(this.mesh.children[0]);
        }
  // Compute bounding box for the whole scene
  const bbox = new THREE.Box3().setFromObject(gltf.scene);
  // Set player size to bounding box size for physics
  const sizeVec = new THREE.Vector3();
  bbox.getSize(sizeVec);
  this.size = [sizeVec.x, sizeVec.y, sizeVec.z];
  // Center horizontally
  const centerX = (bbox.max.x + bbox.min.x) / 2;
  const centerZ = (bbox.max.z + bbox.min.z) / 2;
  gltf.scene.position.x -= centerX;
  gltf.scene.position.z -= centerZ;
  // Center vertically: move model so its center is at y=0. This makes
  // `this.mesh.position` represent the collider/model center and avoids
  // a half-height visual offset where feet appear at the collider center.
  const centerY = (bbox.max.y + bbox.min.y) / 2;
  gltf.scene.position.y -= centerY;
  this.mesh.add(gltf.scene);
  // We keep a stable size-based collider; ensure helper matches
  // the computed size
  this._updateCollider();
  this.mesh.rotation.y = Math.PI;
  this.mesh.scale.set(1, 1, 1);
  this.mesh.castShadow = true;
  this.helper.update();
      },
      undefined,
      (error) => {
        console.error('Error loading player model:', error);
      }
    );
  }

  _updateCollider() {
    // Use a stable collider computed from the known size and mesh.position.
    // This avoids per-frame fluctuations from skinned/animated models
    // which can change the bounding box slightly and cause snap-hover loops.
    const sizeVec = new THREE.Vector3(this.size[0], this.size[1], this.size[2]);
    const half = sizeVec.clone().multiplyScalar(0.5);
    const center = new THREE.Vector3().copy(this.mesh.position);
    // If the model was offset during load (we moved feet to y=0), the mesh.position
    // is treated as the collider center already (setPosition uses collider center).
    this.collider.min.copy(center).sub(half);
    this.collider.max.copy(center).add(half);
  }

  setPosition(vec3) {
  // Interpret incoming position as the feet/bottom position for spawning.
  // Many level `startPosition` values are easier to reason about as the
  // player's foot placement. Convert to collider center using known size.
  const halfHeight = (this.size && this.size[1]) ? this.size[1] / 2 : 0.5;
  this.mesh.position.set(vec3.x, vec3.y + halfHeight, vec3.z);
  this._updateCollider();
  }

  moveAndCollide(movement, platforms, delta = 0) {
    // Only handle vertical movement and snap to ground/platform
    this.mesh.position.add(movement);
    this._updateCollider();

    // Determine the highest platform directly under the player (by XZ) regardless of velocity.
    const playerBottom = this.collider.min.y;
    let closestY = -Infinity;
    platforms.forEach(plat => {
      const platBox = plat.userData.collider;
      if (
        this.mesh.position.x >= platBox.min.x && this.mesh.position.x <= platBox.max.x &&
        this.mesh.position.z >= platBox.min.z && this.mesh.position.z <= platBox.max.z
      ) {
        if (platBox.max.y > closestY) closestY = platBox.max.y;
      }
    });

  const landThreshold = 0.06; // how close (in world units) bottom must be to platform top to land
    const penetrationAllowance = 0.01; // small allowance for penetration correction
  let snapped = false;
    if (closestY > -Infinity) {
      // distance from player's bottom to platform top
      const distance = playerBottom - closestY;

      if (distance < -penetrationAllowance) {
        // penetrating platform from below; move player up to sit on top
        const playerHeight = this.collider.max.y - this.collider.min.y;
        this.mesh.position.y = closestY + playerHeight / 2;
        this._updateCollider();
        this.velocity.y = 0;
        this.onGround = true;
        snapped = true;
      } else if (distance <= landThreshold) {
        // close enough to consider landed — snap and zero vertical velocity
        const playerHeight = this.collider.max.y - this.collider.min.y;
        this.mesh.position.y = closestY + playerHeight / 2;
        this._updateCollider();
        this.velocity.y = 0;
        this.onGround = true;
        snapped = true;
      } else {
        // sufficiently above platform: in the air
        // don't immediately mark as not-grounded; start air timer
        // we'll only clear onGround if the player has been in the air for long enough
        this._airTime += delta;
        if (this._airTime >= this._airThreshold) this.onGround = false;
      }
    } else {
      // no platform under player
      this._airTime += delta;
      if (this._airTime >= this._airThreshold) this.onGround = false;
    }

    // reset air timer when snapped
    if (snapped) this._airTime = 0;

    if (this.helper) this.helper.update();
  }

  // delta = seconds, input = InputManager, cameraOrientation = { forward, right }
  update(delta, input, cameraOrientation, platforms, active = true) {
    if (!active) return; // do not move player if free cam

    const move = new THREE.Vector3();
    if (input.isKey('KeyW')) move.add(cameraOrientation.forward);
    if (input.isKey('KeyS')) move.sub(cameraOrientation.forward);
    if (input.isKey('KeyA')) move.sub(cameraOrientation.right);
    if (input.isKey('KeyD')) move.add(cameraOrientation.right);
    move.normalize();

    const horiz = move.multiplyScalar(this.speed * delta);

    // Only apply gravity if not on ground
    if (!this.onGround) {
      this.velocity.y += this.gravity * delta;
    } else {
      this.velocity.y = 0;
    }

    // Jump
    if (input.isKey('Space') && this.onGround) {
      this.velocity.y = this.jumpStrength;
      this.onGround = false;
    }

    const movementThisFrame = new THREE.Vector3(horiz.x, this.velocity.y * delta, horiz.z);
    this.moveAndCollide(movementThisFrame, platforms, delta);
  }

  toggleHelperVisible(visible) {
    this.helper.setVisible(visible);
  }
}
