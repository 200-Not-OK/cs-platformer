import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ColliderHelper } from '../colliderHelper.js';

export class EnemyBase {
  constructor(scene, physicsWorld, options = {}) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.options = options;
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    this.collider = new THREE.Box3();
    this.helper = new ColliderHelper(this.collider, 0x990000);
    this.scene.add(this.helper.mesh);

    // defaults — similar to Player
    this.speed = options.speed ?? 2;
    this.size = options.size ?? [1, 1, 1];
    this.colliderSize = options.colliderSize ?? [this.size[0] * 0.5, this.size[1], this.size[2] * 0.5];

    this.health = options.health ?? 10;
    this.alive = true;

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

  _createPhysicsBody() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
    }
    
    this.body = this.physicsWorld.createEnemyBody(this.mesh.position, this.size);
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
        this.colliderSize = [sizeVec.x * 0.2, sizeVec.y, sizeVec.z * 0.5];

        const centerX = (bbox.max.x + bbox.min.x) / 2;
        const centerZ = (bbox.max.z + bbox.min.z) / 2;
        const centerY = (bbox.max.y + bbox.min.y) / 2;
        gltf.scene.position.x -= centerX;
        gltf.scene.position.z -= centerZ;
        gltf.scene.position.y -= centerY;
      } catch (e) {
        // ignore
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

      this._updateCollider();
    }, undefined, (err) => console.warn('Enemy model load failed', err));
  }

  _updateCollider() {
    const half = new THREE.Vector3(this.colliderSize[0] * 0.5, this.colliderSize[1] * 0.5, this.colliderSize[2] * 0.5);
    const center = this.mesh.position.clone();
    this.collider.min.copy(center).sub(half);
    this.collider.max.copy(center).add(half);
    if (this.helper) this.helper.update();
  }

  setPosition(vec3) {
    if (!vec3 || !vec3.isVector3) return;
    this.mesh.position.copy(vec3);
    if (this.body) {
      this.body.position.set(vec3.x, vec3.y, vec3.z);
      this.body.velocity.set(0, 0, 0);
    }
    this._updateCollider();
    if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
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
      this.onGround = this.physicsWorld.isGrounded(this.body, 0.2);
      this._lastGroundCheck = 0;
    }

    // Apply desired movement as forces
    if (this._desiredMovement.lengthSq() > 0) {
      const moveForce = this._desiredMovement.clone().multiplyScalar(this.speed * 5); // Multiply by 5 for force strength
      this.body.applyImpulse(new CANNON.Vec3(moveForce.x, 0, moveForce.z));
      
      // Limit horizontal velocity
      const horizontalVel = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
      if (horizontalVel.length() > this.speed) {
        horizontalVel.setLength(this.speed);
        this.body.velocity.x = horizontalVel.x;
        this.body.velocity.z = horizontalVel.z;
      }
    } else {
      // Apply damping when no movement
      this.body.velocity.x *= 0.9;
      this.body.velocity.z *= 0.9;
    }

    // Sync Three.js mesh with physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
    
    // Update collider for debug visualization
    this._updateCollider();

    // Update animations
    try { 
      if (this.mixer) this.mixer.update(delta); 
    } catch (e) {}

    // Reset desired movement
    this._desiredMovement.set(0, 0, 0);
  }

  toggleHelperVisible(v) { 
    if (this.helper) this.helper.setVisible(v); 
  }

  dispose() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
    if (this.helper) this.scene.remove(this.helper.mesh);
    if (this.mesh) this.scene.remove(this.mesh);
  }
}

