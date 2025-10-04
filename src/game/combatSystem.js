import * as THREE from 'three';

export class CombatSystem {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    
    // Combat settings
    this.attackRange = 6; // Extended attack range for easier combat
    this.attackDamage = 25; // Damage per attack
    this.attackCooldown = 1000; // 1 second cooldown between attacks (in ms)
    this.lastAttackTime = 0;
    
    // Raycaster for attack detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.attackRange;
    
    // Reference to enemies (will be set by game manager)
    this.enemies = [];
    
    // Debug visualization
    this.debugEnabled = true;
    this.debugVisualsGroup = new THREE.Group();
    this.debugVisualsGroup.name = 'CombatDebugVisuals';
    this.scene.add(this.debugVisualsGroup);
  }

  setEnemies(enemies) {
    this.enemies = enemies;
  }

  canAttack() {
    const currentTime = Date.now();
    return (currentTime - this.lastAttackTime) >= this.attackCooldown;
  }

  performSwordSwing(player, camera = null) {
    if (!this.canAttack()) {
      return false;
    }

    this.lastAttackTime = Date.now();
    console.log('🗡️ Player performing sword swing attack!');

    // Get player position and facing direction
    const playerPos = player.mesh.position.clone();
    playerPos.y += 0.8; // Chest/sword height
    
    // Use camera direction if available (more accurate for where player is looking)
    // Otherwise fall back to player mesh rotation
    let playerDirection;
    if (camera) {
      playerDirection = new THREE.Vector3();
      camera.getWorldDirection(playerDirection);
      // Project to horizontal plane
      playerDirection.y = 0;
      playerDirection.normalize();
      console.log(`🗡️ Using camera direction for attack`);
    } else {
      // Fallback to player mesh rotation
      playerDirection = new THREE.Vector3(0, 0, -1);
      playerDirection.applyQuaternion(player.mesh.quaternion);
      console.log(`🗡️ Using player mesh rotation for attack`);
    }
    
    // Sword swing parameters
    const swingRange = 2.5; // How far the sword reaches
    const swingArc = Math.PI / 2; // 90 degree arc (45 degrees each side)
    const swingHeight = 2.5; // Increased vertical range to hit low enemies like snakes
    const swingLowReach = 2.0; // Increased downward reach to hit very low enemies like snakes
    
    console.log(`🗡️ Sword swing - Range: ${swingRange}, Arc: ${(swingArc * 180 / Math.PI).toFixed(1)}°`);
    console.log(`🗡️ Player position:`, playerPos);
    console.log(`🗡️ Player facing direction:`, playerDirection);
    console.log(`🗡️ Checking ${this.enemies.length} enemies...`);

    // Create debug visualization for the swing arc
    this.createSwingArcDebug(playerPos, playerDirection, swingRange, swingArc);

    let hitEnemies = [];

    // Check each enemy against the sword swing area
    for (const enemy of this.enemies) {
      if (!enemy || !enemy.alive || !enemy.mesh) continue;

      const enemyPos = enemy.mesh.position.clone();
      const toEnemy = enemyPos.clone().sub(playerPos);
      
      console.log(`🔍 Checking enemy ${enemy.constructor.name} at position:`, enemyPos);
      console.log(`🔍 Vector to enemy:`, toEnemy);
      
      // Check horizontal distance first
      const horizontalDistance = Math.sqrt(toEnemy.x * toEnemy.x + toEnemy.z * toEnemy.z);
      console.log(`🔍 Horizontal distance: ${horizontalDistance.toFixed(2)} (max: ${swingRange})`);
      
      if (horizontalDistance > swingRange) {
        console.log(`❌ Enemy too far horizontally`);
        continue;
      }
      
      // Enhanced vertical check: allow hits both above and below player sword height
      const verticalOffset = toEnemy.y; // Positive if enemy is above, negative if below
      console.log(`🔍 Vertical offset: ${verticalOffset.toFixed(2)} (range: -${swingLowReach} to +${swingHeight})`);
      
      // Check if enemy is within vertical reach (can hit above or below)
      const withinVerticalReach = (verticalOffset >= -swingLowReach) && (verticalOffset <= swingHeight);
      
      if (!withinVerticalReach) {
        console.log(`❌ Enemy outside vertical reach`);
        continue;
      }
      
      // Normalize the horizontal vector for angle calculation
      const horizontalToEnemy = new THREE.Vector3(toEnemy.x, 0, toEnemy.z).normalize();
      const horizontalPlayerDir = new THREE.Vector3(playerDirection.x, 0, playerDirection.z).normalize();
      
      // Calculate angle between player facing direction and enemy direction
      const angle = horizontalPlayerDir.angleTo(horizontalToEnemy);
      
      console.log(`🔍 Angle to enemy: ${(angle * 180 / Math.PI).toFixed(1)}° (max: ${(swingArc / 2 * 180 / Math.PI).toFixed(1)}°)`);
      
      // Check if enemy is within the swing arc
      if (angle <= swingArc / 2) {
        console.log(`🎯 SWORD HIT! Enemy: ${enemy.constructor.name}`);
        console.log(`📏 Distance: ${horizontalDistance.toFixed(2)} units`);
        console.log(`📐 Angle: ${(angle * 180 / Math.PI).toFixed(1)}° (max: ${(swingArc / 2 * 180 / Math.PI).toFixed(1)}°)`);
        console.log(`📏 Vertical offset: ${verticalOffset.toFixed(2)} units (range: -${swingLowReach} to +${swingHeight})`);
        
        // Debug visual for hit enemy
        this.createEnemyHitDebug(enemyPos, true);
        
        hitEnemies.push({
          enemy: enemy,
          distance: horizontalDistance,
          angle: angle,
          position: enemyPos
        });
      } else {
        console.log(`❌ Enemy outside swing arc`);
        // Debug visual for missed enemy (within range but outside arc)
        this.createEnemyHitDebug(enemyPos, false);
      }
    }

    // Process hits (closest enemies first for multiple hits)
    hitEnemies.sort((a, b) => a.distance - b.distance);
    
    let anyHit = false;
    for (const hit of hitEnemies) {
      const enemy = hit.enemy;
      
      console.log(`💔 Dealing ${this.attackDamage} damage to ${enemy.constructor.name}`);
      console.log(`❤️ Enemy health before: ${enemy.health}/${enemy.maxHealth}`);
      
      const newHealth = enemy.takeDamage(this.attackDamage);
      
      console.log(`❤️ Enemy health after: ${newHealth}/${enemy.maxHealth}`);
      if (newHealth <= 0) {
        console.log(`💀 ${enemy.constructor.name} has been defeated!`);
      }
      
      // Create hit effect at enemy position
      this.createHitEffect(hit.position);
      anyHit = true;
    }

    if (!anyHit) {
      console.log('❌ Sword swing missed - no enemies in range');
    } else {
      console.log(`⚔️ Sword swing hit ${hitEnemies.length} enemies!`);
    }

    return anyHit;
  }

  // Debug visualization methods
  createSwingArcDebug(playerPos, playerDirection, swingRange, swingArc) {
    if (!this.debugEnabled) return;

    // Clear previous debug visuals
    this.clearDebugVisuals();

    // Create arc geometry to show swing range
    const arcGeometry = new THREE.RingGeometry(0, swingRange, 16, 1, -swingArc/2, swingArc);
    const arcMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const arcMesh = new THREE.Mesh(arcGeometry, arcMaterial);
    
    // Position and rotate the arc
    arcMesh.position.copy(playerPos);
    arcMesh.position.y = 0.1; // Slightly above ground
    
    // Rotate to match player direction
    const angle = Math.atan2(playerDirection.x, playerDirection.z);
    arcMesh.rotation.y = -angle;
    arcMesh.rotation.x = -Math.PI / 2; // Lay flat on ground
    
    this.debugVisualsGroup.add(arcMesh);

    // Add center line showing player direction
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, swingRange)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const centerLine = new THREE.Line(lineGeometry, lineMaterial);
    
    centerLine.position.copy(playerPos);
    centerLine.position.y = 0.5;
    centerLine.rotation.y = -angle;
    
    this.debugVisualsGroup.add(centerLine);

    // Add player position indicator
    const playerMarkerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const playerMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const playerMarker = new THREE.Mesh(playerMarkerGeometry, playerMarkerMaterial);
    
    playerMarker.position.copy(playerPos);
    this.debugVisualsGroup.add(playerMarker);

    // Auto-clear debug visuals after 2 seconds
    setTimeout(() => {
      this.clearDebugVisuals();
    }, 2000);
  }

  createEnemyHitDebug(enemyPos, hit = false) {
    if (!this.debugEnabled) return;

    const markerGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: hit ? 0xff0000 : 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    marker.position.copy(enemyPos);
    marker.position.y += 1; // Above enemy
    this.debugVisualsGroup.add(marker);

    // Add hit/miss text
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = hit ? '#ff0000' : '#ffff00';
    context.font = 'Bold 20px Arial';
    context.fillText(hit ? 'HIT!' : 'MISS', 10, 30);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(enemyPos);
    sprite.position.y += 2;
    sprite.scale.set(1, 0.5, 1);
    
    this.debugVisualsGroup.add(sprite);
  }

  clearDebugVisuals() {
    // Remove all debug visuals
    while (this.debugVisualsGroup.children.length > 0) {
      const child = this.debugVisualsGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
      this.debugVisualsGroup.remove(child);
    }
  }

  toggleDebug() {
    this.debugEnabled = !this.debugEnabled;
    if (!this.debugEnabled) {
      this.clearDebugVisuals();
    }
    console.log(`🎯 Combat debug visuals: ${this.debugEnabled ? 'ON' : 'OFF'}`);
  }

  performAttack(camera, player) {
    if (!this.canAttack()) {
      return false;
    }

    this.lastAttackTime = Date.now();
    console.log('🗡️ Player performing attack!');

    // Get camera direction for raycast
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // For third-person camera, start raycast from player position instead of camera position
    // This ensures we're shooting from where the crosshair appears to be aiming
    const origin = player.mesh.position.clone();
    origin.y += 1.0; // Add some height to aim from player's chest/head level
    
    console.log(`🎯 Using player-based origin for better third-person aiming`);
    
    // Setup raycaster
    this.raycaster.set(origin, direction);
    
    // Debug: Create a visual ray to see where we're aiming
    this.createDebugRay(origin, direction);

    // Find all enemy meshes for raycasting
    const enemyMeshes = [];
    for (const enemy of this.enemies) {
      if (enemy.alive && enemy.mesh && enemy.mesh.children.length > 0) {
        // Add all children of the enemy mesh group
        enemy.mesh.traverse((child) => {
          if (child.isMesh) {
            child.userData.enemy = enemy; // Store reference to enemy
            enemyMeshes.push(child);
          }
        });
      }
    }

    console.log(`🎯 Scanning ${enemyMeshes.length} enemy meshes for hits...`);
    console.log(`🎯 Raycast origin:`, origin);
    console.log(`🎯 Raycast direction:`, direction);
    console.log(`🎯 Attack range: ${this.attackRange}`);

    // Perform raycast
    const intersects = this.raycaster.intersectObjects(enemyMeshes, true);
    
    console.log(`🎯 Raycast found ${intersects.length} intersections`);
    
    // Debug: Log all intersections
    if (intersects.length > 0) {
      for (let i = 0; i < Math.min(5, intersects.length); i++) {
        const hit = intersects[i];
        const distance = origin.distanceTo(hit.point);
        console.log(`  ${i}: Distance ${distance.toFixed(2)}, Point:`, hit.point, `Object:`, hit.object);
      }
    }

    if (intersects.length > 0) {
      const hit = intersects[0];
      const enemy = hit.object.userData.enemy;
      
      if (enemy && enemy.alive) {
        // Calculate distance to ensure it's within range
        const distance = origin.distanceTo(hit.point);
        
        if (distance <= this.attackRange) {
          console.log(`🎯 HIT! Target: ${enemy.constructor.name}`);
          console.log(`📏 Distance: ${distance.toFixed(2)} units (max range: ${this.attackRange})`);
          console.log(`💔 Damage dealt: ${this.attackDamage}`);
          console.log(`❤️ Enemy health before: ${enemy.health}/${enemy.maxHealth}`);
          
          // Deal damage to enemy
          const newHealth = enemy.takeDamage(this.attackDamage);
          
          console.log(`❤️ Enemy health after: ${newHealth}/${enemy.maxHealth}`);
          if (newHealth <= 0) {
            console.log(`💀 ${enemy.constructor.name} has been defeated!`);
          }
          
          // Optional: Add visual effects here (sparks, blood, etc.)
          this.createHitEffect(hit.point);
          
          return true; // Attack hit
        } else {
          console.log(`❌ Target too far! Distance: ${distance.toFixed(2)} > ${this.attackRange}`);
        }
      }
    } else {
      console.log('❌ No enemies in crosshair - attack missed');
    }

    return false; // Attack missed
  }

  createHitEffect(position) {
    // Create a simple particle effect at hit position
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff4444,
      transparent: true,
      opacity: 0.8
    });
    
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    this.scene.add(particle);

    // Animate the particle (fade out and scale up)
    const startTime = Date.now();
    const duration = 500; // 0.5 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(particle);
        geometry.dispose();
        material.dispose();
        return;
      }

      // Fade out and scale up
      particle.scale.setScalar(1 + progress * 2);
      material.opacity = 0.8 * (1 - progress);

      requestAnimationFrame(animate);
    };

    animate();
  }

  createDebugRay(origin, direction) {
    // Remove previous debug ray if it exists
    if (this.debugRay) {
      this.scene.remove(this.debugRay);
      this.debugRay.geometry.dispose();
      this.debugRay.material.dispose();
    }

    // Create a visual line to show the raycast direction
    const rayEnd = origin.clone().add(direction.clone().multiplyScalar(this.attackRange));
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, rayEnd]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xff0000, // Red line
      transparent: true,
      opacity: 0.8
    });
    
    this.debugRay = new THREE.Line(geometry, material);
    this.scene.add(this.debugRay);

    // Remove the debug ray after a short time
    setTimeout(() => {
      if (this.debugRay) {
        this.scene.remove(this.debugRay);
        this.debugRay.geometry.dispose();
        this.debugRay.material.dispose();
        this.debugRay = null;
      }
    }, 1000); // Show for 1 second
  }

  update(delta) {
    // Any per-frame combat system updates can go here
    // For example, updating cooldown displays, etc.
  }
}