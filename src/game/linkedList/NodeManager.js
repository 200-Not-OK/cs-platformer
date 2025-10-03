import * as THREE from 'three';

const HOLD_TO_CLAIM_SEC = 2.0;
const CLAIM_DIST = 2.25;
const LINK_SPACING = 1.8;
const FOLLOW_SMOOTH = 10;

export class NodeManager {
  /**
   * @param {THREE.Scene} scene
   * @param {{
   *   points: number[][],
   *   order?: number[],
   *   lineColor?: number,
   *   getPlayerPos: ()=>THREE.Vector3,
   *   getInput?: ()=>{isKey:(code:string)=>boolean},
   *   onPhaseAdvance?: (phaseName:string)=>void,
   *   onComplete?: ()=>void,
   *   passcodePattern?: string   // NEW: letters come from this pattern (e.g. "LINKEDLIST")
   * }} opts
   */
  constructor(scene, opts) {
    this.scene = scene;
    this.opts = opts;
    this._getPlayerPos = opts.getPlayerPos;
    this._getInput = opts.getInput || null;

    this.nodes = []; // {id, letter, mesh, label, beacon, padPos, state, hold, followOf, offset, matIdle, matClaim}
    this.collected = 0;
    this._playerMesh = null;

    this._t = 0;
    this._mode = 'normal'; // normal | orbit | lineup | park
    this._orbit = { center: new THREE.Vector3(), baseR: 3.2, speed: 0.8, angles: [] };
    this._lineup = { start: 0, dur: 900 };
    this._parkCenter = new THREE.Vector3();

    this._buildNodes();
    this._makeLinkLine();
    this._applyOrderIndicators();
  }

  /* ---------- build ---------- */

  _buildNodes() {
    const points = Array.isArray(this.opts.points) ? this.opts.points : [];
    const colIdle = new THREE.Color(0x8ab4f8);
    const colClaim = new THREE.Color(0x34d399);
    const matIdle = new THREE.MeshStandardMaterial({ color: colIdle, emissive: 0x0b2942, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.2 });

    const pattern = (this.opts.passcodePattern || 'LINKEDLIST').toUpperCase();
    const letters = pattern.repeat(Math.ceil(points.length / pattern.length));

    for (let i = 0; i < points.length; i++) {
      const [x,y,z] = points[i];
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), matIdle.clone());
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.baseY = y;
      mesh.userData.blink = Math.random() * 1000;

      const label = this._makeLetterSprite(letters[i]);
      label.position.set(0, 0.9, 0);
      label.visible = false;
      mesh.add(label);

      const beacon = this._makeBeacon();
      beacon.position.set(0, 0.01, 0);
      beacon.visible = false;
      mesh.add(beacon);

