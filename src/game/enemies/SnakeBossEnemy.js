import { EnemyBase } from './EnemyBase.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SnakeBossEnemy extends EnemyBase {
  constructor(scene, physicsWorld, options = {}) {
    // Boss-specific defaults with high health
    const bossOptions = {
      speed: options.speed ?? 2.5, // Faster than regular snake
      health: options.health ?? 500, // Boss health - very high
      size: [1.5, 0.8, 3.0], // Larger than regular snake
      colliderSize: [3.0, 1.8, 3.0], // Bigger collision box with increased height
      modelUrl: 'src/assets/enemies/snake_boss/Snake_Angry.gltf',
      ...options
    };

    super(scene, physicsWorld, bossOptions);
    
    // Boss-specific properties
    this.enemyType = 'snake_boss';
    this.isBoss = true;
    this.attackRange = 2.5; // Reduced attack range for better balance
    this.chaseRange = options.chaseRange ?? 12.0; // Much wider detection range
    this.patrolSpeed = 1.2;
    this.chaseSpeed = 2.8; // Fast chase speed
    this.attackCooldown = 3500; // Increased cooldown for more strategic gameplay (3.5 seconds)
    this.lastAttackTime = Date.now() - this.attackCooldown; // Allow immediate first attack
    this.attackStartTime = null; // Track when attack animation started
    this.attackDuration = 1500; // How long to stay in attack state for animation (adjusted for normal speed)
    
    // Grace period system for fairer combat
    this.attackGracePeriod = 800; // 0.8 seconds grace period before first attack (reduced)
    this.graceStartTime = null; // Track when grace period started
    this.hasGracePeriod = true; // Whether boss should use grace period
    
    // Boss behavior states
    this.behaviorState = 'patrol'; // 'patrol', 'chase', 'attack', 'pre_attack', 'enraged', 'jump_attack'
    this.patrolPoints = options.patrolPoints || [];
    this.currentPatrolIndex = 0;
    this.patrolDirection = 1;
    this.stateTimer = 0;
    
    // Boss-specific mechanics
    this.enrageThreshold = this.maxHealth * 0.3; // Enrage at 30% health
    this.isEnraged = false;
    this.jumpAttackCooldown = 5000; // 5 seconds between jump attacks
    this.lastJumpAttackTime = 0;
    this.jumpAttackStartTime = null; // Track when jump attack started
    this.jumpAttackDuration = 1200; // Jump attack animation duration (normal speed)
    this.multiAttackCount = 0;
    this.maxMultiAttacks = 3; // Can do 3 consecutive attacks when enraged
    
    // Store initial spawn position for reset purposes
    this.initialPosition = options.position ? 
      new THREE.Vector3(options.position[0], options.position[1], options.position[2]) :
      new THREE.Vector3(0, 2, 0);
    
    // Boss-specific animations (using the provided animation names)
    this.bossAnimations = {
      idle: null,       // Snake_Idle
      walk: null,       // Snake_Walk
      attack: null,     // Snake_Attack
      jump: null,       // Snake_Jump
      death: null       // Snake_Death
    };
    
    // Enhanced health bar for boss
    this.healthBarAlwaysVisible = true; // Use different property name
    this.healthBarSize = { width: 2.0, height: 0.25 }; // Larger health bar
    
    console.log(`👑 SnakeBossEnemy created with health: ${this.health}, speed: ${this.speed}`);
    console.log(`👑 Boss enrage threshold: ${this.enrageThreshold}`);
  }

  // Override physics body creation for larger boss
  _createPhysicsBody() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
    }
    
    // Create boss physics body with higher mass
    this.body = this.physicsWorld.createDynamicBody({
      mass: 5.0, // Much heavier than regular enemies
      shape: 'box',
      size: this.colliderSize,
      position: [this.mesh.position.x, this.mesh.position.y, this.mesh.position.z],
      material: 'enemy'
    });
    
    // Configure boss-specific physics properties
    this.body.linearDamping = 0.4; // Less damping for more aggressive movement
    this.body.angularDamping = 0.95;
    this.body.allowSleep = false;
    this.body.fixedRotation = true; // Prevent tipping
    this.body.updateMassProperties();
    
    // Enhanced physics material for boss
    this.body.material.friction = 0.6;
    this.body.material.restitution = 0.1;
    
    // Set proper userData
    this.body.userData = { 
      type: 'enemy',
      isEnemy: true,
      isBoss: true,
      enemyType: this.enemyType || 'snake_boss'
    };
    
    console.log(`👑 Created boss physics body at [${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z}]`);
  }

  // Override health bar creation for boss-sized health bar
  _createHealthBar() {
    console.log(`👑 Creating boss health bar for ${this.constructor.name}`);
    
    // Create health bar group that will float above the boss
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.y = this.size[1] + 0.8; // Higher above boss
    this.healthBarGroup.visible = this.healthBarAlwaysVisible || false; // Use the correct property
    
    // Set the healthBarVisible flag for the parent class
    this.healthBarVisible = this.healthBarAlwaysVisible || false;
    
    // Larger health bar background
    const bgGeometry = new THREE.PlaneGeometry(this.healthBarSize.width, this.healthBarSize.height);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarGroup.add(this.healthBarBg);
    
    // Boss health bar fill (red for boss)
    const fillGeometry = new THREE.PlaneGeometry(this.healthBarSize.width * 0.9, this.healthBarSize.height * 0.7);
    const fillMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, // Red for boss
      transparent: true, 
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
    this.healthBarFill.position.z = 0.001;
    this.healthBarGroup.add(this.healthBarFill);
    
    // Add boss title text (optional enhancement)
    this.mesh.add(this.healthBarGroup);
    
    console.log(`👑 Boss health bar created and always visible`);
  }

  // Override model loading to handle boss-specific animations
  _loadModel(url) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      // Clear existing mesh children
      while (this.mesh.children.length > 0) {
        this.mesh.remove(this.mesh.children[0]);
      }

      // Compute bbox and center
      try {
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        this.size = [sizeVec.x, sizeVec.y, sizeVec.z];
        
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        gltf.scene.position.sub(center);
        gltf.scene.position.y += sizeVec.y / 2;

        // Scale up the boss model
        const scale = 1.5; // Make boss 50% larger
        gltf.scene.scale.set(scale, scale, scale);
        
        this.mesh.add(gltf.scene);
        
        // Setup boss animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          
          // Map the provided animation names to our boss animations
          gltf.animations.forEach(clip => {
            const action = this.mixer.clipAction(clip);
            
            switch (clip.name) {
              case 'Snake_Idle':
                this.bossAnimations.idle = action;
                this.actions.idle = action; // Also map to base class
                break;
              case 'Snake_Walk':
                this.bossAnimations.walk = action;
                this.actions.walk = action;
                break;
              case 'Snake_Attack':
                this.bossAnimations.attack = action;
                this.actions.attack = action;
                // Keep normal attack speed since we fixed the cutoff issue
                break;
              case 'Snake_Jump':
                this.bossAnimations.jump = action;
                // Keep normal jump speed
                break;
              case 'Snake_Death':
                this.bossAnimations.death = action;
                break;
              default:
                console.log(`👑 Unknown boss animation: ${clip.name}`);
            }
          });
          
          // Start with idle animation
          if (this.bossAnimations.idle) {
            this.bossAnimations.idle.play();
            this.currentAction = this.bossAnimations.idle;
          }
          
          console.log(`👑 Boss animations loaded:`, Object.keys(this.bossAnimations).filter(key => this.bossAnimations[key]));
        }
        
        // Create health bar after mesh is ready
        this._createHealthBar();
        
        console.log(`👑 Boss model loaded successfully with scale ${scale}`);
      } catch (error) {
        console.error('👑 Error processing boss model:', error);
      }
    }, undefined, (error) => {
      console.error('👑 Error loading boss model:', error);
    });
  }

  // Enhanced AI behavior for boss
  update(deltaTime, player) {
    if (!this.alive || !this.body || !player) return;

    // Call parent update but skip animation handling (we'll do it ourselves)
    const originalMixer = this.mixer;
    this.mixer = null; // Temporarily disable base class animation updates
    super.update(deltaTime, player);
    this.mixer = originalMixer; // Restore mixer

    // Check for enrage state
    if (!this.isEnraged && this.health <= this.enrageThreshold) {
      this._enterEnrageMode();
    }

    // Enhanced boss AI
    this._updateBossAI(deltaTime, player);
    
    // Handle boss animations ourselves (after AI updates)
    this._updateBossAnimations(deltaTime);
  }

  _enterEnrageMode() {
    this.isEnraged = true;
    this.speed *= 1.5; // Increase speed when enraged
    this.attackCooldown *= 0.7; // Faster attacks
    this.chaseSpeed *= 1.3;
    
    // Change health bar color to indicate enrage
    if (this.healthBarFill) {
      this.healthBarFill.material.color.setHex(0xff4444); // Brighter red
    }
    
    console.log(`👑 BOSS ENRAGED! Health: ${this.health}/${this.maxHealth}`);
  }

  _updateBossAI(deltaTime, player) {
    const distanceToPlayer = this.mesh.position.distanceTo(player.mesh.position);
    const currentTime = Date.now();

    // Debug logging for boss AI
    if (Math.random() < 0.01) { // Log occasionally to avoid spam
      console.log(`👑 Boss AI: State=${this.behaviorState}, Distance=${distanceToPlayer.toFixed(2)}, AttackRange=${this.attackRange}`);
    }

    // Boss-specific behavior logic
    switch (this.behaviorState) {
      case 'patrol':
        if (distanceToPlayer <= this.chaseRange) {
          this.behaviorState = 'chase';
          this.stateTimer = 0;
          console.log(`👑 Boss detected player! Switching to chase mode. Distance: ${distanceToPlayer.toFixed(2)}`);
        } else {
          this._patrol(deltaTime);
        }
        break;

      case 'chase':
        if (distanceToPlayer > this.chaseRange * 1.5) {
          this.behaviorState = 'patrol';
          this.graceStartTime = null; // Reset grace period
          console.log(`👑 Boss lost player. Returning to patrol.`);
        } else if (distanceToPlayer <= this.attackRange) {
          // Check if we need grace period before attacking
          if (this.hasGracePeriod && !this.graceStartTime) {
            // Start grace period
            this.graceStartTime = currentTime;
            this.behaviorState = 'pre_attack';
            console.log(`👑 Boss in attack range, starting grace period (${this.attackGracePeriod}ms)`);
          } else if (!this.hasGracePeriod || (this.graceStartTime && currentTime - this.graceStartTime > this.attackGracePeriod)) {
            // Grace period completed or not needed, proceed with attack
            if (currentTime - this.lastAttackTime > this.attackCooldown) {
              // Boss can do jump attacks or regular attacks
              if (this.isEnraged && 
                  currentTime - this.lastJumpAttackTime > this.jumpAttackCooldown &&
                  Math.random() < 0.4) {
                this.behaviorState = 'jump_attack';
                console.log(`👑 Boss initiating jump attack!`);
              } else {
                this.behaviorState = 'attack';
                console.log(`👑 Boss initiating attack! Distance: ${distanceToPlayer.toFixed(2)}, AttackRange: ${this.attackRange}`);
              }
              this.graceStartTime = null; // Reset grace period
            }
          }
        } else {
          this._chasePlayer(player);
          this.graceStartTime = null; // Reset grace period if player moves away
        }
        break;

      case 'pre_attack':
        // Grace period state - boss pauses before attacking
        const graceTimeRemaining = this.attackGracePeriod - (currentTime - this.graceStartTime);
        
        if (distanceToPlayer > this.attackRange * 1.2) {
          // Player moved away during grace period
          this.behaviorState = 'chase';
          this.graceStartTime = null;
          console.log(`👑 Player escaped during grace period, returning to chase`);
        } else if (graceTimeRemaining <= 0) {
          // Grace period ended, check if we can attack
          if (currentTime - this.lastAttackTime > this.attackCooldown) {
            if (this.isEnraged && 
                currentTime - this.lastJumpAttackTime > this.jumpAttackCooldown &&
                Math.random() < 0.4) {
              this.behaviorState = 'jump_attack';
              console.log(`👑 Grace period ended, boss initiating jump attack!`);
            } else {
              this.behaviorState = 'attack';
              console.log(`👑 Grace period ended, boss initiating attack!`);
            }
          } else {
            // Still on cooldown, go back to chase
            this.behaviorState = 'chase';
            console.log(`👑 Grace period ended but attack on cooldown, returning to chase`);
          }
          this.graceStartTime = null;
        } else {
          // Still in grace period, stay still and show warning
          if (Math.random() < 0.02) { // Occasional logging to avoid spam
            console.log(`👑 ⚠️  BOSS PREPARING TO ATTACK: ${graceTimeRemaining.toFixed(0)}ms remaining ⚠️`);
          }
          // Boss stays still during grace period - no movement commands
        }
        break;

      case 'attack':
        this._performAttack(player);
        break;

      case 'jump_attack':
        this._performJumpAttack(player);
        break;
    }

    this.stateTimer += deltaTime;
  }

  _performJumpAttack(player) {
    const currentTime = Date.now();
    
    if (currentTime - this.lastJumpAttackTime > this.jumpAttackCooldown) {
      // Play jump animation
      if (this.bossAnimations.jump) {
        this._playAnimation(this.bossAnimations.jump, false);
      }
      
      // Apply jump force
      if (this.body) {
        const jumpForce = 15;
        this.body.velocity.y = jumpForce;
        
        // Add forward momentum toward player
        const direction = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
        direction.normalize();
        this.body.velocity.x += direction.x * 8;
        this.body.velocity.z += direction.z * 8;
      }
      
      this.lastJumpAttackTime = currentTime;
      this.jumpAttackStartTime = currentTime;
      this.jumpAttackDuration = 1200; // Jump attack duration at normal speed
      
      console.log(`👑 Boss performed jump attack!`);
    } else if (this.jumpAttackStartTime && (currentTime - this.jumpAttackStartTime > this.jumpAttackDuration)) {
      // Jump attack animation completed
      this.behaviorState = 'chase';
      this.jumpAttackStartTime = null;
      console.log(`👑 Jump attack completed, returning to chase`);
    }
  }

  _performAttack(player) {
    const currentTime = Date.now();
    
    console.log(`👑 _performAttack called. Time since last attack: ${currentTime - this.lastAttackTime}ms, Cooldown: ${this.attackCooldown}ms`);
    
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      console.log(`👑 Attack cooldown met! Executing attack...`);
      
      // Play attack animation
      if (this.bossAnimations.attack) {
        this._playAnimation(this.bossAnimations.attack, false);
        console.log(`👑 Playing attack animation`);
      } else {
        console.log(`👑 Warning: No attack animation available`);
      }
      
      // Boss deals more damage
      const damage = this.isEnraged ? 25 : 15;
      const distanceToPlayer = this.mesh.position.distanceTo(player.mesh.position);
      
      console.log(`👑 Attack range check: Distance=${distanceToPlayer.toFixed(2)}, AttackRange=${this.attackRange}`);
      
      if (distanceToPlayer <= this.attackRange) {
        console.log(`👑 Boss attacks player for ${damage} damage!`);
        // Properly call player damage system
        if (player.takeDamage) {
          player.takeDamage(damage);
          console.log(`👑 Boss successfully dealt ${damage} damage to player!`);
        } else {
          console.log(`👑 Warning: Player has no takeDamage method!`);
        }
      } else {
        console.log(`👑 Player out of attack range: ${distanceToPlayer.toFixed(2)} > ${this.attackRange}`);
      }
      
      this.lastAttackTime = currentTime;
      this.multiAttackCount++;
      
      // Disable grace period after first attack (boss gets more aggressive)
      if (this.hasGracePeriod) {
        this.hasGracePeriod = false;
        console.log(`👑 Boss grace period disabled - no more mercy!`);
      }
      
      // Set attack duration - stay in attack state for animation to complete
      this.attackStartTime = currentTime;
      this.attackDuration = 1500; // 1.5 seconds for animation to complete at normal speed
      
      // Don't immediately change state - let the animation play
      console.log(`👑 Attack started, staying in attack state for ${this.attackDuration}ms`);
      
    } else if (this.attackStartTime && (currentTime - this.attackStartTime > this.attackDuration)) {
      // Attack animation has finished, now we can transition
      console.log(`👑 Attack animation completed, transitioning states...`);
      
      // Enraged boss can chain attacks
      if (this.isEnraged && this.multiAttackCount < this.maxMultiAttacks) {
        this.attackCooldown = 1500; // Chained attacks still faster but increased from 1000ms
        console.log(`👑 Boss chains another attack (${this.multiAttackCount}/${this.maxMultiAttacks})`);
        // Reset for next attack in chain
        this.attackStartTime = null;
      } else {
        this.attackCooldown = this.isEnraged ? 2800 : 3500; // Increased cooldowns - enraged: 2.8s, normal: 3.5s
        this.multiAttackCount = 0;
        this.behaviorState = 'chase';
        this.attackStartTime = null;
        console.log(`👑 Boss attack sequence complete, returning to chase`);
      }
    } else {
      console.log(`👑 Attack on cooldown. Time remaining: ${this.attackCooldown - (currentTime - this.lastAttackTime)}ms`);
      // If we've been in attack state for too long without attacking, go back to chase
      // Increased timeout to accommodate slower attack animation
      if (this.stateTimer > 3.0) {
        console.log(`👑 Attack state timeout, returning to chase`);
        this.behaviorState = 'chase';
        this.stateTimer = 0;
      }
    }
  }

  _playAnimation(action, loop = true) {
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(0.2); // Faster fade for more responsive transitions
    }
    
    if (action) {
      action.reset();
      action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
      action.fadeIn(0.2); // Faster fade in
      action.play();
      this.currentAction = action;
      
      // Log animation details for debugging
      console.log(`👑 Playing animation: ${action._clip?.name || 'unknown'}, Loop: ${loop}, TimeScale: ${action.timeScale}`);
    }
  }

  _updateBossAnimations(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Don't override animations during attack states
    if (this.behaviorState === 'attack' || this.behaviorState === 'jump_attack') {
      console.log(`👑 Preserving ${this.behaviorState} animation, skipping auto-animation updates`);
      return;
    }

    // Update animation based on state for non-attack behaviors
    const currentSpeed = new THREE.Vector3(
      this.body?.velocity.x || 0,
      0,
      this.body?.velocity.z || 0
    ).length();

    let targetAnimation = null;

    // Handle pre_attack state with idle animation (menacing pause)
    if (this.behaviorState === 'pre_attack') {
      targetAnimation = this.bossAnimations.idle; // Stay still during grace period
    } else if (currentSpeed > 0.5) {
      targetAnimation = this.bossAnimations.walk;
    } else {
      targetAnimation = this.bossAnimations.idle;
    }

    if (targetAnimation && targetAnimation !== this.currentAction) {
      this._playAnimation(targetAnimation);
    }
  }

  // Override death to play death animation
  takeDamage(amount) {
    const wasDead = !this.alive;
    super.takeDamage(amount);
    
    if (!wasDead && !this.alive) {
      // Play death animation
      if (this.bossAnimations.death) {
        this._playAnimation(this.bossAnimations.death, false);
      }
      console.log(`👑 BOSS DEFEATED!`);
    }
  }

  // Boss-specific patrol behavior (more aggressive)
  _patrol(deltaTime) {
    if (this.patrolPoints.length === 0) return;

    const targetPoint = this.patrolPoints[this.currentPatrolIndex];
    const targetPosition = new THREE.Vector3(targetPoint[0], this.mesh.position.y, targetPoint[2]);
    const distance = this.mesh.position.distanceTo(targetPosition);

    if (distance < 1.5) {
      // Reached patrol point, move to next
      this.currentPatrolIndex += this.patrolDirection;
      
      if (this.currentPatrolIndex >= this.patrolPoints.length) {
        this.currentPatrolIndex = this.patrolPoints.length - 1;
        this.patrolDirection = -1;
      } else if (this.currentPatrolIndex < 0) {
        this.currentPatrolIndex = 0;
        this.patrolDirection = 1;
      }
    } else {
      // Move toward patrol point
      const direction = new THREE.Vector3().subVectors(targetPosition, this.mesh.position);
      direction.normalize();
      
      const moveForce = this.patrolSpeed * 2; // Boss patrols faster
      this._desiredMovement.copy(direction).multiplyScalar(moveForce);
      this._applyMovement();
    }
  }

  _chasePlayer(player) {
    const direction = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
    direction.normalize();
    
    const moveForce = this.chaseSpeed;
    this._desiredMovement.copy(direction).multiplyScalar(moveForce);
    this._applyMovement();
  }

  _applyMovement() {
    if (!this.body) return;

    // Enhanced movement for boss
    const force = new CANNON.Vec3(
      this._desiredMovement.x * 3, // Stronger forces
      0,
      this._desiredMovement.z * 3
    );
    
    this.body.applyForce(force, this.body.position);
  }

  dispose() {
    super.dispose();
    console.log(`👑 Boss enemy disposed`);
  }
}