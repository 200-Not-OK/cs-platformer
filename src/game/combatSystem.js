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

    // Get camera direction for raycast
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Start raycast from camera position
    const origin = camera.position.clone();
    
    // Setup raycaster
    this.raycaster.set(origin, direction);

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

    // Perform raycast
    const intersects = this.raycaster.intersectObjects(enemyMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const enemy = hit.object.userData.enemy;
      
      if (enemy && enemy.alive) {
        // Calculate distance to ensure it's within range
        const distance = origin.distanceTo(hit.point);
        
        if (distance <= this.attackRange) {
          console.log(`🗡️ Hit ${enemy.constructor.name} for ${this.attackDamage} damage at distance ${distance.toFixed(2)}`);
          
          // Deal damage to enemy
          enemy.takeDamage(this.attackDamage);
          
          // Optional: Add visual effects here (sparks, blood, etc.)
          this.createHitEffect(hit.point);
          
          return true; // Attack hit
        }
      }
    }

    console.log('🗡️ Attack missed - no enemies in range');
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

  update(delta) {
    // Any per-frame combat system updates can go here
    // For example, updating cooldown displays, etc.
  }
}