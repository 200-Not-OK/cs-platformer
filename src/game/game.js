import * as THREE from 'three';
import { createSceneAndRenderer } from './scene.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { LevelManager } from './levelManager.js';
import { ThirdPersonCamera } from './thirdPersonCamera.js';
import { FreeCamera } from './freeCamera.js';
import { UIManager } from './uiManager.js';
import { HUD } from './components/hud.js';
import { Minimap } from './components/minimap.js';
import { Objectives } from './components/objectives.js';
import { SmallMenu } from './components/menu.js';
import { FPS } from './components/fps.js';
import { Crosshair } from './components/crosshair.js';
import { Collectibles } from './components/collectibles.js';
import { InteractionPrompt } from './components/interactionPrompt.js';
import { DeathMenu } from './components/deathMenu.js';
import { VoiceoverCard } from './components/voiceoverCard.js';
import { FirstPersonCamera } from './firstPersonCamera.js';
import { LightManager } from './lightManager.js';
import * as LightModules from './lights/index.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { CombatSystem } from './combatSystem.js';
import { DoorManager } from '../assets/doors/DoorManager.js';
import { CollectiblesManager } from './CollectiblesManager.js';
import { SoundManager } from './soundManager.js';
import { ProximitySoundManager } from './proximitySoundManager.js';

// OPTIONAL: if you have a levelData export, this improves level picker labelling.
// If your project doesn't export this, you can safely remove the import and the uses of LEVELS.
import { levels as LEVELS } from './levelData.js';

