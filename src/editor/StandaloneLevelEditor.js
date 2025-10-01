import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Standalone Level Editor - Focused on Enemies, Patrol Points, and Lighting
// Features:
// - Load levels from levelData.js with GLTF geometry
// - Edit enemies, patrol points, and lighting only
// - Save changes back to levelData.js
// - Level switching within editor

export class StandaloneLevelEditor {
  constructor(container, statusElement) {
    this.container = container;
    this.statusElement = statusElement;
    
    // Initialize THREE.js scene
    this._initScene();
    
    // Editor state
    this.mode = 'select'; // enemy | light | patrol | collider | mesh | select
    this.enabled = true;
    
    // Level management
    this.levels = [];
    this.currentLevelIndex = 0;
    this.currentLevel = null;
    this.levelGeometry = new THREE.Group(); // Holds GLTF geometry
    this.scene.add(this.levelGeometry);
    
    // Data storage (current level's editable data)
    this.enemies = [];
    this.lights = [];
    this.patrolPoints = [];
    this.colliders = []; // Manual colliders
    this.levelMeshes = []; // Individual meshes from GLTF for selection
    
    // Visual representations
    this.enemyMeshes = [];
    this.lightMeshes = [];
    this.patrolPointMeshes = [];
    this.patrolConnections = []; // Lines showing patrol routes
    this.colliderMeshes = []; // Visual representations of colliders
    this.meshOutlines = []; // Outline materials for mesh selection
    
    // Selection system
    this.selected = null;
    this.selectedType = null;
    this.selectedMesh = null; // Currently selected GLTF mesh
    
    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Input state
    this.keys = {};
    this.mouseDown = false;
    this.isRotating = false;
    this.mouseDelta = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    
    // ID counter
    this.nextId = 1;
    
    // GLTF Loader
    this.gltfLoader = new GLTFLoader();
    
    // Enemy and Light types
    this.enemyTypes = ['walker', 'runner', 'jumper', 'flyer'];
    this.lightTypes = ['BasicLights', 'PointPulse', 'HemisphereFill'];
    this.colliderTypes = ['box', 'sphere', 'capsule'];
    this.materialTypes = ['ground', 'wall', 'platform'];
    
    // Create UI and bind events
    this._createUI();
    this._bindEvents();
    this._addBasicLighting();
    
    // Load levels and initialize
    this._loadLevels();
  }
  
