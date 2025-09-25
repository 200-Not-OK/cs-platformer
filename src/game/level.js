import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { EnemyManager } from './EnemyManager.js';
import { SimpleSlopeCollider } from './simpleSlopeCollider.js';

// A generic Level that builds meshes from levelData objects array.
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
    this._buildFromData();
  }

  _buildFromData() {
    console.log('Building level from data, total objects:', this.data.objects.length);
    
    // Add test slopes near spawn for easy testing
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
    
    testSlopes.forEach(slope => this.data.objects.push(slope));
    console.log('Added test slopes for easier testing');
    
    for (const obj of this.data.objects) {
      if (obj.type === 'box') {
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

    // Spawn enemies if defined in level data
    if (this.data.enemies && Array.isArray(this.data.enemies)) {
      for (const ed of this.data.enemies) {
        try {
          this.enemyManager.spawn(ed.type, ed);
        } catch (e) {
          console.warn('Failed to spawn enemy', ed, e);
        }
      }
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
  }

  getPlatforms() {
    // For player collisions we treat all objects as potential colliders
    return this.objects;
  }
  
  getSlopeColliders() {
    return this.slopeColliders;
  }
}
