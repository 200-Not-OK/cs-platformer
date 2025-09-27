import { UIComponent } from '../uiComponent.js';

export class CountdownTimer extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.total = Math.max(0, Math.floor(props.seconds ?? 120)); // default 2:00
    this.remaining = this.total;
    this.running = false;
    this.warned30 = false;
    this.lastWhole = this.total;

    this._build();
  }

  _build() {
    // container
    this.root.className = 'countdown-timer';
    Object.assign(this.root.style, {
      position: 'absolute',
      top: '14px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      pointerEvents: 'none'
    });

    // timer face
    this.face = document.createElement('div');
    Object.assign(this.face.style, {
      minWidth: '170px',
      padding: '8px 14px',
      background: 'linear-gradient(180deg, rgba(10,14,22,0.9), rgba(12,18,28,0.9))',
      border: '1px solid rgba(76,100,160,0.55)',
      borderRadius: '14px',
      color: '#dff1ff',
      font: '800 28px/1 monospace',
      letterSpacing: '2px',
      textShadow: '0 0 18px rgba(121,210,255,0.35), 0 0 2px rgba(121,210,255,0.7)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
      userSelect: 'none',
      transform: 'translateZ(0)',
      transition: 'transform 120ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease'
    });
    this.faceText = document.createElement('span');
    this.face.appendChild(this.faceText);
    this.root.appendChild(this.face);

    // subtle underglow
    this.glow = document.createElement('div');
    Object.assign(this.glow.style, {
      marginTop: '6px',
      width: '70%',
      height: '6px',
      borderRadius: '999px',
      background: 'radial-gradient(50% 50% at 50% 50%, rgba(121,210,255,0.55) 0%, rgba(121,210,255,0.0) 70%)',
      filter: 'blur(4px)',
      opacity: '0.65',
      transition: 'opacity 200ms ease'
    });
    this.root.appendChild(this.glow);

    // initial digits
    this._renderDigits();
  }

  mount() {
    super.mount();
    this.start();
    if (typeof this.props.onStart === 'function') {
      try { this.props.onStart(); } catch {}
    }
  }

  // Public API
  start() { this.running = true; }
  pause() { this.running = false; }
  reset(seconds) {
    this.total = Math.max(0, Math.floor(seconds ?? this.total));
    this.remaining = this.total;
    this.warned30 = false;
    this.lastWhole = this.total;
    this._renderDigits(true);
    this._setMood('calm');
  }

  setProps(props) {
    super.setProps(props);
    if (props.seconds !== undefined) this.reset(props.seconds);
  }

  // Called each frame
  update(delta /*, ctx */) {
    if (!this.running) return;
    if (this.remaining <= 0) return;

    this.remaining = Math.max(0, this.remaining - delta);
    const whole = Math.ceil(this.remaining);

    // on downward tick to a new whole second, animate
    if (whole !== this.lastWhole) {
      this._tickPulse();
      this.lastWhole = whole;
    }

    // warn at 30s once (visual escalation; external code plays cutscene)
    if (!this.warned30 && this.remaining <= 30) {
      this.warned30 = true;
      this._setMood('urgent');
      if (typeof this.props.onWarning30 === 'function') {
        try { this.props.onWarning30(); } catch {}
      }
    }

    // escalate at 10s
    if (this.remaining <= 10) {
      this._setMood('panic');
      // extra shake every half second
      if ((Math.floor(this.remaining * 2) % 2) === 0) {
        this._shake();
      }
    }

    // expire
    if (this.remaining <= 0) {
      this.remaining = 0;
      this._setMood('dead');
      this._deathFlash();
      this.running = false;
      if (typeof this.props.onExpire === 'function') {
        try { this.props.onExpire(); } catch {}
      }
    }

    // digits
    this._renderDigits();
  }

  // ---------- visuals & mood ----------

  _renderDigits(force = false) {
    const t = Math.max(0, Math.ceil(this.remaining));
    const m = Math.floor(t / 60);
    const s = t % 60;
    const txt = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    if (force || this.faceText.textContent !== txt) {
      this.faceText.textContent = txt;
    }
  }

  _setMood(state) {
    // calm (default) → urgent (<=30s) → panic (<=10s) → dead
    if (state === 'calm') {
      this.face.style.borderColor = 'rgba(76,100,160,0.55)';
      this.face.style.background = 'linear-gradient(180deg, rgba(10,14,22,0.9), rgba(12,18,28,0.9))';
      this.face.style.color = '#dff1ff';
      this.glow.style.opacity = '0.65';
      this.face.style.textShadow = '0 0 18px rgba(121,210,255,0.35), 0 0 2px rgba(121,210,255,0.7)';
    } else if (state === 'urgent') {
      this.face.style.borderColor = 'rgba(255,120,120,0.55)';
      this.face.style.background = 'linear-gradient(180deg, rgba(26,18,18,0.92), rgba(34,12,12,0.92))';
      this.face.style.color = '#ffe1e1';
      this.glow.style.opacity = '0.85';
      this.face.style.textShadow = '0 0 14px rgba(255,110,110,0.55), 0 0 3px rgba(255,150,150,0.85)';
    } else if (state === 'panic') {
      this.face.style.borderColor = 'rgba(255,70,70,0.9)';
      this.face.style.background = 'linear-gradient(180deg, rgba(38,8,8,0.95), rgba(48,8,8,0.95))';
      this.face.style.color = '#ffebeb';
      this.glow.style.opacity = '1';
      this.face.style.textShadow = '0 0 22px rgba(255,60,60,0.75), 0 0 4px rgba(255,150,150,1)';
      // continuous slight pulse
      this.face.style.transform = 'translateZ(0) scale(1.02)';
      setTimeout(() => { this.face.style.transform = 'translateZ(0)'; }, 120);
    } else if (state === 'dead') {
      this.face.style.borderColor = 'rgba(120,120,120,0.7)';
      this.face.style.background = 'linear-gradient(180deg, rgba(12,12,12,0.95), rgba(10,10,10,0.95))';
      this.face.style.color = '#dddddd';
      this.glow.style.opacity = '0.2';
      this.face.style.textShadow = 'none';
    }
  }

  _tickPulse() {
    this.face.style.transform = 'translateZ(0) scale(1.04)';
    setTimeout(() => { this.face.style.transform = 'translateZ(0)'; }, 90);
  }

  _shake() {
    this.face.style.transition = 'transform 40ms ease';
    this.face.style.transform = 'translateZ(0) translateX(-2px)';
    setTimeout(() => { this.face.style.transform = 'translateZ(0) translateX(2px)'; }, 40);
    setTimeout(() => { this.face.style.transform = 'translateZ(0)'; this.face.style.transition='transform 120ms ease'; }, 80);
  }

  _deathFlash() {
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position: 'fixed',
      inset: '0',
      background: 'radial-gradient(1200px 700px at 50% 40%, rgba(255,240,240,0.65) 0%, rgba(255,80,80,0.25) 40%, rgba(255,0,0,0) 70%)',
      pointerEvents: 'none',
      zIndex: 999,
      opacity: '1',
      transition: 'opacity 800ms ease'
    });
    document.body.appendChild(flash);
    // fade out, then remove
    requestAnimationFrame(() => { flash.style.opacity = '0'; });
    setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 820);
  }
}
