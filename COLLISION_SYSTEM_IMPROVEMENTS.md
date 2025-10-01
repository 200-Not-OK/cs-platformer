# Collision System Improvements

## Issue Fixed
The original collision detection system was using simple bounding box colliders for all GLTF meshes, resulting in collision boundaries that didn't properly surround complex geometry.

## Improvements Made

### 1. Intelligent Collision Type Detection
The system now automatically chooses the best collision type based on mesh names:

- **Trimesh Collision** (Accurate): Used for meshes named with:
  - `complex`, `detailed`, `trimesh`, `accurate`
  - Any mesh without `box` or `simple` in the name (when accurate collision is enabled globally)

- **Box Collision** (Fast): Used for meshes named with:
  - `box`, `simple`, `basic`

### 2. Global Accurate Collision Setting
- **Enabled by default** - The physics world now uses accurate Trimesh collision by default
- Can be toggled via console: `window.toggleAccurateCollision()`
- Per-mesh override options available in level loading

### 3. Better Mesh Processing
- Considers mesh world transforms (position, rotation, scale)
- Improved error handling for complex geometries
- Fallback to box collision if Trimesh creation fails

### 4. Debug Tools
New console commands for debugging collision issues:

```javascript
// Toggle physics wireframe visualization
window.togglePhysicsDebug()

// Show detailed collision information
window.showCollisionInfo()

// Toggle between box and accurate collision
window.toggleAccurateCollision()

// Access game instance for level reloading
window.game.loadLevel(0) // Reload level 0
window.game.loadLevel(1) // Reload level 1
```

### 5. Level Data Path Fix
Fixed the Level 2 GLTF path from `src/assets/levels/level2/level2.gltf` to `src/assets/levels/Level2/Level2.gltf` to match the actual file structure.

## Usage Tips

### For Level Designers
Name your meshes strategically for optimal collision detection:

- **Complex geometry**: `platform_complex`, `terrain_detailed`, `wall_accurate`
- **Simple geometry**: `floor_simple`, `wall_box`, `platform_basic`

### For Developers
```javascript
// Force specific collision type when adding static meshes
physicsWorld.addStaticMesh(mesh, 'ground', {
  useAccurateCollision: true,  // Force Trimesh
  forceBoxCollider: false      // Force Box (overrides accurate)
});
```

### Performance Considerations
- **Trimesh collision**: More accurate but computationally expensive
- **Box collision**: Less accurate but much faster
- Use box collision for simple geometric shapes
- Use Trimesh collision for complex terrain and detailed structures

## Testing
1. Load a level and press `L` to toggle physics debug visualization
2. Run `window.showCollisionInfo()` to see collision types being used
3. Test collision boundaries by moving the player character
4. Compare performance between box and Trimesh collision modes

## Debugging Collision Issues
1. Enable physics debug: `window.togglePhysicsDebug()`
2. Check collision info: `window.showCollisionInfo()`
3. Verify mesh names match expected collision types
4. Check console for physics body creation logs
5. Test with different collision modes using `window.toggleAccurateCollision()`