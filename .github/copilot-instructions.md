# CS Platformer v2 - AI Coding Instructions

## Architecture Overview

This is a **Three.js-based 3D platformer** with dual editor system and modular component architecture. The codebase follows ES6 modules with a clear separation between game logic, editing tools, and content creation.

### Core System Boundaries

- **Game Core** (`src/game/`): Main game loop, player physics, collision detection
- **Editor Systems**: Dual editors - in-game (`src/game/editor/`) and standalone (`src/editor/`)
- **Component Systems**: Enemies, Lights, UI components with mount/unmount lifecycle
- **Asset Pipeline**: GLTF models, JSON level data, Three.js scene management
- **Cinematics System**: `CinematicsManager` handles dialogue and cutscenes

## Critical Workflows

### Development Commands
```bash
npm run dev      # Vite dev server (localhost:5173 for game, /editor.html for editor)  
npm run build    # Production build
npm run preview  # Preview built version
```

### Debugging Patterns
- `window.__GAME__` exposes game instance to console
- `window.toggleCollisionDebug()` toggles collision visualization wireframes
- Level editor accessible via 'E' key in-game or standalone at `/editor.html`
- Cinematics debugging: `CinematicsManager.isPlaying` indicates active cutscenes

## Key Architectural Patterns

### Component Lifecycle Pattern
All game components (lights, enemies, UI) follow mount/unmount pattern:
```javascript
// Standard component structure
export class MyComponent extends ComponentBase {
  mount(scene) { /* Add to scene */ }
  unmount(scene) { /* Clean up from scene */ }  
  update(delta) { /* Per-frame updates */ }
}
```

### Collision System Architecture
- **Custom Box3-based collision** (not physics engine)
- **Axis-separation resolution**: X, Z, then Y movement resolution
- Ground detection via `_airTime` and `_groundGrace` timing
- Debug wireframes via `ColliderHelper` class

### Level Data Structure
Levels are stored in `src/game/levelData.js` with hybrid GLTF + procedural schema:
```javascript
{
  id: 'level_name',
  name: 'Display Name',
  gltfUrl: 'src/assets/levels/level.gltf', // Primary geometry from GLTF
  startPosition: [x, y, z],
  lights: ['BasicLights'], // Component names from lights/index.js
  ui: ['hud'],             // UI component names  
  enemies: [{ type: 'walker', position: [x,y,z], patrolPoints: [...] }],
  cinematics: {            // Level-specific cutscenes and dialogue
    onLevelStart: { type: 'dialogue', character: 'narrator', lines: [...] },
    onEnemyDefeat: { type: 'cutscene', cameraPath: [...], dialogue: [...] }
  },
  fallbackObjects: [       // Procedural geometry if GLTF fails
    { type: 'box', position: [x,y,z], size: [w,h,d], color: 0xcolor }
  ]
}
```

### Camera System
Three camera modes with pointer lock integration:
- **ThirdPersonCamera**: Default, follows player with mouse look
- **FirstPersonCamera**: FPS view attached to player
- **FreeCamera**: WASD fly-cam for debugging/editing

Camera switching automatically handles pointer lock acquisition/release and pause menu transitions.

## Project-Specific Conventions

### File Organization
- `src/game/enemies/`: Enemy classes extend `EnemyBase` with GLTF model loading
- `src/game/lights/`: Light components registered in `lights/index.js`
- `src/game/components/`: UI components for HUD, minimap, objectives
- Editor tools separated: in-game vs standalone with different capabilities

### Asset Loading Patterns
- **Level GLTF**: Primary level geometry loaded from `src/assets/levels/` with automatic collision detection
- **Character GLTF**: Enemy/player models with bbox centering and scaling  
- **Animations**: Three.js AnimationMixer with named actions (idle, walk, run, attack)
- **Cinematics**: Level-specific dialogue and cutscenes via `CinematicsManager`
- **Fallback System**: Procedural geometry when GLTF assets fail to load
- **Async Level Loading**: `Level.create()` static factory pattern for GLTF + fallback loading

### Input Handling
`InputManager` class with:
- Keyboard: `keys[e.code]` boolean tracking
- Mouse: Automatic pointer lock detection with `mouseDelta` accumulation
- State management: `enabled` flag for pause/resume scenarios

### Editor Integration
- **In-game editor**: Toggle with 'E', limited functionality, integrated with game loop
- **Standalone editor**: Full-featured, independent Three.js scene, extensive UI panel
- **Level export**: Multiple formats (JSON, levelData.js) with object merging utilities
- **Pointer Lock Management**: Automatic acquisition for 3rd/1st person, pause menu on Esc

## Critical Integration Points

### Enemy-Level Communication
Enemies receive patrol points from level data and register with `EnemyManager` for centralized updates. GLTF model loading is async with bbox calculation for collision setup.

### Light-Scene Integration  
Lights registered in `lights/index.js` are dynamically instantiated by `LightManager` based on level `lights` array. Custom lighting requires both component creation and registration.

### UI-Game State Binding
UI components subscribe to game state changes via props system. `UIManager` handles component lifecycle synchronized with level loading/unloading.

### Collision-Movement Pipeline
Movement resolution in `collisionSystem.js` operates on Box3 arrays converted from scene meshes. Ground detection affects jump mechanics and animation state transitions.