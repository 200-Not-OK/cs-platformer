import { UIComponent } from '../uiComponent.js';

export class DeathMenu extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'death-menu';
    
    this.onRespawn = props.onRespawn || (() => {});
    
    this._createElements();
    this.hide(); // Hidden by default
  }

  _createElements() {
    // Overlay background
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: "Comic Sans MS", "Comic Sans", cursive, system-ui;
    `;

    // Menu container
    this.menuContainer = document.createElement('div');
    this.menuContainer.style.cssText = `
      background: linear-gradient(145deg, #2a1810, #1a0f08);
      border: 3px solid #8b4513;
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      color: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      min-width: 400px;
      animation: deathMenuSlide 0.5s ease-out;
    `;

    // Death title
    this.deathTitle = document.createElement('h1');
    this.deathTitle.textContent = '💀 YOU DIED 💀';
    this.deathTitle.style.cssText = `
      font-size: 48px;
      margin: 0 0 20px 0;
      color: #ff4444;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
      animation: deathPulse 2s infinite ease-in-out;
    `;

    // Death message
    this.deathMessage = document.createElement('p');
    this.deathMessage.textContent = 'Your health reached zero. Better luck next time!';
    this.deathMessage.style.cssText = `
      font-size: 18px;
      margin: 0 0 30px 0;
      color: #cccccc;
      line-height: 1.5;
    `;

    // Respawn button
    this.respawnButton = document.createElement('button');
    this.respawnButton.textContent = '🔄 RESPAWN';
    this.respawnButton.style.cssText = `
      background: linear-gradient(145deg, #4a90e2, #2171b5);
      border: 2px solid #1f5f8b;
      border-radius: 12px;
      color: white;
      font-size: 20px;
      font-weight: bold;
      padding: 15px 30px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;

    // Button hover effects
    this.respawnButton.addEventListener('mouseenter', () => {
      this.respawnButton.style.background = 'linear-gradient(145deg, #5ba0f2, #3181c5)';
      this.respawnButton.style.transform = 'translateY(-2px)';
      this.respawnButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    });

    this.respawnButton.addEventListener('mouseleave', () => {
      this.respawnButton.style.background = 'linear-gradient(145deg, #4a90e2, #2171b5)';
      this.respawnButton.style.transform = 'translateY(0)';
      this.respawnButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    });

    // Button click handler
    this.respawnButton.addEventListener('click', () => {
      this.onRespawn();
    });

    // Assemble the menu
    this.menuContainer.appendChild(this.deathTitle);
    this.menuContainer.appendChild(this.deathMessage);
    this.menuContainer.appendChild(this.respawnButton);
    this.overlay.appendChild(this.menuContainer);
    this.root.appendChild(this.overlay);

    // Add CSS animations
    this._addAnimations();
  }

  _addAnimations() {
    if (!document.getElementById('death-menu-animations')) {
      const style = document.createElement('style');
      style.id = 'death-menu-animations';
      style.textContent = `
        @keyframes deathMenuSlide {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes deathPulse {
          0%, 100% {
            text-shadow: 3px 3px 6px rgba(255, 68, 68, 0.8);
            transform: scale(1);
          }
          50% {
            text-shadow: 3px 3px 12px rgba(255, 68, 68, 1);
            transform: scale(1.05);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  show() {
    this.root.style.display = 'block';
    this.isVisible = true;
    
    // Focus the respawn button for keyboard accessibility
    setTimeout(() => {
      this.respawnButton.focus();
    }, 100);
  }

  hide() {
    this.root.style.display = 'none';
    this.isVisible = false;
  }

  setMessage(message) {
    this.deathMessage.textContent = message;
  }
}