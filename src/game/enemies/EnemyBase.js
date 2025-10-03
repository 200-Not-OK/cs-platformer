import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class EnemyBase {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.options = options;
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    // defaults — similar to Player
    this.speed = options.speed ?? 2;
    this.size = options.size ?? [1, 1, 1];
    this.colliderSize = options.colliderSize ?? [this.size[0] * 0.5, this.size[1], this.size[2] * 0.5];

    this.health = options.health ?? 10;
    this.maxHealth = this.health;
    this.alive = true;

    // Health bar system
    this.healthBarVisible = false;
    this.healthBarGroup = null;
    this.healthBarBg = null;
    this.healthBarFill = null;
    // Don't create health bar immediately - wait for mesh to be ready

    // Physics body
    this.body = null;
    this._createPhysicsBody();

    // Movement state
    this.onGround = false;
    this._lastGroundCheck = 0;
    this._groundCheckInterval = 0.1;

    // animation
    this.mixer = null;
    this.actions = { idle: null, walk: null, run: null, attack: null };
    this.currentAction = null;

    this._desiredMovement = new THREE.Vector3();

    if (options.modelUrl) this._loadModel(options.modelUrl);
  }

  _createHealthBar() {
    console.log(`🔍 Creating health bar for ${this.constructor.name}`);
    
    // Create health bar group that will float above the enemy
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.y = this.size[1] + 0.5; // Position above enemy
    this.healthBarGroup.visible = false; // Hidden initially
    
    console.log(`🔍 Health bar positioned at y: ${this.healthBarGroup.position.y}`);
    
    // Health bar background
    const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarGroup.add(this.healthBarBg);
    
    // Health bar fill
    const fillGeometry = new THREE.PlaneGeometry(1.1, 0.1);
    const fillMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
    this.healthBarFill.position.z = 0.001; // Slightly in front of background
    this.healthBarGroup.add(this.healthBarFill);
    
    // Add to enemy mesh so it moves with the enemy
    this.mesh.add(this.healthBarGroup);
    
    console.log(`🔍 Health bar created with ${this.healthBarGroup.children.length} children`);
    console.log(`🔍 Health bar added to mesh:`, !!this.mesh);
  }

  _createPhysicsBody() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
    }
    
    // Create enemy physics body using the dynamic body method
    this.body = this.physicsWorld.createDynamicBody({
      mass: 1.0,
      shape: 'box',
      size: this.colliderSize,
      position: [this.mesh.position.x, this.mesh.position.y, this.mesh.position.z],
      material: 'enemy'
    });
    
    // Configure enemy-specific physics properties
    this.body.linearDamping = 0.05;  // Much lower damping for proper movement
    this.body.angularDamping = 0.99; // Keep high angular damping to prevent rotation
    this.body.allowSleep = false;
    
    // Lock rotation on X and Z axes to prevent tipping
    this.body.fixedRotation = true;
    this.body.updateMassProperties();
    
    // Additional stability settings
    this.body.material.friction = 0.1;  // Lower friction like player
    this.body.material.restitution = 0.0; // No bouncing
    
    // Set proper userData for wall sliding detection
    this.body.userData = { 
      type: 'enemy',
      isEnemy: true,
      enemyType: this.type || 'unknown'
    };
    
    console.log(`🤖 Created enemy physics body at [${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z}]`);
  }

  _loadModel(url) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      while (this.mesh.children.length > 0) this.mesh.remove(this.mesh.children[0]);

      // compute bbox and center like Player
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
        console.warn('Enemy bbox calculation failed:', e);
      }

      this.mesh.add(gltf.scene);

      // animations
      if (gltf.animations && gltf.animations.length > 0) {
        try {
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
          const runClip = findClip(['run', 'sprint']) || null;
          const attackClip = findClip(['attack', 'hit']) || null;

          if (idleClip) this.actions.idle = this.mixer.clipAction(idleClip);
          if (walkClip) this.actions.walk = this.mixer.clipAction(walkClip);
          if (runClip) this.actions.run = this.mixer.clipAction(runClip);
          if (attackClip) this.actions.attack = this.mixer.clipAction(attackClip);

          if (this.actions.idle) { this.actions.idle.setLoop(THREE.LoopRepeat); this.actions.idle.play(); this.currentAction = this.actions.idle; }
        } catch (e) { console.warn('Enemy mixer failed', e); }
      }

    }, undefined, (err) => console.warn('Enemy model load failed', err));
  }

  _preventWallSticking() {
    if (!this.body) return;
    
    const contacts = this.physicsWorld.getContactsForBody(this.body);
    
    for (const contact of contacts) {
      let normal;
      if (contact.bi === this.body) {
        normal = contact.ni;
      } else {
        normal = contact.ni.clone().negate();
      }
      
      // Check if this is a wall contact (not ground)
      if (Math.abs(normal.y) < 0.5) {
        // This is a wall contact - reduce velocity in the normal direction
        const velocityInNormal = this.body.velocity.dot(normal);
        if (velocityInNormal < 0) {
          // Moving into the wall, reduce that component
          const correction = normal.clone().scale(-velocityInNormal * 0.5);
          this.body.velocity.vadd(correction, this.body.velocity);
        }
      }
    }
  }

  setPosition(vec3) {
    if (!vec3 || !vec3.isVector3) return;
    
    // Update mesh position first
    this.mesh.position.copy(vec3);
    
    // Update physics body position and reset velocities
    if (this.body) {
      this.body.position.set(vec3.x, vec3.y, vec3.z);
      this.body.velocity.set(0, 0, 0);
      this.body.angularVelocity.set(0, 0, 0);
    }
  }

  setDesiredMovement(vec3) {
    if (!vec3 || !vec3.isVector3) return;
    this._desiredMovement.copy(vec3);
  }

  _playAction(action, fadeDuration = 0.2, loop = true) {
    if (!action) return;
    try {
      if (this.currentAction && this.currentAction !== action) {
        this.currentAction.crossFadeTo(action, fadeDuration, false);
      }
      if (this.currentAction !== action) {
        action.reset();
        if (loop) action.setLoop(THREE.LoopRepeat);
        action.play();
        this.currentAction = action;
      }
    } catch (e) { /* ignore */ }
  }

  update(delta, player, platforms = []) {
    if (!this.body) return;
    
    // Check if grounded
    this._lastGroundCheck += delta;
    if (this._lastGroundCheck >= this._groundCheckInterval) {
      this.onGround = this.physicsWorld.isBodyGrounded(this.body, 0.5);
      this._lastGroundCheck = 0;
    }

    // Apply desired movement
    if (this._desiredMovement.lengthSq() > 0 && this.onGround) {
      // Use desired movement directly (already includes speed from enemy classes)
      const targetVelX = this._desiredMovement.x * this.speed;
      const targetVelZ = this._desiredMovement.z * this.speed;
      
      // Direct velocity assignment for immediate response
      this.body.velocity.x = targetVelX;
      this.body.velocity.z = targetVelZ;
      
      // Keep Y velocity under control (prevent bouncing)
      if (this.body.velocity.y > 2) {
        this.body.velocity.y = 2;
      }
      
    } else if (!this.onGround && this._desiredMovement.lengthSq() > 0) {
      // Apply forces for air movement
      const moveForce = this._desiredMovement.clone().multiplyScalar(3);
      this.body.applyForce(new CANNON.Vec3(moveForce.x, 0, moveForce.z), this.body.position);
    } else {
      // Apply gentler damping when no movement
      this.body.velocity.x *= 0.95;
      this.body.velocity.z *= 0.95;
    }

    // Sync position but handle rotation separately
    this.mesh.position.copy(this.body.position);
    
    // Handle visual rotation independently of physics
    if (this._desiredMovement.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(this._desiredMovement.x, this._desiredMovement.z);
      const currentAngle = this.mesh.rotation.y;
      const angleDiff = targetAngle - currentAngle;
      
      // Normalize angle difference to [-π, π]
      let normalizedDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;
      
      // More responsive rotation towards target
      this.mesh.rotation.y += normalizedDiff * 0.2;
    }
    
    // Prevent wall sticking - similar to player implementation
    this._preventWallSticking();
    
    // Update animations
    try { 
      if (this.mixer) this.mixer.update(delta); 
    } catch (e) {}

    // Update health bar to face camera
    if (this.healthBarVisible && this.healthBarGroup && player && player.mesh) {
      this.healthBarGroup.lookAt(player.mesh.position);
    }

    // Reset desired movement
    this._desiredMovement.set(0, 0, 0);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    
    console.log(`🔍 takeDamage called on ${this.constructor.name}`);
    console.log(`🔍 healthBarVisible before: ${this.healthBarVisible}`);
    console.log(`🔍 healthBarGroup exists: ${!!this.healthBarGroup}`);
    
    // Show health bar on first hit
    if (!this.healthBarVisible) {
      console.log(`🔍 Showing health bar for first time...`);
      this.showHealthBar();
    }
    
    this.health = Math.max(0, this.health - amount);
    console.log(`💥 ${this.constructor.name} took ${amount} damage, health: ${this.health}/${this.maxHealth}`);
    
    // Update health bar
    this.updateHealthBar();
    
    if (this.health <= 0) {
      this.onDeath();
    }
    
    return this.health;
  }

  showHealthBar() {
    console.log(`🔍 showHealthBar called`);
    console.log(`🔍 healthBarGroup exists: ${!!this.healthBarGroup}`);
    
    // Create health bar if it doesn't exist yet
    if (!this.healthBarGroup) {
      console.log(`🔍 Health bar doesn't exist, creating it now...`);
      this._createHealthBar();
    }
    
    if (this.healthBarGroup) {
      console.log(`🔍 Setting healthBarGroup.visible = true`);
      this.healthBarGroup.visible = true;
      this.healthBarVisible = true;
      
      console.log(`🔍 healthBarGroup.visible is now: ${this.healthBarGroup.visible}`);
      console.log(`🔍 healthBarVisible is now: ${this.healthBarVisible}`);
      
      // Add a brief pulse animation when first shown
      const originalScale = this.healthBarGroup.scale.clone();
      this.healthBarGroup.scale.setScalar(1.3);
      
      // Animate back to normal size
      const animate = () => {
        this.healthBarGroup.scale.lerp(originalScale, 0.15);
        if (this.healthBarGroup.scale.distanceTo(originalScale) > 0.01) {
          requestAnimationFrame(animate);
        } else {
          this.healthBarGroup.scale.copy(originalScale);
        }
      };
      animate();
    } else {
      console.error(`❌ healthBarGroup is still null after creation attempt!`);
    }
  }

  updateHealthBar() {
    if (!this.healthBarGroup || !this.healthBarVisible) return;
    
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    
    // Update fill width by scaling
    this.healthBarFill.scale.x = healthPercent;
    
    // Adjust position to keep it left-aligned
    this.healthBarFill.position.x = -(1.1 * (1 - healthPercent)) / 2;
    
    // Change color based on health percentage
    if (healthPercent > 0.6) {
      this.healthBarFill.material.color.setHex(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFill.material.color.setHex(0xffff00); // Yellow
    } else {
      this.healthBarFill.material.color.setHex(0xff0000); // Red
    }
  }

  heal(amount) {
    if (!this.alive) return;
    
    this.health = Math.min(this.maxHealth, this.health + amount);
    console.log(`💚 ${this.constructor.name} healed ${amount} HP, health: ${this.health}/${this.maxHealth}`);
    return this.health;
  }

  onDeath() {
    console.log(`💀 ${this.constructor.name} has died!`);
    this.alive = false;
    
    // Hide health bar on death
    if (this.healthBarGroup) {
      this.healthBarGroup.visible = false;
      this.healthBarVisible = false;
    }
    
    // Hide the enemy (could also add death animation here)
    if (this.mesh) {
      this.mesh.visible = false;
    }
    
    // Remove physics body to prevent further interactions
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
  }

  dispose() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
    
    // Clean up health bar resources
    if (this.healthBarGroup) {
      // Dispose of materials and geometries
      this.healthBarGroup.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      // Remove from scene
      if (this.mesh) {
        this.mesh.remove(this.healthBarGroup);
      }
      this.healthBarGroup = null;
    }
    
    if (this.mesh) this.scene.remove(this.mesh);
  }
}

