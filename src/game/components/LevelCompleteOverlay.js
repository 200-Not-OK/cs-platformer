// src/game/components/LevelCompleteOverlay.js
export class LevelCompleteOverlay {
  constructor({ onReplay, onSelect, availableLevels = [] } = {}) {
    this.onReplay = onReplay;
    this.onSelect = onSelect;
    this.available = availableLevels;

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed',
      inset: '0',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,.85))',
      zIndex: 9999
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(92vw, 720px)',
      borderRadius: '18px',
      border: '3px solid #51cf66',
      background: '#0b1324',
      color: 'white',
      padding: '24px',
      boxShadow: '0 20px 60px rgba(0,0,0,.6)',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    });

    this.title = document.createElement('div');
    this.title.textContent = 'Level Complete! 🐍✨';
    Object.assign(this.title.style, {
      fontSize: '28px',
      fontWeight: 800,
      letterSpacing: '.5px',
      marginBottom: '8px'
    });

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Choose your next step:';
    Object.assign(subtitle.style, {
      opacity: .85,
      marginBottom: '18px'
    });

    const actions = document.createElement('div');
    Object.assign(actions.style, {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '6px'
    });

    const btn = (label) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        cursor: 'pointer',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #51cf66',
        background: '#112143',
        color: 'white',
        fontWeight: 700
      });
      b.onmouseenter = () => b.style.transform = 'translateY(-2px)';
      b.onmouseleave = () => b.style.transform = 'translateY(0)';
      return b;
    };

    // Replay
    const replay = btn('Replay Level');
    replay.onclick = () => { this.hide(); this.onReplay?.(); };

    // Level buttons
    const levelWrap = document.createElement('div');
    Object.assign(levelWrap.style, { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' });
    for (const lvl of this.available) {
      const b = btn(`Go to: ${lvl.name || lvl.id}`);
      b.onclick = () => { this.hide(); this.onSelect?.(lvl.id); };
      levelWrap.appendChild(b);
    }

    // Close hint
    const hint = document.createElement('div');
    hint.textContent = 'Press ESC to close';
    Object.assign(hint.style, { marginTop: '12px', opacity: .6, fontSize: '12px' });

    actions.appendChild(replay);
    actions.appendChild(levelWrap);
    card.appendChild(this.title);
    card.appendChild(subtitle);
    card.appendChild(actions);
    card.appendChild(hint);
    this.root.appendChild(card);
    document.body.appendChild(this.root);

    // close on ESC
    this._esc = (e) => { if (e.code === 'Escape') this.hide(); };
    window.addEventListener('keydown', this._esc);
  }

  show(titleText = 'Level Complete! 🐍✨') {
    this.title.textContent = titleText;
    this.root.style.display = 'flex';
  }
  hide() {
    this.root.style.display = 'none';
  }
  dispose() {
    window.removeEventListener('keydown', this._esc);
    this.root.remove();
  }
}
