export class ReverseMinigame {
  constructor(root, { onSuccess, onFail, onClose, onOpen } = {}) {
    this.root = document.createElement('div');
    this.root.className = 'reverse-overlay';
    this.onSuccess = onSuccess;
    this.onFail = onFail;
    this.onClose = onClose;
    this.onOpen = onOpen || null;
    this.tries = 3;
    this._dead = false;
    this._dragEl = null;

    const style = document.createElement('style');
    style.textContent = `
      .reverse-overlay{
        position:fixed;inset:0;background:rgba(8,10,14,.86);
        display:flex;align-items:center;justify-content:center;
        z-index:9999;font-family:system-ui,-apple-system,Segoe UI,Roboto;
        pointer-events:auto;cursor:default
      }
      .rev-card{
        background:#17202a;border:1px solid #2b3a4a;border-radius:12px;
        padding:14px 16px;margin:8px;cursor:grab;user-select:none;
        box-shadow:0 8px 24px rgba(0,0,0,.35);font-weight:600;color:#dbe7ff;
        -webkit-user-drag: element; /* Safari: make DnD reliable */
      }
      .rev-wrap{
        width:min(860px,92vw);background:linear-gradient(180deg,#12171d,#0b0f14);
        border:1px solid #2b3a4a;border-radius:16px;padding:20px 18px;color:#eaf2ff
      }
      .rev-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
      .rev-row{display:flex;flex-wrap:wrap;min-height:84px;border:1px dashed #2b3a4a;border-radius:12px;padding:10px}
      .rev-row.drag-over{outline:2px solid #60a5fa; outline-offset:2px}
      .rev-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
      .rev-btn{appearance:none;background:#1f6feb;color:#fff;border:0;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer}
      .rev-btn[disabled]{background:#394a61;cursor:not-allowed}
      .rev-sub{opacity:.85}
    `;
    document.head.appendChild(style);

    // Ensure overlay fully captures input (so canvas doesn't)
    this.root.tabIndex = 0;
    const stop = (e) => e.stopPropagation();
    this.root.addEventListener('wheel', stop, { passive: true });
    this.root.addEventListener('keydown', stop);
    this.root.addEventListener('mousedown', stop);
    this.root.addEventListener('mouseup', stop);
    this.root.addEventListener('click', stop);
    // Help some browsers keep DnD inside the overlay
    this.root.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });
    this.root.addEventListener('drop',     (e) => { e.preventDefault(); e.stopPropagation(); });

    const wrap = document.createElement('div');
    wrap.className = 'rev-wrap';

    const head = document.createElement('div');
    head.className = 'rev-head';
    head.innerHTML = `
      <div>
        <div style="font-size:20px;font-weight:800">Reverse the Linked List</div>
        <div class="rev-sub">Arrange the steps into the correct order. Tries left: <span id="revTries">3</span></div>
      </div>
      <button class="rev-btn" id="revClose">Quit</button>
    `;

    const bank = document.createElement('div');
    bank.className = 'rev-row'; bank.id = 'revBank';

    const slots = document.createElement('div');
    slots.className = 'rev-row'; slots.id = 'revSlots';

    const buttons = document.createElement('div');
    buttons.className = 'rev-btns';
    buttons.innerHTML = `<button class="rev-btn" id="revCheck">Run Algorithm</button>`;

    wrap.append(head, bank, slots, buttons);
    this.root.appendChild(wrap);
    (root || document.body).appendChild(this.root);

    // Flag open & free mouse (movement is halted by InputManager guard)
    window.__reverseOpen = true;
    try { document.exitPointerLock(); } catch {}
    this.onOpen && this.onOpen();
    setTimeout(() => { try { this.root.focus(); } catch {} }, 0);

    // steps (shuffled)
    this.correct = [
      'prev = null',
      'curr = head',
      'while (curr)',
      '  next = curr.next',
      '  curr.next = prev',
      '  prev = curr; curr = next',
      '// head = prev'
    ];
    const shuffled = [...this.correct].sort(() => Math.random() - 0.5);

    // cards
    for (const s of shuffled) {
      const el = document.createElement('div');
      el.className = 'rev-card';
      el.draggable = true;
      el.textContent = s;

      el.addEventListener('dragstart', (e) => {
        try {
          e.dataTransfer.clearData();
          e.dataTransfer.setData('text/plain', s); // Firefox needs a payload
          e.dataTransfer.effectAllowed = 'move';
        } catch {}
        el.classList.add('dragging');
        this._dragEl = el;
      });
      el.addEventListener('dragend', () => {
        this._dragEl?.classList.remove('dragging');
        this._dragEl = null;
      });

      // optional: double-click toggles row as a fallback
      el.addEventListener('dblclick', () => {
        const parent = el.parentElement;
        (parent === bank ? slots : bank).appendChild(el);
      });

      bank.appendChild(el);
    }

    // DnD targets
    const onDragEnter = (e) => {
      if (!this._dragEl) return;
      e.preventDefault(); e.stopPropagation();
      e.currentTarget.classList.add('drag-over');
    };
    const onDragOver = (e) => {
      if (!this._dragEl) return;
      e.preventDefault(); e.stopPropagation();
      try { e.dataTransfer.dropEffect = 'move'; } catch {}
    };
    const onDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };
    const onDrop = (e) => {
      if (!this._dragEl) return;
      e.preventDefault(); e.stopPropagation();
      const row = e.currentTarget;
      row.classList.remove('drag-over');
      const targetCard = e.target?.closest?.('.rev-card');
      if (targetCard && targetCard !== this._dragEl && row.contains(targetCard)) {
        row.insertBefore(this._dragEl, targetCard);
      } else {
        row.appendChild(this._dragEl);
      }
    };
    for (const row of [bank, slots]) {
      row.addEventListener('dragenter', onDragEnter);
      row.addEventListener('dragover',  onDragOver);
      row.addEventListener('dragleave', onDragLeave);
      row.addEventListener('drop',      onDrop);
    }

    // hotkeys scoped to overlay
    this._hk = (e) => {
      if (this._dead) return;
      if (e.code === 'Enter') wrap.querySelector('#revCheck').click();
      if (e.code === 'KeyR') this._shuffle(bank);
      if (e.code === 'KeyQ') this._cycle(bank, -1);
      if (e.code === 'KeyE') this._cycle(bank, +1);
      e.stopPropagation();
    };
    this.root.addEventListener('keydown', this._hk);

    // actions
    wrap.querySelector('#revClose').onclick = () => {
      this.tries = 0;
      this.onClose?.();
      this.destroy();
    };
    wrap.querySelector('#revCheck').onclick = () => {
      const placed = Array.from(slots.querySelectorAll('.rev-card')).map(el => el.textContent);
      const ok = this._check(placed);
      if (ok) { this.onSuccess?.(); this.destroy(); }
      else {
        this.tries--;
        wrap.querySelector('#revTries').textContent = String(this.tries);
        if (this.tries <= 0) { this.onFail?.(); this.destroy(); }
      }
    };
  }

  _shuffle(container) {
    const cards = Array.from(container.querySelectorAll('.rev-card'));
    for (let i = cards.length - 1; i > 0; i--) {
      container.appendChild(cards[Math.floor(Math.random() * (i + 1))]);
    }
  }

  _cycle(container, dir) {
    const cards = Array.from(container.querySelectorAll('.rev-card'));
    if (!cards.length) return;
    if (dir > 0) container.appendChild(cards.shift());
    else container.insertBefore(cards.pop(), container.firstChild);
  }

  _check(placed) {
    const trimmed = placed.map(s => s.trim());
    const want = this.correct.map(s => s.trim());
    if (trimmed.length !== want.length) return false;
    for (let i = 0; i < want.length; i++) if (trimmed[i] !== want[i]) return false;
    return true;
  }

  show(v = true) { this.root.style.display = v ? 'flex' : 'none'; }

  destroy() {
    this._dead = true;
    try { this.root.removeEventListener('keydown', this._hk); } catch {}
    this.root.remove();
    window.__reverseOpen = false;
    // input/lock restoration is handled by the Level/Game flow
  }
}
