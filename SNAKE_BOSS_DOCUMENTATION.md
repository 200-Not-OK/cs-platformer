# Snake Boss Enemy Documentation

## Overview

The `SnakeBossEnemy` is a powerful boss variant of the regular snake enemy with significantly enhanced capabilities and health. It uses the Snake_Angry model from `assets/enemies/snake_boss/` and features advanced AI behaviors.

## Features

### High Health
- **500 HP** by default (vs 35 HP for regular snake)
- Customizable via `options.health` parameter
- Boss-specific red health bar that's always visible

### Enhanced AI Behaviors
- **Patrol**: Aggressive patrolling with faster movement
- **Chase**: Extended detection range (12 units vs 6 for regular snake)
- **Regular Attack**: Standard melee attacks with reduced cooldown
- **Jump Attack**: Special boss ability when enraged
- **Enrage Mode**: Activates at 30% health (150 HP), increases speed and attack rate

### Boss-Specific Animations
The boss uses all provided animations from the Snake_Angry model:
- `Snake_Idle`: Idle state animation
- `Snake_Walk`: Movement animation
- `Snake_Attack`: Standard attack animation
- `Snake_Jump`: Special jump attack animation
- `Snake_Death`: Death animation when defeated

### Enhanced Physics
- Larger collision box (3x3x3 units)
- Higher mass (5.0 vs 1.0 for regular enemies)
- Scaled up visual model (1.5x size)

## Usage

### Adding to Level Data

```javascript
{
  type: "snake_boss",
  position: [x, y, z],
  patrolPoints: [
    [x1, y1, z1],
    [x2, y2, z2],
    // ... more patrol points
  ],
  health: 500,        // Optional, defaults to 500
  speed: 2.5,         // Optional, defaults to 2.5
  chaseRange: 12.0    // Optional, defaults to 12.0
}
```

### Creating Programmatically

```javascript
import { SnakeBossEnemy } from './enemies/SnakeBossEnemy.js';

const boss = new SnakeBossEnemy(scene, physicsWorld, {
  position: [100, 2, 100],
  health: 750,  // Custom health
  speed: 3.0,   // Custom speed
  patrolPoints: [
    [100, 2, 100],
    [90, 2, 110],
    [110, 2, 120]
  ]
});
```

### Via EnemyManager

```javascript
const boss = enemyManager.spawn('snake_boss', {
  position: [100, 2, 100],
  health: 500,
  patrolPoints: [
    [100, 2, 100],
    [90, 2, 110],
    [110, 2, 120]
  ]
});
```

## Behavior States

1. **Patrol**: Moves between patrol points at moderate speed
2. **Chase**: Pursues player when within 12-unit range
3. **Attack**: Performs melee attacks when player is within 4-unit range
4. **Jump Attack**: Special enraged attack with leap and forward momentum
5. **Enraged**: Activated at 30% health - increases speed, attack rate, and unlocks jump attacks

## Combat Mechanics

### Attack Patterns
- **Normal Mode**: Single attacks with 1.5-2 second cooldown
- **Enraged Mode**: Can chain up to 3 consecutive attacks with 0.8 second intervals

### Jump Attack
- Only available when enraged
- 5-second cooldown between jump attacks
- Applies upward force (15 units) and forward momentum toward player
- 40% chance to trigger when in attack range while enraged

### Damage Values
- Normal attack: 15 damage
- Enraged attack: 25 damage

## Visual Features

### Health Bar
- Always visible (unlike regular enemies)
- Red color to indicate boss status
- Larger size (2.0 x 0.25 units)
- Changes to brighter red when enraged

### Model Scaling
- 1.5x scale applied to the Snake_Angry model
- Maintains proper collision detection with scaled physics body

## Performance Notes

- Boss enemies use more complex AI calculations
- Health bar is always rendered (no culling)
- Animation system handles 5 different animation states
- Physics simulation includes enhanced collision detection

## Integration

The boss enemy is fully integrated into the existing enemy system:
- Extends `EnemyBase` class for consistency
- Compatible with existing `EnemyManager`
- Uses standard physics materials and collision detection
- Follows component lifecycle patterns (mount/unmount)

## Example Level Implementation

The boss has been added to Level 2 with the following configuration:
- Position: [100, 2, 100]
- 5 patrol points in a strategic pattern
- Default health (500 HP)
- Standard speed and chase range

Players can encounter the boss by navigating to the designated area in Level 2.