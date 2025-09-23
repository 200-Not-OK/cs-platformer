import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class PointPulse extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.light = null;
    this.time = 0;
  }

  mount(scene) {
    const color = this.props.color ?? 0xffaa33;
    this.light = new THREE.PointLight(color, this.props.intensity ?? 1, this.props.distance ?? 20);
    const pos = this.props.position ?? [0, 4, 0];
    this.light.position.set(...pos);
    scene.add(this.light);
    this._mounted = true;
  }

  unmount(scene) {
    if (this.light) scene.remove(this.light);
    this.light = null;
    this._mounted = false;
  }

  update(delta) {
    if (!this.light) return;
    this.time += delta;
    const speed = this.props.speed ?? 2.0;
    const base = this.props.intensity ?? 1.0;
    this.light.intensity = base * (0.6 + 0.4 * Math.sin(this.time * speed));
  }
}
