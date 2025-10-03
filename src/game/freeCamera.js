import * as THREE from 'three';

// Editor-style free camera with cinematic helpers
export class FreeCamera {
  constructor(input, domElement = window) {
    this.input = input;
    this.dom = domElement;
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(20, 20, 20);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    const toOrigin = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), this.camera.position).normalize();
    this.pitch = Math.asin(THREE.MathUtils.clamp(toOrigin.y, -1, 1));
    this.yaw = Math.atan2(toOrigin.x, toOrigin.z);

    this.sensitivity = 0.0025;
    this.moveSpeed = 15;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  /* ---------- Runtime update for manual fly cam ---------- */
  update(delta) {
    // mouse-look when mouse down
    if (this.input.ignoreMouse) {
      this.input.consumeMouseDelta();
    } else if (this.input.mouseDown) {
      const d = this.input.consumeMouseDelta();
      this.yaw   -= d.x * this.sensitivity;
      this.pitch -= d.y * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    } else {
      this.input.consumeMouseDelta();
    }

    // forward/right
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
    const target = new THREE.Vector3().copy(this.camera.position).add(dir);
    this.camera.lookAt(target);
  }

  getCamera() { return this.camera; }

  moveNearPlayer(player, offset = new THREE.Vector3(12, 8, 12), lookAtPlayer = true) {
    const desired = new THREE.Vector3().copy(player.mesh.position).add(offset);
    this.camera.position.copy(desired);
    const lookTarget = lookAtPlayer ? player.mesh.position : new THREE.Vector3(0,0,0);
    this.camera.lookAt(lookTarget);
    const toT = new THREE.Vector3().subVectors(lookTarget, this.camera.position).normalize();
    this.pitch = Math.asin(THREE.MathUtils.clamp(toT.y, -1, 1));
    this.yaw   = Math.atan2(toT.x, toT.z);
  }

  getOrientation() {
    const forward = new THREE.Vector3(); this.camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(); right.crossVectors(this.camera.up, forward).normalize();
    return { forward, right };
  }

  /* ---------- Cinematic helpers used by CinematicsManager ---------- */

  flyTo({ position, lookAt, duration = 1000, ease = 'quadInOut', fov } = {}) {
    return new Promise((resolve) => {
      const cam = this.camera;
      const startPos = cam.position.clone();
      const endPos = position ? new THREE.Vector3(...position) : startPos.clone();

      const startTarget = new THREE.Vector3().copy(cam.position).add(cam.getWorldDirection(new THREE.Vector3()));
      const endTarget = lookAt ? new THREE.Vector3(...lookAt) : startTarget.clone();

      const startFov = cam.fov;
      const endFov = (typeof fov === 'number') ? fov : startFov;

      const t0 = performance.now();
      const dur = Math.max(1, duration | 0);
      const easeFn = this._ease(ease);

      const tick = () => {
        const t = THREE.MathUtils.clamp((performance.now() - t0) / dur, 0, 1);
        const k = easeFn(t);

        cam.position.lerpVectors(startPos, endPos, k);
        const target = new THREE.Vector3().lerpVectors(startTarget, endTarget, k);
        cam.lookAt(target);

        cam.fov = THREE.MathUtils.lerp(startFov, endFov, k);
        cam.updateProjectionMatrix();

        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
  }

  panTilt({ dYaw = 0, dPitch = 0, duration = 800, ease = 'quadInOut' } = {}) {
    return new Promise((resolve) => {
      const cam = this.camera;
      const dir0 = cam.getWorldDirection(new THREE.Vector3()).normalize();
      const yaw0 = Math.atan2(dir0.x, dir0.z);
      const pitch0 = Math.asin(THREE.MathUtils.clamp(dir0.y, -1, 1));

      const t0 = performance.now();
      const dur = Math.max(1, duration | 0);
      const easeFn = this._ease(ease);

      const tick = () => {
        const t = THREE.MathUtils.clamp((performance.now() - t0) / dur, 0, 1);
        const k = easeFn(t);
        const yaw = yaw0 + dYaw * k;
        const pitch = THREE.MathUtils.clamp(pitch0 + dPitch * k, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);

        const dir = new THREE.Vector3(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          Math.cos(yaw) * Math.cos(pitch)
        ).normalize();

        const target = new THREE.Vector3().copy(cam.position).add(dir);
        cam.lookAt(target);

        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
  }

  orbitAround({ target = [0,0,0], radius = 6, height = 3, startAngleDeg = 180, endAngleDeg = 360, duration = 1500, ease = 'quadInOut', fov } = {}) {
    return new Promise((resolve) => {
      const cam = this.camera;
      const tgt = new THREE.Vector3(...target);
      const a0 = THREE.MathUtils.degToRad(startAngleDeg);
      const a1 = THREE.MathUtils.degToRad(endAngleDeg);

      const startFov = cam.fov;
      const endFov = (typeof fov === 'number') ? fov : startFov;

      const t0 = performance.now();
      const dur = Math.max(1, duration | 0);
      const easeFn = this._ease(ease);

      const tick = () => {
        const t = THREE.MathUtils.clamp((performance.now() - t0) / dur, 0, 1);
        const k = easeFn(t);
        const a = a0 + (a1 - a0) * k;
        const x = tgt.x + Math.sin(a) * radius;
        const z = tgt.z + Math.cos(a) * radius;
        const y = tgt.y + height;

        cam.position.set(x, y, z);
        cam.lookAt(tgt);

        cam.fov = THREE.MathUtils.lerp(startFov, endFov, k);
        cam.updateProjectionMatrix();

        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
  }

  async playSequence(shots) {
    for (const s of shots) {
      if (!s) continue;
      if (s.pan) await this.panTilt(s.pan);
      else if (s.orbit) await this.orbitAround(s.orbit);
      else await this.flyTo(s);
      if (s.linger) await new Promise(r => setTimeout(r, s.linger));
    }
  }

  _ease(name) {
    switch (name) {
      case 'linear': return t => t;
      case 'quadIn': return t => t * t;
      case 'quadOut': return t => t * (2 - t);
      case 'quadInOut':
      default:
        return t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    }
  }
}
