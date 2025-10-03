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
import { FirstPersonCamera } from './firstPersonCamera.js';
import { LightManager } from './lightManager.js';
import * as LightModules from './lights/index.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { CombatSystem } from './combatSystem.js';

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
  this.levelManager = new LevelManager(this.scene, this.physicsWorld);
  this.level = null;

  // Player
  this.player = new Player(this.scene, this.physicsWorld, { 
    speed: 17, 
    jumpStrength: 12, 
    size: [1, 1.5, 1],
    // Collider size scaling factors (optional)
    colliderWidthScale: 0.5,   // 40% of model width (default: 0.4)
    colliderHeightScale: 1,  // 90% of model height (default: 0.9)  
    colliderDepthScale: 0.5    // 40% of model depth (default: 0.4)
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
  // Add crosshair for combat
  this.ui.add('crosshair', Crosshair, { visible: true });

  // Combat system
  this.combatSystem = new CombatSystem(this.scene, this.physicsWorld);

  // Lighting manager (modular per-level lights)
  this.lights = new LightManager(this.scene);

    // Load the initial level early so subsequent code can reference `this.level`
    this._initializeLevel();

    // small world grid
    const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
    this.scene.add(grid);    // Pause state
    this.paused = false;
    this.pauseMenu = document.getElementById('pauseMenu');
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

  // loop
  this.last = performance.now();
  this._loop = this._loop.bind(this);
  requestAnimationFrame(this._loop);
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
      // Always allow toggling pause via Escape
      if (code === 'Escape') {
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
      } else if (code === 'KeyL') {
        // toggle physics debug visualization
        const debugEnabled = this.physicsWorld.enableDebugRenderer(!this.physicsWorld.isDebugEnabled());
      }
    });
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
        // Perform the attack
        this.combatSystem.performAttack(this.activeCamera, this.player);
      }
    }

    // Update combat system
    this.combatSystem.update(delta);

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
    
    // Recreate player's physics body in the new physics world
    if (this.player.originalModelSize) {
      this.player.createPhysicsBody(this.player.originalModelSize);
    }
    
    // Update level manager's physics world reference
    this.levelManager.physicsWorld = this.physicsWorld;
    
    this.level = await this.levelManager.loadIndex(index);

    // Position player at start position
    const start = this.level.data.startPosition;
    this.player.setPosition(new THREE.Vector3(...start));
    
    // Trigger level start cinematic
    this.level.triggerLevelStartCinematic(this.activeCamera, this.player);

    // swap UI components according to level.data.ui (array of strings)
    this.applyLevelUI(this.level.data);
    // swap lighting according to level.data.lights (array of descriptors)
    this.applyLevelLights(this.level.data);
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
    
    for (const key of uiList) {
      if (key === 'hud') this.ui.add('hud', HUD, { health: this.player.health ?? 100 });
      else if (key === 'minimap') this.ui.add('minimap', Minimap, {});
      else if (key === 'objectives') this.ui.add('objectives', Objectives, { items: levelData.objectives ?? ['Reach the goal'] });
      else if (key === 'menu') this.ui.add('menu', SmallMenu, { onResume: () => this.setPaused(false) });
      else if (key === 'fps') {
        // FPS is already added as a global component, skip
        continue;
      }
      else {
        console.warn('Unknown UI key in level data:', key);
      }
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
