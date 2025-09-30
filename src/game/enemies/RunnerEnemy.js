import { WalkerEnemy } from './WalkerEnemy.js';

export class RunnerEnemy extends WalkerEnemy {
  constructor(scene, physicsWorld, options = {}) {
    super(scene, physicsWorld, options);
    // faster than walker
    this.speed = options.speed ?? 4.0;
  }
}
