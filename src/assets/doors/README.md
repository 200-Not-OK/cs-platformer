# Doors System

A modular door system for 3D games built with Three.js and Cannon.js physics.

## Features

- **Door Types**: Choose between 'basic' (procedural geometry) and 'model' (3D model) doors
- **Swinging Doors**: Doors that rotate around a hinge pole
- **Physics Collision**: Dynamic collision detection during door animation
- **Passcode Protection**: Optional passcode system (only required for opening)
- **Visual Design**: Detailed door geometry with panels, stiles, and handle
- **3D Model Support**: Replace procedural geometry with GLTF models
- **Modular Architecture**: Easy to extend with new door types

## Dependencies

- **Three.js**: For 3D rendering and scene management
- **Cannon.js**: For physics simulation (`cannon-es` package)
- **ColliderHelper**: From `../colliderHelper.js` for debug visualization

## Portability

This doors folder can be copied to other Three.js/Cannon.js projects. Just ensure the dependencies are available:

1. Copy the entire `doors/` folder
2. Ensure `ColliderHelper` is available (or modify DoorBase.js to make it optional)
3. Update import paths if needed

## Usage

### Basic Setup

```javascript
import { DoorManager } from './doors/DoorManager.js';

// Create door manager
const doorManager = new DoorManager(scene, physicsWorld);

// Spawn a basic procedural door (default type)
const basicDoor = doorManager.spawn('basic', {
  position: [0, 0, 8],
  width: 2,        // door width
  height: 4,       // door height  
  depth: 0.2,      // door thickness
  color: 0x8B4513,
  passcode: '123', // optional
  interactionDistance: 5
});

// Spawn a model door with 3D model
const modelDoor = doorManager.spawn('model', {
  position: [5, 0, 8],
  width: 2,           // target width for model scaling
  height: 4,          // target height for model scaling
  depth: 0.2,         // target depth for model scaling
  modelUrl: 'src/assets/models/door.glb', // required for 'model' type
  modelScale: [1, 1, 1], // additional scaling factors
  swingDirection: 'right',
  passcode: '456'
});

// Or use the legacy size array format
const door2 = doorManager.spawn('basic', {
  position: [10, 0, 8],
  size: [2, 4, 0.2], // [width, height, depth]
  color: 0x8B4513
});

// Update doors each frame
doorManager.update(delta);

// Handle player interaction (shows UI automatically if needed)
const interacted = doorManager.interactWithClosestDoor(playerPosition);
```

### Simplified Integration

The doors system handles everything automatically:

1. **Free Closing**: Doors can always be closed without passcode
2. **Passcode on Open**: Passcode UI appears only when opening locked doors
3. **Automatic UI**: No need to manage passcode input externally
4. **Collision**: Physics bodies update during door animation

### Door Configuration Options

- `type`: String - Door type: 'basic' (default procedural geometry) or 'model' (requires modelUrl)
- `position`: [x, y, z] - Door position in world space
- `width`: Number - Door width (alternative to size array)
- `height`: Number - Door height (alternative to size array)  
- `depth`: Number - Door thickness/depth (alternative to size array)
- `size`: [width, height, depth] - Legacy size array format
- `color`: Hex color value for door material (ignored for 'model' type)
- `passcode`: String - Optional passcode for locked doors
- `openAngle`: Number - Rotation angle in radians (default: π/2)
- `openSpeed`: Number - Rotation speed in radians/second (default: 2)
- `interactionDistance`: Number - Max distance for interaction (default: 5)
- `modelUrl`: String - Path to GLTF/GLB model file (required for 'model' type)
- `modelScale`: [x, y, z] - Additional scale factors for model (default: [1,1,1])
- `swingDirection`: String - 'left', 'right', 'forward', or 'backward' (default: 'right')

### Door Types

- **`'basic'` (default)**: Uses procedural geometry with panels, stiles, rails, and handle. Customize appearance with `color` parameter.
- **`'model'`**: Loads a 3D model from `modelUrl`. Requires `modelUrl` parameter. Model is automatically scaled to match `width`, `height`, `depth`. `color` parameter is ignored.

**Examples:**

```javascript
// Basic procedural door
{ type: 'basic', position: [0, 0, 8], width: 2, height: 4, depth: 0.2, color: 0x8B4513 }

// Model door
{ type: 'model', position: [5, 0, 8], width: 2, height: 4, depth: 0.2, 
  modelUrl: 'src/assets/models/door.glb', modelScale: [1, 1, 1] }
```

### Using 3D Models

For doors with custom 3D models, use `type: 'model'` and provide a `modelUrl`:

```javascript
const modelDoor = doorManager.spawn('model', {
  position: [0, 0, 8],
  width: 2,           // Target width for automatic scaling
  height: 4,          // Target height for automatic scaling
  depth: 0.2,         // Target depth for automatic scaling
  modelUrl: 'src/assets/models/fancy_door.glb', // Required for 'model' type
  modelScale: [1, 1, 1], // Additional scaling factors
  swingDirection: 'right',
  passcode: '123'
});
```

**Model Requirements:**
- Model should be centered at origin (0,0,0) in your 3D modeling software
- Door should face positive Z direction when closed
- Model will be automatically scaled to match `width`, `height`, `depth`
- Hinge pole is created procedurally on the correct side based on `swingDirection`
- All door functionality (physics, interaction, passcode) works identically

**Fallback Behavior:**
- If model fails to load, system falls back to procedural geometry
- Original `width`, `height`, `depth` dimensions are preserved

## Architecture

### DoorBase
Base class for all door types. Handles:
- Visual geometry creation
- Physics body management
- Animation (open/close)
- Collision updates during animation

### DoorManager
Manages multiple doors and provides:
- Door spawning and registration
- Update loop management
- Interaction detection
- Debug visualization toggles

## Extending the System

### Adding New Door Types

1. Create a new door class extending `DoorBase`
2. Override methods as needed (geometry, animation, etc.)
3. Register the new type in `DoorManager.typeRegistry`

```javascript
import { DoorBase } from './DoorBase.js';

export class SlidingDoor extends DoorBase {
  // Custom sliding animation instead of rotation
  open() {
    // Implement sliding logic
  }

  close() {
    // Implement sliding logic
  }
}

// Register in DoorManager
this.typeRegistry.sliding = SlidingDoor;
```

### Custom Door Geometries

Override `_createDoorGeometry()` in your door class to create custom visual designs.

## Passcode System

- Passcodes are only required when **opening** doors (when `door.isOpen === false`)
- Closing doors is always free
- Passcode UI should be handled by the game/application layer
- Doors store passcode as a simple string property

## Physics Integration

- Doors use kinematic physics bodies when closed/static
- During animation, physics bodies are recreated each frame
- Collision detection works from both sides of the door
- Physics bodies are automatically cleaned up on disposal

## Debug Features

- `toggleHelperVisible()`: Shows/hides collision box visualization
- Physics debug integration through `ColliderHelper`

## File Structure

```
doors/
├── DoorBase.js              # Base door class with physics and animation
├── DoorManager.js           # Door management and spawning
├── DoorInteractionHandler.js # Handles passcode UI and interactions
├── PasscodeInput.js         # UI component for passcode entry
└── README.md               # This documentation
```