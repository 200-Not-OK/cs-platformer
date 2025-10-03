import * as THREE from 'three';
import { EnemyManager } from './EnemyManager.js';

import { loadGLTFModel } from './gltfLoader.js';
import { CinematicsManager } from './cinematicsManager.js';

// A Level that can load geometry from GLTF files or fallback to procedural objects
export class Level {
  constructor(scene, physicsWorld, levelData, showColliders = true) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.data = levelData;
    this.objects = []; // contains visual meshes
    this.physicsBodies = []; // contains physics bodies for collision
    this.showColliders = showColliders;
    this.enemyManager = new EnemyManager(this.scene, this.physicsWorld);
    this.gltfLoaded = false;
    this.gltfScene = null; // Track the GLTF scene for proper cleanup
    this.cinematicsManager = new CinematicsManager(scene);
  }

  // Static factory method for async construction
  static async create(scene, physicsWorld, levelData, showColliders = true) {
    const level = new Level(scene, physicsWorld, levelData, showColliders);
    await level._buildFromData();
    return level;
  }

  async _buildFromData() {
    console.log('🏗️ Building level from data:', this.data.id);
    console.log('📋 Level data gltfUrl:', this.data.gltfUrl || 'NOT SET');
    
    let geometryLoaded = false;
    
    // Try to load GLTF geometry first
    if (this.data.gltfUrl) {
      try {
        console.log('Attempting to load level GLTF:', this.data.gltfUrl);
        await this._loadGLTFGeometry(this.data.gltfUrl);
        this.gltfLoaded = true;
        geometryLoaded = true;
        console.log('✅ GLTF level geometry loaded successfully');
      } catch (error) {
        console.warn('❌ Failed to load GLTF level geometry:', error);
        console.warn('🔍 Error details:', error.message);
        console.warn('🔍 Error stack:', error.stack);
        this.gltfLoaded = false;
      }
    }
    
    // Only use fallback if GLTF didn't load
    if (!geometryLoaded) {
      console.log('📦 Using fallback procedural geometry');
      this._buildFallbackGeometry();
    }
    
    // Load enemies (always done regardless of geometry type)
    console.log('👾 Loading enemies...');
    this._loadEnemies();
    
    // Initialize cinematics
    if (this.data.cinematics) {
      console.log('🎬 Loading cinematics...');
      this.cinematicsManager.loadCinematics(this.data.cinematics);
    }
    
    console.log('Level build complete. GLTF loaded:', this.gltfLoaded);
  }

  async _loadGLTFGeometry(url) {
    console.log('🔄 Loading GLTF from:', url);
    
    const gltf = await loadGLTFModel(url);
    
    // Validate GLTF structure
    if (!gltf) {
      throw new Error(`GLTF loader returned null/undefined for ${url}`);
    }
    
    if (!gltf.scene) {
      throw new Error(`GLTF missing scene property for ${url}`);
    }
    
    let meshCount = 0;
    const meshesToProcess = [];
    
    // First pass: collect all meshes without modifying the scene tree
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshesToProcess.push(child);
      }
    });
    
    console.log(`  🔍 Found ${meshesToProcess.length} meshes to process`);
    
    // Add entire GLTF scene to our scene first
    this.scene.add(gltf.scene);
    this.gltfScene = gltf.scene; // Store reference for cleanup
    
    // Check if we have manual colliders defined
    const hasManualColliders = this.data.colliders && this.data.colliders.length > 0;
    
    if (hasManualColliders) {
      console.log('🎯 Using manual colliders from level data');
      this._loadManualColliders(meshesToProcess);
    } else {
      console.log('🖼️ No colliders defined in level data - rendering meshes only (no physics)');
      this._loadVisualsOnly(meshesToProcess);
    }
    
    console.log(`✅ GLTF processing complete: ${meshesToProcess.length} meshes, ${this.physicsBodies.length} physics bodies`);
    if (this.physicsBodies.length === 0) {
      console.log(`💡 Tip: Use the editor to create manual colliders for physics interaction`);
    }
  }
  
  _loadManualColliders(meshesToProcess) {
    // Add all meshes to objects array for visual representation
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
        
        // Try to associate with corresponding mesh
        const associatedMesh = meshesToProcess.find(mesh => 
          mesh.name === colliderDef.meshName || 
          mesh.name.toLowerCase() === colliderDef.meshName?.toLowerCase()
        );
        
        if (associatedMesh) {
          associatedMesh.userData.physicsBody = physicsBody;
          associatedMesh.userData.manualCollider = true;
        }
      }
    }
  }
  
  _loadVisualsOnly(meshesToProcess) {
    // Add all meshes to objects array for visual representation only
    // No physics bodies will be created
    for (const child of meshesToProcess) {
      console.log(`  🖼️ Adding visual mesh: ${child.name || 'unnamed'} (no physics)`);
      this.objects.push(child);
      child.userData.type = 'gltf';
      child.userData.visualOnly = true; // Mark as visual-only for debugging
    }
    console.log(`📝 Added ${meshesToProcess.length} visual meshes without physics bodies`);
  }
  
  _loadAutoGeneratedColliders(meshesToProcess) {
    // Second pass: process each mesh safely (original behavior)
    for (const child of meshesToProcess) {
      console.log(`  📦 Processing mesh: ${child.name || 'unnamed'}`);
      
      this.objects.push(child);
      
      // Determine collision detection options based on mesh name
      const meshName = child.name.toLowerCase();
      const collisionOptions = {
        useAccurateCollision: meshName.includes('complex') || 
                             meshName.includes('detailed') || 
                             meshName.includes('trimesh') ||
                             meshName.includes('accurate'),
        forceBoxCollider: meshName.includes('box') || 
                         meshName.includes('simple') ||
                         meshName.includes('basic')
      };
      
      // Determine material type based on mesh name
      let materialType = 'ground'; // Default
      if (meshName.includes('wall') || meshName.includes('barrier') || meshName.includes('fence')) {
        materialType = 'wall';
      } else if (meshName.includes('platform') || meshName.includes('ledge')) {
        materialType = 'platform';
      }
      
      // Add mesh to physics world as static collision body with improved collision detection
      const physicsBody = this.physicsWorld.addStaticMesh(child, materialType, collisionOptions);
      if (physicsBody) {
        this.physicsBodies.push(physicsBody);
        child.userData.physicsBody = physicsBody;
      }
      
      // Tag as GLTF geometry
      child.userData.type = 'gltf';
      child.userData.isCollider = child.name.toLowerCase().includes('collider') || 
                                 child.name.toLowerCase().includes('collision');
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
          size[0], // radius
          materialType
        );
      } else if (type === 'capsule') {
        return this.physicsWorld.addStaticCapsule(
          new THREE.Vector3(position[0], position[1], position[2]),
          size[0], // radius
          size[1], // height
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
    
    // Check if we should create physics bodies based on colliders definition
    const hasManualColliders = this.data.colliders && this.data.colliders.length > 0;
    const createPhysics = hasManualColliders; // Only create physics if colliders are defined
    
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
        
        if (!createPhysics) {
          mesh.userData.visualOnly = true; // Mark as visual-only for debugging
        }
        
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
      // extendable: add other object types here (spheres, triggers, etc.)
    }
    
    console.log(`✅ Fallback geometry complete: ${this.objects.length} objects, ${this.physicsBodies.length} physics bodies`);
  }

  _loadEnemies() {
    // Spawn enemies if defined in level data
    if (this.data.enemies && Array.isArray(this.data.enemies)) {
      for (const ed of this.data.enemies) {
        try {
          this.enemyManager.spawn(ed.type, ed);
        } catch (e) {
          console.warn('Failed to spawn enemy', ed, e);
        }
      }
      console.log(`Loaded ${this.data.enemies.length} enemies`);
    }
  }

  update(delta = 1/60, player = null, platforms = []) {
    // Update enemies with physics-based collision detection
    if (this.enemyManager) this.enemyManager.update(delta, player, platforms.length ? platforms : this.getPlatforms());
  }

  toggleColliders(v) {
    this.showColliders = v;
    // Physics bodies don't have visual helpers in the new system
    // Collision visualization is handled by the physics engine debug rendering
  }

  dispose() {
    // Remove visual meshes from scene
    this.objects.forEach(m => this.scene.remove(m));
    
    // Remove physics bodies from physics world
    this.physicsBodies.forEach(body => {
      if (body) {
        this.physicsWorld.removeBody(body);
      }
    });
    
    // Clear arrays
    
    // Remove GLTF scene if it exists
    if (this.gltfScene) {
      this.scene.remove(this.gltfScene);
      this.gltfScene = null;
    }
    
    this.objects = [];
    this.physicsBodies = [];
    
    // Dispose managers
    if (this.enemyManager) { this.enemyManager.dispose(); this.enemyManager = null; }
    if (this.cinematicsManager) { this.cinematicsManager.dispose(); this.cinematicsManager = null; }
  }

  getPlatforms() {
    // For player collisions we treat all objects as potential colliders
    return this.objects;
  }
  


  // Cinematic triggers
  triggerLevelStartCinematic(camera, player) {
    if (this.cinematicsManager) {
      this.cinematicsManager.playCinematic('onLevelStart', camera, player);
    }
  }

  triggerEnemyDefeatCinematic(camera, player) {
    if (this.cinematicsManager) {
      this.cinematicsManager.playCinematic('onEnemyDefeat', camera, player);
    }
  }

  triggerLevelCompleteCinematic(camera, player) {
    if (this.cinematicsManager) {
      this.cinematicsManager.playCinematic('onLevelComplete', camera, player);
    }
  }

  getCinematicsManager() {
    return this.cinematicsManager;
  }

  getEnemies() {
    return this.enemyManager.enemies;
  }
}
