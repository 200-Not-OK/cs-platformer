// InputManager: keyboard + mouse + pointer state
export class InputManager {
  constructor(domElement = window) {
    this.enabled = true; // when false, handlers ignore events
    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseDown = false;
    this.rightMouseDown = false;
    this.leftMouseDown = false;
    this.rightClickTriggered = false; // For single-frame right click detection
    this.leftClickTriggered = false;  // For single-frame left click detection
    this.alwaysTrackMouse = false; // set true for third-person camera

    // Keyboard
    domElement.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      this.keys[e.code] = true;
    });
    domElement.addEventListener('keyup', (e) => {
      if (!this.enabled) return;
      this.keys[e.code] = false;
    });

    // Mouse
    this._last = null;
    domElement.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      this.mouseDown = true;
      
      if (e.button === 0) { // Left click
        this.leftMouseDown = true;
        this.leftClickTriggered = true;
      } else if (e.button === 2) { // Right click
        this.rightMouseDown = true;
        this.rightClickTriggered = true;
        e.preventDefault(); // Prevent context menu
      }
      
      this._last = { x: e.clientX, y: e.clientY };
    });
    domElement.addEventListener('mouseup', (e) => {
      if (!this.enabled) return;
      
      if (e.button === 0) { // Left click
        this.leftMouseDown = false;
      } else if (e.button === 2) { // Right click
        this.rightMouseDown = false;
      }
      
      // Set mouseDown to false only if no buttons are pressed
      if (!this.leftMouseDown && !this.rightMouseDown) {
        this.mouseDown = false;
        this._last = null;
      }
    });
    
    // Prevent context menu on right click
    domElement.addEventListener('contextmenu', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
    });
    domElement.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      // If pointer is locked, use movementX/movementY for smooth camera
      if (document.pointerLockElement === domElement || document.pointerLockElement === document.body) {
        this.mouseDelta.x += e.movementX;
        this.mouseDelta.y += e.movementY;
        return;
      }
      if (this.alwaysTrackMouse) {
        if (this._last) {
          const dx = e.clientX - this._last.x;
          const dy = e.clientY - this._last.y;
          this.mouseDelta.x += dx;
          this.mouseDelta.y += dy;
        }
        this._last = { x: e.clientX, y: e.clientY };
      } else {
        if (!this._last) return;
        const dx = e.clientX - this._last.x;
        const dy = e.clientY - this._last.y;
        this.mouseDelta.x += dx;
        this.mouseDelta.y += dy;
        this._last = { x: e.clientX, y: e.clientY };
      }
    });

    // small helper to consume mouse movement when used
    this.consumeMouseDelta = () => {
      const d = { x: this.mouseDelta.x, y: this.mouseDelta.y };
      this.mouseDelta.x = 0;
      this.mouseDelta.y = 0;
      return d;
    };
  }

  setEnabled(v) {
    const enable = !!v;
    this.enabled = enable;
    if (!enable) {
      // clear transient state so keys don't remain stuck when re-enabled
      this.keys = {};
      this.mouseDelta.x = 0;
      this.mouseDelta.y = 0;
      this.mouseDown = false;
      this.leftMouseDown = false;
      this.rightMouseDown = false;
      this.leftClickTriggered = false;
      this.rightClickTriggered = false;
      this._last = null;
    }
  }

  isKey(code) {
    return !!this.keys[code];
  }

  isRightMouseDown() {
    return this.rightMouseDown;
  }

  isLeftMouseDown() {
    return this.leftMouseDown;
  }

  wasRightClicked() {
    const triggered = this.rightClickTriggered;
    this.rightClickTriggered = false; // Reset after checking
    return triggered;
  }

  wasLeftClicked() {
    const triggered = this.leftClickTriggered;
    this.leftClickTriggered = false; // Reset after checking
    return triggered;
  }
}

