import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';

// A generic Level that builds meshes from levelData objects array.
export class Level {
  constructor(scene, levelData, showColliders = true) {
    this.scene = scene;
    this.data = levelData;
    this.objects = []; // contains meshes
    this.colliders = []; // box3 for each mesh
    this.helpers = []; // collider helpers
    this.showColliders = showColliders;
    this._buildFromData();
  }

  _buildFromData() {
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
      }
      // extendable: add other object types here (spheres, triggers, etc.)
    }
  }

  update() {
    for (let i = 0; i < this.objects.length; i++) {
      const mesh = this.objects[i];
      mesh.userData.collider.setFromObject(mesh);
      this.helpers[i].update();
      this.helpers[i].setVisible(this.showColliders);
    }
  }

  toggleColliders(v) {
    this.showColliders = v;
    this.helpers.forEach(h => h.setVisible(v));
  }

  dispose() {
    // remove meshes & helpers
    this.helpers.forEach(h => this.scene.remove(h.mesh));
    this.objects.forEach(m => this.scene.remove(m));
    this.objects = [];
    this.helpers = [];
    this.colliders = [];
  }

  getPlatforms() {
    // For player collisions we treat all objects as potential colliders
    return this.objects;
  }
}
