import * as THREE from 'three';
import { WalkerEnemy } from './enemies/WalkerEnemy.js';
import { RunnerEnemy } from './enemies/RunnerEnemy.js';
import { JumperEnemy } from './enemies/JumperEnemy.js';
import { FlyerEnemy } from './enemies/FlyerEnemy.js';
import { SnakeEnemy } from './enemies/SnakeEnemy.js';

export class EnemyManager {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.enemies = [];
    this.typeRegistry = {
      walker: WalkerEnemy,
      runner: RunnerEnemy,
      jumper: JumperEnemy,
      flyer: FlyerEnemy,
      snake: SnakeEnemy,
      // register more types here
    };
  }

  spawn(type, options = {}) {
    const Cls = this.typeRegistry[type];
    if (!Cls) throw new Error('Unknown enemy type: ' + type);
    const e = new Cls(this.scene, this.physicsWorld, options);
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
