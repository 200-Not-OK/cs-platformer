import * as THREE from 'three';

// Visual helper to show a Box3 as a wireframe box mesh
export class ColliderHelper {
  constructor(box3, color = 0xffff00) {
    this.box3 = box3;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color, wireframe: true });
    this.mesh = new THREE.Mesh(geometry, material);
    this.update();
  }

  update() {
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    this.box3.getSize(size);
    this.box3.getCenter(center);
    this.mesh.position.copy(center);
    this.mesh.scale.set(Math.max(size.x, 0.0001), Math.max(size.y, 0.0001), Math.max(size.z, 0.0001));
  }

  setVisible(v) {
    this.mesh.visible = v;
  }
}
