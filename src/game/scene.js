import * as THREE from 'three';

export function createSceneAndRenderer() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // Lights
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  const amb = new THREE.AmbientLight(0x404040, 1.2);
  scene.add(amb);

  // Resize handler
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, renderer };
}
