import { VirtualKeypad, PasscodeInput } from './PasscodeInput.js';

export class DoorInteractionHandler {
  constructor(gameInstance) {
    this.game = gameInstance; // Reference to game for camera access
    this.activeDoor = null;
    this.passcodeUI = null;
    this.originalCameraTarget = null; // Store original camera look target
  }

  // Handle interaction with a door - returns true if interaction was handled
  handleInteraction(door) {
    if (!door) return false;

    // Get player inventory (assuming it's available on the game instance)
    const playerInventory = this.game.player ? this.game.player.inventory : null;

    // If door is open, close it freely
    if (door.isOpen) {
      door.interact(playerInventory);
      console.log('🚪 Door closed freely');
      return true;
    }

    // Check if door is locked (separate from passcode)
    if (door.locked) {
      const success = door.interact(playerInventory);
      if (!success) {
        console.log('🔒 Door is locked - cannot open');
        // TODO: Show locked message to player
        return false;
      }
      // Door was unlocked, continue with normal interaction
    }

    // If door is closed and has passcode, check if password entry is allowed
    if (door.passcode) {
      console.log('Door passcode:', door.passcode, 'passwordEntryAllowed:', door.passwordEntryAllowed);
      if (door.passwordEntryAllowed !== false) {
        // Password entry is allowed (default true)
        this.showPasscodeUI(door);
        return true;
      } else {
        // Password entry not allowed - show message or just ignore
        console.log('🔒 Password entry not allowed for this door yet - complete challenges first!');
        // Could show a UI message here in the future
        return false; // Don't handle the interaction
      }
    }

    // If door is closed and no passcode, open it freely
    door.interact(playerInventory);
    console.log('🚪 Door opened freely');
    return true;
  }

  showPasscodeUI(door) {
    if (this.passcodeUI) {
      this.passcodeUI.remove();
    }

    this.activeDoor = door;

    // Set modal active flag to prevent game ESC handling
    this.game.modalActive = true;

    // Store original camera target if using third person camera
    if (this.game.activeCamera === this.game.thirdCameraObject) {
      this.originalCameraTarget = this.game.player.mesh.position.clone();
    }

    // Create virtual keypad with door position for camera focusing
    const doorPosition = {
      x: door.mesh.position.x,
      y: door.mesh.position.y + 2, // Look at center of door
      z: door.mesh.position.z
    };

    this.passcodeUI = new VirtualKeypad(
      (code) => this.onPasscodeSubmit(code),
      () => this.onPasscodeCancel(),
      doorPosition,
      door.passcode ? door.passcode.length : 20
    );

    // Force camera to look at door initially
    this.forceCameraLookAtDoor();
  }

  forceCameraLookAtDoor() {
    if (this.passcodeUI && this.activeDoor) {
      this.passcodeUI.forceCameraLookAt(this.game.activeCamera);
    }
  }

  onPasscodeSubmit(code) {
    if (code === this.activeDoor.passcode) {
      this.activeDoor.interact();
      console.log('✅ Correct passcode! Door opened');
    } else {
      console.log('❌ Wrong passcode - showing error and clearing input for retry');
      // Show error state and clear input for retry
      if (this.passcodeUI && this.passcodeUI.showError) {
        this.passcodeUI.showError();
      }
      return;
    }

    this.cleanup();
  }

  onPasscodeCancel() {
    console.log('🔒 Passcode entry cancelled');
    this.cleanup();
  }

  cleanup() {
    // Restore original camera target if it was stored
    if (this.originalCameraTarget && this.game.activeCamera === this.game.thirdCameraObject) {
      this.game.activeCamera.lookAt(this.originalCameraTarget);
    }

    if (this.passcodeUI) {
      this.passcodeUI.remove();
      this.passcodeUI = null;
    }
    this.activeDoor = null;
    this.originalCameraTarget = null;

    // Clear modal active flag
    this.game.modalActive = false;
  }

  // Update method if needed for animations or timers
  update(delta) {
    // Force camera to stay looking at door while keypad is active
    if (this.passcodeUI && this.activeDoor) {
      this.forceCameraLookAtDoor();

      // Check if player is still in range - if not, hide the UI
      const playerPosition = this.game.player.mesh.position;
      if (!this.activeDoor.canPlayerInteract(playerPosition)) {
        console.log('Player walked away from door - hiding passcode UI');
        this.cleanup();
      }
    }
  }
}