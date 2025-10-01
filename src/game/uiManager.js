import { UIComponent } from './uiComponent.js';

export class UIManager {
  constructor(root = document.getElementById('app')) {
    this.root = root || document.body;
    this.components = new Map(); // key -> component instance
  }

  // Register a component factory. factory should be a class (subclass of UIComponent) or a function returning an instance.
  add(key, factoryOrInstance, props) {
    if (this.components.has(key)) return this.components.get(key);
    let inst;
    if (typeof factoryOrInstance === 'function') {
      inst = new factoryOrInstance(this.root, props);
    } else {
      inst = factoryOrInstance;
      if (props && inst.setProps) inst.setProps(props);
    }
    if (inst.mount) {
      inst.mount();
      // Ensure the component root accepts pointer events so interactive elements work
      // BUT respect if the component specifically set pointerEvents to 'none'
      try { 
        if (inst.root && inst.root.style && inst.root.style.pointerEvents !== 'none') {
          inst.root.style.pointerEvents = 'auto';
        }
      } catch (e) { /* ignore */ }
    }
    this.components.set(key, inst);
    return inst;
  }

  get(key) {
    return this.components.get(key);
  }

  remove(key) {
    const inst = this.components.get(key);
    if (!inst) return;
    if (inst.unmount) inst.unmount();
    this.components.delete(key);
  }

  clear() {
    for (const k of Array.from(this.components.keys())) this.remove(k);
  }

  update(delta, ctx) {
    for (const inst of this.components.values()) {
      if (inst.update) inst.update(delta, ctx);
    }
  }
}
