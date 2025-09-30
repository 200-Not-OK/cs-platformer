import * as THREE from 'three';
import { EnemyBase } from './EnemyBase.js';

export class FlyerEnemy extends EnemyBase {
  constructor(scene, physicsWorld, options = {}) {
    super(scene, physicsWorld, options);
    this.speed = options.speed ?? 3.0;
    this.patrolPoints = options.patrolPoints || [];
    this._patrolIndex = 0;
  }

  update(delta, player) {
    if (!this.alive) return;
    // simple flying patrol: interpolate toward target including Y
    if (this.patrolPoints.length > 0) {
      const target = new THREE.Vector3(...this.patrolPoints[this._patrolIndex]);
      const dir = target.clone().sub(this.mesh.position);
      const dist = dir.length();
      if (dist < 0.1) {
        this._patrolIndex = (this._patrolIndex + 1) % this.patrolPoints.length;
      } else {
        dir.normalize();
        this.mesh.position.addScaledVector(dir, this.speed * delta);
        const yaw = Math.atan2(dir.x, dir.z);
        this.mesh.rotation.y = yaw;
      }
    }
    // flyers don't use EnemyBase gravity/resolver — just update animations
    try { if (this.mixer) this.mixer.update(delta); } catch (e) {}
    this._updateCollider();
    if (this.helper) this.helper.updateWithRotation(this.mesh.rotation);
  }
}