  _initScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Camera controls (manual WASD + mouse look)
    const lookDirection = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), this.camera.position).normalize();
    this.cameraYaw = Math.atan2(lookDirection.x, lookDirection.z);
    this.cameraPitch = Math.asin(THREE.MathUtils.clamp(lookDirection.y, -1, 1));
    this.sensitivity = 0.004;
    this.moveSpeed = 20;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Ground plane for raycasting
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    groundGeometry.rotateX(-Math.PI / 2);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0,
      side: THREE.DoubleSide 
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.name = 'groundPlane';
    this.scene.add(this.groundPlane);
  }
  
  _addBasicLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);
  }
  
  async _loadLevels() {
    try {
      // Import levelData.js dynamically
      const levelModule = await import('../game/levelData.js');
      this.levels = levelModule.levels;
      
      if (this.levels.length > 0) {
        await this._loadLevel(0);
      }
      
      this._updateStatus();
    } catch (error) {
      console.error('Failed to load levels:', error);
      this._updateStatus('Failed to load levels');
    }
  }
  
  async _loadLevel(index) {
    if (index < 0 || index >= this.levels.length) return;
    
    this.currentLevelIndex = index;
    this.currentLevel = this.levels[index];
    
    // Clear previous level data
    this._clearLevel();
    
    // Load GLTF geometry if available
    if (this.currentLevel.gltfUrl) {
      try {
        await this._loadLevelGeometry(this.currentLevel.gltfUrl);
      } catch (error) {
        console.warn('Failed to load GLTF geometry, using fallback:', error);
        this._loadFallbackGeometry();
      }
    } else {
      this._loadFallbackGeometry();
    }
    
    // Load editable data
    this._loadEditableData();
    
    // Position camera to look at the level geometry
    this._positionCameraForLevel();
    
    this._updateStatus();
  }
  
  _clearLevel() {
    // Clear geometry
    while (this.levelGeometry.children.length > 0) {
      this.levelGeometry.remove(this.levelGeometry.children[0]);
    }
    
    // Clear visual representations
    this._clearVisualRepresentations();
    
    // Clear data arrays
    this.enemies = [];
    this.lights = [];
    this.patrolPoints = [];
    this.colliders = [];
    this.levelMeshes = [];
    
    this.selected = null;
    this.selectedType = null;
    this.selectedMesh = null;
  }
  
  _clearVisualRepresentations() {
    // Remove enemy meshes
    this.enemyMeshes.forEach(mesh => this.scene.remove(mesh));
    this.enemyMeshes = [];
    
    // Remove light meshes
    this.lightMeshes.forEach(mesh => this.scene.remove(mesh));
    this.lightMeshes = [];
    
    // Remove patrol point meshes
    this.patrolPointMeshes.forEach(mesh => this.scene.remove(mesh));
    this.patrolPointMeshes = [];
    
    // Remove patrol connections
    this.patrolConnections.forEach(line => this.scene.remove(line));
    this.patrolConnections = [];
    
    // Remove collider meshes
    this.colliderMeshes.forEach(mesh => this.scene.remove(mesh));
    this.colliderMeshes = [];
    
    // Clear mesh outlines
    this.meshOutlines.forEach(outline => this.scene.remove(outline));
    this.meshOutlines = [];
  }
  
  async _loadLevelGeometry(gltfUrl) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        gltfUrl,
        (gltf) => {
          this.levelGeometry.add(gltf.scene);
          
          // Extract individual meshes for selection
          this.levelMeshes = [];
          
          // Set up meshes with original materials and textures
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Add to selectable meshes array
              this.levelMeshes.push({
                mesh: child,
                name: child.name || 'Unnamed Mesh',
                originalMaterial: child.material.clone ? child.material.clone() : child.material
              });
              
              // Add interaction capabilities
              child.userData.type = 'levelMesh';
              child.userData.selectable = true;
              
              // Only make collision objects slightly transparent, keep original materials
              if (child.name.toLowerCase().includes('collision') || 
                  child.name.toLowerCase().includes('collider')) {
                // Clone the original material and make it slightly transparent
                if (child.material) {
                  child.material = child.material.clone();
                  child.material.transparent = true;
                  child.material.opacity = 0.7; // Less transparent than before
                }
              }
              // All other meshes keep their original materials and textures
            }
          });
          
          resolve(gltf);
        },
        undefined,
        reject
      );
    });
  }
  
  _loadFallbackGeometry() {
    if (!this.currentLevel.fallbackObjects) return;
    
    this.currentLevel.fallbackObjects.forEach(obj => {
      let geometry, material, mesh;
      
      switch (obj.type) {
        case 'box':
          geometry = new THREE.BoxGeometry(obj.size[0], obj.size[1], obj.size[2]);
          material = new THREE.MeshLambertMaterial({ color: obj.color || 0x888888 });
          mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.levelGeometry.add(mesh);
          break;
      }
    });
  }
  
  _loadEditableData() {
    // Load enemies
    if (this.currentLevel.enemies) {
      this.enemies = [...this.currentLevel.enemies];
      this._createEnemyVisuals();
    }
    
    // Load lights
    if (this.currentLevel.lights) {
      this.lights = this.currentLevel.lights.map(lightType => ({
        type: lightType,
        position: [0, 5, 0], // Default position
        id: this.nextId++
      }));
      this._createLightVisuals();
    }
    
    // Load colliders
    if (this.currentLevel.colliders) {
      this.colliders = [...this.currentLevel.colliders];
      this._createColliderVisuals();
    }
    
    // Extract patrol points from enemies
    this._extractPatrolPoints();
    this._createPatrolPointVisuals();
    this._createPatrolConnections();
  }
  
  _positionCameraForLevel() {
    // Calculate bounding box of the level geometry
    const boundingBox = new THREE.Box3();
    
    if (this.levelGeometry.children.length > 0) {
      // Calculate bounds from level geometry
      boundingBox.setFromObject(this.levelGeometry);
    } else {
      // Fallback: use start position if available
      if (this.currentLevel.startPosition) {
        const startPos = this.currentLevel.startPosition;
        boundingBox.setFromPoints([
          new THREE.Vector3(startPos[0] - 25, startPos[1] - 5, startPos[2] - 25),
          new THREE.Vector3(startPos[0] + 25, startPos[1] + 20, startPos[2] + 25)
        ]);
      } else {
        // Default fallback bounds
        boundingBox.setFromPoints([
          new THREE.Vector3(-25, -5, -25),
          new THREE.Vector3(25, 20, 25)
        ]);
      }
    }
    
    // Get the center and size of the bounding box
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Calculate appropriate camera distance based on level size
    const maxDimension = Math.max(size.x, size.y, size.z);
    const distance = maxDimension * 1.5; // Adjust multiplier as needed
    
    // Position camera at an angle that provides a good overview
    const cameraOffset = new THREE.Vector3(
      distance * 0.7,  // X offset (right side)
      distance * 0.8,  // Y offset (above)
      distance * 0.7   // Z offset (forward)
    );
    
    // Set camera position
    this.camera.position.copy(center).add(cameraOffset);
    this.camera.lookAt(center);
    
    // Extract yaw and pitch from the camera's actual rotation after lookAt()
    const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.cameraYaw = euler.y;
    this.cameraPitch = euler.x;
    
    console.log(`Camera positioned at: ${this.camera.position.toArray().map(v => v.toFixed(1)).join(', ')}`);
    console.log(`Looking at level center: ${center.toArray().map(v => v.toFixed(1)).join(', ')}`);
    console.log(`Level bounds: ${size.toArray().map(v => v.toFixed(1)).join(', ')}`);
  }
  
  _extractPatrolPoints() {
    this.patrolPoints = [];
    
    this.enemies.forEach((enemy, enemyIndex) => {
      if (enemy.patrolPoints) {
        enemy.patrolPoints.forEach((point, pointIndex) => {
          this.patrolPoints.push({
            position: [point[0], point[1], point[2]],
            waitTime: point[3] || 0.5,
            enemyIndex: enemyIndex,
            pointIndex: pointIndex,
            id: this.nextId++
          });
        });
      }
    });
  }
  
  _createEnemyVisuals() {
    // Clear existing enemy visuals first
    this.enemyMeshes.forEach(mesh => this.scene.remove(mesh));
    this.enemyMeshes = [];
    
    this.enemies.forEach((enemy, index) => {
      const geometry = new THREE.BoxGeometry(1, 1.5, 1);
      const material = new THREE.MeshLambertMaterial({ 
        color: this._getEnemyColor(enemy.type) 
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);
      mesh.userData = { type: 'enemy', index: index, enemyData: enemy };
      mesh.name = `enemy_${index}`;
      
      this.scene.add(mesh);
      this.enemyMeshes.push(mesh);
    });
  }
  
  _createLightVisuals() {
    // Clear existing light visuals first
    this.lightMeshes.forEach(mesh => this.scene.remove(mesh));
    this.lightMeshes = [];
    
    this.lights.forEach((light, index) => {
      const geometry = new THREE.SphereGeometry(0.5, 8, 6);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(light.position[0], light.position[1], light.position[2]);
      mesh.userData = { type: 'light', index: index, lightData: light };
      mesh.name = `light_${index}`;
      
      this.scene.add(mesh);
      this.lightMeshes.push(mesh);
    });
  }
  
  _createColliderVisuals() {
    // Clear existing collider visuals first
    this.colliderMeshes.forEach(mesh => this.scene.remove(mesh));
    this.colliderMeshes = [];
    
    this.colliders.forEach((collider, index) => {
      let geometry;
      
      // Create geometry based on collider type
      if (collider.type === 'box') {
        geometry = new THREE.BoxGeometry(collider.size[0], collider.size[1], collider.size[2]);
      } else if (collider.type === 'sphere') {
        geometry = new THREE.SphereGeometry(collider.size[0], 16, 12);
      } else if (collider.type === 'capsule') {
        geometry = new THREE.CylinderGeometry(collider.size[0], collider.size[0], collider.size[1], 16);
      } else {
        // Default to box
        geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      // Color by material type
      const materialColors = {
        ground: 0x00ff00,  // Green
        wall: 0xff0000,    // Red
        platform: 0x0000ff // Blue
      };
      
      const material = new THREE.MeshBasicMaterial({ 
        color: materialColors[collider.materialType] || 0x888888,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(collider.position[0], collider.position[1], collider.position[2]);
      mesh.userData = { type: 'collider', index: index, colliderData: collider };
      mesh.name = `collider_${index}`;
      
      this.scene.add(mesh);
      this.colliderMeshes.push(mesh);
    });
  }
  
  _highlightSelectedMesh(mesh) {
    // Clear existing highlights
    this.meshOutlines.forEach(outline => this.scene.remove(outline));
    this.meshOutlines = [];
    
    if (!mesh) return;
    
    // Create wireframe outline for selected mesh
    const geometry = mesh.geometry.clone();
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    
    const outline = new THREE.Mesh(geometry, material);
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.scale.copy(mesh.scale);
    outline.scale.multiplyScalar(1.01); // Slightly larger to show outline
    
    this.scene.add(outline);
    this.meshOutlines.push(outline);
  }
  
  _createPatrolPointVisuals() {
    // Clear existing patrol point visuals first
    this.patrolPointMeshes.forEach(mesh => this.scene.remove(mesh));
    this.patrolPointMeshes = [];
    
    this.patrolPoints.forEach((point, index) => {
      const geometry = new THREE.SphereGeometry(0.3, 8, 6);
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(point.position[0], point.position[1], point.position[2]);
      mesh.userData = { type: 'patrol', index: index, patrolData: point };
      mesh.name = `patrol_${index}`;
      
      this.scene.add(mesh);
      this.patrolPointMeshes.push(mesh);
    });
  }
  
  _createPatrolConnections() {
    // Clear existing patrol connections first
    this.patrolConnections.forEach(line => this.scene.remove(line));
    this.patrolConnections = [];
    
    // Group patrol points by enemy
    const enemyPatrolGroups = {};
    this.patrolPoints.forEach(point => {
      if (!enemyPatrolGroups[point.enemyIndex]) {
        enemyPatrolGroups[point.enemyIndex] = [];
      }
      enemyPatrolGroups[point.enemyIndex].push(point);
    });
    
    // Create lines between consecutive patrol points for each enemy
    Object.values(enemyPatrolGroups).forEach(group => {
      if (group.length < 2) return;
      
      group.sort((a, b) => a.pointIndex - b.pointIndex);
      
      for (let i = 0; i < group.length - 1; i++) {
        const start = group[i].position;
        const end = group[i + 1].position;
        
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(start[0], start[1], start[2]),
          new THREE.Vector3(end[0], end[1], end[2])
        ]);
        
        const material = new THREE.LineBasicMaterial({ 
          color: 0xff00ff,
          transparent: true,
          opacity: 0.6
        });
        
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.patrolConnections.push(line);
      }
    });
  }
  
  _getEnemyColor(type) {
    const colors = {
      walker: 0xff0000,    // Red
      runner: 0x00ff00,    // Green
      jumper: 0x0000ff,    // Blue
      flyer: 0xffff00      // Yellow
    };
    return colors[type] || 0x888888;
  }
  
  _createUI() {
    // Create side panel
    const panel = document.createElement('div');
    panel.id = 'editor-panel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      font-family: monospace;
      font-size: 12px;
      overflow-y: auto;
      z-index: 1000;
      box-sizing: border-box;
    `;
    
    // Prevent right-click context menu on UI panel
    panel.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.body.appendChild(panel);
    this.panel = panel;
    
    this._updateUI();
  }
  
  _updateUI() {
    if (!this.panel) return;
    
    const levelSelect = this.levels.map((level, index) => 
      `<option value="${index}" ${index === this.currentLevelIndex ? 'selected' : ''}>${level.name}</option>`
    ).join('');
    
    const enemyTypeOptions = this.enemyTypes.map(type => 
      `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
    ).join('');
    
    const lightTypeOptions = this.lightTypes.map(type => 
      `<option value="${type}">${type}</option>`
    ).join('');
    
    const colliderTypeOptions = this.colliderTypes.map(type => 
      `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
    ).join('');
    
    const materialTypeOptions = this.materialTypes.map(type => 
      `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
    ).join('');
    
    this.panel.innerHTML = `
      <h3>Level Editor</h3>
      
      <div style="margin-bottom: 20px;">
        <label>Current Level:</label><br>
        <select id="level-select" style="width: 100%; padding: 5px;">
          ${levelSelect}
        </select>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label>Edit Mode:</label><br>
        <button id="mode-enemy" class="mode-btn ${this.mode === 'enemy' ? 'active' : ''}">Enemies</button>
        <button id="mode-light" class="mode-btn ${this.mode === 'light' ? 'active' : ''}">Lights</button>
        <button id="mode-patrol" class="mode-btn ${this.mode === 'patrol' ? 'active' : ''}">Patrol</button>
        <button id="mode-mesh" class="mode-btn ${this.mode === 'mesh' ? 'active' : ''}">Meshes</button>
        <button id="mode-collider" class="mode-btn ${this.mode === 'collider' ? 'active' : ''}">Colliders</button>
        <button id="mode-select" class="mode-btn ${this.mode === 'select' ? 'active' : ''}">Select</button>
      </div>
      
      <div id="enemy-controls" style="display: ${this.mode === 'enemy' ? 'block' : 'none'};">
        <h4>Enemy Controls</h4>
        <label>Type:</label><br>
        <select id="enemy-type" style="width: 100%; padding: 5px; margin-bottom: 10px;">
          ${enemyTypeOptions}
        </select>
        <button id="add-enemy" style="width: 100%; padding: 5px;">Add Enemy (Click on level)</button>
        
        <div id="enemy-list">
          <h5>Enemies (${this.enemies.length})</h5>
          ${this.enemies.map((enemy, index) => `
            <div class="item-row" data-type="enemy" data-index="${index}">
              <strong>${enemy.type}</strong> at [${enemy.position.join(', ')}]
              <button onclick="window.editor._deleteEnemy(${index})">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div id="light-controls" style="display: ${this.mode === 'light' ? 'block' : 'none'};">
        <h4>Light Controls</h4>
        <label>Type:</label><br>
        <select id="light-type" style="width: 100%; padding: 5px; margin-bottom: 10px;">
          ${lightTypeOptions}
        </select>
        <button id="add-light" style="width: 100%; padding: 5px;">Add Light (Click on level)</button>
        
        <div id="light-list">
          <h5>Lights (${this.lights.length})</h5>
          ${this.lights.map((light, index) => `
            <div class="item-row" data-type="light" data-index="${index}">
              <strong>${light.type}</strong> at [${light.position.join(', ')}]
              <button onclick="window.editor._deleteLight(${index})">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div id="mesh-controls" style="display: ${this.mode === 'mesh' ? 'block' : 'none'};">
        <h4>Mesh Selection</h4>
        <p>Click on level meshes to select them</p>
        
        <div id="mesh-list">
          <h5>Level Meshes (${this.levelMeshes.length})</h5>
          ${this.levelMeshes.map((meshInfo, index) => `
            <div class="item-row ${this.selectedMesh === meshInfo.mesh ? 'selected' : ''}" 
                 data-type="mesh" data-index="${index}">
              <strong>${meshInfo.name}</strong>
              <button onclick="window.editor._selectMesh(${index})">Select</button>
            </div>
          `).join('')}
        </div>
        
        ${this.selectedMesh ? `
          <div style="margin-top: 15px; padding: 10px; border: 1px solid #444;">
            <h5>Selected: ${this.selectedMesh.name}</h5>
            <button id="create-collider-from-mesh" style="width: 100%; padding: 5px;">
              Create Collider from Mesh
            </button>
          </div>
        ` : ''}
      </div>
      
      <div id="collider-controls" style="display: ${this.mode === 'collider' ? 'block' : 'none'};">
        <h4>Collider Controls</h4>
        
        <label>Type:</label><br>
        <select id="collider-type" style="width: 100%; padding: 5px; margin-bottom: 10px;">
          ${colliderTypeOptions}
        </select>
        
        <label>Material Type:</label><br>
        <select id="material-type" style="width: 100%; padding: 5px; margin-bottom: 10px;">
          ${materialTypeOptions}
        </select>
        
        <button id="add-collider" style="width: 100%; padding: 5px;">Add Collider (Click on level)</button>
        
        <div id="collider-list">
          <h5>Colliders (${this.colliders.length})</h5>
          ${this.colliders.map((collider, index) => `
            <div class="item-row" data-type="collider" data-index="${index}">
              <strong>${collider.type}</strong> (${collider.materialType})<br>
              at [${collider.position.join(', ')}]
              ${collider.meshName ? `<br><small>For: ${collider.meshName}</small>` : ''}
              <button onclick="window.editor._deleteCollider(${index})">Delete</button>
              <button onclick="window.editor._editCollider(${index})">Edit</button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div id="patrol-controls" style="display: ${this.mode === 'patrol' ? 'block' : 'none'};">
        <h4>Patrol Point Controls</h4>
        <p>Select an enemy first, then click to add patrol points</p>
        
        <div id="patrol-list">
          <h5>Patrol Points (${this.patrolPoints.length})</h5>
          ${this.patrolPoints.map((point, index) => `
            <div class="item-row" data-type="patrol" data-index="${index}">
              Enemy ${point.enemyIndex} Point ${point.pointIndex}<br>
              [${point.position.join(', ')}] Wait: ${point.waitTime}s
              <button onclick="window.editor._deletePatrolPoint(${index})">Delete</button>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${this._getSelectionPropertiesHTML()}
      
      <div style="margin-top: 30px;">
        <button id="save-level" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 3px;">
          Save Level
        </button>
      </div>
      
      <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
        <p><strong>Controls:</strong></p>
        <p>WASD - Move camera on X,Z plane</p>
        <p>Q/E - Move camera up/down</p>
        <p>Right-click + drag - Look around</p>
        <p>Mouse wheel - Zoom to center</p>
        <p>Left-click - Place/Select objects</p>
        <p>Delete - Remove selected</p>
        <p><strong>Hotkeys:</strong></p>
        <p>1 - Enemies, 2 - Lights, 3 - Patrol</p>
        <p>4 - Meshes, 5 - Colliders, 6 - Select</p>
      </div>
      
      <style>
        .mode-btn {
          padding: 5px 10px;
          margin: 2px;
          background: #333;
          color: white;
          border: 1px solid #666;
          border-radius: 3px;
          cursor: pointer;
        }
        .mode-btn.active {
          background: #4CAF50;
        }
        .item-row {
          background: #222;
          margin: 5px 0;
          padding: 8px;
          border-radius: 3px;
          font-size: 11px;
        }
        .item-row.selected {
          background: #444;
          border: 1px solid #4CAF50;
        }
        .item-row button {
          float: right;
          padding: 2px 6px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 2px;
          font-size: 10px;
          cursor: pointer;
        }
      </style>
    `;
    
    // Bind UI events
    this._bindUIEvents();
  }
  
  _getSelectionPropertiesHTML() {
    if (!this.selected) {
      return '<div id="selection-properties" style="margin-top: 20px; display: none;"></div>';
    }
    
    const selectedData = this.selected.userData;
    const pos = this.selected.position;
    const rot = this.selected.rotation;
    
    let typeSpecificInputs = '';
    
    // Add type-specific properties
    if (this.selectedType === 'enemy') {
      const enemyData = selectedData.enemyData;
      typeSpecificInputs = `
        <div style="margin-top: 10px;">
          <label style="font-size: 11px;">Enemy Type:</label><br>
          <select id="selected-enemy-type" style="width: 100%; padding: 3px; font-size: 11px;">
            ${this.enemyTypes.map(type => 
              `<option value="${type}" ${type === enemyData.type ? 'selected' : ''}>${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
        <div style="margin-top: 5px;">
          <label style="font-size: 11px;">Speed:</label><br>
          <input type="number" id="selected-speed" value="${enemyData.speed || 2}" step="0.1" min="0" style="width: 100%; padding: 3px; font-size: 11px;">
        </div>
        <div style="margin-top: 5px;">
          <label style="font-size: 11px;">Chase Range:</label><br>
          <input type="number" id="selected-chase-range" value="${enemyData.chaseRange || 5}" step="0.5" min="0" style="width: 100%; padding: 3px; font-size: 11px;">
        </div>
      `;
    } else if (this.selectedType === 'light') {
      const lightData = selectedData.lightData;
      typeSpecificInputs = `
        <div style="margin-top: 10px;">
          <label style="font-size: 11px;">Light Type:</label><br>
          <select id="selected-light-type" style="width: 100%; padding: 3px; font-size: 11px;">
            ${this.lightTypes.map(type => 
              `<option value="${type}" ${type === lightData.type ? 'selected' : ''}>${type}</option>`
            ).join('')}
          </select>
        </div>
      `;
    } else if (this.selectedType === 'collider') {
      const colliderData = selectedData.colliderData;
      typeSpecificInputs = `
        <div style="margin-top: 10px;">
          <label style="font-size: 11px;">Collider Type:</label><br>
          <select id="selected-collider-type" style="width: 100%; padding: 3px; font-size: 11px;">
            ${this.colliderTypes.map(type => 
              `<option value="${type}" ${type === colliderData.type ? 'selected' : ''}>${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
        <div style="margin-top: 5px;">
          <label style="font-size: 11px;">Material Type:</label><br>
          <select id="selected-material-type" style="width: 100%; padding: 3px; font-size: 11px;">
            ${this.materialTypes.map(type => 
              `<option value="${type}" ${type === colliderData.materialType ? 'selected' : ''}>${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
        <div style="margin-top: 5px;">
          <label style="font-size: 11px;">Size:</label><br>
          ${this._getColliderSizeInputs(colliderData)}
        </div>
        ${colliderData.meshName ? `
          <div style="margin-top: 5px;">
            <label style="font-size: 11px;">Associated Mesh:</label><br>
            <span style="font-size: 10px; color: #888;">${colliderData.meshName}</span>
          </div>
        ` : ''}
      `;
    }
    
    return `
      <div id="selection-properties" style="margin-top: 20px; border: 1px solid #444; padding: 10px; border-radius: 3px;">
        <h4 style="margin: 0 0 10px 0; color: #4CAF50;">Selected: ${this.selectedType.charAt(0).toUpperCase() + this.selectedType.slice(1)}</h4>
        
        <div style="margin-bottom: 15px;">
          <h5 style="margin: 0 0 5px 0;">Position</h5>
          <div style="display: flex; gap: 5px;">
            <div>
              <label style="font-size: 10px;">X:</label><br>
              <input type="number" id="selected-pos-x" value="${pos.x.toFixed(2)}" step="0.1" style="width: 60px; padding: 3px; font-size: 11px;">
            </div>
            <div>
              <label style="font-size: 10px;">Y:</label><br>
              <input type="number" id="selected-pos-y" value="${pos.y.toFixed(2)}" step="0.1" style="width: 60px; padding: 3px; font-size: 11px;">
            </div>
            <div>
              <label style="font-size: 10px;">Z:</label><br>
              <input type="number" id="selected-pos-z" value="${pos.z.toFixed(2)}" step="0.1" style="width: 60px; padding: 3px; font-size: 11px;">
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <h5 style="margin: 0 0 5px 0;">Rotation (degrees)</h5>
          <div style="display: flex; gap: 5px;">
            <div>
              <label style="font-size: 10px;">X:</label><br>
              <input type="number" id="selected-rot-x" value="${(rot.x * 180 / Math.PI).toFixed(1)}" step="1" style="width: 60px; padding: 3px; font-size: 11px;">
            </div>
            <div>
              <label style="font-size: 10px;">Y:</label><br>
              <input type="number" id="selected-rot-y" value="${(rot.y * 180 / Math.PI).toFixed(1)}" step="1" style="width: 60px; padding: 3px; font-size: 11px;">
            </div>
            <div>
              <label style="font-size: 10px;">Z:</label><br>
              <input type="number" id="selected-rot-z" value="${(rot.z * 180 / Math.PI).toFixed(1)}" step="1" style="width: 60px; padding: 3px; font-size: 11px;">
            </div>
          </div>
        </div>
        
        ${typeSpecificInputs}
        
        <div style="margin-top: 10px;">
          <button id="apply-properties" style="width: 100%; padding: 5px; background: #2196F3; color: white; border: none; border-radius: 3px; font-size: 11px;">
            Apply Changes
          </button>
          <button id="deselect-object" style="width: 100%; padding: 5px; background: #666; color: white; border: none; border-radius: 3px; font-size: 11px; margin-top: 5px;">
            Deselect
          </button>
        </div>
      </div>
    `;
  }
  
  _getColliderSizeInputs(colliderData) {
    // Check if there's a pending type change from the dropdown
    const colliderTypeSelect = document.getElementById('selected-collider-type');
    const currentType = colliderTypeSelect ? colliderTypeSelect.value : colliderData.type;
    
    if (currentType === 'sphere') {
      return `
        <div>
          <label style="font-size: 10px;">Radius:</label><br>
          <input type="number" id="selected-size-0" value="${colliderData.size[0] || 1}" step="0.1" min="0.1" style="width: 100%; padding: 3px; font-size: 11px;">
        </div>
      `;
    } else if (currentType === 'capsule') {
      return `
        <div style="display: flex; gap: 5px;">
          <div style="flex: 1;">
            <label style="font-size: 10px;">Radius:</label><br>
            <input type="number" id="selected-size-0" value="${colliderData.size[0] || 0.5}" step="0.1" min="0.1" style="width: 100%; padding: 3px; font-size: 11px;">
          </div>
          <div style="flex: 1;">
            <label style="font-size: 10px;">Height:</label><br>
            <input type="number" id="selected-size-1" value="${colliderData.size[1] || 2}" step="0.1" min="0.1" style="width: 100%; padding: 3px; font-size: 11px;">
          </div>
        </div>
      `;
    } else { // box
      return `
        <div style="display: flex; gap: 5px;">
          <div style="flex: 1;">
            <label style="font-size: 10px;">W:</label><br>
            <input type="number" id="selected-size-0" value="${colliderData.size[0] || 1}" step="0.1" min="0.1" style="width: 100%; padding: 3px; font-size: 11px;">
          </div>
          <div style="flex: 1;">
            <label style="font-size: 10px;">H:</label><br>
            <input type="number" id="selected-size-1" value="${colliderData.size[1] || 1}" step="0.1" min="0.1" style="width: 100%; padding: 3px; font-size: 11px;">
          </div>
          <div style="flex: 1;">
            <label style="font-size: 10px;">D:</label><br>
            <input type="number" id="selected-size-2" value="${colliderData.size[2] || 1}" step="0.1" min="0.1" style="width: 100%; padding: 3px; font-size: 11px;">
          </div>
        </div>
      `;
    }
  }
  
  _bindUIEvents() {
    // Level selection
    const levelSelect = document.getElementById('level-select');
    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        this._loadLevel(parseInt(e.target.value));
      });
    }
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.mode = e.target.id.replace('mode-', '');
        this._updateUI();
      });
    });
    
    // Add buttons
    const addEnemyBtn = document.getElementById('add-enemy');
    if (addEnemyBtn) {
      addEnemyBtn.addEventListener('click', () => {
        this.mode = 'enemy';
        this._updateStatus('Click on the level to place an enemy');
      });
    }
    
    const addLightBtn = document.getElementById('add-light');
    if (addLightBtn) {
      addLightBtn.addEventListener('click', () => {
        this.mode = 'light';
        this._updateStatus('Click on the level to place a light');
      });
    }
    
    const addColliderBtn = document.getElementById('add-collider');
    if (addColliderBtn) {
      addColliderBtn.addEventListener('click', () => {
        this.mode = 'collider';
        this._updateStatus('Click on the level to place a collider');
      });
    }
    
    const createColliderFromMeshBtn = document.getElementById('create-collider-from-mesh');
    if (createColliderFromMeshBtn) {
      createColliderFromMeshBtn.addEventListener('click', () => {
        this._createColliderFromSelectedMesh();
      });
    }
    
    // Save button
    const saveBtn = document.getElementById('save-level');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this._saveLevel());
    }
    
    // Selection property buttons
    const applyBtn = document.getElementById('apply-properties');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this._applySelectedProperties());
    }
    
    const deselectBtn = document.getElementById('deselect-object');
    if (deselectBtn) {
      deselectBtn.addEventListener('click', () => this._selectObject(null));
    }
    
    // Collider type change - update size inputs
    const colliderTypeSelect = document.getElementById('selected-collider-type');
    if (colliderTypeSelect) {
      colliderTypeSelect.addEventListener('change', () => {
        this._updateUI(); // Refresh UI to show correct size inputs
      });
    }
  }
  
  _bindEvents() {
    // Mouse events
    this.renderer.domElement.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('wheel', this._onMouseWheel.bind(this));
    
    // Prevent right-click context menu
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Keyboard events
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));
    
    // Window resize
    window.addEventListener('resize', this._onWindowResize.bind(this));
    
    // Expose editor to window for button callbacks
    window.editor = this;
    
    // Start render loop
    this._animate();
  }
  
  _onMouseDown(event) {
    if (event.target !== this.renderer.domElement) return;
    
    this.mouseDown = true;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
    
    // Check if right mouse button for camera rotation
    if (event.button === 2) { // Right mouse button
      this.isRotating = true;
      return;
    }
    
    // Only left mouse button (button === 0) for object placement/selection
    if (event.button === 0) { // Left mouse button only
      if (this.mode !== 'select') {
        this._handlePlacement(event);
      } else {
        this._handleSelection(event);
      }
    }
    // Middle mouse button (button === 1) and other buttons are ignored
  }
  
  _onMouseMove(event) {
    // Only rotate camera when right mouse button is held down
    if (this.isRotating && this.mouseDown) {
      const deltaX = event.clientX - this.lastMousePos.x;
      const deltaY = event.clientY - this.lastMousePos.y;
      
      this.cameraYaw -= deltaX * this.sensitivity;
      this.cameraPitch -= deltaY * this.sensitivity;
      this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch, -Math.PI/2 + 0.1, Math.PI/2 - 0.1);
      
      this._updateCameraRotation();
      
      this.lastMousePos.x = event.clientX;
      this.lastMousePos.y = event.clientY;
    }
  }
  
  _onMouseUp(event) {
    this.mouseDown = false;
    this.isRotating = false;
  }
  
  _onMouseWheel(event) {
    event.preventDefault();
    
    // Get the center of the screen for zoom direction
    const rect = this.renderer.domElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Cast ray from center of screen
    const mouse = new THREE.Vector2(0, 0); // Center of screen
    this.raycaster.setFromCamera(mouse, this.camera);
    
    // Get the direction to zoom towards
    const zoomDirection = this.raycaster.ray.direction.clone();
    const zoomAmount = event.deltaY > 0 ? -2 : 2; // Inverted: scroll down = zoom in, scroll up = zoom out
    
    // Move camera towards/away from the center point
    this.camera.position.add(zoomDirection.multiplyScalar(zoomAmount));
  }
  
  _onKeyDown(event) {
    this.keys[event.code] = true;
    
    // Delete selected object
    if (event.code === 'Delete' && this.selected) {
      this._deleteSelected();
    }
    
    // Mode switching
    if (event.code === 'Digit1') this.mode = 'enemy';
    if (event.code === 'Digit2') this.mode = 'light';
    if (event.code === 'Digit3') this.mode = 'patrol';
    if (event.code === 'Digit4') this.mode = 'mesh';
    if (event.code === 'Digit5') this.mode = 'collider';
    if (event.code === 'Digit6') this.mode = 'select';
    
    this._updateUI();
  }
  
  _onKeyUp(event) {
    this.keys[event.code] = false;
  }
  
  _onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  _updateCameraRotation() {
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, 'YXZ');
    quaternion.setFromEuler(euler);
    this.camera.quaternion.copy(quaternion);
  }
  
  _handleCameraMovement(delta) {
    const moveVector = new THREE.Vector3();
    
    // Only move on X,Z plane - ignore camera rotation for movement
    if (this.keys['KeyW']) moveVector.z -= 1; // Forward
    if (this.keys['KeyS']) moveVector.z += 1; // Backward  
    if (this.keys['KeyA']) moveVector.x -= 1; // Left
    if (this.keys['KeyD']) moveVector.x += 1; // Right
    if (this.keys['KeyQ']) moveVector.y -= 1; // Down
    if (this.keys['KeyE']) moveVector.y += 1; // Up
    
    if (moveVector.length() > 0) {
      moveVector.normalize();
      
      // For X,Z movement, only apply Y rotation (yaw), not pitch
      if (moveVector.x !== 0 || moveVector.z !== 0) {
        const yawQuaternion = new THREE.Quaternion();
        yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
        
        const xzMovement = new THREE.Vector3(moveVector.x, 0, moveVector.z);
        xzMovement.applyQuaternion(yawQuaternion);
        moveVector.x = xzMovement.x;
        moveVector.z = xzMovement.z;
      }
      
      moveVector.multiplyScalar(this.moveSpeed * delta);
      this.camera.position.add(moveVector);
    }
  }
  
  _handlePlacement(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Get intersection with level geometry or ground plane
    const intersects = this.raycaster.intersectObjects([
      ...this.levelGeometry.children,
      this.groundPlane
    ], true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      
      switch (this.mode) {
        case 'enemy':
          this._addEnemy(point);
          break;
        case 'light':
          this._addLight(point);
          break;
        case 'patrol':
          this._addPatrolPoint(point);
          break;
        case 'collider':
          this._addCollider(point);
          break;
        case 'mesh':
          // In mesh mode, try to select a mesh
          this._handleMeshSelection(event);
          break;
      }
    }
  }
  
  _handleSelection(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const selectableObjects = [
      ...this.enemyMeshes,
      ...this.lightMeshes,
      ...this.patrolPointMeshes,
      ...this.colliderMeshes
    ];
    
    const intersects = this.raycaster.intersectObjects(selectableObjects);
    
    if (intersects.length > 0) {
      this._selectObject(intersects[0].object);
    } else {
      this._selectObject(null);
    }
  }
  
  _handleMeshSelection(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Only intersect with level meshes
    const levelMeshes = this.levelMeshes.map(info => info.mesh);
    const intersects = this.raycaster.intersectObjects(levelMeshes);
    
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const meshInfo = this.levelMeshes.find(info => info.mesh === clickedMesh);
      if (meshInfo) {
        this.selectedMesh = meshInfo;
        this._highlightSelectedMesh(clickedMesh);
        this._updateUI();
        this._updateStatus(`Selected mesh: ${meshInfo.name}`);
      }
    }
  }
  
  _addEnemy(position) {
    const enemyTypeSelect = document.getElementById('enemy-type');
    const type = enemyTypeSelect ? enemyTypeSelect.value : 'walker';
    
    const enemy = {
      type: type,
      position: [position.x, position.y, position.z],
      modelUrl: this._getDefaultModelUrl(type),
      patrolPoints: [],
      speed: this._getDefaultSpeed(type),
      chaseRange: 5,
      id: this.nextId++
    };
    
    this.enemies.push(enemy);
    this._createEnemyVisuals();
    this._updateUI();
    this._updateStatus(`Added ${type} enemy at [${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}]`);
  }
  
  _addLight(position) {
    const lightTypeSelect = document.getElementById('light-type');
    const type = lightTypeSelect ? lightTypeSelect.value : 'BasicLights';
    
    const light = {
      type: type,
      position: [position.x, position.y, position.z],
      id: this.nextId++
    };
    
    this.lights.push(light);
    this._createLightVisuals();
    this._updateUI();
    this._updateStatus(`Added ${type} light at [${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}]`);
  }
  
  _addPatrolPoint(position) {
    if (!this.selected || this.selectedType !== 'enemy') {
      this._updateStatus('Select an enemy first to add patrol points');
      return;
    }
    
    const enemyIndex = this.selected.userData.index;
    const enemy = this.enemies[enemyIndex];
    
    if (!enemy.patrolPoints) enemy.patrolPoints = [];
    
    const pointIndex = enemy.patrolPoints.length;
    enemy.patrolPoints.push([position.x, position.y, position.z, 0.5]);
    
    // Update patrol points and visuals
    this._extractPatrolPoints();
    this._clearVisualRepresentations();
    this._createEnemyVisuals();
    this._createLightVisuals();
    this._createColliderVisuals();
    this._createPatrolPointVisuals();
    this._createPatrolConnections();
    
    this._updateUI();
    this._updateStatus(`Added patrol point ${pointIndex} for enemy ${enemyIndex}`);
  }
  
  _addCollider(position) {
    const typeSelect = document.getElementById('collider-type');
    const materialSelect = document.getElementById('material-type');
    
    const type = typeSelect ? typeSelect.value : 'box';
    const materialType = materialSelect ? materialSelect.value : 'ground';
    
    // Default sizes based on type
    let size;
    switch (type) {
      case 'sphere':
        size = [1]; // radius
        break;
      case 'capsule':
        size = [0.5, 2]; // radius, height
        break;
      default: // box
        size = [2, 2, 2]; // width, height, depth
    }
    
    const collider = {
      id: `collider_${this.nextId}`,
      type: type,
      position: [position.x, position.y, position.z],
      size: size,
      materialType: materialType,
      meshName: this.selectedMesh ? this.selectedMesh.name : null
    };
    
    this.colliders.push(collider);
    this.nextId++;
    
    this._createColliderVisuals();
    this._updateUI();
    this._updateStatus(`Added ${type} collider at [${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}]`);
  }
  
  _selectMesh(index) {
    if (index >= 0 && index < this.levelMeshes.length) {
      this.selectedMesh = this.levelMeshes[index];
      this._highlightSelectedMesh(this.selectedMesh.mesh);
      this._updateUI();
      this._updateStatus(`Selected mesh: ${this.selectedMesh.name}`);
    }
  }
  
  _createColliderFromSelectedMesh() {
    if (!this.selectedMesh) {
      this._updateStatus('No mesh selected');
      return;
    }
    
    const mesh = this.selectedMesh.mesh;
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    const materialSelect = document.getElementById('material-type');
    const materialType = materialSelect ? materialSelect.value : 'ground';
    
    const collider = {
      id: `collider_${this.nextId}`,
      type: 'box', // Default to box for mesh-based colliders
      position: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z],
      materialType: materialType,
      meshName: this.selectedMesh.name
    };
    
    this.colliders.push(collider);
    this.nextId++;
    
    this._createColliderVisuals();
    this._updateUI();
    this._updateStatus(`Created collider for mesh: ${this.selectedMesh.name}`);
  }
  
  _deleteCollider(index) {
    if (index >= 0 && index < this.colliders.length) {
      // Clear selection if we're deleting the selected collider
      if (this.selected && this.selectedType === 'collider' && this.selected.userData.index === index) {
        this.selected = null;
        this.selectedType = null;
      }
      
      this.colliders.splice(index, 1);
      this._createColliderVisuals();
      this._updateUI();
      this._updateStatus('Collider deleted');
    }
  }
  
  _editCollider(index) {
    if (index >= 0 && index < this.colliders.length) {
      const collider = this.colliders[index];
      
      // For now, just select the collider mesh for visual feedback
      const colliderMesh = this.colliderMeshes[index];
      if (colliderMesh) {
        this._selectObject(colliderMesh);
      }
      
      this._updateStatus(`Editing collider: ${collider.id}. Use properties panel to modify.`);
    }
  }
  
  _selectObject(object) {
    // Clear previous selection
    if (this.selected && this.selected.material && this.selected.material.emissive) {
      this.selected.material.emissive.setHex(0x000000);
    }
    
    this.selected = object;
    this.selectedType = object ? object.userData.type : null;
    
    if (this.selected && this.selected.material && this.selected.material.emissive) {
      this.selected.material.emissive.setHex(0x444444);
    }
    
    // Refresh UI to show/hide selection properties
    this._updateUI();
  }
  
  _applySelectedProperties() {
    if (!this.selected) return;
    
    // Get position inputs
    const posX = document.getElementById('selected-pos-x');
    const posY = document.getElementById('selected-pos-y');
    const posZ = document.getElementById('selected-pos-z');
    
    // Get rotation inputs
    const rotX = document.getElementById('selected-rot-x');
    const rotY = document.getElementById('selected-rot-y');
    const rotZ = document.getElementById('selected-rot-z');
    
    if (posX && posY && posZ) {
      // Update visual mesh position
      this.selected.position.set(
        parseFloat(posX.value),
        parseFloat(posY.value),
        parseFloat(posZ.value)
      );
      
      // Update data array position
      const index = this.selected.userData.index;
      if (this.selectedType === 'enemy' && this.enemies[index]) {
        this.enemies[index].position = [
          parseFloat(posX.value),
          parseFloat(posY.value),
          parseFloat(posZ.value)
        ];
      } else if (this.selectedType === 'light' && this.lights[index]) {
        this.lights[index].position = [
          parseFloat(posX.value),
          parseFloat(posY.value),
          parseFloat(posZ.value)
        ];
      } else if (this.selectedType === 'patrol' && this.patrolPoints[index]) {
        this.patrolPoints[index].position = [
          parseFloat(posX.value),
          parseFloat(posY.value),
          parseFloat(posZ.value)
        ];
        
        // Update the corresponding enemy's patrol point array
        const patrolData = this.patrolPoints[index];
        const enemy = this.enemies[patrolData.enemyIndex];
        if (enemy && enemy.patrolPoints && enemy.patrolPoints[patrolData.pointIndex]) {
          enemy.patrolPoints[patrolData.pointIndex][0] = parseFloat(posX.value);
          enemy.patrolPoints[patrolData.pointIndex][1] = parseFloat(posY.value);
          enemy.patrolPoints[patrolData.pointIndex][2] = parseFloat(posZ.value);
        }
      } else if (this.selectedType === 'collider' && this.colliders[index]) {
        this.colliders[index].position = [
          parseFloat(posX.value),
          parseFloat(posY.value),
          parseFloat(posZ.value)
        ];
      }
    }
    
    if (rotX && rotY && rotZ) {
      // Update visual mesh rotation (convert degrees to radians)
      this.selected.rotation.set(
        parseFloat(rotX.value) * Math.PI / 180,
        parseFloat(rotY.value) * Math.PI / 180,
        parseFloat(rotZ.value) * Math.PI / 180
      );
    }
    
    // Handle type-specific properties
    if (this.selectedType === 'enemy') {
      const enemyTypeSelect = document.getElementById('selected-enemy-type');
      const speedInput = document.getElementById('selected-speed');
      const chaseRangeInput = document.getElementById('selected-chase-range');
      
      const index = this.selected.userData.index;
      if (this.enemies[index]) {
        if (enemyTypeSelect) {
          this.enemies[index].type = enemyTypeSelect.value;
          this.enemies[index].modelUrl = this._getDefaultModelUrl(enemyTypeSelect.value);
          
          // Update visual color
          if (this.selected.material && this.selected.material.color) {
            this.selected.material.color.setHex(this._getEnemyColor(enemyTypeSelect.value));
          }
        }
        if (speedInput) {
          this.enemies[index].speed = parseFloat(speedInput.value);
        }
        if (chaseRangeInput) {
          this.enemies[index].chaseRange = parseFloat(chaseRangeInput.value);
        }
      }
    } else if (this.selectedType === 'light') {
      const lightTypeSelect = document.getElementById('selected-light-type');
      
      const index = this.selected.userData.index;
      if (this.lights[index] && lightTypeSelect) {
        this.lights[index].type = lightTypeSelect.value;
      }
    } else if (this.selectedType === 'collider') {
      const colliderTypeSelect = document.getElementById('selected-collider-type');
      const materialTypeSelect = document.getElementById('selected-material-type');
      
      const index = this.selected.userData.index;
      const collider = this.colliders[index];
      
      if (collider) {
        let needsVisualUpdate = false;
        
        // Update collider type
        if (colliderTypeSelect && colliderTypeSelect.value !== collider.type) {
          collider.type = colliderTypeSelect.value;
          // Reset size array for new type
          if (collider.type === 'sphere') {
            collider.size = [1]; // radius
          } else if (collider.type === 'capsule') {
            collider.size = [0.5, 2]; // radius, height
          } else { // box
            collider.size = [2, 2, 2]; // width, height, depth
          }
          needsVisualUpdate = true;
        }
        
        // Update material type
        if (materialTypeSelect && materialTypeSelect.value !== collider.materialType) {
          collider.materialType = materialTypeSelect.value;
          needsVisualUpdate = true;
        }
        
        // Update size based on inputs
        const sizeInputs = [];
        for (let i = 0; i < 3; i++) {
          const input = document.getElementById(`selected-size-${i}`);
          if (input) {
            sizeInputs.push(parseFloat(input.value));
          }
        }
        
        if (sizeInputs.length > 0) {
          if (collider.type === 'sphere') {
            collider.size = [sizeInputs[0] || 1];
          } else if (collider.type === 'capsule') {
            collider.size = [sizeInputs[0] || 0.5, sizeInputs[1] || 2];
          } else { // box
            collider.size = [
              sizeInputs[0] || 1,
              sizeInputs[1] || 1,
              sizeInputs[2] || 1
            ];
          }
          needsVisualUpdate = true;
        }
        
        // Recreate collider visuals if anything changed
        if (needsVisualUpdate) {
          this._createColliderVisuals();
          // Re-select the updated collider mesh
          const updatedMesh = this.colliderMeshes[index];
          if (updatedMesh) {
            this._selectObject(updatedMesh);
          }
        }
      }
    }
    
    // Recreate patrol connections if patrol point was moved
    if (this.selectedType === 'patrol') {
      this.patrolConnections.forEach(line => this.scene.remove(line));
      this.patrolConnections = [];
      this._createPatrolConnections();
    }
    
    this._updateStatus('Properties updated successfully');
  }
  
  _deleteSelected() {
    if (!this.selected) return;
    
    const index = this.selected.userData.index;
    
    switch (this.selectedType) {
      case 'enemy':
        this._deleteEnemy(index);
        break;
      case 'light':
        this._deleteLight(index);
        break;
      case 'patrol':
        this._deletePatrolPoint(index);
        break;
      case 'collider':
        this._deleteCollider(index);
        break;
    }
  }
  
  _deleteEnemy(index) {
    if (index >= 0 && index < this.enemies.length) {
      this.enemies.splice(index, 1);
      this._extractPatrolPoints(); // Update patrol points
      this._clearVisualRepresentations();
      this._createEnemyVisuals();
      this._createLightVisuals();
      this._createColliderVisuals();
      this._createPatrolPointVisuals();
      this._createPatrolConnections();
      this._updateUI();
      this.selected = null;
      this.selectedType = null;
    }
  }
  
  _deleteLight(index) {
    if (index >= 0 && index < this.lights.length) {
      this.lights.splice(index, 1);
      this._createLightVisuals();
      this._updateUI();
      this.selected = null;
      this.selectedType = null;
    }
  }
  
  _deletePatrolPoint(index) {
    if (index >= 0 && index < this.patrolPoints.length) {
      const point = this.patrolPoints[index];
      const enemy = this.enemies[point.enemyIndex];
      
      if (enemy && enemy.patrolPoints) {
        enemy.patrolPoints.splice(point.pointIndex, 1);
        this._extractPatrolPoints();
        this._clearVisualRepresentations();
        this._createEnemyVisuals();
        this._createLightVisuals();
        this._createColliderVisuals();
        this._createPatrolPointVisuals();
        this._createPatrolConnections();
        this._updateUI();
        this.selected = null;
        this.selectedType = null;
      }
    }
  }
  
  _getDefaultModelUrl(type) {
    const urls = {
      walker: 'src/assets/low_poly_female/scene.gltf',
      runner: 'src/assets/low_poly_male/scene.gltf',
      jumper: 'src/assets/low_poly_female/scene.gltf',
      flyer: 'src/assets/futuristic_flying_animated_robot_-_low_poly/scene.gltf'
    };
    return urls[type] || urls.walker;
  }
  
  _getDefaultSpeed(type) {
    const speeds = {
      walker: 2.4,
      runner: 4.0,
      jumper: 2.0,
      flyer: 2.5
    };
    return speeds[type] || 2.0;
  }
  
  _saveLevel() {
    if (!this.currentLevel) return;
    
    // Update current level data
    this.currentLevel.enemies = [...this.enemies];
    this.currentLevel.lights = this.lights.map(light => light.type);
    this.currentLevel.colliders = [...this.colliders];
    
    // Generate levelData.js content
    const levelDataContent = this._generateLevelDataJS();
    
    // Create and download file
    const blob = new Blob([levelDataContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'levelData.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this._updateStatus('Level data saved! Replace src/game/levelData.js with the downloaded file.');
  }
  
  _generateLevelDataJS() {
    const levelsJSON = JSON.stringify(this.levels, null, 2);
    return `// Data-driven level definitions with GLTF geometry loading
export const levels = ${levelsJSON};`;
  }
  
  _updateStatus(message = '') {
    if (!this.statusElement) return;
    
    const currentLevel = this.currentLevel ? this.currentLevel.name : 'No Level';
    const mode = this.mode.charAt(0).toUpperCase() + this.mode.slice(1);
    
    this.statusElement.innerHTML = `
      <strong>Level Editor</strong><br>
      Level: ${currentLevel}<br>
      Mode: ${mode}<br>
      Enemies: ${this.enemies.length} | Lights: ${this.lights.length} | Patrol: ${this.patrolPoints.length}<br>
      ${message}
    `;
  }
  
  _animate() {
    requestAnimationFrame(this._animate.bind(this));
    
    const delta = 0.016; // Approximately 60fps
    
    // Handle camera movement
    this._handleCameraMovement(delta);
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
}