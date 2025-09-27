// src/game/linkedList/NodeManager.js
import * as THREE from 'three';

export class NodeManager {
  /**
   * @param {THREE.Scene} scene
   * @param {Object} opts
   *  - points: [ [x,y,z], ... ]
   *  - order: [index, index, ...] (target order for phase 1)
   *  - onPhaseAdvance: (phaseName)=>void
   *  - onComplete: ()=>void
   *  - getPlayerPos: ()=>THREE.Vector3
   *  - lineColor: number
   */
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.points = opts.points || [];
    this.targetOrder = opts.order || this.points.map((_, i) => i);
    this.onPhaseAdvance = opts.onPhaseAdvance || (()=>{});
    this.onComplete = opts.onComplete || (()=>{});
    this.getPlayerPos = opts.getPlayerPos || (()=>new THREE.Vector3());
    this.lineColor = opts.lineColor ?? 0x60e1ff;

    this.nodes = [];         // meshes representing nodes
    this.linked = [];        // indices linked in current phase
    this.lines = [];         // THREE.Line objects
    this.phase = 'link';     // 'link' -> 'reverse'
    this._nearestIdx = -1;   // cached nearest node for UI glow

    this._makeNodes();
  }

  dispose() {
    for (const l of this.lines) this.scene.remove(l);
    for (const n of this.nodes) this.scene.remove(n);
    this.lines.length = 0; this.nodes.length = 0;
  }

  _makeNodes() {
    const geo = new THREE.SphereGeometry(0.45, 20, 20);
    for (let i = 0; i < this.points.length; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x89b4fa, emissive: 0x0, metalness: 0.2, roughness: 0.35
      });
      const m = new THREE.Mesh(geo, mat);
      const p = this.points[i];
      m.position.set(p[0], p[1], p[2]);
      m.userData.idx = i;
      this._applyIdleFX(m);
      this.scene.add(m);
      this.nodes.push(m);
    }
  }

  _applyIdleFX(mesh) {
    mesh.userData.baseColor = mesh.material.color.clone();
    mesh.userData.emissiveBase = mesh.material.emissive.clone();
  }

  _setNodeState(idx, state) {
    const m = this.nodes[idx];
    if (!m) return;
    const mat = m.material;
    if (state === 'idle') {
      mat.color.copy(m.userData.baseColor);
      mat.emissive.setHex(0x000000);
      m.scale.set(1,1,1);
    } else if (state === 'highlight') {
      mat.color.setHex(0xa6e3a1);
      mat.emissive.setHex(0x1a9e5a);
      m.scale.set(1.08,1.08,1.08);
    } else if (state === 'linked') {
      mat.color.setHex(0x74c7ec);
      mat.emissive.setHex(0x3aa0ce);
      m.scale.set(1.12,1.12,1.12);
    } else if (state === 'disabled') {
      mat.color.setHex(0x6272a4);
      mat.emissive.setHex(0x000000);
      m.scale.set(1,1,1);
    }
  }

  _drawLink(aIdx, bIdx) {
    const a = this.nodes[aIdx].position;
    const b = this.nodes[bIdx].position;
    const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
    const mat = new THREE.LineBasicMaterial({ color: this.lineColor, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.lines.push(line);
  }

  _validateLinkPick(idx) {
    if (this.phase === 'link') {
      // must match next target index
      const nextTarget = this.targetOrder[this.linked.length];
      return idx === nextTarget;
    } else if (this.phase === 'reverse') {
      // reverse target = linked order reversed
      const revOrder = [...this.targetOrder].reverse();
      const nextTarget = revOrder[this.linked.length];
      return idx === nextTarget;
    }
    return false;
  }

  // call each frame for glow/nearest selection
  update(delta) {
    // nearest node within radius
    const playerPos = this.getPlayerPos();
    let bestI = -1, bestD = 2.25; // ~radius
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const d = n.position.distanceTo(playerPos);
      if (d < bestD) { bestD = d; bestI = i; }
    }

    // set highlight only if it's the next valid node
    const nextIdx = (this.phase === 'link')
      ? this.targetOrder[this.linked.length]
      : [...this.targetOrder].reverse()[this.linked.length];

    // reset visuals then highlight the next target if close
    for (let i = 0; i < this.nodes.length; i++) {
      const inCurrent = this.linked.includes(i);
      if (inCurrent) this._setNodeState(i, 'linked');
      else if (i === bestI && i === nextIdx) this._setNodeState(i, 'highlight');
      else this._setNodeState(i, 'idle');
    }

    this._nearestIdx = (bestI === nextIdx) ? bestI : -1;
  }

  /**
   * Attempt to pick/link the highlighted node (call on 'E' press).
   * Returns true if a link step was made.
   */
  tryPick() {
    if (this._nearestIdx < 0) return false;
    const idx = this._nearestIdx;
    if (!this._validateLinkPick(idx)) return false;

    // if not the first in chain, draw link from previous picked
    const last = this.linked[this.linked.length - 1];
    this.linked.push(idx);
    if (last !== undefined) this._drawLink(last, idx);
    this._setNodeState(idx, 'linked');

    // phase progress
    const targetLen = this.targetOrder.length;
    if (this.linked.length === targetLen) {
      if (this.phase === 'link') {
        // advance to reverse
        this.phase = 'reverse';
        this.linked = [];
        this.onPhaseAdvance('reverse');
        // visually dim non-next nodes
        for (let i = 0; i < this.nodes.length; i++) this._setNodeState(i, 'idle');
      } else {
        // all done
        this.onComplete();
      }
    }
    return true;
  }
}
