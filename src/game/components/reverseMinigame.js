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
    this.startTime = performance.now();
    this.score = 0;
    this.hintsUsed = 0;
    this.maxHints = 3;
    this.combo = 1;
    this.consecutiveCorrect = 0;
    this.powerUps = {
      autoSort: 2,
      timeFreeze: 1,
      perfectVision: 1
    };
    this.lastCorrectTime = 0;
    this.difficulty = 'normal'; // normal, hard, expert

    const style = document.createElement('style');
    style.textContent = `
      .reverse-overlay{
        position:fixed;inset:0;background:linear-gradient(135deg, rgba(8,10,14,.95), rgba(15,23,42,.9));
        display:flex;align-items:center;justify-content:center;
        z-index:9999;font-family:system-ui,-apple-system,Segoe UI,Roboto;
        pointer-events:auto;cursor:default;
        animation: fadeIn 0.4s ease-out;
        backdrop-filter: blur(10px);
      }
      
      /* Enhanced Animations */
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      @keyframes glow { 0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,.35); } 50% { box-shadow: 0 8px 24px rgba(96,165,250,.4), 0 0 20px rgba(96,165,250,.3); } }
      @keyframes correctPlace { 0% { transform: scale(1); background: #17202a; } 50% { transform: scale(1.1); background: #10b981; } 100% { transform: scale(1); background: #17202a; } }
      @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      @keyframes sparkle { 0%, 100% { opacity: 0; transform: scale(0); } 50% { opacity: 1; transform: scale(1); } }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      
      /* Particle Effects */
      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, #60a5fa, transparent);
        border-radius: 50%;
        pointer-events: none;
        animation: sparkle 0.6s ease-out;
      }
      
      .rev-card{
        background: linear-gradient(145deg, #1e293b, #0f172a);
        border: 2px solid #334155;
        border-radius: 16px;
        padding: 16px 20px;
        margin: 10px;
        cursor: grab;
        user-select: none;
        box-shadow: 0 10px 30px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1);
        font-weight: 600;
        color: #e2e8f0;
        position: relative;
        overflow: hidden;
        -webkit-user-drag: element;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: bounceIn 0.5s ease-out;
      }
      
      .rev-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        transition: left 0.5s;
      }
      
      .rev-card:hover::before {
        left: 100%;
      }
      
      .rev-card:hover { 
        transform: translateY(-4px) scale(1.02); 
        box-shadow: 0 20px 40px rgba(0,0,0,.5), 0 0 20px rgba(96,165,250,.3);
        border-color: #60a5fa;
      }
      
      .rev-card.dragging { 
        opacity: 0.8; 
        transform: rotate(8deg) scale(1.1); 
        animation: float 0.5s infinite ease-in-out;
        box-shadow: 0 25px 50px rgba(0,0,0,.6);
        z-index: 1000;
      }
      
      .rev-card.correct { 
        animation: correctPlace 0.8s ease-out;
        background: linear-gradient(145deg, #065f46, #047857);
        border-color: #10b981;
      }
      
      .rev-card.hint { 
        border: 3px solid #f59e0b; 
        animation: glow 1.5s infinite;
        background: linear-gradient(145deg, #451a03, #78350f);
      }
      
      .rev-card.perfect-match {
        background: linear-gradient(145deg, #7c2d12, #ea580c);
        border-color: #f97316;
        animation: shimmer 2s infinite;
      }
      
      .rev-wrap{
        width:min(920px,95vw);
        background: linear-gradient(145deg, #0f172a, #1e293b);
        border: 2px solid #334155;
        border-radius: 24px;
        padding: 32px 24px;
        color: #f1f5f9;
        animation: slideIn 0.6s ease-out;
        box-shadow: 0 25px 50px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.1);
        position: relative;
        overflow: hidden;
      }
      
      .rev-wrap::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      }
      
      .rev-head{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #334155;
      }
      
      .rev-title {
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(135deg, #60a5fa, #a78bfa);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 8px;
      }
      
      .rev-stats{
        display: flex;
        gap: 24px;
        margin-bottom: 16px;
        font-size: 16px;
        flex-wrap: wrap;
      }
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 12px;
        border: 1px solid #334155;
      }
      
      .rev-row{
        display: flex;
        flex-wrap: wrap;
        min-height: 120px;
        border: 2px dashed #475569;
        border-radius: 16px;
        padding: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(15, 23, 42, 0.3);
        position: relative;
      }
      
      .rev-row::before {
        content: attr(data-label);
        position: absolute;
        top: -12px;
        left: 16px;
        background: #0f172a;
        padding: 4px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        border: 1px solid #334155;
      }
      
      .rev-row.drag-over{
        outline: 3px solid #60a5fa;
        outline-offset: 2px;
        background: rgba(96,165,250,0.15);
        border-color: #60a5fa;
        transform: scale(1.02);
      }
      
      .rev-btns{
        display: flex;
        gap: 16px;
        justify-content: space-between;
        margin-top: 24px;
        flex-wrap: wrap;
      }
      
      .rev-btn{
        appearance: none;
        background: linear-gradient(145deg, #1e40af, #1d4ed8);
        color: #fff;
        border: 0;
        padding: 14px 24px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
      }
      
      .rev-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .rev-btn:hover::before {
        left: 100%;
      }
      
      .rev-btn:hover{
        background: linear-gradient(145deg, #2563eb, #1e40af);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(30, 64, 175, 0.4);
      }
      
      .rev-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
      }
      
      .rev-btn[disabled]{
        background: #475569;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        opacity: 0.6;
      }
      
      .rev-btn.hint{
        background: linear-gradient(145deg, #f59e0b, #d97706);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      }
      
      .rev-btn.hint:hover{
        background: linear-gradient(145deg, #d97706, #b45309);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
      }
      
      .rev-btn.power-up {
        background: linear-gradient(145deg, #7c3aed, #5b21b6);
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
      }
      
      .rev-btn.power-up:hover {
        background: linear-gradient(145deg, #6d28d9, #4c1d95);
        box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
      }
      
      .rev-sub{
        opacity: 0.8;
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      .score-display{
        color: #10b981;
        font-weight: bold;
        font-size: 18px;
      }
      
      .hint-count{
        color: #f59e0b;
        font-weight: bold;
        font-size: 18px;
      }
      
      .combo-display {
        color: #f97316;
        font-weight: bold;
        font-size: 18px;
        animation: pulse 0.5s infinite;
      }
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
        <div class="rev-title">🔗 Reverse Linked List Algorithm</div>
        <div class="rev-sub">Arrange the algorithm steps in the correct order to reverse a linked list. Tries left: <span id="revTries">3</span></div>
        <div class="rev-stats">
          <div class="stat-item">
            <span>🏆 Score: <span class="score-display" id="revScore">0</span></span>
          </div>
          <div class="stat-item">
            <span>💡 Hints: <span class="hint-count" id="revHints">${this.maxHints}</span></span>
          </div>
          <div class="stat-item">
            <span>⏱️ Time: <span id="revTime">0s</span></span>
          </div>
          <div class="stat-item">
            <span>🔥 Combo: <span class="combo-display" id="revCombo">x1</span></span>
          </div>
          <div class="stat-item">
            <span>⚡ Difficulty: <span id="revDifficulty">${this.difficulty.toUpperCase()}</span></span>
          </div>
        </div>
      </div>
      <button class="rev-btn" id="revClose">❌ Quit</button>
    `;

    const bank = document.createElement('div');
    bank.className = 'rev-row'; 
    bank.id = 'revBank';
    bank.setAttribute('data-label', 'Available Steps');

    const slots = document.createElement('div');
    slots.className = 'rev-row'; 
    slots.id = 'revSlots';
    slots.setAttribute('data-label', 'Algorithm Sequence');

    const buttons = document.createElement('div');
    buttons.className = 'rev-btns';
    buttons.innerHTML = `
      <button class="rev-btn hint" id="revHint" ${this.maxHints === 0 ? 'disabled' : ''}>💡 Smart Hint (${this.maxHints})</button>
      <button class="rev-btn power-up" id="revAutoSort">🔄 Auto-Sort (${this.powerUps.autoSort})</button>
      <button class="rev-btn" id="revDifficultyToggle">⚡ ${this.difficulty.toUpperCase()}</button>
      <button class="rev-btn" id="revCheck">✅ Check Algorithm</button>
    `;

    wrap.append(head, bank, slots, buttons);
    this.root.appendChild(wrap);
    (root || document.body).appendChild(this.root);

    // Flag open & free mouse (movement is halted by InputManager guard)
    window.__reverseOpen = true;
    try { document.exitPointerLock(); } catch {}
    this.onOpen && this.onOpen();
    setTimeout(() => { try { this.root.focus(); } catch {} }, 0);

    // Algorithm variations based on difficulty
    this.algorithms = {
      normal: [
        '// Initialize pointers',
        'prev = null',
        'curr = head',
        '// Traverse the list',
        'while (curr != null)',
        '  // Store next node',
        '  next = curr.next',
        '  // Reverse the link',
        '  curr.next = prev',
        '  // Move pointers forward',
        '  prev = curr',
        '  curr = next',
        '// Update head pointer',
        'head = prev'
      ],
      hard: [
        '// Initialize pointers for reversal',
        'prev = null',
        'curr = head',
        'temp = null',
        '// Iterate through the list',
        'while (curr != null)',
        '  // Save the next node',
        '  temp = curr.next',
        '  // Reverse the current link',
        '  curr.next = prev',
        '  // Move to next node',
        '  prev = curr',
        '  curr = temp',
        '// Return new head',
        'return prev'
      ],
      expert: [
        '// Recursive approach setup',
        'if (head == null || head.next == null)',
        '  return head',
        '// Recursive call',
        'newHead = reverseList(head.next)',
        '// Reverse current link',
        'head.next.next = head',
        'head.next = null',
        '// Return new head',
        'return newHead'
      ]
    };
    
    // Select algorithm based on difficulty
    this.correct = this.algorithms[this.difficulty] || this.algorithms.normal;
    const shuffled = [...this.correct].sort(() => Math.random() - 0.5);

    // cards
    for (const s of shuffled) {
      const el = document.createElement('div');
      el.className = 'rev-card';
      el.draggable = true;
      el.textContent = s;
      el.dataset.step = s;

      el.addEventListener('dragstart', (e) => {
        try {
          e.dataTransfer.clearData();
          e.dataTransfer.setData('text/plain', s); // Firefox needs a payload
          e.dataTransfer.effectAllowed = 'move';
        } catch {}
        el.classList.add('dragging');
        this._dragEl = el;
        this._playSound('drag');
      });
      el.addEventListener('dragend', () => {
        this._dragEl?.classList.remove('dragging');
        this._dragEl = null;
      });

      // optional: double-click toggles row as a fallback
      el.addEventListener('dblclick', () => {
        const parent = el.parentElement;
        (parent === bank ? slots : bank).appendChild(el);
        this._playSound('click');
      });

      bank.appendChild(el);
    }

    // Start timer
    this._updateTimer();

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
    
    wrap.querySelector('#revHint').onclick = () => {
      this._useSmartHint();
    };
    
    wrap.querySelector('#revAutoSort').onclick = () => {
      this._useAutoSort();
    };
    
    wrap.querySelector('#revDifficultyToggle').onclick = () => {
      this._toggleDifficulty();
    };
    
    wrap.querySelector('#revCheck').onclick = () => {
      const placed = Array.from(slots.querySelectorAll('.rev-card')).map(el => el.textContent);
      const ok = this._check(placed);
      if (ok) { 
        this._calculateScore();
        this._playSound('success');
        this._createSuccessEffects();
        this.onSuccess?.(); 
        this.destroy(); 
      }
      else {
        this.tries--;
        this.combo = 1;
        this.consecutiveCorrect = 0;
        wrap.querySelector('#revTries').textContent = String(this.tries);
        wrap.querySelector('#revCombo').textContent = `x${this.combo}`;
        this._playSound('error');
        this._createErrorEffects();
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

  _updateTimer() {
    if (this._dead) return;
    const elapsed = Math.floor((performance.now() - this.startTime) / 1000);
    const timeEl = this.root.querySelector('#revTime');
    if (timeEl) timeEl.textContent = `${elapsed}s`;
    setTimeout(() => this._updateTimer(), 1000);
  }

  _playSound(type) {
    // Enhanced sound effects using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      switch(type) {
        case 'drag':
          this._playTone(audioContext, 200, 0.08, 0.1, 'sine');
          break;
        case 'click':
          this._playTone(audioContext, 400, 0.06, 0.05, 'square');
          break;
        case 'success':
          this._playChord(audioContext, [523, 659, 784], 0.15, 0.4);
          break;
        case 'error':
          this._playTone(audioContext, 150, 0.1, 0.3, 'sawtooth');
          break;
        case 'powerup':
          this._playAscending(audioContext, [440, 554, 659, 880], 0.1, 0.3);
          break;
        case 'combo':
          this._playChord(audioContext, [659, 784, 988], 0.12, 0.25);
          break;
        case 'hint':
          this._playTone(audioContext, 800, 0.08, 0.2, 'triangle');
          break;
      }
    } catch (e) {
      // Fallback: no sound if Web Audio API not available
    }
  }

  _playTone(audioContext, frequency, volume, duration, waveType = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  _playChord(audioContext, frequencies, volume, duration) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this._playTone(audioContext, freq, volume / frequencies.length, duration);
      }, index * 50);
    });
  }

  _playAscending(audioContext, frequencies, volume, duration) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this._playTone(audioContext, freq, volume, duration / frequencies.length);
      }, index * 80);
    });
  }


  _calculateScore() {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const timeBonus = Math.max(0, 300 - elapsed) * 15; // Bonus for speed
    const hintPenalty = this.hintsUsed * 30;
    const tryBonus = (4 - this.tries) * 150; // Bonus for fewer tries
    const comboBonus = (this.combo - 1) * 200; // Combo multiplier
    
    this.score = Math.max(0, Math.floor(1000 + timeBonus + tryBonus + comboBonus - hintPenalty));
    
    // Show score animation
    const scoreEl = this.root.querySelector('#revScore');
    if (scoreEl) {
      scoreEl.textContent = this.score;
      scoreEl.style.animation = 'pulse 0.5s ease-out';
    }
  }

  _useSmartHint() {
    if (this.hintsUsed >= this.maxHints) return;
    
    const slots = this.root.querySelector('#revSlots');
    const bank = this.root.querySelector('#revBank');
    const placed = Array.from(slots.querySelectorAll('.rev-card')).map(el => el.textContent.trim());
    
    // Find the next correct step
    let nextCorrectStep = null;
    let nextCorrectIndex = -1;
    for (let i = 0; i < this.correct.length; i++) {
      const correctStep = this.correct[i].trim();
      if (!placed.includes(correctStep)) {
        nextCorrectStep = correctStep;
        nextCorrectIndex = i;
        break;
      }
    }
    
    if (nextCorrectStep) {
      // Find the card in bank and highlight it
      const cards = Array.from(bank.querySelectorAll('.rev-card'));
      const targetCard = cards.find(card => card.textContent.trim() === nextCorrectStep);
      
      if (targetCard) {
        targetCard.classList.add('hint');
        
        // Show a smart hint message
        this._showHintMessage(`Hint: The next step should be step ${nextCorrectIndex + 1} of ${this.correct.length}`);
        
        setTimeout(() => {
          targetCard.classList.remove('hint');
        }, 4000);
        
        this.hintsUsed++;
        this._updateHintDisplay();
        this._playSound('hint');
      }
    }
  }

  _useAutoSort() {
    if (this.powerUps.autoSort <= 0) return;
    
    const slots = this.root.querySelector('#revSlots');
    const bank = this.root.querySelector('#revBank');
    const placed = Array.from(slots.querySelectorAll('.rev-card')).map(el => el.textContent.trim());
    
    // Find the next correct step and auto-place it
    let nextCorrectStep = null;
    for (let i = 0; i < this.correct.length; i++) {
      const correctStep = this.correct[i].trim();
      if (!placed.includes(correctStep)) {
        nextCorrectStep = correctStep;
        break;
      }
    }
    
    if (nextCorrectStep) {
      const cards = Array.from(bank.querySelectorAll('.rev-card'));
      const targetCard = cards.find(card => card.textContent.trim() === nextCorrectStep);
      
      if (targetCard) {
        slots.appendChild(targetCard);
        this.powerUps.autoSort--;
        this._updatePowerUpDisplay();
        this._playSound('powerup');
        this._createParticleEffect(targetCard);
      }
    }
  }

  _createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 600);
    }
  }

  _createSuccessEffects() {
    const slots = this.root.querySelector('#revSlots');
    const cards = Array.from(slots.querySelectorAll('.rev-card'));
    
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('perfect-match');
        this._createParticleEffect(card);
      }, index * 100);
    });
  }

  _createErrorEffects() {
    const slots = this.root.querySelector('#revSlots');
    const cards = Array.from(slots.querySelectorAll('.rev-card'));
    
    cards.forEach(card => {
      card.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        card.style.animation = '';
      }, 500);
    });
  }

  _showHintMessage(message) {
    const existingMessage = this.root.querySelector('.hint-message');
    if (existingMessage) existingMessage.remove();
    
    const messageEl = document.createElement('div');
    messageEl.className = 'hint-message';
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(245, 158, 11, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    
    this.root.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  _updateHintDisplay() {
    const hintEl = this.root.querySelector('#revHints');
    const hintBtn = this.root.querySelector('#revHint');
    if (hintEl) hintEl.textContent = this.maxHints - this.hintsUsed;
    if (hintBtn) {
      hintBtn.textContent = `💡 Smart Hint (${this.maxHints - this.hintsUsed})`;
      if (this.hintsUsed >= this.maxHints) {
        hintBtn.disabled = true;
      }
    }
  }

  _updatePowerUpDisplay() {
    const autoSortBtn = this.root.querySelector('#revAutoSort');
    if (autoSortBtn) {
      autoSortBtn.textContent = `🔄 Auto-Sort (${this.powerUps.autoSort})`;
      if (this.powerUps.autoSort <= 0) {
        autoSortBtn.disabled = true;
      }
    }
  }

  _toggleDifficulty() {
    const difficulties = ['normal', 'hard', 'expert'];
    const currentIndex = difficulties.indexOf(this.difficulty);
    const nextIndex = (currentIndex + 1) % difficulties.length;
    this.difficulty = difficulties[nextIndex];
    
    // Update the algorithm
    this.correct = this.algorithms[this.difficulty];
    
    // Update UI
    const difficultyEl = this.root.querySelector('#revDifficulty');
    const toggleBtn = this.root.querySelector('#revDifficultyToggle');
    if (difficultyEl) difficultyEl.textContent = this.difficulty.toUpperCase();
    if (toggleBtn) toggleBtn.textContent = `⚡ ${this.difficulty.toUpperCase()}`;
    
    // Reset the game with new algorithm
    this._resetGameWithNewAlgorithm();
    this._playSound('click');
  }

  _resetGameWithNewAlgorithm() {
    const bank = this.root.querySelector('#revBank');
    const slots = this.root.querySelector('#revSlots');
    
    // Move all cards back to bank
    
    const allCards = Array.from(slots.querySelectorAll('.rev-card'));
    allCards.forEach(card => bank.appendChild(card));
    
    // Shuffle the new algorithm
    const shuffled = [...this.correct].sort(() => Math.random() - 0.5);
    
    // Reorder cards in bank
    shuffled.forEach(step => {
      const card = Array.from(bank.querySelectorAll('.rev-card'))
        .find(el => el.textContent.trim() === step);
      if (card) bank.appendChild(card);
    });
    
    this._showHintMessage(`Switched to ${this.difficulty.toUpperCase()} difficulty!`);
  }
}
