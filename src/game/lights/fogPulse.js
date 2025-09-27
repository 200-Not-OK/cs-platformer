import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class FogPulse extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.scene = null;
    this.elapsed = 0;
    this._origFog = null;
  }

  mount(scene) {
    this.scene = scene;
    const {
      color = 0x111623,
      density = 0.015,
      pulse = true,
      pulseSpeed = 0.4,
      densityMin = 0.01,
      densityMax = 0.02
    } = this.props;

    // remember existing fog to restore on unmount
    this._origFog = scene.fog ? scene.fog : null;

    const fog = new THREE.FogExp2(color, density);
    scene.fog = fog;

    this._pulse = pulse;
    this._pulseSpeed = pulseSpeed;
    this._densityMin = densityMin;
    this._densityMax = densityMax;

    this._mounted = true;
  }

  unmount(scene) {
    if (!scene) return;
    // restore previous fog (or clear)
    scene.fog = this._origFog || null;
    this._mounted = false;
  }

  update(delta) {
    if (!this._mounted || !this.scene || !this.scene.fog) return;
    if (!this._pulse) return;
    this.elapsed += delta;
    const t = (Math.sin(this.elapsed * this._pulseSpeed) + 1) * 0.5; // 0..1
    const d = this._densityMin + (this._densityMax - this._densityMin) * t;
    this.scene.fog.density = d;
  }
}
