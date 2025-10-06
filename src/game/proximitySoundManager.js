import * as THREE from 'three';

/**
 * ProximitySoundManager - Handles proximity-based positional audio
 * Plays sounds when the player gets close to specific locations
 */
export class ProximitySoundManager {
  constructor(soundManager, player) {
    this.soundManager = soundManager;
    this.player = player;

    // Array of proximity sound zones
    this.zones = [];

    // Track active proximity sounds to avoid overlap
    this.activeSounds = new Map();
  }

  /**
   * Load proximity sounds from level data
   * @param {Array} proximitySounds - Array of proximity sound configurations
   */
  loadProximitySounds(proximitySounds) {
    console.log(`🔊 loadProximitySounds called with:`, proximitySounds);

    if (!proximitySounds || !Array.isArray(proximitySounds)) {
      console.warn(`⚠️ No proximity sounds or not an array`);
      return;
    }

    // Clear existing zones
    this.zones = [];
    this.activeSounds.clear();

    // Create zones from configuration
    for (const config of proximitySounds) {
      const zone = {
        position: new THREE.Vector3(config.position[0], config.position[1], config.position[2]),
        sound: config.sound,
        radius: config.radius || 5,
        volume: config.volume || 0.5,
        fadeDistance: config.fadeDistance || 2, // Distance over which to fade in/out
        isPlaying: false,
        audio: null
      };
      this.zones.push(zone);
      console.log(`  📍 Zone ${this.zones.length}: ${zone.sound} at [${zone.position.x}, ${zone.position.y}, ${zone.position.z}], radius: ${zone.radius}`);
    }

    console.log(`✅ Loaded ${this.zones.length} proximity sound zones`);
    console.log(`🔊🔊🔊 PROXIMITY SOUNDS LOADED! You should hear torches when you get close! 🔊🔊🔊`);
  }

  /**
   * Update proximity sounds based on player position
   * Call this every frame
   */
  update() {
    if (!this.player || !this.player.body) {
      console.warn('⚠️ ProximitySoundManager: No player or player.body');
      return;
    }

    const playerPos = new THREE.Vector3(
      this.player.body.position.x,
      this.player.body.position.y,
      this.player.body.position.z
    );

    for (const zone of this.zones) {
      const distance = playerPos.distanceTo(zone.position);

      // Check if player is within range
      if (distance <= zone.radius) {
        console.log(`🎯 Player near ${zone.sound}: distance=${distance.toFixed(2)}, radius=${zone.radius}`);
      }

      if (distance <= zone.radius) {
        // Calculate volume based on distance (closer = louder)
        const fadeStart = zone.radius - zone.fadeDistance;
        let volumeMultiplier = 1.0;

        if (distance > fadeStart) {
          // Fade out as player moves away
          volumeMultiplier = 1.0 - ((distance - fadeStart) / zone.fadeDistance);
        }

        const adjustedVolume = zone.volume * volumeMultiplier;

        // Start playing if not already playing
        if (!zone.isPlaying) {
          this.playProximitySound(zone, adjustedVolume);
        } else if (zone.audio) {
          // Update volume based on distance
          zone.audio.setVolume(adjustedVolume);
        }
      } else {
        // Stop playing if out of range
        if (zone.isPlaying) {
          this.stopProximitySound(zone);
        }
      }
    }
  }

  /**
   * Start playing a proximity sound
   */
  playProximitySound(zone, volume) {
    console.log(`🎵 Attempting to play proximity sound: ${zone.sound}`);
    console.log(`   Available SFX:`, Object.keys(this.soundManager.sfx));
    console.log(`   Available Ambient:`, Object.keys(this.soundManager.ambient));

    // Try to find sound in sfx first, then ambient
    let sound = this.soundManager.sfx[zone.sound] || this.soundManager.ambient[zone.sound];

    if (!sound) {
      console.warn(`❌ Proximity sound not found: ${zone.sound}`);
      return;
    }

    // Clone the sound for this zone
    const audio = sound.clone();
    audio.setLoop(true);
    audio.setVolume(volume);
    audio.play();

    zone.audio = audio;
    zone.isPlaying = true;

    console.log(`🔊 Started proximity sound: ${zone.sound} at volume ${volume.toFixed(2)}`);
  }

  /**
   * Stop playing a proximity sound
   */
  stopProximitySound(zone) {
    if (zone.audio) {
      zone.audio.stop();
      zone.audio.disconnect();
      zone.audio = null;
    }
    zone.isPlaying = false;
  }

  /**
   * Clean up all proximity sounds
   */
  dispose() {
    for (const zone of this.zones) {
      this.stopProximitySound(zone);
    }
    this.zones = [];
    this.activeSounds.clear();
  }
}