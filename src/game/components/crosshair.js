import { UIComponent } from '../uiComponent.js';

export class Crosshair extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'crosshair';
    console.log('🎯 Creating crosshair component'); // Debug log
    this._createCrosshair();
    this.setProps(props);
    console.log('🎯 Crosshair created and positioned'); // Debug log
  }

  mount() {
    super.mount();
    console.log('🎯 Crosshair mounted to DOM'); // Debug log
    console.log('🎯 Crosshair container:', this.container); // Debug log
    console.log('🎯 Crosshair root in DOM:', document.contains(this.root)); // Debug log
  }

  _createCrosshair() {
    // Position the crosshair in the center of the screen
    this.root.style.position = 'fixed';
    this.root.style.top = '50%';
    this.root.style.left = '50%';
    this.root.style.transform = 'translate(-50%, -50%)';
    this.root.style.pointerEvents = 'none';
    this.root.style.zIndex = '99999'; // Very high z-index
    this.root.style.width = '30px'; // Back to original size
    this.root.style.height = '30px'; // Back to original size
    // Removed debug styling

    console.log('🎯 Crosshair root element:', this.root); // Debug log
    console.log('🎯 Crosshair parent:', this.root.parentElement); // Debug log

    // Create the crosshair visual
    const vertical = document.createElement('div');
    vertical.style.position = 'absolute';
    vertical.style.top = '50%';
    vertical.style.left = '50%';
    vertical.style.width = '2px'; // Keep thickness the same
    vertical.style.height = '20px'; // Made longer (was 16px)
    vertical.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Slightly transparent white
    vertical.style.transform = 'translate(-50%, -50%)';
    vertical.style.borderRadius = '1px';
    vertical.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.8)'; // Clean shadow

    const horizontal = document.createElement('div');
    horizontal.style.position = 'absolute';
    horizontal.style.top = '50%';
    horizontal.style.left = '50%';
    horizontal.style.width = '20px'; // Made longer (was 16px)
    horizontal.style.height = '2px'; // Keep thickness the same
    horizontal.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Slightly transparent white
    horizontal.style.transform = 'translate(-50%, -50%)';
    horizontal.style.borderRadius = '1px';
    horizontal.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.8)'; // Clean shadow

    // Center dot
    const dot = document.createElement('div');
    dot.style.position = 'absolute';
    dot.style.top = '50%';
    dot.style.left = '50%';
    dot.style.width = '3px'; // Back to normal size
    dot.style.height = '3px'; // Back to normal size
    dot.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // Slightly transparent white
    dot.style.transform = 'translate(-50%, -50%)';
    dot.style.borderRadius = '50%';
    dot.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.8)'; // Clean shadow

    this.root.appendChild(vertical);
    this.root.appendChild(horizontal);
    this.root.appendChild(dot);
  }

  setProps(props) {
    super.setProps(props);
    console.log('🎯 Crosshair setProps called with:', props); // Debug log
    // Can add props for different crosshair styles, colors, etc.
    if (props && props.visible !== undefined) {
      const displayValue = props.visible ? 'block' : 'none';
      this.root.style.display = displayValue;
      console.log(`🎯 Crosshair display set to: ${displayValue}`); // Debug log
    }
  }

  update(delta, ctx) {
    // Can add animations, hit indicators, etc.
  }
}