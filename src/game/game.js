// src/game/game.js
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
import { resolveMovement, meshesToColliders, enableDebug, disableDebug } from './collisionSystem.js';
import { Crosshair } from './components/crosshair.js';
import { Collectibles } from './components/collectibles.js';
import { FirstPersonCamera } from './firstPersonCamera.js';
import { LightManager } from './lightManager.js';
import * as LightModules from './lights/index.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { CombatSystem } from './combatSystem.js';
import { WorldMap } from './components/worldmap.js';
import { CountdownTimer } from './components/countdownTimer.js';

export class Game {
  constructor() {
    // --- Scene & renderer ----------------------------------------------------
    const { scene, renderer } = createSceneAndRenderer();
    this.scene = scene;
    this.renderer = renderer;

    // Prevent white screen while loading by rendering a first frame ASAP
    this.renderer.setAnimationLoop(null);
    this.scene.background = this.scene.background ?? new THREE.Color(0x0d1117);

    // --- State flags ---------------------------------------------------------
    this._frozen = false;     // gameplay frozen during cinematics (no pause menu)
    this.paused  = false;     // normal pause (shows menu)
    this.showColliders = true;
    this._suppressPointerLockPause = false;

    // --- Physics -------------------------------------------------------------
    // Initialize physics world with scene for improved collision detection
    this.physicsWorld = new PhysicsWorld(this.scene, {
      useAccurateCollision: false, // Disable Trimesh by default for reliability
      debugMode: false
    });

    // --- Input & managers ----------------------------------------------------
    this.input = new InputManager(window);
    this.levelManager = new LevelManager(this.scene, this.physicsWorld);
    this.level = null;

    // --- Player --------------------------------------------------------------
    this.player = new Player(this.scene, this.physicsWorld, {
      speed: 17,
      jumpStrength: 12,
      size: [1, 1.5, 1],
      colliderWidthScale: 0.5,
      colliderHeightScale: 1,
      colliderDepthScale: 0.5
    });

    // --- Cameras -------------------------------------------------------------
    this.thirdCam = new ThirdPersonCamera(this.player, this.input, window);
    this.firstCam = new FirstPersonCamera(this.player, this.input, window);
    this.freeCam  = new FreeCamera(this.input, window);

    this.thirdCameraObject = this.thirdCam.getCamera();
    this.firstCameraObject = this.firstCam.getCamera();
    this.freeCameraObject  = this.freeCam.getCamera();

    // Default camera is 3rd person
    this.activeCamera = this.thirdCameraObject;
    this.input.alwaysTrackMouse = true;

    // --- UI manager (init early so listeners can safely reference it) --------
    const appEl = document.getElementById('app');
    if (!appEl) {
      console.error('[Game] Missing #app root element in DOM. Cannot initialize UI.');
    }
    this.ui = new UIManager(appEl || document.body);
    // Baseline HUD + persistent debug UI
    this.ui.add('hud', HUD, { health: 100 });
    this.ui.add('fps', FPS, { showFrameTime: true });
    this.ui.add('crosshair', Crosshair, { visible: true });
    // World map (hidden initially)
    this.ui.add('worldmap', WorldMap, {}).show(false);

    // --- Pause menu references (if present in your HTML) ---------------------
    this.pauseMenu = document.getElementById('pauseMenu') || null;
    const resumeBtn = document.getElementById('resumeBtn') || null;
    if (resumeBtn) {
      resumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.setPaused(false);
        if (this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject) {
          try { document.body.requestPointerLock(); } catch (err) {
            console.warn('[Game] requestPointerLock on resume failed:', err);
          }
        }
      });
    }

    // --- Lighting ------------------------------------------------------------
    this.lights = new LightManager(this.scene);

    // --- Combat system -------------------------------------------------------
    this.combatSystem = new CombatSystem(this.scene, this.physicsWorld);

    // --- Cinematic control hooks (for CinematicsManager) ---------------------
    this._cinematicControls = {
      freeze: (on) => this.setFrozen(on),
      spawnFirstBug: () => (this.level?.spawnFirstBug ? this.level.spawnFirstBug() : null),

      context: {},

      switchToFreeCamera: (player) => {
        const prevCamObj = this.activeCamera;
        const wasLocked  = (document.pointerLockElement === document.body);

        // Move free cam near player and switch
        this.freeCam.moveNearPlayer(player || this.player);
        this.activeCamera = this.freeCameraObject;
        this.input.alwaysTrackMouse = false;
        if (wasLocked) {
          this._suppressPointerLockPause = true;
          try { document.exitPointerLock(); } catch {}
        }
        this.player.mesh.visible = true;

        // Return restore() to go back to the exact previous camera
        return () => {
          this.activeCamera = prevCamObj;
          const needsLock = (this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject);
          this.input.alwaysTrackMouse = needsLock;
          this.player.mesh.visible = (this.activeCamera !== this.firstCameraObject);
          if (needsLock && document.pointerLockElement !== document.body) {
            try { document.body.requestPointerLock(); } catch {}
          }
        };
      },

      getActiveCamera: () => this.activeCamera,

      getEnemies: () =>
        (this.level && typeof this.level.getEnemies === 'function' && this.level.getEnemies()) ||
        (this.level && this.level.enemyManager && this.level.enemyManager.enemies) ||
        [],

      freeCamAPI: this.freeCam
    };

    Object.defineProperties(this._cinematicControls.context, {
      nodePoints: {
        enumerable: true,
        get: () => (Array.isArray(this.level?.data?.nodePoints) ? this.level.data.nodePoints : [])
      },
      firstBugSpawn: {
        enumerable: true,
        get: () => (Array.isArray(this.level?.data?.firstBugSpawn) ? this.level.data.firstBugSpawn : [6, 3, -4])
      }
    });

    // --- Pointer-lock: click to request (ignore UI) --------------------------
    window.addEventListener('click', (e) => {
      try {
        const wm = this.ui?.get?.('worldmap');
        const clickedPause = !!(this.pauseMenu && this.pauseMenu.contains && this.pauseMenu.contains(e.target));
        const clickedWm    = !!(wm && wm.contains && wm.contains(e.target));
        const clickedMenu  = !!(this.ui?.get('menu')?.contains?.(e.target));
        if (clickedPause || clickedWm || clickedMenu) return;

        if ((this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject) &&
            document.pointerLockElement !== document.body) {
          document.body.requestPointerLock();
        }
      } catch (err) {
        console.warn('[Game] requestPointerLock click handler failed:', err);
      }
    });

    // --- Pointer-lock change: treat user ESC as pause (unless frozen) --------
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement) return;
      if (this._suppressPointerLockPause) {
        this._suppressPointerLockPause = false;
        return;
      }
      if (!this._frozen && (this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject)) {
        this.setPaused(true);
      }
    });

    // --- Keyboard bindings ---------------------------------------------------
    this._bindKeys();

    // --- Scene helpers -------------------------------------------------------
    const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
    this.scene.add(grid);

    // --- Main loop -----------------------------------------------------------
    this.last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);

    // --- Load first level ----------------------------------------------------
    this._initializeLevel().catch(err => {
      console.error('[Game] Initial level load failed:', err);
    });
  }

  async _initializeLevel() {
    await this.loadLevel(0);
    this.applyLevelLights(this.level?.data);
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;

      // World map toggle (doesn’t use pause menu)
      if (code === 'KeyM') {
        const wm = this.ui.get('worldmap');
        if (wm) {
          wm.toggle();
          if (wm._visible) {
            this.input?.setEnabled?.(false);
            if (document.pointerLockElement) {
              this._suppressPointerLockPause = true;
              try { document.exitPointerLock(); } catch {}
            }
          } else {
            if (!this.paused) this.input?.setEnabled?.(true);
            if ((this.activeCamera === this.thirdCameraObject || this.activeCamera === this.firstCameraObject) &&
                !document.pointerLockElement) {
              try { document.body.requestPointerLock(); } catch {}
            }
          }
        }
        return;
      }

      if (code === 'Escape') { this.setPaused(!this.paused); return; }
      if (this.paused) return;

      if (code === 'KeyC') {
        // Cycle cameras: free -> third -> first -> free
        if (this.activeCamera === this.freeCameraObject) {
          this.activeCamera = this.thirdCameraObject;
          this.input.alwaysTrackMouse = true;
          document.body.requestPointerLock();
          this.player.mesh.visible = true;
        } else if (this.activeCamera === this.thirdCameraObject) {
          this.activeCamera = this.firstCameraObject;
          this.input.alwaysTrackMouse = true;
          document.body.requestPointerLock();
          this.player.mesh.visible = false;
        } else {
          this.freeCam.moveNearPlayer(this.player);
          this.activeCamera = this.freeCameraObject;
          this.input.alwaysTrackMouse = false;
          if (document.pointerLockElement) {
            this._suppressPointerLockPause = true;
            try { document.exitPointerLock(); } catch {}
          }
          this.player.mesh.visible = true;
        }
      } else if (code === 'KeyN') {
        const nextIndex = this.levelManager.currentIndex + 1;
        this.loadLevel(nextIndex).catch(err => console.error('[Game] Failed to load next level:', err));
      } else if (code === 'KeyH') {
        // show/hide runtime helpers & colliders (player + level)
        this.showColliders = !this.showColliders;
        if (this.level?.toggleColliders) this.level.toggleColliders(this.showColliders);
        this.player.toggleHelperVisible?.(this.showColliders);
      } else if (code === 'KeyL') {
        // toggle physics debug visualization
        const enabled = this.physicsWorld.enableDebugRenderer(!this.physicsWorld.isDebugEnabled());
        console.log('[Physics] debug:', enabled);
      } else if (code === 'KeyB') {
        // toggle combat debug visuals
        this.combatSystem?.toggleDebug?.();
      }
    });
  }

  _loop() {
    requestAnimationFrame(this._loop);
    const now = performance.now();
    let delta = (now - this.last) / 1000;
    this.last = now;
    delta = Math.min(delta, 1 / 20);

    try {
      // If paused or frozen → still render a frame so scene isn’t blank
      if (this.paused || this._frozen) {
        this.renderer.render(this.scene, this.activeCamera);
        return;
      }

      // Physics step
      this.physicsWorld?.step(delta);

      // Level update
      if (this.level?.update) {
        this.level.update(delta, this.player, this.level.getPlatforms());
      }

      // UI update (map, hud, etc.)
      if (this.ui) {
        const enemyInstances =
          (this.level && typeof this.level.getEnemies === 'function' && this.level.getEnemies()) ||
          (this.level && this.level.enemyManager && this.level.enemyManager.enemies) ||
          [];

        const enemiesForUI = enemyInstances.map(e => {
          const p = e?.mesh?.position ?? e?.position ?? null;
          if (p && typeof p.x === 'number') return { position: [p.x, p.y ?? 0, p.z] };
          if (Array.isArray(e?.position)) return { position: e.position };
          return null;
        }).filter(Boolean);

        const levelData = this.level?.data;
        const ctx = {
          player: { health: this.player.health ?? 100, maxHealth: this.player.maxHealth ?? 100 },
          playerModel: this.player.mesh,
          map: {
            levelData,
            playerPos: this.player.mesh?.position,
            enemies: enemiesForUI.length ? enemiesForUI : (levelData?.enemies || [])
          }
        };
        this.ui.update(delta, ctx);
      }

      // Camera updates & movement orientation
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

      // Player update
      const platforms = this.level ? this.level.getPlatforms() : [];
      this.player.update(delta, this.input, camOrientation, platforms, playerActive);

      // Combat input & update
      if (playerActive && this.input.wasLeftClicked && this.input.wasLeftClicked() && this.combatSystem.canAttack()) {
        if (this.player.performAttack?.()) {
          if (this.level?.getEnemies) {
            this.combatSystem.setEnemies(this.level.getEnemies());
          }
          this.combatSystem.performSwordSwing(this.player, this.activeCamera);
        }
      }
      this.combatSystem.update(delta);

      // Lights animate
      this.lights?.update?.(delta);

      // Render
      this.renderer.render(this.scene, this.activeCamera);
    } catch (err) {
      console.error('[Game] Loop error:', err);
      // Try to at least render something instead of a white screen
      try { this.renderer.render(this.scene, this.activeCamera); } catch {}
    }
  }

  async loadLevel(index) {
    // Dispose previous level (if any)
    if (this.level) {
      try { this.level.dispose(); } catch (e) { console.warn('[Game] Previous level dispose failed:', e); }
      this.level = null;
    }

    // Recreate physics world to ensure clean state per level
    const wasDebugEnabled = this.physicsWorld.isDebugEnabled();
    this.physicsWorld.dispose();
    this.physicsWorld = new PhysicsWorld(this.scene, {
      useAccurateCollision: false,
      debugMode: wasDebugEnabled
    });

    // Update refs that depend on physics world
    this.player.physicsWorld = this.physicsWorld;
    if (this.player.originalModelSize) {
      this.player.createPhysicsBody(this.player.originalModelSize);
    }
    this.combatSystem.physicsWorld = this.physicsWorld;
    this.levelManager.physicsWorld = this.physicsWorld;

    console.log('[Game] Loading level...', index);
    let newLevel;
    try {
      newLevel = await this.levelManager.loadIndex(index);
    } catch (e) {
      console.error('[Game] levelManager.loadIndex failed:', e);
      throw e;
    }
    this.level = newLevel;

    // Supply player ref for node system (if used)
    this.level.setPlayerRef?.(this.player);

    // Position player at spawn
    try {
      const start = this.level.data.startPosition || [0, 3, 0];
      this.player.setPosition(new THREE.Vector3(...start));
      this.player.velocity.set(0, 0, 0);
    } catch (e) {
      console.warn('[Game] Failed to position player:', e);
    }

    // Collider visuals
    if (this.level.toggleColliders) this.level.toggleColliders(this.showColliders);
    this.player.toggleHelperVisible?.(this.showColliders);

    // UI & lights for this level
    this.applyLevelUI(this.level.data);
    this.applyLevelLights(this.level.data);

    // Start intro cinematic safely — always unfreeze at the end
    try {
      const p = this.level?.cinematicsManager?.playCinematic(
        'onLevelStart',
        this.activeCamera,
        this.player,
        this.ui,
        this._cinematicControls
      );
      await Promise.resolve(p);
    } catch (err) {
      console.error('[Game] Intro cinematic failed:', err);
    } finally {
      this.setFrozen(false);
    }

    console.log('[Game] Level loaded successfully');
    return this.level;
  }

  applyLevelLights(levelData) {
    if (!this.lights) return;
    try {
      this.lights.clear();
      const list = (levelData && levelData.lights) ? levelData.lights : null;
      if (!list) return;
      for (const item of list) {
        let key, props;
        if (typeof item === 'string') { key = item; props = {}; }
        else { key = item.key; props = item.props || {}; }
        const Module = LightModules[key];
        if (!Module) { console.warn('[Game] Unknown light module key:', key); continue; }
        this.lights.add(key, Module, props);
      }
    } catch (e) {
      console.warn('[Game] applyLevelLights error:', e);
    }
  }

  // Freeze gameplay without pause UI (cinematics)
  setFrozen(on) {
    const want = !!on;
    if (this._frozen === want) return;
    this._frozen = want;

    // disable input while frozen
    this.input?.setEnabled?.(!want);

    // exit pointer lock so user can’t steer while frozen
    if (want && document.pointerLockElement) {
      this._suppressPointerLockPause = true;
      try { document.exitPointerLock(); } catch {}
    }
  }

  applyLevelUI(levelData) {
    if (!this.ui) return;
    try {
      // Preserve persistent components (fps, crosshair) across level clears
      const persist = {};
      const keepKeys = ['fps', 'crosshair', 'worldmap'];
      for (const k of keepKeys) {
        const c = this.ui.get(k);
        if (c) persist[k] = c;
      }

      this.ui.clear();

      // Re-add persistent components first (mount if necessary)
      for (const k of Object.keys(persist)) {
        this.ui.components.set(k, persist[k]);
        if (persist[k].mount) persist[k].mount();
        if (k === 'worldmap') persist[k].show(false);
      }
      if (!this.ui.get('fps')) this.ui.add('fps', FPS, { showFrameTime: true });
      if (!this.ui.get('crosshair')) this.ui.add('crosshair', Crosshair, { visible: true });
      if (!this.ui.get('worldmap')) this.ui.add('worldmap', WorldMap, {}).show(false);

      const uiList = (levelData && levelData.ui) ? levelData.ui : ['hud'];

      for (const uiItem of uiList) {
        let key, config;
        if (typeof uiItem === 'string') {
          key = uiItem; config = {};
        } else if (typeof uiItem === 'object' && uiItem.type) {
          key = uiItem.type; config = uiItem.config || {};
        } else {
          console.warn('[Game] Invalid UI item in level data:', uiItem);
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
          const m = this.ui.add('menu', SmallMenu, { onResume: () => this.setPaused(false), ...config });
          if (m?.show) m.show(false); else if (m?.root?.style) m.root.style.display = 'none';
        } else if (key === 'collectibles') {
          this.ui.add('collectibles', Collectibles, config);
        } else if (key === 'timer') {
          this._addTimer(levelData);
        } else if (key === 'fps' || key === 'crosshair') {
          // already handled as persistent
          continue;
        } else {
          console.warn('[Game] Unknown UI component type in level data:', key);
        }
      }

      // World map always present but hidden
      const wm = this.ui.get('worldmap') || this.ui.add('worldmap', WorldMap, {});
      wm?.show(false);

      // If timerSeconds present but 'timer' wasn’t in ui[], still add it:
      if (levelData?.timerSeconds && !uiList.includes('timer')) {
        this._addTimer(levelData);
      }
    } catch (e) {
      console.error('[Game] applyLevelUI error:', e);
    }
  }

  _addTimer(levelData) {
    const seconds = Math.floor(levelData?.timerSeconds ?? 120);
    try {
      const timer = this.ui.add('timer', CountdownTimer, {
        seconds,
        onStart: () => {},
        onWarning30: () => {
          const cm = this.level?.cinematicsManager;
          if (cm?.playCinematic) {
            cm.playCinematic('timeWarning30', this.activeCamera, this.player, this.ui, this._cinematicControls);
          }
        },
        onExpire: () => {
          const cm = this.level?.cinematicsManager;
          if (cm?.playCinematic) {
            cm.playCinematic('onLevelFail', this.activeCamera, this.player, this.ui, this._cinematicControls);
          }
        }
      });
      return timer;
    } catch (e) {
      console.error('[Game] Failed to add timer:', e);
      return null;
    }
  }

  setPaused(v) {
    const want = !!v;
    if (this.paused === want) return;
    this.paused = want;

    // Show/hide legacy DOM pause menu if present
    if (this.pauseMenu) {
      this.pauseMenu.style.display = want ? 'flex' : 'none';
      this.pauseMenu.setAttribute('aria-hidden', (!want).toString());
    }

    // Toggle SmallMenu UI component
    const menuComp = this.ui?.get('menu');
    if (menuComp) {
      if (typeof menuComp.show === 'function') menuComp.show(want);
      else if (menuComp.root?.style) menuComp.root.style.display = want ? '' : 'none';
    }

    // Enable/disable input
    this.input?.setEnabled?.(!want);

    // If pausing, exit pointer lock so user can interact with UI
    if (want && document.pointerLockElement) {
      try { document.exitPointerLock(); } catch {}
    }
  }
}
