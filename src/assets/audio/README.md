# Audio Assets

This folder contains all audio files for the game.

## Folder Structure

- **music/** - Background music tracks (looped)
- **sfx/** - Sound effects (one-shot sounds)
- **ambient/** - Ambient sounds (looped environmental audio)

## Supported Formats

- MP3 (recommended for music and ambient)
- WAV (recommended for short sound effects)
- OGG (alternative format)

## Adding New Audio

1. Place your audio files in the appropriate folder
2. Update the level configuration in `src/game/levelData.js`
3. Reference the sound using relative paths from the project root

## Example Sound Configuration

```javascript
sounds: {
  music: {
    'main-theme': { url: 'src/assets/audio/music/main-theme.mp3', loop: true }
  },
  sfx: {
    'jump': { url: 'src/assets/audio/sfx/jump.wav', loop: false },
    'attack': { url: 'src/assets/audio/sfx/sword-swing.wav', loop: false },
    'collect': { url: 'src/assets/audio/sfx/coin-pickup.wav', loop: false }
  },
  ambient: {
    'wind': { url: 'src/assets/audio/ambient/wind.mp3', loop: true }
  },
  playMusic: 'main-theme',
  playAmbient: 'wind'
}
```

## Usage in Game

Access the sound manager through the game instance:

```javascript
// Play a sound effect
game.soundManager.playSFX('jump');

// Change music
game.soundManager.playMusic('boss-theme');

// Control volume
game.soundManager.setVolume('music', 0.5);
game.soundManager.setVolume('sfx', 0.8);

// Mute/unmute
game.soundManager.toggleMute();
```