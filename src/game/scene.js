import * as THREE from 'three';

export function createSceneAndRenderer() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // Make the canvas fill the viewport. Use clientWidth/Height in case CSS changes.
  const updateSize = () => {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.clientHeight;
    renderer.setSize(w, h);
    if (renderer.domElement && renderer.domElement.style) {
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.left = '0px';
      renderer.domElement.style.top = '0px';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.zIndex = '1';
      renderer.domElement.style.pointerEvents = 'auto';
    }
  };
  updateSize();
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
    updateSize();
  });

  return { scene, renderer };
}
