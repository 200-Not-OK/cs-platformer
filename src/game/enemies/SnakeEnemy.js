import { EnemyBase } from './EnemyBase.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SnakeEnemy extends EnemyBase {
  constructor(scene, physicsWorld, options = {}) {
    // Snake-specific defaults
    const snakeOptions = {
      speed: options.speed ?? 1.5, // Slower than other enemies
      health: options.health ?? 35, // Moderate health
      size: [0.8, 0.4, 2.0], // Long and low profile
      colliderSize: [0.8, 0.4, 1.8], // Slightly larger collider for better hit detection
      ...options
    };

    super(scene, physicsWorld, snakeOptions);
    
    // Snake-specific properties
    this.enemyType = 'snake';
    this.attackRange = 2.5; // Increased attack range to account for collider sizes
    this.chaseRange = options.chaseRange ?? 6.0;
    this.patrolSpeed = 0.8;
    this.chaseSpeed = 1.7; // Reduced from 2.2 to make chase less aggressive
    this.attackCooldown = 2500; // 2.5 seconds between attacks
    this.lastAttackTime = 0;
    
    // Snake behavior states
    this.behaviorState = 'patrol'; // 'patrol', 'chase', 'attack', 'retreat'
    this.patrolPoints = options.patrolPoints || [];
    this.currentPatrolIndex = 0;
    this.patrolDirection = 1;
    this.stateTimer = 0;
    
    // Snake-specific animations
    this.snakeAnimations = {
      slither: null,    // Normal movement (walk equivalent)
      slitherFast: null, // Fast movement (run equivalent)
      strike: null,     // Attack animation
      coil: null,       // Idle/defensive animation
      hiss: null        // Threat display
    };
    
    console.log(`🐍 SnakeEnemy created with health: ${this.health}, speed: ${this.speed}`);
  }

  // Override physics body creation to allow rotation for snake
  _createPhysicsBody() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
    }
    
    // Create snake physics body that can rotate
    this.body = this.physicsWorld.createDynamicBody({
      mass: 1.0,
      shape: 'box',
      size: this.colliderSize,
      position: [this.mesh.position.x, this.mesh.position.y, this.mesh.position.z],
      material: 'enemy'
    });
    
    // Configure snake-specific physics properties
    this.body.linearDamping = 0.05;
    this.body.angularDamping = 0.8; // Allow some rotation but with damping
    this.body.allowSleep = false;
    
    // Allow rotation for the snake (unlike other enemies)
    this.body.fixedRotation = false; // Enable rotation
    this.body.updateMassProperties();
    
    // Physics material settings
    this.body.material.friction = 0.1;
    this.body.material.restitution = 0.0;
    
    // Set proper userData
    this.body.userData = { 
      type: 'enemy',
      isEnemy: true,
      enemyType: this.enemyType || 'snake'
    };
    
    console.log(`🐍 Created snake physics body with rotation enabled at [${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z}]`);
  }

  // Override model loading to handle snake-specific animations
  _loadModel(url) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      // Call parent's model loading logic first
      while (this.mesh.children.length > 0) this.mesh.remove(this.mesh.children[0]);

      // compute bbox and center like Parent class
      try {
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        this.size = [sizeVec.x, sizeVec.y, sizeVec.z];
        this.colliderSize = [sizeVec.x * 0.5, sizeVec.y, sizeVec.z * 0.5];

        const centerX = (bbox.max.x + bbox.min.x) / 2;
        const centerZ = (bbox.max.z + bbox.min.z) / 2;
        const centerY = (bbox.max.y + bbox.min.y) / 2;
        gltf.scene.position.x -= centerX;
        gltf.scene.position.z -= centerZ;
        gltf.scene.position.y -= centerY;
        
        // Recreate physics body with new size
        this._createPhysicsBody();
      } catch (e) {
        console.warn('Snake enemy bbox calculation failed:', e);
      }

      this.mesh.add(gltf.scene);

      // Handle animations like the base class, but with snake-specific mapping
      if (gltf.animations && gltf.animations.length > 0) {
        try {
          this.mixer = new THREE.AnimationMixer(gltf.scene);
          console.log(`🐍 Snake GLTF loaded with ${gltf.animations.length} animations`);
          
          // Log all available animations in detail
          gltf.animations.forEach((clip, index) => {
            console.log(`🐍 Animation ${index}: "${clip.name}" - Duration: ${clip.duration}s, Tracks: ${clip.tracks.length}`);
          });
          
          // Map snake-specific animation names first
          this._mapSnakeAnimations(gltf.animations);
          
          // Ensure at least one action is playing
          if (this.snakeAnimations.coil) {
            console.log('🐍 Starting with coil (idle) animation');
            this._playAction(this.snakeAnimations.coil);
          } else if (this.actions.idle) {
            console.log('🐍 Starting with fallback idle animation');
            this._playAction(this.actions.idle);
          } else {
            console.warn('🐍 No idle animation available to start with');
          }
        } catch (e) {
          console.warn('🐍 Snake animation setup failed:', e);
        }
      } else {
        console.warn('🐍 No animations found in snake GLTF model');
      }
    }, undefined, (error) => {
      console.error('Failed to load snake model:', error);
    });
  }

  _mapSnakeAnimations(gltfAnimations) {
    if (!this.mixer) {
      console.warn('🐍 Cannot map animations: mixer not available');
      return;
    }

    // Use the passed GLTF animations instead of trying to get them from mixer._root
    const animations = gltfAnimations || [];
    console.log(`🐍 Starting animation mapping for ${animations.length} available animations:`);
    
    // Log each animation with its properties
    animations.forEach((clip, index) => {
      console.log(`🐍   [${index}] "${clip.name}":`, {
        duration: clip.duration,
        tracks: clip.tracks.length,
        trackNames: clip.tracks.map(track => track.name)
      });
    });

    // Map snake animations using the actual GLTF animation names
    const animationMappings = {
      slither: ['SnakeBones|SnakeMove2'],
      slitherFast: ['SnakeBones|SnakeMove1',],
      strike: ['SnakeBones|SnakeAttack1'],
      coil: ['SnakeBones|SnakeSearch.001'],
      hiss: ['SnakeBones|SnakeSearch.001']
    };

    console.log('🐍 Animation mapping attempts:');
    for (const [snakeAction, possibleNames] of Object.entries(animationMappings)) {
      console.log(`🐍 Looking for ${snakeAction} animation using names:`, possibleNames);
      
      let foundAnimation = false;
      for (const name of possibleNames) {
        const clip = THREE.AnimationClip.findByName(animations, name);
        if (clip) {
          this.snakeAnimations[snakeAction] = this.mixer.clipAction(clip);
          this.snakeAnimations[snakeAction].setLoop(THREE.LoopRepeat);
          console.log(`🐍 ✅ Successfully mapped ${snakeAction} to animation: "${name}"`);
          foundAnimation = true;
          break;
        }
      }
      
      if (!foundAnimation) {
        console.log(`🐍 ❌ No animation found for ${snakeAction}`);
      }
    }

    // Also map to base class actions for compatibility
    console.log('🐍 Mapping to base class actions:');
    const baseMapping = {
      idle: this.snakeAnimations.coil,
      walk: this.snakeAnimations.slither,
      run: this.snakeAnimations.slitherFast,
      attack: this.snakeAnimations.strike
    };

    for (const [baseAction, snakeAction] of Object.entries(baseMapping)) {
      if (snakeAction) {
        this.actions[baseAction] = snakeAction;
        console.log(`🐍 ✅ Mapped base action "${baseAction}" to snake animation`);
      } else {
        console.log(`🐍 ❌ No snake animation available for base action "${baseAction}"`);
      }
    }
  }

  _playSnakeAction(action, fadeDuration = 0.3) {
    // Use the base class method for consistency
    this._playAction(action, fadeDuration, true);
  }

  update(delta, player, platforms = []) {
    if (!this.alive) return;
    
    // Call base update for physics and health bar
    super.update(delta, player, platforms);
    
    // Sync mesh rotation with physics body rotation (for snake collider alignment)
    if (this.body && this.mesh) {
      this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    // Update snake-specific behavior
    this.updateSnakeBehavior(delta, player);
    
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  updateSnakeBehavior(delta, player) {
    if (!player || !player.mesh) {
      console.log('🐍 No player found for snake behavior');
      return;
    }

    const playerPosition = player.mesh.position;
    const snakePosition = this.mesh.position;
    const distanceToPlayer = snakePosition.distanceTo(playerPosition);

    this.stateTimer += delta;
    
    // Add debug logging every few seconds
    if (Math.floor(this.stateTimer) % 3 === 0 && this.stateTimer % 1 < delta) {
      console.log(`🐍 Snake state: ${this.behaviorState}, distance to player: ${distanceToPlayer.toFixed(2)}, patrol points: ${this.patrolPoints.length}`);
    }

    switch (this.behaviorState) {
      case 'patrol':
        this.handlePatrolState(delta, player, distanceToPlayer);
        break;
      case 'chase':
        this.handleChaseState(delta, player, distanceToPlayer);
        break;
      case 'attack':
        this.handleAttackState(delta, player, distanceToPlayer);
        break;
      case 'retreat':
        this.handleRetreatState(delta, player, distanceToPlayer);
        break;
    }
  }

  handlePatrolState(delta, player, distanceToPlayer) {
    // Check if player is within chase range
    if (distanceToPlayer <= this.chaseRange) {
      this.behaviorState = 'chase';
      this.stateTimer = 0;
      console.log('🐍 Snake detected player, switching to chase');
      if (this.snakeAnimations.slitherFast) {
        this._playSnakeAction(this.snakeAnimations.slitherFast);
      }
      return;
    }

    // Patrol between points
    if (this.patrolPoints.length > 0) {
      const targetPatrol = this.patrolPoints[this.currentPatrolIndex];
      const targetPos = new THREE.Vector3(targetPatrol[0], targetPatrol[1], targetPatrol[2]);
      const currentPos = this.mesh.position;
      const direction = new THREE.Vector3().subVectors(targetPos, currentPos);
      const distanceToTarget = direction.length();

      if (distanceToTarget < 1.0) {
        // Reached patrol point - play search animation (idle state)
        if (this.snakeAnimations.coil && this.currentAction !== this.snakeAnimations.coil) {
          this._playSnakeAction(this.snakeAnimations.coil);
          //console.log('🐍 Snake reached patrol point, playing search animation...');
        }
        
        // Stop movement while searching
        this.setDesiredMovement(new THREE.Vector3(0, 0, 0));
        
        // Wait at patrol point for a bit
        if (this.stateTimer > 2.0) {
          this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
          this.stateTimer = 0;
          //console.log('🐍 Moving to next patrol point...');
        }
      } else {
        // Move towards patrol point using base class movement system
        direction.normalize();
        const moveDirection = new THREE.Vector3(direction.x, 0, direction.z);
        
        // Use base class movement system instead of direct physics manipulation
        this.setDesiredMovement(moveDirection.multiplyScalar(this.patrolSpeed));
        
        // Update physics body rotation so collider rotates with the snake
        const angle = Math.atan2(direction.x, direction.z);
        if (this.body) {
          this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
        }
        
        // Play movement animation when actually moving
        if (this.snakeAnimations.slither && this.currentAction !== this.snakeAnimations.slither) {
          this._playSnakeAction(this.snakeAnimations.slither);
          //console.log('🐍 Playing slither animation while moving...');
        }
      }
    }
  }

  handleChaseState(delta, player, distanceToPlayer) {
    // Check if player escaped
    if (distanceToPlayer > this.chaseRange * 1.5) {
      this.behaviorState = 'retreat';
      this.stateTimer = 0;
      console.log('🐍 Player escaped, snake retreating');
      return;
    }

    // Check if close enough to attack
    if (distanceToPlayer <= this.attackRange) {
      const currentTime = Date.now();
      if (currentTime - this.lastAttackTime >= this.attackCooldown) {
        this.behaviorState = 'attack';
        this.stateTimer = 0;
        console.log(`🐍 Snake attacking player! Distance: ${distanceToPlayer.toFixed(2)}, Attack Range: ${this.attackRange}`);
        if (this.snakeAnimations.strike) {
          this._playSnakeAction(this.snakeAnimations.strike);
        }
        return;
      } else {
        console.log(`🐍 Snake in range but cooling down. Distance: ${distanceToPlayer.toFixed(2)}, Time since last attack: ${currentTime - this.lastAttackTime}ms`);
      }
    } else {
      // Debug: Show when snake is close but not quite in range
      if (distanceToPlayer <= this.attackRange + 0.5) {
        console.log(`🐍 Snake close to attack range. Distance: ${distanceToPlayer.toFixed(2)}, Attack Range: ${this.attackRange}`);
      }
    }

    // Chase the player using base class movement system
    const playerPosition = player.mesh.position;
    const snakePosition = this.mesh.position;
    const direction = new THREE.Vector3().subVectors(playerPosition, snakePosition);
    direction.y = 0; // Don't chase vertically
    direction.normalize();

    // Use base class movement system
    this.setDesiredMovement(direction.multiplyScalar(this.chaseSpeed));
    
    // Update physics body rotation so collider rotates with the snake
    const angle = Math.atan2(direction.x, direction.z);
    if (this.body) {
      this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
    }

    // Play chase animation (fast movement)
    if (this.snakeAnimations.slitherFast && this.currentAction !== this.snakeAnimations.slitherFast) {
      this._playSnakeAction(this.snakeAnimations.slitherFast);
      console.log('🐍 Playing fast slither animation while chasing...');
    }
  }

  handleAttackState(delta, player, distanceToPlayer) {
    // Stay in attack state for animation duration
    if (this.stateTimer > 1.0) { // Attack animation duration
      // Deal damage to player if still in range
      if (distanceToPlayer <= this.attackRange * 1.2) {
        if (player.takeDamage) {
          player.takeDamage(15);
          console.log('🐍 Snake bite hit! Player took 15 damage');
        }
      }
      
      this.lastAttackTime = Date.now();
      
      // Return to appropriate state
      if (distanceToPlayer <= this.chaseRange) {
        this.behaviorState = 'chase';
        if (this.snakeAnimations.slitherFast) {
          this._playSnakeAction(this.snakeAnimations.slitherFast);
        }
      } else {
        this.behaviorState = 'patrol';
        if (this.snakeAnimations.slither) {
          this._playSnakeAction(this.snakeAnimations.slither);
        }
      }
      this.stateTimer = 0;
    }
  }

  handleRetreatState(delta, player, distanceToPlayer) {
    // Return to patrol after retreating for a bit
    if (this.stateTimer > 3.0 || distanceToPlayer > this.chaseRange * 2) {
      this.behaviorState = 'patrol';
      this.stateTimer = 0;
      console.log('🐍 Snake returning to patrol');
      
      // Stop movement and play idle/search animation
      this.setDesiredMovement(new THREE.Vector3(0, 0, 0));
      if (this.snakeAnimations.coil) {
        this._playSnakeAction(this.snakeAnimations.coil);
        console.log('🐍 Playing search animation after returning to patrol...');
      }
      return;
    }

    // Move away from player using base class movement system
    const playerPosition = player.mesh.position;
    const snakePosition = this.mesh.position;
    const direction = new THREE.Vector3().subVectors(snakePosition, playerPosition);
    direction.y = 0;
    direction.normalize();

    // Use base class movement system
    this.setDesiredMovement(direction.multiplyScalar(this.patrolSpeed));
    
    // Update physics body rotation so collider rotates with the snake
    const angle = Math.atan2(direction.x, direction.z);
    if (this.body) {
      this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
    }

    // Play retreat animation (normal movement)
    if (this.snakeAnimations.slither && this.currentAction !== this.snakeAnimations.slither) {
      this._playSnakeAction(this.snakeAnimations.slither);
      console.log('🐍 Playing slither animation while retreating...');
    }
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    
    if (this.alive) {
      // React to damage
      this.behaviorState = 'chase'; // Become aggressive when hurt
      this.stateTimer = 0;
      console.log(`🐍 Snake took ${amount} damage, becoming aggressive!`);
      
      if (this.snakeAnimations.hiss) {
        this._playSnakeAction(this.snakeAnimations.hiss);
      }
    }
  }

  onDeath() {
    super.onDeath();
    console.log('🐍 Snake has been defeated!');
  }
}