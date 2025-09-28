import * as THREE from 'three';

/**
 * CinematicsManager
 * - Plays dialogue & cutscenes using the game's upgraded FreeCamera.
 * - Freezes gameplay during cinematics (no pause menu), pauses the timer, disables input.
 * - Falls back to internal lerp tweening if FreeCamera cinematic API isn't provided.
 *
 * Expects Game to pass controls:
 *   {
 *     freeze: (on:boolean) => void,
 *     switchToFreeCamera: (player) => restoreFn,
 *     getActiveCamera: () => THREE.Camera,
 *     getEnemies: () => Enemy[],
 *     freeCamAPI: { flyTo, panTilt, orbitAround, playSequence }, // optional but preferred
 *     context: {
 *       nodePoints: Array<[x,y,z]>,
 *       firstBugSpawn: [x,y,z]
 *     },
 *     spawnFirstBug: () => Enemy | null
 *   }
 */
export class CinematicsManager {
  constructor(scene) {
    this.scene = scene;
    this.cinematics = {};
  }

  isPlaying = false;
  currentCinematic = null;

  dialogueUI = null;
  _ui = null;
  _controls = null;
  _restoreCam = null;
  _hiddenUIKeys = [];

  loadCinematics(cinematicsData) {
    this.cinematics = cinematicsData || {};
    console.log('[Cinematics] loaded keys:', Object.keys(this.cinematics));
  }

  async playCinematic(triggerName, camera = null, player = null, ui = null, controls = null) {
    const data = this.cinematics?.[triggerName];
    if (!data || this.isPlaying) return;

    this.isPlaying = true;
    this.currentCinematic = triggerName;
    this._ui = ui || null;
    this._controls = controls || {};

    // Freeze world (no pause UI) & pause timer
    try { this._controls.freeze?.(true); } catch {}
    this._pauseTimer();

    // Switch to free camera for storytelling; keep a restore function
    this._restoreCam = this._controls.switchToFreeCamera?.(player) || null;

    // Optionally hide HUD-ish UI during cinematics
    this._maybeHideUI(data);

    console.log('[Cinematics] START', triggerName);

    try {
      if (data.type === 'dialogue') {
        await this._playDialogue(data);
      } else {
        await this._playCutscene(data, camera, player);
      }

      await this._runAfterHook(data?.after);
    } catch (err) {
      console.error('[Cinematics] error:', err);
    } finally {
      // restore UI shown/hidden state
      this._restoreHiddenUI();
      // hide dialogue if still present
      this._hideDialogue();

      // restore camera if we switched it
      try { if (typeof this._restoreCam === 'function') this._restoreCam(); } catch {}

      // thaw & resume timer
      try { this._controls.freeze?.(false); } catch {}
      this._resumeTimer();

      // NEW: keep world map closed after cinematics and re-lock pointer
      try { this._ui?.get?.('worldmap')?.show?.(false); } catch {}
      try {
        const cam = this._controls?.getActiveCamera?.();
        if (cam && document.pointerLockElement !== document.body) {
          document.body.requestPointerLock();
        }
      } catch {}

      // cleanup
      this._restoreCam = null;
      this._ui = null;
      this._controls = null;
      this.currentCinematic = null;
      this.isPlaying = false;

      console.log('[Cinematics] END', triggerName);
    }
  }

  /* -------------------- Dialogue -------------------- */

  async _playDialogue(dialogueData) {
    const lines = dialogueData.lines || [];
    if (dialogueData.focus) {
      await this._flyTo(dialogueData.focus);
      if (dialogueData.focus.linger) await this._wait(dialogueData.focus.linger);
    }

    for (const line of lines) {
      await this._showDialogueLine(line, dialogueData.character);
      const pan = line.pan ?? { dYaw: 0.15, dPitch: 0.0, duration: Math.min(900, (line.duration || 2000) * 0.6) };
      const waitMs = line.duration || 2200;
      await Promise.race([
        (async () => { if (pan && (pan.dYaw || pan.dPitch)) await this._panTilt(pan); })(),
        this._wait(waitMs)
      ]);
    }

    this._hideDialogue();
  }

  /* -------------------- Cutscenes -------------------- */

  async _playCutscene(cutsceneData, camera, player) {
    if (Array.isArray(cutsceneData.sequence) && cutsceneData.sequence.length) {
      await this._playSequence(cutsceneData.sequence);
    } else if (Array.isArray(cutsceneData.cameraPath) && cutsceneData.cameraPath.length) {
      await this._playCameraPath(cutsceneData.cameraPath, this._controls?.getActiveCamera?.() || camera);
    }

    if (cutsceneData.dialogue && Array.isArray(cutsceneData.dialogue)) {
      for (const line of cutsceneData.dialogue) {
        await this._showDialogueLine(line, line.character);
        await this._wait(line.duration || 2000);
      }
      this._hideDialogue();
    }
  }

