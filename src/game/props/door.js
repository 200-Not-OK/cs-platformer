import * as THREE from 'three';
import { PasscodePanel } from '../components/PasscodePanel.js';

export class Door {
  constructor(scene, position = [0, 4, -44.5], opts = {}) {
    this.scene = scene;
    this.pos = new THREE.Vector3(...position);
    this.width = opts.width ?? 8;
    this.height = opts.height ?? 8;
    this.thickness = opts.thickness ?? 1;
    this.color = opts.color ?? 0x4c566a;
    this.onOpen = typeof opts.onOpen === 'function' ? opts.onOpen : null;

    this.root = new THREE.Group();
    this.root.position.copy(this.pos);
    scene.add(this.root);

    // Frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + .4, this.height + .4, this.thickness + .4),
      new THREE.MeshStandardMaterial({ color: 0x2b3a4a, metalness:.6, roughness:.5 })
    );
    frame.receiveShadow = true; frame.castShadow = true; frame.position.set(0,0,0);
    this.root.add(frame);

    // Two leaves
    const leafGeo = new THREE.BoxGeometry(this.width/2, this.height, this.thickness);
    const leafMat = new THREE.MeshStandardMaterial({ color: this.color, metalness:.3, roughness:.7 });
    this.left = new THREE.Mesh(leafGeo, leafMat); this.right = new THREE.Mesh(leafGeo, leafMat);
    this.left.position.set(-this.width/4, 0, 0);
    this.right.position.set(this.width/4, 0, 0);
    this.left.castShadow = this.right.castShadow = true;
    this.root.add(this.left, this.right);

    // keypad sprite (toggle near)
    this._keypad = this._makeKeypadSprite();
    this._keypad.position.set(this.width * 0.35, -this.height*0.2, this.thickness * 0.6);
    this._keypad.visible = false;
    this.root.add(this._keypad);

    this._passcode = null;
    this._open = false;
    this.interactRadius = 3.2;
    this._anim = 0; // 0..1
  }

  _makeKeypadSprite() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(18,22,30,0.8)'; ctx.fillRect(0,0,256,128);
    ctx.fillStyle = '#eaf2ff'; ctx.font = 'bold 20px system-ui,-apple-system,Segoe UI,Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('E: ENTER CODE', 128, 36);
    ctx.fillStyle = '#9fb3c8'; ctx.font = '12px system-ui,-apple-system';
    ctx.fillText('LINK NODES → REVERSE → UNLOCK', 128, 86);
    const tex = new THREE.CanvasTexture(cv);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(1.3, .7, 1);
    return sp;
  }

  setCode(code) { this._passcode = String(code || '').trim().toUpperCase(); }
  isOpen() { return this._open; }

  update(dt, playerPos, input) {
    // animate opening
    if (this._open && this._anim < 1) {
      this._anim = Math.min(1, this._anim + dt * 0.9);
      const t = 1 - Math.pow(1 - this._anim, 3); // easeOutCubic
      const slide = THREE.MathUtils.lerp(0, this.width * 0.62, t);
      const yaw = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(0, 10, t));
      this.left.position.x = -this.width/4 - slide * 0.5;
      this.right.position.x =  this.width/4 + slide * 0.5;
      this.left.rotation.y =  yaw;
      this.right.rotation.y = -yaw;
      return;
    }

    const inRange = playerPos && this.root.position.distanceTo(playerPos) <= this.interactRadius;
    this._keypad.visible = !!inRange && !this._open;

    if (inRange && input?.isKey?.('KeyE') && !this._open) {
      this._openPasscodeUI();
    }
  }

  _openPasscodeUI() {
    if (!this._passcode) { alert('Passcode not set yet.'); return; }
    new PasscodePanel({
      code: this._passcode,
      onSubmit: (attempt) => {
        if (attempt.toUpperCase() === this._passcode) {
          this._open = true;
          try { this.onOpen && this.onOpen(); } catch {}
        } else {
          // gentle nudge
          console.log('Wrong code:', attempt);
        }
      },
      onCancel: () => {}
    });
  }

  dispose() {
    this.scene.remove(this.root);
    this.left.geometry?.dispose?.(); this.left.material?.dispose?.();
    this.right.geometry?.dispose?.(); this.right.material?.dispose?.();
    this._keypad.material?.map?.dispose?.(); this._keypad.material?.dispose?.();
  }
}
