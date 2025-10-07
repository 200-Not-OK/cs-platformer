import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ColliderHelper } from './colliderHelper.js';

export class DoorBase {
  constructor(scene, physicsWorld, position, options = {}, game = null) {
    try {
      this.scene = scene;
      this.physicsWorld = physicsWorld;
      this.game = game; // Reference to game for accessing soundManager
      this.options = options;

      // Create door mesh
      this.mesh = new THREE.Group();
      this.scene.add(this.mesh);

      // Initialize doorPanel to prevent undefined errors during async loading
      this.doorPanel = null;

      // Door properties - support both size array and individual width/height
      const width = options.width || (options.size ? options.size[0] : 2);
      const height = options.height || (options.size ? options.size[1] : 4);
      const depth = options.depth || (options.size ? options.size[2] : 0.2);
      this.size = [width, height, depth]; // Keep size array for backward compatibility

      // Door type: 'basic' (default procedural geometry) or 'model' (3D model with fallback to basic)
      this.type = options.type || 'basic';
      
      // Door presets for common types
      this.preset = options.preset || 'wooden'; // 'wooden', 'metal', 'futuristic'
      this._applyPreset();
      
      // Model support - optional for 'model' type, will use default if not provided
      this.modelUrl = options.modelUrl;
      this.modelScale = options.modelScale || [1, 1, 1]; // Scale factors for model
      
      // Locked state (separate from passcode)
      this.locked = options.locked || false; // true = requires key/switch, false = can open freely
      this.requiredKey = options.requiredKey; // optional key item needed to unlock
      
      // Hinge visibility - default to visible
      this.hingeVisible = options.hingeVisible !== false; // true by default, false to hide
      
      // Validate type and required parameters
      if (this.type === 'model' && !this.modelUrl) {
        // Use default model path based on preset
        this.modelUrl = this._getDefaultModelUrl();
      }
      if (this.type !== 'basic' && this.type !== 'model') {
        throw new Error('Door type must be either "basic" or "model"');
      }

      // NEW: Swing direction support
      this.swingDirection = options.swingDirection || 'right'; // 'left' or 'right'

      // NEW: Initial rotation for the entire door (in degrees)
      this.initialRotation = options.initialRotation || 0; // Rotation around Y-axis in degrees

      // NEW: Auto-open when player approaches
      this.autoOpenOnApproach = options.autoOpenOnApproach || false; // Automatically open when player is within interaction distance
      this.autoOpenCooldown = 0; // Cooldown timer to prevent immediate re-triggering after manual interaction

      this.position = position;
      this.color = options.color || 0x8B4513; // brown wood color
      this.passcode = options.passcode; // optional passcode string
      this.passwordEntryAllowed = options.passwordEntryAllowed; // controls if password entry is allowed
      this.isOpen = false;
      this.isOpening = false;
      this.openAngle = options.openAngle || Math.PI / 2; // 90 degrees
      this.openSpeed = options.openSpeed || 2; // radians per second

      // Physics body for collision
      this.body = null;
      this.collider = new THREE.Box3();
      this.helper = new ColliderHelper(this.collider, 0x009900);
      this.helper.setVisible(false); // Hide collision helpers by default
      this.scene.add(this.helper.mesh);

      // Load model or create procedural geometry based on type
      if (this.type === 'model') {
        this._loadDoorModel();
      } else {
        this._createDoorGeometry();
      }
      this._updateCollider();

      // Interaction properties - dynamically scale with door width
      // Formula: baseDistance + (width - 2) * 0.5
      // This gives wider doors a proportionally larger interaction range
      const baseInteractionDistance = options.interactionDistance || 5;
      const widthBonus = Math.max(0, width - 2) * 0.5; // Additional distance for wider doors
      this.interactionDistance = baseInteractionDistance + widthBonus;
      this.canInteract = true;

      console.log('DoorBase created successfully:', {
        type: this.type,
        preset: this.preset,
        position: this.position,
        size: this.size,
        interactionDistance: this.interactionDistance,
        passcode: this.passcode,
        passwordEntryAllowed: this.passwordEntryAllowed,
        locked: this.locked,
        requiredKey: this.requiredKey,
        modelUrl: this.modelUrl,
        hingeVisible: this.hingeVisible,
        swingDirection: this.swingDirection,
        initialRotation: this.initialRotation,
        autoOpenOnApproach: this.autoOpenOnApproach
      });
    } catch (error) {
      console.error('Error creating DoorBase:', error);
      console.error('Error stack:', error.stack);
      throw error; // Re-throw to prevent silent failures
    }
  }

