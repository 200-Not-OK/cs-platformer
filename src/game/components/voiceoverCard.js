/**
 * VoiceoverCard component - displays a character card with speaking animation
 * when voiceovers are playing
 */
export class VoiceoverCard {
  constructor(container, props = {}) {
    this.container = container;
    this.props = {
      characterName: props.characterName || 'Pravesh',
      characterImage: props.characterImage || null,
      position: props.position || 'right', // 'left' or 'right'
      ...props
    };

    this.root = null;
    this.visible = false;
    this.speaking = false;
    this.mount();
  }

  mount() {
    // Create the card element
    this.root = document.createElement('div');
    this.root.className = 'voiceover-card';
    this.root.style.cssText = `
      position: fixed;
      ${this.props.position === 'right' ? 'right: 20px;' : 'left: 20px;'}
      bottom: 20px;
      width: 200px;
      background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(40, 40, 60, 0.95));
      border: 2px solid rgba(100, 150, 255, 0.5);
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      opacity: 0;
      transform: translateY(20px) scale(0.9);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;

    // Character avatar
    this.avatar = document.createElement('div');
    this.avatar.className = 'voiceover-avatar';
    this.avatar.style.cssText = `
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4a5568, #2d3748);
      border: 3px solid rgba(100, 150, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(100, 150, 255, 0.3);
    `;

    // If character image is provided, use it
    if (this.props.characterImage) {
      this.avatar.style.backgroundImage = `url(${this.props.characterImage})`;
      this.avatar.style.backgroundSize = 'cover';
      this.avatar.style.backgroundPosition = 'center';
    } else {
      // Default to emoji/icon
      this.avatar.textContent = '🎤';
    }

    // Speaking indicator (animated ring)
    this.speakingIndicator = document.createElement('div');
    this.speakingIndicator.className = 'speaking-indicator';
    this.speakingIndicator.style.cssText = `
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      border: 3px solid rgba(100, 200, 255, 0.8);
      opacity: 0;
      animation: pulse 1.5s ease-in-out infinite;
    `;

    // Character name
    this.nameLabel = document.createElement('div');
    this.nameLabel.className = 'voiceover-name';
    this.nameLabel.textContent = this.props.characterName;
    this.nameLabel.style.cssText = `
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    `;

    // Speaking animation bars
    this.soundBars = document.createElement('div');
    this.soundBars.className = 'sound-bars';
    this.soundBars.style.cssText = `
      display: flex;
      gap: 3px;
      height: 20px;
      align-items: flex-end;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    // Create 5 sound bars
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 4px;
        background: linear-gradient(to top, #4299e1, #63b3ed);
        border-radius: 2px;
        animation: soundBar 0.6s ease-in-out infinite;
        animation-delay: ${i * 0.1}s;
      `;
      this.soundBars.appendChild(bar);
    }

    // Assemble the card
    this.avatar.appendChild(this.speakingIndicator);
    this.root.appendChild(this.avatar);
    this.root.appendChild(this.nameLabel);
    this.root.appendChild(this.soundBars);

    // Add CSS animations
    this.addAnimations();

    // Add to container
    this.container.appendChild(this.root);
  }

  addAnimations() {
    // Check if style element already exists
    if (document.getElementById('voiceover-card-styles')) return;

    const style = document.createElement('style');
    style.id = 'voiceover-card-styles';
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }

      @keyframes soundBar {
        0%, 100% {
          height: 30%;
        }
        50% {
          height: 100%;
        }
      }

      .voiceover-card.visible {
        opacity: 1 !important;
        transform: translateY(0) scale(1) !important;
      }

      .voiceover-card.speaking .speaking-indicator {
        opacity: 1 !important;
      }

      .voiceover-card.speaking .sound-bars {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  show(characterName, characterImage) {
    // Update character info if provided
    if (characterName) {
      this.nameLabel.textContent = characterName;
    }
    if (characterImage) {
      this.avatar.style.backgroundImage = `url(${characterImage})`;
      this.avatar.style.backgroundSize = 'cover';
      this.avatar.textContent = '';
    }

    this.visible = true;
    this.root.classList.add('visible');
  }

  hide() {
    this.visible = false;
    this.speaking = false;
    this.root.classList.remove('visible', 'speaking');
  }

  startSpeaking() {
    this.speaking = true;
    this.root.classList.add('speaking');
  }

  stopSpeaking() {
    this.speaking = false;
    this.root.classList.remove('speaking');
  }

  setProps(newProps) {
    this.props = { ...this.props, ...newProps };

    if (newProps.characterName) {
      this.nameLabel.textContent = newProps.characterName;
    }
    if (newProps.characterImage) {
      this.avatar.style.backgroundImage = `url(${newProps.characterImage})`;
      this.avatar.style.backgroundSize = 'cover';
      this.avatar.textContent = '';
    }
  }

  update(delta, ctx) {
    // Update logic if needed
  }

  unmount() {
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }
}