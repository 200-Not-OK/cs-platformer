import { UIComponent } from '../uiComponent.js';

export class Minimap extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);

    // Config
    this.width = props.width ?? 180;
    this.height = props.height ?? 180;
    this.zoom = props.zoom ?? 12;             // world units per 100px (lower = closer)
    this.minZoom = 6;
    this.maxZoom = 40;
    this.rotateWithPlayer = props.rotateWithPlayer ?? true;
    this.showEnemies = props.showEnemies ?? true;
    this.showBounds = props.showBounds ?? true;

    // Root styling
    this.root.className = 'game-minimap';
    Object.assign(this.root.style, {
      position: 'absolute',
      right: '14px',
      top: '14px',
      width: `${this.width}px`,
      height: `${this.height}px`,
      background: 'rgba(6,10,16,0.72)',
      border: '1px solid rgba(64,89,143,0.55)',
      borderRadius: '12px',
      backdropFilter: 'blur(2px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      overflow: 'hidden',
      pointerEvents: 'auto',
      zIndex: 10
    });

    // Header bar
    const header = document.createElement('div');
    header.textContent = 'Minimap';
    Object.assign(header.style, {
      position: 'absolute',
      left: '8px',
      top: '6px',
      color: '#cfdaf7',
      font: '600 11px system-ui, -apple-system, Segoe UI, Roboto',
      letterSpacing: '0.3px',
      opacity: '0.9',
      pointerEvents: 'none'
    });
    this.root.appendChild(header);

    // Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    Object.assign(this.canvas.style, { position: 'absolute', inset: '0' });
    this.root.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d');

    // Zoom controls
    const makeBtn = (label) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        width: '22px',
        height: '22px',
        borderRadius: '8px',
        border: '1px solid rgba(72,96,150,0.6)',
        background: 'rgba(18,26,40,0.9)',
        color: '#dbe6ff',
        font: '600 12px system-ui',
        cursor: 'pointer'
      });
      return b;
    };
    const ui = document.createElement('div');
    Object.assign(ui.style, { position: 'absolute', right: '6px', bottom: '6px', display: 'grid', gridAutoFlow: 'column', gap: '6px' });
    this.zoomOutBtn = makeBtn('−');
    this.zoomInBtn  = makeBtn('+');
    ui.appendChild(this.zoomOutBtn);
    ui.appendChild(this.zoomInBtn);
    this.root.appendChild(ui);

    this.zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); this.zoom = Math.max(this.minZoom, this.zoom - 2); });
    this.zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); this.zoom = Math.min(this.maxZoom, this.zoom + 2); });

    // Compass (N)
    this.compass = document.createElement('div');
    this.compass.textContent = 'N';
    Object.assign(this.compass.style, {
      position: 'absolute',
      left: '8px',
      bottom: '6px',
      color: '#8fb2ff',
      font: '700 12px system-ui',
      textShadow: '0 1px 1px rgba(0,0,0,0.5)'
    });
    this.root.appendChild(this.compass);

    this._t = 0;
  }

  setProps(props) {
    super.setProps(props);
    if (props.width || props.height) {
      this.width = props.width ?? this.width;
      this.height = props.height ?? this.height;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.root.style.width = `${this.width}px`;
      this.root.style.height = `${this.height}px`;
    }
    if (props.zoom) this.zoom = props.zoom;
    if (props.rotateWithPlayer !== undefined) this.rotateWithPlayer = !!props.rotateWithPlayer;
    if (props.showEnemies !== undefined) this.showEnemies = !!props.showEnemies;
    if (props.showBounds !== undefined) this.showBounds = !!props.showBounds;
  }

  update(delta, ctx) {
    this._t += delta;
    const g = this.g; if (!g) return;
    const w = this.canvas.width, h = this.canvas.height;

    g.clearRect(0, 0, w, h);
    this._drawBackgroundGrid(g, w, h);

    // Gather context
    const playerModel = ctx?.playerModel;
    const playerPos = playerModel?.position;
    const playerRotY = playerModel?.rotation?.y ?? 0;
    const levelData = ctx?.map?.levelData;
    const enemies = (this.showEnemies ? (ctx?.map?.enemies || []) : []);

    // Nodes can come from ctx.map.nodes; if not provided, fall back to levelData.nodePoints
    const nodes = Array.isArray(ctx?.map?.nodes) ? ctx.map.nodes
                : Array.isArray(levelData?.nodePoints)
                  ? levelData.nodePoints.map((p, i) => ({ id: i, pos: p, isNext: false }))
                  : [];

    const nextNodeId = typeof ctx?.map?.nextNodeId === 'number' ? ctx.map.nextNodeId : null;

    if (!playerPos) {
      g.fillStyle = 'rgba(220,230,255,0.85)';
      g.font = '600 12px system-ui';
      g.textAlign = 'center';
      g.fillText('No player', w * 0.5, h * 0.5);
      return;
    }

    // zoom is world units per 100px; derive scale (px per unit)
    const scale = 100 / this.zoom;
    const cx = w * 0.5, cy = h * 0.5;

    g.save();
    g.translate(cx, cy);
    if (this.rotateWithPlayer) g.rotate(-playerRotY);

    // Bounds (from fallback objects footprints)
    if (this.showBounds && Array.isArray(levelData?.fallbackObjects)) {
      for (const obj of levelData.fallbackObjects) {
        if (obj.type !== 'box') continue;
        const [x, , z] = obj.position;
        const [sx, , sz] = obj.size;
        const x0 = (x - sx/2 - playerPos.x) * scale;
        const x1 = (x + sx/2 - playerPos.x) * scale;
        const z0 = (z - sz/2 - playerPos.z) * scale;
        const z1 = (z + sz/2 - playerPos.z) * scale;
        g.fillStyle = '#16263f';
        g.strokeStyle = '#2c4676';
        g.lineWidth = 1;
        g.fillRect(x0, -z1, x1 - x0, (z1 - z0));
        g.strokeRect(x0, -z1, x1 - x0, (z1 - z0));
      }
    }

    // Nodes
    for (const n of nodes) {
      const [nx, , nz] = n.pos || n.position || [0,0,0];
      const dx = (nx - playerPos.x) * scale;
      const dz = (nz - playerPos.z) * scale;

      // pulsing ring for the next node
      if (n.isNext || (nextNodeId !== null && n.id === nextNodeId)) {
        const pulse = 7 + 4 * Math.sin(this._t * 6);
        g.strokeStyle = '#22c55e';
        g.lineWidth = 3;
        g.beginPath(); g.arc(dx, -dz, pulse, 0, Math.PI*2); g.stroke();
        g.fillStyle = '#22c55e';
        g.beginPath(); g.arc(dx, -dz, 4, 0, Math.PI*2); g.fill();
      } else {
        g.fillStyle = '#93c5fd';
        g.beginPath(); g.arc(dx, -dz, 5, 0, Math.PI*2); g.fill();
      }
    }

    // Enemies
    g.fillStyle = '#ff7b7b';
    for (const e of enemies) {
      const [ex, , ez] = e.position || [0,0,0];
      const dx = (ex - playerPos.x) * scale;
      const dz = (ez - playerPos.z) * scale;
      this._triangle(g, dx, -dz, 6);
    }

    // Player arrow
    this._drawPlayerArrow(g);
    g.restore();

    // compass tooltip
    if (this.rotateWithPlayer) {
      const deg = Math.round((playerRotY * 180 / Math.PI) % 360);
      this.compass.title = `North (player yaw ${deg}°)`;
    } else {
      this.compass.title = `North`;
    }
  }

  // Helpers
  _drawBackgroundGrid(g, w, h) {
    const grad = g.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, Math.max(w,h)*0.6);
    grad.addColorStop(0, 'rgba(22,30,48,0.9)');
    grad.addColorStop(1, 'rgba(9,13,22,1.0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    g.strokeStyle = 'rgba(90,116,168,0.22)';
    g.lineWidth = 1;
    const step = 24;
    g.beginPath();
    for (let x = (w % step); x < w; x += step) { g.moveTo(x, 0); g.lineTo(x, h); }
    for (let y = (h % step); y < h; y += step) { g.moveTo(0, y); g.lineTo(w, y); }
    g.stroke();

    g.strokeStyle = 'rgba(80,108,172,0.5)';
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, w-1, h-1);
  }

  _triangle(g, x, y, r) {
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.86, y + r * 0.5);
    g.lineTo(x - r * 0.86, y + r * 0.5);
    g.closePath();
    g.fill();
  }

  _drawPlayerArrow(g) {
    g.save();
    g.shadowColor = 'rgba(121,210,255,0.45)';
    g.shadowBlur = 8;
    g.fillStyle = '#79d2ff';
    this._triangle(g, 0, 0, 9);
    g.restore();

    g.beginPath();
    g.arc(0, 0, 2, 0, Math.PI * 2);
    g.fillStyle = '#d7f1ff';
    g.fill();
  }
}