  _applyPreset() {
    // Apply preset configurations
    switch (this.preset) {
      case 'wooden':
        this.color = this.options.color || 0x8B4513; // Brown wood
        this.openSpeed = this.options.openSpeed || 2.0;
        break;
      case 'metal':
        this.color = this.options.color || 0xC0C0C0; // Silver metal
        this.openSpeed = this.options.openSpeed || 1.5; // Slower, heavier
        break;
      case 'futuristic':
        this.color = this.options.color || 0x00FFFF; // Cyan futuristic
        this.openSpeed = this.options.openSpeed || 3.0; // Faster, automated
        break;
      default:
        this.color = this.options.color || 0x8B4513;
        this.openSpeed = this.options.openSpeed || 2.0;
    }
  }

  _getDefaultModelUrl() {
    // Return default model path based on preset
    switch (this.preset) {
      case 'wooden':
        return 'src/assets/models/door.glb'; // Default wooden door model
      case 'metal':
        return 'src/assets/models/ani.glb'; // Metal door model (if exists)
      case 'futuristic':
        return 'src/assets/models/futuristic_door.glb'; // Futuristic door model (if exists)
      default:
        return 'src/assets/models/door.glb';
    }
  }

  _createDoorGeometry() {
    // Create single hinge pole/post instead of full frame
    const poleThickness = 0.15;
    
    // Determine hinge side based on swing direction
    const directions = this.swingDirection.split(' ');
    let primaryDir = directions[0];
    let secondaryDir = directions[1];
    
    // Swap forward right <-> backward right
    if (primaryDir === 'forward' && secondaryDir === 'right') {
      primaryDir = 'backward';
      secondaryDir = 'right';
    } else if (primaryDir === 'backward' && secondaryDir === 'right') {
      primaryDir = 'forward';
      secondaryDir = 'right';
    }
    
    const hingeOnLeft = primaryDir === 'left' || (primaryDir === 'forward' && secondaryDir === 'left') || (primaryDir === 'backward' && secondaryDir === 'left');
    const hingeOnRight = primaryDir === 'right' || (primaryDir === 'forward' && secondaryDir === 'right') || (primaryDir === 'backward' && secondaryDir === 'right');
    const hingeForward = primaryDir === 'forward';
    const hingeBackward = primaryDir === 'backward';
    
    let hingeX = 0;
    let hingeZ = 0;
    let geometryTranslateX = 0;
    let geometryTranslateZ = 0;
    
    if (hingeOnLeft) {
      hingeX = (-this.size[0]/2 - poleThickness/2);
      geometryTranslateX = this.size[0]/2;
      hingeZ = hingeForward ? (-this.size[2]/2 - poleThickness/2) : hingeBackward ? (this.size[2]/2 + poleThickness/2) : (this.size[2]/2 + poleThickness);
    } else if (hingeOnRight) {
      hingeX = (this.size[0]/2 + poleThickness/2);
      geometryTranslateX = -this.size[0]/2;
      hingeZ = hingeForward ? (-this.size[2]/2 - poleThickness/2) : hingeBackward ? (this.size[2]/2 + poleThickness/2) : (this.size[2]/2 + poleThickness);
    } else if (hingeForward) {
      hingeZ = (-this.size[2]/2 - poleThickness/2);
      geometryTranslateZ = this.size[2]/2;
      hingeX = 0;
    } else if (hingeBackward) {
      hingeZ = (this.size[2]/2 + poleThickness/2);
      geometryTranslateZ = -this.size[2]/2;
      hingeX = 0;
    }
    
    // Single hinge pole (vertical post) - same height as door
    const poleGeometry = new THREE.BoxGeometry(poleThickness, this.size[1], poleThickness);
    const pole = new THREE.Mesh(poleGeometry, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    pole.position.set(hingeX, this.size[1]/2, hingeZ);
    if (this.hingeVisible) {
      this.mesh.add(pole);
    }

    // Create door panel - positioned to rotate around the pole
    const doorGeometry = new THREE.BoxGeometry(this.size[0], this.size[1], this.size[2]);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: this.color });
    this.doorPanel = new THREE.Mesh(doorGeometry, doorMaterial);
    
    // Position door panel so it rotates around the hinge side
    // Move the geometry so the hinge edge is at the origin, then position at pole
    this.doorPanel.geometry.translate(geometryTranslateX, 0, geometryTranslateZ);
    
