import * as THREE from 'three';
import { LightComponent } from './lightComponent.js';

export class LightManager {
  constructor(scene) {
    this.scene = scene;
    this._instances = new Map();
  }

  add(key, ComponentClass, props = {}) {
    if (this._instances.has(key)) return this._instances.get(key);
    const inst = new ComponentClass(props);
    if (!(inst instanceof LightComponent)) {
      // allow either subclassing LightComponent or a plain object with mount/unmount
    }
    inst.mount && inst.mount(this.scene);
    this._instances.set(key, inst);
    return inst;
  }

  remove(key) {
    const inst = this._instances.get(key);
    if (!inst) return;
    inst.unmount && inst.unmount(this.scene);
    this._instances.delete(key);
  }

  clear() {
    for (const [k, inst] of this._instances) {
      inst.unmount && inst.unmount(this.scene);
    }
    this._instances.clear();
  }

  update(delta) {
    for (const inst of this._instances.values()) {
      inst.update && inst.update(delta);
    }
  }
}
