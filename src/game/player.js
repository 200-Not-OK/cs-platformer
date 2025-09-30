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
    
    // Collider sizing options
    this.colliderScale = {
      width: options.colliderWidthScale ?? 0.4,    // Scale factor for width (X/Z)
      height: options.colliderHeightScale ?? 0.9,  // Scale factor for height (Y)
      depth: options.colliderDepthScale ?? 0.4     // Scale factor for depth (Z)
    };
    
    // Visual mesh (Three.js)
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);
    
    // Physics body (Cannon.js) - will be created after model loads
    this.body = null;
    this.originalModelSize = null; // Store original model dimensions for collider updates
    
    // Animation system
    this.mixer = null;
    this.actions = { idle: null, walk: null, jump: null };
    this.currentAction = null;
    
    // Movement state
    this.isGrounded = false;
    this.isSprinting = false;
    this.isJumping = false;
    
    // Ground detection
    this.groundCheckDistance = 0.1;
    this.groundNormalThreshold = 0.5;
    
    // Load 3D model first, then create physics body
    this.loadModel();
  }

  async loadModel() {
    const loader = new GLTFLoader();
    
    // Try different path formats for the model
    const modelPaths = [
      'src/assets/Knight/Knight.gltf',
      './src/assets/Knight/Knight.gltf',
      '/src/assets/Knight/Knight.gltf'
    ];
    
    let currentPathIndex = 0;
    
    const tryLoadModel = () => {
      const currentPath = modelPaths[currentPathIndex];
      
      loader.load(
        currentPath,
        (gltf) => {
          
          // Clear any existing mesh children
          while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
          }
        
          // Compute bounding box for the whole scene
          const bbox = new THREE.Box3().setFromObject(gltf.scene);
          const sizeVec = new THREE.Vector3();
          bbox.getSize(sizeVec);
          
          // Create physics body now that we know the model dimensions
          this.createPhysicsBody(sizeVec);
          
          // Center model horizontally and vertically
          const centerX = (bbox.max.x + bbox.min.x) / 2;
          const centerZ = (bbox.max.z + bbox.min.z) / 2;
          const centerY = (bbox.max.y + bbox.min.y) / 2;
          gltf.scene.position.x -= centerX;
          gltf.scene.position.z -= centerZ;
          gltf.scene.position.y -= centerY;
          
          // Add the loaded model to our mesh group
          this.mesh.add(gltf.scene);
          
          // Setup animations if available
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(gltf.scene);
            
            // Find animation clips
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
            }
            
            if (walkClip) {
              this.actions.walk = this.mixer.clipAction(walkClip);
              this.actions.walk.setLoop(THREE.LoopRepeat);
            }
            
            if (jumpClip) {
              this.actions.jump = this.mixer.clipAction(jumpClip);
              this.actions.jump.setLoop(THREE.LoopOnce);
            }
            
            // Start with idle animation
            if (this.actions.idle) {
              this.actions.idle.play();
              this.currentAction = this.actions.idle;
            }
          } else {
          }
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
            
            // Create physics body for fallback geometry
            this.createPhysicsBody(new THREE.Vector3(1, 2, 1));
          }
        }
      );
    };
    
    // Start loading
    tryLoadModel();
  }

  createPhysicsBody(modelSize) {
    // Store original model size for future collider updates
    this.originalModelSize = {
      x: modelSize.x,
      y: modelSize.y,
      z: modelSize.z
    };
    
    // Create a capsule-like shape using configurable scaling
    const width = Math.max(modelSize.x, modelSize.z) * this.colliderScale.width;
    const height = modelSize.y * this.colliderScale.height;
    const depth = Math.max(modelSize.x, modelSize.z) * this.colliderScale.depth;
    
    // Create physics body using our PhysicsWorld
    this.body = this.physicsWorld.createDynamicBody({
      mass: 5, // Increased from 1 to 5 for faster falling
      shape: 'box',
      size: [width, height, depth],
      position: [0, 10, 0], // Start high to test gravity
      material: 'player'
    });
    
    // Configure body for character movement
    this.body.fixedRotation = true; // Prevent tipping over
    this.body.updateMassProperties();
  }

  update(delta, input, camOrientation = null, platforms = [], playerActive = true) {
    // l
    
    if (!this.body) {
      return;
    }
    
    // Update ground detection
    this.updateGroundDetection();
    
    // Apply additional downward force when airborne for faster falling
    if (!this.isGrounded) {
      const extraGravityForce = -25; // Additional downward force (negative Y)
      this.body.applyForce(new CANNON.Vec3(0, extraGravityForce, 0), this.body.position);
    }
    
    // Handle movement input
    if (playerActive) {
      this.handleMovementInput(input, camOrientation, delta);
      this.handleJumpInput(input);
    }
    
    // Sync visual mesh with physics body
    this.syncMeshWithBody();
    
    // Update animations
    this.updateAnimations(delta);
  }

  updateGroundDetection() {
    // Use the physics world's ground detection
    const wasGrounded = this.isGrounded;
    this.isGrounded = this.physicsWorld.isBodyGrounded(this.body, this.groundNormalThreshold);
    
    // Reset jumping flag when player lands
    if (this.isGrounded && this.isJumping && this.body.velocity.y <= 0.1) {
      this.isJumping = false;
    }
  }

  handleMovementInput(input, camOrientation, delta) {
    if (!input || !input.isKey) {
      return;
    }
    
    if (!this.body) {
      return;
    }
    
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
      
      // Calculate target speed
      const targetSpeed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1);
      
      // Calculate target velocity
      const targetVelX = moveDirection.x * targetSpeed;
      const targetVelZ = moveDirection.z * targetSpeed;
      
      // Apply movement based on grounded state
      if (this.isGrounded) {
        // When grounded, use direct velocity for stable movement
        this.body.velocity.x = targetVelX;
        this.body.velocity.z = targetVelZ;
      } else {
        // When airborne, use blended velocity for responsive but realistic movement
        const airControl = 0.3; // Reduce air control compared to ground movement
        const currentVelX = this.body.velocity.x;
        const currentVelZ = this.body.velocity.z;
        
        // Blend current velocity with target velocity for air control
        this.body.velocity.x = THREE.MathUtils.lerp(currentVelX, targetVelX * airControl, 0.2);
        this.body.velocity.z = THREE.MathUtils.lerp(currentVelZ, targetVelZ * airControl, 0.2);
      }
      
      // Rotate player to face movement direction
      if (moveDirection.lengthSq() > 0) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 0.1);
      }
    } else {
      // Apply damping when not moving for quicker stops
      if (this.isGrounded) {
        this.body.velocity.x *= 0.7;
        this.body.velocity.z *= 0.7;
      } else {
        // Stop immediately when airborne and no input
        this.body.velocity.x *= 0.1; // Much more aggressive stopping
        this.body.velocity.z *= 0.1;
      }
    }
  }

  handleJumpInput(input) {
    if (!input || !input.isKey) return;
    
    if (input.isKey('Space')) {
      if (this.isGrounded && !this.isJumping) {
        // Apply upward impulse for jumping
        this.body.velocity.y = this.jumpStrength;
        this.isJumping = true;
      }
    }
  }

  syncMeshWithBody() {
    if (!this.body) return;
    
    // Copy position from physics body to visual mesh
    this.mesh.position.copy(this.body.position);
    
    // Keep the physics body upright by resetting its rotation
    this.body.quaternion.set(0, 0, 0, 1);
  }

  updateAnimations(delta) {
    if (!this.mixer) return;
    
    // Update animation mixer
    this.mixer.update(delta);
    
    // Determine which animation to play
    const velocity = this.body.velocity;
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    const isMoving = horizontalSpeed > 0.1; // Lowered threshold for more immediate stopping
    
    let targetAction = null;
    
    if (!this.isGrounded && this.actions.jump) {
      targetAction = this.actions.jump;
    } else if (isMoving && this.actions.walk) {
      targetAction = this.actions.walk;
      this.actions.walk.paused = false;
    } else if (this.actions.idle) {
      targetAction = this.actions.idle;
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

  setPosition(position) {
    if (!position || !this.body) return;
    
    this.body.position.set(position.x, position.y, position.z);
    this.body.velocity.set(0, 0, 0);
    this.syncMeshWithBody();
  }

  // Method to update collider size at runtime
  updateColliderSize(widthScale, heightScale, depthScale) {
    if (!this.body) {
      console.warn('⚠️ Cannot update collider - physics body not created yet');
      return;
    }
    
    if (!this.originalModelSize) {
      console.warn('⚠️ Cannot update collider - original model size not stored');
      return;
    }
    
    // Update scale factors
    if (widthScale !== undefined) this.colliderScale.width = widthScale;
    if (heightScale !== undefined) this.colliderScale.height = heightScale;
    if (depthScale !== undefined) this.colliderScale.depth = depthScale;
    
    // Store current position and velocity
    const currentPos = this.body.position.clone();
    const currentVel = this.body.velocity.clone();
    
    // Remove old body
    this.physicsWorld.removeBody(this.body);
    
    // Create new body with updated dimensions using original model size
    this.createPhysicsBody(this.originalModelSize);
    
    // Restore position and velocity
    this.body.position.copy(currentPos);
    this.body.velocity.copy(currentVel);
  }

  dispose() {
    
    // Remove physics body
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
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