    let panelX = 0;
    let panelZ = this.size[2]/2 + poleThickness;
    
    if (hingeOnLeft) {
      panelX = -this.size[0]/2;
      panelZ = hingeForward ? -this.size[2]/2 : hingeBackward ? this.size[2]/2 : this.size[2]/2 + poleThickness;
    } else if (hingeOnRight) {
      panelX = this.size[0]/2;
      panelZ = hingeForward ? -this.size[2]/2 : hingeBackward ? this.size[2]/2 : this.size[2]/2 + poleThickness;
    } else if (hingeForward) {
      panelX = 0;
      panelZ = -this.size[2]/2;
    } else if (hingeBackward) {
      panelX = 0;
      panelZ = this.size[2]/2;
    }
    
    this.doorPanel.position.set(panelX, this.size[1]/2, panelZ);
    this.mesh.add(this.doorPanel);

    // Create door handle - position on the opposite side of the hinge
    const handleGeometry = new THREE.SphereGeometry(0.05);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    let handleX = 0;
    let handleZ = this.size[2]/2 + poleThickness + 0.05;
    
    if (hingeOnLeft) {
      handleX = (this.size[0] - 0.1);
      handleZ = hingeForward ? (this.size[2] - 0.1) : hingeBackward ? (-this.size[2] + 0.1) : (this.size[2]/2 + poleThickness + 0.05);
    } else if (hingeOnRight) {
      handleX = (-this.size[0] + 0.1);
      handleZ = hingeForward ? (this.size[2] - 0.1) : hingeBackward ? (-this.size[2] + 0.1) : (this.size[2]/2 + poleThickness + 0.05);
    } else if (hingeForward) {
      handleX = 0;
      handleZ = (this.size[2] - 0.1);
    } else if (hingeBackward) {
      handleX = 0;
      handleZ = (-this.size[2] + 0.1);
    }
    
    handle.position.set(handleX, 0, handleZ);
    this.doorPanel.add(handle);

    // Add door panels/stiles for more detail
    const stileGeometry = new THREE.BoxGeometry(0.05, this.size[1], this.size[2] + 0.01);
    const stileMaterial = new THREE.MeshStandardMaterial({ color: this.color });
    
    // Vertical stiles on door - adjusted for translated geometry
    let leftStileX = 0;
    let rightStileX = 0;
    let leftStileZ = 0;
    let rightStileZ = 0;
    
    if (hingeOnLeft || hingeOnRight) {
      leftStileX = hingeOnLeft ? this.size[0]/4 : -this.size[0]/4;
      rightStileX = hingeOnLeft ? 3 * this.size[0]/4 : -3 * this.size[0]/4;
      leftStileZ = hingeForward ? this.size[2]/4 : hingeBackward ? -this.size[2]/4 : 0;
      rightStileZ = hingeForward ? 3 * this.size[2]/4 : hingeBackward ? -3 * this.size[2]/4 : 0;
    } else if (hingeForward || hingeBackward) {
      leftStileX = -this.size[0]/4;
      rightStileX = this.size[0]/4;
      leftStileZ = hingeForward ? this.size[2]/4 : -this.size[2]/4;
      rightStileZ = hingeForward ? 3 * this.size[2]/4 : -3 * this.size[2]/4;
    }
    
    const leftStile = new THREE.Mesh(stileGeometry, stileMaterial);
    leftStile.position.set(leftStileX, 0, leftStileZ);
    this.doorPanel.add(leftStile);
    
    const rightStile = new THREE.Mesh(stileGeometry, stileMaterial);
    rightStile.position.set(rightStileX, 0, rightStileZ);
    this.doorPanel.add(rightStile);
    
    // Horizontal rails - adjusted for translated geometry
    let railGeometry;
    let railX = 0;
    let railZ = 0;
    
    if (hingeOnLeft || hingeOnRight) {
      railGeometry = new THREE.BoxGeometry(this.size[0]/2 - 0.1, 0.05, this.size[2] + 0.01);
      railX = hingeOnLeft ? this.size[0]/2 : -this.size[0]/2;
      railZ = hingeForward ? this.size[2]/2 : hingeBackward ? -this.size[2]/2 : 0;
    } else if (hingeForward || hingeBackward) {
      railGeometry = new THREE.BoxGeometry(this.size[0] + 0.01, 0.05, this.size[2]/2 - 0.1);
      railX = 0;
      railZ = hingeForward ? this.size[2]/2 : -this.size[2]/2;
    }
    
