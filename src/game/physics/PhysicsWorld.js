import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import CannonDebugger from 'cannon-es-debugger';

export class PhysicsWorld {
  constructor(scene = null) {
    console.log('🌍 Initializing new Cannon.js Physics World...');
    
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
    } else {
      console.warn('🔧 No scene provided to PhysicsWorld constructor - debug renderer unavailable');
    }
    
    console.log('✅ Physics world initialized successfully');
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
    
    console.log('✅ Contact materials configured');
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
      
      console.log('🔧 Physics debug renderer initialized successfully');
    } catch (error) {
      console.error('🔧 Failed to initialize physics debug renderer:', error);
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
      console.log(`🔧 Physics debug visualization ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      console.warn('🔧 Physics debug renderer not available');
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
  
  addStaticMesh(mesh, materialType = 'ground') {
    try {
      const geometry = mesh.geometry;
      if (!geometry) {
        console.warn('Mesh has no geometry, skipping physics body creation');
        return null;
      }
      
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox();
      }
      
      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      
      const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
      
      const body = new CANNON.Body({
        mass: 0,
        type: CANNON.Body.KINEMATIC,
        material: this.materials[materialType] || this.materials.ground
      });
      
      body.addShape(shape);
      body.position.copy(mesh.position);
      body.quaternion.copy(mesh.quaternion);
      
      this.world.addBody(body);
      this.staticBodies.add(body);
      
      body.userData = { mesh: mesh, type: 'static' };
      
      console.log(`📦 Created static physics body for mesh: ${mesh.name || 'unnamed'}`);
      return body;
      
    } catch (error) {
      console.error('Failed to create static physics body:', error);
      return null;
    }
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
    
    body.linearDamping = 0.05; // Reduced from 0.1 to 0.02 for faster falling/jumping
    body.angularDamping = 0.9;
    body.allowSleep = false;
    
    this.world.addBody(body);
    this.bodies.add(body);
    
    body.userData = { type: 'dynamic' };
    
    console.log(`🎲 Created dynamic physics body (${shape}) at position [${position}]`);
    return body;
  }
  
  removeBody(body) {
    if (!body) return;
    
    this.world.removeBody(body);
    this.bodies.delete(body);
    this.staticBodies.delete(body);
    
    console.log('🗑️ Removed physics body from world');
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
    
    // console.log('🔍 Ground check:', {
    //   bodyPosition: { x: body.position.x.toFixed(2), y: body.position.y.toFixed(2), z: body.position.z.toFixed(2) },
    //   contactCount: contacts.length,
    //   threshold
    // });
    
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
      
      //console.log('📏 Contact normal Y (corrected):', normalY.toFixed(3), 'threshold:', threshold);
      if (normalY > threshold) {
        //console.log('✅ Ground contact found!');
        return true;
      }
    }
    
    //console.log('❌ No ground contact found');
    return false;
  }
  
  dispose() {
    console.log('🧹 Disposing physics world...');
    
    const allBodies = [...this.bodies, ...this.staticBodies];
    allBodies.forEach(body => {
      this.world.removeBody(body);
    });
    
    this.bodies.clear();
    this.staticBodies.clear();
    
    this.world.contactMaterials = [];
    
    if (this.debugRenderer) {
      this.debugEnabled = false;
      this.debugRenderer = null;
    }
    
    console.log('✅ Physics world disposed');
  }
}