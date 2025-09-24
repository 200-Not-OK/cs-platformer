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
  // Iterative minimum-translation separation resolver.
  // This moves the box by `movement` and, if intersections occur, separates
  // the box by the minimal translation along the minimal-penetration axis.
  // This avoids snapping to far-away colliders and large teleports.

  const prevBottomY = options.prevBottomY ?? -Infinity;
  const landThresholdOpt = options.landThreshold ?? 0.06;

  // compute half-size and original center
  const size = new THREE.Vector3();
  box.getSize(size);
  const half = size.clone().multiplyScalar(0.5);
  const originalCenter = box.getCenter(new THREE.Vector3());

  // start with desired center
  const center = originalCenter.clone().add(movement);
  const testBox = new THREE.Box3();
  const setBoxFromCenter = (c) => {
    testBox.min.copy(c).sub(half);
    testBox.max.copy(c).add(half);
  };

  let onGround = false;
  let collided = false;
  let groundOther = null;
  let collidedOther = null;

  // iterative separation loop
  const maxIters = 6;
  for (let iter = 0; iter < maxIters; iter++) {
    setBoxFromCenter(center);
    let any = false;
    for (const other of colliders) {
      if (!other) continue;
      // skip self (same box reference)
      if (other === box) continue;
      if (!intersectsBox(testBox, other)) continue;

      // we have an intersection; compute penetration depths on each axis
      collided = true;
      collidedOther = other;
      any = true;

      const penX = Math.min(testBox.max.x, other.max.x) - Math.max(testBox.min.x, other.min.x);
      const penY = Math.min(testBox.max.y, other.max.y) - Math.max(testBox.min.y, other.min.y);
      const penZ = Math.min(testBox.max.z, other.max.z) - Math.max(testBox.min.z, other.min.z);

      // Debug logging of candidate penetrations and chosen axis
      if (debugEnabled || options.debug) {
        console.log('[resolveMovement] iter', iter, 'penetrations', { penX, penY, penZ });
      }

      // choose axis with smallest positive penetration
      // But if we appear to have come from above (prevBottomY >= other.max.y - landThresholdOpt),
      // bias against selecting Y so we don't drop the player when they were previously on the platform.
      const biasAgainstY = (prevBottomY >= other.max.y - landThresholdOpt) ? 3.0 : 1.0;
      const minVerticalPen = options.minVerticalPen ?? 0.05; // ignore very small vertical penetrations
      const wPenX = Math.abs(penX);
      let wPenY = Math.abs(penY) * biasAgainstY;
      const wPenZ = Math.abs(penZ);
      // If vertical penetration is extremely small, prefer horizontal separation
      if (Math.abs(penY) < minVerticalPen) {
        if (debugEnabled || options.debug) console.log('[resolveMovement] ignoring small penY', penY, 'minVerticalPen', minVerticalPen);
        wPenY = Infinity;
      }
      let axis = 'x';
      let minPen = wPenX;
      if (wPenY < minPen) { axis = 'y'; minPen = wPenY; }
      if (wPenZ < minPen) { axis = 'z'; minPen = wPenZ; }
      if (debugEnabled || options.debug) console.log('[resolveMovement] chosen axis', axis, 'weightedPens', { wPenX, wPenY, wPenZ, biasAgainstY });

  // compute separation translation along chosen axis
      if (axis === 'x') {
        const otherCenterX = (other.min.x + other.max.x) * 0.5;
        // compute raw translation
        let tx = 0;
        if (center.x < otherCenterX) {
          // push left so testBox.max.x == other.min.x
          tx = other.min.x - testBox.max.x - EPS;
        } else {
          // push right so testBox.min.x == other.max.x
          tx = other.max.x - testBox.min.x + EPS;
        }
        // Cap horizontal correction so we don't teleport far — allow at most the attempted movement plus a small cushion
        const attempted = movement.x ?? 0;
        const cushion = 0.04;
        const allowed = Math.abs(attempted) + cushion;
        let appliedTx = tx;
        if (Math.abs(appliedTx) > allowed) appliedTx = Math.sign(appliedTx) * allowed;
        center.x += appliedTx;
        if (debugEnabled || options.debug) console.log('[resolveMovement] axis=x applied tx', appliedTx, 'attempted', attempted, 'allowed', allowed);

        // If applied translation did not fully resolve intersection with this collider,
        // compute remaining penetration on X and apply a minimal extra separation to avoid oscillation.
        const tmpBox = new THREE.Box3();
        tmpBox.min.copy(center).sub(half);
        tmpBox.max.copy(center).add(half);
        if (intersectsBox(tmpBox, other)) {
          // remaining penetration on X
          const remPenX = Math.min(tmpBox.max.x, other.max.x) - Math.max(tmpBox.min.x, other.min.x);
          if (remPenX > 1e-5) {
            const extra = remPenX + EPS;
            const sign = (appliedTx >= 0) ? 1 : -1;
            center.x += sign * extra * (appliedTx === 0 ? Math.sign(tx) || 1 : Math.sign(appliedTx));
            if (debugEnabled || options.debug) console.log('[resolveMovement] axis=x extra separation', extra);
            // we've applied an extra correction — finish early to avoid repeating the same extra over multiple iterations
            iter = maxIters;
            break;
          }
        }
      } else if (axis === 'z') {
        const otherCenterZ = (other.min.z + other.max.z) * 0.5;
        let tz = 0;
        if (center.z < otherCenterZ) {
          tz = other.min.z - testBox.max.z - EPS;
        } else {
          tz = other.max.z - testBox.min.z + EPS;
        }
        const attemptedZ = movement.z ?? 0;
        const cushionZ = 0.04;
        const allowedZ = Math.abs(attemptedZ) + cushionZ;
        let appliedTz = tz;
        if (Math.abs(appliedTz) > allowedZ) appliedTz = Math.sign(appliedTz) * allowedZ;
        center.z += appliedTz;
        if (debugEnabled || options.debug) console.log('[resolveMovement] axis=z applied tz', appliedTz, 'attemptedZ', attemptedZ, 'allowedZ', allowedZ);

        const tmpBoxZ = new THREE.Box3();
        tmpBoxZ.min.copy(center).sub(half);
        tmpBoxZ.max.copy(center).add(half);
        if (intersectsBox(tmpBoxZ, other)) {
          const remPenZ = Math.min(tmpBoxZ.max.z, other.max.z) - Math.max(tmpBoxZ.min.z, other.min.z);
          if (remPenZ > 1e-5) {
            const extraZ = remPenZ + EPS;
            const signZ = (appliedTz >= 0) ? 1 : -1;
            center.z += signZ * extraZ * (appliedTz === 0 ? Math.sign(tz) || 1 : Math.sign(appliedTz));
            if (debugEnabled || options.debug) console.log('[resolveMovement] axis=z extra separation', extraZ);
            // finish early to avoid repeated extra corrections across iterations
            iter = maxIters;
            break;
          }
        }
  } else { // y axis
        // vertical handling: decide landing vs underside using prevBottomY
        const otherCenterY = (other.min.y + other.max.y) * 0.5;
        if (center.y < otherCenterY) {
          // our center is below their center -> we are beneath them; push down
          const ty = other.min.y - testBox.max.y - EPS;
          center.y += ty;
        } else {
          // we are above; consider landing only if prevBottomY suggests we came from above
          if (prevBottomY >= other.max.y - landThresholdOpt) {
            const ty = other.max.y - testBox.min.y + EPS;
            center.y += ty;
            onGround = true;
            groundOther = other;
          } else {
            // if we were below previously, push below the underside
            const ty = other.min.y - testBox.max.y - EPS;
            center.y += ty;
          }
        }
      }

      // after handling one intersection, break to re-evaluate (iterative separation)
      // update debug meshes to visualize testBox and the current other
      if (debugEnabled || options.debug) {
        if (debugTestMesh) {
          const size = new THREE.Vector3();
          testBox.getSize(size);
          debugTestMesh.scale.set(size.x || 1, size.y || 1, size.z || 1);
          const centerBox = testBox.getCenter(new THREE.Vector3());
          debugTestMesh.position.copy(centerBox);
        }
        if (debugOtherMesh) {
          const size2 = new THREE.Vector3();
          other.getSize(size2);
          debugOtherMesh.scale.set(size2.x || 1, size2.y || 1, size2.z || 1);
          const centerOther = other.getCenter(new THREE.Vector3());
          debugOtherMesh.position.copy(centerOther);
        }
      }

      break;
    }
    if (!any) break;
  }

  const resolvedOffset = center.clone().sub(originalCenter);
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
