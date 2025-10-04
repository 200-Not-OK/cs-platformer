import { UIComponent } from '../uiComponent.js';

export class InteractionPrompt extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'interaction-prompt';
    
    // Create the prompt element
    this.prompt = document.createElement('div');
    this.prompt.style.cssText = `
      position: fixed;
      top: 60%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.9));
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 12px;
      font-family: "Arial", sans-serif;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      border: 2px solid #ffd700;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 215, 0, 0.3);
      backdrop-filter: blur(5px);
      z-index: 1000;
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
    `;
    
    this.keyIcon = document.createElement('span');
    this.keyIcon.style.cssText = `
      display: inline-block;
      background: #ffd700;
      color: #000;
      padding: 4px 8px;
      border-radius: 4px;
      margin-right: 8px;
      font-weight: bold;
      font-size: 16px;
      min-width: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    this.keyIcon.textContent = 'E';
    
    this.message = document.createElement('span');
    this.message.textContent = props.message || 'to interact';
    
    this.prompt.appendChild(this.keyIcon);
    this.prompt.appendChild(this.message);
    this.root.appendChild(this.prompt);
    
    // Add pulsing animation
    this.addPulseAnimation();
    
    this.isVisible = false;
  }
  
  addPulseAnimation() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes interaction-pulse {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      
      .interaction-prompt-pulse {
        animation: interaction-pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }
  
  show(message = null) {
    if (message) {
      this.message.textContent = message;
    }
    
    this.prompt.style.opacity = '1';
    this.prompt.style.transform = 'translate(-50%, -50%) scale(1)';
    this.prompt.classList.add('interaction-prompt-pulse');
    this.isVisible = true;
  }
  
  hide() {
    this.prompt.style.opacity = '0';
    this.prompt.style.transform = 'translate(-50%, -50%) scale(0.9)';
    this.prompt.classList.remove('interaction-prompt-pulse');
    this.isVisible = false;
  }
  
  update(delta, ctx) {
    // No per-frame updates needed for this component
  }
}