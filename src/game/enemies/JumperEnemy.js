import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { WalkerEnemy } from './WalkerEnemy.js';

export class JumperEnemy extends WalkerEnemy {
  constructor(scene, physicsWorld, options = {}) {
    // Set default health for JumperEnemy
    const jumperOptions = {
      health: 40, // Jumper enemies have 40 HP (stronger due to mobility)
      jumpInterval: 2.5,
      jumpStrength: 10,
      ...options
    };
    super(scene, physicsWorld, jumperOptions);
    this._jumpTimer = 0;
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
