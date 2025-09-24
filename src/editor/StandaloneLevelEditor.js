import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

// Standalone Level Editor - Independent from the game
// Features:
// - Full scene management
// - Free camera controls (WASD + mouse look)
// - Side panel for editing
// - Create platforms, enemies, lights, patrol points
// - Import/Export JSON levels
// - No game dependencies

export class StandaloneLevelEditor {
  constructor(container, statusElement) {
    this.container = container;
    this.statusElement = statusElement;
    
    // Initialize THREE.js scene
    this._initScene();
    
    // Editor state
    this.mode = 'platform'; // platform | enemy | light | patrol | select
    this.enabled = true; // Always enabled in standalone mode
    
    // Data storage
    this.platforms = [];
    this.walls = [];
    this.enemies = [];
    this.lights = [];
    this.patrolPoints = [];
    
    // Selection system
    this.selected = null;
    this.selectedType = null;
    
    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Input state
    this.keys = {};
    this.mouseDown = false;
    this.mouseDelta = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    
    // ID counter
    this.nextId = 1;
    
    // Create UI and bind events
    this._createUI();
    this._bindEvents();
    this._addBasicLighting();
    
    // Update status
    this._updateStatus();
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
    // Calculate yaw and pitch from the lookAt direction to maintain initial view
    const lookDirection = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), this.camera.position).normalize();
    this.cameraYaw = Math.atan2(lookDirection.x, lookDirection.z);
    this.cameraPitch = Math.asin(THREE.MathUtils.clamp(lookDirection.y, -1, 1));
    this.sensitivity = 0.002;
    this.moveSpeed = 15;
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87CEEB);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  _addBasicLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
    
    // Add a ground grid for reference
    const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
    this.scene.add(gridHelper);
  }
  
  _createUI() {
    // Main editor panel (right side)
    this.panel = document.createElement('div');
    this.panel.id = 'standaloneLevelEditorPanel';
    Object.assign(this.panel.style, {
      position: 'fixed',
      right: '0',
      top: '0',
      width: '320px',
      height: '100vh',
      background: 'rgba(15, 15, 20, 0.95)',
      color: '#fff',
      fontFamily: 'system-ui',
      fontSize: '14px',
      overflowY: 'auto',
      borderLeft: '1px solid #444',
      zIndex: 10000,
      display: 'block' // Always visible in standalone mode
    });
    
    document.body.appendChild(this.panel);
    
    this._createModeSelector();
    this._createPropertiesPanel();
    this._createToolsSection();
  }
  
  _createModeSelector() {
    const section = document.createElement('div');
    Object.assign(section.style, {
      padding: '20px',
      borderBottom: '1px solid #333'
    });
    
    const title = document.createElement('h3');
    title.textContent = 'Creation Mode';
    title.style.margin = '0 0 15px 0';
    title.style.color = '#fff';
    section.appendChild(title);
    
    const modes = [
      { key: 'platform', label: 'Platform', color: '#4CAF50' },
      { key: 'wall', label: 'Wall', color: '#795548' },
      { key: 'walker', label: 'Walker Enemy', color: '#F44336' },
      { key: 'runner', label: 'Runner Enemy', color: '#FF5722' },
      { key: 'jumper', label: 'Jumper Enemy', color: '#E91E63' },
      { key: 'flyer', label: 'Flyer Enemy', color: '#9C27B0' },
      { key: 'patrol', label: 'Patrol Point', color: '#673AB7' },
      { key: 'light', label: 'Light', color: '#FFC107' },
      { key: 'select', label: 'Select', color: '#2196F3' }
    ];
    
    modes.forEach(mode => {
      const button = document.createElement('button');
      button.textContent = mode.label;
      Object.assign(button.style, {
        display: 'block',
        width: '100%',
        padding: '10px',
        margin: '5px 0',
        border: 'none',
        borderRadius: '4px',
        background: this.mode === mode.key ? mode.color : '#333',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '13px'
      });
      
      button.addEventListener('click', () => {
        this._setMode(mode.key);
        // Update button colors
        modes.forEach(m => {
          const btn = section.querySelector(`button:nth-child(${modes.indexOf(m) + 2})`);
          btn.style.background = this.mode === m.key ? m.color : '#333';
        });
      });
      
      section.appendChild(button);
    });
    
    this.panel.appendChild(section);
  }
  
  _createPropertiesPanel() {
    this.propertiesSection = document.createElement('div');
    Object.assign(this.propertiesSection.style, {
      padding: '20px',
      borderBottom: '1px solid #333'
    });
    
    const title = document.createElement('h3');
    title.textContent = 'Properties';
    title.style.margin = '0 0 15px 0';
    title.style.color = '#fff';
    this.propertiesSection.appendChild(title);
    
    this.propertiesContent = document.createElement('div');
    this.propertiesContent.innerHTML = '<p style=\"color: #888; margin: 0;\">Select an object to edit its properties</p>';
    this.propertiesSection.appendChild(this.propertiesContent);
    
    this.panel.appendChild(this.propertiesSection);
  }
  
  _createToolsSection() {
    const section = document.createElement('div');
    Object.assign(section.style, {
      padding: '20px'
    });
    
    const title = document.createElement('h3');
    title.textContent = 'Tools';
    title.style.margin = '0 0 15px 0';
    title.style.color = '#fff';
    section.appendChild(title);
    
    // Clear Scene button
    const clearBtn = this._createButton('Clear Scene', '#f44336', () => {
      if (confirm('Clear all objects? This cannot be undone.')) {
        this._clearScene();
      }
    });
    section.appendChild(clearBtn);
    
    // Export Level button
    const exportBtn = this._createButton('Export Level', '#4CAF50', () => {
      this._exportLevel();
    });
    section.appendChild(exportBtn);
    
    // Import Level button
    const importBtn = this._createButton('Import Level', '#2196F3', () => {
      this._importLevel();
    });
    section.appendChild(importBtn);
    
    // Instructions
    const instructions = document.createElement('div');
    instructions.style.marginTop = '20px';
    instructions.style.fontSize = '12px';
    instructions.style.color = '#888';
    instructions.innerHTML = `
      <strong>Controls:</strong><br>
      • WASD: Move camera<br>
      • Mouse: Look around<br>
      • Click: Place objects<br>
      • Click object: Select<br>
      • Delete: Remove selected<br>
      • Scroll: Adjust values
    `;
    section.appendChild(instructions);
    
    this.panel.appendChild(section);
  }
  
  _createButton(text, color, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    Object.assign(button.style, {
      display: 'block',
      width: '100%',
      padding: '10px',
      margin: '5px 0',
      border: 'none',
      borderRadius: '4px',
      background: color,
      color: '#fff',
      cursor: 'pointer',
      fontSize: '13px'
    });
    button.addEventListener('click', onClick);
    return button;
  }
  
  _bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      // Delete selected object
      if (e.code === 'Delete' && this.selected) {
        this._deleteSelected();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    
    // Mouse events
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      
      // Only handle placement/selection on left click
      if (e.button === 0) {
        this._handleClick(e);
      }
    });
    
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    
    window.addEventListener('mousemove', (e) => {
      if (this.mouseDown) {
        this.mouseDelta.x = e.clientX - this.lastMousePos.x;
        this.mouseDelta.y = e.clientY - this.lastMousePos.y;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
      }
    });
    
    // Prevent context menu
    this.renderer.domElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  _handleClick(event) {
    // Update mouse coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    if (this.mode === 'select') {
      this._handleSelection();
    } else {
      this._handlePlacement();
    }
  }
  
  _handleSelection() {
    // Check for object selection
    const allObjects = [
      ...this.platforms.map(p => ({ ...p, type: 'platform' })),
      ...this.walls.map(w => ({ ...w, type: 'wall' })),
      ...this.enemies.map(e => ({ ...e, type: 'enemy' })),
      ...this.lights.map(l => ({ ...l, type: 'light', mesh: l.helper })),
      ...this.patrolPoints.map(pp => ({ ...pp, type: 'patrol' }))
    ];
    
    const meshes = allObjects.map(obj => obj.mesh).filter(mesh => mesh);
    const intersects = this.raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object;
      const obj = allObjects.find(o => o.mesh === intersectedMesh);
      if (obj) {
        this._selectObject(obj, obj.type);
      }
    } else {
      this._deselect();
    }
  }
  
  _handlePlacement() {
    // Cast ray to find placement position
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let position;
    
    if (intersects.length > 0) {
      position = intersects[0].point;
    } else {
      // Place at camera forward direction
      const forward = new THREE.Vector3(0, 0, -10);
      forward.applyQuaternion(this.camera.quaternion);
      position = this.camera.position.clone().add(forward);
    }
    
    // Simple grid snapping with overlap avoidance
    position = this._snapToGrid(position);
    
    switch (this.mode) {
      case 'platform':
        this._createPlatform(position);
        break;
      case 'wall':
        this._createWall(position);
        break;
      case 'walker':
        this._createEnemy(position, 'walker');
        break;
      case 'runner':
        this._createEnemy(position, 'runner');
        break;
      case 'jumper':
        this._createEnemy(position, 'jumper');
        break;
      case 'flyer':
        this._createEnemy(position, 'flyer');
        break;
      case 'patrol':
        this._createPatrolPoint(position);
        break;
      case 'light':
        this._createLight(position);
        break;
    }
  }
  
  _snapToGrid(position) {
    // Snap to grid
    const gridPosition = new THREE.Vector3(
      Math.round(position.x),
      Math.round(position.y),
      Math.round(position.z)
    );
    
    // Check for overlaps and find a safe grid position if needed
    const safePosition = this._findSafeGridPosition(gridPosition, 2, 1, 2); // Default platform size
    
    return safePosition;
  }
  
  _findSafeGridPosition(position, width, height, depth) {
    // Check if the desired grid position is free
    if (!this._hasOverlapAtPosition(position, width, height, depth)) {
      return position; // Perfect - no overlap at desired position
    }
    
    console.log('Grid position occupied, finding alternative...');
    
    // Systematically search for free grid positions in expanding spiral
    for (let radius = 1; radius <= 20; radius++) {
      // Try positions in a grid pattern around the original position
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          // Only check the perimeter of current radius (not interior points already checked)
          if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;
          
          const testPos = new THREE.Vector3(
            position.x + dx,
            position.y,
            position.z + dz
          );
          
          if (!this._hasOverlapAtPosition(testPos, width, height, depth)) {
            return testPos; // Found a free grid position
          }
        }
      }
      
      // Also try different Y levels at the original X,Z
      const abovePos = new THREE.Vector3(position.x, position.y + radius, position.z);
      const belowPos = new THREE.Vector3(position.x, position.y - radius, position.z);
      
      if (!this._hasOverlapAtPosition(abovePos, width, height, depth)) {
        return abovePos;
      }
      if (position.y - radius >= 0 && !this._hasOverlapAtPosition(belowPos, width, height, depth)) {
        return belowPos;
      }
    }
    
    // Last resort - return original position with warning
    console.warn('Could not find safe grid position, placing anyway');
    return position;
  }
  
  _hasOverlapAtPosition(position, width, height, depth) {
    const newBounds = {
      minX: position.x - width / 2,
      maxX: position.x + width / 2,
      minY: position.y - height / 2,
      maxY: position.y + height / 2,
      minZ: position.z - depth / 2,
      maxZ: position.z + depth / 2
    };
    
    // Check for overlap with each existing platform and wall
    const allStructures = [...this.platforms, ...this.walls];
    for (const structure of allStructures) {
      const structurePos = structure.mesh.position;
      const structureSize = structure.data.size;
      const existingBounds = {
        minX: structurePos.x - structureSize[0] / 2,
        maxX: structurePos.x + structureSize[0] / 2,
        minY: structurePos.y - structureSize[1] / 2,
        maxY: structurePos.y + structureSize[1] / 2,
        minZ: structurePos.z - structureSize[2] / 2,
        maxZ: structurePos.z + structureSize[2] / 2
      };
      
      // Check if bounds overlap
      const overlapsX = newBounds.maxX > existingBounds.minX && newBounds.minX < existingBounds.maxX;
      const overlapsY = newBounds.maxY > existingBounds.minY && newBounds.minY < existingBounds.maxY;
      const overlapsZ = newBounds.maxZ > existingBounds.minZ && newBounds.minZ < existingBounds.maxZ;
      
      if (overlapsX && overlapsY && overlapsZ) {
        return true; // Overlap detected
      }
    }
    
    return false; // No overlap
  }
  
  _createPlatform(position) {
    const id = this.nextId++;
    const geometry = new THREE.BoxGeometry(12, 1, 12);
    const material = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id, type: 'platform' };
    
    this.scene.add(mesh);
    
    const platformData = {
      id,
      mesh,
      data: {
        position: [position.x, position.y, position.z],
        size: [12, 1, 12],
        rotation: [0, 0, 0],
        color: 0x2e8b57
      }
    };
    
    this.platforms.push(platformData);
    this._updateStatus();
  }
  
  _createWall(position) {
    const id = this.nextId++;
    const geometry = new THREE.BoxGeometry(12, 4, 12); // Tall and narrow for walls
    const material = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Brown color
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id, type: 'wall' };
    
    this.scene.add(mesh);
    
    const wallData = {
      id,
      mesh,
      data: {
        position: [position.x, position.y, position.z],
        size: [1, 4, 1],
        rotation: [0, 0, 0],
        color: 0x8b4513
      }
    };
    
    this.walls.push(wallData);
    this._updateStatus();
  }
  
  _createEnemy(position, enemyType = 'walker') {
    const id = this.nextId++;
    
    // Different visuals for different enemy types
    const enemyConfig = {
      walker: { geometry: new THREE.ConeGeometry(0.5, 2), color: 0xff4444, speed: 2.4 },
      runner: { geometry: new THREE.ConeGeometry(0.4, 1.8), color: 0xff5722, speed: 4.0 },
      jumper: { geometry: new THREE.CylinderGeometry(0.4, 0.4, 1.5), color: 0xe91e63, speed: 2.0 },
      flyer: { geometry: new THREE.OctahedronGeometry(0.6), color: 0x9c27b0, speed: 2.5 }
    };
    
    const config = enemyConfig[enemyType] || enemyConfig.walker;
    const geometry = config.geometry;
    const material = new THREE.MeshLambertMaterial({ color: config.color });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.userData = { id, type: 'enemy', enemyType };
    
    this.scene.add(mesh);
    
    const enemyData = {
      id,
      mesh,
      data: {
        type: enemyType,
        position: [position.x, position.y, position.z],
        rotation: [0, 0, 0],
        patrolPoints: [],
        speed: config.speed,
        modelUrl: this._getModelUrl(enemyType)
      }
    };
    
    this.enemies.push(enemyData);
    this._updateStatus();
  }
  
  _getModelUrl(enemyType) {
    const modelPaths = {
      walker: 'src/assets/low_poly_female/scene.gltf',
      runner: 'src/assets/low_poly_male/scene.gltf',
      jumper: 'src/assets/low_poly_school_boy_zombie_apocalypse_rigged/scene.gltf',
      flyer: 'src/assets/futuristic_flying_animated_robot_-_low_poly/scene.gltf'
    };
    return modelPaths[enemyType] || modelPaths.walker;
  }
  
  _createLight(position) {
    const id = this.nextId++;
    const light = new THREE.PointLight(0xffffff, 1, 20);
    light.position.copy(position);
    light.castShadow = true;
    
    // Visual helper
    const helper = new THREE.PointLightHelper(light, 0.5);
    light.userData = { id, type: 'light' };
    helper.userData = { id, type: 'light' };
    
    this.scene.add(light);
    this.scene.add(helper);
    
    const lightData = {
      id,
      light,
      helper,
      data: {
        type: 'point',
        position: [position.x, position.y, position.z],
        color: 0xffffff,
        intensity: 1
      }
    };
    
    this.lights.push(lightData);
    this._updateStatus();
  }
  
  _createPatrolPoint(position) {
    const id = this.nextId++;
    const geometry = new THREE.SphereGeometry(0.3);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x673ab7,
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    mesh.userData = { id, type: 'patrol' };
    
    this.scene.add(mesh);
    
    // Find the nearest enemy to link this patrol point to
    let nearestEnemyId = null;
    let minDistance = Infinity;
    
    for (const enemy of this.enemies) {
      const distance = position.distanceTo(enemy.mesh.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestEnemyId = enemy.id;
      }
    }
    
    const patrolData = {
      id,
      mesh,
      data: {
        position: [position.x, position.y, position.z],
        waitTime: 1.0,
        enemyId: nearestEnemyId
      }
    };
    
    this.patrolPoints.push(patrolData);
    this._updateStatus();
    console.log(`Patrol point ${id} linked to enemy ${nearestEnemyId}`);
  }
  
  _selectObject(obj, type) {
    this._deselect();
    
    this.selected = obj;
    this.selectedType = type;
    
    // Visual feedback
    if (obj.mesh) {
      obj.mesh.material = obj.mesh.material.clone();
      obj.mesh.material.emissive = new THREE.Color(0x444444);
    }
    
    this._updatePropertiesPanel();
  }
  
  _deselect() {
    if (this.selected && this.selected.mesh) {
      // Remove selection highlight
      this.selected.mesh.material = this.selected.mesh.material.clone();
      this.selected.mesh.material.emissive = new THREE.Color(0x000000);
    }
    
    this.selected = null;
    this.selectedType = null;
    this._updatePropertiesPanel();
  }
  
  _deleteSelected() {
    if (!this.selected) return;
    
    const arrays = [this.platforms, this.walls, this.enemies, this.lights, this.patrolPoints];
    
    for (const array of arrays) {
      const index = array.findIndex(item => item.id === this.selected.id);
      if (index !== -1) {
        const item = array[index];
        
        // Remove from scene
        if (item.mesh) this.scene.remove(item.mesh);
        if (item.light) this.scene.remove(item.light);
        if (item.helper) this.scene.remove(item.helper);
        
        // Remove from array
        array.splice(index, 1);
        break;
      }
    }
    
    this._deselect();
    this._updateStatus();
  }
  
  _updatePropertiesPanel() {
    if (!this.selected) {
      this.propertiesContent.innerHTML = '<p style=\"color: #888; margin: 0;\">Select an object to edit its properties</p>';
      return;
    }
    
    const data = this.selected.data;
    let html = `<strong>${this.selectedType.toUpperCase()} #${this.selected.id}</strong><br><br>`;
    
    // Position controls
    html += '<strong>Position:</strong><br>';
    html += `X: <input type="number" value="${data.position[0]}" step="0.1" style="width: 60px; margin: 2px;"><br>`;
    html += `Y: <input type="number" value="${data.position[1]}" step="0.1" style="width: 60px; margin: 2px;"><br>`;
    html += `Z: <input type="number" value="${data.position[2]}" step="0.1" style="width: 60px; margin: 2px;"><br><br>`;
    
    // Type-specific controls
    if (this.selectedType === 'platform') {
      html += '<strong>Size:</strong><br>';
      html += `W: <input type="number" value="${data.size[0]}" step="0.1" min="0.1" style="width: 60px; margin: 2px;"><br>`;
      html += `H: <input type="number" value="${data.size[1]}" step="0.1" min="0.1" style="width: 60px; margin: 2px;"><br>`;
      html += `D: <input type="number" value="${data.size[2]}" step="0.1" min="0.1" style="width: 60px; margin: 2px;"><br>`;
    } else if (this.selectedType === 'light') {
      html += `<strong>Intensity:</strong><br>`;
      html += `<input type="number" value="${data.intensity}" step="0.1" min="0" style="width: 80px; margin: 2px;"><br>`;
    }
    
    this.propertiesContent.innerHTML = html;
    
    // Add event listeners to inputs
    const inputs = this.propertiesContent.querySelectorAll('input');
    inputs.forEach((input, index) => {
      input.addEventListener('change', () => {
        this._updateSelectedObject();
      });
    });
  }
  
  _updateSelectedObject() {
    if (!this.selected) return;
    
    const inputs = this.propertiesContent.querySelectorAll('input');
    const data = this.selected.data;
    
    // Update position
    data.position[0] = parseFloat(inputs[0].value);
    data.position[1] = parseFloat(inputs[1].value);
    data.position[2] = parseFloat(inputs[2].value);
    
    this.selected.mesh.position.set(...data.position);
    
    // Update type-specific properties
    if (this.selectedType === 'platform' && inputs.length >= 6) {
      data.size[0] = parseFloat(inputs[3].value);
      data.size[1] = parseFloat(inputs[4].value);
      data.size[2] = parseFloat(inputs[5].value);
      
      // Recreate geometry with new size
      this.selected.mesh.geometry.dispose();
      this.selected.mesh.geometry = new THREE.BoxGeometry(...data.size);
    } else if (this.selectedType === 'light' && inputs.length >= 4) {
      data.intensity = parseFloat(inputs[3].value);
      if (this.selected.light) {
        this.selected.light.intensity = data.intensity;
      }
    }
  }
  
  _setMode(mode) {
    this.mode = mode;
    this._updateStatus();
  }
  
  _updateStatus() {
    const counts = {
      platforms: this.platforms.length,
      walls: this.walls.length,
      enemies: this.enemies.length,
      lights: this.lights.length,
      patrol: this.patrolPoints.length
    };
    
    this.statusElement.textContent = `Level Editor - Mode: ${this.mode} | Objects: ${Object.values(counts).reduce((a, b) => a + b, 0)}`;
  }
  
  _clearScene() {
    // Remove all objects
    [...this.platforms, ...this.walls, ...this.enemies, ...this.lights, ...this.patrolPoints].forEach(item => {
      if (item.mesh) this.scene.remove(item.mesh);
      if (item.light) this.scene.remove(item.light);
      if (item.helper) this.scene.remove(item.helper);
    });
    
    // Clear arrays
    this.platforms = [];
    this.walls = [];
    this.enemies = [];
    this.lights = [];
    this.patrolPoints = [];
    
    this._deselect();
    this._updateStatus();
  }
  
  _exportLevel() {
    const levelData = {
      id: 'custom_level',
      name: 'Custom Level',
      startPosition: [0, 2, 8],
      ui: ['hud'],
      lights: ['BasicLights'],
      objects: [
        // Platforms
        ...this.platforms.map(p => ({
          type: 'box',
          position: p.data.position,
          size: p.data.size,
          color: p.data.color
        })),
        // Walls  
        ...this.walls.map(w => ({
          type: 'box',
          position: w.data.position,
          size: w.data.size,
          color: w.data.color
        }))
      ],
      enemies: this.enemies.map(e => ({
        type: e.data.type,
        position: e.data.position,
        modelUrl: e.data.modelUrl,
        speed: e.data.speed,
        patrolPoints: this.patrolPoints
          .filter(pp => pp.data.enemyId === e.id)
          .map(pp => [...pp.data.position, pp.data.waitTime || 1.0])
      }))
    };
    
    const jsonString = JSON.stringify(levelData, null, 2);
    
    // Create download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Exported level:', levelData);
  }
  
  _importLevel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const levelData = JSON.parse(e.target.result);
          this._loadLevelData(levelData);
        } catch (error) {
          alert('Invalid JSON file: ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  _loadLevelData(levelData) {
    // Clear existing scene
    this._clearScene();
    
    // Load platforms
    if (levelData.objects) {
      levelData.objects.forEach(obj => {
        if (obj.type === 'box') {
          const position = new THREE.Vector3(...obj.position);
          this._createPlatform(position);
          
          // Update the last created platform with proper data
          const platform = this.platforms[this.platforms.length - 1];
          platform.data.size = obj.size;
          platform.data.color = obj.color || 0x2e8b57;
          
          // Update mesh
          platform.mesh.geometry.dispose();
          platform.mesh.geometry = new THREE.BoxGeometry(...platform.data.size);
          platform.mesh.material.color.setHex(platform.data.color);
        }
      });
    }
    
    // Load enemies
    if (levelData.enemies) {
      levelData.enemies.forEach(enemy => {
        const position = new THREE.Vector3(...enemy.position);
        this._createEnemy(position);
        
        // Update the last created enemy with proper data
        const enemyObj = this.enemies[this.enemies.length - 1];
        enemyObj.data.type = enemy.type;
        enemyObj.data.patrolPoints = enemy.patrolPoints || [];
      });
    }
    
    this._updateStatus();
    console.log('Imported level:', levelData);
  }
  
  update() {
    const delta = 0.016; // Assume 60fps
    
    // Camera movement (WASD + mouse look)
    if (this.mouseDown) {
      this.cameraYaw -= this.mouseDelta.x * this.sensitivity;
      this.cameraPitch -= this.mouseDelta.y * this.sensitivity;
      this.cameraPitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.cameraPitch));
      this.mouseDelta.x = 0;
      this.mouseDelta.y = 0;
    }
    
    // Movement
    const forward = new THREE.Vector3(
      -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    ).normalize();
    
    const right = new THREE.Vector3(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw)
    ).normalize();
    
    const moveVector = new THREE.Vector3();
    if (this.keys['KeyW']) moveVector.add(forward);
    if (this.keys['KeyS']) moveVector.sub(forward);
    if (this.keys['KeyA']) moveVector.sub(right);
    if (this.keys['KeyD']) moveVector.add(right);
    if (this.keys['KeyQ']) moveVector.y -= 1;
    if (this.keys['KeyE']) moveVector.y += 1;
    
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(this.moveSpeed * delta);
      this.camera.position.add(moveVector);
    }
    
    // Update camera rotation
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, 'YXZ'));
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}