# Shadow Troubleshooting Guide

## Changes Made to Fix Shadows

### 1. **Massively Increased Shadow Light** (`scene.js`)
```javascript
const shadowLight = new THREE.DirectionalLight(0xffffff, 2.0);
// White light at intensity 2.0 - shadows MUST be visible now
```

### 2. **Added Debug Ground Plane** (`scene.js`)
A simple gray plane at y=0 to test if shadows work at all:
```javascript
testGround.receiveShadow = true;
```

### 3. **Enhanced Logging** (`player.js`)
Now shows exactly which meshes have shadows enabled.

## How to Verify Shadows Are Working

### Step 1: Check Console Logs
When you run the game, look for these messages:
```
✅ Player shadows enabled on X meshes
  ✅ Shadow enabled for mesh: [mesh names]
🟦 DEBUG: Test ground plane added at y=0
🌙 Shadow light added (WHITE, intensity 2.0)
```

### Step 2: Look for the Debug Ground Plane
- You should see a **dark gray plane** at ground level (y=0)
- Your character should cast a **clear, dark shadow** on this plane
- If you see NO shadow on this plane, the issue is NOT with your level geometry

### Step 3: Check Renderer
Open browser console and type:
```javascript
// Check if shadow map is enabled
console.log(window.game?.renderer?.shadowMap?.enabled);  // Should be TRUE

// Check shadow light
console.log(window.game?.scene?.userData?.shadowLight);  // Should show DirectionalLight
```

## Common Issues & Solutions

### Issue 1: Shadow light not in scene
**Symptom:** No shadow on debug ground plane
**Solution:** Make sure HDRI loads properly (shadow light is created in HDRI load callback)

### Issue 2: Player too high up
**Symptom:** Player floating, shadow not visible below
**Check:** Player Y position should be around 2-10, not 100+

### Issue 3: Shadow camera frustum too small
**Current settings:** 150x150 unit coverage (should be plenty)
**If still not enough:** Increase the shadow camera bounds in `scene.js`

### Issue 4: Level geometry not receiving shadows
**Check:** Your GLTF level materials might not support shadows
**Solution:** Level.js already sets `receiveShadow = true` on all meshes

### Issue 5: Materials don't support lighting
**Problem:** MeshBasicMaterial doesn't receive shadows
**Solution:** Level should use MeshStandardMaterial or MeshPhysicalMaterial

## Debug Commands

Add these to browser console to diagnose:

```javascript
// List all lights in scene
game.scene.traverse(obj => {
  if (obj.isLight) console.log(obj.type, obj.intensity, obj.castShadow);
});

// List all shadow casters
game.scene.traverse(obj => {
  if (obj.isMesh && obj.castShadow) console.log('Casts shadow:', obj.name);
});

// List all shadow receivers
game.scene.traverse(obj => {
  if (obj.isMesh && obj.receiveShadow) console.log('Receives shadow:', obj.name);
});

// Check player position
console.log('Player position:', game.player.getPosition());
```

## Expected Result

With these changes, you should see:
1. ✅ **Bright scene** (intensity 2.0 white light)
2. ✅ **Dark gray ground plane** at y=0
3. ✅ **Clear, obvious shadow** of your character on the ground plane
4. ✅ **Shadow on your actual level geometry** (if it's at y=0)

## If Still No Shadow...

Then the issue is likely:
- HDRI not loading (shadow light never added)
- Player model not actually loaded
- WebGL context issue
- Browser doesn't support shadow maps

Check browser console for any errors!
