
import * as THREE from 'three';
import { ColliderHelper } from './colliderHelper.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.speed = options.speed ?? 8;
    this.jumpStrength = options.jumpStrength ?? 10;
    this.gravity = options.gravity ?? -30;
    this.size = options.size ?? [1, 1, 1];


  this.mesh = new THREE.Group(); // placeholder until model loads
  this.scene.add(this.mesh);


  this.collider = new THREE.Box3();
  this.helper = new ColliderHelper(this.collider, 0xff0000);
  this.scene.add(this.helper.mesh);


    this.velocity = new THREE.Vector3();
    this.onGround = false;

    this._loadModel();
  }

  async _loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      'src/assets/low_poly_school_boy_zombie_apocalypse_rigged/scene.gltf',
      (gltf) => {
        // Remove placeholder children
        while (this.mesh.children.length > 0) {
          this.mesh.remove(this.mesh.children[0]);
        }
        this.mesh.add(gltf.scene);
        this.mesh.position.set(0, 2, 8);
        this.mesh.castShadow = true;
        this._updateCollider();
      },
      undefined,
      (error) => {
        console.error('Error loading player model:', error);
      }
    );
  }

  _updateCollider() {
    this.collider.setFromObject(this.mesh);
  }

  setPosition(vec3) {
    this.mesh.position.copy(vec3);
    this._updateCollider();
  }

  moveAndCollide(movement, platforms) {
    const half = new THREE.Vector3(this.size[0]/2, this.size[1]/2, this.size[2]/2);
    const pos = this.mesh.position.clone();
    const next = pos.clone().add(movement);

    const axes = ['x','y','z'];

    for (const axis of axes) {
      pos[axis] = next[axis];

      const min = new THREE.Vector3(pos.x-half.x, pos.y-half.y, pos.z-half.z);
      const max = new THREE.Vector3(pos.x+half.x, pos.y+half.y, pos.z+half.z);
      const tempBox = new THREE.Box3(min, max);

      let collided = false;
      for (const plat of platforms) {
        const platBox = plat.userData.collider;
        if (!platBox) continue;
        if (tempBox.intersectsBox(platBox)) {
          collided = true;
          if (axis === 'y') {
            if (movement.y > 0) pos.y = platBox.min.y - half.y - 0.001;
            else { pos.y = platBox.max.y + half.y + 0.001; this.onGround = true; }
            this.velocity.y = 0;
          } else if (axis === 'x') {
            if (movement.x > 0) pos.x = platBox.min.x - half.x - 0.001;
            else pos.x = platBox.max.x + half.x + 0.001;
            this.velocity.x = 0;
          } else if (axis === 'z') {
            if (movement.z > 0) pos.z = platBox.min.z - half.z - 0.001;
            else pos.z = platBox.max.z + half.z + 0.001;
            this.velocity.z = 0;
          }
          break;
        }
      }

      if (!collided && axis === 'y') this.onGround = false;
    }

    this.mesh.position.copy(pos);
    this._updateCollider();
    this.helper.update();
  }

  // delta = seconds, input = InputManager, cameraOrientation = { forward, right }
  update(delta, input, cameraOrientation, platforms, active = true) {
    if (!active) return; // do not move player if free cam

    const move = new THREE.Vector3();
    if (input.isKey('KeyW')) move.add(cameraOrientation.forward);
    if (input.isKey('KeyS')) move.sub(cameraOrientation.forward);
    if (input.isKey('KeyA')) move.sub(cameraOrientation.right);
    if (input.isKey('KeyD')) move.add(cameraOrientation.right);
    move.normalize();

    const horiz = move.multiplyScalar(this.speed * delta);

    // Apply gravity
    this.velocity.y += this.gravity * delta;

    // Jump
    if (input.isKey('Space') && this.onGround) {
      this.velocity.y = this.jumpStrength;
      this.onGround = false;
    }

    const movementThisFrame = new THREE.Vector3(horiz.x, this.velocity.y * delta, horiz.z);
    this.moveAndCollide(movementThisFrame, platforms);
  }

  toggleHelperVisible(visible) {
    this.helper.setVisible(visible);
  }
}
