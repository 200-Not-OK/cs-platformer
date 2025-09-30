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
    
    // Physics body (Cannon.js) - will be created after model loads
    this.body = null;
    this.bodyShape = null;
    
    // Animation system
    this.mixer = null;
    this.actions = { idle: null, walk: null, jump: null };
    this.currentAction = null;
    
    // Movement state
    this.isGrounded = false;
    this.isSprinting = false;
    this.isJumping = false;
    
    // Debug counters
    this._debugCounter = 0;
    this._movementDebugCounter = 0;
    
    // Load 3D model first, then create physics body
    this.loadModel();
    
    console.log('Player created - loading model first, then physics body...');
  }

  createPhysicsBodyFromModel(modelSize) {
    console.log('🔧 Creating physics body from model dimensions:', modelSize);
    
    // Calculate cylinder dimensions based on model size
    const radius = Math.max(modelSize.x, modelSize.z) * 0.4; // 40% of the wider horizontal dimension
    const height = modelSize.y; // Full model height for proper ground alignment
    
    console.log(`🔧 Physics body dimensions: radius=${radius.toFixed(2)}, height=${height.toFixed(2)}`);
    
    // Create box shape instead of cylinder for simpler, more stable collision
    // Box has clean contact points and no complex curved surface interactions
    const width = radius * 2; // Convert radius to box width
    const depth = radius * 2; // Convert radius to box depth
    this.bodyShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    
    // Create physics body
    this.body = new CANNON.Body({
      mass: 1,
      material: this.physicsWorld.playerMaterial
    });
    
    // Add shape to body
    this.body.addShape(this.bodyShape);
    
    // Configure physics properties to prevent bouncing
    this.body.linearDamping = 0.2; // Add linear damping to smooth movement
    this.body.angularDamping = 0.9; // High angular damping to prevent spinning
    this.body.allowSleep = false; // Keep body always active
    this.body.fixedRotation = false; // Allow rotation for proper cylinder behavior
    
    // Set initial position (start high to test gravity)
    this.body.position.set(0, 10, 0);
    
    // Add body to physics world
    this.physicsWorld.world.addBody(this.body);
    
    // Update mass properties
    this.body.updateMassProperties();
    
    console.log('✅ Physics body created and added to world:', this.body.id);
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
    
  }

  loadModel() {
    console.log('🎭 Starting to load player model...');
    const loader = new GLTFLoader();
    
    // Try different path formats for the model
    const modelPaths = [
      'src/assets/low_poly_female/scene.gltf',
      './src/assets/low_poly_female/scene.gltf',
      '/src/assets/low_poly_female/scene.gltf'
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
        
        // Create physics body now that we know the model dimensions
        this.createPhysicsBodyFromModel(sizeVec);
        
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
    // DEPRECATED: This method is no longer used with the new model-first approach
    console.warn('⚠️ updatePhysicsBodySize called but is deprecated. Physics body should be created from model.');
    return;
    
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
    
    // Enhanced debug logging to find root cause of bouncing
    this.debugPhysicsRoot();
  }

  debugPhysicsRoot() {
    this._debugCounter++;
    
    // Log physics state every 20 frames when there are issues
    const hasVerticalVelocity = Math.abs(this.body.velocity.y) > 0.5;
    const hasUnexpectedMovement = !this.isJumping && hasVerticalVelocity;
    
    if (hasUnexpectedMovement && this._debugCounter % 20 === 0) {
      // Get all contacts involving the player
      const playerContacts = this.physicsWorld.world.contacts.filter(contact => 
        contact.bi === this.body || contact.bj === this.body
      );
      
      // Check what the player is colliding with
      const contactDetails = playerContacts.map(contact => {
        const otherBody = contact.bi === this.body ? contact.bj : contact.bi;
        return {
          normal: `${contact.ni.x.toFixed(2)}, ${contact.ni.y.toFixed(2)}, ${contact.ni.z.toFixed(2)}`,
          otherBodyType: otherBody.type,
          otherBodyMass: otherBody.mass,
          contactPoint: contact.ri ? `${contact.ri.x.toFixed(2)}, ${contact.ri.y.toFixed(2)}, ${contact.ri.z.toFixed(2)}` : 'none'
        };
      });
      
      console.log('🔬 BOUNCING ROOT CAUSE ANALYSIS:', {
        unexpectedVerticalVel: this.body.velocity.y.toFixed(3),
        position: `${this.body.position.x.toFixed(2)}, ${this.body.position.y.toFixed(2)}, ${this.body.position.z.toFixed(2)}`,
        isGrounded: this.isGrounded,
        isJumping: this.isJumping,
        contactCount: playerContacts.length,
        contactDetails: contactDetails,
        bodyProperties: {
          mass: this.body.mass,
          linearDamping: this.body.linearDamping,
          angularDamping: this.body.angularDamping,
          material: this.body.material?.name || 'none',
          sleepState: this.body.sleepState,
          shapes: this.body.shapes.length
        },
        worldSettings: {
          gravity: this.physicsWorld.world.gravity.y,
          totalBodies: this.physicsWorld.world.bodies.length,
          totalContacts: this.physicsWorld.world.contacts.length
        },
        suspectedCauses: {
          multipleContacts: playerContacts.length > 4,
          highContactStiffness: 'check contact material settings',
          incorrectGroundDetection: this.isGrounded !== (playerContacts.length > 0),
          possibleCollisionIssue: contactDetails.some(c => Math.abs(parseFloat(c.normal.split(',')[1])) < 0.5)
        }
      });
    }
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
    
    // Enhanced debugging for bouncing analysis
    if (this._debugCounter % 60 === 0) { // Every 1 second
      const contactCount = this.physicsWorld.world.contacts.length;
      const playerContacts = this.physicsWorld.world.contacts.filter(contact => 
        contact.bi === this.body || contact.bj === this.body
      );
      
      // Analyze contact quality
      const groundContacts = playerContacts.filter(c => c.ni.y > 0.5);
      const sideContacts = playerContacts.filter(c => Math.abs(c.ni.y) <= 0.5);
      const weirdContacts = playerContacts.filter(c => c.ni.y < -0.1);
      
      console.log('🌍 DETAILED Ground Check Analysis:', {
        isGrounded: this.isGrounded,
        detectionMethod: groundContactFound ? 'contacts' : (this.isGrounded ? 'raycast' : 'none'),
        bodyPosition: `${this.body.position.x.toFixed(2)}, ${this.body.position.y.toFixed(2)}, ${this.body.position.z.toFixed(2)}`,
        velocity: `${this.body.velocity.x.toFixed(2)}, ${this.body.velocity.y.toFixed(2)}, ${this.body.velocity.z.toFixed(2)}`,
        contactAnalysis: {
          total: playerContacts.length,
          ground: groundContacts.length,
          side: sideContacts.length,
          inverted: weirdContacts.length
        },
        contactNormals: playerContacts.map(c => `${c.ni.x.toFixed(2)}, ${c.ni.y.toFixed(2)}, ${c.ni.z.toFixed(2)}`),
        potentialIssues: {
          tooManyContacts: playerContacts.length > 6,
          invertedNormals: weirdContacts.length > 0,
          noGroundContacts: groundContacts.length === 0 && this.isGrounded,
          inconsistentDetection: groundContactFound !== this.isGrounded
        }
      });
    }
  }

  handleMovementInput(input, camOrientation, delta) {
    if (!input || !input.isKey) return;
    
    this._movementDebugCounter++;
    
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
      
      // Use a more controlled approach - blend between current velocity and target
      const currentVelX = this.body.velocity.x;
      const currentVelZ = this.body.velocity.z;
      const currentVelY = this.body.velocity.y;
      const targetVelX = moveDirection.x * targetSpeed;
      const targetVelZ = moveDirection.z * targetSpeed;
      
      // Apply force towards target velocity (simpler approach with box collider)
      const acceleration = 20; // Moderate force for box collider
      const forceX = (targetVelX - currentVelX) * acceleration;
      const forceZ = (targetVelZ - currentVelZ) * acceleration;
      
      // Debug logging every 30 frames (about every 0.5 seconds at 60fps)
      if (this._movementDebugCounter % 30 === 0) {
        console.log('🏃‍♂️ Movement Debug:', {
          input: `F:${moveForward} R:${moveRight}`,
          currentVel: `${currentVelX.toFixed(2)}, ${currentVelY.toFixed(2)}, ${currentVelZ.toFixed(2)}`,
          targetVel: `${targetVelX.toFixed(2)}, 0, ${targetVelZ.toFixed(2)}`,
          force: `${forceX.toFixed(2)}, 0, ${forceZ.toFixed(2)}`,
          forceMagnitude: Math.sqrt(forceX*forceX + forceZ*forceZ).toFixed(2),
          speed: targetSpeed.toFixed(2),
          isGrounded: this.isGrounded,
          colliderType: 'BOX',
          bouncing: Math.abs(currentVelY) > 0.5 ? '🚨 BOUNCING!' : '✅ stable'
        });
      }
      
      this.body.applyForce(new CANNON.Vec3(forceX, 0, forceZ), this.body.position);
      
      // Rotate player to face movement direction
      if (moveDirection.lengthSq() > 0) {
        const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetRotation, 0.1);
      }
    } else {
      // Apply extra damping when not moving for quicker stops
      const beforeX = this.body.velocity.x;
      const beforeZ = this.body.velocity.z;
      this.body.velocity.x *= 0.7;
      this.body.velocity.z *= 0.7;
      
      // Debug logging when stopping
      if (this._movementDebugCounter % 60 === 0 && (Math.abs(beforeX) > 0.1 || Math.abs(beforeZ) > 0.1)) {
        console.log('🛑 Stopping Debug:', {
          beforeVel: `${beforeX.toFixed(2)}, ${this.body.velocity.y.toFixed(2)}, ${beforeZ.toFixed(2)}`,
          afterVel: `${this.body.velocity.x.toFixed(2)}, ${this.body.velocity.y.toFixed(2)}, ${this.body.velocity.z.toFixed(2)}`,
          verticalBounce: Math.abs(this.body.velocity.y) > 0.5 ? '🚨 Y-BOUNCE!' : '✅ stable'
        });
      }
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
    // Since physics body height now matches model height, no offset needed
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    
    // Keep the physics body upright by resetting its rotation
    // This prevents the body from tipping over
    this.body.quaternion.set(0, 0, 0, 1);
  }

  preventGroundBouncing() {
    // Simple bounce prevention for box collider - should rarely be needed
    if (this.isGrounded && !this.isJumping && this.body.velocity.y > 1.0) {
      console.log(`🛑 Box collider bounce prevention: Y velocity clamped from ${this.body.velocity.y.toFixed(2)} to 0`);
      this.body.velocity.y = 0;
    }
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
    
    // Enhanced bounce detection and physics debugging
    const vel = this.body.velocity;
    const pos = this.body.position;
    const verticalVel = Math.abs(vel.y);
    const horizontalVel = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    
    // Detect potential bouncing issues
    const isBouncing = this.isGrounded && verticalVel > 0.5;
    const isUnexpectedVertical = !this.isJumping && verticalVel > 1.0;
    const isExcessiveHorizontal = horizontalVel > this.speed * 2;
    
    // Log more frequently if bouncing detected
    const logFrequency = (isBouncing || isUnexpectedVertical || isExcessiveHorizontal) ? 10 : 60;
    
    if (this._debugCounter % logFrequency === 0) {
      const debugLevel = (isBouncing || isUnexpectedVertical || isExcessiveHorizontal) ? '🚨 PHYSICS ISSUE' : '🎮 Player state';
      
      console.log(debugLevel, {
        position: `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`,
        velocity: `${vel.x.toFixed(2)}, ${vel.y.toFixed(2)}, ${vel.z.toFixed(2)}`,
        verticalSpeed: verticalVel.toFixed(2),
        horizontalSpeed: horizontalVel.toFixed(2),
        grounded: this.isGrounded,
        jumping: this.isJumping,
        sprinting: this.isSprinting,
        damping: `linear: ${this.body.linearDamping}, angular: ${this.body.angularDamping}`,
        issues: {
          bouncing: isBouncing,
          unexpectedVertical: isUnexpectedVertical,
          excessiveHorizontal: isExcessiveHorizontal
        },
        physicsBody: {
          mass: this.body.mass,
          allowSleep: this.body.allowSleep,
          sleepState: this.body.sleepState,
          inWorld: this.physicsWorld.world.bodies.includes(this.body)
        }
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