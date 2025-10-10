// src/game/components/LevelPickerOverlay.js
export class LevelPickerOverlay {
  constructor({ onSelect, levels = [] } = {}) {
    this.onSelect = onSelect;
    this.levels = levels;

    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed',
      inset: 0,
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.75))',
      zIndex: 9998
    });

    const card = document.createElement('div');
    Object.assign(card.style, {
      width: 'min(92vw, 640px)',
      borderRadius: '18px',
      border: '3px solid #4dabf7',
      background: '#0b1222',
      color: 'white',
      padding: '22px',
      boxShadow: '0 20px 60px rgba(0,0,0,.55)',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    });

    const title = document.createElement('div');
    title.textContent = 'Choose a Level';
    Object.assign(title.style, { fontSize: '26px', fontWeight: 800, marginBottom: '8px' });

    const grid = document.createElement('div');
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '10px',
      marginTop: '12px'
    });

    const makeCard = (lvl) => {
      const c = document.createElement('button');
      c.textContent = `${lvl.name || lvl.id}`;
      Object.assign(c.style, {
        cursor: 'pointer',
        padding: '18px 12px',
        borderRadius: '14px',
        border: '2px solid #4dabf7',
        background: '#142647',
        color: 'white',
        fontWeight: 700
      });
      c.onclick = () => { this.hide(); this.onSelect?.(lvl); };
      return c;
    };

    for (const lvl of this.levels) {
      grid.appendChild(makeCard(lvl));
    }

    const hint = document.createElement('div');
    hint.textContent = 'Press N to open this picker any time';
    Object.assign(hint.style, { marginTop: '10px', opacity: .65, fontSize: '12px' });

    card.appendChild(title);
    card.appendChild(grid);
    card.appendChild(hint);
    this.root.appendChild(card);
    document.body.appendChild(this.root);
  }

  show() { this.root.style.display = 'flex'; }
  hide() { this.root.style.display = 'none'; }
  dispose() { this.root.remove(); }
}
