import { Level } from './level.js';
import { levels } from './levelData.js';

export class LevelManager {
  constructor(scene) {
    this.scene = scene;
    this.levels = levels;
    this.current = null;
    this.currentIndex = 0;
  }

  loadIndex(index) {
    if (this.current) this.current.dispose();
    this.currentIndex = ((index % this.levels.length) + this.levels.length) % this.levels.length;
    this.current = new Level(this.scene, this.levels[this.currentIndex]);
    return this.current;
  }

  loadNext() {
    return this.loadIndex(this.currentIndex + 1);
  }

  loadFirst() {
    return this.loadIndex(0);
  }

  getCurrentLevel() {
    return this.current;
  }
}
