import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class SpotSweep extends LightComponent {
  constructor(props = {}) {
    super(props);
    this.group = null;
    this.light = null;
    this.target = null;
    this.elapsed = 0;
  }

  mount(scene) {
    const {
      color = 0xffffff,
      intensity = 3,
      position = [0, 8, 0],
      angle = Math.PI / 7,
      penumbra = 0.35,
      distance = 40,
      sweepSpeed = 0.6,     // radians per second
      sweepAmplitude = Math.PI / 5, // total swing half-angle
      yLook = 0
    } = this.props;

    this.group = new THREE.Group();
    this.group.position.set(position[0], position[1], position[2]);

    this.light = new THREE.SpotLight(color, intensity, distance, angle, penumbra);
    this.light.castShadow = false;

    this.target = new THREE.Object3D();
    this.target.position.set(0, yLook, 0);
    this.group.add(this.target);
    this.light.target = this.target;

    // small visible helper cone (optional)
    const helperGeom = new THREE.ConeGeometry(0.15, 0.6, 16);
    helperGeom.rotateX(Math.PI / 2);
    const helperMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const helper = new THREE.Mesh(helperGeom, helperMat);
    helper.position.set(0, 0, 0);
    helper.visible = !!this.props.showHelper;
    this.group.add(helper);

    this.group.add(this.light);
    scene.add(this.group);

    this._mounted = true;
    this._sweepSpeed = sweepSpeed;
    this._sweepAmp = sweepAmplitude;
  }

  unmount(scene) {
    if (this.group) scene.remove(this.group);
    this.group = null;
    this.light = null;
    this.target = null;
    this._mounted = false;
  }

  update(delta) {
    if (!this._mounted || !this.group || !this.target) return;
    this.elapsed += delta;
    const phase = Math.sin(this.elapsed * this._sweepSpeed) * this._sweepAmp;
    // left-right sweep in XZ plane
    const r = 6;
    const tx = Math.sin(phase) * r;
    const tz = Math.cos(phase) * r;
    this.target.position.x = tx;
    this.target.position.z = tz;
  }
}
