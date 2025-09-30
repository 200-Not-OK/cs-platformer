import * as THREE from 'three';
import { EnemyBase } from './EnemyBase.js';

export class WalkerEnemy extends EnemyBase {
  constructor(scene, physicsWorld, options = {}) {
    super(scene, physicsWorld, options);
    this.patrolPoints = options.patrolPoints || [];
    this._patrolIndex = 0;
    this.waitTime = options.waitTime ?? 0.5;
    this._waitTimer = 0;
  }

  update(delta, player, platforms = []) {
    if (!this.alive) return;
    // ensure base class updates (advance mixer, update collider sampling)
    try { super.update(delta, player, platforms); } catch (e) { /* ignore if super has no-op */ }
    // determine intent: patrolling vs chasing
    let isMoving = false;
    // If there are patrol points, move toward the current target
    if (this.patrolPoints.length > 0) {
      // support two patrol point formats: [x,y,z] or [x,y,z,yRadius]
      // also accept objects: { position: [x,y,z], yRadius: n }
      let raw = this.patrolPoints[this._patrolIndex];
      let targetPos, yRadius;
      if (Array.isArray(raw)) {
        targetPos = new THREE.Vector3(raw[0], raw[1], raw[2]);
        yRadius = raw.length >= 4 ? raw[3] : (this.options?.patrolYRadius ?? 0.5);
      } else if (raw && raw.position && Array.isArray(raw.position)) {
        targetPos = new THREE.Vector3(...raw.position);
        yRadius = raw.yRadius ?? (this.options?.patrolYRadius ?? 0.5);
      } else {
        // malformed entry — skip
        return;
      }

      const dir = targetPos.clone().sub(this.mesh.position);
      const horizontalDist = Math.hypot(dir.x, dir.z);
      const verticalDelta = dir.y;
      const arrivalHorizontal = this.options?.patrolArrivalHorizontal ?? 0.1;

      // Arrived if close horizontally AND within the Y radius tolerance
      if (horizontalDist < arrivalHorizontal && Math.abs(verticalDelta) <= yRadius) {
        this._waitTimer += delta;
        if (this._waitTimer >= this.waitTime) {
          this._waitTimer = 0;
          this._patrolIndex = (this._patrolIndex + 1) % this.patrolPoints.length;
        }
      } else {
        // Move only in XZ plane (vertical is handled by EnemyBase gravity/resolver)
        const dirXZ = new THREE.Vector3(dir.x, 0, dir.z);
        if (dirXZ.lengthSq() > 1e-6) {
          dirXZ.normalize();
          this.setDesiredMovement(dirXZ.clone().multiplyScalar(this.speed));
          isMoving = true;
          const yaw = Math.atan2(dirXZ.x, dirXZ.z);
          this.mesh.rotation.y = yaw;
        }
      }
    }

    // Basic player tracking when nearby -> face player while chasing
    if (player && player.mesh) {
      const toPlayer = player.mesh.position.clone().sub(this.mesh.position);
      // consider horizontal distance only for chase/range and facing
      const toPlayerXZ = new THREE.Vector3(toPlayer.x, 0, toPlayer.z);
      const near = toPlayerXZ.length() < (this.options.chaseRange ?? 4);
      if (near && toPlayerXZ.lengthSq() > 1e-6) {
        const chaseDirXZ = toPlayerXZ.clone().normalize();
        this.setDesiredMovement(chaseDirXZ.clone().multiplyScalar(this.speed * 1.2));
        isMoving = true;
        // face the player (yaw only)
        const yaw = Math.atan2(chaseDirXZ.x, chaseDirXZ.z);
        this.mesh.rotation.y = yaw;
      }
    }

    // Animation: idle if not moving, walk/run when moving
    try {
      if (isMoving) {
        if (this.actions.run) this._playAction(this.actions.run, 0.15, true);
        else if (this.actions.walk) this._playAction(this.actions.walk, 0.15, true);
      } else {
        if (this.actions.idle) this._playAction(this.actions.idle, 0.2, true);
      }
    } catch (e) {}

    this._updateCollider();
  }
}
