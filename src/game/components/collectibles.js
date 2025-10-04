import { UIComponent } from '../uiComponent.js';

export class Collectibles extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'collectibles-ui';
    
    // Default collectible types and values
    this.collectibleTypes = props.collectibleTypes || {
      apples: { icon: '🍎', name: 'Apples', color: '#ffeb3b', completeColor: '#4caf50', completeIcon: '🏆' },
      potions: { icon: '🧪', name: 'Health Potions', color: '#4caf50', lowColor: '#ff9800', emptyColor: '#f44336', emptyIcon: '💔' }
    };
    
    // Initial values
    this.collectibles = {
      apples: { collected: 0, total: props.applesTotal || 10 },
      potions: { count: props.potionsStart || 3 }
    };
    
    this.pointsPerApple = props.pointsPerApple || 100;
    
    this._createElements();
  }

  _createElements() {
    // Main container styling
    this.root.style.cssText = `
      position: absolute;
      left: 20px;
      top: 135px;
      font-family: "Comic Sans MS", "Comic Sans", cursive, system-ui;
      pointer-events: none;
      user-select: none;
    `;

    // Collectibles container
    this.collectiblesContainer = document.createElement('div');
    this.collectiblesContainer.style.cssText = `
      padding: 12px 14px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 40, 0.8));
      border-radius: 15px;
      color: #ffffff;
      font-size: 14px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
      border: 2px solid rgba(255, 215, 0, 0.4);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      min-width: 180px;
    `;

    // Create sections for each collectible type
    this.sections = {};
    this._createAppleSection();
    this._createPotionSection();

    this.root.appendChild(this.collectiblesContainer);
  }

  _createAppleSection() {
    const config = this.collectibleTypes.apples;
    
    this.sections.apples = document.createElement('div');
    this.sections.apples.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      font-weight: bold;
      padding: 4px 0;
    `;
    
    this.appleIcon = document.createElement('span');
    this.appleIcon.textContent = config.icon;
    this.appleIcon.style.cssText = `
      font-size: 18px;
      margin-right: 10px;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6));
      transition: all 0.3s ease;
    `;
    
    this.appleText = document.createElement('span');
    this.appleText.textContent = `${config.name}: ${this.collectibles.apples.collected} / ${this.collectibles.apples.total}`;
    this.appleText.style.cssText = `
      color: ${config.color};
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      transition: color 0.3s ease;
    `;
    
    this.sections.apples.appendChild(this.appleIcon);
    this.sections.apples.appendChild(this.appleText);
    this.collectiblesContainer.appendChild(this.sections.apples);
  }

  _createPotionSection() {
    const config = this.collectibleTypes.potions;
    
    this.sections.potions = document.createElement('div');
    this.sections.potions.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      font-weight: bold;
      padding: 4px 0;
    `;
    
    this.potionIcon = document.createElement('span');
    this.potionIcon.textContent = config.icon;
    this.potionIcon.style.cssText = `
      font-size: 16px;
      margin-right: 10px;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.6));
      transition: all 0.3s ease;
    `;
    
    this.potionText = document.createElement('span');
    this.potionText.textContent = `${config.name}: ${this.collectibles.potions.count}`;
    this.potionText.style.cssText = `
      color: ${config.color};
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      transition: color 0.3s ease;
    `;
    
    this.sections.potions.appendChild(this.potionIcon);
    this.sections.potions.appendChild(this.potionText);
    this.collectiblesContainer.appendChild(this.sections.potions);
  }

  // Public methods for updating collectibles
  collectApple() {
    if (this.collectibles.apples.collected < this.collectibles.apples.total) {
      this.collectibles.apples.collected++;
      this._updateAppleDisplay();
      this._playCollectAnimation(this.appleIcon);
      return true;
    }
    return false;
  }

  addPotion() {
    this.collectibles.potions.count++;
    this._updatePotionDisplay();
    this._playCollectAnimation(this.potionIcon);
    console.log(`🧪 Added potion! Total: ${this.collectibles.potions.count}`);
    return true;
  }

  useHealthPotion() {
    if (this.collectibles.potions.count > 0) {
      this.collectibles.potions.count--;
      this._updatePotionDisplay();
      this._playCollectAnimation(this.potionIcon);
      return true;
    }
    return false;
  }

  addHealthPotion(count = 1) {
    this.collectibles.potions.count += count;
    this._updatePotionDisplay();
    this._playCollectAnimation(this.potionIcon);
  }

  _updateAppleDisplay() {
    const config = this.collectibleTypes.apples;
    const { collected, total } = this.collectibles.apples;
    const progress = collected / total;
    
    this.appleText.textContent = `${config.name}: ${collected} / ${total}`;
    
    if (progress >= 1.0) {
      this.appleText.style.color = config.completeColor;
      this.appleIcon.textContent = config.completeIcon;
    } else if (progress >= 0.5) {
      this.appleText.style.color = '#ff9800';
    } else {
      this.appleText.style.color = config.color;
    }
  }

  _updatePotionDisplay() {
    const config = this.collectibleTypes.potions;
    const count = this.collectibles.potions.count;
    
    this.potionText.textContent = `${config.name}: ${count}`;
    
    if (count === 0) {
      this.potionText.style.color = config.emptyColor;
      this.potionIcon.textContent = config.emptyIcon;
      this.potionIcon.style.animation = 'lowWarning 1s infinite ease-in-out';
    } else if (count <= 1) {
      this.potionText.style.color = config.lowColor;
      this.potionIcon.textContent = config.icon;
      this.potionIcon.style.animation = 'lowWarning 2s infinite ease-in-out';
    } else {
      this.potionText.style.color = config.color;
      this.potionIcon.textContent = config.icon;
      this.potionIcon.style.animation = 'none';
    }
  }

  _playCollectAnimation(iconElement) {
    iconElement.style.animation = 'collectPulse 0.5s ease-out';
    setTimeout(() => {
      iconElement.style.animation = 'none';
    }, 500);
  }

  // Get current collectible data (for saving/persistence)
  getCollectiblesData() {
    return {
      apples: { ...this.collectibles.apples },
      potions: { ...this.collectibles.potions }
    };
  }

  // Set collectible data (for loading/restoring)
  setCollectiblesData(data) {
    if (data.apples) {
      this.collectibles.apples = { ...this.collectibles.apples, ...data.apples };
      this._updateAppleDisplay();
    }
    if (data.potions) {
      this.collectibles.potions = { ...this.collectibles.potions, ...data.potions };
      this._updatePotionDisplay();
    }
  }

  update(delta, ctx) {
    // Auto-update from context if provided
    if (ctx && ctx.collectibles) {
      this.setCollectiblesData(ctx.collectibles);
    }
  }
}