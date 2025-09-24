import * as THREE from 'three';
import { WalkerEnemy } from './enemies/WalkerEnemy.js';

export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.typeRegistry = {
      walker: WalkerEnemy,
      // register more types here
    };
  }

  spawn(type, options = {}) {
    const Cls = this.typeRegistry[type];
    if (!Cls) throw new Error('Unknown enemy type: ' + type);
    const e = new Cls(this.scene, options);
    if (options.position) e.setPosition(new THREE.Vector3(...options.position));
    this.enemies.push(e);
    return e;
  }

  update(delta, player, platforms = []) {
    for (const e of this.enemies) e.update(delta, player, platforms);
  }

  dispose() {
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
  }
}
