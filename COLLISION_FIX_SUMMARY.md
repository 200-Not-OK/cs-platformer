# Collision Detection Fix - Player Falling Through Meshes

## Problem Identified
The player was falling through level geometry despite collision bodies being created. Analysis of the console logs revealed the root cause:

**Duplicate Physics Bodies**: Physics bodies were being created twice for each mesh:
1. First during level loading in `level.js` 
2. Second during game initialization in `game.js` via `_addLevelToPhysics()`

This created conflicting collision bodies that interfered with proper collision detection.

## Solution Applied

### 1. Removed Duplicate Physics Body Creation
- **Removed**: `_addLevelToPhysics()` method from `game.js`
- **Removed**: Call to `this._addLevelToPhysics()` during level loading
- **Result**: Each mesh now has only one physics body created during level loading

### 2. Improved Collision Detection Logic
- **Disabled**: Trimesh collision by default (too complex for reliable platformer physics)
- **Updated**: Collision type detection to be more conservative
- **Added**: Better validation for Trimesh creation with fallback to box collision
- **Improved**: Error handling for invalid collision geometry

### 3. Enhanced Debugging
- **Added**: Better logging of collision body creation
- **Added**: Physics body count verification during level loading
- **Improved**: Console commands for collision debugging

## Key Changes Made

### In `game.js`:
```javascript
// BEFORE (problematic):
this._addLevelToPhysics(); // Created duplicate physics bodies

// AFTER (fixed):
console.log('✅ Level loaded with', this.level.physicsBodies.length, 'physics bodies');
```

### In `PhysicsWorld.js`:
```javascript
// BEFORE:
useAccurateCollision: true // Used Trimesh by default (unreliable)

// AFTER:  
useAccurateCollision: false // Use box collision by default (reliable)
```

### Conservative Collision Detection:
- **Box collision** (default): Fast and reliable for platformer mechanics
- **Trimesh collision**: Only for meshes explicitly named with `trimesh`, `accurate`, or `complex`
- **Automatic fallback**: Trimesh failures automatically fall back to box collision

## Testing Instructions

1. **Load the game** - No more duplicate physics body creation messages
2. **Check collision** - Player should no longer fall through level geometry  
3. **Debug commands** available:
   - `window.togglePhysicsDebug()` - Show collision wireframes
   - `window.showCollisionInfo()` - Display collision details
   - `window.toggleAccurateCollision()` - Switch collision modes
   - `window.inspectMesh('meshName')` - Inspect specific mesh properties

## GLTF Collision Geometry Fix

### Additional Issue: Mismatched Collision Boundaries
After fixing duplicate physics bodies, discovered that collision boxes for GLTF meshes had incorrect dimensions due to transform handling issues.

### Root Cause: 
- Double scaling: mesh scale applied both in bounding box calculation AND world transform decomposition
- Complex world transform handling not needed for GLTF meshes

### Solution:
1. **Simplified Transform Handling**: Use mesh's local position/rotation instead of world transform
2. **Fixed Scale Application**: Apply mesh scale only once during bounding box calculation  
3. **Enhanced Debugging**: Added detailed logging and `window.inspectMesh()` command

### Key Changes:
```javascript
// BEFORE (problematic):
mesh.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);
body.position.copy(worldPosition);

// AFTER (simplified):
body.position.copy(mesh.position); // Use local transform
```

## Expected Console Output (Fixed)
```
✅ GLTF processing complete: 11 meshes, 11 physics bodies  
✅ Level loaded with 11 physics bodies
```

**No more duplicate "Adding mesh to physics" messages!**

## Performance Impact
- **Improved**: Eliminated duplicate physics bodies reduces physics world complexity
- **Improved**: Box collision is faster than Trimesh collision
- **Maintained**: Option to use accurate collision for specific meshes when needed

The collision detection should now work reliably with the player properly colliding with level geometry instead of falling through it.