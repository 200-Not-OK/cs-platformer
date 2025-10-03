import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class ThreeDKeypad {
  constructor(scene, physicsWorld, position, onSubmit, onCancel, doorPosition, expectedPassword = null, scale = 2.0, floatingUI = false) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.position = position;
    this.scale = scale;
    this.floatingUI = floatingUI;
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.doorPosition = doorPosition;
    this.expectedPassword = expectedPassword;
    this.enteredCode = '';
    this.isActive = true;
    this.selectedButton = null;
    this.buttons = [];
    this.buttonMeshes = [];

    // Create the keypad model
    this.createKeypadModel();

    // Set up interaction
    this.setupInteraction();

    // Start cursor blink
    this.startCursorBlink();
  }

  createKeypadModel() {
    // Main keypad housing
    this.keypadGroup = new THREE.Group();
    this.keypadGroup.position.copy(this.position);

    // Apply scale
    this.keypadGroup.scale.setScalar(this.scale);

    // Position keypad to face the player/camera
    this.updateOrientation();

    // Housing (dark metallic frame)
    const housingGeometry = new THREE.BoxGeometry(1.4, 1.0, 0.1);
    const housingMaterial = new THREE.MeshLambertMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2
    });
    this.housing = new THREE.Mesh(housingGeometry, housingMaterial);
    this.keypadGroup.add(this.housing);

    // Screen/display area
    const screenGeometry = new THREE.PlaneGeometry(1.2, 0.3);
    const screenMaterial = new THREE.MeshBasicMaterial({
      color: 0x001100,
      transparent: true,
      opacity: 0.9
    });
    this.screen = new THREE.Mesh(screenGeometry, screenMaterial);
    this.screen.position.set(0, 0.25, 0.051);
    this.keypadGroup.add(this.screen);

    // Create display text
    this.createDisplayText();

    // Create buttons
    this.createButtons();

    // Add subtle glow effect
    this.addGlowEffect();

    // Add to scene
    this.scene.add(this.keypadGroup);

    // Add physics body for interaction detection
    this.createPhysicsBody();
  }

  createDisplayText() {
    // Create canvas for text rendering
    this.canvas = document.createElement('canvas');
    this.canvas.width = 768;
    this.canvas.height = 192;
    this.context = this.canvas.getContext('2d');

    // Create texture from canvas
    this.displayTexture = new THREE.CanvasTexture(this.canvas);
    this.displayTexture.generateMipmaps = false;

    // Apply texture to screen
    this.screen.material.map = this.displayTexture;
    this.screen.material.needsUpdate = true;

    this.updateDisplay();
  }

  createButtons() {
    // Button layout: 4x3 grid
    const buttonLabels = [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      '0', '⌫', '✓'
    ];

    const buttonGeometry = new THREE.BoxGeometry(0.35, 0.2, 0.05);
    const buttonMaterial = new THREE.MeshLambertMaterial({
      color: 0x444444,
      metalness: 0.5,
      roughness: 0.5
    });

    for (let i = 0; i < buttonLabels.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;

      // Create button mesh
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial.clone());
      button.position.set(
        (col - 1) * 0.4,  // X position (increased spacing)
        0.05 - row * 0.25, // Y position (increased spacing)
        0.03               // Z position (slightly raised)
      );

      // Create button label
      const labelGeometry = new THREE.PlaneGeometry(0.25, 0.15);
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 160;
      labelCanvas.height = 96;
      const labelContext = labelCanvas.getContext('2d');
      labelContext.fillStyle = '#ffffff';
      labelContext.font = 'bold 40px Arial';
      labelContext.textAlign = 'center';
      labelContext.fillText(buttonLabels[i], 80, 60);

      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, 0, 0.031); // Slightly higher than button surface
      button.add(label);

      // Store button data
      this.buttons.push({
        mesh: button,
        label: buttonLabels[i],
        originalY: button.position.y,
        pressed: false
      });

      this.keypadGroup.add(button);
      this.buttonMeshes.push(button);
    }
  }

  addGlowEffect() {
    // Add subtle emissive glow to the housing
    this.housing.material.emissive = new THREE.Color(0x002200);
    this.housing.material.emissiveIntensity = 0.1;
  }

  createPhysicsBody() {
    // Only create physics body if not in floating UI mode
    if (this.floatingUI || !this.physicsWorld) return;

    const shape = new CANNON.Box(new CANNON.Vec3(0.6 * this.scale, 0.4 * this.scale, 0.05 * this.scale));
    this.physicsBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
    this.physicsBody.addShape(shape);
    this.physicsBody.position.copy(this.keypadGroup.position);
    this.physicsWorld.addBody(this.physicsBody);
  }

  setupInteraction() {
    // Set up raycasting for button interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Event listeners for mouse interaction
    this.onMouseMove = (event) => this.handleMouseMove(event);
    this.onMouseClick = (event) => this.handleMouseClick(event);
    this.onKeyDown = (event) => this.handleKeyDown(event);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('click', this.onMouseClick);
    document.addEventListener('keydown', this.onKeyDown);

    // Prevent game input while keypad is active
    this.preventGameInput();
  }

  preventGameInput() {
    // Store original event listeners and replace them
    this.originalKeyDown = window.onkeydown;
    this.originalKeyUp = window.onkeyup;

    // Override to prevent game input
    window.onkeydown = (e) => {
      // Only handle our keypad keys, prevent others from reaching game
      if (!['Escape', 'Enter', 'Backspace', '0','1','2','3','4','5','6','7','8','9'].includes(e.key)) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    window.onkeyup = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
  }

  restoreGameInput() {
    // Restore original event listeners
    if (this.originalKeyDown) window.onkeydown = this.originalKeyDown;
    if (this.originalKeyUp) window.onkeyup = this.originalKeyUp;
  }

  handleMouseMove(event) {
    // Update mouse position for raycasting
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Highlight button under mouse
    this.updateButtonHighlight();
  }

  handleMouseClick(event) {
    if (this.selectedButton) {
      this.pressButton(this.selectedButton);
    }
  }

  handleKeyDown(event) {
    // Handle keyboard input
    if (event.key >= '0' && event.key <= '9') {
      this.addCharacter(event.key);
    } else if (event.key === 'Backspace') {
      this.backspace();
    } else if (event.key === 'Enter') {
      this.submitCode();
    } else if (event.key === 'Escape') {
      this.cancel();
    }
  }

  updateButtonHighlight() {
    // Reset previous highlight
    if (this.selectedButton) {
      this.selectedButton.mesh.material.emissive.setHex(0x000000);
    }

    // Raycast to find button under mouse
    this.raycaster.setFromCamera(this.mouse, window.gameCamera || window.camera);
    const intersects = this.raycaster.intersectObjects(this.buttonMeshes);

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object;
      const button = this.buttons.find(b => b.mesh === intersectedMesh || b.mesh.children.includes(intersectedMesh));

      if (button) {
        this.selectedButton = button;
        button.mesh.material.emissive.setHex(0x444444);
      }
    } else {
      this.selectedButton = null;
    }
  }

  pressButton(button) {
    // Animate button press
    button.pressed = true;
    button.mesh.position.y = button.originalY - 0.02;

    // Visual feedback
    button.mesh.material.emissive.setHex(0x666666);

    // Handle button action
    if (button.label === '⌫') {
      this.backspace();
    } else if (button.label === '✓') {
      this.submitCode();
    } else {
      this.addCharacter(button.label);
    }

    // Reset button after animation
    setTimeout(() => {
      button.pressed = false;
      button.mesh.position.y = button.originalY;
      button.mesh.material.emissive.setHex(button === this.selectedButton ? 0x444444 : 0x000000);
    }, 150);
  }

  addCharacter(char) {
    if (this.enteredCode.length < 20) {
      this.enteredCode += char;
      this.updateDisplay();
      this.playTypeSound();
    }
  }

  backspace() {
    if (this.enteredCode.length > 0) {
      this.enteredCode = this.enteredCode.slice(0, -1);
      this.updateDisplay();
      this.playBackspaceSound();
    }
  }

  submitCode() {
    if (this.onSubmit) {
      this.onSubmit(this.enteredCode);
    }
    this.remove();
  }

  cancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.remove();
  }

  updateDisplay() {
    // Clear canvas
    this.context.fillStyle = '#001100';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw border
    this.context.strokeStyle = '#00ff00';
    this.context.lineWidth = 6;
    this.context.strokeRect(15, 15, this.canvas.width - 30, this.canvas.height - 30);

    // Draw text
    this.context.fillStyle = '#00ff00';
    this.context.font = 'bold 72px monospace';
    this.context.textAlign = 'center';

    let displayText = this.enteredCode;
    if (this.cursorVisible) {
      displayText += '_';
    }

    this.context.fillText(displayText, this.canvas.width / 2, this.canvas.height / 2 + 25);

    // Update texture
    this.displayTexture.needsUpdate = true;
  }

  startCursorBlink() {
    this.cursorVisible = true;
    this.cursorInterval = setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
      this.updateDisplay();
    }, 500);
  }

  stopCursorBlink() {
    if (this.cursorInterval) {
      clearInterval(this.cursorInterval);
    }
  }

  updateOrientation() {
    // Make keypad face the camera/player
    if (window.gameCamera || window.camera) {
      const camera = window.gameCamera || window.camera;
      this.keypadGroup.lookAt(camera.position);
    }

    // For floating UI, keep it locked in front of camera at fixed distance
    if (this.floatingUI && (window.gameCamera || window.camera)) {
      const camera = window.gameCamera || window.camera;
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      
      // Keep keypad at fixed distance in front of camera (very close)
      const targetPos = camera.position.clone()
        .add(cameraDirection.multiplyScalar(1.2)); // Fixed 1.2 units in front
      
      // Instantly position (no lerp for immediate response)
      this.keypadGroup.position.copy(targetPos);
    }
  }

  update() {
    // Update orientation each frame
    this.updateOrientation();

    // Update physics body position (only if not floating UI)
    if (!this.floatingUI && this.physicsBody) {
      this.physicsBody.position.copy(this.keypadGroup.position);
    }
  }

  showError() {
    // Flash red for error
    this.screen.material.color.setHex(0x110000);
    setTimeout(() => {
      this.screen.material.color.setHex(0x001100);
      this.clearInput();
    }, 1000);
  }

  clearInput() {
    this.enteredCode = '';
    this.updateDisplay();
  }

  playTypeSound() {
    // Create audio context for button press sound
    if (window.AudioContext || window.webkitAudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }

  playBackspaceSound() {
    // Different sound for backspace
    if (window.AudioContext || window.webkitAudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }

  remove() {
    // Restore game input
    this.restoreGameInput();

    // Remove event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('click', this.onMouseClick);
    document.removeEventListener('keydown', this.onKeyDown);

    // Stop cursor blink
    this.stopCursorBlink();

    // Remove from scene
    if (this.keypadGroup && this.keypadGroup.parent) {
      this.scene.remove(this.keypadGroup);
    }

    // Remove physics body (only if not floating UI)
    if (!this.floatingUI && this.physicsBody && this.physicsWorld) {
      this.physicsWorld.removeBody(this.physicsBody);
    }

    this.isActive = false;
  }
}