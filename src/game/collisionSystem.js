// src/game/collisionSystem.js
import * as THREE from 'three';

// ---------- Tunables ----------
const EPS = 1e-4;
const DEFAULTS = {
  landThreshold: 0.06,
  penetrationAllowance: 0.01,
  minVerticalOverlap: 0.02, // to block horizontal slide
  stepHeight: 0.35,         // how high we can "step up" small ledges
  maxStepProbe: 0.38,       // small cushion above stepHeight
  maxIterations: 3,         // resolve loops for tight spaces
  maxSubstep: 0.5           // split movement into substeps to avoid tunneling
};

// ---------- Box helpers ----------
function intersectsBox(a, b, eps = EPS) {
  return (
    a.min.x <= b.max.x - eps && a.max.x >= b.min.x + eps &&
    a.min.y <= b.max.y - eps && a.max.y >= b.min.y + eps &&
    a.min.z <= b.max.z - eps && a.max.z >= b.min.z + eps
  );
}

function setBoxFromCenter(box, center, half) {
  box.min.copy(center).sub(half);
  box.max.copy(center).add(half);
}

function copyBox(box, out = new THREE.Box3()) {
  out.min.copy(box.min);
  out.max.copy(box.max);
  return out;
}

// ---------- Debug wireframes ----------
let debugEnabled = false;
let debugScene = null;
let debugTestMesh = null;
let debugOtherMesh = null;

export function enableDebug(scene) {
  debugEnabled = true;
  debugScene = scene;
  if (!debugTestMesh) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    debugTestMesh = new THREE.Mesh(geo, mat);
    debugTestMesh.renderOrder = 9999;
  }
  if (!debugOtherMesh) {
    const geo2 = new THREE.BoxGeometry(1, 1, 1);
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    debugOtherMesh = new THREE.Mesh(geo2, mat2);
    debugOtherMesh.renderOrder = 9999;
  }
  if (debugScene) {
    debugScene.add(debugTestMesh);
    debugScene.add(debugOtherMesh);
  }
}

export function disableDebug() {
  debugEnabled = false;
  if (debugScene && debugTestMesh) debugScene.remove(debugTestMesh);
  if (debugScene && debugOtherMesh) debugScene.remove(debugOtherMesh);
  debugScene = null;
}

// ---------- Colliders util ----------
export function meshesToColliders(meshes) {
  return meshes.map(m => m.userData?.collider).filter(Boolean);
}

function isOneWay(other) {
  // Mark meshes as one-way by: mesh.userData.oneWay = true
  // They only block when moving downward onto their top face.
  return !!(other.userData?.oneWay);
}

// ---------- Core solver ----------
/**
 * @param {THREE.Box3} box - moving collider (will not be mutated)
 * @param {THREE.Vector3} movement - desired motion this frame
 * @param {THREE.Box3[]} colliders - static colliders
 * @param {object} options - tuning/debug
 *   - prevBottomY, landThreshold, penetrationAllowance, minVerticalOverlap
 *   - stepHeight, maxStepProbe, maxIterations, maxSubstep
 *   - debug: boolean, watch: {x,z,r,break}
 */