export class Game {
  constructor() {
    const { scene, renderer } = createSceneAndRenderer();
    this.scene = scene;
    this.renderer = renderer;

    // Initialize physics world with scene for improved collision detection
    this.physicsWorld = new PhysicsWorld(this.scene, {
      useAccurateCollision: false, // Disable Trimesh by default for more reliable collision
      debugMode: false
    });

    // Input
    this.input = new InputManager(window);

    // Level system
    this.levelManager = new LevelManager(this.scene, this.physicsWorld, this);
    this.level = null;

    // Player
    this.player = new Player(this.scene, this.physicsWorld, {
      speed: 17,
      jumpStrength: 12,
      size: [1, 1.5, 1],
      // Collider size scaling factors (optional)
      colliderWidthScale: 0.5,   // 40% of model width (default: 0.4)
      colliderHeightScale: 1,  // 90% of model height (default: 0.9)
      colliderDepthScale: 0.5,    // 40% of model depth (default: 0.4)
      game: this // Pass game reference for death handling and boss win event
    });
    // Player position will be set by loadLevel() call

    // Cameras
    this.thirdCam = new ThirdPersonCamera(this.player, this.input, window);
    this.firstCam = new FirstPersonCamera(this.player, this.input, window);
    this.freeCam = new FreeCamera(this.input, window);
    // Cache the underlying three.js camera objects so identity checks are reliable
    this.thirdCameraObject = this.thirdCam.getCamera();
    this.firstCameraObject = this.firstCam.getCamera();
    this.freeCameraObject = this.freeCam.getCamera();
    this.activeCamera = this.thirdCameraObject;
    //this.activeCamera = this.freeCameraObject;
    // Enable alwaysTrackMouse for third-person camera
    this.input.alwaysTrackMouse = true;
    
    // Skip intro/cinematic with K key
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyK' && this.cinematicLock) {
        console.log('⏭️ Skipping intro/cinematic with K key');
        this.cinematicLock = false;
        if (this.input) this.input.setEnabled(true);
        if (this.level?.cinematicsManager) {
          this.level.cinematicsManager.skipRequested = true;
        }
        // Force camera back to third person
        if (this.thirdCameraObject) {
          this.activeCamera = this.thirdCameraObject;
        }
        this.input.alwaysTrackMouse = true;
      }
    });
    
    // Request pointer lock for third-person/first-person camera when the user clicks
    // Ignore clicks originating from the pause menu so the Resume button's click
    // doesn't accidentally trigger a second request or race with the resume flow.
    window.addEventListener('click', (e) => {
      if (this.pauseMenu && this.pauseMenu.contains && this.pauseMenu.contains(e.target)) return;

      // Resume AudioContext on first user interaction (required by browsers)
      if (this.soundManager && this.soundManager.listener && this.soundManager.listener.context) {
        if (this.soundManager.listener.context.state === 'suspended') {
          this.soundManager.listener.context.resume().then(() => {
            console.log('🔊 AudioContext resumed - now playing pending audio');

            // Play any pending music/ambient/voiceover after AudioContext is resumed
            if (this._pendingMusic) {
              console.log('🔊 Playing pending music:', this._pendingMusic);
              this.soundManager.playMusic(this._pendingMusic);
              this._pendingMusic = null;
            }
            if (this._pendingAmbient) {
              console.log('🔊 Playing pending ambient:', this._pendingAmbient);
              this.soundManager.playAmbient(this._pendingAmbient);
              this._pendingAmbient = null;
            }
            if (this._pendingVoiceover) {
              console.log('🔊 Playing pending voiceover:', this._pendingVoiceover);
              const voToPlay = this._pendingVoiceover;
              this._pendingVoiceover = null;
              setTimeout(() => {
                // Play first voiceover with callback to play maze voiceover after
                this.playVoiceover(voToPlay, 15000, () => {
                  // After levelstart VO finishes, play maze VO (Level 2 only)
                  if (this.levelManager && this.levelManager.currentIndex === 1) {
                    console.log('🎤 Levelstart VO finished, playing maze VO next');
                    setTimeout(() => {
                      this.playVoiceover('vo-maze', 12000);
                    }, 2000); // 2 second pause between voiceovers
                  }
                });
              }, 500); // Small delay so VO plays after music starts
            }
          });
        }
      }

      // request pointer lock when clicking while in first or third person
      if ((this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject) && document.pointerLockElement !== document.body) {
        try {
          document.body.requestPointerLock();
        } catch (err) {
          // Some browsers may throw if the gesture was not accepted; swallow and warn
          console.warn('requestPointerLock failed:', err);
        }
      }
    });

    // When pointer lock is exited (usually via Escape), if we were in third/first person
    // we should go directly to the pause menu. Some exits are intentional (we call
    // document.exitPointerLock()); to avoid treating those as user Esc presses we
    // use a suppression flag.
    this._suppressPointerLockPause = false;
    document.addEventListener('pointerlockchange', () => {
      // Only react to lock being removed
      if (document.pointerLockElement) return;
      if (this._suppressPointerLockPause) {
        // programmatic exit; clear flag and do nothing
        this._suppressPointerLockPause = false;
        return;
      }
      // Don't show pause menu if player is dead
      if (this.playerDead) {
        return;
      }
      // If we were in first/third person, interpret the pointerlock exit as Esc -> pause
      if (this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject) {
        this.setPaused(true);
      }
    });

    // When switching to free camera, move it near player
    this._bindKeys();

    // UI manager (modular UI per-level)
    this.ui = new UIManager(document.getElementById('app'));
    // register a default HUD — actual per-level UI will be loaded by loadLevel
    this.ui.add('hud', HUD, { health: 100 });
    // Add FPS counter
    this.ui.add('fps', FPS, { showFrameTime: true });
    console.log('📊 FPS counter enabled. Press F to toggle visibility.');
    // Add crosshair for combat
    this.ui.add('crosshair', Crosshair, { visible: true });
    // Add interaction prompt for chests
    this.ui.add('interactionPrompt', InteractionPrompt, { message: 'to interact' });
    // Add voiceover card for character dialogues
    this.ui.add('voiceoverCard', VoiceoverCard, {
      characterName: 'Pravesh',
      position: 'left'
    });

    // Combat system
    this.combatSystem = new CombatSystem(this.scene, this.physicsWorld);

    // Collectibles system
    this.collectiblesManager = new CollectiblesManager(this.scene, this.physicsWorld, this);

    // Door system
    this.doorManager = new DoorManager(this.scene, this.physicsWorld, this);
    this.doorHelpersVisible = false; // Track door collision helper visibility (invisible by default)
    this.doorsUnlockedByApples = false; // Track if doors have been unlocked by apple collection

    // Lighting manager (modular per-level lights)
    this.lights = new LightManager(this.scene);

    // Sound manager (initialize with camera for 3D audio)
    this.soundManager = new SoundManager(this.thirdCameraObject);

    // Proximity sound manager (for location-based sounds like torches)
    this.proximitySoundManager = null; // Will be initialized after player is ready

    // Overlays (built on demand)
    this._victoryOverlay = null;
    this._levelPicker = null;

    // Listen for level completion (boss dispatches 'level:complete')
    window.addEventListener('level:complete', () => this._onLevelComplete());

    // Load the initial level early so subsequent code can reference `this.level`
    this._initializeLevel();

    // small world grid
    const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
    this.scene.add(grid);
    // Pause state
    this.paused = false;
    this.playerDead = false; // Flag to track if player is dead
    this.pauseMenu = document.getElementById('pauseMenu');

    // Resume button
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.addEventListener('click', (e) => {
      // prevent the click from bubbling to the global click handler which would
      // also try to request pointer lock and could race with this handler
      e.stopPropagation();
      e.preventDefault();
      this.setPaused(false);
      // After resuming, if we're in a camera mode that prefers pointer lock,
      // request it using the same user gesture (the button click). Wrap in try/catch
      // to avoid unhandled exceptions in browsers that refuse the request.
      if (this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject) {
        try {
          document.body.requestPointerLock();
        } catch (err) {
          console.warn('requestPointerLock on resume failed:', err);
        }
      }
    });

    // Setup audio controls
    this._setupAudioControls();

    // loop
    this.last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
    
    // Log available key bindings for user reference
    setTimeout(() => {
      console.log(`
🎮 === GAME CONTROLS ===
🎥 C - Cycle cameras (Free → Third → First)
🔄 N - Level Picker
🔍 M - Toggle physics debug visualization  
🚪 H - Toggle door collision helpers
⚔️  B - Toggle combat debug visuals
� E - Interact with chests and doors
📊 F - Toggle FPS counter
⏸️  ESC - Pause/Resume game
========================`);
    }, 1000); // Delay to ensure other startup messages are shown first
  }

  // Initialize the first level asynchronously
  async _initializeLevel() {
    await this.loadLevel(0);
    // Apply lights for current level   
    this.applyLevelLights(this.level?.data);

    // Show level picker shortly after load-in (as requested)
    setTimeout(() => this._showLevelPicker(), 400);
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      // Always allow toggling pause via Escape, but not when player is dead
      if (code === 'Escape' && !this.playerDead) {
        this.setPaused(!this.paused);
        return;
      }
      // When paused ignore other keys
      if (this.paused) return;

      if (code === 'KeyC') {
        // cycle cameras: free -> third -> first -> free
        if (this.activeCamera === this.freeCameraObject) {
          // free -> third
          this.activeCamera = this.thirdCameraObject;
          this.input.alwaysTrackMouse = true;
          document.body.requestPointerLock();
          this.player.mesh.visible = true;
        } else if (this.activeCamera === this.thirdCameraObject) {
          // third -> first
          this.activeCamera = this.firstCameraObject;
          this.input.alwaysTrackMouse = true;
          document.body.requestPointerLock();
          this.player.mesh.visible = false; // hide model in first-person to avoid clipping
        } else {
          // first (or other) -> free
          this.freeCam.moveNearPlayer(this.player);
          this.activeCamera = this.freeCameraObject;
          this.input.alwaysTrackMouse = false;
          if (document.pointerLockElement) { this._suppressPointerLockPause = true; document.exitPointerLock(); }
          this.player.mesh.visible = true; // restore visibility
        }
        // ensure player is active when in third- or first-person
        // (handled each frame in _loop by checking activeCamera)
      } else if (code === 'KeyN') {
        // Open the Level Picker instead of jumping to next level
        this._showLevelPicker();
      } else if (code === 'KeyM') {
        // toggle physics debug visualization
        this.physicsWorld.enableDebugRenderer(!this.physicsWorld.isDebugEnabled());
      } else if (code === 'KeyH') {
        // toggle door collision helpers (green boxes around doors)
        if (this.doorManager) {
          this.doorHelpersVisible = !this.doorHelpersVisible;
          this.doorManager.toggleColliders(this.doorHelpersVisible);
        }
      } else if (code === 'KeyB') {
        // toggle combat debug visuals
        if (this.combatSystem) {
          this.combatSystem.toggleDebug();
        }
      } else if (code === 'KeyE') {
        // interact with doors or chests
        let interacted = false;
        
        // First try chest interaction
        if (this.collectiblesManager && this.collectiblesManager.handleInteraction) {
          interacted = this.collectiblesManager.handleInteraction();
        }
        
        // If no chest interaction, try door interaction
        if (!interacted && this.doorManager) {
          const playerPos = this.player.getPosition();
          this.doorManager.interactWithClosestDoor(playerPos);
        }
      } else if (code === 'KeyF') {
        // toggle FPS counter visibility
        this.toggleFPSCounter();
      } else if (code === 'KeyQ') {
        // use health potion
        this.useHealthPotion();
      } else if (code === 'KeyJ') {
        // Debug: damage player for testing death system
        if (this.player && this.player.takeDamage) {
          this.player.takeDamage(50);
          console.log('🩸 Debug: Player damaged for testing');
        }
      } else if (code === 'KeyP') {
        // Debug: manually play music
        console.log('🔊 DEBUG: Manual music trigger (P key pressed)');
        console.log('🔊 AudioContext state:', this.soundManager.listener.context.state);
        console.log('🔊 Pending music:', this._pendingMusic);
        console.log('🔊 Current music:', this.soundManager.currentMusic);
        console.log('🔊 Available music tracks:', Object.keys(this.soundManager.music));

        // Try to resume AudioContext
        if (this.soundManager.listener.context.state === 'suspended') {
          this.soundManager.listener.context.resume().then(() => {
            console.log('🔊 AudioContext resumed via P key');
          });
        }

        // Try to play pending or intro music
        if (this._pendingMusic) {
          console.log('🔊 Playing pending music:', this._pendingMusic);
          this.soundManager.playMusic(this._pendingMusic, 0); // No fade for debugging
        } else if (this.soundManager.music['intro-theme']) {
          console.log('🔊 Playing intro-theme directly');
          this.soundManager.playMusic('intro-theme', 0); // No fade for debugging
        } else if (this.soundManager.music['level2-theme']) {
          console.log('🔊 Playing level2-theme directly');
          this.soundManager.playMusic('level2-theme', 0); // No fade for debugging
        }
      }
    });
  }

  toggleFPSCounter() {
    const fpsComponent = this.ui.get('fps');
    if (fpsComponent) {
      // Toggle visibility by modifying the display style
      const currentDisplay = fpsComponent.root.style.display;
      const isCurrentlyVisible = currentDisplay !== 'none';
      
      fpsComponent.root.style.display = isCurrentlyVisible ? 'none' : 'block';
      
      const newState = isCurrentlyVisible ? 'hidden' : 'visible';
      console.log(`📊 FPS counter is now ${newState} (Press F to toggle)`);
      
      // Store the state for consistency
      fpsComponent.isVisible = !isCurrentlyVisible;
    } else {
      console.warn('⚠️ FPS component not found. Cannot toggle visibility.');
    }
  }

  useHealthPotion() {
    // Get the UI component that manages potions
    const collectiblesUI = this.ui.get('collectibles');
    const hudUI = this.ui.get('hud');
    
    let potionUsed = false;
    let potionAvailable = false;
    
    // Try collectibles UI first (for levels that use collectibles component)
    if (collectiblesUI && collectiblesUI.useHealthPotion) {
      potionAvailable = collectiblesUI.collectibles.potions.count > 0;
      if (potionAvailable) {
        potionUsed = collectiblesUI.useHealthPotion();
      }
    }
    // Fall back to HUD UI (for levels that use HUD component)
    else if (hudUI && hudUI.useHealthPotion) {
      potionAvailable = hudUI.healthPotions > 0;
      if (potionAvailable) {
        potionUsed = hudUI.useHealthPotion();
      }
    }
    
    if (potionUsed) {
      // Play potion sound
      if (this.soundManager && this.soundManager.sfx['potion']) {
        this.soundManager.playSFX('potion', 0.8);
      }

      // Heal the player
      if (this.player && this.player.heal) {
        this.player.heal(25); // Heal 25 HP
      }
      console.log('🧪 Used health potion! +25 HP');
    } else if (!potionAvailable) {
      console.log('❌ No health potions available!');
    } else {
      console.log('⚠️ Could not use health potion');
    }
  }

  playVoiceover(voName, duration = 5000, onComplete = null) {
    console.log(`🎤 playVoiceover called with: ${voName}`);
    console.log(`🎤 soundManager exists?`, !!this.soundManager);
    console.log(`🎤 soundManager.sfx exists?`, !!this.soundManager?.sfx);
    console.log(`🎤 soundManager.sfx[${voName}] exists?`, !!this.soundManager?.sfx?.[voName]);

    // Play voiceover and show the card
    if (this.soundManager && this.soundManager.sfx[voName]) {
      console.log(`🎤 Playing voiceover: ${voName}`);
      this.soundManager.playSFX(voName, 1.0);

      // Show voiceover card
      const voCard = this.ui.get('voiceoverCard');
      console.log(`🎤 voCard exists?`, !!voCard);
      if (voCard) {
        console.log(`🎤 Showing voiceover card for Pravesh`);
        voCard.show('Pravesh');
        voCard.startSpeaking();

        // Hide after duration
        setTimeout(() => {
          console.log(`🎤 Stopping voiceover card speaking animation`);
          voCard.stopSpeaking();
          setTimeout(() => {
            console.log(`🎤 Hiding voiceover card`);
            voCard.hide();

            // Call completion callback if provided
            if (onComplete && typeof onComplete === 'function') {
              console.log(`🎤 Calling voiceover completion callback`);
              onComplete();
            }
          }, 500);
        }, duration);
      } else {
        console.error(`🎤 ERROR: voiceoverCard component not found!`);
        // Still call callback even if card fails
        if (onComplete && typeof onComplete === 'function') {
          setTimeout(() => onComplete(), duration);
        }
      }
    } else {
      console.error(`🎤 ERROR: Voiceover ${voName} not found in soundManager.sfx`);
      console.log(`🎤 Available SFX:`, Object.keys(this.soundManager?.sfx || {}));
    }
  }

  showDeathMenu() {
    console.log('💀 Showing death menu');

    // Play fail voiceover if available
    if (this.soundManager && this.soundManager.sfx['vo-fail']) {
      console.log('🎤 Playing fail voiceover');
      // Stop music and play fail VO
      if (this.soundManager.currentMusic) {
        this.soundManager.stopMusic();
      }
      this.playVoiceover('vo-fail', 10000); // 10 seconds for fail voiceover
    }

    // Set death state flag
    this.playerDead = true;

    // Create death menu if it doesn't exist
    if (!this.ui.get('deathMenu')) {
      this.ui.add('deathMenu', DeathMenu, {
        onRespawn: () => this.respawnPlayer()
      });
    }

    // Show the death menu
    const deathMenu = this.ui.get('deathMenu');
    if (deathMenu && deathMenu.show) {
      deathMenu.show();
    }

    // Pause the game without showing pause menu
    this.paused = true;

    // Disable input handling when paused
    if (this.input && this.input.setEnabled) {
      this.input.setEnabled(false);
    }

    // Exit pointer lock if active
    if (document.pointerLockElement) {
      this._suppressPointerLockPause = true;
      document.exitPointerLock();
    }
  }

  respawnPlayer() {
    console.log('🔄 Respawning player');
    
    // Clear death state flag
    this.playerDead = false;
    
    // Hide death menu
    const deathMenu = this.ui.get('deathMenu');
    if (deathMenu && deathMenu.hide) {
      deathMenu.hide();
    }
    
    // Reload the current level
    if (this.levelManager && this.levelManager.getCurrentLevelIndex !== undefined) {
      const currentIndex = this.levelManager.getCurrentLevelIndex();
      this.loadLevel(currentIndex);
    }
    
    // Reset player health
    this.player.health = this.player.maxHealth;
    
    // Update HUD
    const hudUI = this.ui.get('hud');
    if (hudUI && hudUI.setProps) {
      hudUI.setProps({ 
        health: this.player.health,
        maxHealth: this.player.maxHealth 
      });
    }
    
    // Unpause the game
    this.paused = false;
    
    // Re-enable input handling
    if (this.input && this.input.setEnabled) {
      this.input.setEnabled(true);
    }
  }

  _loop() {
    requestAnimationFrame(this._loop);
    const now = performance.now();
    let delta = (now - this.last) / 1000;
    this.last = now;
    // clamp delta
    delta = Math.min(delta, 1 / 20);

    // If paused: skip updates but still render the current frame.
    if (this.paused) {
      this.renderer.render(this.scene, this.activeCamera);
      return;
    }

    // Step physics simulation
    this.physicsWorld.step(delta);

    // update level (updates colliders/helpers and enemies) - only if level is loaded
    if (this.level && this.level.update) {
      this.level.update(delta, this.player, this.level.getPlatforms());
    }

    // update UI each frame with some context (player model and simple state)
    if (this.ui) {
      const ctx = {
        player: { 
          health: this.player.health ?? 100,
          maxHealth: this.player.maxHealth ?? 100 
        },
        playerModel: this.player.mesh,
        enemies: this.level ? this.level.getEnemies() : [],
        collectibles: this.collectiblesManager ? this.collectiblesManager.getAllCollectibles() : []
      };
      this.ui.update(delta, ctx);
    }

    // determine camera orientation for movement mapping
    let camOrientation, playerActive;
    if (this.activeCamera === this.thirdCam.getCamera()) {
      this.thirdCam.update();
      camOrientation = this.thirdCam.getCameraOrientation();
      playerActive = true;
    } else if (this.activeCamera === this.firstCam.getCamera()) {
      this.firstCam.update();
      camOrientation = this.firstCam.getCameraOrientation();
      playerActive = true;
    } else {
      this.freeCam.update(delta);
      camOrientation = this.freeCam.getOrientation();
      playerActive = false;
    }

    // Update crosshair visibility based on camera mode
    const crosshair = this.ui.get('crosshair');
    if (crosshair) {
      crosshair.setProps({ visible: true }); // Always visible for debugging
    }

    // update player (movement read from input manager)
    const platforms = this.level ? this.level.getPlatforms() : [];
    this.player.update(delta, this.input, camOrientation, platforms, playerActive);

    // Handle combat input (left-click to attack)
    if (playerActive && this.input.wasLeftClicked() && this.combatSystem.canAttack()) {
      if (this.player.performAttack()) {
        // Set enemies for combat system if level has them
        if (this.level && this.level.getEnemies) {
          this.combatSystem.setEnemies(this.level.getEnemies());
        }
        // Perform the sword swing attack (better for horizontal sword animation)
        this.combatSystem.performSwordSwing(this.player, this.activeCamera);
      }
    }

    // Update combat system
    this.combatSystem.update(delta);

    // Check for final snake remaining (Level 2 only)
    if (this.levelManager && this.levelManager.currentIndex === 1) { // Level 2
      this.checkFinalSnake();
    }

    // Update door system
    this.doorManager.update(delta, this.player.getPosition());

    // Update collectibles system
    this.collectiblesManager.update(delta);

    // Update proximity sounds
    if (this.proximitySoundManager) {
      this.proximitySoundManager.update();
    } else {
      // Debug: Log once per second if proximity sound manager doesn't exist
      if (!this._proximityDebugTime) this._proximityDebugTime = 0;
      this._proximityDebugTime += delta;
      if (this._proximityDebugTime > 1000) {
        console.log('⚠️ No proximitySoundManager in update loop');
        this._proximityDebugTime = 0;
      }
    }
    // Check apple collection status for Level 2 door unlocking
    this.checkAppleCollectionForDoors();

    // update lights (allow dynamic lights to animate)
    if (this.lights) this.lights.update(delta);

    // render
    this.renderer.render(this.scene, this.activeCamera);
  }

  // Load level by index and swap UI based on level metadata
  // Load level by index and swap UI based on level metadata
  async loadLevel(index) {
    if (this.level) this.level.dispose();

    // Preserve debug state before disposing old physics world
    const wasDebugEnabled = this.physicsWorld.isDebugEnabled();

    // Clear existing physics bodies and recreate physics world with improved collision detection
    this.physicsWorld.dispose();
    this.physicsWorld = new PhysicsWorld(this.scene, {
      useAccurateCollision: false, // Disable Trimesh by default for more reliable collision
      debugMode: wasDebugEnabled   // Preserve debug state across level transitions
    });

    // Update references that depend on physics world
    this.player.physicsWorld = this.physicsWorld;
    this.combatSystem.physicsWorld = this.physicsWorld;
    this.doorManager.physicsWorld = this.physicsWorld;
    this.collectiblesManager.updatePhysicsWorld(this.physicsWorld);
    this.doorManager.dispose();
    this.doorManager = new DoorManager(this.scene, this.physicsWorld, this);
    this.doorsUnlockedByApples = false;

    if (this.player.originalModelSize) {
      this.player.createPhysicsBody(this.player.originalModelSize);
    }

    this.levelManager.physicsWorld = this.physicsWorld;
    this.level = await this.levelManager.loadIndex(index);

    // Position player at start position from level data
    const start = this.level.data.startPosition;
    this.player.setPosition(new THREE.Vector3(...start));
    console.log(`🏃 Player spawned at position: [${start.join(', ')}] for level: ${this.level.data.name}`);

    // swap UI + lights first
    this.applyLevelUI(this.level.data);
    this.applyLevelLights(this.level.data);

    // IMPORTANT:
    // If an onLevelStart cinematic exists, we want the cinematic to control VO timing.
    const hasLevelStartCinematic =
      !!(this.level?.data?.cinematics && (this.level.data.cinematics.onLevelStart || Array.isArray(this.level.data.cinematics)));

    // Load sounds. If cinematic exists, defer VO to it.
    await this.applyLevelSounds(this.level.data, { deferVoiceoverToCinematic: hasLevelStartCinematic });

    // Spawn collectibles AFTER sounds/UI are ready
    this.collectiblesManager.cleanup();
    await this.collectiblesManager.spawnCollectiblesForLevel(this.level.data);

    // Doors (Level 2 example)
    if (index === 1) {
      this.doorManager.spawn('model', {
        position: [25.9, 0, -4.5],
        preset: 'wooden',
        width: 6,
        height: 6.5,
        depth: 0.5,
        type: 'model',
        modelUrl: 'src/assets/doors/level2_boss_door.glb',
        swingDirection: 'forward left',
        interactionDistance: 10,
        autoOpenOnApproach: false,
        locked: true,
        requiredKey: 'all_apples'
      });
      this.doorManager.spawn('basic', {
        position: [56.5, 0, -9.4],
        preset: 'wooden',
        width: 4.7,
        height: 6.5,
        depth: 0.5,
        type: 'model',
        modelUrl: 'src/assets/doors/level2_boss_door.glb',
        swingDirection: 'forward left',
        initialRotation: 90,
        interactionDistance: 10,
        autoOpenOnApproach: false,
        locked: true,
        requiredKey: 'all_apples'
      });
      this.doorManager.toggleColliders(this.doorHelpersVisible);
    }

    // Finally: trigger the cinematic (sounds are loaded and ready).
    // The cinematic's `playVO` step will start narration exactly on cue.
    this.level.triggerLevelStartCinematic(this.activeCamera, this.player);

    return this.level;
  }


  /**
   * Check if all apples have been collected and unlock doors in Level 2
   */
  checkAppleCollectionForDoors() {
    // Only check in Level 2
    if (!this.level || this.level.data.id !== 'level2') {
      return;
    }

    // Skip if doors are already unlocked
    if (this.doorsUnlockedByApples) {
      return;
    }

    // Get collectible statistics
    const stats = this.collectiblesManager.getStats();
    
    // Check if all apples have been collected
    const allApplesCollected = stats.apples.total > 0 && stats.apples.collected >= stats.apples.total;
    
    if (allApplesCollected && this.doorManager && this.doorManager.doors) {
      // Find and unlock doors that require 'all_apples'
      let doorsUnlocked = 0;
      for (const door of this.doorManager.doors) {
        if (door.locked && door.requiredKey === 'all_apples') {
          door.locked = false;
          door.autoOpenOnApproach = true; // Enable auto-open now that it's unlocked
          doorsUnlocked++;
        }
      }
      
      if (doorsUnlocked > 0) {
        this.doorsUnlockedByApples = true;
        console.log(`🔓 ${doorsUnlocked} door(s) unlocked! All ${stats.apples.total} apples collected in Level 2`);
        
        // Trigger Pravesh dialogue about mysterious door opening
        console.log('🎬 About to trigger apple collection dialogue...');
        this.triggerAppleCollectionDialogue();
      }
    }
  }

  /**
   * Trigger dialogue when all apples are collected
   */
  triggerAppleCollectionDialogue() {
    console.log('🎬 triggerAppleCollectionDialogue called!');
    
    // Simple approach: create dialogue UI directly
    this.showSimpleDialogue('Pravesh', 'Ooh, a mysterious door has opened!', 3000);
  }

  /**
   * Show a simple dialogue message
   */
  showSimpleDialogue(character, message, duration = 3000) {
    console.log(`🎬 Showing dialogue: ${character}: ${message}`);
    
    // Create dialogue element
    const dialogue = document.createElement('div');
    dialogue.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 600px;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 1000;
      animation: fadeIn 0.5s ease-in;
    `;
    
    // Add character name
    const characterElement = document.createElement('div');
    characterElement.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #ffdd44;
    `;
    characterElement.textContent = character.toUpperCase();
    
    // Add message text
    const textElement = document.createElement('div');
    textElement.style.cssText = `
      font-size: 18px;
      line-height: 1.4;
    `;
    textElement.textContent = message;
    
    // Add fade animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    dialogue.appendChild(characterElement);
    dialogue.appendChild(textElement);
    document.body.appendChild(dialogue);
    
    // Auto-hide after duration
    setTimeout(() => {
      dialogue.style.animation = 'fadeOut 0.5s ease-out';
      setTimeout(() => {
        document.body.removeChild(dialogue);
        document.head.removeChild(style);
      }, 500);
    }, duration);
    
    console.log('🎬 Dialogue displayed successfully!');
  }

  applyLevelLights(levelData) {
    if (!this.lights) return;
    // Clear existing lights
    this.lights.clear();
    const list = (levelData && levelData.lights) ? levelData.lights : null;
    if (!list) return;
    // list is array of either string keys or objects { key, props }
    for (const item of list) {
      let key, props;
      if (typeof item === 'string') { key = item; props = {}; }
      else { key = item.key; props = item.props || {}; }
      const Module = LightModules[key];
      if (!Module) {
        console.warn('Unknown light module key in level data:', key);
        continue;
      }
      this.lights.add(key, Module, props);
    }
  }

  applyLevelUI(levelData) {
    // Clear existing UI and re-add defaults according to level metadata
    if (!this.ui) return;
    
    // Store global components that should persist across levels
    const globalComponents = new Map();
    if (this.ui.get('fps')) {
      globalComponents.set('fps', this.ui.get('fps'));
    }
    if (this.ui.get('crosshair')) {
      globalComponents.set('crosshair', this.ui.get('crosshair'));
    }
    if (this.ui.get('interactionPrompt')) {
      globalComponents.set('interactionPrompt', this.ui.get('interactionPrompt'));
    }
    if (this.ui.get('voiceoverCard')) {
      globalComponents.set('voiceoverCard', this.ui.get('voiceoverCard'));
    }
    
    this.ui.clear();
    
    // Re-add global components first
    for (const [key, component] of globalComponents) {
      this.ui.components.set(key, component);
      // Re-mount the component since it was unmounted during clear
      if (component.mount) {
        component.mount();
      }
    }
    
    const uiList = (levelData && levelData.ui) ? levelData.ui : ['hud'];
    
    for (const uiItem of uiList) {
      // Handle both string format ("hud") and object format ({ type: "collectibles", config: {...} })
      let key, config;
      if (typeof uiItem === 'string') {
        key = uiItem;
        config = {};
      } else if (typeof uiItem === 'object' && uiItem.type) {
        key = uiItem.type;
        config = uiItem.config || {};
      } else {
        console.warn('Invalid UI item format in level data:', uiItem);
        continue;
      }
      
      if (key === 'hud') {
        this.ui.add('hud', HUD, { health: this.player.health ?? 100 });
      } else if (key === 'minimap') {
        const minimap = this.ui.add('minimap', Minimap, config);
        // Set level data for minimap rendering
        if (minimap && minimap.setLevelData) {
          minimap.setLevelData(levelData);
        }
      } else if (key === 'objectives') {
        this.ui.add('objectives', Objectives, { 
          items: levelData.objectives ?? ['Reach the goal'],
          ...config 
        });
      } else if (key === 'menu') {
        this.ui.add('menu', SmallMenu, { 
          onResume: () => this.setPaused(false),
          ...config 
        });
      } else if (key === 'collectibles') {
        this.ui.add('collectibles', Collectibles, config);
      } else if (key === 'fps') {
        // FPS is already added as a global component, skip
        continue;
      } else {
        console.warn('Unknown UI component type in level data:', key);
      }
    }
    
    // Set up collectibles manager references after UI is loaded
    const collectiblesUI = this.ui.get('collectibles');
    const interactionPrompt = this.ui.get('interactionPrompt');
    if (collectiblesUI) {
      this.collectiblesManager.setReferences(this.player, collectiblesUI);
    }
    if (interactionPrompt) {
      this.collectiblesManager.setInteractionPrompt(interactionPrompt);
    }
  }

  async applyLevelSounds(levelData, opts = {}) {
    const { deferVoiceoverToCinematic = false } = opts;

    console.log('🔊 applyLevelSounds for:', levelData?.name, 'deferVO:', deferVoiceoverToCinematic);

    if (!this.soundManager) {
      console.warn('⚠️ Sound manager not available!');
      return;
    }
    if (!levelData?.sounds) {
      console.warn('⚠️ No sounds config in level data!');
      // Proximity sounds still handled below if present
    }

    try {
      if (levelData?.sounds) {
        await this.soundManager.loadSounds(levelData.sounds);
        console.log('🔊 Sounds loaded OK');

        // Store what to play
        this._pendingMusic    = levelData.sounds.playMusic || null;
        this._pendingAmbient  = levelData.sounds.playAmbient || null;

        // If a cinematic will drive VO timing, do NOT set a pending VO here.
        this._pendingVoiceover = deferVoiceoverToCinematic ? null : (levelData.sounds.playVoiceover || null);

        const ctx = this.soundManager.listener.context;
        const ctxRunning = ctx && ctx.state === 'running';

        // Start music/ambient immediately if we can. (No delay!)
        if (ctxRunning) {
          if (this._pendingMusic) {
            this.soundManager.playMusic(this._pendingMusic);
            this._pendingMusic = null;
          }
          if (this._pendingAmbient) {
            this.soundManager.playAmbient(this._pendingAmbient);
            this._pendingAmbient = null;
          }
          // Only auto-play VO if not deferred to cinematic
          if (this._pendingVoiceover) {
            // No 500ms delay—start now so it doesn’t drift
            const vo = this._pendingVoiceover;
            this._pendingVoiceover = null;
            this.playVoiceover(vo, 2000);
          }
        } else {
          console.log('🔊 AudioContext suspended. Will start audio on first user click.');
        }
      }

      // Proximity sounds
      if (levelData?.proximitySounds) {
        if (!this.proximitySoundManager) {
          this.proximitySoundManager = new ProximitySoundManager(this.soundManager, this.player);
        }
        this.proximitySoundManager.loadProximitySounds(levelData.proximitySounds);
      } else if (this.proximitySoundManager) {
        // Clean up if the new level doesn't define proximity audio
        this.proximitySoundManager.dispose();
      }
    } catch (err) {
      console.error(`❌ Failed to load/apply sounds for ${levelData?.name}:`, err);
    }
  }


  checkFinalSnake() {
    if (!this.level || !this.level.getEnemies) return;

    const enemies = this.level.getEnemies();
    const aliveSnakes = enemies.filter(e => e.isAlive && e.health > 0);

    // Play rumbling when only 1 snake remains
    if (aliveSnakes.length === 1 && !this._rumblingSoundPlayed) {
      console.log('🐍 Final snake remaining! Playing rumbling sound');
      if (this.soundManager && this.soundManager.sfx['rumbling']) {
        this.soundManager.playSFX('rumbling', 0.7);
      }
      this._rumblingSoundPlayed = true; // Play only once
    }

    // Reset flag when level reloads
    if (aliveSnakes.length > 1) {
      this._rumblingSoundPlayed = false;
    }
  }

  _setupAudioControls() {
    if (!this.soundManager) return;

    // Get all audio control elements
    const masterSlider = document.getElementById('masterVolume');
    const musicSlider = document.getElementById('musicVolume');
    const sfxSlider = document.getElementById('sfxVolume');
    const ambientSlider = document.getElementById('ambientVolume');
    const muteBtn = document.getElementById('muteBtn');

    const masterValue = document.getElementById('masterValue');
    const musicValue = document.getElementById('musicValue');
    const sfxValue = document.getElementById('sfxValue');
    const ambientValue = document.getElementById('ambientValue');

    // Update volume display helper
    const updateDisplay = (slider, valueElement, value) => {
      if (slider) slider.value = value;
      if (valueElement) valueElement.textContent = `${value}%`;
    };

    // Master volume control
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.soundManager.setVolume('master', value / 100);
        updateDisplay(null, masterValue, value);
      });
    }

    // Music volume control
    if (musicSlider) {
      console.log('🔊 Music slider found, adding listener');
      musicSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        console.log('🔊 Music slider changed to:', value);
        this.soundManager.setVolume('music', value / 100);
        console.log('🔊 Current music volume after change:', this.soundManager.volumes.music);
        updateDisplay(null, musicValue, value);
      });
    } else {
      console.warn('⚠️ Music slider not found!');
    }

    // SFX volume control
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.soundManager.setVolume('sfx', value / 100);
        updateDisplay(null, sfxValue, value);
      });
    }

    // Ambient volume control
    if (ambientSlider) {
      ambientSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.soundManager.setVolume('ambient', value / 100);
        updateDisplay(null, ambientValue, value);
      });
    }

    // Mute button
    if (muteBtn) {
      console.log('🔊 Mute button found, adding click listener');
      muteBtn.addEventListener('click', (e) => {
        console.log('🔊 Mute button clicked!');
        e.stopPropagation();
        this.soundManager.toggleMute();
        const isMuted = this.soundManager.muted;
        console.log('🔊 Muted state:', isMuted);
        muteBtn.textContent = isMuted ? '🔊 Unmute All' : '🔇 Mute All';
        muteBtn.classList.toggle('muted', isMuted);
      });
    } else {
      console.warn('⚠️ Mute button not found in DOM!');
    }
  }

  setPaused(v) {
    const want = !!v;
    if (this.paused === want) return;
    this.paused = want;
    // show/hide UI
    if (this.pauseMenu) {
      this.pauseMenu.style.display = want ? 'flex' : 'none';
      this.pauseMenu.setAttribute('aria-hidden', (!want).toString());
    }
    // disable input handling when paused
    if (this.input && this.input.setEnabled) {
      this.input.setEnabled(!want);
    }
    // if pausing, exit pointer lock so user can interact with UI
    if (want && document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) { /* ignore */ }
    }
  }

  /* ===========================
     Victory Moment + overlays
     =========================== */

  _onLevelComplete() {
    console.log('🏁 Level complete event received');

    // Temporarily disable input while we show cinematics/overlays
    this.input?.setEnabled?.(false);

    // Kick the level-complete cinematic if your level defines it
    if (this.level?.triggerLevelCompleteCinematic) {
      this.level.triggerLevelCompleteCinematic(this.activeCamera, this.player);
    }

    // Play success VO (pravesh_success_vo.mp3 should be registered as "vo-success")
    if (this.soundManager?.sfx?.['vo-success']) {
      this.playVoiceover('vo-success', 7000);
      // Optional captions to go with the VO (simple sequenced bubbles)
this._runCaptionSequence([
  { at: 0,    text: "You made it—the apples are yours and the labyrinth is behind you." },
  { at: 1700, text: "Not bad, knight." },
  { at: 2600, text: "I’d say you’ve earned a break… but the next challenge won’t be so forgiving." },
  { at: 4800, text: "Take a breath, sharpen your wits," },
  { at: 6200, text: "and get ready—Level Four awaits." }
]);

    }

    // Show the victory overlay a beat after the camera move starts
setTimeout(() => {
  this._showVictoryOverlay();  // already shows Replay + Go To Level
  this._showLevelPicker();     // or pop the picker directly
  this.input?.setEnabled?.(true);
}, 3000); // after orbit; tweak to your taste

  }

  _runCaptionSequence(segments = []) {
    // Uses the same simple bubble you already use in showSimpleDialogue
    segments.forEach(seg => {
      setTimeout(() => {
        this.showSimpleDialogue('Pravesh', seg.text, 1600);
      }, seg.at || 0);
    });
  }

  _ensureVictoryOverlay() {
    if (this._victoryOverlay) return;

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,.85))',
      zIndex: 9999
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(92vw, 720px)',
      borderRadius: '18px',
      border: '3px solid #51cf66',
      background: '#0b1324',
      color: 'white',
      padding: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,.6)',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    });

    const title = document.createElement('div');
    title.textContent = 'Victory! 🏆';
    Object.assign(title.style, { fontSize: '28px', fontWeight: 800, marginBottom: '6px' });

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Choose your next step:';
    Object.assign(subtitle.style, { opacity: .85, marginBottom: '16px' });

    const actions = document.createElement('div');
    Object.assign(actions.style, {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center'
    });

    const btn = (label) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        cursor: 'pointer',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #51cf66',
        background: '#112143',
        color: 'white',
        fontWeight: 700
      });
      b.onmouseenter = () => b.style.transform = 'translateY(-2px)';
      b.onmouseleave = () => b.style.transform = 'translateY(0)';
      return b;
    };

    const replay = btn('Replay Level');
    replay.onclick = () => {
      overlay.style.display = 'none';
      // Reload current level index
      const idx = this.levelManager?.currentIndex ?? 0;
      this.loadLevel(idx);
      // Re-enable input
      this.input?.setEnabled?.(true);
    };

    const toLevelButtonsWrap = document.createElement('div');
    Object.assign(toLevelButtonsWrap.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' });

    const levelsArray = this._getAvailableLevels();
    for (const lvl of levelsArray) {
      const b = btn(`Go to: ${lvl.name || lvl.id}`);
      b.onclick = () => {
        overlay.style.display = 'none';
        const idx = this._findLevelIndexById(lvl.id);
        if (idx >= 0) this.loadLevel(idx);
        this.input?.setEnabled?.(true);
      };
      toLevelButtonsWrap.appendChild(b);
    }

    const hint = document.createElement('div');
    hint.textContent = 'Press N to open the Level Picker any time';
    Object.assign(hint.style, { marginTop: '10px', opacity: .65, fontSize: '12px' });

    actions.appendChild(replay);
    actions.appendChild(toLevelButtonsWrap);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(actions);
    card.appendChild(hint);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    this._victoryOverlay = overlay;
  }

  _showVictoryOverlay() {
    this._ensureVictoryOverlay();
    if (this._victoryOverlay) {
      this._victoryOverlay.style.display = 'flex';
    }
  }

  /* ===========================
     Level Picker overlay
     =========================== */

  _ensureLevelPicker() {
    if (this._levelPicker) return;

    const picker = document.createElement('div');
    Object.assign(picker.style, {
      position: 'fixed',
      inset: 0,
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.75))',
      zIndex: 9998
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(92vw, 640px)',
      borderRadius: '18px',
      border: '3px solid #4dabf7',
      background: '#0b1222',
      color: 'white',
      padding: '22px',
      boxShadow: '0 20px 60px rgba(0,0,0,.55)',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    });

    const title = document.createElement('div');
    title.textContent = 'Choose a Level';
    Object.assign(title.style, { fontSize: '26px', fontWeight: 800, marginBottom: '8px' });

    const grid = document.createElement('div');
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '10px',
      marginTop: '12px'
    });

    const levelsArray = this._getAvailableLevels();
    levelsArray.forEach((lvl) => {
      const b = document.createElement('button');
      b.textContent = `${lvl.name || lvl.id}`;
      Object.assign(b.style, {
        cursor: 'pointer',
        padding: '18px 12px',
        borderRadius: '14px',
        border: '2px solid #4dabf7',
        background: '#142647',
        color: 'white',
        fontWeight: 700
      });
      b.onclick = () => {
        picker.style.display = 'none';
        const idx = this._findLevelIndexById(lvl.id);
        if (idx >= 0) this.loadLevel(idx);
      };
      grid.appendChild(b);
    });

    const hint = document.createElement('div');
    hint.textContent = 'Press ESC to close • Press N to open this any time';
    Object.assign(hint.style, { marginTop: '10px', opacity: .65, fontSize: '12px' });

    card.appendChild(title);
    card.appendChild(grid);
    card.appendChild(hint);
    picker.appendChild(card);
    document.body.appendChild(picker);

    // Close on ESC
    const onEsc = (e) => { if (e.code === 'Escape') picker.style.display = 'none'; };
    window.addEventListener('keydown', onEsc);

    this._levelPicker = picker;
  }

  _showLevelPicker() {
    this._ensureLevelPicker();
    if (this._levelPicker) {
      this._levelPicker.style.display = 'flex';
    }
  }

  _getAvailableLevels() {
    // Prefer explicit level data export if present
    const listFromExport = Array.isArray(LEVELS) ? LEVELS : (LEVELS?.levels ?? null);
    const listFromManager = this.levelManager?.levels ?? null;

    const list = listFromExport || listFromManager || [];
    // If you only want a couple of levels visible, filter here:
    // return list.filter(l => ['intro','level2'].includes(l.id));
    return list;
  }

  _findLevelIndexById(id) {
    const listFromExport = Array.isArray(LEVELS) ? LEVELS : (LEVELS?.levels ?? null);
    const listFromManager = this.levelManager?.levels ?? null;
    const list = listFromExport || listFromManager || [];
    const idx = list.findIndex(l => l.id === id);
    return idx >= 0 ? idx : 0;
  }
}
