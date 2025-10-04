import { UIComponent } from '../uiComponent.js';

export class Minimap extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'game-minimap';
    this.root.style.position = 'absolute';
    this.root.style.right = props.right || '12px';
    this.root.style.bottom = props.bottom || '12px';
    this.root.style.top = props.top || 'auto';
    this.root.style.width = props.width || '200px';
    this.root.style.height = props.height || '200px';
    this.root.style.background = 'rgba(0,0,0,0.8)';
    this.root.style.color = 'white';
    this.root.style.padding = '8px';
    this.root.style.fontSize = '12px';
    this.root.style.pointerEvents = 'auto';
    this.root.style.border = '2px solid rgba(255,255,255,0.3)';
    this.root.style.borderRadius = '4px';

    this.title = document.createElement('div');
    this.title.textContent = 'Map';
    this.title.style.textAlign = 'center';
    this.title.style.marginBottom = '4px';
    this.title.style.fontWeight = 'bold';
    this.root.appendChild(this.title);

    // Create canvas for map rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 184;
    this.canvas.height = 160;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.imageRendering = 'crisp-edges';
    this.root.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    
    // Map state
    this.levelData = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = props.zoom || 0.5; // Zoom level (lower = more zoomed out)
  }

  setLevelData(levelData) {
    this.levelData = levelData;
    // Calculate bounds and scale
    this.calculateBounds();
  }

  calculateBounds() {
    if (!this.levelData || !this.levelData.colliders) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    // Find level bounds from colliders
    for (const collider of this.levelData.colliders) {
      if (!collider.position || !collider.size) continue;
      const [x, y, z] = collider.position;
      const [w, h, d] = collider.size;
      
      minX = Math.min(minX, x - w/2);
      maxX = Math.max(maxX, x + w/2);
      minZ = Math.min(minZ, z - d/2);
      maxZ = Math.max(maxZ, z + d/2);
    }
    
    this.bounds = { minX, maxX, minZ, maxZ };
    this.worldWidth = maxX - minX;
    this.worldHeight = maxZ - minZ;
    
    // Calculate scale to fit map in canvas
    const padding = 10;
    const scaleX = (this.canvas.width - padding * 2) / this.worldWidth;
    const scaleY = (this.canvas.height - padding * 2) / this.worldHeight;
    this.baseScale = Math.min(scaleX, scaleY);
  }

  worldToMap(x, z, playerX, playerZ) {
    if (!this.bounds) return { x: 0, y: 0 };
    
    // Calculate position relative to player (so player is always centered)
    const relX = (x - playerX) * this.baseScale * this.zoom;
    const relZ = (z - playerZ) * this.baseScale * this.zoom;
    
    return {
      x: this.canvas.width / 2 + relX,
      y: this.canvas.height / 2 + relZ
    };
  }

  update(delta, ctx) {
    if (!ctx) return;
    const player = ctx.playerModel;
    if (!player || !player.position) return;
    
    const playerX = player.position.x;
    const playerZ = player.position.z;
    
    // Clear canvas
    this.ctx.fillStyle = 'rgba(20, 20, 30, 1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!this.levelData) return;
    
    // Draw colliders (level geometry)
    if (this.levelData.colliders) {
      for (const collider of this.levelData.colliders) {
        if (!collider.position || !collider.size) continue;
        
        const [x, y, z] = collider.position;
        const [w, h, d] = collider.size;
        
        const topLeft = this.worldToMap(x - w/2, z - d/2, playerX, playerZ);
        const bottomRight = this.worldToMap(x + w/2, z + d/2, playerX, playerZ);
        
        const mapW = bottomRight.x - topLeft.x;
        const mapH = bottomRight.y - topLeft.y;
        
        // Only draw if visible on minimap
        if (topLeft.x > this.canvas.width || bottomRight.x < 0 || 
            topLeft.y > this.canvas.height || bottomRight.y < 0) {
          continue;
        }
        
        // Color based on material type
        if (collider.materialType === 'wall') {
          this.ctx.fillStyle = 'rgba(100, 100, 120, 0.8)';
        } else if (collider.materialType === 'ground') {
          this.ctx.fillStyle = 'rgba(60, 70, 80, 0.6)';
        } else {
          this.ctx.fillStyle = 'rgba(80, 80, 100, 0.7)';
        }
        
        this.ctx.fillRect(topLeft.x, topLeft.y, mapW, mapH);
        
        // Draw border for walls
        if (collider.materialType === 'wall') {
          this.ctx.strokeStyle = 'rgba(150, 150, 170, 0.5)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(topLeft.x, topLeft.y, mapW, mapH);
        }
      }
    }
    
    // Draw enemies if available
    if (ctx.enemies && Array.isArray(ctx.enemies)) {
      this.ctx.fillStyle = '#ff4444';
      for (const enemy of ctx.enemies) {
        if (enemy.mesh && enemy.mesh.position) {
          const enemyPos = this.worldToMap(enemy.mesh.position.x, enemy.mesh.position.z, playerX, playerZ);
          // Only draw if visible
          if (enemyPos.x >= 0 && enemyPos.x <= this.canvas.width &&
              enemyPos.y >= 0 && enemyPos.y <= this.canvas.height) {
            this.ctx.beginPath();
            this.ctx.arc(enemyPos.x, enemyPos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            // White outline for visibility
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
          }
        }
      }
    }
    
    // Draw collectibles if available
    if (ctx.collectibles && Array.isArray(ctx.collectibles)) {
      this.ctx.fillStyle = '#ffaa00';
      for (const collectible of ctx.collectibles) {
        if (collectible.mesh && collectible.mesh.position) {
          const collectiblePos = this.worldToMap(collectible.mesh.position.x, collectible.mesh.position.z, playerX, playerZ);
          // Only draw if visible
          if (collectiblePos.x >= 0 && collectiblePos.x <= this.canvas.width &&
              collectiblePos.y >= 0 && collectiblePos.y <= this.canvas.height) {
            this.ctx.beginPath();
            this.ctx.arc(collectiblePos.x, collectiblePos.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            // White outline for visibility
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
          }
        }
      }
    }
    
    // Draw player (always centered)
    const playerPos = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    
    // Draw player as green circle
    this.ctx.fillStyle = '#00ff00';
    this.ctx.beginPath();
    this.ctx.arc(playerPos.x, playerPos.y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Player outline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}
