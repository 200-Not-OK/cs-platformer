import * as THREE from 'three';
import { FreeCamera } from '../freeCamera.js';

// Modular Level Editor
// Features:
// - Toggle with E key
// - Side panel for direct value editing (position, scale, rotation)
// - Place platforms, enemies, lights
// - Edit enemy patrol points
// - Save/Load JSON levels compatible with levelData.js
// - Free camera controls
// - Selection and deletion system
// - Modular design for future asset placement

export class LevelEditor {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.enabled = false;
    
    // Editor modes
    this.mode = 'platform'; // platform | enemy | light | select
    
    // Data storage
    this.platforms = []; // { id, mesh, data: {position, size, rotation, color} }
    this.enemies = []; // { id, mesh, data: {type, position, rotation, patrolPoints} }
    this.lights = []; // { id, helper, data: {type, position, color, intensity} }
    this.patrolPoints = []; // { id, mesh, enemyId, pointIndex }
    
    // Selection system
    this.selected = null;
    this.selectedType = null; // 'platform' | 'enemy' | 'light'
    
    // Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Camera system
    this.originalCamera = this.game.activeCamera;
    this.editorCamera = this.game.freeCam;
    this.editorCamera.camera.position.set(10, 10, 10);
    this.editorCamera.camera.lookAt(0, 0, 0);
    
    // ID counter for unique object identification
    this.nextId = 1;
    
