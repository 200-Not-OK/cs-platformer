// src/game/level.js
import * as THREE from 'three';
import { EnemyManager } from './EnemyManager.js';
import { loadGLTFModel } from './gltfLoader.js';
import { CinematicsManager } from './cinematicsManager.js';
import { NodeManager } from './linkedList/NodeManager.js';

// A Level that can load geometry from GLTF files or fallback to procedural objects
export class Level {
  constructor(scene, physicsWorld, levelData, showColliders = true) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.data = levelData;

    // Your physics-first structures
    this.objects = [];        // visual meshes
    this.physicsBodies = [];  // physics bodies for collision
    this.showColliders = showColliders;

    // Enemy manager uses physics world
    this.enemyManager = new EnemyManager(this.scene, this.physicsWorld);

    // GLTF tracking
    this.gltfLoaded = false;
    this.gltfScene = null; // to properly cleanup

    // Cinematics & node-based puzzle system (from the other branch)
    this.cinematicsManager = new CinematicsManager(scene);
    this._firstBug = null;     // for intro cutscene
    this.nodeManager = null;
    this._playerRef = null;    // set by Game.setPlayerRef
  }

  // Static factory method for async construction
  static async create(scene, physicsWorld, levelData, showColliders = true) {
    const level = new Level(scene, physicsWorld, levelData, showColliders);
    await level._buildFromData();
    return level;
  }

  async _buildFromData() {
    let geometryLoaded = false;

    // Try to load GLTF geometry first
    if (this.data.gltfUrl) {
      try {
        await this._loadGLTFGeometry(this.data.gltfUrl);
        this.gltfLoaded = true;
        geometryLoaded = true;
      } catch (error) {
        console.warn('Failed to load GLTF level geometry:', error);
        this.gltfLoaded = false;
      }
    }

    // Only use fallback if GLTF didn't load
    if (!geometryLoaded) {
      this._buildFallbackGeometry();
    }

    // Load enemies (always)
    this._loadEnemies();

    // Initialize cinematics (always safe)
    if (this.data.cinematics) {
      this.cinematicsManager.loadCinematics(this.data.cinematics);
    }

    // Node system is initialized once we have a player ref (set later by Game)
    if (this._playerRef) this.initNodeSystem(this._playerRef, this.cinematicsManager);
  }

  async _loadGLTFGeometry(url) {
    const gltf = await loadGLTFModel(url);
    if (!gltf || !gltf.scene) throw new Error(`Invalid GLTF for ${url}`);

    const meshesToProcess = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh) meshesToProcess.push(child);
    });

    this.scene.add(gltf.scene);
    this.gltfScene = gltf.scene; // Store reference for cleanup

    // Prefer manual colliders if provided in level data
    const hasManualColliders = Array.isArray(this.data.colliders) && this.data.colliders.length > 0;

    if (hasManualColliders) {
      console.log('🎯 Using manual colliders from level data');
      this._loadManualColliders(meshesToProcess);
    } else {
      console.log('🖼️ No colliders defined in level data - rendering meshes only (no physics)');
      this._loadVisualsOnly(meshesToProcess);
    }

    // Tag meshes
    for (const child of meshesToProcess) {
      child.userData.type = 'gltf';
      const name = (child.name || '').toLowerCase();
      child.userData.isCollider = name.includes('collider') || name.includes('collision');
    }

    console.log(`✅ GLTF processing complete: ${meshesToProcess.length} meshes, ${this.physicsBodies.length} physics bodies`);
    if (this.physicsBodies.length === 0) {
      console.log('💡 Tip: Use the editor to create manual colliders for physics interaction');
    }
  }

  _loadManualColliders(meshesToProcess) {
    // Add all meshes to objects array for visuals
    for (const child of meshesToProcess) {
      this.objects.push(child);
      child.userData.type = 'gltf';
    }

    // Create physics bodies from manual collider definitions
    for (const colliderDef of this.data.colliders) {
      console.log(`  🎯 Creating manual collider: ${colliderDef.id}`);
      const physicsBody = this._createPhysicsBodyFromDefinition(colliderDef);
      if (physicsBody) {
        this.physicsBodies.push(physicsBody);

        // Try to associate with a corresponding mesh by name
        const associatedMesh = meshesToProcess.find(mesh =>
          mesh.name === colliderDef.meshName ||
          mesh.name?.toLowerCase() === colliderDef.meshName?.toLowerCase()
        );
        if (associatedMesh) {
          associatedMesh.userData.physicsBody = physicsBody;
          associatedMesh.userData.manualCollider = true;
        }
      }
    }
  }

  _loadVisualsOnly(meshesToProcess) {
    // Visuals only (no physics)
    for (const child of meshesToProcess) {
      console.log(`  🖼️ Adding visual mesh: ${child.name || 'unnamed'} (no physics)`);
      this.objects.push(child);
      child.userData.type = 'gltf';
      child.userData.visualOnly = true;
    }
    console.log(`📝 Added ${meshesToProcess.length} visual meshes without physics bodies`);
  }

  // Optional utility if you later want to auto-generate colliders from GLTF names
  _loadAutoGeneratedColliders(meshesToProcess) {
    for (const child of meshesToProcess) {
      console.log(`  📦 Processing mesh: ${child.name || 'unnamed'}`);
      this.objects.push(child);

      const meshName = (child.name || '').toLowerCase();
      const collisionOptions = {
        useAccurateCollision:
          meshName.includes('complex') ||
          meshName.includes('detailed') ||
          meshName.includes('trimesh') ||
          meshName.includes('accurate'),
        forceBoxCollider:
          meshName.includes('box') ||
          meshName.includes('simple') ||
          meshName.includes('basic')
      };

      let materialType = 'ground';
      if (meshName.includes('wall') || meshName.includes('barrier') || meshName.includes('fence')) {
        materialType = 'wall';
      } else if (meshName.includes('platform') || meshName.includes('ledge')) {
        materialType = 'platform';
      }

      const physicsBody = this.physicsWorld.addStaticMesh(child, materialType, collisionOptions);
      if (physicsBody) {
        this.physicsBodies.push(physicsBody);
        child.userData.physicsBody = physicsBody;
      }

      child.userData.type = 'gltf';
    }
  }

  _createPhysicsBodyFromDefinition(colliderDef) {
    try {
      const { type, position, size, materialType = 'ground' } = colliderDef;

      if (type === 'box') {
        return this.physicsWorld.addStaticBox(
          new THREE.Vector3(position[0], position[1], position[2]),
          new THREE.Vector3(size[0], size[1], size[2]),
          materialType
        );
      } else if (type === 'sphere') {
        return this.physicsWorld.addStaticSphere(
          new THREE.Vector3(position[0], position[1], position[2]),
          size[0],
          materialType
        );
      } else if (type === 'capsule') {
        return this.physicsWorld.addStaticCapsule(
          new THREE.Vector3(position[0], position[1], position[2]),
          size[0],
          size[1],
          materialType
        );
      }

      console.warn(`Unknown collider type: ${type}`);
      return null;
    } catch (error) {
      console.error(`Failed to create physics body for collider ${colliderDef.id}:`, error);
      return null;
    }
  }

  _buildFallbackGeometry() {
    const objectsToProcess = this.data.fallbackObjects || this.data.objects || [];
    console.log('🔨 Building fallback procedural geometry, total objects:', objectsToProcess.length);

    // Only create physics if manual colliders were defined (matches your design)
    const hasManualColliders = Array.isArray(this.data.colliders) && this.data.colliders.length > 0;
    const createPhysics = hasManualColliders;

    if (!createPhysics) {
      console.log('🖼️ No colliders defined - creating fallback geometry without physics');
    }

    for (const obj of objectsToProcess) {
      if (obj.type === 'box') {
        console.log(`  📦 Creating fallback box at [${obj.position}] size [${obj.size}]${createPhysics ? ' with physics' : ' (visual only)'}`);
        const geom = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
        const mat = new THREE.MeshStandardMaterial({ color: obj.color ?? 0x808080 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
        mesh.userData.type = 'box';

        if (!createPhysics) mesh.userData.visualOnly = true;

        this.scene.add(mesh);
        this.objects.push(mesh);

        // Only add physics body if colliders are defined in level data
        if (createPhysics) {
          const physicsBody = this.physicsWorld.addStaticMesh(mesh);
          if (physicsBody) {
            this.physicsBodies.push(physicsBody);
            mesh.userData.physicsBody = physicsBody;
          }
        }
      }
    }

    console.log(`✅ Fallback geometry complete: ${this.objects.length} objects, ${this.physicsBodies.length} physics bodies`);
  }

  _loadEnemies() {
    if (Array.isArray(this.data.enemies)) {
      for (const ed of this.data.enemies) {
        try {
          this.enemyManager.spawn(ed.type, ed);
        } catch (e) {
          console.warn('Failed to spawn enemy', ed, e);
        }
      }
    }
  }

  /**
   * Called by Game after the level is loaded so the node system can read player position.
   */
  setPlayerRef(player) {
    this._playerRef = player;
    // Initialize node system if not already created and data present
    if (!this.nodeManager && Array.isArray(this.data.nodePoints) && this.data.nodePoints.length > 0) {
      this.initNodeSystem(this._playerRef, this.cinematicsManager);
    }
  }

  /**
   * Create the linked-list node system (link → reverse → complete).
   */
  initNodeSystem(playerRef, cinematicsManager) {
    if (!Array.isArray(this.data.nodePoints) || this.data.nodePoints.length === 0) return;

    this.nodeManager = new NodeManager(this.scene, {
      points: this.data.nodePoints,
      order: Array.isArray(this.data.nodeOrder) ? this.data.nodeOrder : undefined,
      lineColor: 0x7dd3fc,
      getPlayerPos: () => playerRef?.mesh?.position || new THREE.Vector3(),
      onPhaseAdvance: (phase) => {
        // Example: when switching to reverse, run a hype dialogue
        cinematicsManager?.playCinematic?.('bugChaos');
      },
      onComplete: () => {
        // Completed both phases: unlock door + trigger success cinematic
        cinematicsManager?.playCinematic?.('onLevelComplete');
        // TODO: open the door mesh if you have one
      }
    });
  }

  update(delta = 1 / 60, player = null, platforms = []) {
    // Physics-based enemies update (your behavior)
    if (this.enemyManager) {
      this.enemyManager.update(delta, player, platforms.length ? platforms : this.getPlatforms());
    }

    // Node puzzle system
    if (this.nodeManager) this.nodeManager.update(delta);
  }

  toggleColliders(v) {
    this.showColliders = v;
    // Physics bodies don’t have per-mesh helpers; use physics debug draw in your engine
  }

  dispose() {
    // Remove visual meshes from scene
    this.objects.forEach(m => this.scene.remove(m));

    // Remove physics bodies from physics world
    this.physicsBodies.forEach(body => {
      if (body) this.physicsWorld.removeBody(body);
    });

    // Remove GLTF scene if it exists
    if (this.gltfScene) {
      this.scene.remove(this.gltfScene);
      this.gltfScene = null;
    }

    // Clear arrays
    this.objects = [];
    this.physicsBodies = [];

    // Dispose managers
    if (this.nodeManager) { this.nodeManager.dispose?.(); this.nodeManager = null; }
    if (this.enemyManager) { this.enemyManager.dispose(); this.enemyManager = null; }
    if (this.cinematicsManager) { this.cinematicsManager.dispose(); this.cinematicsManager = null; }
  }

  getPlatforms() { return this.objects; }

  // expose enemies for UI / cinematics
  getEnemies() { return this.enemyManager?.enemies || []; }

  // used by CinematicsManager via Game._cinematicControls.spawnFirstBug()
  spawnFirstBug() {
    if (this._firstBug) return this._firstBug; // already spawned
    const pos = Array.isArray(this.data.firstBugSpawn) ? this.data.firstBugSpawn : [6, 3, -4];
    // Use 'runner' as the bug for now; customize as desired
    this._firstBug = this.enemyManager.spawn('runner', {
      position: pos,
      speed: 4.5,
      chaseRange: 10,
      modelUrl: 'src/assets/low_poly_male/scene.gltf'
    });
    return this._firstBug;
  }

  // Optional wrappers if you still call these from elsewhere
  triggerLevelStartCinematic(camera, player) {
    if (this.cinematicsManager?.cinematics?.onLevelStart) {
      this.cinematicsManager.playCinematic('onLevelStart', camera, player);
    }
  }
  triggerEnemyDefeatCinematic(camera, player) {
    if (this.cinematicsManager?.cinematics?.onEnemyDefeat) {
      this.cinematicsManager.playCinematic('onEnemyDefeat', camera, player);
    }
  }
  triggerLevelCompleteCinematic(camera, player) {
    if (this.cinematicsManager?.cinematics?.onLevelComplete) {
      this.cinematicsManager.playCinematic('onLevelComplete', camera, player);
    }
  }

  getCinematicsManager() {
    return this.cinematicsManager;
  }
}
