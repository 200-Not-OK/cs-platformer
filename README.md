# CS Platformer v2 - Developer Guide

A comprehensive Three.js-based 3D platformer with modular architecture, external level editing, and cinematic systems. This guide covers all game systems and how to create new content.

## Table of Contents
- [Quick Start](#quick-start)
- [System Architecture Overview](#system-architecture-overview)
- [Enemy System](#enemy-system)
- [Lighting System](#lighting-system)
- [UI System](#ui-system)
- [Cinematics & Dialogue System](#cinematics--dialogue-system)
- [Level System](#level-system)
- [External Level Editor](#external-level-editor)
- [Creating New Levels](#creating-new-levels)
- [Development Workflow](#development-workflow)

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Modern web browser with WebGL support

### Installation & Setup
```bash
# Clone the repository
git clone <repository-url>
cd cs-platformerv2

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access Points
- **Game**: `http://localhost:5173` - Play the game
- **Level Editor**: `http://localhost:5173/editor.html` - Edit levels

### Project Structure
```
src/
├── main.js                    # Game entry point
├── editor/                    # External level editor
│   ├── StandaloneLevelEditor.js  # Full-featured editor
│   └── standalone.js          # Editor initialization
├── game/                      # Core game systems
│   ├── game.js               # Main game controller
│   ├── levelData.js          # Level definitions
│   ├── cinematicsManager.js  # Cutscenes & dialogue
│   ├── enemies/              # Enemy AI system
│   ├── lights/               # Lighting components
│   ├── components/           # UI components
│   └── ...                   # Other game systems
└── assets/                   # GLTF models and textures
    ├── levels/               # Level geometry files
    ├── low_poly_male/        # Character models
    └── ...
```

## System Architecture Overview

CS Platformer v2 follows a **modular component architecture** with clear separation of concerns:

- **Game Core**: Main game loop, player physics, collision detection
- **Level System**: Data-driven GLTF + JSON hybrid approach with fallback geometry
- **Component Systems**: Enemies, lights, UI with mount/unmount lifecycle
- **Cinematics**: Dialogue and cutscene management
- **External Editor**: Standalone editing tool for level content creation

### Key Design Patterns

**Component Lifecycle**: All game components follow a consistent mount/unmount pattern:
```javascript
class MyComponent {
  mount(scene) { /* Add to scene */ }
  unmount(scene) { /* Clean up */ }
  update(delta) { /* Per-frame updates */ }
}
```

**Data-Driven Architecture**: Levels are defined in `levelData.js` with both GLTF geometry and procedural fallbacks, allowing rapid iteration and reliable loading.

## Enemy System

The enemy system provides AI-driven characters with patrol behaviors, animations, and player interaction.

### Enemy Architecture

**Base Class**: All enemies extend `EnemyBase` which provides:
- GLTF model loading with automatic bbox calculation
- Physics integration (gravity, collision)
- Animation system (idle, walk, run, attack)
- Health and damage systems
- Patrol point navigation

### Enemy Types

#### Walker Enemy
- **Behavior**: Ground-based patrol between waypoints
- **Movement**: Simple linear patrolling with turn-around at endpoints
- **Usage**: Basic guards, simple obstacles

#### Runner Enemy  
- **Behavior**: Fast ground movement with chase mechanics
- **Movement**: Higher speed, longer chase range
- **Usage**: Aggressive pursuers, dynamic threats

#### Jumper Enemy
- **Behavior**: Stationary with periodic jumping attacks
- **Movement**: Jumps at intervals, can reach elevated positions
- **Usage**: Area denial, vertical threat

#### Flyer Enemy
- **Behavior**: 3D aerial patrol with smooth curves
- **Movement**: Ignores gravity, follows 3D waypoint paths
- **Usage**: Aerial surveillance, hard-to-reach positions

### Creating Custom Enemies

1. **Extend EnemyBase**:
```javascript
import { EnemyBase } from './EnemyBase.js';

export class CustomEnemy extends EnemyBase {
  constructor(scene, options) {
    super(scene, options);
    this.customProperty = options.customValue ?? 0;
  }
  
  update(delta, platforms, player) {
    super.update(delta, platforms, player);
    // Custom behavior logic
  }
}
```

2. **Register in EnemyManager**:
```javascript
// In game/EnemyManager.js
import { CustomEnemy } from './enemies/CustomEnemy.js';

const enemyTypes = {
  // ... existing types
  custom: CustomEnemy
};
```

3. **Use in Level Data**:
```javascript
enemies: [
  { 
    type: 'custom', 
    position: [x, y, z], 
    customValue: 42,
    // ... other options
  }
]
```

### Enemy Configuration

Each enemy in `levelData.js` supports:
```javascript
{
  type: 'walker',           // Enemy type
  position: [x, y, z],      // Starting position
  modelUrl: 'path/to/model.gltf',  // 3D model
  patrolPoints: [[x,y,z,waitTime], ...],  // Patrol route
  speed: 2.4,               // Movement speed
  chaseRange: 5,            // Player detection range
  jumpInterval: 1.8,        // For jumper type
  jumpStrength: 5.5         // Jump force
}
```

## Lighting System

The lighting system provides modular, reusable lighting setups that can be mixed and matched per level.

### Lighting Architecture

**Component-Based**: Each light type is a self-contained component that can be mounted/unmounted from scenes.

**Registration System**: Lights are registered in `lights/index.js` and referenced by name in level data.

### Built-in Light Types

#### BasicLights
- **Components**: Directional light + ambient light
- **Usage**: General scene illumination
- **Options**: `color`, `intensity`, `direction`, `ambientColor`, `ambientIntensity`

#### PointPulse  
- **Components**: Animated point light with pulsing intensity
- **Usage**: Dynamic focal points, atmosphere
- **Options**: `color`, `intensity`, `position`, `pulseSpeed`, `pulseRange`

#### HemisphereFill
- **Components**: Hemisphere light for outdoor scenes
- **Usage**: Sky/ground lighting simulation
- **Options**: `skyColor`, `groundColor`, `intensity`

### Creating Custom Lights

1. **Create Light Component**:
```javascript
import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class CustomLight extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.light = null;
  }

  mount(scene) {
    this.light = new THREE.SpotLight(
      this.props.color ?? 0xffffff,
      this.props.intensity ?? 1
    );
    // Configure light properties
    scene.add(this.light);
    this._mounted = true;
  }

  unmount(scene) {
    if (this.light) scene.remove(this.light);
    this.light = null;
    this._mounted = false;
  }

  update(delta) {
    // Animation logic
  }
}
```

2. **Register Light**:
```javascript
// In lights/index.js
export { CustomLight } from './customLight.js';
```

3. **Use in Levels**:
```javascript
lights: ['BasicLights', 'CustomLight']
```

## UI System

The UI system provides modular, game-state-aware interface components.

### UI Architecture

**Component-Based**: UI elements extend `UIComponent` base class
**Manager System**: `UIManager` handles component lifecycle and updates
**Props System**: Components receive and react to game state changes

### Built-in UI Components

#### HUD (Heads-Up Display)
- **Purpose**: Show player health, stats, info
- **Features**: Auto-updating health display, game state integration
- **Styling**: Positioned overlay with system fonts

#### Minimap
- **Purpose**: Top-down level overview with player position
- **Features**: Real-time player tracking, level geometry representation

#### Menu
- **Purpose**: Pause menu, settings, navigation
- **Features**: Game pause integration, settings persistence

#### Objectives
- **Purpose**: Mission objectives, quest tracking
- **Features**: Dynamic objective updates, completion tracking

### Creating Custom UI Components

1. **Extend UIComponent**:
```javascript
import { UIComponent } from '../uiComponent.js';

export class CustomUI extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'custom-ui';
    this._createElements();
  }

  _createElements() {
    this.display = document.createElement('div');
    this.display.textContent = 'Custom UI';
    this.root.appendChild(this.display);
  }

  setProps(props) {
    super.setProps(props);
    // React to prop changes
  }

  update(delta, gameState) {
    // Update based on game state
  }
}
```

2. **Register Component**:
```javascript
// In components/index.js or ui/index.js
export { CustomUI } from './customUI.js';
```

3. **Use in Levels**:
```javascript
ui: ['hud', 'CustomUI']
```

### UI Styling

Components use inline styles for isolation but can be styled with CSS:
```css
.custom-ui {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  font-family: system-ui;
}
```

## Cinematics & Dialogue System

The cinematics system handles cutscenes, dialogue sequences, and narrative elements.

### Cinematics Architecture

**Event-Driven**: Cinematics are triggered by level events (start, enemy defeat, etc.)
**Type-Based**: Two main types - dialogue and cutscenes
**Non-Blocking**: Cinematics can run while maintaining game state

### Cinematic Types

#### Dialogue
Shows text-based conversations with timing control:
```javascript
{
  type: 'dialogue',
  character: 'narrator',
  lines: [
    { text: "Welcome to the level!", duration: 3000 },
    { text: "Use WASD to move.", duration: 4000 }
  ]
}
```

#### Cutscene
Camera movement with synchronized dialogue:
```javascript
{
  type: 'cutscene',
  cameraPath: [
    { position: [10, 5, 10], lookAt: [0, 0, 0], duration: 2000 }
  ],
  dialogue: [
    { character: 'player', text: "Amazing view!", duration: 2000 }
  ]
}
```

### Cinematic Triggers

Cinematics are defined per-level and triggered by events:

```javascript
cinematics: {
  onLevelStart: { /* cinematic definition */ },
  onEnemyDefeat: { /* cinematic definition */ },
  onPlayerDeath: { /* cinematic definition */ },
  onLevelComplete: { /* cinematic definition */ }
}
```

### Creating Custom Cinematics

1. **Define in Level Data**:
```javascript
cinematics: {
  customTrigger: {
    type: 'dialogue',
    character: 'guide',
    lines: [
      { text: "You found the secret!", duration: 2500 }
    ]
  }
}
```

2. **Trigger from Game Code**:
```javascript
game.cinematicsManager.playCinematic('customTrigger');
```

### Dialogue UI Integration

The cinematics manager automatically creates dialogue UI:
- Text display with character names
- Timed progression through lines
- Skip functionality for testing
- Pause/resume game integration

## Level System

The level system combines GLTF 3D models with JSON data for comprehensive level definition.

### Level Architecture

**Hybrid Approach**: 
- GLTF files provide detailed 3D geometry and textures
- JSON data defines gameplay elements (enemies, lights, cinematics)
- Fallback system ensures levels always load

**Data-Driven**: All levels defined in `levelData.js` with consistent schema

### Level Definition Schema

```javascript
{
  id: 'level_name',                    // Unique identifier
  name: 'Display Name',                // Human-readable name
  gltfUrl: 'src/assets/levels/level.gltf',  // 3D geometry
  startPosition: [x, y, z],            // Player spawn point
  
  // Gameplay elements
  enemies: [/* enemy definitions */],
  lights: ['BasicLights'],             // Light component names
  ui: ['hud', 'minimap'],             // UI component names
  
  // Narrative elements
  cinematics: {
    onLevelStart: {/* cinematic */}
  },
  
  // Fallback geometry (if GLTF fails)
  fallbackObjects: [
    { type: 'box', position: [x,y,z], size: [w,h,d], color: 0xcolor }
  ]
}
```

### Level Loading Process

1. **GLTF Loading**: Primary geometry loaded from specified file
2. **Collision Generation**: Automatic collision mesh generation from GLTF
3. **Fallback Handling**: If GLTF fails, procedural geometry is created
4. **Component Initialization**: Enemies, lights, UI mounted to scene
5. **Cinematics Setup**: Event handlers registered for cutscenes

### Level Management

**LevelManager**: Handles level switching and progression
```javascript
// Switch to specific level
game.levelManager.loadLevel(levelIndex);

// Next level in sequence  
game.levelManager.nextLevel();

// Get current level data
const currentLevel = game.levelManager.getCurrentLevel();
```

## External Level Editor

The external level editor is a standalone tool for creating and editing game levels.

### Editor Architecture

**Standalone Application**: Runs independently at `/editor.html`
**Level-Focused**: Specialized for enemies, lighting, and patrol points only
**GLTF Integration**: Loads and displays level geometry from game files
**Save System**: Exports changes back to `levelData.js`

### Editor Features

#### Level Management
- Load any level from `levelData.js`
- Switch between levels within editor
- Preview levels with full textures and lighting

#### Enemy Editing
- Place enemies of all types (walker, runner, jumper, flyer)
- Edit enemy properties (position, rotation, speed, chase range)
- Create and modify patrol routes with visual connections
- Preview enemy behavior paths

#### Lighting System
- Add/remove light components
- Adjust light properties (color, intensity, position)
- Live preview of lighting changes
- Multiple light types support

#### Camera Controls
- **WASD Movement**: Move on X/Z plane
- **Right-Click + Drag**: Rotate camera view
- **Scroll Wheel**: Zoom in/out (inverted for natural feel)
- **Smart Positioning**: Auto-focus on level geometry when loading

#### Selection System
- Click to select enemies, lights, or patrol points
- Property panel shows editable values
- Direct numerical input for precise positioning
- Visual selection indicators

### Editor Workflow

1. **Open Editor**: Navigate to `http://localhost:5173/editor.html`
2. **Select Level**: Use level dropdown to load desired level
3. **Edit Content**: 
   - Select mode (Enemy, Light, Patrol, Select)
   - Click to place new items or select existing ones
   - Use property panel to fine-tune values
4. **Save Changes**: Export modified data back to `levelData.js`
5. **Test in Game**: Switch to main game to test changes

### Editor UI Components

#### Mode Selector
- **Enemy Mode**: Place and edit enemy characters
- **Light Mode**: Add and configure lighting
- **Patrol Mode**: Create enemy patrol routes
- **Select Mode**: Default mode for selecting and editing existing items

#### Properties Panel
- **Position**: X, Y, Z coordinates with direct input
- **Rotation**: Euler angles for object orientation  
- **Type-Specific**: Enemy speed, light intensity, etc.
- **Patrol Points**: For enemies, editable waypoint list

#### Level Controls
- **Level Dropdown**: Switch between available levels
- **Save Button**: Export changes to levelData.js
- **Reset Button**: Reload level from saved data

## Creating New Levels

This section guides you through creating your first custom level from scratch.

### Step 1: Create GLTF Geometry (Optional)

If you have 3D modeling skills, create level geometry in Blender/Maya:

1. **Model Requirements**:
   - Reasonable polygon count for web performance
   - Proper UV mapping for textures
   - Logical object hierarchy
   - Collision-appropriate geometry

2. **Export Settings**:
   - Format: GLTF 2.0 (.gltf + .bin)
   - Include textures and materials
   - Apply transforms before export
   - Embed textures or keep separate files

3. **File Placement**:
   - Save to `src/assets/levels/your_level.gltf`
   - Include associated .bin and texture files

### Step 2: Define Level Data

Add your level to `src/game/levelData.js`:

```javascript
export const levels = [
  // ... existing levels
  {
    id: 'my_custom_level',
    name: 'My Custom Level',
    gltfUrl: 'src/assets/levels/my_level.gltf', // Optional
    startPosition: [0, 5, 0],
    
    // Basic setup
    ui: ['hud', 'minimap'],
    lights: ['BasicLights'],
    enemies: [],
    
    // Fallback geometry (always include)
    fallbackObjects: [
      { type: 'box', position: [0, 0, 0], size: [20, 1, 20], color: 0x6b8e23 }
    ]
  }
];
```

### Step 3: Test Basic Level

1. **Start Development Server**: `npm run dev`
2. **Access Game**: `http://localhost:5173`
3. **Switch to Level**: Press 'N' key to cycle to your level
4. **Verify Loading**: Check that fallback geometry appears

### Step 4: Use External Editor

1. **Open Editor**: `http://localhost:5173/editor.html`
2. **Select Your Level**: Use dropdown to load your level
3. **Add Content**:
   - Switch to Enemy mode and place some enemies
   - Add patrol points by clicking in Patrol mode
   - Experiment with lighting in Light mode
4. **Save Changes**: Use Save button to export to levelData.js

### Step 5: Add Cinematics

Enhance your level with narrative elements:

```javascript
{
  // ... level definition
  cinematics: {
    onLevelStart: {
      type: 'dialogue',
      character: 'narrator',
      lines: [
        { text: "Welcome to my custom level!", duration: 3000 },
        { text: "Defeat all enemies to proceed.", duration: 4000 }
      ]
    }
  }
}
```

### Step 6: Advanced Features

#### Custom Enemy Configurations
```javascript
enemies: [
  {
    type: 'walker',
    position: [5, 2, 5],
    speed: 1.5,           // Slower than default
    chaseRange: 8,        // Longer detection range
    health: 15,           // More health
    patrolPoints: [[5,2,5,1], [10,2,5,1], [5,2,10,1]]
  }
]
```

#### Advanced Lighting
```javascript
lights: ['BasicLights', 'PointPulse', 'HemisphereFill']
```

#### Multiple UI Components
```javascript
ui: ['hud', 'minimap', 'objectives']
```

### Step 7: Testing and Iteration

1. **Playtest Frequently**: Test your level regularly in the main game
2. **Use Editor Preview**: Preview changes without leaving the editor
3. **Adjust Difficulty**: Fine-tune enemy placement and patrol routes
4. **Visual Polish**: Experiment with lighting combinations
5. **Narrative Integration**: Add cinematics for key moments

## Development Workflow

### Daily Development

1. **Start Services**: `npm run dev`
2. **Game Testing**: `http://localhost:5173` 
3. **Level Editing**: `http://localhost:5173/editor.html`
4. **Code Changes**: Edit source files (hot reload enabled)

### Debugging Features

#### In-Game Debug Keys
- **C**: Cycle camera modes (Third Person → First Person → Free Camera)
- **H**: Toggle collision wireframes
- **N**: Next level in sequence
- **Escape**: Pause menu

#### Debug Access
- **Console Access**: `window.__GAME__` exposes game instance
- **Collision Debug**: `window.toggleCollisionDebug()`
- **Cinematics State**: `CinematicsManager.isPlaying`

#### Common Debug Tasks
```javascript
// In browser console
window.__GAME__.levelManager.loadLevel(0);  // Load specific level
window.__GAME__.player.health = 100;        // Restore health
window.__GAME__.showColliders = true;       // Show collision boxes
```

### Performance Considerations

#### Asset Optimization
- **GLTF Files**: Keep under 10MB, use compressed textures
- **Enemy Count**: Limit to 10-15 active enemies per level
- **Lighting**: Avoid excessive dynamic lights

#### Code Optimization
- **Component Cleanup**: Always implement unmount() methods
- **Memory Management**: Remove event listeners in cleanup
- **Update Loops**: Minimize per-frame calculations

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to web server
```

### Extending the Engine

#### Adding New Enemy Types
1. Create class extending `EnemyBase`
2. Register in `EnemyManager`
3. Add to external editor's enemy types
4. Test with various level configurations

#### Adding New Light Components
1. Create class extending `LightComponent`
2. Export from `lights/index.js`
3. Add to editor's light types
4. Document usage and properties

#### Adding New UI Components
1. Create class extending `UIComponent`
2. Register in UI system
3. Add to level data schema
4. Style and integrate with game state

This comprehensive architecture supports rapid development of new content while maintaining code quality and performance. The modular design allows developers to focus on specific systems without breaking others.