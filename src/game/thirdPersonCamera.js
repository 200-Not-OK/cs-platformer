import * as THREE from 'three';

// Orbiting third-person camera that rotates around the player (mouse drag).
export class ThirdPersonCamera {
  constructor(player, input, domElement = window) {
    this.player = player;
    this.input = input;
    this.dom = domElement;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.distance = 8;           // radius from player
    this.pitch = 20 * (Math.PI / 180); // radians
    this.yaw = 0;                // around Y-axis
    this.minPitch = -0.3;
    this.maxPitch = Math.PI / 2 - 0.1;
    this.sensitivity = 0.0025;
    this.lerp = 0.12;

    // allow right-click drag OR left-click drag (depends on preference)
    // We'll rotate when mouse is down
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  update() {
    // Always rotate by mouse movement (no mouseDown check)
    const d = this.input.consumeMouseDelta();
    this.yaw -= d.x * this.sensitivity;
    this.pitch += d.y * this.sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

    // compute camera desired position relative to player
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).multiplyScalar(this.distance);

    const desired = new THREE.Vector3().copy(this.player.mesh.position).add(offset);

    // smooth lerp
    this.camera.position.lerp(desired, this.lerp);
    this.camera.lookAt(this.player.mesh.position);
  }

  getCamera() { return this.camera; }

  // compute camera orientation vectors for player movement (forward/right on XZ plane)
  getCameraOrientation() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();
    return { forward, right };
  }
}
