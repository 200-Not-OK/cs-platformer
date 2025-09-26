# Level System Update - GLTF + Cinematics

## Overview

The level system has been redesigned to support:
1. **GLTF-based level geometry** - Load 3D level models from Blender or other 3D tools
2. **Cinematics and dialogue system** - Level-specific cutscenes and dialogue
3. **Fallback procedural geometry** - Maintains compatibility with existing level data

## New Architecture

### 1. Level Data Structure (levelData.js)

```javascript
{
  id: 'level_name',
  name: 'Display Name',
  gltfUrl: 'src/assets/levels/level_name.gltf', // NEW: GLTF geometry
  startPosition: [x, y, z],
  ui: ['hud'],
  lights: ['BasicLights'],
  enemies: [
    { type: 'walker', position: [x, y, z], /* ... */ }
  ],
  // NEW: Cinematics system
  cinematics: {
    onLevelStart: {
      type: 'dialogue',
      character: 'narrator',
      lines: [
        { text: "Welcome!", duration: 3000 }
      ]
    },
    onEnemyDefeat: {
      type: 'cutscene',
      cameraPath: [
        { position: [x, y, z], lookAt: [x, y, z], duration: 2000 }
      ],
      dialogue: [
        { character: 'player', text: "Victory!", duration: 2000 }
      ]
    }
  },
  // NEW: Fallback objects (used if GLTF fails to load)
  fallbackObjects: [
    { type: 'box', position: [x, y, z], size: [w, h, d], color: 0xcolor }
  ]
}
```

### 2. Level Loading Process

1. **GLTF Loading**: Try to load geometry from `gltfUrl`
2. **Fallback**: If GLTF fails, use `fallbackObjects` (or legacy `objects` array)
3. **Enemy Spawning**: Load enemies from `enemies` array
4. **Cinematics Setup**: Initialize cinematic triggers
5. **Level Start**: Trigger `onLevelStart` cinematic if defined

### 3. Cinematics System

**Dialogue System**:
- Shows text overlays with character names
- Supports multiple lines with custom durations
- Automatically styled UI

**Cutscene System**:
- Camera movement along defined paths
- Disable player input during cutscenes
- Combine with dialogue for story moments

**Triggers**:
- `onLevelStart` - Plays when level loads
- `onEnemyDefeat` - Plays when enemies are defeated
- `onLevelComplete` - Plays when level objectives are met

## Usage Examples

### Create GLTF Level Geometry

1. Design level in Blender
2. Name collision objects with "collision" or "collider" 
3. Export as GLTF 2.0 (.gltf + .bin)
4. Place in `src/assets/levels/`
5. Update `gltfUrl` in levelData.js

### Add Level Dialogue

```javascript
cinematics: {
  onLevelStart: {
    type: 'dialogue',
    character: 'guide',
    lines: [
      { text: "This is your first mission.", duration: 3000 },
      { text: "Be careful out there!", duration: 2500 }
    ]
  }
}
```

### Create Cutscene

```javascript
cinematics: {
  onLevelComplete: {
    type: 'cutscene',
    cameraPath: [
      { position: [10, 5, 10], lookAt: [0, 0, 0], duration: 3000 },
      { position: [0, 8, 0], lookAt: [0, 0, 0], duration: 2000 }
    ],
    dialogue: [
      { character: 'player', text: "Level complete!", duration: 2000 }
    ]
  }
}
```

## Migration Guide

### Existing Levels
- Keep existing `objects` arrays - they become `fallbackObjects`
- Add `gltfUrl` when GLTF assets are ready
- Add `cinematics` for enhanced storytelling

### Development Workflow
1. Prototype with procedural `fallbackObjects`
2. Create GLTF assets in parallel
3. Test both systems work
4. Deploy with GLTF as primary, fallback as backup

## File Structure

```
src/
├── assets/
│   ├── levels/          # NEW: GLTF level files
│   │   ├── intro.gltf
│   │   └── custom_level.gltf
├── game/
│   ├── cinematicsManager.js  # NEW: Handles dialogue/cutscenes  
│   ├── level.js         # UPDATED: GLTF loading + cinematics
│   ├── levelData.js     # UPDATED: New structure
│   └── levelManager.js  # UPDATED: Async loading
```

## Benefits

- **Artist-Friendly**: Level designers can work in familiar 3D tools
- **Rich Storytelling**: Cinematics and dialogue enhance narrative
- **Performance**: GLTF models are optimized for web delivery
- **Fallback Safety**: Always have working levels even if assets fail
- **Gradual Migration**: Update levels one at a time