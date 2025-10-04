# Sound System Documentation

## Overview

A comprehensive audio system has been integrated into the game, providing background music, sound effects, and ambient sounds with per-level configurations.

## Architecture

### SoundManager (`src/game/soundManager.js`)

Central audio management class using Three.js Audio API:

- **Categories**: Music, SFX, Ambient
- **Volume Control**: Independent volume for each category + master volume
- **Fade Effects**: Smooth transitions between tracks
- **Mute/Unmute**: Global mute toggle
- **3D Audio**: Positional audio support via AudioListener

### Features

- **Per-level Sound Configuration**: Each level can define its own audio
- **Automatic Loading**: Sounds load when entering a level
- **Fade In/Out**: Smooth music and ambient transitions
- **Overlapping SFX**: Multiple sound effects can play simultaneously
- **Resource Cleanup**: Proper disposal when switching levels

## Usage

### 1. Add Audio Files

Place audio files in the appropriate folders:
```
src/assets/audio/
├── music/       # Background music (loop)
├── sfx/         # Sound effects (one-shot)
└── ambient/     # Ambient sounds (loop)
```

### 2. Configure Level Sounds

Add a `sounds` object to your level in `src/game/levelData.js`:

```javascript
{
  id: 'my_level',
  name: 'My Level',
  // ... other level config

  sounds: {
    // Define music tracks
    music: {
      'main-theme': {
        url: 'src/assets/audio/music/adventure.mp3',
        loop: true
      },
      'boss-theme': {
        url: 'src/assets/audio/music/boss-fight.mp3',
        loop: true
      }
    },

    // Define sound effects
    sfx: {
      'jump': {
        url: 'src/assets/audio/sfx/jump.wav',
        loop: false
      },
      'attack': {
        url: 'src/assets/audio/sfx/sword-swing.wav',
        loop: false
      },
      'hit': {
        url: 'src/assets/audio/sfx/hit.wav',
        loop: false
      },
      'collect': {
        url: 'src/assets/audio/sfx/coin.wav',
        loop: false
      },
      'door': {
        url: 'src/assets/audio/sfx/door-open.wav',
        loop: false
      }
    },

    // Define ambient sounds
    ambient: {
      'forest': {
        url: 'src/assets/audio/ambient/forest.mp3',
        loop: true
      },
      'wind': {
        url: 'src/assets/audio/ambient/wind.mp3',
        loop: true
      }
    },

    // Auto-play on level start
    playMusic: 'main-theme',
    playAmbient: 'forest'
  }
}
```

### 3. Trigger Sounds in Code

Access the sound manager through the game instance:

```javascript
// Play sound effects
game.soundManager.playSFX('jump');
game.soundManager.playSFX('attack');

// Change music with fade
game.soundManager.playMusic('boss-theme', 2000); // 2s fade in

// Play ambient with fade
game.soundManager.playAmbient('wind', 3000); // 3s fade in

// Stop sounds with fade
game.soundManager.stopMusic(1000); // 1s fade out
game.soundManager.stopAmbient(2000); // 2s fade out
```

### 4. Volume Controls

```javascript
// Set category volumes (0.0 to 1.0)
game.soundManager.setVolume('master', 0.8);
game.soundManager.setVolume('music', 0.6);
game.soundManager.setVolume('sfx', 0.9);
game.soundManager.setVolume('ambient', 0.4);

// Toggle mute
game.soundManager.toggleMute();

// Check volumes
console.log(game.soundManager.volumes);
```

## Integration Points

### Player Actions
Add to `src/game/player.js`:
```javascript
// Jump sound
if (this.canJump) {
  this.game.soundManager.playSFX('jump');
}
```

### Combat System
Add to `src/game/combatSystem.js`:
```javascript
// Attack sound
performAttack() {
  this.game.soundManager.playSFX('attack');
  // ... attack logic
}

// Hit sound
onEnemyHit() {
  this.game.soundManager.playSFX('hit');
}
```

### Collectibles
Add to `src/game/CollectiblesManager.js`:
```javascript
// Pickup sound
onCollect() {
  this.game.soundManager.playSFX('collect');
}
```

### Doors
Add to `src/assets/doors/DoorManager.js`:
```javascript
// Door open sound
openDoor() {
  this.game.soundManager.playSFX('door');
}
```

## Audio File Recommendations

### Format Guidelines
- **Music**: MP3 (128-192 kbps) for smaller file size
- **Ambient**: MP3 or OGG (96-128 kbps)
- **SFX**: WAV (uncompressed) for instant playback, short duration

### File Size Tips
- Keep music tracks under 5MB
- Ambient loops: 1-3 minutes duration
- SFX: Under 1 second when possible

### Looping
- Use seamless loops for music and ambient
- Ensure loop points align perfectly to avoid clicks
- Use tools like Audacity to create seamless loops

## Free Audio Resources

### Music
- [Incompetech](https://incompetech.com/) - Royalty-free music
- [FreePD](https://freepd.com/) - Public domain music
- [OpenGameArt](https://opengameart.org/) - Game music

### Sound Effects
- [Freesound](https://freesound.org/) - Community sound library
- [Zapsplat](https://www.zapsplat.com/) - Free SFX
- [SoundBible](http://soundbible.com/) - Free sound clips

### Ambient
- [Ambient Mixer](https://www.ambient-mixer.com/) - Atmospheric sounds
- [SoundJay](https://www.soundjay.com/) - Nature sounds

## Advanced Features

### Dynamic Music Switching
```javascript
// Switch music based on game state
if (enemiesNearby) {
  game.soundManager.playMusic('combat-theme');
} else {
  game.soundManager.playMusic('exploration-theme');
}
```

### Context-Aware Ambient
```javascript
// Change ambient based on location
if (playerInCave) {
  game.soundManager.playAmbient('cave-drips');
} else if (playerInForest) {
  game.soundManager.playAmbient('forest-birds');
}
```

### Volume Ramping
```javascript
// Gradually adjust volume
const targetVolume = 0.3;
const duration = 2000; // 2 seconds
game.soundManager._fadeVolume(
  game.soundManager.currentMusic,
  targetVolume,
  duration
);
```

## Debugging

Console commands for testing:
```javascript
// Check loaded sounds
console.log(window.__GAME__.soundManager.music);
console.log(window.__GAME__.soundManager.sfx);
console.log(window.__GAME__.soundManager.ambient);

// Test playback
window.__GAME__.soundManager.playSFX('jump');
window.__GAME__.soundManager.playMusic('main-theme');

// Volume testing
window.__GAME__.soundManager.setVolume('music', 0.2);
```

## Best Practices

1. **Preload Critical Sounds**: Load important SFX during level init
2. **Use Appropriate Formats**: WAV for SFX, MP3 for music
3. **Optimize File Sizes**: Compress audio without quality loss
4. **Test Volume Levels**: Balance all sounds for good mix
5. **Provide User Controls**: Add volume sliders to settings menu
6. **Graceful Degradation**: Handle missing audio files
7. **Clean Up Resources**: Dispose sounds when switching levels

## Future Enhancements

- [ ] 3D positional audio for environment sounds
- [ ] Audio ducking (lower music when SFX plays)
- [ ] Reverb zones for different environments
- [ ] User-configurable audio settings UI
- [ ] Audio compression for web optimization
- [ ] Spatial audio for enemy sounds
- [ ] Dynamic music layers (add instruments based on intensity)