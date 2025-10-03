import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import CannonDebugger from 'cannon-es-debugger';

export class PhysicsWorld {
  constructor(scene = null, options = {}) {
    // Global physics settings
    this.defaultUseAccurateCollision = options.useAccurateCollision || false;
    this.debugMode = options.debugMode || false;
    
    // Create Cannon.js world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });
    
    // Store reference to Three.js scene for debug rendering
    this.scene = scene;
    this.debugRenderer = null;
    this.debugEnabled = false;
    
    // Configure solver for better stability
    this.world.solver.iterations = 20;
    this.world.solver.tolerance = 0.0001;
    
    // Use Sweep and Prune broadphase for better performance
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    
    // Configure global contact settings
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.0;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;
    this.world.defaultContactMaterial.frictionEquationStiffness = 1e8;
    this.world.defaultContactMaterial.frictionEquationRelaxation = 3;
    
    // Allow sleeping for performance
    this.world.allowSleep = true;
    
    // Create materials for different object types
    this.materials = {
      ground: new CANNON.Material('ground'),
      player: new CANNON.Material('player'),
      enemy: new CANNON.Material('enemy'),
      wall: new CANNON.Material('wall'),
      platform: new CANNON.Material('platform')
    };
    
    // Create contact materials for different material interactions
    this.setupContactMaterials();
    
    // Track all bodies for cleanup
    this.bodies = new Set();
    this.staticBodies = new Set();
    
    // Initialize debug renderer if scene is provided
    if (this.scene) {
      this.initDebugRenderer();
    }
  }
  
