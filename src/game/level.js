import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { EnemyManager } from './EnemyManager.js';

import { loadGLTFModel } from './gltfLoader.js';
import { CinematicsManager } from './cinematicsManager.js';

// A Level that can load geometry from GLTF files or fallback to procedural objects
export class Level {
  constructor(scene, levelData, showColliders = true) {
    this.scene = scene;
    this.data = levelData;
    this.objects = []; // contains meshes
    this.colliders = []; // box3 for each mesh
    this.helpers = []; // collider helpers
    this.showColliders = showColliders;
    this.enemyManager = new EnemyManager(this.scene);
    this.gltfLoaded = false;
    this.gltfScene = null; // Track the GLTF scene for proper cleanup
    this.cinematicsManager = new CinematicsManager(scene);
  }

  // Static factory method for async construction
  static async create(scene, levelData, showColliders = true) {
    const level = new Level(scene, levelData, showColliders);
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
    
    // Second pass: process each mesh safely
    for (const child of meshesToProcess) {
      meshCount++;
      console.log(`  📦 Processing mesh: ${child.name || 'unnamed'}`);
      
      this.objects.push(child);
      
      // Create collision box
      const box = new THREE.Box3().setFromObject(child);
      child.userData.collider = box;
      this.colliders.push(box);
      
      // Create collision helper (green for GLTF)
      const helper = new ColliderHelper(box, 0x00ff00);
      helper.setVisible(this.showColliders);
      this.scene.add(helper.mesh);
      this.helpers.push(helper);
      
      // Tag as GLTF geometry
      child.userData.type = 'gltf';
      child.userData.isCollider = child.name.toLowerCase().includes('collider') || 
                                 child.name.toLowerCase().includes('collision');
    }
    
    console.log(`✅ GLTF processing complete: ${meshCount} meshes, ${this.objects.length} collision objects`);
  }

  _buildFallbackGeometry() {
    const objectsToProcess = this.data.fallbackObjects || this.data.objects || [];
    console.log('🔨 Building fallback procedural geometry, total objects:', objectsToProcess.length);
    

    
    for (const obj of objectsToProcess) {
      if (obj.type === 'box') {
        console.log(`  📦 Creating fallback box at [${obj.position}] size [${obj.size}]`);
        const geom = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
        const mat = new THREE.MeshStandardMaterial({ color: obj.color ?? 0x808080 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
        mesh.userData.type = 'box';
        this.scene.add(mesh);
        this.objects.push(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        mesh.userData.collider = box;
        this.colliders.push(box);

        // Blue helpers for procedural geometry
        const helper = new ColliderHelper(box, 0x0000ff);
        helper.setVisible(this.showColliders);
        this.scene.add(helper.mesh);
        this.helpers.push(helper);
      }
      // extendable: add other object types here (spheres, triggers, etc.)
    }
    
    console.log(`✅ Fallback geometry complete: ${this.objects.length} objects, ${this.colliders.length} colliders`);
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
    for (let i = 0; i < this.objects.length; i++) {
      const mesh = this.objects[i];
      if (mesh.userData.collider) {
        mesh.userData.collider.setFromObject(mesh);
      }
      this.helpers[i].update();
      this.helpers[i].setVisible(this.showColliders);
    }
    
    // update enemies
    if (this.enemyManager) this.enemyManager.update(delta, player, platforms.length ? platforms : this.getPlatforms());
  }

  toggleColliders(v) {
    this.showColliders = v;
    this.helpers.forEach((h, i) => {
      h.setVisible(v);
    });
  }

  dispose() {
    // remove meshes & helpers
    this.helpers.forEach(h => this.scene.remove(h.mesh));
    this.objects.forEach(m => this.scene.remove(m));
    
    // Remove GLTF scene if it exists
    if (this.gltfScene) {
      this.scene.remove(this.gltfScene);
      this.gltfScene = null;
    }
    
    this.objects = [];
    this.helpers = [];
    this.colliders = [];
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
}
