import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { resolveMovement, meshesToColliders } from './collisionSystem.js';

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

    // advance/decay ground-grace timer
    this._groundGraceRemaining = Math.max(0, (this._groundGraceRemaining || 0) - (delta || 0));

    // Remember the platform (if any) directly under the player before movement.
    // This helps when a side collision during horizontal movement briefly
    // breaks XZ overlap and would otherwise make us lose ground contact.
    const playerHeight = (this.size && this.size[1]) ? this.size[1] : (this.collider.max.y - this.collider.min.y);
    const halfSize = new THREE.Vector3(this.colliderSize[0] * 0.5, this.colliderSize[1] * 0.5, this.colliderSize[2] * 0.5);
    const prevCenter = prevPos.clone();
    const prevMin = prevCenter.clone().sub(halfSize);
    const prevMax = prevCenter.clone().add(halfSize);
    let prevClosestY = -Infinity;
    let prevClosestPlatBox = null;
    // Allow a small tolerance for XZ overlap so tiny separations caused by
    // side-collisions don't immediately drop our remembered platform.
    const XZ_TOLERANCE = 0.04; // units
    for (const plat of platforms) {
      const p = plat.userData.collider;
      const overlapX = Math.min(prevMax.x, p.max.x) - Math.max(prevMin.x, p.min.x);
      const overlapZ = Math.min(prevMax.z, p.max.z) - Math.max(prevMin.z, p.min.z);
      const xOverlap = overlapX > -XZ_TOLERANCE;
      const zOverlap = overlapZ > -XZ_TOLERANCE;
      if (xOverlap && zOverlap) {
        if (p.max.y > prevClosestY) {
          prevClosestY = p.max.y;
          prevClosestPlatBox = p;
        }
      }
    }

    // Use the centralized resolver: convert platforms to colliders and resolve movement
    const colliders = meshesToColliders(platforms);
    const prevBottomY = prevPos.y - playerHeight / 2;
    const resolverResult = resolveMovement(this.collider.clone(), movement.clone(), colliders, {
      prevBottomY,
      landThreshold: 0.06,
      penetrationAllowance: 0.01
    });

    // Apply resolved offset to the player's mesh
    this.mesh.position.add(resolverResult.offset);
    this._updateCollider();

    // If there was a horizontal collision (resolver reported collidedWith and horizontal movement non-zero),
    // refresh ground grace so short lateral collisions don't drop ground contact.
    if (resolverResult.collidedWith && (movement.x !== 0 || movement.z !== 0)) {
      this._groundGraceRemaining = this._groundGrace;
    }

  // Determine the highest platform directly under the player (by XZ) regardless of velocity.
    const playerBottom = this.collider.min.y;
    let closestY = -Infinity;
    let closestPlatBox = null;
    const XZ_TOLERANCE_CUR = 0.04; // same tolerance for current detection
    platforms.forEach(plat => {
      const platBox = plat.userData.collider;
      // compute numeric overlaps and accept tiny negative overlaps within tolerance
      const overlapX = Math.min(this.collider.max.x, platBox.max.x) - Math.max(this.collider.min.x, platBox.min.x);
      const overlapZ = Math.min(this.collider.max.z, platBox.max.z) - Math.max(this.collider.min.z, platBox.min.z);
      const xOverlap = overlapX > -XZ_TOLERANCE_CUR;
      const zOverlap = overlapZ > -XZ_TOLERANCE_CUR;
      if (xOverlap && zOverlap) {
        if (platBox.max.y > closestY) {
          closestY = platBox.max.y;
          closestPlatBox = platBox;
        }
      }
    });

    // If we lost XZ overlap due to a lateral collision, prefer the platform that
    // was under us before movement if it was actually the one we were standing on.
    // Also allow a short grace window where we keep the previously-known ground
    // to avoid multi-frame jitter causing us to fall through platforms.
    const prevBottom = prevPos.y - playerHeight / 2;
    if (!closestPlatBox) {
      const preferPrev = prevClosestPlatBox && prevBottom >= prevClosestY - 0.06;
      const preferLast = this._lastGround && this._groundGraceRemaining > 0 && this._lastGroundY > -Infinity;
      if (preferPrev) {
        closestPlatBox = prevClosestPlatBox;
        closestY = prevClosestY;
      } else if (preferLast) {
        closestPlatBox = this._lastGround;
        closestY = this._lastGroundY;
      }
    }

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
          // remember this platform as last ground and reset grace timer
          this._lastGround = closestPlatBox;
          this._lastGroundY = closestY;
          this._groundGraceRemaining = this._groundGrace;
        } else if (distance < -penetrationAllowance) {
          // penetrating from above (rare): correct by moving player up
          this.mesh.position.y = closestY + playerHeight / 2;
          this._updateCollider();
          this.velocity.y = 0;
          this.onGround = true;
          snapped = true;
          // remember this platform as last ground and reset grace timer
          this._lastGround = closestPlatBox;
          this._lastGroundY = closestY;
          this._groundGraceRemaining = this._groundGrace;
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
      // keep last ground briefly if within grace window
      if (this._lastGround && this._groundGraceRemaining > 0) {
        // snap back to last ground if within reasonable vertical distance
        const distanceToLast = playerBottom - this._lastGroundY;
        if (Math.abs(distanceToLast) <= landThreshold + 0.1) {
          this.mesh.position.y = this._lastGroundY + playerHeight / 2;
          this._updateCollider();
          this.velocity.y = 0;
          this.onGround = true;
          snapped = true;
        } else {
          this._airTime += delta;
          if (this._airTime >= this._airThreshold) this.onGround = false;
        }
      } else {
        this._airTime += delta;
        if (this._airTime >= this._airThreshold) this.onGround = false;
      }
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

  // Desired horizontal displacement for this frame (without smoothing)
  const desired = move.clone().multiplyScalar(this.speed);

  // Smooth horizontal velocity: accelerate _hVelocity towards desired
  // using a simple critically-damped style update: v += (desired - v) * (1 - exp(-k*dt))
  const k = Math.max(0.0, this._hAccel);
  const lerpFactor = 1 - Math.exp(-k * delta);
  this._hVelocity.lerp(desired, lerpFactor);
  // displacement this frame
  const horiz = this._hVelocity.clone().multiplyScalar(delta);

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
  // Determine moving state based on smoothed horizontal velocity magnitude
  const moving = this._hVelocity.lengthSq() > 1e-6;

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
