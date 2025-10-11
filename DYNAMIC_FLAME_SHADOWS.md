# Dynamic Flame Shadow System

## Overview
The flame lighting system now features intelligent, dynamic shadow management that automatically enables shadows only for the flames closest to the player. This prevents GPU texture overload, eliminates shadow overlap, and creates more realistic, player-focused lighting.

## How It Works

### Static Tracking
- All `FlameParticles` instances are tracked in a static array: `FlameParticles.allFlameInstances`
- The system maintains a shared player position: `FlameParticles.playerPosition`
- Maximum shadow casters are limited to `3` simultaneous flames (configurable)

### Dynamic Shadow Assignment
1. **Player Position Update**: Every 0.5 seconds (configurable), the system recalculates which flames should cast shadows
2. **Distance Calculation**: All flames calculate their distance to the player
3. **Sorting**: Flames are sorted by proximity to the player
4. **Shadow Assignment**: Only the closest N flames (default: 3) have shadows enabled
5. **Automatic Switching**: As the player moves, shadows smoothly transition between flames

### Performance Benefits
- **GPU Texture Limit**: Never exceeds the 16 texture unit limit
- **No Overlap**: Only nearby flames cast shadows, preventing overlapping shadow artifacts
- **Smooth Updates**: 0.5-second update interval prevents performance spikes
- **Resource Efficient**: Shadow maps (512x512) are pre-configured but only active when needed

## Configuration

### Adjust Maximum Shadow Casters
```javascript
// In flameParticles.js
FlameParticles.maxShadowCasters = 3; // Change to 2, 4, or 5 based on GPU capabilities
```

### Adjust Update Frequency
```javascript
// In flameParticles.js
FlameParticles.shadowUpdateInterval = 0.5; // In seconds (lower = more responsive, higher = better performance)
```

## Technical Details

### Shadow Properties
- **Map Size**: 512x512 (optimized for performance)
- **Camera Near**: 0.5 units
- **Camera Far**: 100 units (matches light range)
- **Bias**: -0.001 (prevents shadow acne)

### Integration Points
1. **FlameParticles.js**: Core shadow management logic
2. **game.js**: Updates player position every frame via `FlameParticles.updatePlayerPosition()`
3. **Automatic Cleanup**: Flames are automatically removed from tracking when unmounted

## Current Setup
- **5 StarLight** sources with shadows (PRIMARY lighting - always on)
- **~20 FlameParticles** with dynamic shadows (SECONDARY lighting - 3 closest at a time)
- **Total Active Shadow Casters**: 5 stars + 3 flames = 8 (well under GPU limits)

## Benefits
✅ **Intelligent Shadow Distribution**: Shadows follow the player naturally
✅ **Performance Optimized**: Never exceeds GPU texture limits
✅ **No Shadow Overlap**: Clean, realistic lighting
✅ **Automatic Management**: Zero manual configuration needed
✅ **Smooth Transitions**: No jarring shadow pop-in/pop-out

## Example Behavior
```
Player near flames A, B, C, D, E:
- Flame A (distance: 5)  → ✅ Casts shadow
- Flame B (distance: 8)  → ✅ Casts shadow
- Flame C (distance: 12) → ✅ Casts shadow
- Flame D (distance: 20) → ❌ No shadow
- Flame E (distance: 35) → ❌ No shadow

Player moves closer to D:
- Flame D (distance: 6)  → ✅ Casts shadow (now closest)
- Flame A (distance: 10) → ✅ Casts shadow
- Flame B (distance: 15) → ✅ Casts shadow
- Flame C (distance: 18) → ❌ No shadow (now furthest)
- Flame E (distance: 30) → ❌ No shadow
```

## Future Enhancements
- Add priority system for important flames (e.g., quest objectives)
- Implement smooth shadow intensity fade-in/fade-out
- Adjust max shadow casters based on GPU capabilities detection
