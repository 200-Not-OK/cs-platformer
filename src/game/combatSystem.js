import * as THREE from 'three';

export class CombatSystem {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    
    // Combat settings
    this.attackRange = 3.0; // Attack range in units
    this.attackDamage = 25; // Damage per attack
    this.attackCooldown = 1000; // 1 second cooldown between attacks (in ms)
    this.lastAttackTime = 0;
    
    // Raycaster for attack detection
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.attackRange;
    
    // Reference to enemies (will be set by game manager)
    this.enemies = [];
  }

  setEnemies(enemies) {
    this.enemies = enemies;
  }

  canAttack() {
    const currentTime = Date.now();
    return (currentTime - this.lastAttackTime) >= this.attackCooldown;
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