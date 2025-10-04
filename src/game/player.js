import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.game = options.game; // Reference to the game instance for death handling
    
    // Player settings
    this.speed = options.speed ?? 8;
    this.jumpStrength = options.jumpStrength ?? 15;
    this.sprintMultiplier = options.sprintMultiplier ?? 1.6;
    this.health = options.health ?? 100;
    
    // Collider sizing options
    this.colliderScale = {
      width: options.colliderWidthScale ?? 0.4,    // Scale factor for width (X/Z)
      height: options.colliderHeightScale ?? 1,  // Scale factor for height (Y)
      depth: options.colliderDepthScale ?? 0.4     // Scale factor for depth (Z)
    };
    
    // Collider offset options (local space relative to player mesh)
    this.colliderOffset = {
      x: options.colliderOffsetX ?? 0,     // Sideways offset
      y: options.colliderOffsetY ?? 0,     // Vertical offset  
      z: options.colliderOffsetZ ?? -0.4   // Forward/backward offset (negative = backward)
    };
    
    // Visual mesh (Three.js)
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);
    
    // Physics body (Cannon.js) - will be created after model loads
    this.body = null;
    this.originalModelSize = null; // Store original model dimensions for collider updates
    
    // Animation system
    this.mixer = null;
    this.actions = { 
      idle: null, 
      walk: null, 
      sprint: null, 
      jump: null, 
      attack: null,
      interact: null,
      death: null 
    };
    this.currentAction = null;
    
    // Combat system
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.isAttacking = false;
    this.attackDuration = 600; // Attack animation duration in ms
    this.lastAttackTime = 0;
    
    // Interaction system
    this.isInteracting = false;
    this.lastInteractionTime = 0;
    
    // Movement lock system for animations
    this.movementLocked = false;
    this.movementLockReason = '';
    
    // Movement state
    this.isGrounded = false;
    this.isOnSlope = false; // Track if player is on a sloped surface
    this.isSprinting = false;
    this.isJumping = false;
    
    // Ground detection
    this.groundCheckDistance = 0.1;
    this.groundNormalThreshold = 0.5;
    
    // Wall sliding system
    this.enableWallSliding = true;
    this.wallSlideSmoothing = 0.85; // How smoothly to slide along walls (0-1)
    this.wallSlideSpeed = 3.0; // Speed when sliding down walls
    this.collisionContacts = []; // Store current collision contacts
    this.wallNormals = []; // Store wall normal vectors for sliding
    
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

            console.log(`Available animations: ${gltf.animations.map(a => a.name).join(', ')}`);
            
            // Find animation clips with exact names from your model
            const findClip = (names) => {
              if (!names) return null;
              for (const n of names) {
                for (const c of gltf.animations) {
                  if (c.name && c.name === n) return c; // Exact match
                }
              }
              return null;
            };
            
            // Find clips with fallback to similar names
            const findClipWithFallback = (exactNames, fallbackNames) => {
              let clip = findClip(exactNames);
              if (!clip && fallbackNames) {
                for (const n of fallbackNames) {
                  const lower = n.toLowerCase();
                  for (const c of gltf.animations) {
                    if (c.name && c.name.toLowerCase().includes(lower)) {
                      clip = c;
                      break;
                    }
                  }
                  if (clip) break;
                }
              }
              return clip;
            };
            
            // Map animations to actions using exact names from your model
            const idleClip = findClip(['Idle']);
            const walkClip = findClip(['Walking_A', 'Walking_B', 'Walking_C']) || findClipWithFallback(null, ['walking']);
            const sprintClip = findClip(['Running_A', 'Running_B']) || findClipWithFallback(null, ['running', 'sprint']);
            const jumpClip = findClip(['Jump_Full_Long', 'Jump_Full_Short', 'Jump_Start']) || findClipWithFallback(null, ['jump']);
            const attackClip = findClip(['1H_Melee_Attack_Slice_Horizontal', '1H_Melee_Attack_Chop', '1H_Melee_Attack_Stab', 'Unarmed_Melee_Attack_Punch_A']);
            const interactClip = findClip(['Interact', 'Use_Item', 'PickUp']);
            const deathClip = findClip(['Death_A', 'Death_B']);
            
            // Set up idle animation
            if (idleClip) {
              this.actions.idle = this.mixer.clipAction(idleClip);
              this.actions.idle.setLoop(THREE.LoopRepeat);
              console.log('✅ Idle animation loaded:', idleClip.name);
            }
            
            // Set up walk animation
            if (walkClip) {
              this.actions.walk = this.mixer.clipAction(walkClip);
              this.actions.walk.setLoop(THREE.LoopRepeat);
              console.log('✅ Walk animation loaded:', walkClip.name);
            }
            
            // Set up sprint animation
            if (sprintClip) {
              this.actions.sprint = this.mixer.clipAction(sprintClip);
              this.actions.sprint.setLoop(THREE.LoopRepeat);
              console.log('✅ Sprint animation loaded:', sprintClip.name);
            }
            
            // Set up jump animation
            if (jumpClip) {
              this.actions.jump = this.mixer.clipAction(jumpClip);
              this.actions.jump.setLoop(THREE.LoopOnce);
              console.log('✅ Jump animation loaded:', jumpClip.name);
            }
            
            // Set up attack animation
            if (attackClip) {
              this.actions.attack = this.mixer.clipAction(attackClip);
              this.actions.attack.setLoop(THREE.LoopOnce);
              this.actions.attack.clampWhenFinished = true;
              console.log('✅ Attack animation loaded:', attackClip.name);
            }
            
            // Set up interact animation
            if (interactClip) {
              this.actions.interact = this.mixer.clipAction(interactClip);
              this.actions.interact.setLoop(THREE.LoopOnce);
              this.actions.interact.clampWhenFinished = true;
              console.log('✅ Interact animation loaded:', interactClip.name);
            }
            
            // Set up death animation
            if (deathClip) {
              this.actions.death = this.mixer.clipAction(deathClip);
              this.actions.death.setLoop(THREE.LoopOnce);
              this.actions.death.clampWhenFinished = true;
              console.log('✅ Death animation loaded:', deathClip.name);
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
    
    // Set up collision event listeners for wall sliding
    this.setupCollisionListeners();
  }

  setupCollisionListeners() {
    if (!this.body) return;
    
    // Listen for collision begin events
    this.body.addEventListener('collide', (event) => {
      this.handleCollision(event);
    });
  }

  handleCollision(event) {
    const contact = event.contact;
    const otherBody = event.target === this.body ? event.body : event.target;
    
    // Get the contact normal
    let normal = contact.ni.clone();
    
    // Determine which body is the player and flip normal if needed
    if (event.target === this.body) {
      normal.negate(); // Flip normal to point away from wall toward player
    }
    
    // Skip pure ground/ceiling collisions (handled separately by ground detection)
    // Only reject if normal is very close to vertical
    if (Math.abs(normal.y) > 0.8) {
      return;
    }
    
    // Check if this is a wall or enemy collision
    const isWallOrEnemy = this.isWallOrEnemyBody(otherBody);
    
    if (isWallOrEnemy) {
      // Store wall normal for sliding calculation
      this.addWallNormal(normal);
      
      // Special handling for enemy collisions - add impulse to prevent sticking
      if (otherBody.userData && (otherBody.userData.type === 'enemy' || otherBody.userData.isEnemy)) {
        this.handleEnemyCollision(normal, otherBody);
      }
    }
  }

  handleEnemyCollision(normal, enemyBody) {
    // Apply a small impulse to push player away from enemy
    const pushStrength = 2.0;
    
    // Ensure we have a proper THREE.Vector3 object
    const pushDirection = new THREE.Vector3(normal.x, normal.y, normal.z);
    
    // Only apply horizontal push (don't affect jumping)
    pushDirection.y = 0;
    pushDirection.normalize();
    
    if (pushDirection.length() > 0.1) {
      const pushForce = pushDirection.multiplyScalar(pushStrength);
      this.body.velocity.x += pushForce.x;
      this.body.velocity.z += pushForce.z;
    }
  }

  isWallOrEnemyBody(body) {
    if (!body || !body.userData) return false;
    
    // Check if it's a static body (walls/level geometry)
    if (body.userData.type === 'static') return true;
    
    // Check if it's an enemy body (multiple ways enemies might be identified)
    if (body.userData.type === 'enemy') return true;
    if (body.userData.isEnemy) return true;
    if (body.userData.enemyType) return true;
    
    // Check material type (both material object and material name)
    if (body.material) {
      if (body.material === this.physicsWorld.materials.wall) return true;
      if (body.material === this.physicsWorld.materials.enemy) return true;
      if (body.material.name === 'wall') return true;
      if (body.material.name === 'enemy') return true;
    }
    
    // Check if body belongs to enemy based on mass (enemies typically have specific mass ranges)
    // Be more specific about mass range to avoid false positives
    if (body.mass > 0.5 && body.mass < 10 && body !== this.body) {
      return true; // Likely an enemy
    }
    
    return false;
  }

  addWallNormal(normal) {
    // Store wall normals for sliding (including slightly angled walls)
    // Reject only pure horizontal normals (floors/ceilings)
    if (Math.abs(normal.y) < 0.8) {
      // Convert CANNON.Vec3 to THREE.Vector3 for consistency
      const threeVector = new THREE.Vector3(normal.x, normal.y, normal.z);
      this.wallNormals.push(threeVector);
      
      // Limit stored normals to prevent memory buildup
      if (this.wallNormals.length > 8) {
        this.wallNormals.shift();
      }
    }
  }

  // Combat methods
  performAttack() {
    if (this.isAttacking) {
      console.log('🗡️ Attack blocked - already attacking');
      return false; // Already attacking
    }

    this.isAttacking = true;
    this.lastAttackTime = Date.now();
    
    console.log('🗡️ Player starting attack animation');

    // Play attack animation if available
    if (this.actions.attack) {
      this.playAction(this.actions.attack, 0.1, false);
      
      // Use mixer event listener instead of action event listener
      const onFinished = (event) => {
        if (event.action === this.actions.attack) {
          this.isAttacking = false;
          this.mixer.removeEventListener('finished', onFinished);
          
          // Return to appropriate animation
          if (this.isGrounded) {
            if (this.body && (Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.z) > 0.1)) {
              this.playAction(this.actions.walk);
            } else {
              this.playAction(this.actions.idle);
            }
          }
        }
      };
      
      this.mixer.addEventListener('finished', onFinished);
      
      // Fallback timeout in case event doesn't fire
      setTimeout(() => {
        if (this.isAttacking) {
          this.isAttacking = false;
          console.log('🗡️ Attack finished (timeout fallback)');
        }
      }, this.attackDuration);
    } else {
      console.log('🗡️ No attack animation found - using timer only');
      // No attack animation, just set a timer
      setTimeout(() => {
        this.isAttacking = false;
        console.log('🗡️ Attack finished (no animation)');
      }, this.attackDuration);
    }

    return true;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    console.log(`💔 Player took ${amount} damage, health: ${this.health}/${this.maxHealth}`);
    
    if (this.health <= 0) {
      this.onDeath();
    }
    
    return this.health;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    console.log(`💚 Player healed ${amount} HP, health: ${this.health}/${this.maxHealth}`);
    return this.health;
  }

  onDeath() {
    console.log('💀 Player has died!');
    // Play death animation if available
    if (this.actions.death) {
      this.playAction(this.actions.death, 0.2, false);
    }
    
    // Trigger game death menu after a short delay to let animation start
    if (this.game && this.game.showDeathMenu) {
      setTimeout(() => {
        this.game.showDeathMenu();
      }, 1000); // 1 second delay to let death animation play
    }
  }

  performInteract() {
    if (this.isInteracting) {
      console.log('🤝 Interact blocked - already interacting');
      return false; // Already interacting
    }

    if (this.actions.interact) {
      this.isInteracting = true;
      console.log('🤝 Player starting interact animation');
      
      this.playAction(this.actions.interact, 0.2, false);
      
      // Use mixer event listener to detect when animation finishes
      const onFinished = (event) => {
        if (event.action === this.actions.interact) {
          this.isInteracting = false;
          this.mixer.removeEventListener('finished', onFinished);
          
          console.log('🤝 Interact animation finished');
          
          // Return to appropriate animation
          if (this.isGrounded) {
            if (this.body && (Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.z) > 0.1)) {
              this.playAction(this.actions.walk);
            } else {
              this.playAction(this.actions.idle);
            }
          }
        }
      };
      
      this.mixer.addEventListener('finished', onFinished);
      
      // Fallback timeout in case event doesn't fire (3 seconds max)
      setTimeout(() => {
        if (this.isInteracting) {
          this.isInteracting = false;
          console.log('🤝 Interact finished (timeout fallback)');
          
          // Return to appropriate animation
          if (this.isGrounded) {
            if (this.body && (Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.z) > 0.1)) {
              this.playAction(this.actions.walk);
            } else {
              this.playAction(this.actions.idle);
            }
          }
        }
      }, 3000); // 3 second fallback timeout
      
      return true;
    } else {
      console.log('🤝 No interact animation found');
      return false;
    }
  }

  playAction(action, fadeDuration = 0.3, loop = true) {
    if (!action || action === this.currentAction) return;
    
    if (this.currentAction) {
      this.currentAction.crossFadeTo(action, fadeDuration, false);
    }
    
    action.reset();
    if (loop) {
      action.setLoop(THREE.LoopRepeat);
    } else {
      action.setLoop(THREE.LoopOnce);
    }
    action.play();
    this.currentAction = action;
  }

  /**
   * Lock player movement (e.g., during chest animations)
   */
  lockMovement(reason = 'Animation') {
    this.movementLocked = true;
    this.movementLockReason = reason;
    console.log(`🔒 Player movement locked: ${reason}`);
  }

  /**
   * Unlock player movement
   */
  unlockMovement() {
    this.movementLocked = false;
    console.log(`🔓 Player movement unlocked (was locked for: ${this.movementLockReason})`);
    this.movementLockReason = '';
  }

  /**
   * Check if player movement is currently locked
   */
  isMovementLocked() {
    return this.movementLocked;
  }

  update(delta, input, camOrientation = null, platforms = [], playerActive = true) {
    // Clear wall normals from previous frame
    this.wallNormals = [];
    
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
      this.handleInteractionInput(input);
    }
    
    // Apply wall sliding physics (works even without input)
    this.applyWallSlidingPhysics(delta);
    
    // Clamp Y velocity when on slopes to prevent bouncing
    if (this.isGrounded && this.isOnSlope) {
      // Limit upward velocity when on slopes to prevent being shot into the air
      if (this.body.velocity.y > 2.0) {
        this.body.velocity.y = Math.min(this.body.velocity.y, 2.0);
      }
      // Also prevent excessive downward velocity that might cause jitter
      if (this.body.velocity.y < -5.0) {
        this.body.velocity.y = Math.max(this.body.velocity.y, -5.0);
      }
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
    
    // Check if we're on a slope (for better physics handling)
    this.isOnSlope = this.checkIfOnSlope();
    
    // Reset jumping flag when player lands
    if (this.isGrounded && this.isJumping && this.body.velocity.y <= 0.1) {
      this.isJumping = false;
    }
  }

  /**
   * Check if the player is standing on a sloped surface
   */
  checkIfOnSlope() {
    const contacts = this.physicsWorld.getContactsForBody(this.body);
    
    for (const contact of contacts) {
      // Get the contact normal
      let normalY;
      if (contact.bi === this.body) {
        normalY = -contact.ni.y;
      } else {
        normalY = contact.ni.y;
      }
      
      // If normal Y is between slope threshold and grounded threshold, we're on a slope
      if (normalY > this.groundNormalThreshold && normalY < 0.9) {
        // Debug logging for slope detection
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
          console.log(`🏔️ Player on slope - Normal Y: ${normalY.toFixed(3)}`);
        }
        return true;
      }
    }
    
    return false;
  }

  handleMovementInput(input, camOrientation, delta) {
    if (!input || !input.isKey) {
      return;
    }
    
    if (!this.body) {
      return;
    }

    // Check if movement is locked (e.g., during chest animations)
    if (this.movementLocked) {
      // Stop any existing movement when locked
      this.body.velocity.x = 0;
      this.body.velocity.z = 0;
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
      let targetVelX = moveDirection.x * targetSpeed;
      let targetVelZ = moveDirection.z * targetSpeed;
      
      // Apply wall sliding if enabled and there are wall collisions
      if (this.enableWallSliding && this.wallNormals.length > 0) {
        const slidingVelocity = this.calculateSlidingVelocity(
          new THREE.Vector3(targetVelX, 0, targetVelZ),
          this.wallNormals
        );
        targetVelX = slidingVelocity.x;
        targetVelZ = slidingVelocity.z;
      }
      
      // Apply movement based on grounded state
      if (this.isGrounded) {
        if (this.isOnSlope) {
          // On slopes, use force-based movement to work better with contact resolution
          const forceMultiplier = 75; // Increased force for better responsiveness
          const maxSpeed = targetSpeed * 1.1; // Slightly faster on slopes to compensate for force-based movement
          
          // Apply forces instead of direct velocity to let physics handle slope interaction
          const currentSpeed = Math.sqrt(this.body.velocity.x * this.body.velocity.x + this.body.velocity.z * this.body.velocity.z);
          if (currentSpeed < maxSpeed) {
            this.body.applyForce(
              new CANNON.Vec3(targetVelX * forceMultiplier, 0, targetVelZ * forceMultiplier),
              this.body.position
            );
          }
          
          // Apply gentle damping to prevent excessive speed buildup
          this.body.velocity.x *= 0.95; // Reduced damping for better speed retention
          this.body.velocity.z *= 0.95;
        } else {
          // On flat ground, use direct velocity for stable movement
          this.body.velocity.x = targetVelX;
          this.body.velocity.z = targetVelZ;
        }
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
        // Reduced damping when airborne - let wall sliding handle this
        if (this.wallNormals.length > 0) {
          // Light damping when against walls to allow sliding
          this.body.velocity.x *= 0.95;
          this.body.velocity.z *= 0.95;
        } else {
          // Normal air resistance when not touching walls
          this.body.velocity.x *= 0.8;
          this.body.velocity.z *= 0.8;
        }
      }
    }
  }

  applyWallSlidingPhysics(delta) {
    // Only apply wall sliding physics when touching walls
    if (!this.enableWallSliding || this.wallNormals.length === 0) {
      return;
    }

    // Get current velocity
    const currentVel = this.body.velocity.clone();
    
    // Calculate wall sliding for current velocity
    const slidingVelocity = this.calculateSlidingVelocity(
      new THREE.Vector3(currentVel.x, 0, currentVel.z), // Only horizontal components
      this.wallNormals
    );
    
    // Apply sliding to horizontal velocity with stronger effect for enemies
    const slidingStrength = 1.2; // Stronger sliding effect
    this.body.velocity.x = THREE.MathUtils.lerp(this.body.velocity.x, slidingVelocity.x, slidingStrength * delta * 60);
    this.body.velocity.z = THREE.MathUtils.lerp(this.body.velocity.z, slidingVelocity.z, slidingStrength * delta * 60);
    
    // Add small downward slide when airborne and against walls
    if (!this.isGrounded && this.wallNormals.length > 0) {
      // Calculate average wall normal
      let avgNormal = new THREE.Vector3();
      for (const normal of this.wallNormals) {
        avgNormal.add(normal);
      }
      avgNormal.divideScalar(this.wallNormals.length).normalize();
      
      // Add slight downward sliding along the wall
      const wallSlideSpeed = this.wallSlideSpeed; // Use configurable speed
      const tangentVector = new THREE.Vector3();
      
      // Calculate tangent vector (perpendicular to wall normal, pointing down)
      const up = new THREE.Vector3(0, 1, 0);
      tangentVector.crossVectors(avgNormal, up).normalize();
      
      // If the cross product is near zero, use a different approach
      if (tangentVector.length() < 0.1) {
        // Wall is nearly horizontal, slide in the direction of current horizontal velocity
        const horizontalVel = new THREE.Vector3(currentVel.x, 0, currentVel.z);
        if (horizontalVel.length() > 0.1) {
          tangentVector.copy(horizontalVel.normalize());
        }
      }
      
      // Apply wall sliding force with stronger effect for enemy collisions
      if (tangentVector.length() > 0.1) {
        const slideForce = tangentVector.multiplyScalar(wallSlideSpeed);
        this.body.velocity.x += slideForce.x * delta * 2; // Doubled for enemies
        this.body.velocity.z += slideForce.z * delta * 2;
      }
      
      // Reduce vertical velocity when sliding against walls (friction effect)
      if (this.body.velocity.y < 0) {
        this.body.velocity.y *= 0.98; // Less friction for smoother sliding
      }
    }
  }

  handleJumpInput(input) {
    if (!input || !input.isKey) return;
    
    // Check if movement is locked (prevent jumping during animations)
    if (this.movementLocked) {
      return;
    }
    
    if (input.isKey('Space')) {
      if (this.isGrounded && !this.isJumping) {
        // Apply upward impulse for jumping
        this.body.velocity.y = this.jumpStrength;
        this.isJumping = true;
      }
    }
  }

  handleInteractionInput(input) {
    if (!input || !input.isKey) return;
    
    // Use 'E' key for interaction
    if (input.isKey('KeyE')) {
      // Add a small delay to prevent rapid triggering
      const currentTime = Date.now();
      if (currentTime - (this.lastInteractionTime || 0) > 500) { // 500ms cooldown
        this.lastInteractionTime = currentTime;
        this.performInteract();
      }
    }
  }

  syncMeshWithBody() {
    if (!this.body) return;
    
    // Sync Y-axis rotation from mesh to physics body while keeping it upright
    // This ensures the collider rotates with the player's facing direction
    const meshRotationY = this.mesh.rotation.y;
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), meshRotationY);
    
    // Calculate offset position in world space
    const offset = new THREE.Vector3(
      this.colliderOffset.x,
      this.colliderOffset.y, 
      this.colliderOffset.z
    );
    
    // Rotate offset by mesh rotation to get world space offset
    offset.applyEuler(new THREE.Euler(0, meshRotationY, 0));
    
    // Position mesh relative to physics body with offset
    // Mesh position = Physics body position - offset (so physics body is offset from mesh)
    this.mesh.position.copy(this.body.position);
    this.mesh.position.sub(offset);
  }

  updateAnimations(delta) {
    if (!this.mixer) return;
    
    // Update animation mixer
    this.mixer.update(delta);
    
    // Skip animation changes during attack or interaction
    if (this.isAttacking || this.isInteracting) return;
    
    // Determine which animation to play
    const velocity = this.body.velocity;
    const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    const isMoving = horizontalSpeed > 0.1;
    
    let targetAction = null;
    
    // Priority order: jump -> sprint -> walk -> idle
    if (!this.isGrounded && this.actions.jump) {
      targetAction = this.actions.jump;
    } else if (isMoving && this.isSprinting && this.actions.sprint) {
      targetAction = this.actions.sprint;
    } else if (isMoving && this.actions.walk) {
      targetAction = this.actions.walk;
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

  getPosition() {
    if (!this.body) return new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
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

  // Method to update collider offset at runtime
  updateColliderOffset(offsetX, offsetY, offsetZ) {
    if (offsetX !== undefined) this.colliderOffset.x = offsetX;
    if (offsetY !== undefined) this.colliderOffset.y = offsetY;
    if (offsetZ !== undefined) this.colliderOffset.z = offsetZ;
    
    console.log(`🔧 Updated collider offset: (${this.colliderOffset.x.toFixed(2)}, ${this.colliderOffset.y.toFixed(2)}, ${this.colliderOffset.z.toFixed(2)})`);
  }

  calculateSlidingVelocity(desiredVelocity, wallNormals) {
    if (!wallNormals || wallNormals.length === 0) {
      return desiredVelocity;
    }

    let slidingVelocity = desiredVelocity.clone();

    // Apply sliding for each wall normal
    for (const normal of wallNormals) {
      // Project the desired velocity onto the wall surface
      // Formula: v_slide = v_desired - (v_desired · n) * n
      // Where n is the wall normal
      
      const dotProduct = slidingVelocity.dot(normal);
      
      // Only slide if moving into the wall (positive dot product)
      if (dotProduct > 0.01) { // Small threshold to prevent jitter
        const projectionOntoNormal = normal.clone().multiplyScalar(dotProduct);
        slidingVelocity.sub(projectionOntoNormal);
      }
    }

    // Apply smoothing and speed retention to make sliding feel more natural
    const originalLength = desiredVelocity.length();
    const slidingLength = slidingVelocity.length();
    
    if (slidingLength > 0.01 && originalLength > 0.01) {
      // Maintain more of the original speed when sliding
      // Reduce speed loss based on number of walls and angle
      const speedRetention = THREE.MathUtils.lerp(
        0.7, // Minimum speed retention
        this.wallSlideSmoothing, 
        Math.min(wallNormals.length / 3, 1) // More walls = more speed loss
      );
      
      const targetLength = originalLength * speedRetention;
      slidingVelocity.normalize().multiplyScalar(targetLength);
    }

    return slidingVelocity;
  }

  // Debug method to visualize wall normals
  debugWallNormals() {
    console.log('Current wall normals:');
    this.wallNormals.forEach((normal, index) => {
      console.log(`  ${index}: (${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)})`);
    });
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