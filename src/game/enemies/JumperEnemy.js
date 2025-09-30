import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { WalkerEnemy } from './WalkerEnemy.js';

export class JumperEnemy extends WalkerEnemy {
  constructor(scene, physicsWorld, options = {}) {
    super(scene, physicsWorld, options);
    this.jumpInterval = options.jumpInterval ?? 2.5; // seconds
    this._jumpTimer = 0;
    this.jumpStrength = options.jumpStrength ?? 10;
  }

  update(delta, player, platforms = []) {
    if (!this.alive) return;
    // base class will handle movement and collider resolution
    super.update(delta, player, platforms);

    this._jumpTimer += delta;
    if (this._jumpTimer >= this.jumpInterval && this.onGround && this.body) {
      this._jumpTimer = 0;
      // Apply jump impulse using physics
      this.body.applyImpulse(new CANNON.Vec3(0, this.jumpStrength, 0));
      this.onGround = false;
    }
  }
}
