import { Level } from './level.js';
import { levels } from './levelData.js';

export class LevelManager {
  constructor(scene, physicsWorld, game = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.game = game; // Reference to game for passing to levels
    this.levels = levels;
    this.current = null;
    this.currentIndex = 0;
  }

  async loadIndex(index) {
    if (this.current) this.current.dispose();
    this.currentIndex = ((index % this.levels.length) + this.levels.length) % this.levels.length;
    this.current = await Level.create(this.scene, this.physicsWorld, this.levels[this.currentIndex], true, this.game);
    return this.current;
  }

  async loadNext() {
    return await this.loadIndex(this.currentIndex + 1);
  }

  async loadFirst() {
    return await this.loadIndex(0);
  }

  getCurrentLevel() {
    return this.current;
  }

  getCurrentLevelIndex() {
    return this.currentIndex;
  }
}
