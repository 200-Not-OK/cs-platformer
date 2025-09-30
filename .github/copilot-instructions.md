# CS Platformer v2 - AI Coding Instructions

## Architecture Overview

This is a **Three.js-based 3D platformer** with **Cannon.js physics engine**, dual editor system, and modular component architecture. The codebase follows ES6 modules with clear separation between visual rendering (Three.js) and physics simulation (Cannon.js).

### Core System Boundaries

- **Game Core** (`src/game/`): Main game loop, physics integration, player controls
- **Physics Layer** (`src/game/physics/PhysicsWorld.js`): Cannon.js physics world with materials and contact handling
- **Visual Layer**: Three.js scene management, GLTF loading, and rendering
- **Editor Systems**: Dual editors - in-game (`src/game/editor/`) and standalone (`src/editor/`)
- **Component Systems**: Enemies, Lights, UI components with mount/unmount lifecycle
- **Asset Pipeline**: GLTF models, JSON level data, physics body generation
- **Cinematics System**: Level-specific dialogue and cutscenes via `CinematicsManager`

## Critical Workflows

### Development Commands
```bash
npm run dev      # Vite dev server (localhost:5173 for game, /editor.html for editor)  
npm run build    # Production build
npm run preview  # Preview built version
```

### Physics Debugging Patterns
- `window.__GAME__` exposes game instance to console
- `window.togglePhysicsDebug()` toggles Cannon.js physics wireframes
- `physicsWorld.enableDebugRenderer()` shows Cannon.js physics bodies with green wireframes
- Player physics debugging via extensive console logging in `player.js`
- Level editor accessible via 'E' key in-game or standalone at `/editor.html`
- Press 'L' in-game to toggle physics debug visualization

## Key Architectural Patterns

### Physics-Visual Separation Pattern
The architecture maintains strict separation between physics simulation and visual representation:
```javascript
// Player class example - physics body drives visual mesh
export class Player {
  constructor(scene, physicsWorld) {
    this.scene = scene;           // Three.js scene
    this.physicsWorld = physicsWorld; // Cannon.js world
    this.mesh = new THREE.Group(); // Visual representation
    this.body = null;             // Physics body (created after model loads)
  }
  
  syncMeshWithBody() {
    // Copy position from physics to visual
    this.mesh.position.copy(this.body.position);
  }
}
```

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

### Physics System Architecture
- **Cannon.js Physics Engine**: Full rigid body dynamics with materials and contact resolution
- **Custom Materials**: Ground, player, enemy materials with specific friction/restitution
- **Model-First Physics**: Physics bodies created after GLTF model loads to match dimensions
- **Ground Detection**: Contact normal analysis (`contact.ni.y > 0.5`) for reliable ground state
- **Debug Physics**: Cannon-ES-Debugger integration for wireframe visualization

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

### Physics-Movement Integration
Player movement uses hybrid approach based on ground state:
```javascript
// Grounded: direct velocity for stable movement
if (this.isGrounded) {
  this.body.velocity.x = targetVelX;
  this.body.velocity.z = targetVelZ;
} else {
  // Airborne: forces for realistic physics
  this.body.applyForce(new CANNON.Vec3(forceX, 0, forceZ), this.body.position);
}
```

### Enemy-Level Communication
Enemies receive patrol points from level data and register with `EnemyManager` for centralized updates. GLTF model loading is async with bbox calculation for collision setup.

### Light-Scene Integration  
Lights registered in `lights/index.js` are dynamically instantiated by `LightManager` based on level `lights` array. Custom lighting requires both component creation and registration.

### UI-Game State Binding
UI components subscribe to game state changes via props system. `UIManager` handles component lifecycle synchronized with level loading/unloading.

### Physics Body Generation
Level geometry automatically generates physics bodies from GLTF meshes. Fallback procedural objects also create corresponding Cannon.js bodies for collision.