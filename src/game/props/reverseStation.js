import * as THREE from 'three';

export class ReverseStation {
  constructor(scene, position = [0, 3.2, 10], opts = {}) {
    this.scene = scene;
    this.position = new THREE.Vector3(...position);
    this.interactRadius = opts.interactRadius ?? 3.0;
    this._interacted = false;

    this.root = new THREE.Group();
    this.root.position.copy(this.position);
    this.scene.add(this.root);

    const metal = new THREE.MeshStandardMaterial({ color: 0x22303f, metalness: 0.7, roughness: 0.35 });
    const panel = new THREE.MeshStandardMaterial({ color: 0x2b3648, metalness: 0.2, roughness: 0.8 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x8ecaff, emissive: 0x162738, emissiveIntensity: 0.35, metalness: 0.1, roughness: 0.1 });
    const accentGreen = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x0b5d2b, emissiveIntensity: 0.9 });
    const accentAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x6a3d00, emissiveIntensity: 0.8 });
    const accentRed   = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x4a0a0a, emissiveIntensity: 0.9 });

    const gBase = new THREE.BoxGeometry(8, 0.5, 6);
    const mBase = metal.clone(); mBase.color.set(0x1f2a38);
    this.base = new THREE.Mesh(gBase, mBase); this.base.receiveShadow = true; this.root.add(this.base);

    const mkRail = (x) => {
      const g = new THREE.BoxGeometry(0.2, 1.4, 6);
      const mesh = new THREE.Mesh(g, panel); mesh.position.set(x, 0.7, 0); mesh.castShadow = mesh.receiveShadow = true; return mesh;
    };
    this.root.add(mkRail(-3.5), mkRail(3.5));

    const pedG = new THREE.BoxGeometry(2, 2, 2);
    this.pedestal = new THREE.Mesh(pedG, panel); this.pedestal.position.set(-1, 1, 0); this.pedestal.castShadow = this.pedestal.receiveShadow = true; this.root.add(this.pedestal);

    const scrG = new THREE.BoxGeometry(2.2, 1.2, 0.2);
    this.screen = new THREE.Mesh(scrG, glass); this.screen.position.set(-1, 2.2, -0.8); this.screen.rotation.x = THREE.MathUtils.degToRad(-12); this.root.add(this.screen);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x8ecaff, transparent: true, opacity: 0.25 });
    const glowGeo = new THREE.PlaneGeometry(2.4, 1.3);
    this.screenGlow = new THREE.Mesh(glowGeo, glowMat); this.screenGlow.position.set(0, 0, 0.12); this.screen.add(this.screenGlow);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 0.2), panel);
    wall.position.set(0, 1.1, 2.8); wall.castShadow = wall.receiveShadow = true; this.root.add(wall);
    const mkLamp = (x, mat) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.2), mat.clone());
      lamp.position.set(x, 1.6, 0.11); lamp.userData._baseEmissive = lamp.material.emissiveIntensity; wall.add(lamp); return lamp;
    };
    this.lamps = [ mkLamp(-2.8, accentGreen), mkLamp(-2.0, accentAmber), mkLamp(-1.2, accentRed) ];

    const torus = new THREE.TorusGeometry(1.8, 0.06, 16, 64);
    this.ring = new THREE.Mesh(torus, new THREE.MeshStandardMaterial({
      color: 0x7dd3fc, emissive: 0x0a3a4f, emissiveIntensity: 1.1, metalness: 0.6, roughness: 0.3
    }));
    this.ring.position.set(2.4, 1.3, 0); this.root.add(this.ring);

    // Prompt
    const spriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    this.prompt = new THREE.Sprite(spriteMat); this.prompt.scale.set(0.9, 0.3, 1); this.prompt.position.set(-1, 2.9, -0.8); this.prompt.visible = false; this.root.add(this.prompt);
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff'; ctx.font = '28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Press E: Reverse', canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas); this.prompt.material.map = tex; this.prompt.material.needsUpdate = true;

    this._rangeHelper = new THREE.Mesh(
      new THREE.SphereGeometry(this.interactRadius, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true, transparent: true, opacity: 0.08 })
    );
    this._rangeHelper.visible = false; this.root.add(this._rangeHelper);

    this._t = 0;
  }

  update(delta = 1/60) {
    this._t += delta;
    const bob = Math.sin(this._t * 2.2) * 0.06;
    this.ring.position.y = 1.3 + bob;
    this.ring.rotation.y += delta * 1.2;

    const pulse = 0.35 + Math.sin(this._t * 3.0) * 0.25;
    if (!this._interacted) {
      this.screen.material.emissiveIntensity = 0.35 + pulse * 0.35;
      this.lamps.forEach((lamp, i) => {
        const phase = this._t * 3.2 + i * 0.6;
        lamp.material.emissiveIntensity = lamp.userData._baseEmissive + 0.4 * (0.5 + 0.5 * Math.sin(phase));
      });
    } else {
      this.screen.material.emissiveIntensity = 1.4;
      this.lamps.forEach(l => (l.material.emissiveIntensity = 1.4));
      this.ring.rotation.y += delta * 2.0;
    }
  }

  isPlayerInRange(playerPos) {
    const d = this.position.distanceTo(playerPos);
    const inRange = d <= this.interactRadius;
    this.prompt.visible = inRange && !this._interacted;
    return inRange;
  }

  hasInteracted() { return this._interacted; }
  markInteracted() { this._interacted = true; this.prompt.visible = false; }

  dispose() {
    const disposeMesh = (m) => {
      if (!m) return;
      if (m.geometry) m.geometry.dispose?.();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach(mt => mt.dispose?.());
        else m.material.dispose?.();
      }
    };
    this.root.traverse((o) => {
      if (o.isMesh) disposeMesh(o);
      if (o.isSprite) {
        if (o.material?.map) o.material.map.dispose?.();
        o.material?.dispose?.();
      }
    });
    this.scene.remove(this.root);
  }
}
