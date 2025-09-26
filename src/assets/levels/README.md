# Level GLTF Files

This directory contains GLTF files that define the base geometry for each level.

## File Structure

Each level should have a corresponding GLTF file:
- `intro.gltf` - Base geometry for the intro level
- `custom_level.gltf` - Base geometry for the custom level

## Creating Level GLTF Files

1. **Blender Workflow** (Recommended):
   - Create your level geometry in Blender
   - Name collision objects with "collision" or "collider" in the name
   - Export as GLTF 2.0 (.gltf + .bin format)
   - Place files in this directory

2. **Collision Detection**:
   - All meshes in the GLTF will be processed for collision
   - Objects with "collision" or "collider" in their name are tagged as collision-only
   - Collision boxes are automatically generated from mesh geometry

3. **Material Handling**:
   - Materials from GLTF files are preserved
   - No need to set colors in levelData.js for GLTF geometry

## Fallback System

If a GLTF file is not found or fails to load, the system will fall back to the `fallbackObjects` defined in `levelData.js`. This allows for:
- Rapid prototyping with procedural geometry
- Gradual migration from procedural to GLTF-based levels
- Backup in case of asset loading issues

## Level Integration

The level geometry is loaded automatically when the level starts. Enemy positions, lighting, cinematics, and UI are still controlled through `levelData.js`.