  setupContactMaterials() {
    // Player-Ground contact: Lower friction for smooth movement, no bounce
    const playerGroundContact = new CANNON.ContactMaterial(
      this.materials.player,
      this.materials.ground,
      {
        friction: 0.1,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(playerGroundContact);
    
    // Player-Platform contact: Same as ground
    const playerPlatformContact = new CANNON.ContactMaterial(
      this.materials.player,
      this.materials.platform,
      {
        friction: 0.1,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(playerPlatformContact);
    
    // Player-Wall contact: High friction to prevent sliding
    const playerWallContact = new CANNON.ContactMaterial(
      this.materials.player,
      this.materials.wall,
      {
        friction: 0.1,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(playerWallContact);
    
    // Enemy-Ground contact: Lower friction for sliding movement
    const enemyGroundContact = new CANNON.ContactMaterial(
      this.materials.enemy,
      this.materials.ground,
      {
        friction: 0.3,
        restitution: 0.1,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(enemyGroundContact);
  }
  
  initDebugRenderer() {
    try {
      this.debugRenderer = new CannonDebugger(this.scene, this.world, {
        color: 0x00ff00,
        scale: 1.0,
        onInit: (body, mesh) => {
          if (mesh.material) {
            mesh.material.wireframe = true;
            mesh.material.transparent = true;
            mesh.material.opacity = 0.4;
            mesh.material.color.setHex(0x00ff00);
          }
          // Mark this as a debug mesh for visibility control
          mesh.userData.cannonDebugRenderer = true;
        }
      });
      
      // Initially hide debug meshes
      this.setDebugVisibility(false);
    } catch (error) {
      this.debugRenderer = null;
    }
  }
  
  setDebugVisibility(visible) {
    if (!this.debugRenderer) return;
    
    // Find all debug meshes in the scene and set their visibility
    this.scene.traverse((child) => {
      if (child.userData && child.userData.cannonDebugRenderer) {
        child.visible = visible;
      }
    });
  }
  
  enableDebugRenderer(enabled = true) {
    this.debugEnabled = enabled;
    
    if (this.debugRenderer) {
      this.setDebugVisibility(enabled);
    }
    
    return this.debugRenderer !== null;
  }
  
  isDebugEnabled() {
    return this.debugEnabled && this.debugRenderer !== null;
  }

  step(deltaTime) {
    // Clamp delta time to prevent physics explosions
    const maxDelta = 1/30;
    const clampedDelta = Math.min(deltaTime, maxDelta);
    
    // Step physics simulation
    this.world.step(clampedDelta);
    
    // Update debug renderer if enabled
    if (this.debugEnabled && this.debugRenderer) {
      this.debugRenderer.update();
    }
  }
  
  addStaticMesh(mesh, materialType = 'ground', options = {}) {
    try {
      const geometry = mesh.geometry;
      if (!geometry) {
        return null;
      }

      const {
        useAccurateCollision = this.defaultUseAccurateCollision,
        forceBoxCollider = false
      } = options;

      let shape;
      const meshName = mesh.name.toLowerCase();

      // Determine collision type based on mesh name or options
      // Be conservative: only use Trimesh for explicitly marked meshes
      const shouldUseAccurate = useAccurateCollision && 
                               (meshName.includes('trimesh') || 
                                meshName.includes('accurate') ||
                                meshName.includes('complex')) &&
                               !forceBoxCollider &&
                               !meshName.includes('box') && 
                               !meshName.includes('simple') &&
                               !meshName.includes('collider'); // collider_ prefix suggests simple collision

      if (shouldUseAccurate && !forceBoxCollider) {
        // Use Trimesh for accurate collision detection
        shape = this._createTrimeshShape(geometry, mesh);
      } else {
        // Use bounding box collision (faster but less accurate)
        // Calculate the actual scaled bounding box
        const scaledSize = this._getScaledBoundingBoxSize(geometry, mesh);
        
        shape = new CANNON.Box(new CANNON.Vec3(scaledSize.x / 2, scaledSize.y / 2, scaledSize.z / 2));
      }

      const body = new CANNON.Body({
        mass: 0,
        type: CANNON.Body.KINEMATIC,
        material: this.materials[materialType] || this.materials.ground
      });

      body.addShape(shape);
      
      // Use the mesh's local transform (GLTF meshes usually have correct local transforms)
      body.position.copy(mesh.position);
      body.quaternion.copy(mesh.quaternion);
      
      this.world.addBody(body);
      this.staticBodies.add(body);
      
      body.userData = { 
        mesh: mesh, 
        type: 'static',
        collisionType: shouldUseAccurate ? 'trimesh' : 'box'
      };
      
      return body;
      
    } catch (error) {
      return null;
    }
  }

  _getScaledBoundingBoxSize(geometry, mesh) {
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }

    // Get the unscaled size
    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    
    // Apply the mesh's local scale (not world scale)
    size.multiply(mesh.scale);
    
    return size;
  }

  _createTrimeshShape(geometry, mesh) {
    // Get position attribute from geometry
    const position = geometry.attributes.position;
    if (!position) {
      return this._createBoxShape(geometry, mesh);
    }

    // Create vertices array for Cannon.js
    const vertices = [];
    const indices = [];

    // Extract vertices
    for (let i = 0; i < position.count; i++) {
      vertices.push(
        position.getX(i) * mesh.scale.x,
        position.getY(i) * mesh.scale.y,
        position.getZ(i) * mesh.scale.z
      );
    }

    // Extract indices (faces)
    if (geometry.index) {
      // Indexed geometry
      const indexArray = geometry.index.array;
      for (let i = 0; i < indexArray.length; i++) {
        indices.push(indexArray[i]);
      }
    } else {
      // Non-indexed geometry - create indices
      for (let i = 0; i < position.count; i++) {
        indices.push(i);
      }
    }

    try {
      // Validate Trimesh data
      if (vertices.length === 0 || indices.length === 0) {
        return this._createBoxShape(geometry, mesh);
      }
      
      if (vertices.length % 3 !== 0) {
        return this._createBoxShape(geometry, mesh);
      }
      
      const trimesh = new CANNON.Trimesh(vertices, indices);
      return trimesh;
    } catch (error) {
      return this._createBoxShape(geometry, mesh);
    }
  }

  _createBoxShape(geometry, mesh) {
    const scaledSize = this._getScaledBoundingBoxSize(geometry, mesh);
    return new CANNON.Box(new CANNON.Vec3(scaledSize.x / 2, scaledSize.y / 2, scaledSize.z / 2));
  }
  
  createDynamicBody(options = {}) {
    const {
      mass = 1,
      shape = 'box',
      size = [1, 1, 1],
      position = [0, 0, 0],
      material = 'player'
    } = options;
    
    let cannonShape;
    
    switch (shape) {
      case 'box':
        cannonShape = new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2));
        break;
      case 'sphere':
        cannonShape = new CANNON.Sphere(size[0]);
        break;
      case 'cylinder':
        cannonShape = new CANNON.Cylinder(size[0], size[1], size[2], 8);
        break;
      default:
        cannonShape = new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2));
    }
    
    const body = new CANNON.Body({
      mass: mass,
      type: CANNON.Body.DYNAMIC,
      material: this.materials[material] || this.materials.player
    });
    
    body.addShape(cannonShape);
    body.position.set(position[0], position[1], position[2]);
    
    body.linearDamping = 0.05; 
    body.angularDamping = 0.9;
    body.allowSleep = false;
    
    this.world.addBody(body);
    this.bodies.add(body);
    
    body.userData = { type: 'dynamic' };
    
    return body;
  }
  
  removeBody(body) {
    if (!body) return;
    
    this.world.removeBody(body);
    this.bodies.delete(body);
    this.staticBodies.delete(body);
  }
  
  getContactsForBody(body) {
    const contacts = [];
    
    for (let i = 0; i < this.world.contacts.length; i++) {
      const contact = this.world.contacts[i];
      if (contact.bi === body || contact.bj === body) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  }
  
  isBodyGrounded(body, threshold = 0.5) {
    const contacts = this.getContactsForBody(body);
    
    for (const contact of contacts) {
      // The contact normal direction depends on which body is bi vs bj
      // If our body is bi, normal points from us to other body (downward = negative Y)
      // If our body is bj, normal points from other body to us (upward = positive Y)
      let normalY;
      if (contact.bi === body) {
        // We are body i, so normal points from us to other body
        // For ground contact, we want the opposite direction (upward)
        normalY = -contact.ni.y;
      } else {
        // We are body j, so normal points from other body to us
        // For ground contact, this should be upward (positive Y)
        normalY = contact.ni.y;
      }
      
      if (normalY > threshold) {
        return true;
      }
    }
    
    return false;
  }
  
  // Manual collider creation methods for editor
  addStaticBox(position, size, materialType = 'ground') {
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({ mass: 0, material: this.materials[materialType] });
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    body.type = CANNON.Body.KINEMATIC;
    
    this.world.addBody(body);
    this.staticBodies.add(body);
    
    return body;
  }
  
  addStaticSphere(position, radius, materialType = 'ground') {
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({ mass: 0, material: this.materials[materialType] });
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    body.type = CANNON.Body.KINEMATIC;
    
    this.world.addBody(body);
    this.staticBodies.add(body);
    
    return body;
  }
  
  createDoorBody(position, size) {
    try {
      const shape = new CANNON.Box(new CANNON.Vec3(size[0]/2, size[1]/2, size[2]/2));
      const body = new CANNON.Body({
        mass: 0,
        type: CANNON.Body.KINEMATIC,
        material: this.materials.wall || this.materials.ground
      });
      
      body.addShape(shape);
      body.position.set(position.x, position.y, position.z);
      
      this.world.addBody(body);
      this.staticBodies.add(body);
      
      body.userData = { 
        type: 'door',
        collisionType: 'box'
      };
      
      console.log('Created door physics body:', {
        position: body.position,
        size: size,
        shape: shape
      });
      
      return body;
    } catch (error) {
      console.error('Failed to create door physics body:', error);
      return null;
    }
  }
  
  dispose() {
    const allBodies = [...this.bodies, ...this.staticBodies];
    allBodies.forEach(body => {
      this.world.removeBody(body);
    });
    
    this.bodies.clear();
    this.staticBodies.clear();
    
    this.world.contactMaterials = [];
    
    if (this.debugRenderer) {
      // Clean up debug renderer meshes from scene before disposing
      this._clearDebugMeshes();
      this.debugEnabled = false;
      this.debugRenderer = null;
    }
  }

  _clearDebugMeshes() {
    // Find and remove all debug renderer meshes from the scene
    const meshesToRemove = [];
    this.scene.traverse((child) => {
      if (child.userData && child.userData.cannonDebugRenderer) {
        meshesToRemove.push(child);
      }
    });
    
    meshesToRemove.forEach(mesh => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      // Clean up geometry and material to prevent memory leaks
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }
}