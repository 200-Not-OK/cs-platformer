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
    
    // Distance check: only consider collision if player is reasonably close to slope
    const slopeCenter = new THREE.Vector3().lerpVectors(this.boundingBox.min, this.boundingBox.max, 0.5);
    const distance = Math.sqrt(
      Math.pow(newX - slopeCenter.x, 2) + 
      Math.pow(newZ - slopeCenter.z, 2)
    );
    
    // If player is far from the slope, don't block movement
    const maxBlockDistance = Math.max(this.boundingBox.max.x - this.boundingBox.min.x, this.boundingBox.max.z - this.boundingBox.min.z) * 0.6;
    if (distance > maxBlockDistance) {
      return false;
    }
    
    // Bounding box intersection check
    if (!this.intersectsBox(playerBox)) {
      return false;
    }
    
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
    
    // Inside slope bounds - check if the height difference is reasonable for walking
    const heightDifference = slopeHeight - playerBottom;
    
    // If the slope surface is way above the player, block movement (too steep to walk over)
    if (heightDifference > 1.2) {
      return true;
    }
    
    // If the player is significantly below the slope surface, it might be trying to walk through
    // But allow some tolerance for normal slope walking where the player's bottom can be below the surface
    if (heightDifference < -0.8) {
      // Player is way below the slope surface - likely trying to walk through from below
      return true;
    }
    
    // For reasonable height differences, allow movement (normal slope walking)
    return false;
  }
}