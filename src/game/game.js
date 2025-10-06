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
      game: this // Pass game reference for death handling
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
                this.playVoiceover(voToPlay, 15000); // 15 seconds for voiceover
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
      characterName: 'Praveen',
      position: 'right'
    });

    // Combat system
    this.combatSystem = new CombatSystem(this.scene, this.physicsWorld);

    // Collectibles system
    this.collectiblesManager = new CollectiblesManager(this.scene, this.physicsWorld, this);

    // Door system
    this.doorManager = new DoorManager(this.scene, this.physicsWorld, this);
    this.doorHelpersVisible = false; // Track door collision helper visibility (invisible by default)

    // Lighting manager (modular per-level lights)
    this.lights = new LightManager(this.scene);

    // Sound manager (initialize with camera for 3D audio)
    this.soundManager = new SoundManager(this.thirdCameraObject);

    // Proximity sound manager (for location-based sounds like torches)
    this.proximitySoundManager = null; // Will be initialized after player is ready

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
🔄 N - Next level
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
        // next level — use loadLevel so per-level UI is applied
        const nextIndex = this.levelManager.currentIndex + 1;
        this.loadLevel(nextIndex).catch(err => console.error('Failed to load level:', err));
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

  playVoiceover(voName, duration = 5000) {
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
        voCard.show('Praveen');
        voCard.startSpeaking();

        // Hide after duration
        setTimeout(() => {
          console.log(`🎤 Stopping voiceover card speaking animation`);
          voCard.stopSpeaking();
          setTimeout(() => {
            console.log(`🎤 Hiding voiceover card`);
            voCard.hide();
          }, 500);
        }, duration);
      } else {
        console.error(`🎤 ERROR: voiceoverCard component not found!`);
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
        playerModel: this.player.mesh
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

  // update lights (allow dynamic lights to animate)
  if (this.lights) this.lights.update(delta);

    // render
    this.renderer.render(this.scene, this.activeCamera);
  }

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
    
    // Update player's physics world reference
    this.player.physicsWorld = this.physicsWorld;
    
    // Update combat system's physics world reference
    this.combatSystem.physicsWorld = this.physicsWorld;
    
    // Update door manager's physics world reference
    this.doorManager.physicsWorld = this.physicsWorld;
    
    // Update collectibles manager's physics world reference
    this.collectiblesManager.updatePhysicsWorld(this.physicsWorld);
    
    // Clear existing doors when loading a new level
    this.doorManager.dispose();
    this.doorManager = new DoorManager(this.scene, this.physicsWorld, this);
    
    // Recreate player's physics body in the new physics world
    if (this.player.originalModelSize) {
      this.player.createPhysicsBody(this.player.originalModelSize);
    }
    
    // Update level manager's physics world reference
    this.levelManager.physicsWorld = this.physicsWorld;
    
    this.level = await this.levelManager.loadIndex(index);

    // Position player at start position from level data
    const start = this.level.data.startPosition;
    this.player.setPosition(new THREE.Vector3(...start));
    console.log(`🏃 Player spawned at position: [${start.join(', ')}] for level: ${this.level.data.name}`);
    
    // Trigger level start cinematic
    this.level.triggerLevelStartCinematic(this.activeCamera, this.player);

    // spawn doors at specific positions only on level 2
    if (index === 1) { // level2
      // Boss door
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
        autoOpenOnApproach: true
      //  passcode: '123'
      });
      console.log('Spawned boss door model at position [25.9, 0, -4.5] on level 2');
      
      // Second door
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
        autoOpenOnApproach: true
      });
      console.log('Spawned basic door at position [55, 0, -4.5] on level 2');
      
      // Apply current door helper visibility state
      this.doorManager.toggleColliders(this.doorHelpersVisible);
    }

    // swap UI components according to level.data.ui (array of strings)
    this.applyLevelUI(this.level.data);
    // swap lighting according to level.data.lights (array of descriptors)
    this.applyLevelLights(this.level.data);
    // load and play sounds for this level
    await this.applyLevelSounds(this.level.data);

    // Spawn collectibles after all systems are initialized
    this.collectiblesManager.cleanup();
    await this.collectiblesManager.spawnCollectiblesForLevel(this.level.data);

    return this.level;
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
        this.ui.add('minimap', Minimap, config);
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

  async applyLevelSounds(levelData) {
    console.log('🔊🔊🔊 applyLevelSounds CALLED! 🔊🔊🔊');
    console.log('🔊 applyLevelSounds called for level:', levelData.name);
    console.log('🔊 Sound manager exists?', !!this.soundManager);
    console.log('🔊 Level sounds config:', levelData.sounds);

    if (!this.soundManager) {
      console.warn('⚠️ Sound manager not available!');
      return;
    }

    if (!levelData.sounds) {
      console.warn('⚠️ No sounds config in level data!');
      console.log('🔍 Skipping to proximity sounds check...');
      // Even if no sounds, still check for proximity sounds
      console.log(`🔍 Checking for proximity sounds in level data...`);
      console.log(`🔍 levelData.proximitySounds exists?`, !!levelData.proximitySounds);
      console.log(`🔍 levelData.proximitySounds value:`, levelData.proximitySounds);
      return;
    }

    try {
      console.log('🔊 Starting to load sounds...');
      // Load sounds for this level
      await this.soundManager.loadSounds(levelData.sounds);
      console.log('🔊 Sounds loaded successfully!');

      // Store what music/ambient/voiceover to play for this level
      console.log('🔊 DEBUG: levelData.sounds object:', levelData.sounds);
      console.log('🔊 DEBUG: levelData.sounds.playMusic =', levelData.sounds.playMusic);
      console.log('🔊 DEBUG: levelData.sounds.playAmbient =', levelData.sounds.playAmbient);
      console.log('🔊 DEBUG: levelData.sounds.playVoiceover =', levelData.sounds.playVoiceover);

      this._pendingMusic = levelData.sounds.playMusic;
      this._pendingAmbient = levelData.sounds.playAmbient;
      this._pendingVoiceover = levelData.sounds.playVoiceover;

      // Check if AudioContext is already running (user has interacted)
      const audioContext = this.soundManager.listener.context;
      console.log('🔊 AudioContext state:', audioContext.state);

      if (audioContext.state === 'running') {
        // AudioContext is ready, play immediately
        if (this._pendingMusic) {
          console.log('🔊 AudioContext running, playing music:', this._pendingMusic);
          this.soundManager.playMusic(this._pendingMusic);
          this._pendingMusic = null;
        }
        if (this._pendingAmbient) {
          console.log('🔊 AudioContext running, playing ambient:', this._pendingAmbient);
          this.soundManager.playAmbient(this._pendingAmbient);
          this._pendingAmbient = null;
        }
        if (this._pendingVoiceover) {
          console.log('🔊 AudioContext running, playing voiceover:', this._pendingVoiceover);
          const voToPlay = this._pendingVoiceover;
          this._pendingVoiceover = null;
          setTimeout(() => {
            this.playVoiceover(voToPlay, 15000); // 15 seconds for voiceover
          }, 500); // Small delay so VO plays after music starts
        }
      } else {
        console.log('🔊 AudioContext suspended. Music will play after user interaction (click).');
        console.log('🔊 Pending music:', this._pendingMusic);
        console.log('🔊 Pending ambient:', this._pendingAmbient);
        console.log('🔊 Pending voiceover:', this._pendingVoiceover);
      }

      // Load proximity sounds if specified
      console.log(`🔍 Checking for proximity sounds in level data...`);
      console.log(`🔍 levelData.proximitySounds exists?`, !!levelData.proximitySounds);
      console.log(`🔍 levelData.proximitySounds value:`, levelData.proximitySounds);

      if (levelData.proximitySounds) {
        console.log(`🎵 Level has ${levelData.proximitySounds.length} proximity sound zones`);
        // Create proximity sound manager if not exists
        if (!this.proximitySoundManager) {
          console.log(`🎵 Creating new ProximitySoundManager`);
          this.proximitySoundManager = new ProximitySoundManager(this.soundManager, this.player);
        }
        this.proximitySoundManager.loadProximitySounds(levelData.proximitySounds);
      } else {
        console.warn(`⚠️⚠️⚠️ NO PROXIMITY SOUNDS FOUND IN LEVEL DATA! ⚠️⚠️⚠️`);
        if (this.proximitySoundManager) {
          // Clean up proximity sounds if no proximity sounds in new level
          this.proximitySoundManager.dispose();
        }
      }

      console.log(`🔊 Loaded sounds for level: ${levelData.name}`);
    } catch (error) {
      console.error(`❌ Failed to load sounds for level ${levelData.name}:`, error);
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
}