  async _playSequence(shots) {
    const expanded = [];
    for (const s of shots) {
      if (s?.useNodeTour) expanded.push(...this._expandNodeTour(s));
      else expanded.push(s);
    }

    const fc = this._controls?.freeCamAPI;
    if (fc?.playSequence) {
      await fc.playSequence(expanded);
      return;
    }

    for (const s of expanded) {
      if (!s) continue;
      if (s.pan) await this._panTilt(s.pan);
      else if (s.orbit) await this._orbitAround(s.orbit);
      else await this._flyTo(s);
      if (s.linger) await this._wait(s.linger);
    }
  }

  _expandNodeTour(opts) {
    const pts = this._controls?.context?.nodePoints ?? [];
    if (!Array.isArray(pts) || pts.length === 0) return [];

    const h = opts.tourHeight ?? 5.5;
    const r = opts.radius ?? 4.5;
    const perNodeMs = Math.max(200, opts.perNodeMs ?? 700);
    const gapMs = Math.max(0, opts.gapMs ?? 120);

    const shots = [];
    for (const p of pts) {
      const [x, y, z] = p;
      shots.push({
        position: [x + r, y + h, z + r],
        lookAt: [x, y, z],
        duration: perNodeMs,
        linger: gapMs
      });
    }
    return shots;
  }

  /* -------------------- FreeCamera Bridges -------------------- */

  async _flyTo(opts) {
    const fc = this._controls?.freeCamAPI;
    if (fc?.flyTo) {
      await fc.flyTo(opts);
    } else {
      const cam = this._controls?.getActiveCamera?.();
      if (cam) await this._tweenFlyTo(cam, opts);
    }
  }

  async _panTilt(opts) {
    const fc = this._controls?.freeCamAPI;
    if (fc?.panTilt) {
      await fc.panTilt(opts);
    } else {
      const cam = this._controls?.getActiveCamera?.();
      if (cam) await this._tweenPanTilt(cam, opts);
    }
  }

