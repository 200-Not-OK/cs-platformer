import { WalkerEnemy } from './WalkerEnemy.js';

export class RunnerEnemy extends WalkerEnemy {
  constructor(scene, physicsWorld, options = {}) {
    // Set default health for RunnerEnemy
    const runnerOptions = {
      health: 20, // Runner enemies have 20 HP (faster but weaker)
      speed: 4.0,
      ...options
    };
    super(scene, physicsWorld, runnerOptions);
  }
}
