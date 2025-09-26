import * as THREE from 'three';

// Small epsilon to avoid exact-touch ambiguity
const EPS = 1e-4;

function intersectsBox(a, b, eps = EPS) {
  return (
    a.min.x < b.max.x - eps && a.max.x > b.min.x + eps &&
    a.min.y < b.max.y - eps && a.max.y > b.min.y + eps &&
    a.min.z < b.max.z - eps && a.max.z > b.min.z + eps
  );
}

// Debug helpers (optional): create wireframe boxes to visualize test box and current collider
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

// Resolve movement for a given Box3 against an array of other Box3 colliders.
// Uses axis-separation: X, Z, then Y. Returns an object with resolved center
// offset (vector), updated onGround boolean, and collided boolean.
export function resolveMovement(box, movement, colliders, options = {}) {
  // Two-phase resolver inspired by per-player logic:
  // 1) Apply horizontal movement axis-by-axis (X then Z). If an axis causes
  //    penetration with a collider that has meaningful vertical overlap, revert
  //    that axis so the mover can slide along obstacles.
  // 2) Apply vertical movement and then perform landing/underside handling:
  //    find the highest platform under the mover's XZ footprint and snap or
  //    correct based on whether the mover came from above.

  const prevBottomY = (typeof options.prevBottomY !== 'undefined') ? options.prevBottomY : (box.getCenter(new THREE.Vector3()).y - (new THREE.Vector3().copy(box.getSize(new THREE.Vector3())).y * 0.5));
  const landThreshold = options.landThreshold ?? 0.06;
  const penetrationAllowance = options.penetrationAllowance ?? 0.01;
  const minVerticalOverlap = options.minVerticalOverlap ?? 0.02; // require >2cm vertical overlap to block horizontal movement

  // compute half-size and original center
  const size = new THREE.Vector3();
  box.getSize(size);
  const half = size.clone().multiplyScalar(0.5);
  const originalCenter = box.getCenter(new THREE.Vector3());

  // working center that we'll modify
  const center = originalCenter.clone();
  const testBox = new THREE.Box3();
  const setBoxFromCenter = (c) => {
    testBox.min.copy(c).sub(half);
    testBox.max.copy(c).add(half);
  };

  let onGround = false;
  let collided = false;
  let groundOther = null;
  let collidedOther = null;

  // Watch helper: if a watch point is provided (options.watch or window.__collisionWatch)
  // and the center is within radius, we'll produce an obvious log and optionally break
  const watch = options.watch ?? (typeof window !== 'undefined' ? window.__collisionWatch : null);
  const watchRadius = (watch && typeof watch.r === 'number') ? watch.r : 0.5;
  const isInWatch = (c) => {
    if (!watch) return false;
    const dx = c.x - watch.x;
    const dz = c.z - watch.z;
    return (dx * dx + dz * dz) <= (watchRadius * watchRadius);
  };

  // Helper to update debug meshes
  const updateDebug = () => {
    if (!(debugEnabled || options.debug)) return;
    if (debugTestMesh) {
      const s = new THREE.Vector3();
      testBox.getSize(s);
      debugTestMesh.scale.set(s.x || 1, s.y || 1, s.z || 1);
      const c = testBox.getCenter(new THREE.Vector3());
      debugTestMesh.position.copy(c);
    }
    if (debugOtherMesh && collidedOther) {
      const s2 = new THREE.Vector3();
      collidedOther.getSize(s2);
      debugOtherMesh.scale.set(s2.x || 1, s2.y || 1, s2.z || 1);
      const co = collidedOther.getCenter(new THREE.Vector3());
      debugOtherMesh.position.copy(co);
    }
  };

  // Phase 1: horizontal movement per-axis (X then Z)
  const axes = ['x', 'z'];
  for (const ax of axes) {
    const deltaAxis = movement[ax] ?? 0;
    if (!deltaAxis) continue;
    center[ax] += deltaAxis;
    setBoxFromCenter(center);
    let blocked = false;
    for (const other of colliders) {
      if (!other) continue;
      if (other === box) continue;
      if (!intersectsBox(testBox, other)) continue;
      // Compute vertical overlap to decide if this horizontal intersection should block movement
      const overlapY = Math.min(testBox.max.y, other.max.y) - Math.max(testBox.min.y, other.min.y);
      if (overlapY > minVerticalOverlap) {
        blocked = true;
        collided = true;
        collidedOther = other;
        break;
      }
    }
    if (blocked) {
      if (debugEnabled || options.debug) {
        console.log('[resolveMovement] horizontal blocked', { axis: ax, attempted: deltaAxis, center: center.clone(), overlapThreshold: minVerticalOverlap, collider: collidedOther });
      }
      // revert this axis only
      center[ax] = originalCenter[ax];
      setBoxFromCenter(center);
    }
    updateDebug();
  }

  // Phase 2: vertical movement
  center.y += movement.y ?? 0;
  setBoxFromCenter(center);

  // If we're in the watched region, emit a clear log and optionally pause execution
  if (isInWatch(center)) {
    if (debugEnabled || options.debug) console.log('[resolveMovement] WATCH REGION HIT at center', center.clone(), 'watch', watch);
    if (watch && watch.break) {
      // Pause execution so you can inspect the scene, colliders, and logs
      debugger;
    }
  }

  // Determine the highest platform directly under the player (by XZ) regardless of velocity.
  const playerBottom = testBox.min.y;
  let closestY = -Infinity;
  let closestPlatBox = null;
  const playerTop = originalCenter.y + half.y;
  const ABOVE_TOL = options.aboveTolerance ?? 0.05; // small tolerance for slightly-above-top platforms
  for (const other of colliders) {
    if (!other) continue;
    if (other === box) continue;
    // require XZ overlap between mover's horizontal footprint and platform
    const xOverlap = testBox.max.x > other.min.x && testBox.min.x < other.max.x;
    const zOverlap = testBox.max.z > other.min.z && testBox.min.z < other.max.z;
    if (!xOverlap || !zOverlap) continue;
    // Skip platforms that are clearly above the player's head — they should not be
    // considered as landing candidates. This prevents floating platforms above
    // from stealing the 'closest platform' when the player is actually standing on
    // another platform below.
    if (other.max.y > playerTop + ABOVE_TOL) {
      if (debugEnabled || options.debug) console.log('[resolveMovement] skipping platform above player top', { platformTop: other.max.y, playerTop, other });
      continue;
    }
    if (other.max.y > closestY) {
      closestY = other.max.y;
      closestPlatBox = other;
    }
  }

  if (closestY > -Infinity && closestPlatBox) {
    const distance = playerBottom - closestY;
    const prevBottom = (typeof options.prevBottomY !== 'undefined') ? options.prevBottomY : (originalCenter.y - half.y);
    if (debugEnabled || options.debug) {
      console.log('[resolveMovement] vertical check', { prevBottom, closestY, distance, landThreshold });
    }
    if (prevBottom >= closestY - landThreshold) {
      if (distance <= landThreshold) {
        // snap to top
        center.y = closestY + half.y;
        setBoxFromCenter(center);
        onGround = true;
        groundOther = closestPlatBox;
        collided = collided || false;
        if (debugEnabled || options.debug) console.log('[resolveMovement] snapped to top', { platformTop: closestY, playerBottom, playerCenter: center.clone() });
      } else if (distance < -penetrationAllowance) {
        // penetrating from above: correct upward
        center.y = closestY + half.y;
        setBoxFromCenter(center);
        onGround = true;
        groundOther = closestPlatBox;
        if (debugEnabled || options.debug) console.log('[resolveMovement] corrected penetrating from above', { platformTop: closestY, distance });
      } else {
        // sufficiently above platform: in the air (no snap)
        onGround = false;
        if (debugEnabled || options.debug) console.log('[resolveMovement] above platform, not snapping', { distance });
      }
    } else {
      // previously below platform — do NOT teleport to top.
      const playerTop = testBox.max.y;
      const platBottom = closestPlatBox.min.y;
      if (playerTop > platBottom) {
        // move player so their top sits just below the platform bottom
        center.y = platBottom - half.y - penetrationAllowance;
        setBoxFromCenter(center);
        onGround = false;
        // mark collision with underside
        collided = true;
        collidedOther = closestPlatBox;
        if (debugEnabled || options.debug) console.log('[resolveMovement] hit underside, pushed down', { platBottom, playerTop });
      } else {
        onGround = false;
      }
    }
  } else {
    onGround = false;
    if (debugEnabled || options.debug) console.log('[resolveMovement] no platform under player for current XZ footprint');
  }

  updateDebug();

  const resolvedOffset = center.clone().sub(originalCenter);
  if (debugEnabled || options.debug) console.log('[resolveMovement] result', { offset: resolvedOffset.clone(), onGround, collided, groundCollider: groundOther, collidedWith: collidedOther });
  return {
    offset: resolvedOffset,
    onGround,
    collided,
    groundCollider: groundOther,
    collidedWith: collidedOther
  };
}

// Utility: convert an array of meshes to array of Box3 colliders
export function meshesToColliders(meshes) {
  return meshes.map(m => m.userData.collider).filter(Boolean);
}




