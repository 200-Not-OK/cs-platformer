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
    // More forgiving tolerance for smoother slope transitions
    return distance < 0.8; // Increased tolerance for edge transitions
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
    const maxBlockDistance = Math.max(this.boundingBox.max.x - this.boundingBox.min.x, this.boundingBox.max.z - this.boundingBox.min.z) * 0.7;
    if (distance > maxBlockDistance) {
      return false;
    }
    
    // Check current position height to understand transition context
    const currentSlopeHeight = this.getHeightAt(playerCenter.x, playerCenter.z);
    const newSlopeHeight = this.getHeightAt(newX, newZ);
    
    // If neither current nor new position is on the slope, use bounding box logic
    if (currentSlopeHeight === null && newSlopeHeight === null) {
      if (!this.intersectsBox(playerBox)) {
        return false;
      }
      // Only block if significantly intersecting and player is below slope
      return playerBottom < this.boundingBox.max.y - 0.3;
    }
    
    // If player is way above the slope, don't block
    if (playerBottom > this.boundingBox.max.y + 1) {
      return false;
    }
    
    // If player is way below the slope, block (can't walk through from underneath)
    if (playerTop < this.boundingBox.min.y - 0.1) {
      return true;
    }
    
    // Handle edge transitions more smoothly
    if (newSlopeHeight === null) {
      // Moving off the slope - be more permissive to allow smooth transitions
      if (currentSlopeHeight !== null) {
        const currentHeightDiff = currentSlopeHeight - playerBottom;
        // Allow movement off slope if currently on or near the slope surface
        if (Math.abs(currentHeightDiff) < 1.2) {
          return false;
        }
      }
      
      // Check if player is near the edge of the slope bounds
      const slopeEdgeBuffer = 0.8; // Increased buffer for better edge detection
      const nearEdgeX = (
        Math.abs(newX - this.boundingBox.min.x) < slopeEdgeBuffer ||
        Math.abs(newX - this.boundingBox.max.x) < slopeEdgeBuffer
      );
      const nearEdgeZ = (
        Math.abs(newZ - this.boundingBox.min.z) < slopeEdgeBuffer ||
        Math.abs(newZ - this.boundingBox.max.z) < slopeEdgeBuffer
      );
      
      // Check if we're transitioning from outside to inside slope bounds
      const currentX = playerCenter.x;
      const currentZ = playerCenter.z;
      const movingTowardsSlope = (
        (currentX < this.boundingBox.min.x && newX > currentX) || // Moving right towards left edge
        (currentX > this.boundingBox.max.x && newX < currentX) || // Moving left towards right edge
        (currentZ < this.boundingBox.min.z && newZ > currentZ) || // Moving forward towards back edge
        (currentZ > this.boundingBox.max.z && newZ < currentZ)    // Moving back towards front edge
      );
      
      // If transitioning onto slope or near edge, and not significantly below, allow movement
      if ((nearEdgeX || nearEdgeZ || movingTowardsSlope) && playerBottom >= this.boundingBox.min.y - 0.5) {
        return false;
      }
      
      // Outside slope bounds - only block if intersecting and significantly below
      return this.intersectsBox(playerBox) && (playerBottom < this.boundingBox.max.y - 1.0);
    }
    
    // Moving to a position on the slope
    const heightDifference = newSlopeHeight - playerBottom;
    
    // If the slope surface is way above the player, block movement (too steep to walk over)
    if (heightDifference > 1.5) {
      return true;
    }
    
    // If the player is significantly below the slope surface, might be trying to walk through
    if (heightDifference < -1.0) {
      // But allow if this is a transition from being on the slope
      if (currentSlopeHeight !== null) {
        const currentHeightDiff = currentSlopeHeight - playerBottom;
        // Allow if transitioning smoothly from current slope position
        if (Math.abs(currentHeightDiff) < 0.8) {
          return false;
        }
      }
      return true;
    }
    
    // For reasonable height differences, allow movement (normal slope walking)
    return false;
  }
}