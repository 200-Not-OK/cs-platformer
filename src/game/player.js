import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    
    // Player settings
    this.speed = options.speed ?? 8;
    this.jumpStrength = options.jumpStrength ?? 15;
    this.sprintMultiplier = options.sprintMultiplier ?? 1.6;
    this.health = options.health ?? 100;
    
    // Visual mesh (Three.js)
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);
    
    // No temporary mesh - wait for model to load
    
    // Physics body (Cannon.js)
    this.body = null;
    this.createPhysicsBody();
    
    // Animation system
    this.mixer = null;
    this.actions = { idle: null, walk: null, jump: null };
    this.currentAction = null;
    
    // Movement state
    this.isGrounded = false;
    this.isSprinting = false;
    this.isJumping = false;
    
    // Model and physics dimensions for position adjustment
    this.modelHeight = 1.6; // Default height
    this.physicsHeight = 1.44; // Default physics height (90% of model)
    
    // Load 3D model
    this.loadModel();
    
    console.log('Player created with physics body:', this.body?.id);
  }

  createPhysicsBody() {
    // Create a cylinder physics body for the player
    // Start with reasonable default dimensions, will be updated when model loads
    const radius = 0.3; // Smaller radius for tighter collision
    const height = 1.6; // Reasonable height for character
    
    // Create cylinder shape (good approximation of capsule for character movement)
    const shape = new CANNON.Cylinder(radius, radius, height, 8);
    
    this.body = new CANNON.Body({
      mass: 1,
      type: CANNON.Body.DYNAMIC
    });
    
    // Add shape to body
    this.body.addShape(shape);
    
    // Store shape reference for potential resizing
    this.bodyShape = shape;
    
    // Set material
    this.body.material = this.physicsWorld.playerMaterial;
    
    // Set initial position
    this.body.position.set(0, 10, 0); // Start high to test gravity
    
    // Prevent body from sleeping and ensure it's dynamic
    this.body.allowSleep = false;
    this.body.sleepState = CANNON.Body.AWAKE;
    this.body.type = CANNON.Body.DYNAMIC;
    
    // Add damping to prevent sliding and bouncing
    this.body.linearDamping = 0.1; // Reduced damping for better movement
    this.body.angularDamping = 0.9;
    
    // Don't use fixedRotation as it can cause physics issues
    // Instead we'll handle rotation manually in the visual mesh
    
    // Add body to physics world using the proper method
    this.physicsWorld.world.addBody(this.body);
    this.physicsWorld.bodies.add(this.body);
    
    // Force update mass properties
    this.body.updateMassProperties();
    
    // Manually test if gravity affects the body
    setTimeout(() => {
      console.log('🧪 Manual gravity test - applying downward force...');
      this.body.applyImpulse(new CANNON.Vec3(0, -5, 0));
      console.log('Applied impulse, new velocity:', this.body.velocity);
    }, 2000);
    
    console.log('🔧 Physics body created:', {
      id: this.body.id,
      mass: this.body.mass,
      invMass: this.body.invMass, // Should be 1 for mass=1
      type: this.body.type,
      position: this.body.position,
      velocity: this.body.velocity,
      inWorld: this.physicsWorld.world.bodies.includes(this.body),
      worldBodyCount: this.physicsWorld.world.bodies.length,
      allowSleep: this.body.allowSleep,
      sleepState: this.body.sleepState,
      shapes: this.body.shapes.length
    });
    
    // Verify body is still in world after a delay
    setTimeout(() => {
      const stillInWorld = this.physicsWorld.world.bodies.includes(this.body);
      console.log('🔍 Body check after 1 second:', {
        bodyId: this.body.id,
        stillInWorld,
        worldBodyCount: this.physicsWorld.world.bodies.length,
        worldBodyIds: this.physicsWorld.world.bodies.map(b => b.id)
      });
      
      if (!stillInWorld) {
        console.log('🚨 Body was removed! Re-adding it...');
        this.physicsWorld.world.addBody(this.body);
        this.physicsWorld.bodies.add(this.body);
      }
    }, 1000);
    
    // Test physics response after a delay
    setTimeout(() => {
      console.log('🧪 Physics test after 3 seconds:');
      console.log('Position:', this.body.position);
      console.log('Velocity:', this.body.velocity);
      console.log('Sleep state:', this.body.sleepState);
      console.log('Inverse mass:', this.body.invMass);
      
      // Apply a strong downward impulse
      this.body.applyImpulse(new CANNON.Vec3(0, -10, 0));
      console.log('Applied strong impulse, new velocity:', this.body.velocity);
    }, 3000);
  }

  loadModel() {
    console.log('🎭 Starting to load player model...');
    const loader = new GLTFLoader();
    
    // Try different path formats for the model
    const modelPaths = [
      'src/assets/low_poly_male/scene.gltf',
      './src/assets/low_poly_male/scene.gltf',
      '/src/assets/low_poly_male/scene.gltf'
    ];
    
    let currentPathIndex = 0;
    
    const tryLoadModel = () => {
      const currentPath = modelPaths[currentPathIndex];
      console.log(`🔄 Trying to load model from: ${currentPath}`);
      
      loader.load(
        currentPath,
        (gltf) => {
          console.log('🎭 GLTF loaded successfully:', gltf);
          
          // Clear any existing mesh children
          while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
          }
          console.log('🧹 Cleared any existing mesh children');
        
        // Compute bounding box for the whole scene (like old code)
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        console.log('📏 Model size:', sizeVec);
        
        // Update physics body to match model size
        this.updatePhysicsBodySize(sizeVec);
        
        // Center model horizontally and vertically (like old code)
        const centerX = (bbox.max.x + bbox.min.x) / 2;
        const centerZ = (bbox.max.z + bbox.min.z) / 2;
        const centerY = (bbox.max.y + bbox.min.y) / 2;
        gltf.scene.position.x -= centerX;
        gltf.scene.position.z -= centerZ;
        gltf.scene.position.y -= centerY;
        
        // Add the loaded model to our mesh group
        this.mesh.add(gltf.scene);
        console.log('📦 Model added to mesh group');
        
        // Setup animations if available (improved from old code)
        if (gltf.animations && gltf.animations.length > 0) {
          console.log('🎬 Setting up animations:', gltf.animations.map(a => a.name));
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          
          // Find animation clips (using old code's more robust method)
          const findClip = (names) => {
            if (!names) return null;
            for (const n of names) {
              const lower = n.toLowerCase();
              for (const c of gltf.animations) {
                if (c.name && c.name.toLowerCase().includes(lower)) return c;
              }
            }
            return null;
          };
          
          const idleClip = findClip(['idle', 'stand', 'rest']) || null;
          const walkClip = findClip(['walking', 'run', 'strafe']) || gltf.animations[0] || null;
          const jumpClip = findClip(['jump', 'leap']) || null;
          
          if (idleClip) {
            this.actions.idle = this.mixer.clipAction(idleClip);
            this.actions.idle.setLoop(THREE.LoopRepeat);
            console.log('✅ Idle animation set up');
          }
          
          if (walkClip) {
            this.actions.walk = this.mixer.clipAction(walkClip);
            this.actions.walk.setLoop(THREE.LoopRepeat);
            console.log('✅ Walk animation set up');
          }
          
          if (jumpClip) {
            this.actions.jump = this.mixer.clipAction(jumpClip);
            this.actions.jump.setLoop(THREE.LoopOnce);
            console.log('✅ Jump animation set up');
          }
          
          // Start with idle animation
          if (this.actions.idle) {
            this.actions.idle.play();
            this.currentAction = this.actions.idle;
            console.log('▶️ Started idle animation');
          }
        } else {
          console.log('⚠️ No animations found in model');
        }
        
        console.log('🎭 Player model loaded and set up successfully');
        },
        (progress) => {
          console.log('⏳ Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error(`❌ Failed to load model from ${currentPath}:`, error);
          
          // Try next path
          currentPathIndex++;
          if (currentPathIndex < modelPaths.length) {
            console.log('🔄 Trying next path...');
            tryLoadModel();
          } else {
            console.error('❌ All model paths failed, creating fallback geometry...');
            // Create a fallback cube if all paths fail
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
            const fallbackMesh = new THREE.Mesh(geometry, material);
            
            // Clear any existing meshes and add fallback
            while (this.mesh.children.length > 0) {
              this.mesh.remove(this.mesh.children[0]);
            }
            this.mesh.add(fallbackMesh);
            console.log('📦 Fallback geometry created');
          }
        }
      );
    };
    
    // Start loading
    tryLoadModel();
  }

  updatePhysicsBodySize(modelSize) {
    if (!this.body || !this.bodyShape) return;
    
    // Store model dimensions for position adjustment
    this.modelHeight = modelSize.y;
    
    // Calculate appropriate cylinder dimensions based on model size
    // Use slightly smaller dimensions than the model for tighter collision
    const radius = Math.max(modelSize.x, modelSize.z) * 0.35; // 35% of the wider horizontal dimension
    const height = modelSize.y * 0.9; // 90% of model height
    
    // Store physics height for position offset calculation
    this.physicsHeight = height;
    
    console.log(`🔧 Updating physics body size: radius=${radius.toFixed(2)}, height=${height.toFixed(2)} (model height: ${this.modelHeight.toFixed(2)})`);
    
    // Remove old shape
    this.body.removeShape(this.bodyShape);
    
    // Create new cylinder with updated dimensions
    this.bodyShape = new CANNON.Cylinder(radius, radius, height, 8);
    this.body.addShape(this.bodyShape);
    
    // Update mass properties
    this.body.updateMassProperties();
    
    console.log('✅ Physics body size updated to match model');
  }

  update(delta, input, camOrientation = null, platforms = [], playerActive = true) {
    if (!this.body) return;
    
    // Ensure body is in physics world (emergency fix)
    if (!this.physicsWorld.world.bodies.includes(this.body)) {
      console.log('🚨 Player body not in world! Re-adding...');
      this.physicsWorld.world.addBody(this.body);
      this.physicsWorld.bodies.add(this.body);
    }
    
    // Update ground check
    this.updateGroundCheck();
    
    // Handle movement input
    if (playerActive) {
      this.handleMovementInput(input, camOrientation, delta);
      this.handleJumpInput(input);
    }
    
    // Sync visual mesh with physics body
    this.syncMeshWithBody();
    
    // Update animations
    this.updateAnimations(delta);
    
    // Debug logging
    //this.debugLog();
  }

  updateGroundCheck() {
    // Primary ground check using physics contacts (more reliable)
    let groundContactFound = false;
    
    // Check all contacts involving the player body
    for (let i = 0; i < this.physicsWorld.world.contacts.length; i++) {
      const contact = this.physicsWorld.world.contacts[i];
      
      // Check if this contact involves the player
      if (contact.bi === this.body || contact.bj === this.body) {
        // Get the contact normal (direction of contact)
        const normal = contact.ni;
        
        // If the normal points mostly upward, it's likely ground contact
        // (normal.y > 0.5 means the contact surface is angled less than 60 degrees from horizontal)
        if (normal.y > 0.5) {
          groundContactFound = true;
          break;
        }
      }
    }
    
    this.isGrounded = groundContactFound;
    
    // Reset jumping flag when player lands
    if (this.isGrounded && this.isJumping && this.body.velocity.y <= 0.1) {
      this.isJumping = false;
      console.log('🛬 Landing detected - jump flag reset');
    }
    
    // Optional: Try raycast as backup (currently not working reliably)
    if (!this.isGrounded) {
      const rayStart = this.body.position.clone();
      const rayEnd = rayStart.clone();
      rayEnd.y -= 1.2;
      
      const result = this.physicsWorld.raycast(rayStart, rayEnd);
      if (result.hasHit) {
        this.isGrounded = true;
        // Also reset jumping flag if we hit ground via raycast
        if (this.isJumping && this.body.velocity.y <= 0.1) {
          this.isJumping = false;
          console.log('🛬 Landing detected via raycast - jump flag reset');
        }
      }
    }
    
    // Debug logging (less frequent now that contact detection works)
    if (this._debugCounter % 180 === 0) { // Every 3 seconds
      console.log('🌍 Ground check:', {
        isGrounded: this.isGrounded,
        method: groundContactFound ? 'contacts' : (this.isGrounded ? 'raycast' : 'none'),
        bodyPosition: `${this.body.position.x.toFixed(2)}, ${this.body.position.y.toFixed(2)}, ${this.body.position.z.toFixed(2)}`,
        contacts: this.physicsWorld.world.contacts.length
      });
    }
  }

  handleMovementInput(input, camOrientation, delta) {
    if (!input || !input.isKey) return;
    
    let moveForward = 0;
    let moveRight = 0;
    
    // Read input
    if (input.isKey('KeyW')) moveForward = 1;
    if (input.isKey('KeyS')) moveForward = -1;
    if (input.isKey('KeyA')) moveRight = -1;
    if (input.isKey('KeyD')) moveRight = 1;
    
    // Check for sprint
    this.isSprinting = input.isKey('ShiftLeft') || input.isKey('ShiftRight');
    
    // Apply movement if there's input
    if (moveForward !== 0 || moveRight !== 0) {
      // Get camera direction vectors
      const forward = camOrientation?.forward || new THREE.Vector3(0, 0, -1);
      const right = camOrientation?.right || new THREE.Vector3(1, 0, 0);
      
      // Calculate movement direction in world space
      const moveDirection = new THREE.Vector3();
      moveDirection.addScaledVector(forward, moveForward);
      moveDirection.addScaledVector(right, moveRight);
      moveDirection.y = 0; // Remove vertical component
      moveDirection.normalize();
      
      // Calculate speed
      const speed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1);
      
      // Apply velocity directly for responsive movement
      this.body.velocity.x = moveDirection.x * speed;
      this.body.velocity.z = moveDirection.z * speed;
      
      // Rotate player to face movement direction
      if (moveDirection.lengthSq() > 0) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 0.1);
      }
    } else {
      // Apply damping when not moving
      this.body.velocity.x *= 0.8;
      this.body.velocity.z *= 0.8;
    }
  }

  handleJumpInput(input) {
    if (!input || !input.isKey) return;
    
    if (input.isKey('Space')) {
      console.log('🚀 Space key pressed, checking jump conditions:', {
        isGrounded: this.isGrounded,
        isJumping: this.isJumping,
        velocity: this.body.velocity.y.toFixed(2)
      });
      
      if (this.isGrounded && !this.isJumping) {
        // Apply upward impulse for jumping
        this.body.velocity.y = this.jumpStrength;
        this.isJumping = true;
        console.log(`🚀 JUMP! Applied velocity: ${this.jumpStrength}`);
      } else {
        console.log('🚫 Jump blocked:', {
          reason: !this.isGrounded ? 'not grounded' : 'already jumping'
        });
      }
    }
  }

  syncMeshWithBody() {
    if (!this.body) return;
    
    // Copy position from physics body to visual mesh
    // Adjust Y position to account for the difference between physics body height and model height
    // Physics body center should align with model's center, not its base
    const heightOffset = this.modelHeight ? (this.modelHeight - this.physicsHeight) * 0.5 : 0;
    
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y + heightOffset,
      this.body.position.z
    );
    
    // Keep the physics body upright by resetting its rotation
    // This prevents the body from tipping over without using fixedRotation
    this.body.quaternion.set(0, 0, 0, 1);
  }

  updateAnimations(delta) {
    if (!this.mixer) return;
    
    // Update animation mixer
    this.mixer.update(delta);
    
    // Determine which animation to play with better movement detection
    const velocity = this.body.velocity;
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    const isMoving = horizontalSpeed > 0.2; // Lowered threshold for more responsive detection
    
    // Debug animation state every second
    // if (this._debugCounter % 60 === 0) {
    //   console.log('🎬 Animation debug:', {
    //     horizontalSpeed: horizontalSpeed.toFixed(3),
    //     velocity: `${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}`,
    //     isMoving,
    //     isGrounded: this.isGrounded,
    //     availableAnimations: Object.keys(this.actions),
    //     currentAction: this.currentAction?.getClip()?.name || 'none',
    //     walkAnimationExists: !!this.actions.walk,
    //     idleAnimationExists: !!this.actions.idle
    //   });
    // }
    
    let targetAction = null;
    
    if (!this.isGrounded && this.actions.jump) {
      targetAction = this.actions.jump;
    } else if (isMoving && this.actions.walk) {
      targetAction = this.actions.walk;
      // Ensure walk animation is not paused when moving
      this.actions.walk.paused = false;
    } else if (this.actions.idle) {
      targetAction = this.actions.idle;
    } else if (this.actions.walk && !isMoving) {
      // If no idle animation exists, stop the walk animation instead of pausing
      targetAction = null; // This will stop the current animation
    }
    
    // Switch animation if needed
    if (targetAction !== this.currentAction) {
      if (this.currentAction) {
        this.currentAction.fadeOut(0.2);
      }
      if (targetAction) {
        targetAction.reset().fadeIn(0.2).play();
        this.currentAction = targetAction;
      } else {
        this.currentAction = null;
      }
    }
  }

  debugLog() {
    // Log debug info every 60 frames (about 1 second)
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    
    if (this._debugCounter % 60 === 0) {
      console.log('🎮 Player state:', {
        position: this.body.position,
        velocity: this.body.velocity,
        grounded: this.isGrounded,
        sprinting: this.isSprinting,
        jumping: this.isJumping
      });
    }
  }

  setPosition(position) {
    if (!position || !this.body) return;
    
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
    this.syncMeshWithBody();
    
    console.log('📍 Player position set to:', position);
  }

  dispose() {
    console.log('🚨 Player dispose() called! Stack trace:');
    console.trace();
    
    // Remove physics body
    if (this.body) {
      console.log('🗑️ Removing player physics body from world');
      this.physicsWorld.world.removeBody(this.body);
      this.physicsWorld.bodies.delete(this.body);
    }
    
    // Remove visual mesh
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
  }

  // Legacy compatibility methods
  toggleHelperVisible(visible) {
    // This was for the old collision debug helpers - no longer needed
  }
}