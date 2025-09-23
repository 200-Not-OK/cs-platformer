// InputManager: keyboard + mouse + pointer state
export class InputManager {
  constructor(domElement = window) {
    this.enabled = true; // when false, handlers ignore events
    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseDown = false;
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
      this._last = { x: e.clientX, y: e.clientY };
    });
    domElement.addEventListener('mouseup', (e) => {
      if (!this.enabled) return;
      this.mouseDown = false;
      this._last = null;
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
      this._last = null;
    }
  }

  isKey(code) {
    return !!this.keys[code];
  }
}

