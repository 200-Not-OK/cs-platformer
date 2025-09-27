// src/game/level.js
import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { EnemyManager } from './EnemyManager.js';
import { loadGLTFModel } from './gltfLoader.js';
import { CinematicsManager } from './cinematicsManager.js';
import { NodeManager } from './linkedList/NodeManager.js';
import { ReverseStation } from './props/reverseStation.js';

export class Level {
  constructor(scene, levelData, showColliders = true) {
    this.scene = scene;
    this.data = levelData;

    this.objects = [];
    this.colliders = [];
    this.helpers  = [];
    this.showColliders = showColliders;

    this.enemyManager = new EnemyManager(this.scene);
    this._firstBug = null;
    this.nodeManager = null;

    this._playerRef = null;
    this._inputRef = null;

    this._eHeld = false; // for edge-detecting the E key
    this.reverseStation = null;

    this.gltfLoaded = false;
    this.cinematicsManager = new CinematicsManager(scene);
  }

  static async create(scene, levelData, showColliders = true) {
    const level = new Level(scene, levelData, showColliders);
    await level._buildFromData();
    return level;
  }

  async _buildFromData() {
    let geometryLoaded = false;

    if (this.data.gltfUrl) {
      try {
        await this._loadGLTFGeometry(this.data.gltfUrl);
        this.gltfLoaded = true;
        geometryLoaded = true;
      } catch (error) {
        console.warn('Failed to load GLTF level geometry:', error);
        this.gltfLoaded = false;
      }
    }

    if (!geometryLoaded) this._buildFallbackGeometry();

    this._loadEnemies();

    if (this.data.cinematics) {
      this.cinematicsManager.loadCinematics(this.data.cinematics);
    }

    // Create Reverse Station (position can be configured in level data)
    const rsPos = Array.isArray(this.data.reverseStationPos) ? this.data.reverseStationPos : [0, 3.2, 10];
    this.reverseStation = new ReverseStation(this.scene, rsPos);

    if (this._playerRef) this.initNodeSystem(this._playerRef, this.cinematicsManager);
  }

  async _loadGLTFGeometry(url) {
    const gltf = await loadGLTFModel(url);
    if (!gltf || !gltf.scene) throw new Error(`Invalid GLTF for ${url}`);

    const meshesToProcess = [];
    gltf.scene.traverse((child) => { if (child.isMesh) meshesToProcess.push(child); });

    this.scene.add(gltf.scene);

    for (const child of meshesToProcess) {
      this.objects.push(child);

      const box = new THREE.Box3().setFromObject(child);
      child.userData.collider = box;
      this.colliders.push(box);

      const helper = new ColliderHelper(box, 0x00ff00);
      helper.setVisible(this.showColliders);
      this.scene.add(helper.mesh);
      this.helpers.push(helper);

      child.userData.type = 'gltf';
      const name = (child.name || '').toLowerCase();
      child.userData.isCollider = name.includes('collider') || name.includes('collision');
    }
  }

