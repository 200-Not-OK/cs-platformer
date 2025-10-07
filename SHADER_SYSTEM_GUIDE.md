# 🎨 Shader & Shadow System Guide

## Overview
A comprehensive shader and shadow system has been implemented to create stunning, immersive visuals for your dark castle game. This system provides:

- **High-quality soft shadows** from all light sources
- **Physically-based materials** (PBR) for realistic surfaces
- **Atmospheric fog** for depth and ambiance
- **Character-specific shaders** with rim lighting
- **Stone/metal material presets** for castle architecture
- **Automatic shadow configuration** for optimal performance

---

## Features Implemented

### 1. **Enhanced Renderer Setup**
- **Shadow Mapping**: PCF (Percentage Closer Filtering) soft shadows enabled
- **Tone Mapping**: ACES Filmic for cinematic color grading
- **Color Space**: sRGB for accurate color reproduction
- **High DPI Support**: Automatically scales for retina displays

### 2. **Material Shader System**

#### **Atmospheric Shader** (Default)
Applied to general environment objects:
```javascript
{
  roughness: 0.8,
  metalness: 0.2,
  emissive: subtle ambient glow,
  shadows: cast & receive
}
```

#### **Character Shader**
Enhanced lighting response for player/NPCs:
```javascript
{
  roughness: 0.6,
  metalness: 0.1,
  emissive: rim lighting effect,
  shadows: cast & receive (double-sided)
}
```

#### **Castle Stone Shader**
For walls, floors, and architecture:
```javascript
{
  roughness: 0.9,
  metalness: 0.0,
  emissive: subtle blue tint,
  shadows: cast & receive
}
```

#### **Metal Shader**
For weapons, armor, and metallic objects:
```javascript
{
  roughness: 0.3,
  metalness: 0.9,
  shadows: cast & receive
}
```

### 3. **Atmospheric Fog**
- **Color**: Dark blue-black (`0x000510`)
- **Near Distance**: 30 units
- **Far Distance**: 150 units
- Creates depth and mystery in your dark castle

### 4. **Shadow Configuration**

#### **Moonlight (Directional)**
```javascript
Shadow Map Size: 4096×4096
Shadow Bias: -0.0005
Normal Bias: 0.02
Coverage: 60 units (square)
Range: 0.5 to 100 units
```

#### **Star Lights (Point)**
```javascript
Shadow Map Size: 2048×2048
Shadow Bias: -0.001
Normal Bias: 0.02
Range: 0.5 to 100 units
Decay: Physical (2.0)
```

---

## Usage Examples

### Applying Shaders Automatically

The system automatically processes:
1. **Player models** → Character shader with rim lighting
2. **Level geometry** → Stone shader for castle surfaces
3. **All meshes** → Shadow casting/receiving enabled

### Manual Shader Application

```javascript
// Get shader system reference
const shaderSystem = scene.userData.shaderSystem;

// Apply to a loaded object
shaderSystem.processObject(myObject, 'stone'); // Options: 'atmospheric', 'character', 'stone', 'metal'

// Apply to individual mesh
shaderSystem.applyCharacterShader(myMesh, {
  roughness: 0.5,
  metalness: 0.2,
  rimColor: new THREE.Color(0x4a5568),
  rimIntensity: 0.2
});

// Configure light shadows
shaderSystem.configureLightShadows(myLight, {
  shadowMapSize: 2048,
  shadowBias: -0.001,
  near: 0.5,
  far: 100
});
```

### Custom Fog Settings

```javascript
shaderSystem.applyFog(
  0x000510,  // color (dark blue-black)
  30,        // near distance
  150        // far distance
);
```

---

## Visual Improvements You'll See

### ✨ **Before vs After**

**Before:**
- Flat lighting with no depth
- Hard shadows or no shadows
- Objects blend into background
- No atmospheric depth

**After:**
- Soft, realistic shadows from all lights
- Characters have rim lighting that makes them pop
- Stone surfaces have appropriate roughness
- Fog creates mysterious depth
- Physically accurate light falloff
- Metallic surfaces reflect light realistically

### 🌟 **Star Light Improvements**
Your stars now:
- Cast warm, soft shadows
- Have optimized shadow maps (2048×2048)
- Use physically correct light decay
- Create atmospheric lighting pools
- Preserve their golden color while illuminating surroundings

### 🏰 **Castle Atmosphere**
The system enhances your dark castle theme:
- Stone walls look rough and ancient
- Fog obscures distant areas
- Shadows create dramatic contrast
- Warm star light vs. cool moonlight
- Fire torches blend naturally with star lighting

---

## Performance Optimization

### **Shadow Map Sizes**
- **Moonlight**: 4096×4096 (high detail, distant)
- **Stars**: 2048×2048 (good quality, multiple lights)
- **Point Lights**: 1024×1024 (fallback for performance)

### **Recommendations**
1. Use fewer high-resolution shadows for key lights
2. Adjust fog distance to hide far geometry
3. Disable shadows for decorative lights if needed
4. Use shadow bias carefully to avoid artifacts

---

## Advanced Features

### Custom Shader Materials

Create your own shader effects:

```javascript
const customMaterial = shaderSystem.createCustomShader({
  uniforms: {
    lightPosition: { value: new THREE.Vector3(0, 10, 0) },
    baseColor: { value: new THREE.Color(0x8b4513) }
  },
  vertexShader: `/* your GLSL code */`,
  fragmentShader: `/* your GLSL code */`
});
```

### Dynamic Shader Updates

```javascript
// In your game loop
shaderSystem.update(deltaTime);
```

---

## Troubleshooting

### **Shadows Not Appearing**
1. Check that `renderer.shadowMap.enabled = true`
2. Verify lights have `castShadow = true`
3. Ensure meshes have `castShadow` and `receiveShadow` enabled
4. Check shadow camera bounds (may be too small)

### **Performance Issues**
1. Reduce shadow map sizes
2. Decrease number of shadow-casting lights
3. Adjust fog to hide distant objects
4. Use LOD (Level of Detail) for distant meshes

### **Shadow Artifacts**
1. Adjust `shadowBias` (increase if seeing shadow acne)
2. Adjust `normalBias` (increase if seeing peter-panning)
3. Increase shadow camera near/far range
4. Check for mesh normals (may need recalculation)

---

## File Structure

```
src/game/
├── shaderSystem.js         # Main shader system class
├── scene.js                # Integrates shader system
├── game.js                 # Stores shader system reference
├── player.js               # Applies character shader
├── level.js                # Applies stone shader to levels
└── lights/
    └── starLight.js        # Enhanced shadow configuration
```

---

## Future Enhancements

Potential additions for even more stunning visuals:

1. **Post-Processing**
   - Bloom effect for star glow
   - Color grading for cinematic look
   - Screen space ambient occlusion (SSAO)
   - God rays from light sources

2. **Advanced Shaders**
   - Wet stone surfaces (rain effects)
   - Torch fire animation
   - Magic spell effects
   - Dynamic day/night cycle

3. **Shadow Enhancements**
   - Cascaded shadow maps for directional lights
   - Dynamic shadow distance based on camera
   - Contact shadows for small details

---

## Integration Complete ✅

Your game now has:
- ✅ High-quality soft shadows
- ✅ Physically-based materials
- ✅ Atmospheric fog
- ✅ Character rim lighting
- ✅ Optimized shadow configuration
- ✅ Automatic material processing
- ✅ Dark castle ambiance

**Result**: A stunning, immersive dark castle experience with realistic lighting and shadows that bring your game world to life! 🏰✨
