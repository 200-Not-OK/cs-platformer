import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class BasicLights extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.dir = null;
    this.amb = null;
  }

  mount(scene) {
    this.dir = new THREE.DirectionalLight(this.props.color ?? 0xffffff, this.props.intensity ?? 1);
    const pos = this.props.direction ?? [10, 20, 10];
    this.dir.position.set(...pos);
    scene.add(this.dir);

    this.amb = new THREE.AmbientLight(this.props.ambientColor ?? 0xe8e8e8, this.props.ambientIntensity ?? 1.4);
    scene.add(this.amb);
    this._mounted = true;
  }

  unmount(scene) {
    if (this.dir) scene.remove(this.dir);
    if (this.amb) scene.remove(this.amb);
    this.dir = null;
    this.amb = null;
    this._mounted = false;
  }

  update(/*delta*/) {
    // static by default
  }
}
