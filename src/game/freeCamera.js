import * as THREE from 'three';

// Editor-style free camera: mouse-look + WASD + QE vertical
export class FreeCamera {
  constructor(input, domElement = window) {
    this.input = input;
    this.dom = domElement;
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(20, 20, 20);
    this.pitch = 0; this.yaw = -Math.PI / 4;
    this.sensitivity = 0.0025;
    this.moveSpeed = 15;
    this.lerp = 0.15;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  update(delta) {
    // handle mouse look when mouse down
    if (this.input.mouseDown) {
      const d = this.input.consumeMouseDelta();
      this.yaw -= d.x * this.sensitivity;
      this.pitch -= d.y * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    } else {
      this.input.consumeMouseDelta();
    }

    // compute forward/right vectors
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
    const right = new THREE.Vector3(Math.sin(this.yaw - Math.PI / 2), 0, Math.cos(this.yaw - Math.PI / 2)).normalize();

    const move = new THREE.Vector3();
    if (this.input.isKey('KeyW')) move.add(dir);
    if (this.input.isKey('KeyS')) move.sub(dir);
    if (this.input.isKey('KeyA')) move.sub(right);
    if (this.input.isKey('KeyD')) move.add(right);
    if (this.input.isKey('KeyQ')) move.y -= 1;
    if (this.input.isKey('KeyE')) move.y += 1;

    move.normalize().multiplyScalar(this.moveSpeed * delta);

    this.camera.position.add(move);
    // rebuild camera quaternion from yaw/pitch
    const target = new THREE.Vector3().copy(this.camera.position).add(dir);
    this.camera.lookAt(target);
  }

  getCamera() { return this.camera; }

  // helper to position camera relative to player when switching into free mode
  moveNearPlayer(player, offset = new THREE.Vector3(12, 8, 12)) {
    const desired = new THREE.Vector3().copy(player.mesh.position).add(offset);
    this.camera.position.copy(desired);
    this.camera.lookAt(player.mesh.position);
  }

  getOrientation() {
    // used if you want to align player movement to free camera
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(); right.crossVectors(this.camera.up, forward).normalize();
    return { forward, right };
  }
}
