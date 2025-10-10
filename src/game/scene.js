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

  // Lighting is provided by a modular LightManager per-level (default lights
  // are added by levels that opt-in). Keep the scene prepared but don't add
  // any hard-coded lights here so levels have full control.

  // Resize handler
  window.addEventListener('resize', () => {
    updateSize();
  });

  return { scene, renderer };
}
