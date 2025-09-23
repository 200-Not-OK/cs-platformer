// Base UI component class. Subclass this to create reusable UI widgets.
export class UIComponent {
  constructor(container = document.body, props = {}) {
    this.container = container || document.body;
    this.props = props || {};
    this.root = document.createElement('div');
  }

  // Called to attach the component to DOM
  mount() {
    this.container.appendChild(this.root);
  }

  // Called to remove the component from DOM
  unmount() {
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
  }

  // Per-frame update (delta seconds, ctx is arbitrary context object)
  update(delta, ctx) { /* optional override */ }

  setProps(props) {
    this.props = Object.assign({}, this.props, props);
  }
}
