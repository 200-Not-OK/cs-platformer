# CS Platformer v2 - Developer Guide

Welcome to the CS Platformer v2 development environment! This comprehensive guide will help you understand the game architecture, use the level editor, create custom enemies, design lighting, and build your own levels.

> **🆕 NEW: GLTF Level System + Cinematics**  
> The level system now supports GLTF-based geometry and cinematics! See [LEVEL_SYSTEM_UPDATE.md](LEVEL_SYSTEM_UPDATE.md) for details.

## Table of Contents
- [Quick Start](#quick-start)
- [Project Architecture](#project-architecture)
- [Level Editor Guide](#level-editor-guide)
- [Lighting System](#lighting-system)
- [UI System](#ui-system)
- [Enemy System](#enemy-system)
- [Creating Your First Level](#creating-your-first-level)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser with WebGL support

### Installation & Setup
1. Clone or download this repository
2. Open a terminal in the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173` to play the game
6. Open `http://localhost:5173/editor.html` to use the standalone level editor

### Files Structure
```
src/
├── main.js                 # Game entry point
├── assets/
│   └── level.json         # Current level data
├── game/                  # Core game systems
│   ├── game.js           # Main game class
│   ├── player.js         # Player controller
│   ├── enemies/          # Enemy types
│   ├── lights/           # Lighting components
│   ├── components/       # UI components
│   └── editor/           # In-game level editor
└── editor/               # Standalone level editor
```

## Project Architecture

### Core Systems

**Game Loop (game.js)**
- Manages the main game loop with delta time
- Handles camera switching (Third Person, First Person, Free Camera)
- Controls pause/resume functionality
- Integrates all subsystems (physics, rendering, UI, enemies)

**Physics & Collision**
- Built on Three.js with custom collision detection
- Support for boxes, slopes, and complex geometry
- Ground detection and movement resolution
- Debug visualization available (toggle with `window.toggleCollisionDebug()`)

**Asset Loading**
- GLTF model loading for characters and objects
- Texture and material management
- Animation system with mixer support

## Level Editor Guide

The platformer includes two level editors:

### 1. In-Game Editor (Press 'E' during gameplay)
- Integrated into the main game
- Real-time editing while playing
- Access via the 'E' key during gameplay

### 2. Standalone Editor (editor.html)
- Independent editor with full scene control
- Recommended for serious level creation
- More robust tools and better performance

### Standalone Editor Controls

**Camera Movement:**
- `WASD` - Move camera
- `Mouse` - Look around (hold click and drag)
- `Mouse Wheel` - Zoom in/out
- `Shift` - Move faster

**Creation Modes (Hotkeys):**
- `Q` - Platform mode (create boxes/platforms)
- `G` - Slope mode (create ramps and stairs) 
- `F` - Wall mode (create vertical barriers)
- `R` - Walker Enemy mode
- `T` - Light mode
- `Y` - Patrol Point mode
- `E` - Select mode (edit existing objects)

**Object Manipulation:**
- `Click` - Place object or select existing object
- `Delete` - Remove selected object
- `Ctrl+C` - Copy selected object
- `Ctrl+V` - Paste copied object
- `Ctrl+Z` - Undo last action
- `Drag` - Multi-select objects (in select mode)

### Editor Interface

**Right Panel Sections:**

1. **Creation Mode** - Switch between different object types
2. **Properties Panel** - Edit selected object properties:
   - Position (X, Y, Z coordinates)
   - Scale/Size (Width, Height, Depth)
   - Rotation (Euler angles)
   - Color (for platforms and lights)
   - Type-specific properties

3. **Tools Section**:
   - **Clear All** - Remove all objects from scene
   - **Import JSON** - Load level from file
   - **Export JSON** - Save level to download
   - **Generate Level Code** - Create levelData.js format

### Creating Level Objects

**Platforms:**
- Click in scene to place a platform
- Default size: 4x1x4 units
- Adjust size in properties panel
- Change color using color picker

**Slopes/Stairs:**
- Similar to platforms but angled
- Use rotation properties to adjust angle
- Good for creating ramps and stairs

**Walls:**
- Vertical barriers
- Can be used for boundaries or obstacles
- Drag to create long walls quickly

**Enemies:**
- Place at desired spawn locations
- Set patrol points after placing enemy
- Configure behavior in properties panel

**Lights:**
- Point lights that illuminate the scene
- Adjust color, intensity, and range
- Preview lighting effects in real-time

**Patrol Points:**
- Define enemy movement paths
- Connect to specific enemies
- Create complex patrol routes

## Lighting System

The lighting system is modular and extensible, built around the `LightManager` class.

### Available Light Types

**1. Basic Lights (`BasicLights`)**
```javascript
// Ambient + Directional lighting setup
// Provides general scene illumination
```

**2. Hemisphere Fill (`HemisphereFill`)**
```javascript
// Soft ambient lighting with sky/ground colors
// Creates atmospheric lighting
```

**3. Point Pulse (`PointPulse`)**
```javascript
// Animated point light with pulsing intensity
// Good for dynamic effects and mood lighting
```

### Using Lights in Levels

In your level JSON, specify lights in the `lights` array:
```json
{
  "lights": ["BasicLights", "HemisphereFill"],
  "customLights": [
    {
      "type": "point",
      "position": [10, 5, 0],
      "color": "#ff6600",
      "intensity": 1.0,
      "range": 20
    }
  ]
}
```

### Creating Custom Light Components

1. Create a new file in `src/game/lights/`
2. Extend the `LightComponent` class:

```javascript
import { LightComponent } from '../lightComponent.js';
import * as THREE from 'three';

export class CustomLight extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.intensity = props.intensity || 1.0;
    this.color = props.color || 0xffffff;
  }

  mount(scene) {
    this.light = new THREE.PointLight(this.color, this.intensity, 100);
    this.light.position.set(...(this.props.position || [0, 10, 0]));
    scene.add(this.light);
  }

  unmount(scene) {
    if (this.light) {
      scene.remove(this.light);
      this.light = null;
    }
  }

  update(delta) {
    // Add animation or dynamic behavior
    if (this.light) {
      this.light.intensity = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
    }
  }
}
```

3. Register in `src/game/lights/index.js`:
```javascript
export { CustomLight } from './customLight.js';
```

## UI System

The UI system uses a component-based architecture with the `UIManager` class.

### Available UI Components

**HUD (`src/game/components/hud.js`)**
- Health bar
- Score display
- Game status information

**Minimap (`src/game/components/minimap.js`)**
- Top-down view of level
- Player position indicator
- Navigation aid

**Objectives (`src/game/components/objectives.js`)**
- Quest/goal display
- Progress tracking
- Mission briefings

**Menu (`src/game/components/menu.js`)**
- Pause menu
- Settings interface
- Level selection

### Creating Custom UI Components

1. Create a component extending `UIComponent`:

```javascript
import { UIComponent } from '../uiComponent.js';

export class CustomHUD extends UIComponent {
  constructor(root, props = {}) {
    super(root, props);
    this.score = 0;
  }

  mount() {
    this.root.innerHTML = `
      <div class="custom-hud" style="position: fixed; top: 20px; left: 20px; color: white;">
        <div>Score: <span id="score">0</span></div>
        <div>Level: <span id="level">1</span></div>
      </div>
    `;
    this.scoreElement = this.root.querySelector('#score');
    this.levelElement = this.root.querySelector('#level');
  }

  update(delta, gameState) {
    if (gameState.score !== this.score) {
      this.score = gameState.score;
      this.scoreElement.textContent = this.score;
    }
  }

  unmount() {
    this.root.innerHTML = '';
  }
}
```

2. Register with UIManager in your level:
```javascript
game.ui.add('customHUD', CustomHUD, { score: 0 });
```

## Enemy System

The enemy system is built around a base class with specialized behaviors.

### Available Enemy Types

**Walker Enemy (`WalkerEnemy`)**
- Ground-based movement
- Follows patrol points
- Basic collision detection

**Runner Enemy (`RunnerEnemy`)**
- Faster ground movement
- Aggressive pursuit behavior
- Jump capabilities

**Jumper Enemy (`JumperEnemy`)**
- Vertical movement patterns
- Can jump over obstacles
- Spring-like behavior

**Flyer Enemy (`FlyerEnemy`)**
- 3D movement in air
- Ignores ground collision
- Smooth flight patterns

### Creating Custom Enemy Types

1. Create a new enemy class extending `EnemyBase`:

```javascript
import { EnemyBase } from './EnemyBase.js';
import * as THREE from 'three';

export class TeleporterEnemy extends EnemyBase {
  constructor(scene, options = {}) {
    super(scene, {
      ...options,
      speed: 3,
      health: 15,
      modelUrl: '/src/assets/teleporter_model/scene.gltf'
    });
    
    this.teleportCooldown = 0;
    this.teleportRange = options.teleportRange || 10;
  }

  update(delta, player, platforms) {
    super.update(delta, player, platforms);
    
    // Custom teleport behavior
    this.teleportCooldown -= delta;
    
    if (this.teleportCooldown <= 0 && player) {
      const distanceToPlayer = this.mesh.position.distanceTo(player.mesh.position);
      
      if (distanceToPlayer > this.teleportRange) {
        this.teleportTowards(player.mesh.position);
        this.teleportCooldown = 3.0; // 3 second cooldown
      }
    }
  }

  teleportTowards(targetPosition) {
    // Teleport within range of target
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, this.mesh.position)
      .normalize();
    
    const teleportDistance = Math.random() * 5 + 3; // 3-8 units
    const newPosition = this.mesh.position.clone()
      .add(direction.multiplyScalar(teleportDistance));
    
    this.mesh.position.copy(newPosition);
    this._updateCollider();
    
    // Add teleport effect (particles, sound, etc.)
    this.createTeleportEffect();
  }

  createTeleportEffect() {
    // Add visual/audio effects for teleportation
    console.log('Teleport effect triggered!');
  }
}
```

2. Register the enemy type in `EnemyManager`:
```javascript
import { TeleporterEnemy } from './enemies/TeleporterEnemy.js';

// In your level data or enemy spawning code:
const teleporter = new TeleporterEnemy(scene, {
  position: [10, 2, 5],
  teleportRange: 15
});
```

### Enemy Behavior Patterns

**Patrol System:**
- Enemies follow predefined waypoints
- Smooth movement between points
- Customizable patrol speed and wait times

**AI States:**
- Idle - No movement, default animations
- Patrol - Following waypoint path
- Chase - Pursuing player when in range
- Attack - Combat behavior when close to player
- Return - Going back to patrol route

**Collision Handling:**
- Ground detection for walking enemies
- Wall avoidance for navigation
- Player interaction for damage/combat

## Creating Your First Level

### Step 1: Plan Your Level
Before opening the editor, sketch your level design:
- Player start position
- Platform layout and progression
- Enemy placement and patrol routes
- Lighting zones and atmosphere
- Victory conditions or objectives

### Step 2: Use the Standalone Editor
1. Open `editor.html` in your browser
2. Start with platforms (`Q` key) to create the main structure
3. Add slopes (`G` key) for ramps and variety
4. Place walls (`F` key) for boundaries
5. Add enemies (`R` key) at strategic locations
6. Set up patrol points (`Y` key) for enemy movement
7. Add lights (`T` key) for atmosphere and visibility

### Step 3: Test and Iterate
1. Export your level using "Export JSON" in the tools section
2. Replace the content in `src/assets/level.json` with your exported data
3. Refresh the main game to test your level
4. Play through and identify issues:
   - Is progression logical?
   - Are jumps possible?
   - Is lighting adequate?
   - Are enemies challenging but fair?

### Step 4: Polish and Details
1. Fine-tune platform positions and sizes
2. Adjust enemy patrol routes
3. Balance lighting for mood and gameplay
4. Add objectives using the UI system
5. Test with friends for feedback

### Level Design Best Practices

**Platform Placement:**
- Ensure all jumps are possible with default player abilities
- Create clear visual paths for progression
- Use varying heights for interesting navigation
- Leave space for combat encounters

**Enemy Placement:**
- Place enemies to create natural challenges
- Avoid unfair ambushes or impossible encounters
- Use patrol routes to create predictable patterns
- Balance enemy density with level pacing

**Lighting Design:**
- Ensure player can always see safe landing spots
- Use lighting to guide attention and create mood
- Avoid overly dark areas that frustrate gameplay
- Consider using colored lights for visual variety

**Visual Flow:**
- Create clear sight lines to objectives
- Use platform arrangement to suggest movement
- Avoid visual clutter that confuses navigation
- Maintain consistent visual themes

## Advanced Features

### Dynamic Level Elements

**Moving Platforms:**
Extend the platform system to create moving elements:
```javascript
// In your level data:
{
  "type": "movingPlatform",
  "position": [0, 5, 0],
  "size": [4, 1, 4],
  "movement": {
    "type": "linear",
    "start": [0, 5, 0],
    "end": [10, 5, 0],
    "speed": 2.0,
    "loop": true
  }
}
```

**Destructible Elements:**
Create platforms that break when stepped on:
```javascript
{
  "type": "destructiblePlatform",
  "position": [5, 3, 0],
  "size": [2, 0.5, 2],
  "health": 1,
  "respawnTime": 5.0
}
```

**Interactive Objects:**
Add switches, keys, and doors:
```javascript
{
  "type": "switch",
  "position": [8, 2, 3],
  "targets": ["door_1", "light_group_2"],
  "activationType": "proximity" // or "interact"
}
```

### Custom Animations

**Scripted Sequences:**
Create cutscenes and scripted events:
```javascript
// In your level's update loop
if (player.position.x > 50 && !this.triggeredCutscene) {
  this.triggeredCutscene = true;
  this.playEnemyRevealSequence();
}
```

**Environmental Animation:**
Animate level elements for atmosphere:
```javascript
// Floating platforms, rotating obstacles, etc.
this.rotatingPlatform.rotation.y += delta * 0.5;
```

### Performance Optimization

**Level of Detail (LOD):**
- Use simpler geometry for distant objects
- Disable animations when objects are far from player
- Implement object culling for large levels

**Batch Management:**
- Group similar objects for efficient rendering
- Use instanced meshes for repeated elements
- Optimize texture usage and material sharing

## Troubleshooting

### Common Issues

**Editor Not Loading:**
- Check browser console for JavaScript errors
- Ensure all files are served from a web server (not file://)
- Verify Three.js is loading correctly

**Levels Not Loading:**
- Validate JSON syntax in level files
- Check file paths are correct
- Verify level data structure matches expected format

**Performance Problems:**
- Reduce number of lights in scene
- Simplify enemy AI for large groups
- Use lower quality models for better performance
- Enable object culling for large levels

**Collision Issues:**
- Enable collision debug visualization
- Check platform sizes and positions
- Verify player collider dimensions
- Test with different movement speeds

### Debug Console Commands

Access these via browser developer console:
```javascript
// Toggle collision debug visualization
window.toggleCollisionDebug()

// Access game instance
window.__GAME__

// Teleport player
window.__GAME__.player.mesh.position.set(x, y, z)

// List all enemies
window.__GAME__.enemyManager.enemies

// Adjust game speed
window.__GAME__.timeScale = 0.5 // Half speed
```

### Performance Monitoring

Monitor performance in development:
```javascript
// Check frame rate
console.log('FPS:', 1 / delta);

// Monitor object counts
console.log('Scene objects:', scene.children.length);

// Memory usage (Chrome DevTools)
console.log('Memory:', performance.memory);
```

## Contributing

### Code Style
- Use ES6+ features and modules
- Follow consistent naming conventions
- Comment complex algorithms and systems
- Write clear commit messages

### Adding New Features
1. Create feature branch from main
2. Implement feature with appropriate tests
3. Update documentation
4. Submit pull request with description

### Reporting Issues
Include in bug reports:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors or warnings
- Level data if relevant

---

## Conclusion

This platformer engine provides a solid foundation for creating 3D platformer games with modern web technologies. The modular architecture makes it easy to extend with new features, while the integrated level editor allows for rapid prototyping and iteration.

Start with simple levels and gradually add complexity as you become familiar with the systems. Don't hesitate to experiment with custom enemies, lighting effects, and interactive elements to make your levels unique and engaging.

Happy level creating! 🎮