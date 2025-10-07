import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class HemisphereFill extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.light = null;
  }

  mount(scene) {
    this.light = new THREE.HemisphereLight(this.props.skyColor ?? 0xb1e1ff, this.props.groundColor ?? 0x444444, this.props.intensity ?? 0.01);
    scene.add(this.light);
    this._mounted = true;
  }

  unmount(scene) {
    if (this.light) scene.remove(this.light);
    this.light = null;
    this._mounted = false;
  }
}
