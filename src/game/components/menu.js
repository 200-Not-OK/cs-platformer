import { UIComponent } from '../uiComponent.js';

export class SmallMenu extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.props = props || {};

    // Root
    this.root.className = 'game-smallmenu';
    Object.assign(this.root.style, {
      position: 'absolute',
      inset: '0',
      display: 'none',                 // start hidden
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',  // subtle backdrop
      pointerEvents: 'auto',
      zIndex: 200
    });

    // Card
    this.card = document.createElement('div');
    Object.assign(this.card.style, {
      minWidth: '260px',
      padding: '14px 16px',
      background: 'rgba(20,20,20,0.95)',
      color: 'white',
      borderRadius: '10px',
      border: '1px solid rgba(120,140,180,0.35)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
    });

    const title = document.createElement('h3');
    title.textContent = 'Menu';
    Object.assign(title.style, { margin: '0 0 10px 0', fontSize: '18px' });

    const btnWrap = document.createElement('div');

    const resumeBtn = document.createElement('button');
    resumeBtn.id = 'menu-resume';
    resumeBtn.textContent = 'Resume';
    Object.assign(resumeBtn.style, {
      padding: '10px 14px',
      fontWeight: '700',
      borderRadius: '10px',
      border: '1px solid rgba(100,160,255,0.5)',
      background: 'linear-gradient(180deg, rgba(30,50,90,0.95), rgba(20,34,66,0.95))',
      color: '#eaf2ff',
      cursor: 'pointer'
    });
    resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof this.props.onResume === 'function') this.props.onResume();
    });

    btnWrap.appendChild(resumeBtn);
    this.card.appendChild(title);
    this.card.appendChild(btnWrap);
    this.root.appendChild(this.card);

    // Stop clicks on the backdrop from propagating (don’t trigger pointer lock, etc.)
    this.root.addEventListener('click', (e) => e.stopPropagation());

    // Keyboard support: Enter/Space resume
    this._keyHandler = (e) => {
      if (this.root.style.display === 'none') return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        if (typeof this.props.onResume === 'function') this.props.onResume();
      }
    };
  }

  mount() {
    super.mount();
    window.addEventListener('keydown', this._keyHandler);
    // Accessibility
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-hidden', 'true');
  }

  unmount() {
    window.removeEventListener('keydown', this._keyHandler);
    super.unmount();
  }

  show(v) {
    const on = !!v;
    this.root.style.display = on ? 'flex' : 'none';
    this.root.setAttribute('aria-hidden', (!on).toString());
    // focus the resume button when opening
    if (on) {
      const btn = this.root.querySelector('#menu-resume');
      if (btn) setTimeout(() => btn.focus(), 0);
    }
  }

  // helper so game code can detect clicks inside the menu if needed
  contains(node) {
    return this.root.contains(node);
  }
}
