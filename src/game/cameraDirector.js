// src/game/cameraDirector.js
import * as THREE from 'three';

export class CameraDirector {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;

    this.freeCam = game.freeCam;              // controller
    this.cam = game.freeCameraObject;         // THREE.PerspectiveCamera
    this.originalActive = null;               // THREE.Camera
    this._fadeEl = null;
    this._shake = { t: 0, mag: 0 };
    this._raf = null;

    this._ensureFadeEl();
  }

  takeControl() {
    if (this.game.activeCamera !== this.cam) {
      this.originalActive = this.game.activeCamera || null;
      if (this.freeCam?.moveNearPlayer && this.game.player) {
        this.freeCam.moveNearPlayer(this.game.player, new THREE.Vector3(10, 6, 10), false);
      }
      this.game.activeCamera = this.cam;
      if (this.game.input) this.game.input.alwaysTrackMouse = false;

      // ensure pointer lock is off during cinematic
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        this.game._suppressPointerLockPause = true;
        document.exitPointerLock();
      }
    }
    // per-frame hook to apply shakes
    const loop = () => {
      if (this._shake.t > 0) {
        this._shake.t -= this.game ? (1/60) : 0.016;
        const m = this._shake.mag * (this._shake.t > 0 ? (this._shake.t) : 0);
        this.cam.position.x += (Math.random() - 0.5) * m;
        this.cam.position.y += (Math.random() - 0.5) * m * 0.6;
        this.cam.position.z += (Math.random() - 0.5) * m;
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  async release() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._shake.t = 0;

    // restore original camera if any
    if (this.originalActive) {
      this.game.activeCamera = this.originalActive;
      if (this.game.input) this.game.input.alwaysTrackMouse = true;
      if (this.game.player?.mesh) this.game.player.mesh.visible = true;
      this.originalActive = null;
    }
  }

  // --- SHOTS -------------------------------------------------------------

  cutTo({ position, lookAt, fov }) {
    if (position) this.cam.position.set(position[0], position[1], position[2]);
    if (lookAt) this.cam.lookAt(new THREE.Vector3(...lookAt));
    if (typeof fov === 'number') { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
  }

  async moveTo({ position, lookAt, fov, duration = 1500, ease = 'quadInOut' }) {
    const startPos = this.cam.position.clone();
    const endPos = new THREE.Vector3(...position);
    const startFov = this.cam.fov;
    const endFov = (typeof fov === 'number') ? fov : startFov;
    const t0 = performance.now();

    return new Promise(res => {
      const step = () => {
        const t = Math.min((performance.now() - t0) / duration, 1);
        const k = easeFn(ease, t);
        this.cam.position.lerpVectors(startPos, endPos, k);
        if (lookAt) this.cam.lookAt(new THREE.Vector3(...lookAt));
        if (endFov !== startFov) {
          this.cam.fov = startFov + (endFov - startFov) * k;
          this.cam.updateProjectionMatrix();
        }
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  async orbitAround({ center, radius = 12, startDeg = 0, endDeg = 120, height = 6, lookAt = null, duration = 2500, ease = 'quadInOut' }) {
    const c = new THREE.Vector3(...center);
    const t0 = performance.now();
    return new Promise(res => {
      const step = () => {
        const t = Math.min((performance.now() - t0) / duration, 1);
        const k = easeFn(ease, t);
        const ang = THREE.MathUtils.degToRad(startDeg + (endDeg - startDeg) * k);
        const x = c.x + Math.cos(ang) * radius;
        const z = c.z + Math.sin(ang) * radius;
        this.cam.position.set(x, c.y + height, z);
        this.cam.lookAt(lookAt ? new THREE.Vector3(...lookAt) : c);
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  async zoomTo({ fov = 35, duration = 1200, ease = 'quadInOut' }) {
    const start = this.cam.fov, end = fov, t0 = performance.now();
    return new Promise(res => {
      const step = () => {
        const t = Math.min((performance.now() - t0) / duration, 1);
        const k = easeFn(ease, t);
        this.cam.fov = start + (end - start) * k;
        this.cam.updateProjectionMatrix();
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  shake({ seconds = 0.6, magnitude = 0.1 }) {
    this._shake.t = seconds;
    this._shake.mag = magnitude;
  }

  async fadeIn({ ms = 600 })  { await this._fade(1, 0, ms); }
  async fadeOut({ ms = 600 }) { await this._fade(0, 1, ms); }

  _ensureFadeEl() {
    if (this._fadeEl) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; inset:0; background:#000; opacity:0; pointer-events:none; 
      transition:none; z-index:9999;`;
    document.body.appendChild(el);
    this._fadeEl = el;
  }

  _fade(from, to, ms) {
    return new Promise(res => {
      this._fadeEl.style.transition = 'none';
      this._fadeEl.style.opacity = from.toString();
      // next frame apply transition
      requestAnimationFrame(() => {
        this._fadeEl.style.transition = `opacity ${ms}ms ease`;
        this._fadeEl.style.opacity = to.toString();
        setTimeout(res, ms);
      });
    });
  }

  /**
   * Face-on shot for a world-space target (snake/chest).
   * Places camera on a cardinal side at a fixed distance/height, looks straight at target,
   * and optionally searches around for a clear line-of-sight.
   */
  async focusOn(targetVec3, opts = {}) {
    const {
      side = 'east',     // 'east'|'west'|'north'|'south'
      distance = 7,
      height = 2,
      fov = 50,
      duration = 0,
      losFix = true
    } = opts;

    const dirMap = {
      east:  new THREE.Vector3( 1, 0,  0),
      west:  new THREE.Vector3(-1, 0,  0),
      south: new THREE.Vector3( 0, 0,  1),
      north: new THREE.Vector3( 0, 0, -1),
    };

    const center = (targetVec3.isVector3 ? targetVec3 : new THREE.Vector3(...(Array.isArray(targetVec3) ? targetVec3 : [0,0,0])));
    let dir = dirMap[side] || dirMap.east;

    let pos = center.clone().addScaledVector(dir, distance);
    pos.y = center.y + height;

    if (losFix) {
      const ray = new THREE.Raycaster();
      const maxTries = 12;
      for (let i = 0; i < maxTries; i++) {
        ray.set(pos, center.clone().sub(pos).normalize());
        const hits = ray.intersectObjects(this.scene.children, true);
        const toCenter = pos.distanceTo(center);
        let blocked = false;
        if (hits.length) {
          const hit = hits[0];
          // if the hit point is *not* basically at the center (target), treat as blockage
          const isTargetSelf = hit.point.distanceTo(center) < 0.75;
          blocked = !isTargetSelf && hit.distance < toCenter - 0.15;
        }
        if (!blocked) break;
        // rotate around center while keeping distance/height until we find a clear angle
        const ang = (i + 1) * (Math.PI / 6); // 30° steps
        dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
        pos = center.clone().addScaledVector(dir, distance);
        pos.y = center.y + height;
      }
    }

    if (duration > 0) {
      await this.moveTo({ position: [pos.x, pos.y, pos.z], lookAt: [center.x, center.y, center.z], fov, duration });
    } else {
      this.cutTo({ position: [pos.x, pos.y, pos.z], lookAt: [center.x, center.y, center.z], fov });
    }
  }
}

// simple easings
function easeFn(name, t) {
  if (name === 'linear') return t;
  if (name === 'quadInOut') return t<0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
  if (name === 'quadOut') return 1 - (1-t)*(1-t);
  return t;
}
