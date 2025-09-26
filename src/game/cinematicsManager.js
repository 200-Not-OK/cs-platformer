import * as THREE from 'three';

/**
 * CinematicsManager handles level-specific cinematics, dialogue, and cutscenes
 */
export class CinematicsManager {
  constructor(scene) {
    this.scene = scene;
    this.cinematics = {};
    this.isPlaying = false;
    this.currentCinematic = null;
    this.dialogueUI = null;
    this.originalCameraPosition = new THREE.Vector3();
    this.originalCameraTarget = new THREE.Vector3();
  }

  loadCinematics(cinematicsData) {
    this.cinematics = cinematicsData;
    console.log('Loaded cinematics:', Object.keys(this.cinematics));
  }

  async playCinematic(triggerName, camera = null, player = null) {
    if (!this.cinematics[triggerName] || this.isPlaying) {
      return;
    }

    const cinematic = this.cinematics[triggerName];
    this.isPlaying = true;
    this.currentCinematic = triggerName;

    console.log('Playing cinematic:', triggerName);

    try {
      if (cinematic.type === 'dialogue') {
        await this._playDialogue(cinematic);
      } else if (cinematic.type === 'cutscene') {
        await this._playCutscene(cinematic, camera, player);
      }
    } catch (error) {
      console.error('Error playing cinematic:', error);
    } finally {
      this.isPlaying = false;
      this.currentCinematic = null;
    }
  }

  async _playDialogue(dialogue) {
    if (!dialogue.lines || dialogue.lines.length === 0) return;

    for (const line of dialogue.lines) {
      await this._showDialogueLine(line, dialogue.character);
      await this._wait(line.duration || 3000);
    }
    
    this._hideDialogue();
  }

  async _playCutscene(cutscene, camera, player) {
    // Store original camera position if camera is provided
    if (camera) {
      this.originalCameraPosition.copy(camera.position);
      this.originalCameraTarget.copy(camera.getWorldDirection(new THREE.Vector3()));
    }

    // Disable player movement if player is provided
    if (player && player.input) {
      player.input.enabled = false;
    }

    // Play camera path if defined
    if (cutscene.cameraPath && camera) {
      await this._playCameraPath(cutscene.cameraPath, camera);
    }

    // Play dialogue if defined
    if (cutscene.dialogue) {
      for (const line of cutscene.dialogue) {
        await this._showDialogueLine(line, line.character);
        await this._wait(line.duration || 3000);
      }
      this._hideDialogue();
    }

    // Restore camera and player control
    if (camera) {
      camera.position.copy(this.originalCameraPosition);
    }
    
    if (player && player.input) {
      player.input.enabled = true;
    }
  }

  async _playCameraPath(cameraPath, camera) {
    for (const keyframe of cameraPath) {
      // Simple linear interpolation - could be enhanced with easing
      const startPos = camera.position.clone();
      const targetPos = new THREE.Vector3(...keyframe.position);
      const duration = keyframe.duration || 2000;
      
      const startTime = Date.now();
      
      return new Promise((resolve) => {
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          camera.position.lerpVectors(startPos, targetPos, progress);
          
          if (keyframe.lookAt) {
            const lookAt = new THREE.Vector3(...keyframe.lookAt);
            camera.lookAt(lookAt);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        animate();
      });
    }
  }

  _showDialogueLine(line, character) {
    // Create or update dialogue UI
    if (!this.dialogueUI) {
      this.dialogueUI = this._createDialogueUI();
    }
    
    const characterElement = this.dialogueUI.querySelector('.dialogue-character');
    const textElement = this.dialogueUI.querySelector('.dialogue-text');
    
    if (characterElement && character) {
      characterElement.textContent = character.toUpperCase();
    }
    
    if (textElement) {
      textElement.textContent = line.text;
    }
    
    this.dialogueUI.style.display = 'block';
  }

  _hideDialogue() {
    if (this.dialogueUI) {
      this.dialogueUI.style.display = 'none';
    }
  }

  _createDialogueUI() {
    const dialogue = document.createElement('div');
    dialogue.className = 'cinematic-dialogue';
    dialogue.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 600px;
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 1000;
      display: none;
    `;
    
    const character = document.createElement('div');
    character.className = 'dialogue-character';
    character.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #ffdd44;
    `;
    
    const text = document.createElement('div');
    text.className = 'dialogue-text';
    text.style.cssText = `
      font-size: 18px;
      line-height: 1.4;
    `;
    
    dialogue.appendChild(character);
    dialogue.appendChild(text);
    document.body.appendChild(dialogue);
    
    return dialogue;
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Trigger cinematics based on game events
  triggerOnLevelStart() {
    if (this.cinematics.onLevelStart) {
      this.playCinematic('onLevelStart');
    }
  }

  triggerOnEnemyDefeat() {
    if (this.cinematics.onEnemyDefeat) {
      this.playCinematic('onEnemyDefeat');
    }
  }

  triggerOnLevelComplete() {
    if (this.cinematics.onLevelComplete) {
      this.playCinematic('onLevelComplete');
    }
  }

  dispose() {
    if (this.dialogueUI && this.dialogueUI.parentNode) {
      this.dialogueUI.parentNode.removeChild(this.dialogueUI);
    }
    this.isPlaying = false;
    this.currentCinematic = null;
  }
}