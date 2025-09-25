import * as THREE from 'three';

/**
 * Simple Collision System - Clean approach for handling both platforms and slopes
 */
export class SimpleCollisionSystem {
  
  /**
   * Resolve movement with collision detection for both regular platforms and slopes
   * @param {THREE.Box3} playerBox - Player's bounding box
   * @param {THREE.Vector3} movement - Intended movement vector
   * @param {Array} platformMeshes - Array of platform meshes to check collision against
   * @returns {Object} - {movement: Vector3, grounded: boolean, groundHeight: number}
   */
  static resolveMovement(playerBox, movement, platformMeshes) {
    // Create the final movement vector (will be modified by collision)
    const finalMovement = movement.clone();
    
    // Track ground state
    let grounded = false;
    let groundHeight = -Infinity;
    
    // Phase 1: Handle horizontal movement (X and Z axes)
    for (const axis of ['x', 'z']) {
      if (Math.abs(finalMovement[axis]) < 0.001) continue;
      
      // Test horizontal movement on this axis
      const testMovement = new THREE.Vector3();
      testMovement[axis] = finalMovement[axis];
      
      const testBox = playerBox.clone().translate(testMovement);
      
      // Check collision with all meshes
      let blocked = false;
      
      for (const mesh of platformMeshes) {
        if (!mesh || !mesh.userData) continue;
        
        // Handle slopes
        if (mesh.userData.type === 'slope' && mesh.userData.simpleSlopeCollider) {
          const slopeCollider = mesh.userData.simpleSlopeCollider;
          const newPos = new THREE.Vector3().lerpVectors(testBox.min, testBox.max, 0.5);
          
          if (slopeCollider.shouldBlockHorizontalMovement(testBox, newPos.x, newPos.z)) {
            blocked = true;
            break;
          }
        }
        
        // Handle regular platforms
        else if (mesh.userData.collider) {
          const other = mesh.userData.collider;
          if (other === playerBox) continue;
          
          if (testBox.intersectsBox(other)) {
            // Check if this is a vertical collision (player hitting side of platform)
            const playerBottom = testBox.min.y;
            const playerTop = testBox.max.y;
            const platformBottom = other.min.y;
            const platformTop = other.max.y;
            
            // If there's significant vertical overlap, block horizontal movement
            const verticalOverlap = Math.min(playerTop, platformTop) - Math.max(playerBottom, platformBottom);
            if (verticalOverlap > 0.1) {
              blocked = true;
              break;
            }
          }
        }
      }
      
      // If blocked, zero out movement on this axis
      if (blocked) {
        finalMovement[axis] = 0;
      }
    }
    
    // Phase 2: Handle vertical movement and ground detection
    const testBox = playerBox.clone().translate(finalMovement);
    const playerCenter = new THREE.Vector3().lerpVectors(testBox.min, testBox.max, 0.5);
    
    // Find the highest ground surface under the player
    for (const mesh of platformMeshes) {
      if (!mesh || !mesh.userData) continue;
      
      // Handle slopes
      if (mesh.userData.type === 'slope' && mesh.userData.simpleSlopeCollider) {
        const slopeCollider = mesh.userData.simpleSlopeCollider;
        const slopeHeight = slopeCollider.getHeightAt(playerCenter.x, playerCenter.z);
        
        if (slopeHeight !== null && slopeCollider.canStandOn(playerCenter.x, playerCenter.z, testBox.min.y)) {
          if (slopeHeight > groundHeight) {
            groundHeight = slopeHeight;
            grounded = true;
          }
        }
      }
      
      // Handle regular platforms
      else if (mesh.userData.collider) {
        const other = mesh.userData.collider;
        if (other === playerBox) continue;
        
        // Check if player is above this platform
        const xOverlap = testBox.max.x > other.min.x && testBox.min.x < other.max.x;
        const zOverlap = testBox.max.z > other.min.z && testBox.min.z < other.max.z;
        
        if (xOverlap && zOverlap) {
          const platformTop = other.max.y;
          const playerBottom = testBox.min.y;
          
          // If player is close to or on the platform
          if (Math.abs(playerBottom - platformTop) < 0.5 && platformTop > groundHeight) {
            groundHeight = platformTop;
            grounded = true;
          }
        }
      }
    }
    
    // Phase 3: Apply ground constraints
    if (grounded && groundHeight > -Infinity) {
      // If player would fall below ground, snap to ground
      if (testBox.min.y < groundHeight) {
        finalMovement.y = groundHeight - playerBox.min.y;
      }
      // If player is moving down but would pass through ground, stop at ground
      else if (finalMovement.y < 0 && testBox.min.y + finalMovement.y < groundHeight) {
        finalMovement.y = groundHeight - playerBox.min.y;
      }
    }
    
    return {
      movement: finalMovement,
      grounded: grounded,
      groundHeight: groundHeight
    };
  }
}