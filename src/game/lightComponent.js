import * as THREE from 'three';

// Base class for lighting modules. Subclasses should create a THREE.Light
// (or group) and add it to the scene in `mount` and remove in `unmount`.
export class LightComponent {
  constructor(props = {}) {
    this.props = props;
    this._mounted = false;
  }

  setProps(props = {}) {
    this.props = { ...(this.props || {}), ...props };
    if (this._mounted && this.update) this.update(0);
  }

  mount(scene) {
    // override in subclass to create and add lights to scene
    this._mounted = true;
  }

  unmount(scene) {
    // override in subclass to remove lights from scene
    this._mounted = false;
  }

  update(/*delta*/) {
    // optional per-frame updates (e.g. pulsing lights)
  }
}
