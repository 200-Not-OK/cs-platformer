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
    this._modelYawOffset = 0; // offset to align model forward with world forward
    this._turnLerp = 0.14; // smoothing for rotation to face camera
    // Animation
    this.mixer = null;
    this.actions = {
      idle: null,
      walk: null,
      jump: null,
    };
    this.currentAction = null;
    this._jumpPlaying = false;
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
  if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
    }
  }

  async _loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      //'src/assets/low_poly_school_boy_zombie_apocalypse_rigged/scene.gltf',
      'src/assets/low_poly_male/scene.gltf',
      //'src/assets/low_poly_female/scene.gltf',
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

  // Setup animations if present
  if (gltf.animations && gltf.animations.length > 0) {
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    const clips = gltf.animations;
    console.log('Player model animations:', clips.map(c => c.name));
    // helper to find by name (case-insensitive contains)
    const findClip = (names) => {
      if (!names) return null;
      for (const n of names) {
        const lower = n.toLowerCase();
        for (const c of clips) {
          if (c.name && c.name.toLowerCase().includes(lower)) return c;
        }
      }
      return null;
    };

  // try common names for idle/walk/jump
  // NOTE: Do NOT fallback to clips[0] for idle; if there's no explicit idle
  // animation we want the model to remain static when idle.
  const idleClip = findClip(['idle', 'stand', 'rest']) || null;
  const walkClip = findClip(['walk', 'run', 'strafe']) || clips[0] || null;
    const jumpClip = findClip(['jump', 'leap']) || clips[2] || null;

    if (idleClip) this.actions.idle = this.mixer.clipAction(idleClip);
    if (walkClip) this.actions.walk = this.mixer.clipAction(walkClip);
    if (jumpClip) this.actions.jump = this.mixer.clipAction(jumpClip);

    // Configure looping modes
    if (this.actions.idle) this.actions.idle.setLoop(THREE.LoopRepeat);
    if (this.actions.walk) this.actions.walk.setLoop(THREE.LoopRepeat);
    if (this.actions.jump) this.actions.jump.setLoop(THREE.LoopOnce); // play once

    // start idle by default
    if (this.actions.idle) {
      this.actions.idle.play();
      this.currentAction = this.actions.idle;
    }
  } else {
    console.warn('Player model has no animation clips');
  }
  // We keep a stable size-based collider; ensure helper matches
  // the computed size
  this._updateCollider();
  // Model previously had a 180° flip; remove that so forward aligns with camera forward
  this._modelYawOffset = 0;
  this.mesh.rotation.y = this._modelYawOffset;
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
    // Two-phase: handle horizontal movement first (prevent side penetration), then vertical + snapping
    const prevPos = this.mesh.position.clone();

    // Apply horizontal movement per-axis so we can slide along obstacles.
    const intersects = (a, b) => (
      a.min.x < b.max.x && a.max.x > b.min.x &&
      a.min.y < b.max.y && a.max.y > b.min.y &&
      a.min.z < b.max.z && a.max.z > b.min.z
    );

    // Try X axis
    if (movement.x !== 0) {
      this.mesh.position.x += movement.x;
      this._updateCollider();
      let collidedX = false;
      for (let i = 0; i < platforms.length; i++) {
        const platBox = platforms[i].userData.collider;
        if (intersects(this.collider, platBox)) { collidedX = true; break; }
      }
      if (collidedX) {
        // revert only X movement so we can slide along Z
        this.mesh.position.x = prevPos.x;
        this._updateCollider();
      }
    }

    // Try Z axis
    if (movement.z !== 0) {
      this.mesh.position.z += movement.z;
      this._updateCollider();
      let collidedZ = false;
      for (let i = 0; i < platforms.length; i++) {
        const platBox = platforms[i].userData.collider;
        if (intersects(this.collider, platBox)) { collidedZ = true; break; }
      }
      if (collidedZ) {
        // revert only Z movement so we can slide along X
        this.mesh.position.z = prevPos.z;
        this._updateCollider();
      }
    }

    // Apply vertical movement
    this.mesh.position.y += movement.y;
    this._updateCollider();

    // Determine the highest platform directly under the player (by XZ) regardless of velocity.
    const playerBottom = this.collider.min.y;
    let closestY = -Infinity;
    platforms.forEach(plat => {
      const platBox = plat.userData.collider;
      // require XZ overlap between player's horizontal footprint and platform
      const xOverlap = this.collider.max.x > platBox.min.x && this.collider.min.x < platBox.max.x;
      const zOverlap = this.collider.max.z > platBox.min.z && this.collider.min.z < platBox.max.z;
      if (xOverlap && zOverlap) {
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

    if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
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

    // When third-person camera is active (player control active), rotate the player to face camera forward
    if (active && cameraOrientation && cameraOrientation.forward) {
      const f = cameraOrientation.forward.clone();
      f.y = 0;
      if (f.lengthSq() > 1e-6) {
        f.normalize();
        let desiredYaw = Math.atan2(f.x, f.z) + (this._modelYawOffset || 0);
        let current = this.mesh.rotation.y || 0;
        let diff = desiredYaw - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.mesh.rotation.y = current + diff * this._turnLerp;
      }
    }

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

    // Update animations
    try {
      if (this.mixer) this.mixer.update(delta);
    } catch (e) {
      console.warn('Animation mixer update failed:', e);
    }

    // Determine which action should play: jump > walk > idle
    const moving = horiz.lengthSq() > 1e-6;

    // If we just started a jump (left ground and jump action exists), play jump
    if (!this.onGround && !this._jumpPlaying && this.actions.jump) {
      // play jump once and mark it playing; when finished we'll clear the flag
      this._playAction(this.actions.jump, 0.1, false);
      this._jumpPlaying = true;
      // ensure jump finisher resets to idle/walk when done
      const jumpAction = this.actions.jump;
      const onFinished = () => {
        this._jumpPlaying = false;
        jumpAction.getMixer().removeEventListener('finished', onFinished);
      };
      jumpAction.getMixer().addEventListener('finished', onFinished);
    }

    if (this._jumpPlaying) return; // let jump animation play through

    if (moving) {
      if (this.actions.walk && this.currentAction !== this.actions.walk) {
        this._playAction(this.actions.walk, 0.15, true);
      }
    } else {
      // Not moving: if we have an idle action, play it. Otherwise, stop any
      // walk action so the model becomes static.
      if (this.actions.idle) {
        if (this.currentAction !== this.actions.idle) {
          this._playAction(this.actions.idle, 0.2, true);
        }
      } else {
        // No idle animation available — fade out the walk animation if it's playing
        if (this.currentAction && this.currentAction === this.actions.walk) {
          try {
            // fade out gracefully
            this.currentAction.fadeOut(0.2);
          } catch (e) {
            // fallback: stop immediately
            try { this.currentAction.stop(); } catch (e2) { /* ignore */ }
          }
          this.currentAction = null;
        }
      }
    }
  }

  _playAction(action, fadeDuration = 0.2, loop = true) {
    if (!action) return;
    try {
      if (this.currentAction && this.currentAction !== action) {
        this.currentAction.crossFadeTo(action, fadeDuration, false);
      }
      action.reset();
      if (loop) action.setLoop(THREE.LoopRepeat);
      action.play();
      this.currentAction = action;
    } catch (e) {
      console.warn('Failed to play action:', e);
    }
  }

  toggleHelperVisible(visible) {
    this.helper.setVisible(visible);
  }
}
