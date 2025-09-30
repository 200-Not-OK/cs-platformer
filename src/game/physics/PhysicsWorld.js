import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });
    
    // Improve performance
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
    this.world.defaultContactMaterial.contactEquationRelaxation = 4;
    
    // Allow sleeping for better performance
    this.world.allowSleep = true;
    this.world.sleepSpeedLimit = 0.1;
    this.world.sleepTimeLimit = 1;
    
    // Materials for different types of objects
    this.groundMaterial = new CANNON.Material('ground');
    this.playerMaterial = new CANNON.Material('player');
    this.enemyMaterial = new CANNON.Material('enemy');
    
    // Contact materials for realistic physics interactions
    this.playerGroundContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.groundMaterial,
      {
        friction: 0.4,
        restitution: 0.1,
        contactEquationStiffness: 1e9,
        contactEquationRelaxation: 4
      }
    );
    this.world.addContactMaterial(this.playerGroundContact);
    
    this.enemyGroundContact = new CANNON.ContactMaterial(
      this.enemyMaterial,
      this.groundMaterial,
      {
        friction: 0.3,
        restitution: 0.1
      }
    );
    this.world.addContactMaterial(this.enemyGroundContact);
    
    // Store bodies for cleanup
    this.bodies = new Set();
    
    // Debug logging
    console.log('🔧 Physics world initialized with gravity:', this.world.gravity);
  }

  addStaticMeshFromGeometry(geometry, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1)) {
    // Create trimesh shape for exact collision with level geometry
    const vertices = [];
    const indices = [];
    
    const positionAttribute = geometry.attributes.position;
    if (!positionAttribute) return null;
    
    // Extract vertices
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push(
        positionAttribute.getX(i) * scale.x,
        positionAttribute.getY(i) * scale.y,
        positionAttribute.getZ(i) * scale.z
      );
    }
    
    // Extract indices
    if (geometry.index) {
      const indexAttribute = geometry.index;
      for (let i = 0; i < indexAttribute.count; i++) {
        indices.push(indexAttribute.getX(i));
      }
    } else {
      // Generate indices if none exist
      for (let i = 0; i < positionAttribute.count; i++) {
        indices.push(i);
      }
    }
    
    const trimeshShape = new CANNON.Trimesh(vertices, indices);
    const body = new CANNON.Body({ 
      mass: 0, // Static body
      material: this.groundMaterial,
      type: CANNON.Body.KINEMATIC
    });
    
    body.addShape(trimeshShape);
    body.position.set(position.x, position.y, position.z);
    body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    
    this.world.addBody(body);
    this.bodies.add(body);
    return body;
  }

  addStaticMesh(mesh) {
    // Create static body from Three.js mesh
    const body = this.addStaticMeshFromGeometry(
      mesh.geometry,
      mesh.position,
      mesh.quaternion,
      mesh.scale
    );
    
    // Store reference for cleanup
    if (body) {
      mesh.userData.physicsBody = body;
    }
    
    return body;
  }

  createPlayerBody(position = new THREE.Vector3()) {
    // Use cylinder shape for player (closest to capsule in Cannon.js)
    const radius = 0.3;
    const height = 1.4;
    const shape = new CANNON.Cylinder(radius, radius, height, 8);
    
    const body = new CANNON.Body({
      mass: 1,
      material: this.playerMaterial,
      type: CANNON.Body.DYNAMIC, // Explicitly set as dynamic
      fixedRotation: true // Prevent player from tipping over
    });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    
    // Set damping for realistic movement
    body.angularDamping = 0.9;
    body.linearDamping = 0.1;
    
    // Make sure the body can move
    body.allowSleep = false; // Prevent the body from sleeping
    body.sleepState = CANNON.Body.AWAKE;
    
    this.world.addBody(body);
    this.bodies.add(body);
    
    console.log('🚀 Player body created:', {
      mass: body.mass,
      type: body.type,
      position: body.position,
      material: body.material?.name,
      canSleep: body.allowSleep
    });
    
    return body;
  }

  createEnemyBody(position = new THREE.Vector3(), size = [1, 1, 1]) {
    // Use box shape for enemies
    const halfExtents = new CANNON.Vec3(size[0] * 0.3, size[1] * 0.5, size[2] * 0.3);
    const shape = new CANNON.Box(halfExtents);
    
    const body = new CANNON.Body({
      mass: 0.5,
      material: this.enemyMaterial,
      fixedRotation: true
    });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    body.angularDamping = 0.9;
    body.linearDamping = 0.1;
    
    this.world.addBody(body);
    this.bodies.add(body);
    return body;
  }

  removeBody(body) {
    if (body && this.bodies.has(body)) {
      this.world.removeBody(body);
      this.bodies.delete(body);
    }
  }

  step(deltaTime) {
    // Clamp deltaTime to prevent physics explosion
    const clampedDelta = Math.min(deltaTime, 1/30);
    this.world.step(clampedDelta);
    
    // Debug logging every 60 frames (approximately 1 second)
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    if (this._debugCounter % 60 === 0) {
      console.log('⚡ Physics step:', {
        deltaTime: clampedDelta,
        bodies: this.world.bodies.length,
        contacts: this.world.contacts.length
      });
    }
  }

  raycast(from, to, options = {}) {
    const raycastResult = new CANNON.RaycastResult();
    this.world.raycastClosest(from, to, options, raycastResult);
    return raycastResult;
  }

  // Check if a body is grounded using raycast
  isGrounded(body, rayLength = 0.1) {
    const rayStart = body.position.clone();
    const rayEnd = rayStart.clone();
    rayEnd.y -= rayLength;
    
    const result = this.raycast(rayStart, rayEnd, {
      collisionFilterMask: 1, // Only check against static bodies
      skipBackfaces: true
    });
    
    return result.hasHit;
  }

  cleanup() {
    // Remove all bodies
    for (const body of this.bodies) {
      this.world.removeBody(body);
    }
    this.bodies.clear();
  }
}