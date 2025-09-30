import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ColliderHelper } from './colliderHelper.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.speed = options.speed ?? 8;
    this.jumpStrength = options.jumpStrength ?? 10;
    this.size = options.size ?? [1, 1, 1];
    this.mesh = new THREE.Group(); // placeholder until model loads
    this.scene.add(this.mesh);
    
    // Physics body
    this.body = null;
    this._createPhysicsBody();
    
    // Collision helper for debugging
    this.collider = new THREE.Box3();
    this.helper = new ColliderHelper(this.collider, 0xff0000);
    this.colliderSize = [this.size[0] * 0.5, this.size[1], this.size[2] * 0.5];
    this.scene.add(this.helper.mesh);
    
    // Movement state
    this.onGround = false;
    this._lastGroundCheck = 0;
    this._groundCheckInterval = 0.1; // Check ground every 100ms
    
    // Sprinting
    this.sprintMultiplier = options.sprintMultiplier ?? 1.6;
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
    
    // Debug flag
    this.debug = (typeof window !== 'undefined' && !!window.__collisionDebugOn) || false;
    
    // Health for compatibility
    this.health = options.health ?? 100;
    
    this._loadModel();
  }

  _createPhysicsBody() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
    }
    
    this.body = this.physicsWorld.createPlayerBody(this.mesh.position);
    console.log('🤖 Player physics body created:', this.body ? 'SUCCESS' : 'FAILED');
    console.log('⚖️ Body mass:', this.body?.mass);
    console.log('📍 Initial position:', this.body?.position);
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
        this.colliderSize = [sizeVec.x * 0.3, sizeVec.y, sizeVec.z * 0.5];

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
    if (!this.body) return;
    
    // Debug gravity - log Y velocity every second
    if (!this._gravityDebugTimer) this._gravityDebugTimer = 0;
    this._gravityDebugTimer += delta;
    if (this._gravityDebugTimer >= 1.0) {
      console.log('🌍 Gravity check:', {
        yVelocity: this.body.velocity.y,
        yPosition: this.body.position.y,
        worldGravity: this.physicsWorld.world.gravity,
        bodyMass: this.body.mass,
        bodyType: this.body.type
      });
      this._gravityDebugTimer = 0;
    }
    
    // Check if grounded
    this._lastGroundCheck += delta;
    if (this._lastGroundCheck >= this._groundCheckInterval) {
      this.onGround = this.physicsWorld.isGrounded(this.body, 0.2);
      this._lastGroundCheck = 0;
    }

    // Read input to form desired horizontal movement
    let moveForward = 0;
    let moveRight = 0;
    if (input && input.isKey) {
      if (input.isKey('KeyW')) moveForward += 1;
      if (input.isKey('KeyS')) moveForward -= 1;
      if (input.isKey('KeyD')) moveRight += 1;
      if (input.isKey('KeyA')) moveRight -= 1;
    }

    // Apply movement forces in world space
    if (playerActive && (moveForward !== 0 || moveRight !== 0)) {
      // Build world-space movement direction
      const f = camOrientation?.forward ? new THREE.Vector3(camOrientation.forward.x, 0, camOrientation.forward.z).normalize() : new THREE.Vector3(0, 0, -1);
      const r = camOrientation?.right ? new THREE.Vector3(camOrientation.right.x, 0, camOrientation.right.z).normalize() : new THREE.Vector3(1, 0, 0);
      
      const moveDirection = new THREE.Vector3();
      moveDirection.addScaledVector(f, moveForward);
      moveDirection.addScaledVector(r, moveRight);
      
      if (moveDirection.lengthSq() > 0) {
        // IMPORTANT: Normalize the direction BEFORE scaling
        moveDirection.normalize();
        
        // Check if sprinting
        const sprint = (input && input.isKey) ? (input.isKey('ShiftLeft') || input.isKey('ShiftRight')) : false;
        this.isSprinting = sprint;
        const speedScale = sprint ? this.sprintMultiplier : 1;
        
        // Use direct velocity manipulation instead of forces for immediate response
        const targetSpeed = this.speed * speedScale;
        const targetVelocity = moveDirection.clone().multiplyScalar(targetSpeed);
        
        // Store previous velocity for comparison
        const prevVel = {x: this.body.velocity.x, y: this.body.velocity.y, z: this.body.velocity.z};
        
        // Apply velocity directly but preserve Y velocity (gravity)
        this.body.velocity.x = targetVelocity.x;
        this.body.velocity.z = targetVelocity.z;
        // Keep existing Y velocity for gravity/jumping
        
        // Wake up the body to ensure it moves
        this.body.wakeUp();
        
        // Force the body to be awake
        this.body.sleepState = 0; // AWAKE
        
        console.log('🎮 Player movement (velocity-based):', {
          moveForward,
          moveRight,
          normalizedDirection: moveDirection,
          targetVelocity: targetVelocity,
          prevVelocity: prevVel,
          newVelocity: this.body.velocity,
          position: this.body.position,
          bodyType: this.body.type,
          bodyMass: this.body.mass,
          sleepState: this.body.sleepState,
          allowSleep: this.body.allowSleep
        });
      }
    } else {
      // Apply damping when no input - preserve Y velocity
      this.body.velocity.x *= 0.8;
      this.body.velocity.z *= 0.8;
    }

    // Jump
    if (input && input.isKey && input.isKey('Space') && this.onGround) {
      this.body.applyImpulse(new CANNON.Vec3(0, this.jumpStrength, 0));
      this.onGround = false;
    }

    // Sync Three.js mesh with physics body
    if (this.body) {
      // Store previous position for comparison
      const prevPos = this.mesh.position.clone();
      
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
      
      // Debug position sync every 60 frames
      if (!this._syncDebugCounter) this._syncDebugCounter = 0;
      this._syncDebugCounter++;
      if (this._syncDebugCounter % 60 === 0) {
        console.log('🔄 Position sync:', {
          meshPos: this.mesh.position,
          bodyPos: this.body.position,
          posChanged: !prevPos.equals(this.mesh.position),
          bodyVel: this.body.velocity
        });
      }
    }
    
    // Update collider for debug visualization
    this._updateCollider();
    if (this.helper) this.helper.update();

    // Handle animations
    this._updateAnimations(moveForward, moveRight, playerActive);

    // Update animation mixer
    if (this.mixer) this.mixer.update(delta);
  }

  _updateAnimations(moveForward, moveRight, playerActive) {
    const isMoving = playerActive && (moveForward !== 0 || moveRight !== 0);
    
    // Determine which animation to play
    let targetAction = null;
    if (!this.onGround && this.actions.jump && !this._jumpPlaying) {
      targetAction = this.actions.jump;
      this._jumpPlaying = true;
      
      // Reset jump animation when landing
      if (this.onGround) {
        this._jumpPlaying = false;
      }
    } else if (isMoving && this.actions.walk) {
      targetAction = this.actions.walk;
    } else if (this.actions.idle) {
      targetAction = this.actions.idle;
    }

    // Switch animation if needed
    if (targetAction && targetAction !== this.currentAction) {
      if (this.currentAction) {
        this.currentAction.fadeOut(0.2);
      }
      targetAction.reset().fadeIn(0.2).play();
      this.currentAction = targetAction;
    }
  }

  // Set the position of the player (moves both mesh and physics body)
  setPosition(vec3) {
    if (!vec3 || !vec3.isVector3) return;
    this.mesh.position.copy(vec3);
    if (this.body) {
      this.body.position.set(vec3.x, vec3.y, vec3.z);
      this.body.velocity.set(0, 0, 0); // Reset velocity when teleporting
      console.log('📍 Player position set to:', vec3, 'Body position:', this.body.position);
    }
    this._updateCollider();
    if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
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

  // Update collider size (array [x,y,z]) and refresh helper
  setColliderSize(sizeArr) {
    if (!sizeArr || sizeArr.length < 3) return;
    this.colliderSize = [sizeArr[0], sizeArr[1], sizeArr[2]];
    this._updateCollider();
    if (this.helper) this.helper.update();
  }

  // Helper method to play animation action
  _playAction(action, fadeDuration = 0.2, loop = true) {
    if (!action) return;
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(fadeDuration);
    }
    action.reset().fadeIn(fadeDuration).play();
    if (loop) {
      action.setLoop(THREE.LoopRepeat);
    } else {
      action.setLoop(THREE.LoopOnce);
    }
    this.currentAction = action;
  }

  // Toggle visibility of collision helper
  toggleHelperVisible(visible) {
    if (this.helper) this.helper.setVisible(visible);
  }

  // Clean up resources
  dispose() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    if (this.helper && this.helper.mesh) {
      this.scene.remove(this.helper.mesh);
    }
  }
}
