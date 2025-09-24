import * as THREE from 'three';
import { WalkerEnemy } from './WalkerEnemy.js';

export class JumperEnemy extends WalkerEnemy {
  constructor(scene, options = {}) {
    super(scene, options);
    this.jumpInterval = options.jumpInterval ?? 2.5; // seconds
    this._jumpTimer = 0;
    this.jumpStrength = options.jumpStrength ?? 10;
  }

  update(delta, player, platforms = []) {
    if (!this.alive) return;
    // base class will handle movement and collider resolution
    super.update(delta, player, platforms);

    this._jumpTimer += delta;
    if (this._jumpTimer >= this.jumpInterval && this.onGround) {
      this._jumpTimer = 0;
      // trigger an upward velocity; EnemyBase resolves vertical motion
      this.velocity.y = this.jumpStrength;
      this.onGround = false;
    }
  }
}
