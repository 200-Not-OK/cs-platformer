import { UIComponent } from '../uiComponent.js';

export class Minimap extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'game-minimap';
    this.root.style.position = 'absolute';
    this.root.style.right = '12px';
    this.root.style.top = '12px';
    this.root.style.width = '160px';
    this.root.style.height = '120px';
    this.root.style.background = 'rgba(0,0,0,0.5)';
    this.root.style.color = 'white';
    this.root.style.padding = '6px';
    this.root.style.fontSize = '12px';
    this.root.style.pointerEvents = 'auto';

    this.title = document.createElement('div');
    this.title.textContent = 'Minimap';
    this.root.appendChild(this.title);

    this.posEl = document.createElement('div');
    this.posEl.textContent = 'x:0 y:0 z:0';
    this.root.appendChild(this.posEl);
  }

  update(delta, ctx) {
    if (!ctx) return;
    const player = ctx.playerModel;
    if (!player || !player.position) return;
    const p = player.position;
    this.posEl.textContent = `x:${p.x.toFixed(1)} z:${p.z.toFixed(1)} y:${p.y.toFixed(1)}`;
  }
}
