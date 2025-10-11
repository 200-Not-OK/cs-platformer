// src/game/cinematicsManager.js
import * as THREE from 'three';
import { CameraDirector } from './cameraDirector.js';

export class CinematicsManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.cinematics = {};
    this.isPlaying = false;
    this.current = null;
    this.skipRequested = false;

    this.dialogueUI = null; // caption box
    this._ensureCaptionUI();

    this.director = new CameraDirector(game);

    // timers we must clear if cinematic ends early
    this._timers = [];
    this._captionTimer = null;

    // Skip cinematic with K key
    this._skipKeyHandler = (e) => {
      if (e.code === 'KeyK' && this.isPlaying) {
        console.log('🎬 Skipping cinematic...');
        this.skipRequested = true;
      }
    };
    window.addEventListener('keydown', this._skipKeyHandler);
  }

  dispose() {
    this._clearTimers();
    this._hideCaption(true);
    this.dialogueUI = null;
    if (this._skipKeyHandler) {
      window.removeEventListener('keydown', this._skipKeyHandler);
    }
  }

  loadCinematics(cinematicsData) {
    this.cinematics = cinematicsData || {};
    // console.log('Loaded cinematics keys:', Object.keys(this.cinematics));
  }

  async playCinematic(key) {
    if (this.isPlaying) return;
    const script = this.cinematics[key];
    if (!script) return;

    this.isPlaying = true;
    this.current = key;
    this.skipRequested = false;

    // lock controls
    this.game.cinematicLock = true;
    if (this.game.input?.setEnabled) this.game.input.setEnabled(false);

    try {
      await this._runSequence(Array.isArray(script) ? script : script.sequence || []);
    } catch (e) {
      console.error('[Cinematics] error:', e);
    } finally {
      // cleanup
      this._clearTimers();
      await this._hideCaption(true);
      await this.director.release();

      // restore controls + 3rd person
      if (this.game.thirdCameraObject) this.game.activeCamera = this.game.thirdCameraObject;
      if (this.game.input) this.game.input.alwaysTrackMouse = true;
      this.game.cinematicLock = false;
      if (this.game.input?.setEnabled) this.game.input.setEnabled(true);

      this.isPlaying = false;
      this.current = null;
      this.skipRequested = false;
    }
  }

  // ----------------- SEQUENCE RUNNER -----------------
  async _runSequence(steps) {
    for (const step of steps) {
      // Check if skip was requested
      if (this.skipRequested) {
        console.log('🎬 Cinematic skipped by user');
        break;
      }

      const { type } = step;

      if (type === 'takeCamera') {
        this.director.takeControl();
      }
      else if (type === 'cut') {
        const s = { ...step };
        if (s.position && !Array.isArray(s.position)) {
          const p = this._resolvePoint(s.position);
          s.position = [p.x, p.y, p.z];
        }
        if (s.lookAt && !Array.isArray(s.lookAt)) {
          const l = this._resolvePoint(s.lookAt);
          s.lookAt = [l.x, l.y, l.z];
        }
        this.director.cutTo(s);
      }
      else if (type === 'move') {
        const s = { ...step };
        if (s.position && !Array.isArray(s.position)) {
          const p = this._resolvePoint(s.position);
          s.position = [p.x, p.y, p.z];
        }
        if (s.lookAt && !Array.isArray(s.lookAt)) {
          const l = this._resolvePoint(s.lookAt);
          s.lookAt = [l.x, l.y, l.z];
        }
        await this.director.moveTo(s);
      }
      else if (type === 'orbit') {
        const s = { ...step };
        if (s.center === 'player') {
          const p = this._playerPos();
          s.center = [p.x, p.y, p.z];
        } else if (s.center && !Array.isArray(s.center)) {
          const c = this._resolvePoint(s.center);
          s.center = [c.x, c.y, c.z];
        }
        await this.director.orbitAround(s);
      }
      else if (type === 'focus') {
        const targetPos = this._resolvePoint(step.target);
        await this.director.focusOn(targetPos, step);
      }
      else if (type === 'zoom') {
        await this.director.zoomTo(step);
      }
      else if (type === 'shake') {
        this.director.shake(step);
      }
      else if (type === 'fadeOut') {
        await this.director.fadeOut({ ms: step.ms ?? 600 });
      }
      else if (type === 'fadeIn') {
        await this.director.fadeIn({ ms: step.ms ?? 600 });
      }
      else if (type === 'wait') {
        await this._wait(step.ms ?? 800);
      }
      else if (type === 'rumble') {
        if (this.game.soundManager?.sfx?.[step.sfx || 'rumbling']) {
          this.game.soundManager.playSFX(step.sfx || 'rumbling', step.volume ?? 0.8);
        }
        this.director.shake({ seconds: step.seconds ?? 1.0, magnitude: step.magnitude ?? 0.15 });
      }
      else if (type === 'caption') {
        await this._showCaption(step.text, step.ms ?? 2500);
      }
      else if (type === 'playVO') {
        // Extended: supports { segments:[{at, text, ms}], concurrent:[steps...], block:true }
        await this._playVO(step);
      }
      else if (type === 'releaseCamera') {
        await this.director.release();
      }
      // add more primitives here if needed
    }
  }

  // ----------------- VO + CAPTIONS (EXTENDED) -----------------
  async _playVO(step) {
    const voName = step.vo;
    const fallbackMs = step.fallbackMs ?? 6000;
    const block = step.block !== false; // default true (block until VO ends)

    // Kick any concurrent steps (camera moves etc.) WITHOUT awaiting them
    if (Array.isArray(step.concurrent) && step.concurrent.length) {
      this._runSequence(step.concurrent).catch(err => console.warn('[Cinematics] concurrent error:', err));
    }

    const durMs = await this._playVoiceoverAndGetMs(voName, fallbackMs);

    // schedule caption segments relative to VO start
    if (Array.isArray(step.segments)) {
      for (const seg of step.segments) {
        const at = Math.max(0, seg.at ?? 0);
        const ms = Math.max(200, seg.ms ?? 1200);
        const text = seg.text ?? '';
        this._schedule(() => this._showCaption(text, ms), at);
      }
    } else if (step.text) {
      // classic single caption that lasts for whole VO
      await this._showCaption(step.text, durMs);
    }

    if (block) {
      await this._wait(durMs);
    }
  }

  async _playVoiceoverAndGetMs(voName, fallbackMs) {
    const sm = this.game.soundManager;
    // If already loaded, we can read duration from the WebAudio buffer
    if (sm?.sfx?.[voName]?.buffer) {
      const dur = Math.max(0.5, sm.sfx[voName].buffer.duration) * 1000;
      sm.playSFX(voName, 1.0);
      return dur;
    }
    // Fallback: still trigger Game.playVoiceover (keeps your existing UI/animation if you had one)
    if (this.game.playVoiceover) this.game.playVoiceover(voName, fallbackMs);
    return fallbackMs;
  }

  // ----------------- CAPTION UI -----------------
  _ensureCaptionUI() {
    if (this.dialogueUI) return;
    const el = document.createElement('div');
    el.className = 'cinematic-caption';
    el.style.cssText = `
      position:fixed; left:50%; bottom:8vh; transform:translateX(-50%);
      max-width: 70vw; background:rgba(0,0,0,0.75); color:#fff;
      padding:16px 22px; border-radius:12px; font: 600 18px/1.45 system-ui,Segoe UI,Arial;
      letter-spacing:.2px; text-align:center; z-index:9999; display:none; opacity:0;
      box-shadow:0 10px 30px rgba(0,0,0,.35);
      transition: opacity 200ms ease;
    `;
    const name = document.createElement('div');
    name.className = 'caption-name';
    name.style.cssText = 'font-size:12px; opacity:.9; color:#ffdd44; margin-bottom:6px; text-transform:uppercase;';
    name.textContent = 'Pravesh';

    const text = document.createElement('div');
    text.className = 'caption-text';

    el.appendChild(name); el.appendChild(text);
    document.body.appendChild(el);
    this.dialogueUI = el;
  }

  async _showCaption(text, ms) {
    if (!this.dialogueUI) this._ensureCaptionUI();

    // cancel any pending auto-hide so a new caption isn't hidden early
    if (this._captionTimer) {
      clearTimeout(this._captionTimer);
      this._captionTimer = null;
    }

    const t = this.dialogueUI.querySelector('.caption-text');
    t.textContent = text;
    this.dialogueUI.style.display = 'block';
    // force repaint before opacity change
    this.dialogueUI.style.opacity = '0'; void this.dialogueUI.offsetHeight;
    this.dialogueUI.style.opacity = '1';

    // schedule auto-hide for this specific caption
    this._captionTimer = this._schedule(() => this._hideCaption(), ms);
  }

  async _hideCaption(immediate = false) {
    if (!this.dialogueUI || this.dialogueUI.style.display === 'none') return;
    if (this._captionTimer) {
      clearTimeout(this._captionTimer);
      this._captionTimer = null;
    }
    if (immediate) {
      this.dialogueUI.style.opacity = '0';
      this.dialogueUI.style.display = 'none';
      return;
    }
    return new Promise(res => {
      this.dialogueUI.style.opacity = '0';
      setTimeout(() => { if (this.dialogueUI) this.dialogueUI.style.display = 'none'; res(); }, 180);
    });
  }

  // ----------------- UTIL -----------------
  _playerPos() {
    if (this.game?.player?.getPosition) return this.game.player.getPosition().clone();
    if (this.game?.player?.mesh) return this.game.player.mesh.position.clone();
    return new THREE.Vector3(0,0,0);
  }

  _wait(ms) {
    return new Promise(r => this._schedule(r, ms));
  }

  _schedule(fn, delay) {
    const id = setTimeout(() => {
      // remove from list when fired
      this._timers = this._timers.filter(x => x !== id);
      try { fn(); } catch (e) { console.warn(e); }
    }, delay);
    this._timers.push(id);
    return id;
  }

  _clearTimers() {
    for (const id of this._timers) clearTimeout(id);
    this._timers.length = 0;
    if (this._captionTimer) { clearTimeout(this._captionTimer); this._captionTimer = null; }
  }

  // ------ Target resolvers for dynamic shots (snakes/chests/player etc.) ------
  _resolvePoint(sel) {
    // raw vector: [x,y,z]
    if (Array.isArray(sel)) return new THREE.Vector3(sel[0], sel[1], sel[2]);
    if (sel === 'player') return this._playerPos();

    // object selector: { type:'enemy'|'chest', id?, of?, near?:[x,y,z] }
    if (sel && typeof sel === 'object') {
      const near = Array.isArray(sel.near) ? new THREE.Vector3(...sel.near) : this._playerPos();
      if (sel.type === 'enemy') {
        const p = this._findNearestByTag({ tagType: 'enemy', kind: sel.of }, near);
        if (p) return p;
      }
      if (sel.type === 'chest') {
        const byId = sel.id ? this._findByIdTag('chest', sel.id) : null;
        if (byId) return byId;
        const p = this._findNearestByTag({ tagType: 'chest' }, near);
        if (p) return p;
      }
    }
    // fallback
    return new THREE.Vector3(0,0,0);
  }

  _findByIdTag(tagType, id) {
    let best = null;
    this.scene.traverse(o => {
      const u = o.userData || {};
      if (u.tagType === tagType && u.id === id) best = o.getWorldPosition(new THREE.Vector3());
    });
    return best;
  }

  _findNearestByTag(match, near) {
    let best = null, bestD = Infinity;
    this.scene.traverse(o => {
      const u = o.userData || {};
      if (u.tagType !== match.tagType) return;
      if (match.kind && u.kind !== match.kind) return;
      const p = o.getWorldPosition(new THREE.Vector3());
      const d = p.distanceTo(near);
      if (d < bestD) { bestD = d; best = p; }
    });
    return best;
  }
}
