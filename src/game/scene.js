import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { ShaderSystem } from './shaderSystem.js';

// Global variable to enable/disable star shadows
export const ENABLE_STAR_SHADOWS = false; // Set to true to enable star shadows

export function createSceneAndRenderer() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Set to black initially, will be replaced by HDRI

  // Skybox rotation properties (creates twinkling effect)
  let skyboxRotation = 0;
  const skyboxRotationSpeed = 0.0004; // Very slow for subtle twinkling
  let skyboxMeshFar = null; // Far layer - blue nebulae
  let skyboxMeshNear = null; // Near layer - asteroid field

  // Renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: false, // Disable for better FPS
    powerPreference: 'high-performance',
    stencil: false, // Disable stencil buffer
    depth: true
  });
  
  renderer.capabilities.maxTextures = 16;
  console.log('💡 Renderer capabilities - Max lights will be determined by shader compilation');
  
  // Make the canvas fill the viewport
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0)); // Restore for crisp visuals
  document.body.appendChild(renderer.domElement);

  // Enable shadows
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;

  // Initialize shader system
  const shaderSystem = new ShaderSystem(renderer);

  // Load THREE separate HDRI textures for true parallax depth
  const rgbeLoader = new RGBELoader();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Track loading progress
  let loadedCount = 0;
  const totalTextures = 2; // Only 2 layers for better FPS

  // FAR LAYER - Blue Nebulae (furthest, slowest rotation)
  rgbeLoader.load(
    '/src/assets/HDR_blue_nebulae-1 (1).hdr',
    (textureFar) => {
      textureFar.needsUpdate = true;
      textureFar.minFilter = THREE.LinearFilter; // Faster filtering
      textureFar.magFilter = THREE.LinearFilter;
      textureFar.generateMipmaps = false; // Skip mipmaps for performance
      
      const skyGeometryFar = new THREE.SphereGeometry(700, 24, 12); // Low-poly for maximum FPS
      const skyMaterialFar = new THREE.MeshBasicMaterial({
        map: textureFar,
        side: THREE.BackSide,
        fog: false,
        transparent: false,
        depthWrite: false, // Don't write depth to allow layering
        depthTest: true // MUST test depth so castle/objects occlude skybox
      });
      
      skyboxMeshFar = new THREE.Mesh(skyGeometryFar, skyMaterialFar);
      skyboxMeshFar.rotation.y = Math.PI;
      skyboxMeshFar.renderOrder = -3; // Render first
      scene.add(skyboxMeshFar);
      
      loadedCount++;
      if (loadedCount === totalTextures) {
        pmremGenerator.dispose();
        console.log('🌌 Dual-layer HDRI skybox with rotation (twinkling effect)');
        console.log('💫 Far: Blue Nebulae | Near: Asteroid Field');
        console.log('✨ Slow rotation for star twinkling');
      }
    },
    undefined,
    (error) => console.error('Error loading far HDR:', error)
  );

  // NEAR LAYER - Asteroid Field (closest, faster parallax rotation)
  rgbeLoader.load(
    '/src/assets/HDR_asteroid_field.hdr',
    (textureNear) => {
      textureNear.needsUpdate = true;
      textureNear.minFilter = THREE.LinearFilter; // Faster filtering
      textureNear.magFilter = THREE.LinearFilter;
      textureNear.generateMipmaps = false; // Skip mipmaps for performance
      
      const skyGeometryNear = new THREE.SphereGeometry(350, 24, 12); // Low-poly for maximum FPS
      const skyMaterialNear = new THREE.MeshBasicMaterial({
        map: textureNear,
        side: THREE.BackSide,
        fog: false,
        transparent: true,
        opacity: 0.35,
        depthWrite: false, // Don't write depth to allow layering
        depthTest: true, // MUST test depth so castle/objects occlude skybox
        blending: THREE.AdditiveBlending
      });
      
      skyboxMeshNear = new THREE.Mesh(skyGeometryNear, skyMaterialNear);
      skyboxMeshNear.rotation.y = Math.PI + 2.5;
      skyboxMeshNear.renderOrder = -2; // Render after far layer
      scene.add(skyboxMeshNear);
      
      loadedCount++;
      if (loadedCount === totalTextures) {
        pmremGenerator.dispose();
        console.log('🌌 Dual-layer HDRI skybox with rotation (twinkling effect)');
        console.log('💫 Far: Blue Nebulae | Near: Asteroid Field');
        console.log('✨ Slow rotation for star twinkling');
      }
    },
    undefined,
    (error) => console.error('Error loading near HDR:', error)
  );

  console.log('💡 Ambient light disabled for darker scene');
  
  // Add dedicated directional light for CHARACTER SHADOWS on ground
  const shadowLight = new THREE.DirectionalLight(0xfff4e6, 0.0);
  shadowLight.position.set(150, 50, 50);
  shadowLight.castShadow = true;
  
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;
  shadowLight.shadow.camera.near = 0.5;
  shadowLight.shadow.camera.far = 500;
  shadowLight.shadow.camera.left = -100;
  shadowLight.shadow.camera.right = 100;
  shadowLight.shadow.camera.top = 100;
  shadowLight.shadow.camera.bottom = -100;
  shadowLight.shadow.bias = -0.0001;
  shadowLight.shadow.normalBias = 0.02;
  
  scene.add(shadowLight);
  console.log('🌅 Shadow light added for character ground shadows');

  // Resize handler
  window.addEventListener('resize', () => {
    updateSize();
  });

  // Update function for skybox animation
  // Update function for skybox rotation (creates twinkling stars effect)
  const updateSkybox = (deltaTime) => {
    if (skyboxMeshFar && skyboxMeshNear) {
      skyboxRotation += skyboxRotationSpeed * (deltaTime / 16.67);
      
      skyboxMeshFar.rotation.y = Math.PI + (skyboxRotation * 0.1);
      skyboxMeshNear.rotation.y = Math.PI + 2.5 + (skyboxRotation * 0.5);
    }
  };

  return { scene, renderer, updateSkybox, shaderSystem };
}
