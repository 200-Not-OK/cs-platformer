import { UIComponent } from '../uiComponent.js';

export class WorldMap extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'worldmap-overlay';
    this.root.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(5,8,12,0.88);
      backdrop-filter: blur(2px);
      display: none;
      z-index: 999;
      align-items: center;
      justify-content: center;
    `;

    // panel
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: min(92vw, 1100px);
      height: min(88vh, 720px);
      background: #0e1420;
      border: 1px solid #2a3550;
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 8px;
    `;
    this.root.appendChild(panel);

    // title bar
    const title = document.createElement('div');
    title.textContent = 'World Map';
    title.style.cssText = `
      color: #dfe7ff;
      font: 600 16px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial;
      letter-spacing: 0.4px;
    `;
    panel.appendChild(title);

    // canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1600;
    this.canvas.height = 1000;
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      background: radial-gradient(1200px 700px at 60% 35%, #0f1a2a 0%, #0a111c 60%, #080d16 100%);
      border-radius: 10px;
    `;
    panel.appendChild(this.canvas);
    this.ctx2d = this.canvas.getContext('2d');

    // footer/help
    const footer = document.createElement('div');
    footer.innerHTML = `<span style="color:#93a3c7">M</span> to close · Player <span style="color:#79d2ff">●</span> · Enemies <span style="color:#ff7b7b">▲</span>`;
    footer.style.cssText = `color:#8ca0c9;font:500 12px system-ui;opacity:0.9;`;
    panel.appendChild(footer);

    this._visible = false;
  }

  show(v = true) {
    this._visible = !!v;
    this.root.style.display = this._visible ? 'flex' : 'none';
  }

  toggle() { this.show(!this._visible); }

  setProps(props) {
    super.setProps(props);
  }

  // Simple 2D map from levelData + player position.
  update(_delta, ctx) {
    if (!this._visible) return;

    const levelData = ctx?.map?.levelData;
    const playerPos = ctx?.map?.playerPos;
    const enemies = ctx?.map?.enemies || [];

    const g = this.ctx2d;
    const w = this.canvas.width, h = this.canvas.height;
    g.clearRect(0, 0, w, h);

    // World to map transform
    const bounds = this._getBounds(levelData);
    const pad = 30;
    const sx = (w - pad * 2) / (bounds.maxx - bounds.minx || 1);
    const sz = (h - pad * 2) / (bounds.maxz - bounds.minz || 1);
    const scale = Math.min(sx, sz) * 0.95; // uniform

    const toX = (x) => pad + (x - bounds.minx) * scale + (w - ((bounds.maxx - bounds.minx) * scale + pad * 2)) * 0.5;
    const toZ = (z) => pad + (z - bounds.minz) * scale + (h - ((bounds.maxz - bounds.minz) * scale + pad * 2)) * 0.5;

    // draw fallback geometry footprints (if present)
    if (Array.isArray(levelData?.fallbackObjects)) {
      for (const obj of levelData.fallbackObjects) {
        if (obj.type !== 'box') continue;
        const [x, y, z] = obj.position;
        const [sxBox, _syBox, szBox] = obj.size;
        const x0 = toX(x - sxBox / 2);
        const x1 = toX(x + sxBox / 2);
        const z0 = toZ(z - szBox / 2);
        const z1 = toZ(z + szBox / 2);
        g.fillStyle = '#1a2b48';
        g.strokeStyle = '#2d4c7f';
        g.lineWidth = 1.5;
        g.fillRect(x0, z0, x1 - x0, z1 - z0);
        g.strokeRect(x0, z0, x1 - x0, z1 - z0);
      }
    }

    // enemy spawn points
    g.fillStyle = '#ff7b7b';
    for (const e of enemies) {
      const [ex, _ey, ez] = e.position || [0, 0, 0];
      const px = toX(ex), pz = toZ(ez);
      this._triangle(g, px, pz, 8);
    }

    // player
    if (playerPos) {
      g.beginPath();
      g.arc(toX(playerPos.x), toZ(playerPos.z), 7, 0, Math.PI * 2);
      g.fillStyle = '#79d2ff';
      g.fill();
    }

    // frame
    g.strokeStyle = '#40598f';
    g.lineWidth = 2;
    g.strokeRect(10, 10, w - 20, h - 20);
  }

  _triangle(g, x, y, r) {
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.86, y + r * 0.5);
    g.lineTo(x - r * 0.86, y + r * 0.5);
    g.closePath();
    g.fill();
  }

  _getBounds(levelData) {
    // derive bounds from fallbackObjects and enemy positions; if none, default square
    let minx = -25, maxx = 25, minz = -25, maxz = 25;

    if (Array.isArray(levelData?.fallbackObjects)) {
      for (const o of levelData.fallbackObjects) {
        if (o.type !== 'box') continue;
        const [x, _y, z] = o.position;
        const [sx, _sy, sz] = o.size;
        minx = Math.min(minx, x - sx / 2);
        maxx = Math.max(maxx, x + sx / 2);
        minz = Math.min(minz, z - sz / 2);
        maxz = Math.max(maxz, z + sz / 2);
      }
    }

    if (Array.isArray(levelData?.enemies)) {
      for (const e of levelData.enemies) {
        if (!e.position) continue;
        const [x, _y, z] = e.position;
        minx = Math.min(minx, x - 5);
        maxx = Math.max(maxx, x + 5);
        minz = Math.min(minz, z - 5);
        maxz = Math.max(maxz, z + 5);
      }
    }

    return { minx, maxx, minz, maxz };
  }
}
