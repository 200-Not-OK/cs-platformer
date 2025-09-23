import * as THREE from 'three';

// Simple first-person camera attached to the player's head with mouse-look.
export class FirstPersonCamera {
  constructor(player, input, domElement = window) {
    this.player = player;
    this.input = input;
    this.dom = domElement;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.yaw = 0;
    this.pitch = 0;
    this.sensitivity = 0.0025;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  update() {
    // consume mouse delta (pointer lock or alwaysTrack provided)
    const d = this.input.consumeMouseDelta();
    this.yaw -= d.x * this.sensitivity;
    this.pitch -= d.y * this.sensitivity;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

  // position at player's head
  const halfHeight = (this.player.size && this.player.size[1]) ? this.player.size[1] / 2 : 0.9;
  const headOffset = new THREE.Vector3(0, halfHeight * 0.9, 0);
  const desiredPos = new THREE.Vector3().copy(this.player.mesh.position).add(headOffset);

  // build quaternion from yaw/pitch
  const quat = new THREE.Quaternion();
  quat.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

  // place camera slightly in front of the face to avoid clipping with the model
  this.camera.position.copy(desiredPos);
  // compute forward vector from yaw/pitch and nudge camera forward a bit
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat).normalize();
  const forwardNudge = Math.max(0.15, Math.min(0.5, halfHeight * 0.15));
  this.camera.position.add(forward.clone().multiplyScalar(forwardNudge));

  this.camera.quaternion.copy(quat);

    // rotate the player model to match the camera yaw so character faces where camera looks
    if (this.player) {
      // apply model yaw offset if present; hide player mesh in first-person to avoid clipping
      this.player.mesh.rotation.y = this.yaw + (this.player._modelYawOffset || 0);
      if (this.player.mesh.visible) {
        // keep visible state; actual visibility toggled by Game when entering/exiting first-person
      }
    }
  }

  getCamera() { return this.camera; }

  getCameraOrientation() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, this.camera.up).normalize();
    return { forward, right };
  }
}
