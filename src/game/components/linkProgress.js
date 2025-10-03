import { UIComponent } from '../uiComponent.js';

export class LinkProgress extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'ui-link-progress';
    this.root.style.cssText = `
      position: absolute; top: 12px; left: 12px; pointer-events: none;
      color: #e5e7eb; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
      font-size: 14px; background: rgba(0,0,0,0.45); padding: 6px 10px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
    `;
    this.root.textContent = 'Linked: 0 / 0';
  }

  setProgress(linked, total) {
    this.root.textContent = `Linked: ${linked} / ${total}`;
  }
}
