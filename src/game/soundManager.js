import * as THREE from 'three';

/**
 * SoundManager - Centralized audio management system
 * Handles background music, sound effects, and ambient sounds
 */
export class SoundManager {
  constructor(camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    // Audio categories
    this.music = {}; // Background music tracks
    this.sfx = {}; // Sound effects
    this.ambient = {}; // Ambient loops

    // Volume controls
    this.volumes = {
      master: 1.0,
      music: 0.1,  // Reduced from 0.2 to 0.1 (10% volume)
      sfx: 0.9,
      ambient: 0.2
    };

    // Currently playing tracks
    this.currentMusic = null;
    this.currentAmbient = null;

    // Mute state
    this.muted = false;
  }

  /**
   * Load a sound file
   * @param {string} category - 'music', 'sfx', or 'ambient'
   * @param {string} name - Identifier for the sound
   * @param {string} url - Path to audio file
   * @param {boolean} loop - Whether to loop (default: false)
   */
  load(category, name, url, loop = false) {
    return new Promise((resolve, reject) => {
      const audioLoader = new THREE.AudioLoader();
      const audio = new THREE.Audio(this.listener);

      audioLoader.load(
        url,
        (buffer) => {
          audio.setBuffer(buffer);
          audio.setLoop(loop);
          audio.setVolume(this._getCategoryVolume(category));

          this[category][name] = audio;
          console.log(`✅ Loaded ${category}: ${name} from ${url}`);
          resolve(audio);
        },
        undefined,
        (error) => {
          console.error(`❌ Failed to load ${category} sound: ${name} from ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load multiple sounds from configuration
   * @param {Object} config - Sound configuration object
   */
  async loadSounds(config) {
    const promises = [];

    // Load music
    if (config.music) {
      for (const [name, data] of Object.entries(config.music)) {
        promises.push(this.load('music', name, data.url, data.loop ?? true));
      }
    }

    // Load sound effects
    if (config.sfx) {
      for (const [name, data] of Object.entries(config.sfx)) {
        promises.push(this.load('sfx', name, data.url, data.loop ?? false));
      }
    }

    // Load ambient sounds
    if (config.ambient) {
      for (const [name, data] of Object.entries(config.ambient)) {
        promises.push(this.load('ambient', name, data.url, data.loop ?? true));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Play background music
   * @param {string} name - Music track name
   * @param {number} fadeInTime - Fade in duration in ms
   */
  playMusic(name, fadeInTime = 1000) {
    if (!this.music[name]) {
      console.warn(`🎵 Music track not found: ${name}. Available:`, Object.keys(this.music));
      return;
    }

    // Stop current music if playing
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.stopMusic(1000);
    }

    const track = this.music[name];
    this.currentMusic = track;

    if (this.muted) {
      console.log(`🔇 Music muted, not playing: ${name}`);
      return;
    }

    console.log(`🎵 Playing music: ${name}, volume: ${this._getCategoryVolume('music')}`);

    // Set volume BEFORE playing
    if (fadeInTime > 0) {
      track.setVolume(0);
    } else {
      track.setVolume(this._getCategoryVolume('music'));
    }

    track.play();

    // Debug: Check if music is actually playing
    setTimeout(() => {
      console.log(`🎵 Music playback status:`, {
        isPlaying: track.isPlaying,
        hasBuffer: !!track.buffer,
        volume: track.getVolume(),
        duration: track.buffer ? track.buffer.duration : 'no buffer'
      });
    }, 100);

    // Fade in after starting playback
    if (fadeInTime > 0) {
      this._fadeVolume(track, this._getCategoryVolume('music'), fadeInTime);
    }
  }

  /**
   * Stop background music
   * @param {number} fadeOutTime - Fade out duration in ms
   */
  stopMusic(fadeOutTime = 1000) {
    if (!this.currentMusic) return;

    const track = this.currentMusic;

    if (fadeOutTime > 0 && track.isPlaying) {
      this._fadeVolume(track, 0, fadeOutTime, () => {
        track.stop();
        this.currentMusic = null;
      });
    } else {
      track.stop();
      this.currentMusic = null;
    }
  }

  /**
   * Play a sound effect
   * @param {string} name - SFX name
   * @param {number} volume - Volume override (0-1)
   */
  playSFX(name, volume = null) {
    if (!this.sfx[name]) {
      console.warn(`Sound effect not found: ${name}`);
      return;
    }

    if (this.muted) return;

    const sound = this.sfx[name];

    // Clone for overlapping sounds
    const sfxClone = sound.clone();
    sfxClone.setVolume(volume ?? this._getCategoryVolume('sfx'));
    sfxClone.play();

    // Clean up after playing
    sfxClone.onEnded = () => {
      sfxClone.disconnect();
    };
  }

  /**
   * Play ambient sound
   * @param {string} name - Ambient sound name
   * @param {number} fadeInTime - Fade in duration in ms
   */
  playAmbient(name, fadeInTime = 2000) {
    if (!this.ambient[name]) {
      console.warn(`Ambient sound not found: ${name}`);
      return;
    }

    // Stop current ambient if playing
    if (this.currentAmbient && this.currentAmbient.isPlaying) {
      this.stopAmbient(1000);
    }

    const track = this.ambient[name];
    this.currentAmbient = track;

    if (this.muted) return;

    // Set volume BEFORE playing
    if (fadeInTime > 0) {
      track.setVolume(0);
    } else {
      track.setVolume(this._getCategoryVolume('ambient'));
    }

    track.play();

    // Fade in after starting playback
    if (fadeInTime > 0) {
      this._fadeVolume(track, this._getCategoryVolume('ambient'), fadeInTime);
    }
  }

  /**
   * Stop ambient sound
   * @param {number} fadeOutTime - Fade out duration in ms
   */
  stopAmbient(fadeOutTime = 2000) {
    if (!this.currentAmbient) return;

    const track = this.currentAmbient;

    if (fadeOutTime > 0 && track.isPlaying) {
      this._fadeVolume(track, 0, fadeOutTime, () => {
        track.stop();
        this.currentAmbient = null;
      });
    } else {
      track.stop();
      this.currentAmbient = null;
    }
  }

  /**
   * Set volume for a category
   * @param {string} category - 'master', 'music', 'sfx', or 'ambient'
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(category, volume) {
    this.volumes[category] = Math.max(0, Math.min(1, volume));

    // Update currently playing sounds
    if (category === 'master') {
      this._updateAllVolumes();
    } else if (category === 'music' && this.currentMusic) {
      this.currentMusic.setVolume(this._getCategoryVolume('music'));
    } else if (category === 'ambient' && this.currentAmbient) {
      this.currentAmbient.setVolume(this._getCategoryVolume('ambient'));
    }
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.muted = !this.muted;
    console.log('🔊 toggleMute called, new muted state:', this.muted);

    if (this.muted) {
      // Mute by setting gain to 0
      if (this.currentMusic) {
        this.currentMusic.setVolume(0);
        console.log('🔊 Muted music');
      }
      if (this.currentAmbient) {
        this.currentAmbient.setVolume(0);
        console.log('🔊 Muted ambient');
      }
      // Also mute all SFX by storing original volume
      console.log('🔊 Muted all sounds');
    } else {
      // Unmute by restoring volumes
      if (this.currentMusic) {
        this.currentMusic.setVolume(this._getCategoryVolume('music'));
        console.log('🔊 Unmuted music, volume:', this._getCategoryVolume('music'));
      }
      if (this.currentAmbient) {
        this.currentAmbient.setVolume(this._getCategoryVolume('ambient'));
        console.log('🔊 Unmuted ambient, volume:', this._getCategoryVolume('ambient'));
      }
      console.log('🔊 Unmuted all sounds');
    }
  }

  /**
   * Get effective volume for a category
   */
  _getCategoryVolume(category) {
    return this.volumes.master * (this.volumes[category] ?? 1.0);
  }

  /**
   * Update all currently playing volumes
   */
  _updateAllVolumes() {
    if (this.currentMusic) {
      this.currentMusic.setVolume(this._getCategoryVolume('music'));
    }
    if (this.currentAmbient) {
      this.currentAmbient.setVolume(this._getCategoryVolume('ambient'));
    }
  }

  /**
   * Fade volume over time
   */
  _fadeVolume(audio, targetVolume, duration, onComplete) {
    const startVolume = audio.getVolume();
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentVolume = startVolume + (targetVolume - startVolume) * progress;
      audio.setVolume(currentVolume);

      if (progress < 1) {
        requestAnimationFrame(fade);
      } else if (onComplete) {
        onComplete();
      }
    };

    fade();
  }

  /**
   * Clean up all audio resources
   */
  dispose() {
    // Stop and dispose music
    Object.values(this.music).forEach(audio => {
      if (audio.isPlaying) audio.stop();
      audio.disconnect();
    });

    // Stop and dispose sfx
    Object.values(this.sfx).forEach(audio => {
      if (audio.isPlaying) audio.stop();
      audio.disconnect();
    });

    // Stop and dispose ambient
    Object.values(this.ambient).forEach(audio => {
      if (audio.isPlaying) audio.stop();
      audio.disconnect();
    });

    this.music = {};
    this.sfx = {};
    this.ambient = {};
    this.currentMusic = null;
    this.currentAmbient = null;
  }
}