    const topRail = new THREE.Mesh(railGeometry, stileMaterial);
    topRail.position.set(railX, this.size[1]/3, railZ);
    this.doorPanel.add(topRail);
    
    const middleRail = new THREE.Mesh(railGeometry, stileMaterial);
    middleRail.position.set(railX, 0, railZ);
    this.doorPanel.add(middleRail);
    
    const bottomRail = new THREE.Mesh(railGeometry, stileMaterial);
    bottomRail.position.set(railX, -this.size[1]/3, railZ);
    this.doorPanel.add(bottomRail);

    // Set initial position - door sits on ground
    this.mesh.position.set(...this.position);

    // Apply initial rotation if specified
    if (this.initialRotation !== 0) {
      this.mesh.rotation.y = (this.initialRotation * Math.PI) / 180; // Convert degrees to radians
    }
  }

  async _loadDoorModel() {
    try {
      console.log('Loading door model:', this.modelUrl);

      // Import GLTFLoader dynamically (assuming it's available in your project)
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          this.modelUrl,
          resolve,
          undefined,
          reject
        );
      });

      // Get the door model from GLTF
      const doorModel = gltf.scene;

      // Calculate scale to fit the desired dimensions
      const modelBox = new THREE.Box3().setFromObject(doorModel);
      const modelSize = modelBox.getSize(new THREE.Vector3());

      const scaleX = this.size[0] / modelSize.x * this.modelScale[0];
      const scaleY = this.size[1] / modelSize.y * this.modelScale[1];
      const scaleZ = this.size[2] / modelSize.z * this.modelScale[2];

      doorModel.scale.set(scaleX, scaleY, scaleZ);

      // Center the model
      const modelCenter = modelBox.getCenter(new THREE.Vector3());
      doorModel.position.sub(modelCenter.multiply(doorModel.scale));

      // Parse swing direction - can be single direction or combination like "forward left"
      const directions = this.swingDirection.split(' ');
      let primaryDir = directions[0]; // 'forward', 'backward', 'left', 'right'
      let secondaryDir = directions[1]; // 'left' or 'right' for forward/backward doors
      
      // Swap forward right <-> backward right
      if (primaryDir === 'forward' && secondaryDir === 'right') {
        primaryDir = 'backward';
        secondaryDir = 'right';
      } else if (primaryDir === 'backward' && secondaryDir === 'right') {
        primaryDir = 'forward';
        secondaryDir = 'right';
      }
      
      // Position the model within the doorPanel so hinge edge aligns with origin
      let modelOffsetX = 0;
      let modelOffsetZ = 0;
      
      if (primaryDir === 'left') {
        // Hinge on left, door swings left
        modelOffsetX = this.size[0]/2;
      } else if (primaryDir === 'right') {
        // Hinge on right, door swings right
        modelOffsetX = -this.size[0]/2;
      } else if (primaryDir === 'forward') {
        // Hinge on back edge, combined with left/right
        modelOffsetZ = -this.size[2]/2;
        if (secondaryDir === 'left') {
          modelOffsetX = this.size[0]/2;
        } else if (secondaryDir === 'right') {
          modelOffsetX = -this.size[0]/2;
        }
      } else if (primaryDir === 'backward') {
        // Hinge on front edge, combined with left/right
        modelOffsetZ = this.size[2]/2;
        if (secondaryDir === 'left') {
          modelOffsetX = this.size[0]/2;
        } else if (secondaryDir === 'right') {
          modelOffsetX = -this.size[0]/2;
        }
      }
      
      doorModel.position.x += modelOffsetX;
      doorModel.position.z += modelOffsetZ;

      // Create door panel group for rotation
      this.doorPanel = new THREE.Group();
      this.doorPanel.add(doorModel);

      // Position door panel to match procedural geometry positioning
      const poleThickness = 0.15;
      let panelX = 0;
      let panelZ = this.size[2]/2 + poleThickness;
      
      if (primaryDir === 'left') {
        panelX = -this.size[0]/2;
        panelZ = this.size[2]/2 + poleThickness;
      } else if (primaryDir === 'right') {
        panelX = this.size[0]/2;
        panelZ = this.size[2]/2 + poleThickness;
      } else if (primaryDir === 'forward') {
        panelX = secondaryDir === 'left' ? -this.size[0]/2 : this.size[0]/2;
        panelZ = -this.size[2]/2;
      } else if (primaryDir === 'backward') {
        panelX = secondaryDir === 'left' ? -this.size[0]/2 : this.size[0]/2;
        panelZ = this.size[2]/2;
      }
      
      this.doorPanel.position.set(panelX, this.size[1]/2, panelZ);

      // Create hinge pole on the correct side
      const poleGeometry = new THREE.BoxGeometry(poleThickness, this.size[1], poleThickness);
      const pole = new THREE.Mesh(poleGeometry, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      let poleX = 0;
      let poleZ = poleThickness/2;
      
      if (primaryDir === 'left') {
        poleX = (-this.size[0]/2 - poleThickness/2);
        poleZ = this.size[2]/2 + poleThickness;
      } else if (primaryDir === 'right') {
        poleX = (this.size[0]/2 + poleThickness/2);
        poleZ = this.size[2]/2 + poleThickness;
      } else if (primaryDir === 'forward') {
        poleX = secondaryDir === 'left' ? (-this.size[0]/2 - poleThickness/2) : (this.size[0]/2 + poleThickness/2);
        poleZ = (-this.size[2]/2 - poleThickness/2);
      } else if (primaryDir === 'backward') {
        poleX = secondaryDir === 'left' ? (-this.size[0]/2 - poleThickness/2) : (this.size[0]/2 + poleThickness/2);
        poleZ = (this.size[2]/2 + poleThickness/2);
      }
      
      pole.position.set(poleX, this.size[1]/2, poleZ);
      if (this.hingeVisible) {
        this.mesh.add(pole);
      }

      // Add door panel to mesh
      this.mesh.add(this.doorPanel);

      // Set initial position
      this.mesh.position.set(...this.position);

      // Apply initial rotation if specified
      if (this.initialRotation !== 0) {
        this.mesh.rotation.y = (this.initialRotation * Math.PI) / 180; // Convert degrees to radians
      }

      console.log('Door model loaded and scaled:', {
        originalSize: modelSize,
        targetSize: this.size,
        scale: [scaleX, scaleY, scaleZ]
      });

    } catch (error) {
      console.error('Failed to load door model:', error);
      // Fallback to procedural geometry
      console.log('Falling back to procedural door geometry');
      this._createDoorGeometry();
    }
  }

  _updateCollider() {
    // Center on the door's center, but account for door sitting on ground
    const center = this.mesh.position.clone().add(new THREE.Vector3(0, this.size[1] * 0.5, 0));
    const half = new THREE.Vector3(this.size[0] * 0.5, this.size[1] * 0.5, this.size[2] * 0.5);

    // Create the collider box
    this.collider.min.copy(center).sub(half);
    this.collider.max.copy(center).add(half);

    // If the door has initial rotation, we need to expand the collider to encompass the rotated door
    if (this.initialRotation !== 0) {
      // Calculate the maximum extent needed for the rotated box
      const rotationRad = (this.initialRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rotationRad));
      const sin = Math.abs(Math.sin(rotationRad));

      // The rotated bounding box will be larger
      const maxExtentX = half.x * cos + half.z * sin;
      const maxExtentZ = half.x * sin + half.z * cos;

      // Expand the collider to fit the rotated door
      this.collider.min.x = center.x - maxExtentX;
      this.collider.max.x = center.x + maxExtentX;
      this.collider.min.z = center.z - maxExtentZ;
      this.collider.max.z = center.z + maxExtentZ;
    }

    if (this.helper) this.helper.update();
  }

  setPosition(vec3) {
    if (!vec3 || !vec3.isVector3) return;
    this.mesh.position.copy(vec3);
    if (this.body) {
      this.body.position.set(vec3.x, vec3.y, vec3.z);
    }
    this._updateCollider();
  }

  interact(playerInventory = null) {
    if (!this.canInteract) return false;

    // Set cooldown to prevent auto-open from immediately triggering after manual interaction
    if (this.autoOpenOnApproach) {
      this.autoOpenCooldown = 2.0; // 2 second cooldown
    }

    // Check if door is locked
    if (this.locked) {
      if (this.requiredKey && playerInventory) {
        // Check if player has the required key
        const hasKey = playerInventory.hasItem ? playerInventory.hasItem(this.requiredKey) : 
                      (playerInventory.includes ? playerInventory.includes(this.requiredKey) : false);
        
        if (!hasKey) {
          console.log('Door is locked - requires key:', this.requiredKey);
          // TODO: Show locked message to player
          return false; // Cannot interact
        } else {
          console.log('Door unlocked with key:', this.requiredKey);
          this.locked = false; // Unlock the door
        }
      } else {
        console.log('Door is locked');
        // TODO: Show locked message to player
        return false; // Cannot interact
      }
    }

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
    return true;
  }

  open() {
    if (this.isOpen || this.isOpening) return;

    // Play door opening sound
    if (this.game && this.game.soundManager) {
      this.game.soundManager.playSFX('door', 0.6);
    }

    this.isOpening = true;
    // Determine rotation direction based on swing direction
    const directions = this.swingDirection.split(' ');
    let primaryDir = directions[0];
    let secondaryDir = directions[1];
    
    // Swap forward right <-> backward right
    if (primaryDir === 'forward' && secondaryDir === 'right') {
      primaryDir = 'backward';
      secondaryDir = 'right';
    } else if (primaryDir === 'backward' && secondaryDir === 'right') {
      primaryDir = 'forward';
      secondaryDir = 'right';
    }
    
    // For combined directions, use primary direction for rotation sign
    let rotationSign = 1; // positive for right/forward, negative for left/backward
    if (primaryDir === 'left' || primaryDir === 'backward') {
      rotationSign = -1;
    }
    
    this.targetRotation = rotationSign * this.openAngle;
    this.currentRotation = 0;
  }

  close() {
    if (!this.isOpen || this.isOpening) return;

    // Play door closing sound
    if (this.game && this.game.soundManager) {
      this.game.soundManager.playSFX('door', 0.5);
    }

    this.isOpening = true;
    this.targetRotation = 0;
    
    // Determine current rotation sign
    const directions = this.swingDirection.split(' ');
    let primaryDir = directions[0];
    let secondaryDir = directions[1];
    
    // Swap forward right <-> backward right
    if (primaryDir === 'forward' && secondaryDir === 'right') {
      primaryDir = 'backward';
      secondaryDir = 'right';
    } else if (primaryDir === 'backward' && secondaryDir === 'right') {
      primaryDir = 'forward';
      secondaryDir = 'right';
    }
    
    let rotationSign = 1;
    if (primaryDir === 'left' || primaryDir === 'backward') {
      rotationSign = -1;
    }
    
    this.currentRotation = rotationSign * this.openAngle;
  }

  update(delta, playerPosition = null) {
    if (this.isOpening) {
      const rotationStep = this.openSpeed * delta;
      const direction = this.targetRotation > this.currentRotation ? 1 : -1;

      this.currentRotation += rotationStep * direction;

      // Check if we've reached the target
      if ((direction > 0 && this.currentRotation >= this.targetRotation) ||
          (direction < 0 && this.currentRotation <= this.targetRotation)) {
        this.currentRotation = this.targetRotation;
        this.isOpening = false;
        this.isOpen = (this.targetRotation !== 0);
      }

      // Apply rotation to door panel
      if (this.doorPanel) {
        this.doorPanel.rotation.y = this.currentRotation;
      }
    }

    // Update auto-open cooldown
    if (this.autoOpenCooldown > 0) {
      this.autoOpenCooldown -= delta;
    }

    // Auto-open logic: check if player is within interaction distance and door should auto-open
    if (this.autoOpenOnApproach && !this.isOpen && !this.isOpening && playerPosition && this.autoOpenCooldown <= 0) {
      if (this.canPlayerInteract(playerPosition)) {
        console.log('Auto-opening door due to player proximity');
        this.open();
      }
    }

    // Update physics collision based on door state
    this._updatePhysicsBody();

    this._updateCollider();
  }

  _updatePhysicsBody() {
    // Always maintain collision for the door, whether open or closed
    if (!this.body) {
      try {
        // Simple collision: center on the door's visual center
        const collisionCenter = this.mesh.position.clone().add(new THREE.Vector3(0, this.size[1] / 2, 0));
        const collisionSize = [this.size[0], this.size[1], this.size[2]];

        console.log('Creating door physics body:', {
          collisionCenter: collisionCenter.toArray(),
          collisionSize
        });

        // Create a kinematic body for the door (movable but not affected by forces)
        this.body = this.physicsWorld.createDynamicBody({
          mass: 0, // Kinematic body (mass = 0 means it won't be affected by gravity)
          shape: 'box',
          size: collisionSize,
          position: [collisionCenter.x, collisionCenter.y, collisionCenter.z],
          material: 'wall' // Use wall material for proper collision
        });
        
        // Make it kinematic (controlled by animation, not physics forces)
        this.body.type = CANNON.Body.KINEMATIC;
        this.body.collisionResponse = true; // It blocks the player

        if (this.body) {
          console.log('Door physics body created successfully');
        } else {
          console.error('Failed to create door physics body');
        }
      } catch (error) {
        console.error('Error creating door physics body:', error);
        console.error('Error stack:', error.stack);
      }
    }

    // Update the physics body's position and rotation to match the door panel
    if (this.body && this.doorPanel) {
      // Get the world position and rotation of the door panel
      this.doorPanel.updateWorldMatrix(true, false);
      const worldPosition = new THREE.Vector3();
      const worldQuaternion = new THREE.Quaternion();
      this.doorPanel.getWorldPosition(worldPosition);
      this.doorPanel.getWorldQuaternion(worldQuaternion);

      // The doorPanel's world position is the hinge point
      // The center of the door is offset from the hinge based on swing direction
      const directions = this.swingDirection.split(' ');
      let primaryDir = directions[0];
      let secondaryDir = directions[1];
      
      // Swap forward right <-> backward right
      if (primaryDir === 'forward' && secondaryDir === 'right') {
        primaryDir = 'backward';
        secondaryDir = 'right';
      } else if (primaryDir === 'backward' && secondaryDir === 'right') {
        primaryDir = 'forward';
        secondaryDir = 'right';
      }
      
      let centerOffsetX = 0;
      let centerOffsetZ = 0;
      
      if (primaryDir === 'left') {
        centerOffsetX = this.size[0]/2;
      } else if (primaryDir === 'right') {
        centerOffsetX = -this.size[0]/2;
      } else if (primaryDir === 'forward') {
        centerOffsetZ = this.size[2]/2;
        if (secondaryDir === 'left') {
          centerOffsetX = this.size[0]/2;
        } else if (secondaryDir === 'right') {
          centerOffsetX = -this.size[0]/2;
        }
      } else if (primaryDir === 'backward') {
        centerOffsetZ = -this.size[2]/2;
        if (secondaryDir === 'left') {
          centerOffsetX = this.size[0]/2;
        } else if (secondaryDir === 'right') {
          centerOffsetX = -this.size[0]/2;
        }
      }
      
      const centerOffset = new THREE.Vector3(centerOffsetX, 0, centerOffsetZ);
      centerOffset.applyQuaternion(worldQuaternion); // Rotate the offset by the door's rotation
      worldPosition.add(centerOffset);

      // Update physics body to match the center of the visual door
      this.body.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      this.body.quaternion.set(worldQuaternion.x, worldQuaternion.y, worldQuaternion.z, worldQuaternion.w);

      // console.log('Updated door physics body position:', {
      //   doorPanelPos: this.doorPanel.position,
      //   worldPos: worldPosition,
      //   physicsPos: this.body.position,
      //   centerOffset: centerOffset,
      //   rotation: this.currentRotation
      // });
    }
  }

  toggleHelperVisible(v) {
    if (this.helper) this.helper.setVisible(v);
  }

  dispose() {
    if (this.body) {
      this.physicsWorld.removeBody(this.body);
      this.body = null;
    }
    if (this.helper) this.scene.remove(this.helper.mesh);
    if (this.mesh) this.scene.remove(this.mesh);
  }

  // Check if player can interact with this door
  canPlayerInteract(playerPosition) {
    // Use the full interaction distance for both open and closed doors (scaled by door size)
    const currentInteractionDistance = this.interactionDistance;

    if (!this.isOpen) {
      // When door is closed, calculate bounds accounting for initial rotation
      let halfWidth, halfDepth;

      // If door is rotated 90 degrees, swap width and depth for bounds calculation
      if (Math.abs(this.initialRotation) === 90) {
        halfWidth = this.size[2] / 2; // Use depth as width
        halfDepth = this.size[0] / 2; // Use width as depth
      } else {
        halfWidth = this.size[0] / 2; // Normal width
        halfDepth = this.size[2] / 2; // Normal depth
      }

      const doorMinX = this.mesh.position.x - halfWidth;
      const doorMaxX = this.mesh.position.x + halfWidth;
      const doorMinY = this.mesh.position.y;
      const doorMaxY = this.mesh.position.y + this.size[1];
      const doorMinZ = this.mesh.position.z - halfDepth;
      const doorMaxZ = this.mesh.position.z + halfDepth;

      const withinXBounds = playerPosition.x >= doorMinX && playerPosition.x <= doorMaxX;
      const withinYBounds = playerPosition.y >= doorMinY && playerPosition.y <= doorMaxY;
      const withinZBounds = playerPosition.z >= doorMinZ && playerPosition.z <= doorMaxZ;

      // Allow interaction if player is within bounds OR within interaction distance
      const xDistance = Math.min(Math.abs(playerPosition.x - doorMinX), Math.abs(playerPosition.x - doorMaxX));
      const zDistance = Math.min(Math.abs(playerPosition.z - doorMinZ), Math.abs(playerPosition.z - doorMaxZ));
      const withinInteractionDistance = xDistance <= currentInteractionDistance && zDistance <= currentInteractionDistance;

      const canInteract = (withinXBounds && withinYBounds && withinZBounds) || (withinYBounds && withinInteractionDistance);

      if (Math.abs(playerPosition.z - this.mesh.position.z) < 15 || withinXBounds) {
        console.log('Door interaction check (closed):', {
          playerPos: playerPosition,
          doorPos: this.mesh.position,
          doorBounds: { minX: doorMinX, maxX: doorMaxX, minY: doorMinY, maxY: doorMaxY, minZ: doorMinZ, maxZ: doorMaxZ },
          initialRotation: this.initialRotation,
          withinXBounds, withinYBounds, withinZBounds, withinInteractionDistance, canInteract
        });
      }

      return canInteract;
    } else {
      // When door is open, allow interaction from around the door panel's current position
      if (!this.doorPanel) {
        return false; // Cannot interact if doorPanel not loaded yet
      }
      this.doorPanel.updateWorldMatrix(true, false);
      const panelWorldPos = new THREE.Vector3();
      this.doorPanel.getWorldPosition(panelWorldPos);

      // Create bounds around the door panel (with some padding), accounting for rotation
      let halfWidth, halfDepth;

      // If door is rotated 90 degrees, swap width and depth for bounds calculation
      if (Math.abs(this.initialRotation) === 90) {
        halfWidth = this.size[2] / 2; // Use depth as width
        halfDepth = this.size[0] / 2; // Use width as depth
      } else {
        halfWidth = this.size[0] / 2; // Normal width
        halfDepth = this.size[2] / 2; // Normal depth
      }

      const panelMinX = panelWorldPos.x - halfWidth - 1; // Extra padding
      const panelMaxX = panelWorldPos.x + halfWidth + 1;
      const panelMinY = panelWorldPos.y - this.size[1] / 2 - 1;
      const panelMaxY = panelWorldPos.y + this.size[1] / 2 + 1;
      const panelMinZ = panelWorldPos.z - halfDepth - 1;
      const panelMaxZ = panelWorldPos.z + halfDepth + 1;

      const withinXBounds = playerPosition.x >= panelMinX && playerPosition.x <= panelMaxX;
      const withinYBounds = playerPosition.y >= panelMinY && playerPosition.y <= panelMaxY;
      const withinZBounds = playerPosition.z >= panelMinZ && playerPosition.z <= panelMaxZ;

      // Allow interaction if player is within bounds OR within interaction distance
      const xDistance = Math.min(Math.abs(playerPosition.x - panelMinX), Math.abs(playerPosition.x - panelMaxX));
      const zDistance = Math.min(Math.abs(playerPosition.z - panelMinZ), Math.abs(playerPosition.z - panelMaxZ));
      const withinInteractionDistance = xDistance <= currentInteractionDistance && zDistance <= currentInteractionDistance;

      const canInteract = (withinXBounds && withinYBounds && withinZBounds) || (withinYBounds && withinInteractionDistance);

      if (Math.abs(playerPosition.z - panelWorldPos.z) < 15 || withinXBounds) {
        console.log('Door interaction check (open):', {
          playerPos: playerPosition,
          panelWorldPos: panelWorldPos,
          panelBounds: { minX: panelMinX, maxX: panelMaxX, minY: panelMinY, maxY: panelMaxY, minZ: panelMinZ, maxZ: panelMaxZ },
          initialRotation: this.initialRotation,
          withinXBounds, withinYBounds, withinZBounds, withinInteractionDistance, canInteract
        });
      }

      return canInteract;
    }
  }
}