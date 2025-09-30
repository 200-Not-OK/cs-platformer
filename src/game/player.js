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
    
    // Add a temporary visible cube until model loads
    this.createTemporaryMesh();
    
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
    
    // Load 3D model
    this.loadModel();
    
    console.log('🎮 Player created with physics body:', this.body?.id);
  }

  createTemporaryMesh() {
    // Create a bright colored cube as a temporary placeholder
    const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00, // Bright green
      transparent: true,
      opacity: 0.8
    });
    this.tempMesh = new THREE.Mesh(geometry, material);
    this.mesh.add(this.tempMesh);
    console.log('🟢 Temporary green cube added as placeholder');
  }

  createPhysicsBody() {
    // Create a box-shaped physics body for the player
    const width = 0.8;
    const height = 1.8;
    const depth = 0.8;
    
    const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    
    this.body = new CANNON.Body({
      mass: 1,
      type: CANNON.Body.DYNAMIC
    });
    
    // Add shape to body
    this.body.addShape(shape);
    
    // Set material
    this.body.material = this.physicsWorld.playerMaterial;
    
    // Set initial position
    this.body.position.set(0, 10, 0); // Start high to test gravity
    
    // Prevent body from sleeping and ensure it's dynamic
    this.body.allowSleep = false;
    this.body.sleepState = CANNON.Body.AWAKE;
    this.body.type = CANNON.Body.DYNAMIC;
    
    // Add some damping to prevent sliding
    this.body.linearDamping = 0.1;
    this.body.angularDamping = 0.9;
    
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
          
          // Clear any existing mesh children (including temp mesh)
          while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
          }
          console.log('🧹 Cleared temporary mesh and other children');
        
        // Compute bounding box for the whole scene (like old code)
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        console.log('📏 Model size:', sizeVec);
        
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
          const walkClip = findClip(['walk', 'run', 'strafe']) || gltf.animations[0] || null;
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
            
            // Clear temp mesh and add fallback
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
    this.debugLog();
  }

  updateGroundCheck() {
    // Simple ground check using raycast
    const rayStart = this.body.position.clone();
    const rayEnd = rayStart.clone();
    rayEnd.y -= 1.0; // Ray length
    
    const result = this.physicsWorld.raycast(rayStart, rayEnd);
    this.isGrounded = result.hasHit;
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
      
      // Apply velocity directly to physics body
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
    
    if (input.isKey('Space') && this.isGrounded && !this.isJumping) {
      // Apply upward impulse for jumping
      this.body.velocity.y = this.jumpStrength;
      this.isJumping = true;
      
      // Reset jumping flag when we land
      setTimeout(() => {
        if (this.isGrounded) {
          this.isJumping = false;
        }
      }, 100);
    }
  }

  syncMeshWithBody() {
    if (!this.body) return;
    
    // Debug: Log positions before sync
    const bodyPos = this.body.position;
    const meshPos = this.mesh.position;
    
    if (Math.abs(bodyPos.x - meshPos.x) > 0.01 || 
        Math.abs(bodyPos.y - meshPos.y) > 0.01 || 
        Math.abs(bodyPos.z - meshPos.z) > 0.01) {
      console.log('🔄 Syncing mesh with body:', {
        bodyPos: `${bodyPos.x.toFixed(2)}, ${bodyPos.y.toFixed(2)}, ${bodyPos.z.toFixed(2)}`,
        meshPos: `${meshPos.x.toFixed(2)}, ${meshPos.y.toFixed(2)}, ${meshPos.z.toFixed(2)}`,
        bodyVel: `${this.body.velocity.x.toFixed(2)}, ${this.body.velocity.y.toFixed(2)}, ${this.body.velocity.z.toFixed(2)}`
      });
    }
    
    // Copy position from physics body to visual mesh
    // Use explicit assignment to ensure compatibility between CANNON.Vec3 and THREE.Vector3
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    
    // Don't copy rotation for X and Z axes to keep player upright
    // Only use Y rotation for turning
  }

  updateAnimations(delta) {
    if (!this.mixer) return;
    
    // Update animation mixer
    this.mixer.update(delta);
    
    // Determine which animation to play
    const isMoving = Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.z) > 0.1;
    
    let targetAction = null;
    
    if (!this.isGrounded && this.actions.jump) {
      targetAction = this.actions.jump;
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