  _buildFallbackGeometry() {
    const list = this.data.fallbackObjects || this.data.objects || [];
    for (const obj of list) {
      if (obj.type === 'box') {
        const geom = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
        const mat = new THREE.MeshStandardMaterial({ color: obj.color ?? 0x808080 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
        mesh.userData.type = 'box';
        this.scene.add(mesh);
        this.objects.push(mesh);

        const box = new THREE.Box3().setFromObject(mesh);
        mesh.userData.collider = box;
        this.colliders.push(box);

        const helper = new ColliderHelper(box, 0x0000ff);
        helper.setVisible(this.showColliders);
        this.scene.add(helper.mesh);
        this.helpers.push(helper);
      }
    }
  }

  _loadEnemies() {
    if (Array.isArray(this.data.enemies)) {
      for (const ed of this.data.enemies) {
        try { this.enemyManager.spawn(ed.type, ed); }
        catch (e) { console.warn('Failed to spawn enemy', ed, e); }
      }
    }
  }

  setPlayerRef(player) {
    this._playerRef = player;
    if (!this.nodeManager && Array.isArray(this.data.nodePoints) && this.data.nodePoints.length > 0) {
      this.initNodeSystem(this._playerRef, this.cinematicsManager);
    }
  }

  setInputRef(input) { this._inputRef = input; }

  initNodeSystem(playerRef, cinematicsManager) {
    if (!Array.isArray(this.data.nodePoints) || this.data.nodePoints.length === 0) return;

    this.nodeManager = new NodeManager(this.scene, {
      points: this.data.nodePoints,
      order: Array.isArray(this.data.nodeOrder) ? this.data.nodeOrder : undefined,
      lineColor: 0x7dd3fc,
      getPlayerPos: () => playerRef?.mesh?.position || new THREE.Vector3(),
      onPhaseAdvance: () => {
        cinematicsManager?.playCinematic?.('bugChaos');
      },
      onComplete: () => {
        cinematicsManager?.playCinematic?.('onLevelComplete');
      }
    });
  }

  update(delta = 1 / 60, player = null, platforms = [], input = null) {
    // Keep input ref (so Game doesn't need a separate call)
    if (input) this._inputRef = input;

    // Update colliders/helpers
    for (let i = 0; i < this.objects.length; i++) {
      const mesh = this.objects[i];
      if (mesh.userData.collider) mesh.userData.collider.setFromObject(mesh);
      this.helpers[i]?.update();
      this.helpers[i]?.setVisible(this.showColliders);
    }

    // Enemies
    this.enemyManager?.update(delta, player, platforms.length ? platforms : this.getPlatforms());

    // Node system
    this.nodeManager?.update(delta);

    // Reverse station animations + interaction
    if (this.reverseStation) {
      this.reverseStation.update(delta);

      if (player?.mesh?.position) {
        const inRange = this.reverseStation.isPlayerInRange(player.mesh.position);

        // simple edge detection for E
        const eDown = !!this._inputRef?.isKey?.('KeyE');
        if (!eDown) this._eHeld = false;

        if (inRange && eDown && !this._eHeld) {
          this._eHeld = true;
          if (!this.reverseStation.hasInteracted()) {
            this.reverseStation.markInteracted();
            // As requested: throw an alert on interaction
            alert('Reverse Station: Interaction received! Starting reverse protocol...');
            // You can also kick off a cinematic or phase here if you want:
            // this.cinematicsManager?.playCinematic?.('reverseIntro');
          }
        }
      }
    }
  }

  toggleColliders(v) {
    this.showColliders = v;
    this.helpers.forEach((h) => h.setVisible(v));
  }

  dispose() {
    this.helpers.forEach(h => this.scene.remove(h.mesh));
    this.objects.forEach(m => this.scene.remove(m));
    this.objects = [];
    this.helpers = [];
    this.colliders = [];

    this.reverseStation?.dispose?.();
    this.nodeManager?.dispose?.();

    if (this.enemyManager) { this.enemyManager.dispose(); this.enemyManager = null; }
    if (this.cinematicsManager) { this.cinematicsManager.dispose(); this.cinematicsManager = null; }
  }

  getPlatforms() { return this.objects; }

  getEnemies() { return this.enemyManager?.enemies || []; }

  spawnFirstBug() {
    if (this._firstBug) return this._firstBug;
    const pos = Array.isArray(this.data.firstBugSpawn) ? this.data.firstBugSpawn : [6, 3, -4];
    this._firstBug = this.enemyManager.spawn('runner', {
      position: pos,
      speed: 4.5,
      chaseRange: 10,
      modelUrl: 'src/assets/low_poly_male/scene.gltf'
    });
    return this._firstBug;
  }

  triggerLevelStartCinematic(camera, player) {
    if (this.cinematicsManager?.cinematics?.onLevelStart) {
      this.cinematicsManager.playCinematic('onLevelStart', camera, player);
    }
  }
  triggerEnemyDefeatCinematic(camera, player) {
    if (this.cinematicsManager?.cinematics?.onEnemyDefeat) {
      this.cinematicsManager.playCinematic('onEnemyDefeat', camera, player);
    }
  }
  triggerLevelCompleteCinematic(camera, player) {
    if (this.cinematicsManager?.cinematics?.onLevelComplete) {
      this.cinematicsManager.playCinematic('onLevelComplete', camera, player);
    }
  }

  getCinematicsManager() { return this.cinematicsManager; }
}
