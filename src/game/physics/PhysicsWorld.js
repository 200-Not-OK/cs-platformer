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
    
    // Disable sleeping entirely for debugging
    this.world.allowSleep = false;
    
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
    
    // Create a simple test body to verify physics is working
    this.createTestBody();
  }

  createTestBody() {
    console.log('🧪 Creating test physics body...');
    const testShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const testBody = new CANNON.Body({
      mass: 1,
      type: CANNON.Body.DYNAMIC
    });
    testBody.addShape(testShape);
    testBody.position.set(5, 15, 5); // Place it away from player
    testBody.allowSleep = false;
    
    this.world.addBody(testBody);
    this.bodies.add(testBody);
    
    console.log('🧪 Test body created at position:', testBody.position);
    
    // Check if it falls after 2 seconds
    setTimeout(() => {
      console.log('🧪 Test body after 2 seconds:', {
        position: testBody.position,
        velocity: testBody.velocity,
        fell: testBody.position.y < 14
      });
    }, 2000);
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
      type: CANNON.Body.STATIC // Use STATIC for solid level geometry
    });
    
    body.addShape(trimeshShape);
    body.position.set(position.x, position.y, position.z);
    body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    
    this.world.addBody(body);
    this.bodies.add(body);
    return body;
  }

  addStaticMesh(mesh) {
    // Check if this is a simple box geometry for more efficient collision
    if (mesh.geometry.type === 'BoxGeometry') {
      return this.addStaticBox(mesh);
    }
    
    // Create static body from Three.js mesh using trimesh
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

  addStaticBox(mesh) {
    // Create a more efficient box collision shape for box geometries
    const geometry = mesh.geometry;
    const scale = mesh.scale;
    
    // Get box dimensions from geometry parameters
    const width = geometry.parameters.width * scale.x;
    const height = geometry.parameters.height * scale.y;
    const depth = geometry.parameters.depth * scale.z;
    
    console.log(`📦 Creating box collider: ${width}x${height}x${depth} at ${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z}`);
    
    const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    const body = new CANNON.Body({ 
      mass: 0, // Static body
      material: this.groundMaterial,
      type: CANNON.Body.STATIC
    });
    
    body.addShape(shape);
    body.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
    body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);
    
    this.world.addBody(body);
    this.bodies.add(body);
    
    // Store reference for cleanup
    mesh.userData.physicsBody = body;
    
    return body;
  }

  createPlayerBody(position = new THREE.Vector3()) {
    // Use a simple box shape first to test if physics works
    const width = 0.6;
    const height = 1.8;
    const depth = 0.6;
    const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    
    const body = new CANNON.Body({
      mass: 1,
      material: this.playerMaterial
    });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    
    // Minimal damping for testing
    body.angularDamping = 0.01;
    body.linearDamping = 0.01;
    
    // Ensure the body is active and can be affected by physics
    body.allowSleep = false;
    body.sleepState = CANNON.Body.AWAKE;
    body.type = CANNON.Body.DYNAMIC;
    
    // Don't lock rotation initially to test if physics works at all
    // body.fixedRotation = true;
    
    // Manually update mass properties
    body.updateMassProperties();
    
    this.world.addBody(body);
    this.bodies.add(body);
    
    // Test: manually apply a downward force to see if it responds
    setTimeout(() => {
      console.log('🧪 Testing physics with manual force...');
      body.applyImpulse(new CANNON.Vec3(0, -10, 0));
      console.log('Applied downward impulse, velocity should change:', body.velocity);
    }, 1000);
    
    console.log('🚀 Player body created (box shape):', {
      mass: body.mass,
      type: body.type,
      position: body.position,
      velocity: body.velocity,
      material: body.material?.name,
      canSleep: body.allowSleep,
      inWorld: this.world.bodies.includes(body),
      worldGravity: this.world.gravity,
      bodyId: body.id
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
    
    // Debug: List ALL bodies and their properties
    console.log('🔍 All bodies in world:', this.world.bodies.map(body => ({
      id: body.id,
      type: body.type,
      typeName: body.type === CANNON.Body.DYNAMIC ? 'DYNAMIC' : 
                body.type === CANNON.Body.STATIC ? 'STATIC' : 
                body.type === CANNON.Body.KINEMATIC ? 'KINEMATIC' : 'UNKNOWN',
      mass: body.mass,
      pos: `${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}, ${body.position.z.toFixed(2)}`,
      vel: `${body.velocity.x.toFixed(2)}, ${body.velocity.y.toFixed(2)}, ${body.velocity.z.toFixed(2)}`,
      awake: body.sleepState === CANNON.Body.AWAKE,
      shapes: body.shapes.length
    })));

    // Find player body - try multiple methods
    let playerBody = this.world.bodies.find(body => body.id === 1); // Try by ID first
    if (!playerBody) {
      playerBody = this.world.bodies.find(body => 
        body.mass === 1 && body.type === CANNON.Body.DYNAMIC
      );
    }
    if (!playerBody) {
      // Find any dynamic body with mass > 0
      playerBody = this.world.bodies.find(body => 
        body.type === CANNON.Body.DYNAMIC && body.mass > 0
      );
    }
    
    // Log body states before step
    const beforeStep = playerBody ? {
      id: playerBody.id,
      pos: {...playerBody.position},
      vel: {...playerBody.velocity},
      awake: playerBody.sleepState === CANNON.Body.AWAKE,
      type: playerBody.type,
      mass: playerBody.mass
    } : null;
    
    // Wake up all dynamic bodies to ensure they respond to gravity
    this.world.bodies.forEach(body => {
      if (body.type === CANNON.Body.DYNAMIC && body.sleepState !== CANNON.Body.AWAKE) {
        console.log(`💤 Waking up sleeping body ${body.id}`);
        body.wakeUp();
      }
      
      // MANUAL GRAVITY TEST: Apply gravity force manually to see if forces work
      if (body.type === CANNON.Body.DYNAMIC && body.mass > 0) {
        // Apply gravity manually: F = mg
        const gravityForce = new CANNON.Vec3(0, -9.82 * body.mass, 0);
        body.force.vadd(gravityForce, body.force);
      }
    });
    
    this.world.step(clampedDelta);
    
    // Log body states after step
    const afterStep = playerBody ? {
      id: playerBody.id,
      pos: {...playerBody.position},
      vel: {...playerBody.velocity},
      awake: playerBody.sleepState === CANNON.Body.AWAKE,
      type: playerBody.type,
      mass: playerBody.mass
    } : null;
    
    // Debug logging every 60 frames (approximately 1 second)
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    if (this._debugCounter % 60 === 0) {
      console.log('⚡ Physics step detailed:', {
        deltaTime: clampedDelta,
        bodies: this.world.bodies.length,
        contacts: this.world.contacts.length,
        playerFound: !!playerBody,
        beforeStep,
        afterStep,
        positionChanged: beforeStep && afterStep ? 
          (beforeStep.pos.x !== afterStep.pos.x || 
           beforeStep.pos.y !== afterStep.pos.y || 
           beforeStep.pos.z !== afterStep.pos.z) : false,
        velocityChanged: beforeStep && afterStep ?
          (beforeStep.vel.x !== afterStep.vel.x || 
           beforeStep.vel.y !== afterStep.vel.y || 
           beforeStep.vel.z !== afterStep.vel.z) : false,
        gravityApplied: beforeStep && afterStep ? afterStep.vel.y < beforeStep.vel.y : false
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