    this._createUI();
    this._bindEvents();
  }

  // --- UI Creation ---
  _createUI() {
    // Main editor panel (right side)
    this.panel = document.createElement('div');
    this.panel.id = 'levelEditorPanel';
    Object.assign(this.panel.style, {
      position: 'fixed',
      right: '0',
      top: '0',
      width: '320px',
      height: '100vh',
      background: 'rgba(20, 20, 25, 0.95)',
      color: '#fff',
      fontFamily: 'system-ui',
      fontSize: '14px',
      overflowY: 'auto',
      borderLeft: '1px solid #444',
      zIndex: 10000,
      display: 'none'
    });

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding: 16px; border-bottom: 1px solid #444; font-weight: 600; font-size: 16px;';
    header.textContent = 'Level Editor';
    this.panel.appendChild(header);

    // Mode selector
    this._createModeSelector();
    
    // Properties panel (shown when object is selected)
    this._createPropertiesPanel();
    
    // Tools section
    this._createToolsSection();
    
    document.body.appendChild(this.panel);
    
    // Status overlay (top-left)
    this.statusOverlay = document.createElement('div');
    Object.assign(this.statusOverlay.style, {
      position: 'fixed',
      left: '16px',
      top: '16px',
      padding: '8px 12px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      borderRadius: '4px',
      fontFamily: 'system-ui',
      fontSize: '12px',
      zIndex: 9999,
      display: 'none'
    });
    this.statusOverlay.textContent = 'Level Editor - Press E to toggle';
    document.body.appendChild(this.statusOverlay);
  }

  _createModeSelector() {
    const section = document.createElement('div');
    section.style.cssText = 'padding: 16px; border-bottom: 1px solid #444;';
    
    const title = document.createElement('div');
    title.style.cssText = 'margin-bottom: 12px; font-weight: 500;';
    title.textContent = 'Mode';
    section.appendChild(title);

    const modes = [
      { key: 'select', label: 'Select', icon: '👆' },
      { key: 'platform', label: 'Platform', icon: '📦' },
      { key: 'enemy', label: 'Enemy', icon: '👾' },
      { key: 'light', label: 'Light', icon: '💡' }
    ];

    this.modeButtons = {};
    modes.forEach(mode => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: block; width: 100%; margin-bottom: 8px; padding: 8px 12px;
        background: #333; color: #fff; border: 1px solid #555; border-radius: 4px;
        cursor: pointer; font-size: 14px; text-align: left;
      `;
      btn.innerHTML = `${mode.icon} ${mode.label}`;
      btn.onclick = () => this._setMode(mode.key);
      section.appendChild(btn);
      this.modeButtons[mode.key] = btn;
    });

    this.panel.appendChild(section);
  }

  _createPropertiesPanel() {
    this.propertiesPanel = document.createElement('div');
    this.propertiesPanel.style.cssText = 'padding: 16px; border-bottom: 1px solid #444; display: none;';
    
    const title = document.createElement('div');
    title.style.cssText = 'margin-bottom: 12px; font-weight: 500;';
    title.textContent = 'Properties';
    this.propertiesPanel.appendChild(title);

    // Properties content will be dynamically generated
    this.propertiesContent = document.createElement('div');
    this.propertiesPanel.appendChild(this.propertiesContent);

    this.panel.appendChild(this.propertiesPanel);
  }

  _createToolsSection() {
    const section = document.createElement('div');
    section.style.cssText = 'padding: 16px;';
    
    const title = document.createElement('div');
    title.style.cssText = 'margin-bottom: 12px; font-weight: 500;';
    title.textContent = 'Tools';
    section.appendChild(title);

    // Enemy type selector
    const enemyGroup = document.createElement('div');
    enemyGroup.style.cssText = 'margin-bottom: 16px;';
    
    const enemyLabel = document.createElement('div');
    enemyLabel.style.cssText = 'margin-bottom: 6px; font-size: 12px; color: #aaa;';
    enemyLabel.textContent = 'Enemy Type';
    enemyGroup.appendChild(enemyLabel);
    
    this.enemyTypeSelect = document.createElement('select');
    this.enemyTypeSelect.style.cssText = `
      width: 100%; padding: 6px; background: #333; color: #fff; 
      border: 1px solid #555; border-radius: 4px;
    `;
    ['walker', 'runner', 'jumper', 'flyer'].forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      this.enemyTypeSelect.appendChild(option);
    });
    enemyGroup.appendChild(this.enemyTypeSelect);
    section.appendChild(enemyGroup);

    // Action buttons
    const buttons = [
      { text: 'Export Level', action: () => this._exportLevel() },
      { text: 'Import Level', action: () => this._importLevel() },
      { text: 'Clear All', action: () => this._clearLevel() },
      { text: 'Delete Selected', action: () => this._deleteSelected() }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.style.cssText = `
        display: block; width: 100%; margin-bottom: 8px; padding: 8px 12px;
        background: #444; color: #fff; border: 1px solid #666; border-radius: 4px;
        cursor: pointer; font-size: 14px;
      `;
      button.textContent = btn.text;
      button.onclick = btn.action;
      section.appendChild(button);
    });

    this.panel.appendChild(section);
  }

  _setMode(mode) {
    this.mode = mode;
    // Update button styles
    Object.keys(this.modeButtons).forEach(key => {
      this.modeButtons[key].style.background = key === mode ? '#0066cc' : '#333';
    });
  }

  _updatePropertiesPanel() {
    if (!this.selected) {
      this.propertiesPanel.style.display = 'none';
      return;
    }

    this.propertiesPanel.style.display = 'block';
    this.propertiesContent.innerHTML = '';

    const data = this.selected.data;
    const type = this.selectedType;

    // Position controls
    this._createVectorControl('Position', data.position, (axis, value) => {
      data.position[axis] = value;
      this._updateObjectTransform(this.selected);
    });

    // Rotation controls
    this._createVectorControl('Rotation', data.rotation, (axis, value) => {
      data.rotation[axis] = value;
      this._updateObjectTransform(this.selected);
    });

    // Type-specific controls
    if (type === 'platform') {
      this._createVectorControl('Size', data.size, (axis, value) => {
        data.size[axis] = Math.max(0.1, value);
        this._recreatePlatform(this.selected);
      });
      
      this._createColorControl('Color', data.color, (color) => {
        data.color = color;
        this.selected.mesh.material.color.setHex(color);
      });
    } else if (type === 'light') {
      this._createSliderControl('Intensity', data.intensity, 0, 10, 0.1, (value) => {
        data.intensity = value;
        this.selected.helper.light.intensity = value;
      });
      
      this._createColorControl('Color', data.color, (color) => {
        data.color = color;
        this.selected.helper.light.color.setHex(color);
        this.selected.helper.material.color.setHex(color);
      });
    } else if (type === 'enemy') {
      // Enemy type selector
      const typeLabel = document.createElement('div');
      typeLabel.style.cssText = 'margin: 12px 0 4px 0; font-size: 12px; color: #aaa;';
      typeLabel.textContent = 'Type';
      this.propertiesContent.appendChild(typeLabel);
      
      const typeSelect = document.createElement('select');
      typeSelect.style.cssText = `
        width: 100%; padding: 6px; background: #333; color: #fff; 
        border: 1px solid #555; border-radius: 4px; margin-bottom: 12px;
      `;
      ['walker', 'runner', 'jumper', 'flyer'].forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        option.selected = type === data.type;
        typeSelect.appendChild(option);
      });
      typeSelect.onchange = () => {
        data.type = typeSelect.value;
        this._updateEnemyAppearance(this.selected);
      };
      this.propertiesContent.appendChild(typeSelect);

      // Patrol points
      this._createPatrolControls();
    }
  }

  // --- UI Helper Methods ---
  _createVectorControl(label, vector, onChange) {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';
    
    const groupLabel = document.createElement('div');
    groupLabel.style.cssText = 'margin-bottom: 6px; font-size: 12px; color: #aaa;';
    groupLabel.textContent = label;
    group.appendChild(groupLabel);

    ['x', 'y', 'z'].forEach((axis, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; margin-bottom: 4px;';
      
      const axisLabel = document.createElement('div');
      axisLabel.style.cssText = 'width: 20px; color: #ccc; font-size: 12px;';
      axisLabel.textContent = axis.toUpperCase();
      row.appendChild(axisLabel);
      
      const input = document.createElement('input');
      input.type = 'number';
      input.step = '0.1';
      input.value = vector[i].toFixed(2);
      input.style.cssText = `
        flex: 1; margin-left: 8px; padding: 4px; background: #333; color: #fff; 
        border: 1px solid #555; border-radius: 3px; font-size: 12px;
      `;
      input.onchange = () => onChange(i, parseFloat(input.value) || 0);
      row.appendChild(input);
      
      group.appendChild(row);
    });

    this.propertiesContent.appendChild(group);
  }

  _createSliderControl(label, value, min, max, step, onChange) {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';
    
    const groupLabel = document.createElement('div');
    groupLabel.style.cssText = 'margin-bottom: 6px; font-size: 12px; color: #aaa;';
    groupLabel.textContent = label;
    group.appendChild(groupLabel);
    
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center;';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.cssText = 'flex: 1; margin-right: 8px;';
    
    const valueDisplay = document.createElement('div');
    valueDisplay.style.cssText = 'width: 40px; font-size: 12px; color: #ccc;';
    valueDisplay.textContent = value.toFixed(1);
    
    slider.oninput = () => {
      const newValue = parseFloat(slider.value);
      valueDisplay.textContent = newValue.toFixed(1);
      onChange(newValue);
    };
    
    row.appendChild(slider);
    row.appendChild(valueDisplay);
    group.appendChild(row);
    this.propertiesContent.appendChild(group);
  }

  _createColorControl(label, color, onChange) {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';
    
    const groupLabel = document.createElement('div');
    groupLabel.style.cssText = 'margin-bottom: 6px; font-size: 12px; color: #aaa;';
    groupLabel.textContent = label;
    group.appendChild(groupLabel);
    
    const input = document.createElement('input');
    input.type = 'color';
    input.value = '#' + color.toString(16).padStart(6, '0');
    input.style.cssText = `
      width: 100%; height: 32px; border: 1px solid #555; border-radius: 4px;
      background: #333; cursor: pointer;
    `;
    input.onchange = () => {
      const hexColor = parseInt(input.value.substring(1), 16);
      onChange(hexColor);
    };
    
    group.appendChild(input);
    this.propertiesContent.appendChild(group);
  }

  _createPatrolControls() {
    const group = document.createElement('div');
    group.style.cssText = 'margin-bottom: 16px;';
    
    const groupLabel = document.createElement('div');
    groupLabel.style.cssText = 'margin-bottom: 6px; font-size: 12px; color: #aaa;';
    groupLabel.textContent = 'Patrol Points';
    group.appendChild(groupLabel);
    
    const addBtn = document.createElement('button');
    addBtn.style.cssText = `
      width: 100%; padding: 6px; background: #0066cc; color: #fff; 
      border: none; border-radius: 4px; cursor: pointer; margin-bottom: 8px;
    `;
    addBtn.textContent = 'Add Patrol Point';
    addBtn.onclick = () => this._startAddingPatrolPoint();
    group.appendChild(addBtn);
    
    // List existing patrol points
    const pointsList = document.createElement('div');
    this.selected.data.patrolPoints.forEach((point, index) => {
      const pointRow = document.createElement('div');
      pointRow.style.cssText = 'display: flex; align-items: center; margin-bottom: 4px; padding: 4px; background: #333; border-radius: 3px;';
      
      const pointText = document.createElement('div');
      pointText.style.cssText = 'flex: 1; font-size: 12px;';
      pointText.textContent = `Point ${index + 1}: (${point[0].toFixed(1)}, ${point[1].toFixed(1)}, ${point[2].toFixed(1)})`;
      pointRow.appendChild(pointText);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.style.cssText = 'background: #cc0000; color: #fff; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;';
      deleteBtn.textContent = '×';
      deleteBtn.onclick = () => this._removePatrolPoint(index);
      pointRow.appendChild(deleteBtn);
      
      pointsList.appendChild(pointRow);
    });
    group.appendChild(pointsList);
    this.propertiesContent.appendChild(group);
  }

  // --- Events ---
  _bindEvents() {
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('mousedown', (e) => this._onMouseDown(e));
    window.addEventListener('contextmenu', (e) => { if (this.enabled) e.preventDefault(); });
  }

  _onKeyDown(e) {
    if (e.code === 'KeyE') { 
      this.toggle(); 
      return; 
    }
    if (!this.enabled) return;
    
    if (e.key === 'Delete' || e.code === 'Delete') {
      this._deleteSelected();
    }
    if (e.code === 'Escape') { 
      this._deselect(); 
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    this.panel.style.display = this.enabled ? 'block' : 'none';
    this.statusOverlay.style.display = this.enabled ? 'block' : 'none';
    
    if (this.enabled) {
      // Switch to editor camera
      this.game.activeCamera = this.editorCamera.camera;
      this.statusOverlay.textContent = `Level Editor - Mode: ${this.mode}`;
      this._setMode('select'); // Start in select mode
    } else {
      // Switch back to game camera
      this.game.activeCamera = this.originalCamera;
      this._deselect();
    }
  }

  // --- Mouse interaction helpers ---
  _getNDC(e) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return new THREE.Vector2((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
  }

  _raycastGround(e) {
    const ndc = this._getNDC(e);
    this.raycaster.setFromCamera(ndc, this.game.activeCamera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, point);
    return point;
  }

  _raycastObjects(e) {
    const ndc = this._getNDC(e);
    this.raycaster.setFromCamera(ndc, this.game.activeCamera);
    
    const allObjects = [
      ...this.platforms.map(p => p.mesh),
      ...this.enemies.map(e => e.mesh),
      ...this.lights.map(l => l.helper)
    ];
    
    return this.raycaster.intersectObjects(allObjects);
  }

  _onMouseDown(e) {
    if (e.button !== 0 || !this.enabled) return;
    
    // Ignore clicks on UI panel
    if (e.target.closest && (e.target.closest('#levelEditorPanel') || e.target === this.panel || this.panel.contains(e.target))) {
      return;
    }

    const intersects = this._raycastObjects(e);
    
    // Check if we're in adding patrol point mode
    if (this.addingPatrolPoint) {
      const groundPoint = this._raycastGround(e);
      if (groundPoint) {
        this.selected.data.patrolPoints.push([groundPoint.x, groundPoint.y, groundPoint.z]);
        this._createPatrolPointVisual(groundPoint, this.selected.id, this.selected.data.patrolPoints.length - 1);
        this._updatePropertiesPanel();
        this.addingPatrolPoint = false;
        this.statusOverlay.textContent = `Level Editor - Mode: ${this.mode}`;
      }
      return;
    }

    if (intersects.length > 0) {
      // Object selection
      const mesh = intersects[0].object;
      this._selectObjectByMesh(mesh);
    } else if (this.mode !== 'select') {
      // Place new object
      const groundPoint = this._raycastGround(e);
      if (groundPoint) {
        this._placeObject(groundPoint);
      }
    } else {
      // Deselect if clicking empty space in select mode
      this._deselect();
    }
  }

  // --- Object Creation and Management ---
  _placeObject(position) {
    switch (this.mode) {
      case 'platform':
        this._createPlatform(position);
        break;
      case 'enemy':
        this._createEnemy(position);
        break;
      case 'light':
        this._createLight(position);
        break;
    }
  }

  _createPlatform(position) {
    const id = this.nextId++;
    const data = {
      position: [position.x, position.y + 0.5, position.z],
      size: [12, 1, 12],
      rotation: [0, 0, 0],
      color: 0x888888
    };

    const geometry = new THREE.BoxGeometry(data.size[0], data.size[1], data.size[2]);
    const material = new THREE.MeshStandardMaterial({ color: data.color });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(data.position[0], data.position[1], data.position[2]);
    mesh.userData = { editorId: id, type: 'platform' };
    
    this.scene.add(mesh);
    
    const platform = { id, mesh, data };
    this.platforms.push(platform);
    this._selectObject(platform, 'platform');
  }

  _createEnemy(position) {
    const id = this.nextId++;
    const data = {
      type: this.enemyTypeSelect.value,
      position: [position.x, position.y + 0.5, position.z],
      rotation: [0, 0, 0],
      patrolPoints: []
    };

    const geometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: this._getEnemyColor(data.type)
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(data.position[0], data.position[1], data.position[2]);
    mesh.userData = { editorId: id, type: 'enemy' };
    
    this.scene.add(mesh);
    
    const enemy = { id, mesh, data };
    this.enemies.push(enemy);
    this._selectObject(enemy, 'enemy');
  }

  _createLight(position) {
    const id = this.nextId++;
    const data = {
      type: 'point',
      position: [position.x, position.y + 2, position.z],
      rotation: [0, 0, 0],
      color: 0xffffff,
      intensity: 1
    };

    const light = new THREE.PointLight(data.color, data.intensity, 10);
    light.position.set(data.position[0], data.position[1], data.position[2]);
    
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: data.color });
    const helper = new THREE.Mesh(geometry, material);
    helper.position.copy(light.position);
    helper.userData = { editorId: id, type: 'light' };
    
    helper.light = light; // Reference to the actual light
    
    this.scene.add(light);
    this.scene.add(helper);
    
    const lightObj = { id, helper, data };
    this.lights.push(lightObj);
    this._selectObject(lightObj, 'light');
  }

  _getEnemyColor(type) {
    const colors = {
      walker: 0xff4444,
      runner: 0x44ff44,
      jumper: 0x4444ff,
      flyer: 0xffff44
    };
    return colors[type] || 0xff4444;
  }

  // --- Selection System ---
  _selectObject(obj, type) {
    this._deselect();
    this.selected = obj;
    this.selectedType = type;
    
    // Visual selection feedback
    if (type === 'platform') {
      obj.mesh.material.emissive = new THREE.Color(0x333333);
    } else if (type === 'enemy') {
      obj.mesh.material.emissive = new THREE.Color(0x333333);
    } else if (type === 'light') {
      obj.helper.material.emissive = new THREE.Color(0x333333);
    }
    
    this._updatePropertiesPanel();
    this.statusOverlay.textContent = `Level Editor - Selected: ${type} (ID: ${obj.id})`;
  }

  _selectObjectByMesh(mesh) {
    const userData = mesh.userData;
    if (!userData || !userData.editorId) return;
    
    const id = userData.editorId;
    const type = userData.type;
    
    let obj = null;
    if (type === 'platform') {
      obj = this.platforms.find(p => p.id === id);
    } else if (type === 'enemy') {
      obj = this.enemies.find(e => e.id === id);
    } else if (type === 'light') {
      obj = this.lights.find(l => l.id === id);
    }
    
    if (obj) {
      this._selectObject(obj, type);
    }
  }

  _deselect() {
    if (!this.selected) return;
    
    // Remove selection visual feedback
    if (this.selectedType === 'platform') {
      this.selected.mesh.material.emissive = new THREE.Color(0x000000);
    } else if (this.selectedType === 'enemy') {
      this.selected.mesh.material.emissive = new THREE.Color(0x000000);
    } else if (this.selectedType === 'light') {
      this.selected.helper.material.emissive = new THREE.Color(0x000000);
    }
    
    this.selected = null;
    this.selectedType = null;
    this._updatePropertiesPanel();
    this.statusOverlay.textContent = `Level Editor - Mode: ${this.mode}`;
  }

  _deleteSelected() {
    if (!this.selected) return;
    
    const id = this.selected.id;
    
    if (this.selectedType === 'platform') {
      const index = this.platforms.findIndex(p => p.id === id);
      if (index !== -1) {
        this.scene.remove(this.platforms[index].mesh);
        this.platforms.splice(index, 1);
      }
    } else if (this.selectedType === 'enemy') {
      const index = this.enemies.findIndex(e => e.id === id);
      if (index !== -1) {
        this.scene.remove(this.enemies[index].mesh);
        // Also remove patrol point visuals
        this._removePatrolPointVisuals(id);
        this.enemies.splice(index, 1);
      }
    } else if (this.selectedType === 'light') {
      const index = this.lights.findIndex(l => l.id === id);
      if (index !== -1) {
        this.scene.remove(this.lights[index].helper);
        this.scene.remove(this.lights[index].helper.light);
        this.lights.splice(index, 1);
      }
    }
    
    this._deselect();
  }

  // --- Object Update Methods ---
  _updateObjectTransform(obj) {
    const data = obj.data;
    if (this.selectedType === 'platform') {
      obj.mesh.position.set(data.position[0], data.position[1], data.position[2]);
      obj.mesh.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
    } else if (this.selectedType === 'enemy') {
      obj.mesh.position.set(data.position[0], data.position[1], data.position[2]);
      obj.mesh.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
    } else if (this.selectedType === 'light') {
      obj.helper.position.set(data.position[0], data.position[1], data.position[2]);
      obj.helper.light.position.copy(obj.helper.position);
    }
  }

  _recreatePlatform(platform) {
    const data = platform.data;
    
    // Remove old mesh
    this.scene.remove(platform.mesh);
    
    // Create new mesh with updated size
    const geometry = new THREE.BoxGeometry(data.size[0], data.size[1], data.size[2]);
    const material = new THREE.MeshStandardMaterial({ color: data.color });
    platform.mesh = new THREE.Mesh(geometry, material);
    
    platform.mesh.position.set(data.position[0], data.position[1], data.position[2]);
    platform.mesh.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
    platform.mesh.userData = { editorId: platform.id, type: 'platform' };
    platform.mesh.material.emissive = new THREE.Color(0x333333); // Keep selection highlight
    
    this.scene.add(platform.mesh);
  }

  _updateEnemyAppearance(enemy) {
    enemy.mesh.material.color.setHex(this._getEnemyColor(enemy.data.type));
  }

  // --- Patrol Point System ---
  _startAddingPatrolPoint() {
    if (!this.selected || this.selectedType !== 'enemy') return;
    
    this.addingPatrolPoint = true;
    this.statusOverlay.textContent = 'Click on ground to place patrol point';
  }

  _removePatrolPoint(index) {
    if (!this.selected || this.selectedType !== 'enemy') return;
    
    this.selected.data.patrolPoints.splice(index, 1);
    this._removePatrolPointVisuals(this.selected.id);
    this._createPatrolPointVisuals(this.selected.id);
    this._updatePropertiesPanel();
  }

  _createPatrolPointVisual(position, enemyId, pointIndex) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    mesh.userData = { type: 'patrolPoint', enemyId, pointIndex };
    
    this.scene.add(mesh);
    this.patrolPoints.push({ id: `${enemyId}_${pointIndex}`, mesh, enemyId, pointIndex });
  }

  _createPatrolPointVisuals(enemyId) {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    enemy.data.patrolPoints.forEach((point, index) => {
      const position = new THREE.Vector3(point[0], point[1], point[2]);
      this._createPatrolPointVisual(position, enemyId, index);
    });
  }

  _removePatrolPointVisuals(enemyId) {
    const pointsToRemove = this.patrolPoints.filter(p => p.enemyId === enemyId);
    pointsToRemove.forEach(point => {
      this.scene.remove(point.mesh);
      const index = this.patrolPoints.indexOf(point);
      if (index !== -1) {
        this.patrolPoints.splice(index, 1);
      }
    });
  }

  // --- Import/Export System ---
  _exportLevel() {
    const levelData = {
      objects: this.platforms.map(p => ({
        type: 'box',
        position: [...p.data.position],
        size: [...p.data.size],
        rotation: [...p.data.rotation],
        color: p.data.color
      })),
      enemies: this.enemies.map(e => ({
        type: e.data.type,
        position: [...e.data.position],
        rotation: [...e.data.rotation],
        patrolPoints: e.data.patrolPoints.map(p => [...p])
      })),
      lights: this.lights.map(l => ({
        type: l.data.type,
        position: [...l.data.position],
        color: l.data.color,
        intensity: l.data.intensity
      }))
    };

    const json = JSON.stringify(levelData, null, 2);
    console.log('Level Data:', json);
    
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        alert('Level exported to clipboard and console!');
      });
    } else {
      alert('Level exported to console!');
    }
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
          alert('Level imported successfully!');
        } catch (error) {
          alert('Error importing level: ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  _loadLevelData(levelData) {
    this._clearLevel();
    
    // Load platforms
    if (levelData.objects) {
      levelData.objects.forEach(objData => {
        const position = new THREE.Vector3(objData.position[0], objData.position[1], objData.position[2]);
        this._createPlatform(position);
        const platform = this.platforms[this.platforms.length - 1];
        platform.data.size = [...objData.size];
        platform.data.rotation = objData.rotation ? [...objData.rotation] : [0, 0, 0];
        platform.data.color = objData.color || 0x888888;
        this._recreatePlatform(platform);
      });
    }
    
    // Load enemies
    if (levelData.enemies) {
      levelData.enemies.forEach(enemyData => {
        const position = new THREE.Vector3(enemyData.position[0], enemyData.position[1], enemyData.position[2]);
        this._createEnemy(position);
        const enemy = this.enemies[this.enemies.length - 1];
        enemy.data.type = enemyData.type;
        enemy.data.rotation = enemyData.rotation ? [...enemyData.rotation] : [0, 0, 0];
        enemy.data.patrolPoints = enemyData.patrolPoints ? enemyData.patrolPoints.map(p => [...p]) : [];
        this._updateEnemyAppearance(enemy);
        this._createPatrolPointVisuals(enemy.id);
      });
    }
    
    // Load lights
    if (levelData.lights) {
      levelData.lights.forEach(lightData => {
        const position = new THREE.Vector3(lightData.position[0], lightData.position[1], lightData.position[2]);
        this._createLight(position);
        const light = this.lights[this.lights.length - 1];
        light.data.color = lightData.color || 0xffffff;
        light.data.intensity = lightData.intensity || 1;
        light.helper.light.color.setHex(light.data.color);
        light.helper.light.intensity = light.data.intensity;
        light.helper.material.color.setHex(light.data.color);
      });
    }
  }

  _clearLevel() {
    // Clear all objects
    [...this.platforms].forEach(() => {
      this.selected = this.platforms[0];
      this.selectedType = 'platform';
      this._deleteSelected();
    });
    
    [...this.enemies].forEach(() => {
      this.selected = this.enemies[0];
      this.selectedType = 'enemy';
      this._deleteSelected();
    });
    
    [...this.lights].forEach(() => {
      this.selected = this.lights[0];
      this.selectedType = 'light';
      this._deleteSelected();
    });
    
    this._deselect();
  }

  // Called each frame from the main game loop
  update(delta) {
    if (this.enabled && this.editorCamera) {
      this.editorCamera.update(delta);
    }
  }
}