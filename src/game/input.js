// InputManager: keyboard + mouse + pointer state
export class InputManager {
  constructor(domElement = window) {
    this.keys = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseDown = false;

    domElement.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    domElement.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    // Mouse - we will use pointer lock only for free camera optionally; for orbit camera use drag
    this._last = null;
    domElement.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      this._last = { x: e.clientX, y: e.clientY };
    });
    domElement.addEventListener('mouseup', (e) => {
      this.mouseDown = false;
      this._last = null;
    });
    domElement.addEventListener('mousemove', (e) => {
      if (!this._last) return;
      const dx = e.clientX - this._last.x;
      const dy = e.clientY - this._last.y;
      this.mouseDelta.x += dx;
      this.mouseDelta.y += dy;
      this._last = { x: e.clientX, y: e.clientY };
    });

    // small helper to consume mouse movement when used
    this.consumeMouseDelta = () => {
      const d = { x: this.mouseDelta.x, y: this.mouseDelta.y };
      this.mouseDelta.x = 0;
      this.mouseDelta.y = 0;
      return d;
    };
  }

  isKey(code) {
    return !!this.keys[code];
  }
}
