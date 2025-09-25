import * as THREE from 'three';

/**
 * Simple Slope Collider - A clean, simple approach to slope collision
 * Uses raycasting to find the slope surface height at any point
 */
export class SimpleSlopeCollider {
  constructor(mesh) {
    this.mesh = mesh;
    this.boundingBox = new THREE.Box3().setFromObject(mesh);
    
    // Create a raycaster for finding surface height
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 100;
    
    // Direction vectors for raycasting
    this.downVector = new THREE.Vector3(0, -1, 0);
    this.upVector = new THREE.Vector3(0, 1, 0);
  }
  
  /**
   * Get the height of the slope surface at a given X,Z position
   * Returns the Y coordinate of the slope surface, or null if outside bounds
   */
  getHeightAt(x, z) {
    // Quick bounds check - if outside XZ bounds, return null
    if (x < this.boundingBox.min.x || x > this.boundingBox.max.x ||
        z < this.boundingBox.min.z || z > this.boundingBox.max.z) {
      return null;
    }
    
    // Raycast from above the slope down to find the surface
    const rayOrigin = new THREE.Vector3(x, this.boundingBox.max.y + 10, z);
    this.raycaster.set(rayOrigin, this.downVector);
    
    const intersects = this.raycaster.intersectObject(this.mesh, true);
    
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
    
    return null;
  }
  
  /**
   * Check if a bounding box intersects with this slope
   */
  intersectsBox(box) {
    return this.boundingBox.intersectsBox(box);
  }
  
  /**
   * Check if the player can stand on this slope at the given position
   */
  canStandOn(x, z, playerBottom) {
    const slopeHeight = this.getHeightAt(x, z);
    if (slopeHeight === null) return false;
    
    // Player can stand if they're close to the slope surface
    const distance = Math.abs(playerBottom - slopeHeight);
    return distance < 0.5; // Allow some tolerance
  }
  
  /**
   * Check if horizontal movement should be blocked
   * This prevents walking through steep slope sides
   */
  shouldBlockHorizontalMovement(playerBox, newX, newZ) {
    const playerBottom = playerBox.min.y;
    const playerTop = playerBox.max.y;
    const playerCenter = new THREE.Vector3().lerpVectors(playerBox.min, playerBox.max, 0.5);
    
    // If player is way above the slope, don't block
    if (playerBottom > this.boundingBox.max.y + 1) {
      return false;
    }
    
    // If player is way below the slope, block (can't walk through from underneath)
    if (playerTop < this.boundingBox.min.y - 0.1) {
      return true;
    }
    
    // Check if the new position would be inside the slope bounds
    const slopeHeight = this.getHeightAt(newX, newZ);
    if (slopeHeight === null) {
      // Outside slope bounds - only block if we're intersecting the bounding box
      // and the height difference is significant
      return this.intersectsBox(playerBox) && 
             (playerBottom < this.boundingBox.max.y - 0.5);
    }
    
    // Inside slope bounds - check if the height difference is too steep to walk over
    const heightDifference = slopeHeight - playerBottom;
    
    // If the slope surface is way above the player, block movement
    if (heightDifference > 1.0) {
      return true;
    }
    
    // If the player would be inside the slope geometry, block
    if (playerBottom < slopeHeight - 0.2) {
      return true;
    }
    
    return false;
  }
}