      this.scene.add(mesh);
      this.nodes.push({
        id: i,
        letter: letters[i],
        mesh, label, beacon,
        padPos: new THREE.Vector3(x, y, z),
        state: 'idle', hold: 0, followOf: null, offset: new THREE.Vector3(),
        matIdle: mesh.material,
        matClaim: new THREE.MeshStandardMaterial({
          color: colClaim, emissive: 0x0b5d2b, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.2
        })
      });
    }
  }

  _applyOrderIndicators() {
    const order = Array.isArray(this.opts.order) ? this.opts.order : null;
    if (!order) return;
    for (let i = 0; i < order.length; i++) {
      const n = this.nodes[order[i]];
      if (!n) continue;
      const num = this._makeNumberBillboard(i + 1);
      num.position.set(0, 1.5, 0);
      n.mesh.add(num);
      n._orderNum = num;
    }
  }

  _makeNumberBillboard(n) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(8,10,14,0.55)'; ctx.beginPath(); ctx.arc(64,64,54,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd658'; ctx.font = 'bold 56px system-ui,-apple-system,Segoe UI,Roboto';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(n), 64, 74);
    const tex = new THREE.CanvasTexture(c);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  }

  _makeLetterSprite(ch) {
    const canv = document.createElement('canvas'); canv.width = 128; canv.height = 128;
    const ctx = canv.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(64,64,52,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 64px system-ui,-apple-system,Segoe UI,Roboto';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 64, 74);
    const tex = new THREE.CanvasTexture(canv);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(0.7, 0.7, 1);
    return sprite;
  }

  _makeBeacon() {
    const geo = new THREE.CylinderGeometry(0.25, 0.25, 6, 18, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = 3;
    return m;
  }

  _makeLinkLine() {
    const mat = new THREE.LineBasicMaterial({ color: this.opts.lineColor ?? 0x7dd3fc, transparent: true, opacity: 0.55 });
    const geo = new THREE.BufferGeometry();
    const maxPts = this.nodes.length + 1;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPts * 3), 3));
    this.linkLine = new THREE.Line(geo, mat);
    this.linkLine.frustumCulled = false;
    this.scene.add(this.linkLine);
  }

  /* ---------- public ---------- */

  getCollectedCount() { return this.collected; }
  getTotalCount() { return this.nodes.length; }
  isFullyCollected() { return this.collected >= this.nodes.length; }
  getLinkedLetters() { return this._currentChain().slice(1).map(n => n.letter); }

  scrambleBackToPads() {
    const pads = this.nodes.map(n => n.padPos.clone());
    for (let i = pads.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [pads[i], pads[j]] = [pads[j], pads[i]]; }
    this.nodes.forEach((n, i) => {
      n.state = 'idle'; n.hold = 0; n.mesh.position.copy(pads[i]);
      n.mesh.userData.baseY = pads[i].y; n.mesh.material = n.matIdle;
      n.followOf = null; n.offset.set(0,0,0); n.label.visible = false; n.beacon.visible = false;
    });
    this.collected = 0;
    this._mode = 'normal';
  }

  sendAllToOrbit(center) {
    if (!this.isFullyCollected()) return;
    this._mode = 'orbit';
    this._orbit.center.copy(center);
    this._orbit.angles = [];
    const chain = this._currentChain().slice(1);
    const base = Math.random() * Math.PI * 2;
    for (let i = 0; i < chain.length; i++) this._orbit.angles[i] = base + (i * (Math.PI * 2 / chain.length));
  }

  // keep them parked near station after success
  parkAt(center) {
    if (!this.isFullyCollected()) return;
    this._mode = 'park';
    this._parkCenter.copy(center);
  }
  releaseFromOrbit() { if (this._mode === 'orbit') this._mode = 'normal'; }

  lineUpInFrontOf(playerMesh, distanceAhead = 3.5) {
    if (!this.isFullyCollected()) return;
    this._mode = 'lineup';
    this._lineup.start = performance.now();

    const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(playerMesh.quaternion).normalize();
    const right = new THREE.Vector3(1,0,0).applyQuaternion(playerMesh.quaternion).normalize();
    const origin = playerMesh.position.clone().addScaledVector(fwd, distanceAhead).addScaledVector(right, -(this.nodes.length-1)*0.8*0.5);
    const chain = this._currentChain().slice(1);
    chain.forEach((n, i) => { n._lineupTarget = origin.clone().addScaledVector(right, i * 0.8).add(new THREE.Vector3(0,0.8,0)); });
  }

  animateReverse(onDone) {
    if (!this.isFullyCollected()) { onDone?.(false); return; }
    const chain = this._currentChain();
    const player = chain[0];
    const onlyNodes = chain.slice(1).reverse();
    let prev = player.mesh || player;
    for (const n of onlyNodes) { n.followOf = prev; n.state = 'following'; n.offset.set(0,0,LINK_SPACING); prev = n.mesh; }

    const t0 = performance.now(), dur = 900;
    const spin = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const ang = Math.PI * (1 - Math.cos(t * Math.PI));
      this._currentChain().slice(1).forEach(n => { n.label.visible = true; n.label.material.rotation = ang; });
      if (t < 1) requestAnimationFrame(spin); else onDone?.(true);
    };
    requestAnimationFrame(spin);
  }

  computePasscode() {
    if (!this.isFullyCollected()) return '-----';
    const chain = this._currentChain().slice(1);
    return chain.map(n => n.letter).join('').slice(0, this.nodes.length).toUpperCase();
  }

  /* ---------- update ---------- */

  update(dt, input, playerMesh) {
    this._t += dt;
    this._playerMesh = playerMesh || this._playerMesh;

    const inMgr = this._getInput ? this._getInput() : input;
    const eDown = !!inMgr?.isKey?.('KeyE');
    const playerPos = this._getPlayerPos?.() || playerMesh?.position || new THREE.Vector3();

    // show the next “ordered” node beacon
    this._updateGuidance();

    if (this._mode === 'orbit' || this._mode === 'park') {
      const center = (this._mode === 'orbit') ? this._orbit.center : this._parkCenter;
      const chain = this._currentChain().slice(1);
      for (let i = 0; i < chain.length; i++) {
        const n = chain[i];
        const a = (this._orbit.angles[i] = (this._orbit.angles[i] ?? (i * 0.8)) + (this._mode === 'orbit' ? this._orbit.speed * dt : 0.25 * dt));
        const r = (this._mode === 'orbit') ? this._orbit.baseR + Math.sin(this._t * 0.8 + i) * 0.2 : 2.4 + (i * 0.2);
        n.mesh.position.set(center.x + Math.cos(a) * r, center.y + 0.9 + Math.sin(this._t * 2.1 + i) * 0.1, center.z + Math.sin(a) * r);
        n.label.visible = true; n.mesh.material = n.matClaim;
      }
      this._updateLinkLine(playerPos, chain.map(n => n.mesh.position));
      return;
    }

    if (this._mode === 'lineup') {
      const chain = this._currentChain().slice(1);
      const t = Math.min(1, (performance.now() - this._lineup.start) / this._lineup.dur);
      const k = 1 - Math.exp(-12 * t);
      chain.forEach(n => { if (n._lineupTarget) n.mesh.position.lerp(n._lineupTarget, k); n.label.visible = true; });
      this._updateLinkLine(playerPos, chain.map(n => n.mesh.position));
      if (t >= 1) this._mode = 'normal';
      return;
    }

    // normal: hover/claim + follow
    let nearest = null, nearestDist = Infinity;
    for (const n of this.nodes) {
      const base = n.mesh.userData.baseY ?? n.mesh.position.y;
      const bob = Math.sin(this._t * 2.2 + n.mesh.userData.blink) * 0.06;
      if (n.state !== 'following') n.mesh.position.y = base + bob;

      if (n.state === 'idle' || n.state === 'claiming') {
        const d = n.mesh.position.distanceTo(playerPos);
        if (d < nearestDist) { nearest = n; nearestDist = d; }
      }
    }

    if (nearest && nearestDist <= CLAIM_DIST) {
      if (eDown) {
        if (nearest.state === 'idle') { nearest.state = 'claiming'; nearest.hold = 0; nearest.mesh.material = nearest.matClaim; }
        if (nearest.state === 'claiming') {
          nearest.hold += dt;
          const t = THREE.MathUtils.clamp(nearest.hold / HOLD_TO_CLAIM_SEC, 0, 1);
          nearest.mesh.scale.setScalar(1 + t * 0.25);
          if (nearest.hold >= HOLD_TO_CLAIM_SEC) this._claimNode(nearest, playerMesh);
        }
      } else if (nearest.state === 'claiming') {
        nearest.state = 'idle'; nearest.hold = 0; nearest.mesh.scale.setScalar(1); nearest.mesh.material = nearest.matIdle;
      }
    }

    const chain = this._currentChain();
    for (let i = 1; i < chain.length; i++) {
      const node = chain[i]; const tgtObj = node.followOf; if (!tgtObj) continue;
      const desired = new THREE.Vector3().copy(tgtObj.position)
        .add(new THREE.Vector3(0, 0, node.offset.z).applyQuaternion(tgtObj.quaternion || new THREE.Quaternion()));
      node.mesh.position.lerp(desired, 1 - Math.exp(-FOLLOW_SMOOTH * dt));
    }

    this._updateLinkLine(playerPos, chain.slice(1).map(n => n.mesh.position));
  }

  _updateGuidance() {
    const order = Array.isArray(this.opts.order) ? this.opts.order : null;
    let nextId = null;
    if (order && this.collected < order.length) nextId = order[this.collected];
    this.nodes.forEach(n => {
      const isNext = (nextId === n.id) && n.state !== 'following';
      n.beacon.visible = isNext;
      if (n._orderNum) n._orderNum.visible = (n.state !== 'following');
      if (isNext) n.beacon.material.opacity = 0.35 + 0.2 * (0.5 + 0.5 * Math.sin(this._t * 3.2));
    });
  }

  _updateLinkLine(playerPos, nodePositions) {
    const posAttr = this.linkLine.geometry.getAttribute('position');
    const max = posAttr.count; let count = 0;
    posAttr.setXYZ(count++, playerPos.x, playerPos.y + 0.25, playerPos.z);
    for (let i = 0; i < nodePositions.length && count < max; i++) {
      const p = nodePositions[i]; posAttr.setXYZ(count++, p.x, p.y + 0.25, p.z);
    }
    while (count < max) {
      const p = nodePositions[nodePositions.length - 1] || playerPos;
      posAttr.setXYZ(count++, p.x, (p.y || playerPos.y) + 0.25, p.z);
    }
    posAttr.needsUpdate = true;
  }

  _claimNode(node, playerMesh) {
    node.state = 'following';
    node.mesh.scale.setScalar(1);
    node.mesh.material = node.matClaim;
    node.followOf = (this.collected === 0) ? (playerMesh || this._playerMesh) : this._lastCollected().mesh;
    node.offset.set(0, 0, LINK_SPACING);
    node.label.visible = true;
    this.collected++;
  }

  _lastCollected() {
    const chain = this._currentChain().slice(1);
    return chain[chain.length - 1] || null;
  }

  _currentChain() {
    const playerStub = { position: this._getPlayerPos?.() || new THREE.Vector3(), quaternion: new THREE.Quaternion(), mesh: this._playerMesh };
    let head = null;
    for (const n of this.nodes) if (n.state === 'following' && n.followOf === (this._playerMesh || null)) { head = n; break; }
    const out = [playerStub]; if (!head) return out;
    out.push(head);
    let lastMesh = head.mesh;
    while (true) {
      let next = null;
      for (const n of this.nodes) if (n.state === 'following' && n.followOf === lastMesh) { next = n; break; }
      if (!next) break; out.push(next); lastMesh = next.mesh;
    }
    return out;
  }

  dispose() {
    this.scene.remove(this.linkLine);
    this.linkLine.geometry?.dispose?.();
    this.linkLine.material?.dispose?.();
    this.nodes.forEach(n => {
      this.scene.remove(n.mesh);
      n.mesh.geometry?.dispose?.(); n.mesh.material?.dispose?.();
      n.label?.material?.map?.dispose?.(); n.label?.material?.dispose?.();
      n.beacon?.geometry?.dispose?.(); n.beacon?.material?.dispose?.();
    });
    this.nodes = [];
  }
}
