import { UIComponent } from '../uiComponent.js';

export class HUD extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'game-hud';
<<<<<<< HEAD
    
    // Modern HUD styling with cartoonish elements
=======

>>>>>>> 5c4b097 (Refactor ReverseStation and Level classes; implement PasscodePanel and LinkProgress components; add ReverseMinigame and Door functionality)
    this.root.style.position = 'absolute';
    this.root.style.left = '20px';
    this.root.style.top = '20px';
    this.root.style.fontFamily = '"Comic Sans MS", "Comic Sans", cursive, system-ui';
    this.root.style.pointerEvents = 'none';
    this.root.style.userSelect = 'none';

    // Current health values for smooth animations
    this.currentHealth = 100;
    this.maxHealth = 100;
    this.displayHealth = 100;

    this._createElements();
    this.setProps(props);
  }

  _createElements() {
<<<<<<< HEAD
    // Create health container with cartoonish styling
    this.healthContainer = document.createElement('div');
    this.healthContainer.style.cssText = `
      background: linear-gradient(145deg, #2a5298, #1e3a8a);
      border: 3px solid #60a5fa;
      border-radius: 20px;
      padding: 12px 16px;
      box-shadow: 
        0 6px 20px rgba(0, 0, 0, 0.3),
        inset 0 2px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      min-width: 200px;
      backdrop-filter: blur(5px);
    `;
    
    // Create heart icon
    this.heartIcon = document.createElement('div');
    this.heartIcon.style.cssText = `
      display: inline-block;
      width: 24px;
      height: 24px;
      margin-right: 8px;
      vertical-align: middle;
      font-size: 20px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    `;
    this.heartIcon.innerHTML = '❤️';
    
    // Create health bar background
    this.healthBarBg = document.createElement('div');
    this.healthBarBg.style.cssText = `
      background: linear-gradient(to right, #7f1d1d, #991b1b);
      border: 2px solid #dc2626;
      border-radius: 15px;
      height: 20px;
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
      margin: 4px 0;
    `;
    
    // Create health bar fill
    this.healthBarFill = document.createElement('div');
    this.healthBarFill.style.cssText = `
      background: linear-gradient(to right, #ef4444, #dc2626, #f87171);
      height: 100%;
      width: 100%;
      border-radius: 13px;
      transition: width 0.3s ease-out;
      position: relative;
      overflow: hidden;
    `;
    
    // Create health bar shine effect
    this.healthBarShine = document.createElement('div');
    this.healthBarShine.style.cssText = `
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.3) 30%, 
        rgba(255, 255, 255, 0.6) 50%, 
        rgba(255, 255, 255, 0.3) 70%, 
        transparent 100%);
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      animation: shine 3s infinite linear;
    `;
    
    // Create health text
    this.healthText = document.createElement('div');
    this.healthText.style.cssText = `
      color: #ffffff;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      text-shadow: 
        2px 2px 0 #000000,
        -2px -2px 0 #000000,
        2px -2px 0 #000000,
        -2px 2px 0 #000000,
        0 2px 4px rgba(0, 0, 0, 0.5);
      margin-top: 4px;
      letter-spacing: 1px;
    `;
    
    // Add CSS animation for shine effect
    if (!document.getElementById('hud-animations')) {
      const style = document.createElement('style');
      style.id = 'hud-animations';
      style.textContent = `
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes lowHealthPulse {
          0%, 100% { 
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3),
                        inset 0 2px 0 rgba(255, 255, 255, 0.2);
          }
          50% { 
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5),
                        inset 0 2px 0 rgba(255, 255, 255, 0.2),
                        0 0 20px rgba(239, 68, 68, 0.3);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Assemble the health HUD
    this.healthBarFill.appendChild(this.healthBarShine);
    this.healthBarBg.appendChild(this.healthBarFill);
    
    const healthHeader = document.createElement('div');
    healthHeader.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    `;
    
    const healthLabel = document.createElement('span');
    healthLabel.style.cssText = `
      color: #ffffff;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
    `;
    healthLabel.textContent = 'HEALTH';
    
    healthHeader.appendChild(this.heartIcon);
    healthHeader.appendChild(healthLabel);
    
    this.healthContainer.appendChild(healthHeader);
    this.healthContainer.appendChild(this.healthBarBg);
    this.healthContainer.appendChild(this.healthText);
    
    this.root.appendChild(this.healthContainer);
=======
    this.healthEl = document.createElement('div');
    this.healthEl.textContent = 'Health: 100';
    this.root.appendChild(this.healthEl);

    this.infoEl = document.createElement('div');
    this.infoEl.style.marginTop = '8px';
    this.infoEl.textContent = '';
    this.root.appendChild(this.infoEl);

    this.codeEl = document.createElement('div');
    this.codeEl.style.marginTop = '6px';
    this.codeEl.style.letterSpacing = '3px';
    this.codeEl.style.fontWeight = '800';
    this.codeEl.style.color = '#ffd658';
    this.root.appendChild(this.codeEl);
>>>>>>> 5c4b097 (Refactor ReverseStation and Level classes; implement PasscodePanel and LinkProgress components; add ReverseMinigame and Door functionality)
  }

  setProps(props) {
    super.setProps(props);
    if (props && props.health !== undefined) {
      this.updateHealthDisplay(props.health, props.maxHealth || 100);
    }
  }

<<<<<<< HEAD
  updateHealthDisplay(health, maxHealth) {
    this.currentHealth = health;
    this.maxHealth = maxHealth;
    
    // Calculate health percentage
    const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    
    // Update health bar width with smooth animation
    this.healthBarFill.style.width = `${healthPercent}%`;
    
    // Update health text
    this.healthText.textContent = `${Math.round(health)} / ${Math.round(maxHealth)}`;
    
    // Update heart icon and container styling based on health
    if (healthPercent <= 25) {
      // Critical health - red pulsing effect
      this.heartIcon.innerHTML = '💔';
      this.healthContainer.style.animation = 'lowHealthPulse 1s infinite ease-in-out';
      this.healthBarFill.style.background = 'linear-gradient(to right, #dc2626, #b91c1c, #ef4444)';
    } else if (healthPercent <= 50) {
      // Low health - warning state
      this.heartIcon.innerHTML = '💔';
      this.healthContainer.style.animation = 'pulse 2s infinite ease-in-out';
      this.healthBarFill.style.background = 'linear-gradient(to right, #ea580c, #dc2626, #f97316)';
    } else {
      // Healthy - normal state
      this.heartIcon.innerHTML = '❤️';
      this.healthContainer.style.animation = 'none';
      this.healthBarFill.style.background = 'linear-gradient(to right, #ef4444, #dc2626, #f87171)';
    }
    
    // Add screen edge glow effect for very low health
    if (healthPercent <= 15) {
      this.addLowHealthEffect();
    } else {
      this.removeLowHealthEffect();
    }
  }

  addLowHealthEffect() {
    if (!this.lowHealthOverlay) {
      this.lowHealthOverlay = document.createElement('div');
      this.lowHealthOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1;
        box-shadow: inset 0 0 100px rgba(220, 38, 38, 0.3);
        animation: lowHealthScreen 1.5s infinite ease-in-out;
      `;
      
      // Add screen effect animation
      if (!document.getElementById('screen-effects')) {
        const style = document.createElement('style');
        style.id = 'screen-effects';
        style.textContent = `
          @keyframes lowHealthScreen {
            0%, 100% { box-shadow: inset 0 0 100px rgba(220, 38, 38, 0.2); }
            50% { box-shadow: inset 0 0 100px rgba(220, 38, 38, 0.4); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(this.lowHealthOverlay);
    }
  }

  removeLowHealthEffect() {
    if (this.lowHealthOverlay) {
      document.body.removeChild(this.lowHealthOverlay);
      this.lowHealthOverlay = null;
    }
  }

  updateCollectibles(apples, totalApples, potions, score) {
    // Update apples with color coding
    this.applesCollected = apples || 0;
    this.totalApples = totalApples || 10;
    this.appleText.textContent = `Apples: ${this.applesCollected} / ${this.totalApples}`;
    
    // Change apple display color based on progress
    const appleProgress = this.applesCollected / this.totalApples;
    if (appleProgress >= 1.0) {
      this.appleText.style.color = '#4caf50'; // Green when complete
      this.appleIcon.textContent = '🏆'; // Trophy when all collected
    } else if (appleProgress >= 0.5) {
      this.appleText.style.color = '#ff9800'; // Orange when halfway
    } else {
      this.appleText.style.color = '#ffeb3b'; // Yellow when starting
    }
    
    // Update health potions
    this.healthPotions = potions !== undefined ? potions : this.healthPotions;
    this.potionText.textContent = `Health Potions: ${this.healthPotions}`;
    
    // Change potion display based on count
    if (this.healthPotions === 0) {
      this.potionText.style.color = '#f44336'; // Red when empty
      this.potionIcon.textContent = '💔';
    } else if (this.healthPotions <= 1) {
      this.potionText.style.color = '#ff9800'; // Orange when low
      this.potionIcon.textContent = '🧪';
    } else {
      this.potionText.style.color = '#4caf50'; // Green when good
      this.potionIcon.textContent = '🧪';
    }
    
    // Update score with formatting
    if (score !== undefined) {
      this.playerScore = score;
      this.scoreText.textContent = `Score: ${this.playerScore.toLocaleString()}`;
    }
  }

  // Method to collect an apple (example usage)
  collectApple() {
    this.applesCollected = Math.min(this.applesCollected + 1, this.totalApples);
    this.playerScore += 100; // Award points for collecting apples
    this.updateCollectibles(this.applesCollected, this.totalApples, this.healthPotions, this.playerScore);
  }

  // Method to use a health potion
  useHealthPotion() {
    if (this.healthPotions > 0) {
      this.healthPotions--;
      this.updateCollectibles(this.applesCollected, this.totalApples, this.healthPotions, this.playerScore);
      return true; // Successfully used potion
    }
    return false; // No potions available
  }

=======
  setInfo({ linked, total, passcode }) {
    if (typeof linked === 'number' && typeof total === 'number') {
      this.infoEl.textContent = `Nodes: ${linked} / ${total}`;
    }
    if (passcode) {
      this.codeEl.textContent = `PASSCODE: ${passcode}`;
    }
  }

>>>>>>> 5c4b097 (Refactor ReverseStation and Level classes; implement PasscodePanel and LinkProgress components; add ReverseMinigame and Door functionality)
  update(delta, ctx) {
    if (ctx && ctx.player) {
      const hp = Math.round(ctx.player.health ?? 100);
      const maxHp = Math.round(ctx.player.maxHealth ?? 100);
      this.updateHealthDisplay(hp, maxHp);
    }
    
    // Smooth health number animation
    if (this.displayHealth !== this.currentHealth) {
      const diff = this.currentHealth - this.displayHealth;
      const step = diff * delta * 3; // Smooth transition speed
      this.displayHealth += step;
      
      if (Math.abs(diff) < 0.1) {
        this.displayHealth = this.currentHealth;
      }
    }
  }
}
