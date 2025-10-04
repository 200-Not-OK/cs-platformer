export class VirtualKeypad {
  constructor(onSubmit, onCancel, doorPosition, expectedPasswordLength = 20) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.doorPosition = doorPosition;
    this.expectedPasswordLength = expectedPasswordLength;
    this.enteredCode = '';
    this.selectedIndex = 0;

    // Keypad layout: 0-9, Backspace, Submit, Cancel
    this.keys = [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      '0', '⌫', 'Submit',
      'Cancel'
    ];

    this.createUI();
    this.setupEventListeners();
    this.updateDisplay();
  }

  createUI() {
    this.element = document.createElement('div');
    this.element.style.position = 'fixed';
    this.element.style.top = '50%';
    this.element.style.left = '50%';
    this.element.style.transform = 'translate(-50%, -50%)';
    this.element.style.background = 'rgba(0, 0, 0, 0.9)';
    this.element.style.color = 'white';
    this.element.style.padding = '30px';
    this.element.style.borderRadius = '15px';
    this.element.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    this.element.style.zIndex = '1000';
    this.element.style.fontFamily = 'Arial, sans-serif';
    this.element.style.textAlign = 'center';
    this.element.style.userSelect = 'none';
    this.element.tabIndex = 0; // Make it focusable
    this.element.style.outline = 'none'; // Remove default focus outline
    this.element.style.border = '3px solid #4CAF50'; // Add green border to show focus

    this.element.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: #fff;">🔒 Enter Passcode</h2>
      <div id="codeDisplay" style="font-size: 24px; margin-bottom: 20px; min-height: 30px; color: #4CAF50;">_</div>
      <div id="keypad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 300px; margin: 0 auto;">
        ${this.keys.map((key, index) => `
          <button class="keypad-btn" data-index="${index}"
                  style="font-size: 18px; padding: 12px; background: #333; color: white; border: 2px solid #555; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            ${key}
          </button>
        `).join('')}
      </div>
      <div style="margin-top: 20px; font-size: 14px; color: #ccc;">
        Use WASD/Arrow keys to navigate • Enter/Space to select • Backspace to delete • Escape to cancel
      </div>
    `;

    document.body.appendChild(this.element);
    this.codeDisplay = this.element.querySelector('#codeDisplay');
    this.keypadButtons = this.element.querySelectorAll('.keypad-btn');
    this.updateSelection();
  }

  setupEventListeners() {
    console.log('Setting up keypad event listeners');
    
    // Prevent ALL keyboard events from reaching the game while keypad is active
    this.globalKeyHandler = (e) => {
      console.log('🎹 VirtualKeypad: Global key intercepted:', e.key, e.code);
      e.preventDefault();
      e.stopImmediatePropagation();
      console.log('🎹 VirtualKeypad: Event prevented and propagation stopped');
      
      // Handle the key in our keypad
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          this.moveSelection(-3); // Up
          break;
        case 's':
        case 'arrowdown':
          this.moveSelection(3); // Down
          break;
        case 'a':
        case 'arrowleft':
          this.moveSelection(-1); // Left
          break;
        case 'd':
        case 'arrowright':
          this.moveSelection(1); // Right
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '0':
          // Input the number directly
          this.inputNumber(e.key);
          break;
        case 'backspace':
          if (this.enteredCode.length > 0) {
            this.enteredCode = this.enteredCode.slice(0, -1);
            this.updateDisplay();
          }
          break;
        case 'enter':
        case ' ': // Space also works as enter
          this.selectCurrentKey();
          break;
        case 'escape':
          console.log('🎹 VirtualKeypad: ESC pressed - calling onCancel');
          this.onCancel();
          break;
      }
    };
    
    // Use capture phase on window to intercept ALL keyboard events
    window.addEventListener('keydown', this.globalKeyHandler, true);
    console.log('🎹 VirtualKeypad: Global keypad event listener attached with capture phase');
    
    // Also handle events directly on the keypad element as backup
    this.element.addEventListener('keydown', (e) => {
      console.log('🎹 VirtualKeypad: Backup element handler:', e.key);
      e.preventDefault();
      e.stopPropagation();
    });
    
    // Focus management
    this.element.focus();
    this.element.addEventListener('blur', () => {
      console.log('🎹 VirtualKeypad: Lost focus, refocusing');
      setTimeout(() => this.element.focus(), 10);
    });
  }

  inputNumber(number) {
    if (this.enteredCode.length < this.expectedPasswordLength) {
      this.enteredCode += number;
      this.updateDisplay();

      // Auto-submit when password is complete
      if (this.enteredCode.length === this.expectedPasswordLength) {
        this.onSubmit(this.enteredCode);
      }
    }
  }

  updateSelection() {
    this.keypadButtons.forEach((btn, index) => {
      if (index === this.selectedIndex) {
        btn.style.background = '#4CAF50';
        btn.style.borderColor = '#fff';
        btn.style.transform = 'scale(1.1)';
      } else {
        btn.style.background = '#333';
        btn.style.borderColor = '#555';
        btn.style.transform = 'scale(1)';
      }
    });
  }

  selectCurrentKey() {
    const selectedKey = this.keys[this.selectedIndex];

    if (selectedKey === 'Submit') {
      if (this.enteredCode.length > 0) {
        this.onSubmit(this.enteredCode);
      }
    } else if (selectedKey === 'Cancel') {
      this.onCancel();
    } else if (selectedKey === '⌫') {
      // Backspace
      if (this.enteredCode.length > 0) {
        this.enteredCode = this.enteredCode.slice(0, -1);
        this.updateDisplay();
      }
    } else {
      // Number key
      if (this.enteredCode.length < this.expectedPasswordLength) {
        this.enteredCode += selectedKey;
        this.updateDisplay();

        // Auto-submit when password is complete
        if (this.enteredCode.length === this.expectedPasswordLength) {
          this.onSubmit(this.enteredCode);
        }
      }
    }
  }

  updateDisplay() {
    // Show actual entered characters with cursor
    let display = this.enteredCode;
    if (this.enteredCode.length < this.expectedPasswordLength) {
      display += '_'; // Cursor position
      // Add dots for remaining positions
      while (display.length < this.expectedPasswordLength) {
        display += '·';
      }
    }
    this.codeDisplay.textContent = display;
    this.codeDisplay.style.color = '#4CAF50'; // Reset to green
  }

  // Method to show error state and clear input
  showError() {
    this.codeDisplay.style.color = '#f44336'; // Red for error
    this.codeDisplay.textContent = 'WRONG!';

    // Clear input after a brief delay
    setTimeout(() => {
      this.clearInput();
    }, 1000);
  }

  // Method to clear input for retry
  clearInput() {
    this.enteredCode = '';
    this.updateDisplay();
  }

  // Method to force camera to look at door
  forceCameraLookAt(camera) {
    if (camera && this.doorPosition) {
      camera.lookAt(
        this.doorPosition.x,
        this.doorPosition.y,
        this.doorPosition.z
      );
    }
  }

  remove() {
    if (this.globalKeyHandler) {
      window.removeEventListener('keydown', this.globalKeyHandler, true);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Keep the old PasscodeInput as fallback
export class PasscodeInput {
  constructor(onSubmit, onCancel) {
    this.element = document.createElement('div');
    this.element.style.position = 'fixed';
    this.element.style.top = '50%';
    this.element.style.left = '50%';
    this.element.style.transform = 'translate(-50%, -50%)';
    this.element.style.background = 'rgba(0, 0, 0, 0.9)';
    this.element.style.color = 'white';
    this.element.style.padding = '30px';
    this.element.style.borderRadius = '15px';
    this.element.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    this.element.style.zIndex = '1000';
    this.element.style.fontFamily = 'Arial, sans-serif';
    this.element.style.textAlign = 'center';
    this.element.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: #fff;">🔒 Enter Passcode</h2>
      <input type="password" id="passcodeInput" maxlength="20"
             style="font-size: 24px; padding: 15px; width: 200px; text-align: center; border-radius: 5px; border: none; margin-bottom: 20px;">
      <br>
      <button id="submitBtn"
              style="font-size: 18px; padding: 12px 25px; margin: 0 5px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Submit</button>
      <button id="cancelBtn"
              style="font-size: 18px; padding: 12px 25px; margin: 0 5px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
    `;

    document.body.appendChild(this.element);

    this.input = this.element.querySelector('#passcodeInput');
    this.submitBtn = this.element.querySelector('#submitBtn');
    this.cancelBtn = this.element.querySelector('#cancelBtn');

    this.submitBtn.addEventListener('click', () => {
      const code = this.input.value.trim();
      onSubmit(code);
    });

    this.cancelBtn.addEventListener('click', () => {
      onCancel();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const code = this.input.value.trim();
        onSubmit(code);
      } else if (e.key === 'Escape') {
        onCancel();
      }
    });

    // Focus the input
    setTimeout(() => this.input.focus(), 100);
  }

  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}