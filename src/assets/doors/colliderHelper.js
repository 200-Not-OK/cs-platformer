import * as THREE from 'three';

export class ColliderHelper {
  constructor(box3, color = 0x00ff00) {
    this.box3 = box3;
    this.color = color;
    this.mesh = null;
    this.createMesh();
  }

  createMesh() {
    // Create a wireframe box geometry that matches the Box3 bounds
    const size = new THREE.Vector3();
    this.box3.getSize(size);

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({
      color: this.color,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // Position the mesh at the center of the Box3
    const center = new THREE.Vector3();
    this.box3.getCenter(center);
    this.mesh.position.copy(center);
  }

  update() {
    if (!this.mesh) return;

    // Update the mesh position and size to match the current Box3
    const size = new THREE.Vector3();
    this.box3.getSize(size);

    // Update geometry if size changed
    if (this.mesh.geometry.parameters.width !== size.x ||
        this.mesh.geometry.parameters.height !== size.y ||
        this.mesh.geometry.parameters.depth !== size.z) {

      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    }

    // Update position
    const center = new THREE.Vector3();
    this.box3.getCenter(center);
    this.mesh.position.copy(center);
  }

  setVisible(visible) {
    if (this.mesh) {
      this.mesh.visible = visible;
    }
  }
}