export function resolveMovement(box, movement, colliders, options = {}) {
  const cfg = { ...DEFAULTS, ...options };

  // sizes & centers
  const size = new THREE.Vector3(); box.getSize(size);
  const half = size.clone().multiplyScalar(0.5);
  const originalCenter = box.getCenter(new THREE.Vector3());
  const center = originalCenter.clone();

  const prevBottom = (typeof options.prevBottomY !== 'undefined')
    ? options.prevBottomY
    : (originalCenter.y - half.y);

  const testBox = new THREE.Box3();
  const tmpBox = new THREE.Box3();

  let onGround = false;
  let collided = false;
  let groundOther = null;
  let collidedOther = null;

  // Watch hook
  const watch = options.watch ?? (typeof window !== 'undefined' ? window.__collisionWatch : null);
  const watchRadius = (watch && typeof watch.r === 'number') ? watch.r : 0.5;
  const isInWatch = (c) => {
    if (!watch) return false;
    const dx = c.x - watch.x;
    const dz = c.z - watch.z;
    return (dx * dx + dz * dz) <= (watchRadius * watchRadius);
  };

  const updateDebug = () => {
    if (!(debugEnabled || options.debug)) return;
    if (debugTestMesh) {
      const s = new THREE.Vector3();
      testBox.getSize(s);
      debugTestMesh.scale.set(Math.max(s.x, EPS), Math.max(s.y, EPS), Math.max(s.z, EPS));
      const c = testBox.getCenter(new THREE.Vector3());
      debugTestMesh.position.copy(c);
    }
    if (debugOtherMesh && collidedOther) {
      const s2 = new THREE.Vector3();
      collidedOther.getSize(s2);
      debugOtherMesh.scale.set(Math.max(s2.x, EPS), Math.max(s2.y, EPS), Math.max(s2.z, EPS));
      const co = collidedOther.getCenter(new THREE.Vector3());
      debugOtherMesh.position.copy(co);
    }
  };

  // Split long moves into substeps to reduce tunneling
  const mv = new THREE.Vector3(movement.x || 0, movement.y || 0, movement.z || 0);
  const totalLen = mv.length();
  const substeps = Math.max(1, Math.ceil(totalLen / cfg.maxSubstep));
  const step = mv.clone().multiplyScalar(1 / substeps);

  // iterative resolve per substep
  for (let s = 0; s < substeps; s++) {
    // a few iterations to escape tight corners
    let iter = 0;
    let pending = step.clone();

    // Initialize testBox to current center at start of substep
    setBoxFromCenter(testBox, center, half);

    while (iter++ < cfg.maxIterations) {
      // 1) Horizontal attempt with axis separation & step-up probing
      for (const ax of ['x', 'z']) {
        const deltaAxis = pending[ax];
        if (!deltaAxis) continue;

        const beforeAxis = center[ax];
        center[ax] += deltaAxis;
        setBoxFromCenter(testBox, center, half);

        let blocked = false;
        let blockingOther = null;

        for (const other of colliders) {
          if (!other) continue;
          if (isOneWay(other)) continue; // one-way treated in vertical
          if (!intersectsBox(testBox, other)) continue;

          // require a meaningful vertical overlap to count as a wall
          const yOverlap = Math.min(testBox.max.y, other.max.y) - Math.max(testBox.min.y, other.min.y);
          if (yOverlap > cfg.minVerticalOverlap) {
            blocked = true;
            blockingOther = other;
            break;
          }
        }

        if (blocked) {
          // Step-up probe: try to move up a small height then re-apply the axis
          const stepUp = cfg.stepHeight;
          const probeUp = Math.min(stepUp + (cfg.maxStepProbe - stepUp) * 0.5, cfg.maxStepProbe);
          const savedY = center.y;

          center.y += probeUp;
          setBoxFromCenter(testBox, center, half);

          let clearsNow = true;
          for (const other of colliders) {
            if (!other) continue;
            if (!intersectsBox(testBox, other)) continue;
            // allow intersect only if we're fully above its top now
            if (testBox.min.y >= other.max.y - EPS) continue;
            clearsNow = false;
            break;
          }

          if (clearsNow) {
            // re-check wall at elevated height
            setBoxFromCenter(testBox, center, half);
            let stillBlocked = false;
            for (const other of colliders) {
              if (!other) continue;
              if (!intersectsBox(testBox, other)) continue;
              const yOverlap = Math.min(testBox.max.y, other.max.y) - Math.max(testBox.min.y, other.min.y);
              if (yOverlap > cfg.minVerticalOverlap) { stillBlocked = true; break; }
            }
            if (!stillBlocked) {
              collided = true; // interacted with obstacle (stepped)
              continue;        // keep elevated position and axis movement
            }
          }

          // Step failed: revert axis advance and Y probe; slide by zeroing this axis
          center[ax] = beforeAxis;
          center.y = savedY;
          setBoxFromCenter(testBox, center, half);
          pending[ax] = 0;
          collided = true;
          collidedOther = blockingOther;
        }

        updateDebug();
      }

      // 2) Vertical resolve (down then up) — FIXED LOGIC
      const beforeY = center.y;
      const prevBottomThisStep = testBox.min.y; // bottom before applying this vertical move

      center.y += pending.y || 0;
      setBoxFromCenter(testBox, center, half);

      if (isInWatch(center) && (debugEnabled || options.debug)) {
        console.log('[resolveMovement] WATCH region', center.clone(), 'pending', pending);
      }

      // Compute both candidates:
      // - ground: highest platform TOP at/below us (overlapping XZ)
      // - ceiling: lowest platform BOTTOM above us (overlapping XZ)
      const playerBottom = testBox.min.y;
      const playerTop    = testBox.max.y;

      let groundTop = -Infinity;
      let groundBox = null;

      let ceilingBottom = +Infinity;
      let ceilingBox = null;

      for (const other of colliders) {
        if (!other) continue;

        // XZ overlap footprint check
        const xOverlap = testBox.max.x > other.min.x && testBox.min.x < other.max.x;
        const zOverlap = testBox.max.z > other.min.z && testBox.min.z < other.max.z;
        if (!xOverlap || !zOverlap) continue;

        const oneWay = isOneWay(other);

        // Ground candidate (TOP)
        if ((!oneWay || (pending.y <= 0)) && other.max.y <= playerTop + 0.05) {
          if (other.max.y > groundTop) {
            groundTop = other.max.y;
            groundBox = other;
          }
        }

        // Ceiling candidate (BOTTOM) — ignore one-way for ceiling
        if (!oneWay && other.min.y >= playerBottom - 0.05) {
          if (other.min.y < ceilingBottom) {
            ceilingBottom = other.min.y;
            ceilingBox = other;
          }
        }
      }

      if (pending.y <= 0) {
        // FALLING / moving down: test landing on groundTop
        if (groundTop > -Infinity && groundBox) {
          const dist = playerBottom - groundTop;
          if (prevBottomThisStep >= groundTop - cfg.landThreshold && dist <= cfg.landThreshold) {
            // Land: snap to top
            center.y = groundTop + half.y;
            setBoxFromCenter(testBox, center, half);
            onGround = true;
            groundOther = groundBox;
            pending.y = 0;
          } else if (dist < -cfg.penetrationAllowance) {
            // Penetrating from above: correct up
            center.y = groundTop + half.y;
            setBoxFromCenter(testBox, center, half);
            onGround = true;
            groundOther = groundBox;
            pending.y = 0;
          } else {
            onGround = false;
          }
        } else {
          onGround = false;
        }
      } else {
        // MOVING UP: test ceiling hit using ceilingBottom
        if (ceilingBottom < +Infinity && ceilingBox) {
          if (playerTop > ceilingBottom) {
            // Hit underside: push down just below ceiling
            center.y = ceilingBottom - half.y - cfg.penetrationAllowance;
            setBoxFromCenter(testBox, center, half);
            onGround = false;
            collided = true;
            collidedOther = ceilingBox;
            pending.y = 0;
          }
        }
      }

      updateDebug();

      // If no remaining motion on any axis, break early for this substep
      if (Math.abs(pending.x) < EPS && Math.abs(pending.y) < EPS && Math.abs(pending.z) < EPS) {
        break;
      }

      // If we still have some pending but we didn't move noticeably this iter, avoid infinite loop
      const movedThisIter =
        (Math.abs(center.y - beforeY) > EPS) ||
        (Math.abs(pending.x) < Math.abs(step.x) - EPS) ||
        (Math.abs(pending.z) < Math.abs(step.z) - EPS);
      if (!movedThisIter) break;
    } // end iterations
  } // end substeps

  const resolvedOffset = center.clone().sub(originalCenter);
  if (debugEnabled || options.debug) {
    console.log('[resolveMovement] result', {
      offset: resolvedOffset.clone(), onGround, collided, groundCollider: groundOther, collidedWith: collidedOther
    });
  }
  return {
    offset: resolvedOffset,
    onGround,
    collided,
    groundCollider: groundOther,
    collidedWith: collidedOther
  };
}

// ---------- Optional debug watch helper ----------
/*
Usage from console:
  window.__collisionWatch = { x: 10, z: 5, r: 1.0, break: true }
  // clears:
  window.__collisionWatch = null
*/