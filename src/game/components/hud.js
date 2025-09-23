import { UIComponent } from '../uiComponent.js';

export class HUD extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'game-hud';
    // Basic HUD layout
    this.root.style.position = 'absolute';
    this.root.style.left = '20px';
    this.root.style.top = '20px';
    this.root.style.color = 'white';
    this.root.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial';
    this.root.style.pointerEvents = 'none';

    this._createElements();
    this.setProps(props);
  }

  _createElements() {
    this.healthEl = document.createElement('div');
    this.healthEl.textContent = 'Health: 100';
    this.root.appendChild(this.healthEl);

    this.infoEl = document.createElement('div');
    this.infoEl.style.marginTop = '8px';
    this.infoEl.textContent = '';
    this.root.appendChild(this.infoEl);
  }

  setProps(props) {
    super.setProps(props);
    if (props && props.health !== undefined) {
      this.healthEl.textContent = `Health: ${props.health}`;
    }
  }

  update(delta, ctx) {
    // ctx can contain game state like player health/score
    if (ctx && ctx.player) {
      const hp = Math.round(ctx.player.health ?? 100);
      this.healthEl.textContent = `Health: ${hp}`;
    }
  }
}
