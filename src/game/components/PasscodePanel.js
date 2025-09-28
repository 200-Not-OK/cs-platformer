export class PasscodePanel {
  constructor({ code, onSubmit, onCancel } = {}) {
    this.code = String(code || '').toUpperCase();
    this.onSubmit = onSubmit; this.onCancel = onCancel;

    // disable input + release pointer lock for UI
    try { document.exitPointerLock(); } catch {}
    try { window.__gameInputDisable?.(); } catch {}

    const style = document.createElement('style');
    style.textContent = `
      .pc-overlay{position:fixed;inset:0;background:rgba(8,10,14,.86);display:flex;align-items:center;justify-content:center;z-index:10000;font-family:system-ui,-apple-system,Segoe UI,Roboto}
      .pc-wrap{width:min(420px,92vw);background:linear-gradient(180deg,#0b1017,#0f1723);border:1px solid #2b3a4a;border-radius:14px;padding:18px;color:#eaf2ff;box-shadow:0 20px 60px rgba(0,0,0,.4)}
      .pc-title{font-weight:800;font-size:18px;margin-bottom:10px}
      .pc-input{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
      .pc-char{width:40px;height:48px;border-radius:10px;background:#16202c;border:1px solid #2b3a4a;display:grid;place-items:center;font-weight:900;font-size:18px;letter-spacing:2px}
      .pc-char.active{outline:2px solid #60a5fa}
      .pc-kb{display:grid;grid-template-columns:repeat(10,1fr);gap:6px}
      .pc-key{padding:10px;border-radius:8px;background:#1f2a38;border:1px solid #2b3a4a;text-align:center;font-weight:700;cursor:pointer;user-select:none}
      .pc-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}
      .pc-btn{background:#1f6feb;color:#fff;border:0;border-radius:10px;padding:10px 14px;font-weight:800;cursor:pointer}
      .pc-btn.ghost{background:#2b3a4a}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div'); overlay.className = 'pc-overlay';
    const wrap = document.createElement('div'); wrap.className = 'pc-wrap';
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);
    this.root = overlay;

    wrap.innerHTML = `
      <div class="pc-title">ENTER PASSCODE</div>
      <div class="pc-input" id="pcSlots"></div>
      <div class="pc-kb" id="pcKB"></div>
      <div class="pc-actions">
        <button class="pc-btn ghost" id="pcCancel">Cancel</button>
        <button class="pc-btn" id="pcSubmit">Unlock</button>
      </div>
    `;

    // build slots
    this.slots = [];
    const slotsEl = wrap.querySelector('#pcSlots');
    for (let i = 0; i < this.code.length; i++) {
      const d = document.createElement('div');
      d.className = 'pc-char' + (i === 0 ? ' active' : '');
      d.textContent = '•';
      slotsEl.appendChild(d);
      this.slots.push(d);
    }
    this.idx = 0;

    // build keyboard
    const kb = wrap.querySelector('#pcKB');
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    [...keys, '←', 'CLR'].forEach(k => {
      const b = document.createElement('div'); b.className = 'pc-key'; b.textContent = k; kb.appendChild(b);
      b.onclick = () => this._press(k);
    });

    // physical keyboard
    this._onKey = (e) => {
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) this._press(k);
      else if (e.key === 'Backspace') this._press('←');
      else if (e.key === 'Enter') this._submit();
      else if (e.key === 'Escape') this._cancel();
    };
    window.addEventListener('keydown', this._onKey);

    wrap.querySelector('#pcSubmit').onclick = () => this._submit();
    wrap.querySelector('#pcCancel').onclick = () => this._cancel();
  }

  _press(k) {
    if (k === '←') { // backspace
      if (this.idx > 0) this._setIdx(this.idx - 1);
      this.slots[this.idx].textContent = '•';
      return;
    }
    if (k === 'CLR') {
      for (const s of this.slots) s.textContent = '•';
      this._setIdx(0);
      return;
    }
    if (!/^[A-Z]$/.test(k)) return;
    this.slots[this.idx].textContent = k;
    if (this.idx < this.slots.length - 1) this._setIdx(this.idx + 1);
  }

  _setIdx(i) {
    this.slots[this.idx]?.classList.remove('active');
    this.idx = Math.max(0, Math.min(this.slots.length - 1, i));
    this.slots[this.idx]?.classList.add('active');
  }

  _submit() {
    const attempt = this.slots.map(s => s.textContent).join('');
    this.onSubmit?.(attempt);
    this.destroy();
  }
  _cancel() {
    this.onCancel?.();
    this.destroy();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey);
    this.root.remove();
    // re-enable input & allow pointer lock again
    try { window.__gameInputEnable?.(); } catch {}
    setTimeout(() => { try { document.body.requestPointerLock(); } catch {} }, 0);
  }
}
