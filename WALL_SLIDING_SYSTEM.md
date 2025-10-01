# Wall Sliding System Implementation

## Overview
Implemented a smooth wall sliding system that allows the player to slide along walls and enemies when moving diagonally into them, preventing the "sticky wall" effect common in platformer games.

## How It Works

### 1. Collision Detection
- **Event Listeners**: Physics body collision events detect when player touches walls/enemies
- **Normal Extraction**: Collision normals are stored for surfaces that are vertical (not floors/ceilings)
- **Material Detection**: Automatically detects walls, enemies, and other slideable surfaces

### 2. Sliding Algorithm
- **Vector Projection**: Projects the intended movement vector along wall surfaces
- **Formula**: `v_slide = v_desired - (v_desired · n) * n` where `n` is the wall normal
- **Multi-Wall Support**: Handles sliding along multiple intersecting walls simultaneously
- **Speed Retention**: Maintains natural movement speed while sliding

### 3. Material Assignment
Level geometry now uses appropriate physics materials based on mesh names:
- **Walls**: `wall` material (low friction for sliding)
- **Platforms**: `platform` material 
- **Ground**: `ground` material (default)

## Key Features

### ✅ **Smooth Diagonal Movement**
- Move diagonally into walls without getting stuck
- Natural sliding motion along wall surfaces
- Works with both static geometry and dynamic enemies

### ✅ **Intelligent Material Detection**
```javascript
// Automatic material assignment based on mesh names
if (meshName.includes('wall') || meshName.includes('barrier')) {
  materialType = 'wall'; // Low friction for sliding
}
```

### ✅ **Configurable Settings**
- **Enable/Disable**: `player.enableWallSliding = true/false`
- **Smoothness**: `player.wallSlideSmoothing = 0.8` (0-1 scale)
- **Debug Mode**: Real-time collision normal visualization

### ✅ **Multi-Surface Sliding**
- Handles corner collisions (two walls meeting)
- Progressive speed reduction with multiple simultaneous collisions
- Maintains responsive movement feel

## Debug Commands

### Console Commands Available:
```javascript
// Toggle wall sliding on/off
window.toggleWallSliding()

// Show current wall collision normals
window.debugWallNormals()

// Adjust sliding smoothness (0 = choppy, 1 = very smooth)
window.setWallSlideSmoothing(0.8)

// Inspect specific mesh collision properties
window.inspectMesh('playground001')

// Toggle physics debug visualization
window.togglePhysicsDebug()
```

### Visual Debugging:
- **Physics Debug**: Press `L` in-game to show collision wireframes
- **Wall Normals**: Use `debugWallNormals()` to see collision directions in console

## Technical Implementation

### Player Class Changes:
```javascript
// New properties
this.enableWallSliding = true;
this.wallSlideSmoothing = 0.8;
this.wallNormals = []; // Current collision normals

// Collision detection
this.body.addEventListener('collide', (event) => {
  this.handleCollision(event);
});

// Sliding calculation
calculateSlidingVelocity(desiredVelocity, wallNormals) {
  // Projects movement along wall surfaces
}
```

### Physics Materials:
- **Player-Wall Contact**: `friction: 0.1` (low for sliding)
- **Player-Ground Contact**: `friction: 0.1` (stable movement)
- **Player-Enemy Contact**: `friction: 0.3` (slight resistance)

## Usage Examples

### Basic Wall Sliding:
1. **Load the game** and move to a wall
2. **Hold W+A or W+D** (diagonal movement into wall)
3. **Player slides smoothly** along the wall instead of stopping

### Testing Different Surfaces:
1. **Test walls**: Move diagonally into level walls
2. **Test enemies**: Walk into enemy colliders 
3. **Test corners**: Move into corner where two walls meet

### Tuning the Feel:
```javascript
// More responsive (less smooth)
window.setWallSlideSmoothing(0.5)

// Very smooth (may feel floaty)
window.setWallSlideSmoothing(0.9)

// Disable completely
window.toggleWallSliding()
```

## Benefits

### ✅ **Improved Player Experience**
- No more getting stuck on walls during diagonal movement
- Smooth, responsive movement that feels natural
- Maintains platformer game flow

### ✅ **Enhanced Level Design**
- Walls can be placed without worrying about sticky collision
- Complex geometry layouts work smoothly
- Enemy collisions feel fair and responsive

### ✅ **Performance Optimized**
- Collision normals cleared each frame (no memory leaks)
- Efficient vector math calculations
- Minimal impact on physics simulation

## Future Enhancements

Potential improvements:
- **Wall Jump**: Extended wall sliding for wall jumping mechanics
- **Surface Materials**: Different sliding properties for ice, metal, etc.
- **Particle Effects**: Visual feedback for wall sliding
- **Audio**: Sound effects for wall contact and sliding

The wall sliding system provides a professional-quality movement experience that enhances gameplay fluidity and responsiveness.