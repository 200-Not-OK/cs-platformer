import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { resolveMovement, meshesToColliders, enableDebug } from './collisionSystem.js';

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
    // Collider size (may differ from visual model size): same height, half x/z
    this.colliderSize = [this.size[0] * 0.5, this.size[1], this.size[2] * 0.5];
    this.scene.add(this.helper.mesh);
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this._airTime = 0; // time spent not snapping to ground
    this._airThreshold = 0.08; // seconds before considered truly in air
    // ground grace: short time window to keep ground contact after transient lateral nudges
    this._lastGround = null; // previously stood-on platform Box3
    this._lastGroundY = -Infinity;
    this._groundGrace = 0.12; // seconds
    this._groundGraceRemaining = 0;
    this._modelYawOffset = 0; // offset to align model forward with world forward
    this._turnLerp = 0.14; // smoothing for rotation to face camera
  // Sprinting
  this.sprintMultiplier = options.sprintMultiplier ?? 1.6; // speed factor while holding Shift
  this.isSprinting = false;
    // Animation
    this.mixer = null;
    this.actions = {
      idle: null,
      walk: null,
      jump: null,
    };
    this.currentAction = null;
    this._jumpPlaying = false;
    // Horizontal movement smoothing
    this._hVelocity = new THREE.Vector3(); // horizontal velocity (x,z)
    this._hAccel = options.hAcceleration ?? 40; // units per second^2-ish smoothing factor
    // debug flag (can be toggled from game via window.__collisionDebugOn)
    //this.debug = (typeof window !== 'undefined' && !!window.__collisionDebugOn) || false;
    this._loadModel();
  }

  _loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'src/assets/low_poly_male/scene.gltf',
      (gltf) => {
        // Remove placeholder children
        while (this.mesh.children.length > 0) this.mesh.remove(this.mesh.children[0]);

        // Compute bounding box for the whole scene
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        this.size = [sizeVec.x, sizeVec.y, sizeVec.z];
        // collider: same height, narrower x/z
        this.colliderSize = [sizeVec.x * 0.2, sizeVec.y, sizeVec.z * 0.5];

        // center model horizontally/vertically
        const centerX = (bbox.max.x + bbox.min.x) / 2;
        const centerZ = (bbox.max.z + bbox.min.z) / 2;
        const centerY = (bbox.max.y + bbox.min.y) / 2;
        gltf.scene.position.x -= centerX;
        gltf.scene.position.z -= centerZ;
        gltf.scene.position.y -= centerY;
        this.mesh.add(gltf.scene);

        // animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          const clips = gltf.animations;
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
          const idleClip = findClip(['idle', 'stand', 'rest']) || null;
          const walkClip = findClip(['walk', 'run', 'strafe']) || clips[0] || null;
          const jumpClip = findClip(['jump', 'leap']) || null;
          if (idleClip) this.actions.idle = this.mixer.clipAction(idleClip);
          if (walkClip) this.actions.walk = this.mixer.clipAction(walkClip);
          if (jumpClip) this.actions.jump = this.mixer.clipAction(jumpClip);
          if (this.actions.idle) this.actions.idle.setLoop(THREE.LoopRepeat);
          if (this.actions.walk) this.actions.walk.setLoop(THREE.LoopRepeat);
          if (this.actions.jump) this.actions.jump.setLoop(THREE.LoopOnce);
          if (this.actions.idle) { this.actions.idle.play(); this.currentAction = this.actions.idle; }
        }

        // update collider/helper
        this._updateCollider();
        if (this.helper) this.helper.update();
      },
      undefined,
      (err) => console.error('Error loading player model:', err)
    );
  }

    // Recompute this.collider from current mesh.position and this.colliderSize
    _updateCollider() {
      const half = new THREE.Vector3(
        (this.colliderSize[0] ?? 1) * 0.5,
        (this.colliderSize[1] ?? 1) * 0.5,
        (this.colliderSize[2] ?? 1) * 0.5
      );
      const center = this.mesh.position.clone();
      this.collider.min.copy(center).sub(half);
      this.collider.max.copy(center).add(half);
    }

    // Set the visual/physical position of the player. Accepts a THREE.Vector3.
    // This sets the mesh position directly and updates the collider/helper.
    setPosition(vec3) {
      if (!vec3 || !vec3.isVector3) return;
      this.mesh.position.copy(vec3);
      this._updateCollider();
      if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
    }

    // Update collider size (array [x,y,z]) and refresh helper
    setColliderSize(sizeArr) {
      if (!sizeArr || sizeArr.length < 3) return;
      this.colliderSize = [sizeArr[0], sizeArr[1], sizeArr[2]];
      this._updateCollider();
      if (this.helper) this.helper.update();
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
    let closestPlatBox = null;
    platforms.forEach(plat => {
      const platBox = plat.userData.collider;
      // require XZ overlap between player's horizontal footprint and platform
      const xOverlap = this.collider.max.x > platBox.min.x && this.collider.min.x < platBox.max.x;
      const zOverlap = this.collider.max.z > platBox.min.z && this.collider.min.z < platBox.max.z;
      if (xOverlap && zOverlap) {
        if (platBox.max.y > closestY) {
          closestY = platBox.max.y;
          closestPlatBox = platBox;
        }
      }
    });

    const landThreshold = 0.06; // how close (in world units) bottom must be to platform top to land
    const penetrationAllowance = 0.01; // small allowance for penetration correction
    let snapped = false;
    if (closestY > -Infinity && closestPlatBox) {
      // distance from player's bottom to platform top
      const distance = playerBottom - closestY;
      // compute previous bottom (before movement) to determine where we came from
      const playerHeight = (this.size && this.size[1]) ? this.size[1] : (this.collider.max.y - this.collider.min.y);
      const prevBottom = prevPos.y - playerHeight / 2;

      // Only snap to the top if the player was previously at or above the platform top
      // (i.e., we're landing or slightly penetrating from above). This prevents
      // teleporting the player to the top when they're coming from underneath.
      if (prevBottom >= closestY - landThreshold) {
        if (distance <= landThreshold) {
          // close enough to consider landed — snap and zero vertical velocity
          this.mesh.position.y = closestY + playerHeight / 2;
          this._updateCollider();
          this.velocity.y = 0;
          this.onGround = true;
          snapped = true;
        } else if (distance < -penetrationAllowance) {
          // penetrating from above (rare): correct by moving player up
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
        // We were previously below the platform — do NOT teleport to top.
        // If we are intersecting the platform from below (hitting its underside),
        // push the player slightly downward to just below the platform bottom to
        // prevent getting stuck inside it.
        const playerTop = this.collider.max.y;
        const platBottom = closestPlatBox.min.y;
        if (playerTop > platBottom) {
          // move player so their top sits just below the platform bottom
          this.mesh.position.y = platBottom - playerHeight / 2 - penetrationAllowance;
          this._updateCollider();
          // cancel upward velocity so they don't immediately re-penetrate
          if (this.velocity.y > 0) this.velocity.y = 0;
          this.onGround = false;
        } else {
          // not intersecting vertically — still in the air
          this._airTime += delta;
          if (this._airTime >= this._airThreshold) this.onGround = false;
        }
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

  // Per-frame update called from Game._loop
  update(delta, input, camOrientation = null, platforms = [], playerActive = true) {
    // decay ground-grace timer
    this._groundGraceRemaining = Math.max(0, (this._groundGraceRemaining || 0) - (delta || 0));

    // Read input to form desired horizontal movement in camera space
    let moveForward = 0;
    let moveRight = 0;
    if (input && input.isKey) {
      if (input.isKey('KeyW')) moveForward += 1;
      if (input.isKey('KeyS')) moveForward -= 1;
      if (input.isKey('KeyD')) moveRight += 1;
      if (input.isKey('KeyA')) moveRight -= 1;
    }

    // Build world-space horizontal target velocity
    const targetVel = new THREE.Vector3(0, 0, 0);
    if (playerActive && (moveForward !== 0 || moveRight !== 0)) {
      // camOrientation is expected to provide forward and right vectors
      const f = camOrientation?.forward ? new THREE.Vector3(camOrientation.forward.x, 0, camOrientation.forward.z).normalize() : new THREE.Vector3(0, 0, -1);
      const r = camOrientation?.right ? new THREE.Vector3(camOrientation.right.x, 0, camOrientation.right.z).normalize() : new THREE.Vector3(1, 0, 0);
      targetVel.addScaledVector(f, moveForward);
      targetVel.addScaledVector(r, moveRight);
      // Sprint if Shift is held
      const sprint = (input && input.isKey) ? (input.isKey('ShiftLeft') || input.isKey('ShiftRight')) : false;
      this.isSprinting = sprint;
      const speedScale = sprint ? this.sprintMultiplier : 1;
      if (targetVel.lengthSq() > 0) targetVel.normalize().multiplyScalar(this.speed * speedScale);
    }

    // Smooth horizontal velocity (_hVelocity holds x/z components)
    const currH = new THREE.Vector3(this._hVelocity.x, 0, this._hVelocity.z);
    const dv = targetVel.clone().sub(currH);
    const maxDelta = this._hAccel * delta;
    if (dv.length() > maxDelta) dv.setLength(maxDelta);
    currH.add(dv);
    this._hVelocity.x = currH.x; this._hVelocity.z = currH.z;

    // Apply gravity (vertical velocity in this.velocity.y)
    if (!this.onGround) {
      this.velocity.y += this.gravity * delta;
    } else {
      // keep vertical velocity non-positive on ground
      this.velocity.y = Math.min(0, this.velocity.y);
    }

    // Jump (allow jump during short ground-grace window)
    if (input && input.isKey && input.isKey('Space') && (this.onGround || this._groundGraceRemaining > 0)) {
      this.velocity.y = this.jumpStrength;
      this.onGround = false;
      this._groundGraceRemaining = 0;
    }

    // Compose movement for this frame (units = world units)
    const movementThisFrame = new THREE.Vector3(this._hVelocity.x * delta, this.velocity.y * delta, this._hVelocity.z * delta);
    // Use central resolver: convert platform meshes to Box3 colliders and call resolveMovement
    const colliders = meshesToColliders(platforms || []);
    // compute previous bottom Y from current collider size/position
    const size = new THREE.Vector3();
    this.collider.getSize(size);
    const prevBottomY = this.mesh.position.y - (size.y * 0.5);
    if (this.debug) {
      try { enableDebug(this.scene); } catch (e) { /* ignore if already enabled */ }
    }
    const res = resolveMovement(this.collider.clone(), movementThisFrame, colliders, { prevBottomY, landThreshold: 0.06, penetrationAllowance: 0.01, minVerticalOverlap: 0.02, debug: this.debug });

    // Apply the resolved offset to the player
    this.mesh.position.add(res.offset);
    this._updateCollider();

    // Update on-ground and velocity state per resolver result
    if (res.onGround) {
      this.onGround = true;
      this.velocity.y = 0;
      this._airTime = 0;
      if (res.groundCollider) {
        this._lastGround = res.groundCollider;
        this._lastGroundY = res.groundCollider.max.y;
        this._groundGraceRemaining = this._groundGrace;
      }
    } else {
      // if we collided with an underside and were moving upward, cancel upward velocity
      if (res.collided && this.velocity.y > 0) this.velocity.y = 0;
      this._airTime += delta;
      if (this._airTime >= this._airThreshold) this.onGround = false;
    }

    // Update animations
    try {
      if (this.mixer) this.mixer.update(delta);
    } catch (e) {
      console.warn('Animation mixer update failed:', e);
    }

    // Determine which action should play: jump > walk > idle
    const moving = (this._hVelocity.x * this._hVelocity.x + this._hVelocity.z * this._hVelocity.z) > 1e-6;

    // If we just started a jump (left ground and jump action exists), play jump
    if (!this.onGround && !this._jumpPlaying && this.actions.jump) {
      this._playAction(this.actions.jump, 0.1, false);
      this._jumpPlaying = true;
      const jumpAction = this.actions.jump;
      const onFinished = () => {
        this._jumpPlaying = false;
        try { jumpAction.getMixer().removeEventListener('finished', onFinished); } catch (e) { /* ignore */ }
      };
      try { jumpAction.getMixer().addEventListener('finished', onFinished); } catch (e) { /* ignore */ }
    }

    if (this._jumpPlaying) return;

    if (moving) {
      if (this.actions.walk && this.currentAction !== this.actions.walk) {
        this._playAction(this.actions.walk, 0.15, true);
      }
      // rotate model to face horizontal velocity
      const dir = new THREE.Vector3(this._hVelocity.x, 0, this._hVelocity.z);
      if (dir.lengthSq() > 1e-6) {
        const desiredYaw = Math.atan2(dir.x, dir.z);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, desiredYaw + (this._modelYawOffset || 0), this._turnLerp || 0.14);
        if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
      }
    } else {
      if (this.actions.idle) {
        if (this.currentAction !== this.actions.idle) {
          this._playAction(this.actions.idle, 0.2, true);
        }
      } else {
        if (this.currentAction && this.currentAction === this.actions.walk) {
          try { this.currentAction.fadeOut(0.2); } catch (e) { try { this.currentAction.stop(); } catch (e2) {} }
          this.currentAction = null;
        }
      }
    }
  }
}