  async _orbitAround(opts) {
    const fc = this._controls?.freeCamAPI;
    if (fc?.orbitAround) {
      await fc.orbitAround(opts);
    } else {
      const target = new THREE.Vector3(...(opts.target || [0, 0, 0]));
      const startA = THREE.MathUtils.degToRad(opts.startAngleDeg ?? 180);
      const endA = THREE.MathUtils.degToRad(opts.endAngleDeg ?? 360);
      const steps = 24;
      const duration = opts.duration ?? 1500;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startA + (endA - startA) * t;
        const x = target.x + Math.sin(a) * (opts.radius ?? 6);
        const z = target.z + Math.cos(a) * (opts.radius ?? 6);
        const y = target.y + (opts.height ?? 3);
        await this._flyTo({ position: [x, y, z], lookAt: [target.x, target.y, target.z], duration: duration / steps, ease: opts.ease });
      }
    }
  }

  /* -------------------- Fallback tweeners (no FreeCamera API) -------------------- */

  async _playCameraPath(cameraPath, camera) {
    for (const keyframe of cameraPath) {
      const startPos = camera.position.clone();
      const targetPos = new THREE.Vector3(...keyframe.position);
      const duration = keyframe.duration || 2000;
      const lookAt = keyframe.lookAt ? new THREE.Vector3(...keyframe.lookAt) : null;

      await this._tween(duration, (t) => {
        camera.position.lerpVectors(startPos, targetPos, t);
        if (lookAt) camera.lookAt(lookAt);
      });
    }
  }

  async _tweenFlyTo(camera, { position, lookAt, duration = 1200 }) {
    const startPos = camera.position.clone();
    const endPos = position ? new THREE.Vector3(...position) : startPos.clone();
    const startTarget = new THREE.Vector3().copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
    const endTarget = lookAt ? new THREE.Vector3(...lookAt) : startTarget.clone();

    await this._tween(duration, (t) => {
      camera.position.lerpVectors(startPos, endPos, t);
      const target = new THREE.Vector3().lerpVectors(startTarget, endTarget, t);
      camera.lookAt(target);
    });
  }

  async _tweenPanTilt(camera, { dYaw = 0, dPitch = 0, duration = 800 }) {
    const dir0 = camera.getWorldDirection(new THREE.Vector3()).normalize();
    const { yaw0, pitch0 } = this._yawPitchFromDir(dir0);
    await this._tween(duration, (t) => {
      const yaw = yaw0 + dYaw * t;
      const pitch = THREE.MathUtils.clamp(pitch0 + dPitch * t, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
      const dir = this._dirFromYawPitch(yaw, pitch);
      const target = new THREE.Vector3().copy(camera.position).add(dir);
      camera.lookAt(target);
    });
  }

  _dirFromYawPitch(yaw, pitch) {
    return new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    ).normalize();
  }

  _yawPitchFromDir(dir) {
    const d = dir.clone().normalize();
    const pitch0 = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
    const yaw0 = Math.atan2(d.x, d.z);
    return { yaw0, pitch0 };
  }

  _tween(duration, step) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const dur = Math.max(1, duration | 0);
      const tick = () => {
        const n = THREE.MathUtils.clamp((performance.now() - t0) / dur, 0, 1);
        try { step(n); } catch {}
        if (n < 1) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
  }

  /* -------------------- Dialogue UI -------------------- */

  _showDialogueLine(line, character) {
    if (!this.dialogueUI) this.dialogueUI = this._createDialogueUI();

    const characterElement = this.dialogueUI.querySelector('.dialogue-character');
    const textElement = this.dialogueUI.querySelector('.dialogue-text');

    if (characterElement && (line.character || character)) {
      characterElement.textContent = (line.character || character || '').toUpperCase();
    }
    if (textElement) textElement.textContent = line.text || '';

    this.dialogueUI.style.display = 'block';
  }

  _hideDialogue() {
    if (this.dialogueUI) this.dialogueUI.style.display = 'none';
  }

  _createDialogueUI() {
    const dialogue = document.createElement('div');
    dialogue.className = 'cinematic-dialogue';
    dialogue.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.82);
      color: white;
      padding: 20px 24px;
      border-radius: 12px;
      max-width: 760px;
      text-align: center;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      z-index: 1000;
      display: none;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 18px 40px rgba(0,0,0,0.45);
      pointer-events: none;
    `;
    const character = document.createElement('div');
    character.className = 'dialogue-character';
    character.style.cssText = `
      font-size: 12px;
      letter-spacing: 2px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #ffd658;
      opacity: 0.95;
    `;
    const text = document.createElement('div');
    text.className = 'dialogue-text';
    text.style.cssText = `font-size: 18px; line-height: 1.45;`;

    dialogue.appendChild(character);
    dialogue.appendChild(text);
    document.body.appendChild(dialogue);
    return dialogue;
  }

  /* -------------------- Timer & UI helpers -------------------- */

  _pauseTimer() {
    const timer = this._ui?.get?.('timer');
    try { timer?.pause?.(); } catch {}
  }

  _resumeTimer() {
    const timer = this._ui?.get?.('timer');
    try { timer?.start?.(); } catch {}
  }

  _maybeHideUI(data) {
    if (data?.keepUI) return;
    const toHide = ['hud', 'minimap', 'objectives', 'worldmap'];
    this._hiddenUIKeys = [];
    for (const key of toHide) {
      const c = this._ui?.get?.(key);
      if (!c) continue;
      if (typeof c.show === 'function') {
        c.show(false);
        this._hiddenUIKeys.push(key);
      } else if (c.root?.style) {
        c.root.style.display = 'none';
        this._hiddenUIKeys.push(key);
      }
    }
  }

  _restoreHiddenUI() {
    for (const key of this._hiddenUIKeys) {
      const c = this._ui?.get?.(key);
      if (!c) continue;
      if (typeof c.show === 'function') c.show(true);
      else if (c.root?.style) c.root.style.display = '';
    }
    this._hiddenUIKeys = [];
  }

  async _runAfterHook(after) {
    if (!after) return;
    if (after === 'spawnFirstBug') {
      this._controls?.spawnFirstBug?.();
      // Optional quick pan to the spawn point
      const p = this._controls?.context?.firstBugSpawn || [0, 3, 0];
      await this._flyTo({ position: [p[0] + 4, p[1] + 4, p[2] + 4], lookAt: p, duration: 700 });
      await this._wait(200);
    }
  }

  _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  dispose() {
    if (this.dialogueUI && this.dialogueUI.parentNode) {
      this.dialogueUI.parentNode.removeChild(this.dialogueUI);
    }
    this.isPlaying = false;
    this.currentCinematic = null;
    this._ui = null;
    this._controls = null;
    this._hiddenUIKeys = [];
  }
}
