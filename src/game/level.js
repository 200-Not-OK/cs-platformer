import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { EnemyManager } from './EnemyManager.js';
import { SimpleSlopeCollider } from './simpleSlopeCollider.js';
import { loadGLTFModel } from './gltfLoader.js';
import { CinematicsManager } from './cinematicsManager.js';

// A Level that can load geometry from GLTF files or fallback to procedural objects
export class Level {
  constructor(scene, levelData, showColliders = true) {
    this.scene = scene;
    this.data = levelData;
    this.objects = []; // contains meshes
    this.colliders = []; // box3 for each mesh
    this.slopeColliders = []; // slope colliders for slope objects
    this.helpers = []; // collider helpers
    this.slopeHelpers = []; // slope collider helpers
    this.showColliders = showColliders;
    this.enemyManager = new EnemyManager(this.scene);
    this.gltfLoaded = false;
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
    
    // Add test slopes near spawn for easy testing - only on intro level
    if (this.data.id === 'intro') {
      const testSlopes = [
        {
          type: 'slope',
          position: [15, 0, 15],
          size: [8, 3, 12],
          rotation: [0, 0, 0],
          color: 0xff6600,
          slopeDirection: 'north'
        },
        {
          type: 'slope', 
          position: [-10, 0, 15],
          size: [8, 3, 12],
          rotation: [0, Math.PI, 0],
          color: 0x6600ff,
          slopeDirection: 'south'
        }
      ];
      
      objectsToProcess.push(...testSlopes);
      console.log('Added test slopes for easier testing');
    }
    
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
      } else if (obj.type === 'slope') {
        // Create slope geometry (wedge shape)
        const halfW = obj.size[0] / 2;
        const halfD = obj.size[2] / 2;
        const height = obj.size[1];
        
        const geometry = new THREE.BufferGeometry();
        
        // Define vertices for a wedge/ramp shape
        const vertices = new Float32Array([
          // Bottom face (flat on ground)
          -halfW, 0, -halfD,   halfW, 0, -halfD,   halfW, 0,  halfD,
          -halfW, 0, -halfD,   halfW, 0,  halfD,  -halfW, 0,  halfD,
          
          // Top face (slanted)
          -halfW, height,  halfD,   halfW, height,  halfD,   halfW, 0, -halfD,
          -halfW, height,  halfD,   halfW, 0, -halfD,  -halfW, 0, -halfD,
          
          // Side faces
          -halfW, 0, -halfD,  -halfW, 0,  halfD,  -halfW, height,  halfD,  // Left
          -halfW, 0, -halfD,  -halfW, height,  halfD,  -halfW, 0, -halfD,
          
           halfW, 0, -halfD,   halfW, height,  halfD,   halfW, 0,  halfD,  // Right
           halfW, 0, -halfD,   halfW, 0, -halfD,   halfW, height,  halfD,
          
          // Back face (high end)
          -halfW, 0,  halfD,   halfW, 0,  halfD,   halfW, height,  halfD,
          -halfW, 0,  halfD,   halfW, height,  halfD,  -halfW, height,  halfD,
          
          // Front face (low end) - triangle  
          -halfW, 0, -halfD,   halfW, 0, -halfD,   0, 0, -halfD,
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        
        const mat = new THREE.MeshStandardMaterial({ color: obj.color ?? 0x8bc34a });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
        
        // Apply rotation if specified
        if (obj.rotation) {
          mesh.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
        }
        
        mesh.userData.type = 'slope';
        this.scene.add(mesh);
        this.objects.push(mesh);

        // Create simple slope collider using the mesh directly
        const slopeCollider = new SimpleSlopeCollider(mesh);
        mesh.userData.simpleSlopeCollider = slopeCollider;
        mesh.userData.slopeInfo = {
          direction: obj.slopeDirection || 'north',
          size: obj.size,
          position: obj.position,
          rotation: obj.rotation || [0, 0, 0]
        };
        this.slopeColliders.push(slopeCollider);
        
        console.log('Created simple slope collider at:', obj.position, 'direction:', obj.slopeDirection);

        // For slopes, DON'T create Box3 colliders - only use slope colliders
        mesh.userData.collider = null; // No box collider for slopes

        // Add a simple helper for consistency (but don't show it for now)
        const helper = new ColliderHelper(new THREE.Box3(), 0x0000ff);
        helper.setVisible(false);
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
      // Only update colliders for non-slope objects (slopes don't have box colliders)
      if (mesh.userData.collider) {
        mesh.userData.collider.setFromObject(mesh);
      }
      this.helpers[i].update();
      this.helpers[i].setVisible(this.showColliders && mesh.userData.type !== 'slope'); // Hide box helpers for slopes by default
    }
    
    // Update slope helpers
    for (let i = 0; i < this.slopeHelpers.length; i++) {
      this.slopeHelpers[i].update();
      this.slopeHelpers[i].setVisible(this.showColliders);
    }
    
    // update enemies
    if (this.enemyManager) this.enemyManager.update(delta, player, platforms.length ? platforms : this.getPlatforms());
  }

  toggleColliders(v) {
    this.showColliders = v;
    this.helpers.forEach((h, i) => {
      // Only show box helpers for non-slope objects
      const mesh = this.objects[i];
      const show = v && mesh.userData.type !== 'slope';
      h.setVisible(show);
    });
    this.slopeHelpers.forEach(h => h.setVisible(v));
  }

  dispose() {
    // remove meshes & helpers
    this.helpers.forEach(h => this.scene.remove(h.mesh));
    this.slopeHelpers.forEach(h => {
      this.scene.remove(h.mesh);
      h.dispose();
    });
    this.objects.forEach(m => this.scene.remove(m));
    this.objects = [];
    this.helpers = [];
    this.slopeHelpers = [];
    this.colliders = [];
    this.slopeColliders = [];
    if (this.enemyManager) { this.enemyManager.dispose(); this.enemyManager = null; }
    if (this.cinematicsManager) { this.cinematicsManager.dispose(); this.cinematicsManager = null; }
  }

  getPlatforms() {
    // For player collisions we treat all objects as potential colliders
    return this.objects;
  }
  
  getSlopeColliders() {
    return this.slopeColliders;
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
