import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { loadGLTFModel } from './gltfLoader.js';

/**
 * CollectiblesManager handles spawning and management of collectible items in the game world
 * Supports apples, healing potions, and extensible collectible types
 */
export class CollectiblesManager {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.collectibles = new Map(); // Store active collectibles by ID
    this.playerRef = null; // Will be set by game
    this.uiRef = null; // Reference to collectibles UI component
    this.pendingLevelData = null; // Store level data if physics world isn't ready
    
    // Event system for collectible pickup
    this.eventListeners = {
      onAppleCollected: [],
      onPotionCollected: [],
      onCollectiblePickup: []
    };
    
    // Materials for physics
    this.collectibleMaterial = new CANNON.Material('collectible');
    this.collectibleMaterial.friction = 0.1;
    this.collectibleMaterial.restitution = 0.3;
  }

  /**
   * Set references to player and UI components
   */
  setReferences(player, collectiblesUI) {
    this.playerRef = player;
    this.uiRef = collectiblesUI;
  }

  /**
   * Set reference to interaction prompt UI
   */
  setInteractionPrompt(interactionPrompt) {
    this.interactionPrompt = interactionPrompt;
    console.log('🎯 CollectiblesManager: Interaction prompt set', this.interactionPrompt);
  }

  /**
   * Update physics world reference (called during level transitions)
   */
  updatePhysicsWorld(physicsWorld) {
    console.log('🔄 Updating collectibles physics world reference', physicsWorld);
    this.physicsWorld = physicsWorld;
    
    // Update material in the new physics world
    this.collectibleMaterial = new CANNON.Material('collectible');
    this.collectibleMaterial.friction = 0.1;
    this.collectibleMaterial.restitution = 0.3;
    
    console.log('✅ CollectiblesManager physics world updated', {
      hasAddBody: !!(this.physicsWorld && this.physicsWorld.addBody),
      worldType: this.physicsWorld ? this.physicsWorld.constructor.name : 'null'
    });
    
    // If we have pending level data and physics world is now ready, spawn collectibles
    if (this.pendingLevelData && this.physicsWorld && this.physicsWorld.addBody) {
      console.log('🚀 Physics world ready! Spawning pending collectibles...');
      this.spawnCollectiblesForLevel(this.pendingLevelData);
    }
  }

  /**
   * Spawn a chest at the given position containing a collectible
   */
  async spawnChest(position, id, contents) {
    // Safety check for physics world
    if (!this.physicsWorld) {
      console.warn('⚠️ Physics world is null/undefined');
      return;
    }
    if (!this.physicsWorld.addBody) {
      console.warn('⚠️ Physics world missing addBody method', this.physicsWorld);
      return;
    }

    const chest = await this.createChestMesh();
    chest.position.set(...position);
    chest.userData.collectibleType = 'chest';
    chest.userData.collectibleId = id;
    chest.userData.contents = contents;
    chest.userData.isOpen = false;
    
    // Store original position for interaction animations
    chest.userData.originalY = position[1];
    chest.userData.isAnimating = false;
    
    // Calculate physics body size based on actual chest dimensions
    const chestBox = new THREE.Box3().setFromObject(chest);
    const chestSize = chestBox.getSize(new THREE.Vector3());
    
    // Create physics body for interaction detection with appropriate size
    const halfExtents = new CANNON.Vec3(
      chestSize.x / 2,
      chestSize.y / 2, 
      chestSize.z / 2
    );
    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({ 
      mass: 0, // Static chest
      material: this.collectibleMaterial 
    });
    body.addShape(shape);
    body.position.set(...position);
    body.isTrigger = true; // Make it a trigger for proximity detection
    body.userData = { collectibleType: 'chest', collectibleId: id, mesh: chest, contents: contents };
    
    console.log(`📦 Created physics body for chest: ${chestSize.x.toFixed(2)} x ${chestSize.y.toFixed(2)} x ${chestSize.z.toFixed(2)}`);
    
    this.scene.add(chest);
    this.physicsWorld.addBody(body);
    
    this.collectibles.set(id, {
      type: 'chest',
      mesh: chest,
      body: body,
      id: id,
      contents: contents,
      collected: false,
      isOpen: false
    });
    
    console.log(`📦 Spawned chest containing ${contents} at position: [${position.join(', ')}]`);
  }

  /**
   * Spawn collectibles for a level based on level data
   */
  async spawnCollectiblesForLevel(levelData) {
    if (!levelData.collectibles) return;
    
    console.log('🍎 Spawning collectibles for level:', levelData.id);
    console.log('🔍 Physics world status:', {
      exists: !!this.physicsWorld,
      hasAddBody: !!(this.physicsWorld && this.physicsWorld.addBody),
      worldType: this.physicsWorld ? this.physicsWorld.constructor.name : 'null',
      methods: this.physicsWorld ? Object.getOwnPropertyNames(Object.getPrototypeOf(this.physicsWorld)) : []
    });
    
    // If physics world isn't ready, store level data for later
    if (!this.physicsWorld || !this.physicsWorld.addBody) {
      console.log('⏳ Physics world not ready, storing level data for later spawning...');
      this.pendingLevelData = levelData;
      return;
    }
    
    // Clear any pending data since we're spawning now
    this.pendingLevelData = null;
    
    // Spawn chests with collectibles
    if (levelData.collectibles.chests) {
      for (const chest of levelData.collectibles.chests) {
        await this.spawnChest(chest.position, chest.id, chest.contents);
      }
    }
    
    // Legacy support for old apple/potion format
    if (levelData.collectibles.apples) {
      for (const apple of levelData.collectibles.apples) {
        this.spawnApple(apple.position, apple.id || this.generateId('apple'));
      }
    }
    
    if (levelData.collectibles.potions) {
      for (const potion of levelData.collectibles.potions) {
        this.spawnHealingPotion(potion.position, potion.id || this.generateId('potion'));
      }
    }
    
    console.log(`✅ Spawned ${this.collectibles.size} collectibles`);
  }

  /**
   * Spawn an apple collectible at the given position
   */
  spawnApple(position, id) {
    // Safety check for physics world
    if (!this.physicsWorld) {
      console.warn('⚠️ Physics world is null/undefined');
      return;
    }
    if (!this.physicsWorld.addBody) {
      console.warn('⚠️ Physics world missing addBody method', this.physicsWorld);
      return;
    }

    const apple = this.createAppleMesh();
    apple.position.set(...position);
    apple.userData.collectibleType = 'apple';
    apple.userData.collectibleId = id;
    
    // Add floating animation
    apple.userData.originalY = position[1];
    apple.userData.floatPhase = Math.random() * Math.PI * 2;
    
    // Create physics body
    const shape = new CANNON.Sphere(0.4);
    const body = new CANNON.Body({ 
      mass: 0, // Static collectible
      material: this.collectibleMaterial 
    });
    body.addShape(shape);
    body.position.set(...position);
    body.isTrigger = true; // Make it a trigger for pickup detection
    body.userData = { collectibleType: 'apple', collectibleId: id, mesh: apple };
    
    this.scene.add(apple);
    this.physicsWorld.addBody(body);
    
    this.collectibles.set(id, {
      type: 'apple',
      mesh: apple,
      body: body,
      id: id,
      collected: false
    });
    
    console.log(`🍎 Spawned apple at position: [${position.join(', ')}]`);
  }

  /**
   * Spawn a healing potion collectible at the given position
   */
  spawnHealingPotion(position, id) {
    // Safety check for physics world
    if (!this.physicsWorld) {
      console.warn('⚠️ Physics world is null/undefined');
      return;
    }
    if (!this.physicsWorld.addBody) {
      console.warn('⚠️ Physics world missing addBody method', this.physicsWorld);
      return;
    }

    const potion = this.createPotionMesh();
    potion.position.set(...position);
    potion.userData.collectibleType = 'potion';
    potion.userData.collectibleId = id;
    
    // Add gentle bobbing animation
    potion.userData.originalY = position[1];
    potion.userData.floatPhase = Math.random() * Math.PI * 2;
    
    // Create physics body
    const shape = new CANNON.Cylinder(0.3, 0.3, 0.8, 8);
    const body = new CANNON.Body({ 
      mass: 0, // Static collectible
      material: this.collectibleMaterial 
    });
    body.addShape(shape);
    body.position.set(...position);
    body.isTrigger = true; // Make it a trigger for pickup detection
    body.userData = { collectibleType: 'potion', collectibleId: id, mesh: potion };
    
    this.scene.add(potion);
    this.physicsWorld.addBody(body);
    
    this.collectibles.set(id, {
      type: 'potion',
      mesh: potion,
      body: body,
      id: id,
      collected: false
    });
    
    console.log(`🧪 Spawned healing potion at position: [${position.join(', ')}]`);
  }

  /**
   * Create the visual mesh for a chest
   */
  /**
   * Create a chest mesh from GLTF model
   */
  async createChestMesh() {
    try {
      const gltf = await loadGLTFModel('src/assets/collectables/chest/scene.gltf');
      const chest = gltf.scene.clone();
      
      // Calculate the size before scaling
      const originalBox = new THREE.Box3().setFromObject(chest);
      const originalSize = originalBox.getSize(new THREE.Vector3());
      
      // Target chest size (should be reasonable for a collectible chest)
      const targetSize = 2.5; // Increased size - maximum dimension should be about 2.5 units
      const maxDimension = Math.max(originalSize.x, originalSize.y, originalSize.z);
      const scaleFactor = targetSize / maxDimension;
      
      // Scale the chest to reasonable size
      chest.scale.setScalar(scaleFactor);
      
      console.log(`📦 Chest original size: ${originalSize.x.toFixed(2)} x ${originalSize.y.toFixed(2)} x ${originalSize.z.toFixed(2)}, scale factor: ${scaleFactor.toFixed(3)}`);
      
      // Set up animations if they exist
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(chest);
        chest.userData.mixer = mixer;
        chest.userData.animations = {};
        
        // Find open and close animations
        gltf.animations.forEach(clip => {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          
          // Store animations by name (assuming they're named 'open' and 'close' or similar)
          if (clip.name.toLowerCase().includes('open')) {
            chest.userData.animations.open = action;
          } else if (clip.name.toLowerCase().includes('close')) {
            chest.userData.animations.close = action;
          }
          
          console.log(`🎬 Found animation: ${clip.name}`);
        });
      }
      
      // Ensure chest is centered and grounded after scaling
      const scaledBox = new THREE.Box3().setFromObject(chest);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      const finalSize = scaledBox.getSize(new THREE.Vector3());
      
      // Center the chest horizontally but keep it grounded
      chest.position.x -= scaledCenter.x;
      chest.position.z -= scaledCenter.z;
      chest.position.y -= scaledBox.min.y; // Ground it
      
      console.log(`📦 Final chest size: ${finalSize.x.toFixed(2)} x ${finalSize.y.toFixed(2)} x ${finalSize.z.toFixed(2)}`);
      
      return chest;
      
    } catch (error) {
      console.warn('⚠️ Failed to load chest GLTF, falling back to basic mesh:', error);
      
      // Fallback to basic chest mesh
      return this.createBasicChestMesh();
    }
  }

  /**
   * Create a basic chest mesh as fallback
   */
  createBasicChestMesh() {
    const group = new THREE.Group();
    
    // Chest base (larger, rectangular)
    const baseGeometry = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    const baseMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513, // Brown wood color
      roughness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0.4;
    group.add(baseMesh);
    
    // Chest lid (slightly smaller, on top)
    const lidGeometry = new THREE.BoxGeometry(1.5, 0.3, 1.1);
    const lidMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x654321, // Darker brown
      roughness: 0.8
    });
    const lidMesh = new THREE.Mesh(lidGeometry, lidMaterial);
    lidMesh.position.y = 0.95;
    group.add(lidMesh);
    
    // Metal bands (decorative)
    const bandGeometry = new THREE.BoxGeometry(1.7, 0.1, 0.1);
    const bandMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x666666,
      metalness: 0.8
    });
    
    // Front band
    const frontBand = new THREE.Mesh(bandGeometry, bandMaterial);
    frontBand.position.set(0, 0.4, 0.6);
    group.add(frontBand);
    
    // Back band
    const backBand = new THREE.Mesh(bandGeometry, bandMaterial);
    backBand.position.set(0, 0.4, -0.6);
    group.add(backBand);
    
    // Lock (golden)
    const lockGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.2);
    const lockMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFFD700,
      emissive: 0x221100
    });
    const lockMesh = new THREE.Mesh(lockGeometry, lockMaterial);
    lockMesh.position.set(0, 0.5, 0.65);
    group.add(lockMesh);
    
    // Add a subtle glow effect
    const glowGeometry = new THREE.BoxGeometry(2.0, 1.5, 1.6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.y = 0.5;
    group.add(glowMesh);
    
    // Store references for animation
    group.userData.lid = lidMesh;
    group.userData.lock = lockMesh;
    group.userData.glow = glowMesh;
    
    return group;
  }

  /**
   * Create the visual mesh for an apple
   */
  createAppleMesh() {
    const group = new THREE.Group();
    
    // Apple body (main red part)
    const appleGeometry = new THREE.SphereGeometry(0.4, 16, 12);
    // Flatten the top slightly for apple shape
    const positions = appleGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y > 0.2) {
        positions.setY(i, y * 0.7); // Flatten the top
      }
    }
    positions.needsUpdate = true;
    appleGeometry.computeVertexNormals();
    
    const appleMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xff4444,
      emissive: 0x220000
    });
    const appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);
    group.add(appleMesh);
    
    // Apple stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.2, 6);
    const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    stemMesh.position.y = 0.35;
    group.add(stemMesh);
    
    // Apple leaf
    const leafGeometry = new THREE.PlaneGeometry(0.15, 0.1);
    const leafMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x228B22,
      side: THREE.DoubleSide 
    });
    const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
    leafMesh.position.set(0.1, 0.4, 0);
    leafMesh.rotation.z = -0.3;
    group.add(leafMesh);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(0.6, 16, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glowMesh);
    
    return group;
  }

  /**
   * Create the visual mesh for a healing potion
   */
  createPotionMesh() {
    const group = new THREE.Group();
    
    // Potion bottle body
    const bottleGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 12);
    const bottleMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4444ff,
      transparent: true,
      opacity: 0.8,
      emissive: 0x000044
    });
    const bottleMesh = new THREE.Mesh(bottleGeometry, bottleMaterial);
    group.add(bottleMesh);
    
    // Potion liquid (slightly smaller, inside the bottle)
    const liquidGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.6, 12);
    const liquidMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7,
      emissive: 0x002200
    });
    const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquidMesh.position.y = -0.05;
    group.add(liquidMesh);
    
    // Cork/stopper
    const corkGeometry = new THREE.CylinderGeometry(0.2, 0.18, 0.15, 8);
    const corkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const corkMesh = new THREE.Mesh(corkGeometry, corkMaterial);
    corkMesh.position.y = 0.47;
    group.add(corkMesh);
    
    // Add magical sparkle effect
    const sparkleGeometry = new THREE.SphereGeometry(0.5, 16, 12);
    const sparkleMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ffaa,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const sparkleMesh = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
    group.add(sparkleMesh);
    
    return group;
  }

  /**
   * Handle collectible pickup when player touches a collectible or opens a chest
   */
  collectItem(collectibleId) {
    const collectible = this.collectibles.get(collectibleId);
    if (!collectible || collectible.collected) return false;
    
    collectible.collected = true;
    
    // Handle chest opening
    if (collectible.type === 'chest') {
      this.openChest(collectible);
      return true;
    }
    
    // Handle direct collectible pickup (legacy)
    // Create pickup effect
    this.createPickupEffect(collectible.mesh.position.clone());
    
    // Remove from scene and physics world
    this.scene.remove(collectible.mesh);
    this.physicsWorld.removeBody(collectible.body);
    
    // Update UI and trigger events
    if (collectible.type === 'apple') {
      this.triggerEvent('onAppleCollected', collectible);
      if (this.uiRef) {
        this.uiRef.collectApple();
      }
      console.log('🍎 Apple collected!');
    } else if (collectible.type === 'potion') {
      this.triggerEvent('onPotionCollected', collectible);
      if (this.uiRef) {
        this.uiRef.addPotion();
      }
      console.log('🧪 Healing potion added to inventory!');
    }
    
    this.triggerEvent('onCollectiblePickup', collectible);
    
    // Remove from our tracking
    this.collectibles.delete(collectibleId);
    
    return true;
  }

  /**
   * Open a chest and reveal its contents
   */
  openChest(chestCollectible) {
    console.log(`📦 Opening chest containing: ${chestCollectible.contents}`);
    
    // Mark chest as collected and animating
    chestCollectible.collected = true;
    chestCollectible.isOpen = true;
    chestCollectible.mesh.userData.isAnimating = true;
    
    // Start the interaction animation (raise and spin)
    this.animateChestInteraction(chestCollectible.mesh);
    
    // Play chest opening animation (GLTF animation if available)
    this.animateChestOpening(chestCollectible.mesh);
    
    // Create pickup effect at chest location
    this.createPickupEffect(chestCollectible.mesh.position.clone());
    
    // Process the chest contents
    if (chestCollectible.contents === 'apple') {
      this.triggerEvent('onAppleCollected', chestCollectible);
      if (this.uiRef) {
        this.uiRef.collectApple();
      }
      console.log('🍎 Found an apple in the chest! Marked as collected.');
    } else if (chestCollectible.contents === 'potion') {
      this.triggerEvent('onPotionCollected', chestCollectible);
      if (this.uiRef) {
        this.uiRef.addPotion();
      }
      console.log('🧪 Found a healing potion in the chest! Added to inventory.');
    }
    
    this.triggerEvent('onCollectiblePickup', chestCollectible);
    
    // Remove from our tracking after a delay to allow animation
    setTimeout(() => {
      this.scene.remove(chestCollectible.mesh);
      this.physicsWorld.removeBody(chestCollectible.body);
      this.collectibles.delete(chestCollectible.id);
    }, 2000);
  }

  /**
   * Animate chest opening
   */
  animateChestOpening(chestMesh) {
    // Try to use GLTF animations first
    if (chestMesh.userData.mixer && chestMesh.userData.animations && chestMesh.userData.animations.open) {
      console.log('🎬 Playing GLTF chest opening animation');
      const openAction = chestMesh.userData.animations.open;
      openAction.reset();
      openAction.play();
      return;
    }
    
    // Fallback to basic animation for the basic mesh
    const lid = chestMesh.userData.lid;
    const lock = chestMesh.userData.lock;
    const glow = chestMesh.userData.glow;
    
    if (lid && lock && glow) {
      console.log('🎬 Playing fallback chest opening animation');
      // Animate lid opening
      const openLid = () => {
        const targetRotation = -Math.PI / 3; // 60 degrees
        lid.rotation.x += (targetRotation - lid.rotation.x) * 0.1;
        
        // Make glow brighter during opening
        glow.material.opacity = Math.min(0.3, glow.material.opacity + 0.02);
        
        // Remove lock
        if (lock.visible && lid.rotation.x < -0.1) {
          lock.visible = false;
        }
        
        if (Math.abs(lid.rotation.x - targetRotation) > 0.01) {
          requestAnimationFrame(openLid);
        }
      };
      openLid();
    }
  }

  /**
   * Animate chest interaction (raise and spin when opened)
   */
  animateChestInteraction(chestMesh) {
    console.log('🎬 Starting chest interaction animation (raise and spin)');
    
    const originalY = chestMesh.userData.originalY;
    const targetY = originalY + 1.0; // Raise chest by 1 unit
    const animationDuration = 2000; // 2 seconds
    const startTime = Date.now();
    
    const animateInteraction = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Smooth easing function
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Raise the chest
      chestMesh.position.y = originalY + (targetY - originalY) * easeProgress;
      
      // Spin the chest
      chestMesh.rotation.y = easeProgress * Math.PI * 2; // Full rotation
      
      if (progress < 1) {
        requestAnimationFrame(animateInteraction);
      } else {
        console.log('🎬 Chest interaction animation complete');
      }
    };
    
    animateInteraction();
  }

  /**
   * Create visual pickup effect
   */
  createPickupEffect(position) {
    // Create particles or sparkle effect
    const particleCount = 20;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.7),
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      particle.position.copy(position);
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 2,
        (Math.random() - 0.5) * 10
      );
      particle.userData.life = 1.0;
      
      particles.add(particle);
    }
    
    this.scene.add(particles);
    
    // Animate particles
    const animateParticles = () => {
      let allDead = true;
      
      particles.children.forEach(particle => {
        if (particle.userData.life > 0) {
          allDead = false;
          
          // Update position
          particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
          particle.userData.velocity.y -= 15 * 0.016; // Gravity
          particle.userData.life -= 0.016 * 2; // Fade out
          
          // Update material
          particle.material.opacity = particle.userData.life;
          particle.scale.setScalar(particle.userData.life);
        }
      });
      
      if (allDead) {
        this.scene.remove(particles);
      } else {
        requestAnimationFrame(animateParticles);
      }
    };
    
    requestAnimationFrame(animateParticles);
  }

  /**
   * Update collectibles animations and check for player proximity
   */
  update(deltaTime) {
    // Check if we have pending level data and physics world is now ready
    if (this.pendingLevelData && this.physicsWorld && this.physicsWorld.addBody) {
      console.log('🚀 Physics world now ready in update! Spawning pending collectibles...');
      this.spawnCollectiblesForLevel(this.pendingLevelData);
    }
    
    if (deltaTime % 60 === 0) { // Log every ~1 second at 60fps
      console.log(`🔄 CollectiblesManager update - ${this.collectibles.size} collectibles, playerRef: ${!!this.playerRef}`);
    }
    
    let nearestChest = null;
    let nearestDistance = Infinity;
    
    for (const [id, collectible] of this.collectibles) {
      if (collectible.collected) continue;
      
      // Update GLTF animation mixer if present
      if (collectible.mesh.userData.mixer) {
        collectible.mesh.userData.mixer.update(deltaTime);
      }
      
      // Handle different animation types
      if (collectible.type === 'chest') {
        // Chests remain static unless opening
        // No floating or spinning animation by default
        
        // Check distance to player for interaction
        if (this.playerRef && !collectible.mesh.userData.isAnimating) {
          const distance = collectible.mesh.position.distanceTo(this.playerRef.mesh.position);
          if (distance < 3.0 && distance < nearestDistance) { // Interaction radius for chests
            nearestChest = collectible;
            nearestDistance = distance;
            console.log(`📦 Near chest ${collectible.id} at distance ${distance.toFixed(2)}`);
          }
        }
      } else {
        // Original floating animation for direct collectibles
        collectible.mesh.userData.floatPhase += deltaTime * 2;
        const floatOffset = Math.sin(collectible.mesh.userData.floatPhase) * 0.1;
        collectible.mesh.position.y = collectible.mesh.userData.originalY + floatOffset;
        
        // Rotation animation
        collectible.mesh.rotation.y += deltaTime * 1.5;
        
        // Check distance to player for automatic collection (legacy behavior)
        if (this.playerRef) {
          const distance = collectible.mesh.position.distanceTo(this.playerRef.mesh.position);
          if (distance < 1.5) { // Collection radius
            this.collectItem(id);
          }
        }
      }
      
      // Update physics body position to match visual
      collectible.body.position.y = collectible.mesh.position.y;
    }
    
    // Handle interaction prompt
    if (nearestChest && this.interactionPrompt) {
      if (!this.interactionPrompt.isVisible) {
        console.log(`🎯 Showing interaction prompt for chest ${nearestChest.id}`);
        this.interactionPrompt.show(`to open chest (${nearestChest.contents})`);
      }
      this.currentInteractableChest = nearestChest;
    } else if (this.interactionPrompt && this.interactionPrompt.isVisible) {
      console.log(`❌ Hiding interaction prompt`);
      this.interactionPrompt.hide();
      this.currentInteractableChest = null;
    }
  }

  /**
   * Handle interaction key press (E)
   */
  handleInteraction() {
    if (this.currentInteractableChest && 
        !this.currentInteractableChest.collected && 
        !this.currentInteractableChest.mesh.userData.isAnimating) {
      this.collectItem(this.currentInteractableChest.id);
      return true;
    }
    return false;
  }

  /**
   * Add event listener for collectible events
   */
  addEventListener(eventType, callback) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].push(callback);
    }
  }

  /**
   * Trigger event callbacks
   */
  triggerEvent(eventType, data) {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => callback(data));
    }
  }

  /**
   * Generate unique ID for collectibles
   */
  generateId(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up all collectibles (called when level changes)
   */
  cleanup() {
    console.log('🧹 Cleaning up collectibles...');
    
    for (const [id, collectible] of this.collectibles) {
      this.scene.remove(collectible.mesh);
      this.physicsWorld.removeBody(collectible.body);
    }
    
    this.collectibles.clear();
    console.log('✅ Collectibles cleanup complete');
  }

  /**
   * Get statistics about current collectibles
   */
  getStats() {
    const stats = {
      total: 0,
      apples: { total: 0, collected: 0 },
      potions: { total: 0, collected: 0 }
    };
    
    for (const [id, collectible] of this.collectibles) {
      stats.total++;
      
      // Check if this is an apple collectible (direct apple or chest containing apple)
      const isApple = collectible.type === 'apple' || 
                     (collectible.type === 'chest' && collectible.contents === 'apple');
      
      // Check if this is a potion collectible (direct potion or chest containing potion)
      const isPotion = collectible.type === 'potion' || 
                      (collectible.type === 'chest' && collectible.contents === 'potion');
      
      if (isApple) {
        stats.apples.total++;
        if (collectible.collected) stats.apples.collected++;
      } else if (isPotion) {
        stats.potions.total++;
        if (collectible.collected) stats.potions.collected++;
      }
    }
    
    return stats;
  }

  /**
   * Get all collectibles (for minimap display)
   */
  getAllCollectibles() {
    const collectibles = [];
    for (const [id, collectible] of this.collectibles) {
      if (!collectible.collected) {
        collectibles.push(collectible);
      }
    }
    return collectibles;
  }
}