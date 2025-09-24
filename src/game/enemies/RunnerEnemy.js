import { WalkerEnemy } from './WalkerEnemy.js';

export class RunnerEnemy extends WalkerEnemy {
  constructor(scene, options = {}) {
    super(scene, options);
    // faster than walker
    this.speed = options.speed ?? 4.0;
  }
}
