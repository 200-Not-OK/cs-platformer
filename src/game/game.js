import * as THREE from 'three';
import { createSceneAndRenderer } from './scene.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { LevelManager } from './levelManager.js';
import { ThirdPersonCamera } from './thirdPersonCamera.js';
import { FreeCamera } from './freeCamera.js';
import { FirstPersonCamera } from './firstPersonCamera.js';

export class Game {
  constructor() {
    const { scene, renderer } = createSceneAndRenderer();
    this.scene = scene;
    this.renderer = renderer;

    // Input
    this.input = new InputManager(window);

  // Level system
  this.levelManager = new LevelManager(this.scene);
  this.level = this.levelManager.loadFirst();

  // Player
  this.player = new Player(this.scene, { speed: 9, jumpStrength: 10, size: [1, 1, 1] });
  // Set player position from levelData
  const start = this.level.data.startPosition ?? [0, 2, 8];
  this.player.setPosition(new THREE.Vector3(...start));

    // Cameras
  this.thirdCam = new ThirdPersonCamera(this.player, this.input, window);
  this.firstCam = new FirstPersonCamera(this.player, this.input, window);
  this.freeCam = new FreeCamera(this.input, window);
  this.activeCamera = this.freeCam.getCamera();
    // Enable alwaysTrackMouse for third-person camera
    this.input.alwaysTrackMouse = true;
    // Request pointer lock for third-person camera
    window.addEventListener('click', () => {
      // request pointer lock when clicking while in first or third person
      if ((this.activeCamera === this.thirdCam.getCamera() || this.activeCamera === this.firstCam.getCamera()) && document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      }
    });

    // When switching to free camera, move it near player
    this._bindKeys();

    // debug toggles
    this.showColliders = true;
    this.level.toggleColliders(this.showColliders);
    this.player.toggleHelperVisible(this.showColliders);

    // small world grid
    const grid = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
    this.scene.add(grid);

    // loop
    this.last = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (code === 'KeyC') {
        // cycle cameras: free -> third -> first -> free
        if (this.activeCamera === this.freeCam.getCamera()) {
          // free -> third
          this.activeCamera = this.thirdCam.getCamera();
          this.input.alwaysTrackMouse = true;
          document.body.requestPointerLock();
          this.player.mesh.visible = true;
        } else if (this.activeCamera === this.thirdCam.getCamera()) {
          // third -> first
          this.activeCamera = this.firstCam.getCamera();
          this.input.alwaysTrackMouse = true;
          document.body.requestPointerLock();
          this.player.mesh.visible = false; // hide model in first-person to avoid clipping
        } else {
          // first (or other) -> free
          this.freeCam.moveNearPlayer(this.player);
          this.activeCamera = this.freeCam.getCamera();
          this.input.alwaysTrackMouse = false;
          if (document.pointerLockElement) document.exitPointerLock();
          this.player.mesh.visible = true; // restore visibility
        }
        // ensure player is active when in third- or first-person
        // (handled each frame in _loop by checking activeCamera)
      } else if (code === 'KeyN') {
      } else if (code === 'KeyN') {
        // next level
        this.level = this.levelManager.loadNext();
        const start = this.level.data.startPosition ?? [0, 2, 8];
        this.player.setPosition(new THREE.Vector3(...start));
        this.player.velocity.set(0, 0, 0);
      } else if (code === 'KeyH') {
        // toggle collider visualization
        this.showColliders = !this.showColliders;
        this.level.toggleColliders(this.showColliders);
        this.player.toggleHelperVisible(this.showColliders);
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

    // update level (updates colliders/helpers)
    this.level.update();

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

    // update player (movement read from input manager)
    this.player.update(delta, this.input, camOrientation, this.level.getPlatforms(), playerActive);

    // render
    this.renderer.render(this.scene, this.activeCamera);
  }
}
