import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { ShaderSystem } from './shaderSys    pmremGenerator.dispose();
    console.log('🌌 Triple-layer HDRI skybox loaded (IMMERSIVE parallax depth enabled)');
    console.log('💫 Layer speeds - Far: 0.7x | Mid: 2.5x | Near: 5x');
    console.log('✨ Enhanced depth perception with 3-layer parallax + pulsing opacity');js';

// Global variable to enable/disable star shadows
export const ENABLE_STAR_SHADOWS = false; // Set to true to enable star shadows

export function createSceneAndRenderer() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Set to black initially, will be replaced by HDRI

  // Skybox rotation properties
  let skyboxRotation = 0;
  const skyboxRotationSpeed = 0.01; // Base speed for noticeable depth effect
  let backgroundTexture = null;
  let skyboxMeshFar = null; // Far layer - distant stars (slower rotation)
  let skyboxMeshNear = null; // Near layer - nearby asteroids/nebulae (faster rotation)
  let skyboxMeshMid = null; // Middle layer for enhanced depth (medium rotation)

  // Renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance' // Optimize for performance
  });
  
  // Increase maximum lights per surface for multiple star lights
  renderer.capabilities.maxTextures = 16; // Increase texture limit if needed
  console.log('💡 Renderer capabilities - Max lights will be determined by shader compilation');
  
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
  // Limit pixel ratio for better performance (especially on high DPI displays)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  // Enable shadows with performance optimizations
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; // Basic PCF (faster than PCFSoft)
  renderer.shadowMap.autoUpdate = false; // Manual update for performance

  // Set tone mapping for HDRI
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.3; // Reduced for darker scene
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Initialize Shader System
  const shaderSystem = new ShaderSystem(renderer, scene);
  
  // Apply atmospheric fog for depth
  shaderSystem.applyFog(0x000510, 30, 150); // Dark blue-black fog

  document.body.appendChild(renderer.domElement);

  // Load HDRI for night sky
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const rgbeLoader = new RGBELoader();
  rgbeLoader.load('src/assets/HDR_asteroid_field.hdr', (texture) => {
    // ===== DUAL-LAYER SKYBOX FOR PARALLAX DEPTH EFFECT =====
    
    // Properly clone textures for independent control (fixes line twinkling issue)
    texture.needsUpdate = true;
    const textureFar = texture.clone();
    textureFar.needsUpdate = true;
    const textureNear = texture.clone();
    textureNear.needsUpdate = true;
    
    // FAR LAYER - Distant stars and deep space (slowest rotation)
    const skyGeometryFar = new THREE.SphereGeometry(600, 60, 40); // Larger for distant background
    const skyMaterialFar = new THREE.MeshBasicMaterial({
      map: textureFar,
      side: THREE.BackSide, // Render inside of sphere
      fog: false, // Don't apply fog to skybox
      transparent: true,
      opacity: 0.85, // Slightly faded for distant feel
      depthWrite: false // Prevent z-fighting between layers
    });
    
    skyboxMeshFar = new THREE.Mesh(skyGeometryFar, skyMaterialFar);
    skyboxMeshFar.rotation.y = Math.PI; // Initial 180° rotation
    skyboxMeshFar.renderOrder = -3; // Render first (furthest back)
    scene.add(skyboxMeshFar);
    
    // MIDDLE LAYER - Medium distance space (medium rotation)
    const textureMid = texture.clone();
    textureMid.needsUpdate = true;
    const skyGeometryMid = new THREE.SphereGeometry(450, 60, 40); // Medium distance
    const skyMaterialMid = new THREE.MeshBasicMaterial({
      map: textureMid,
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      opacity: 0.5, // More transparent for layering
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    
    skyboxMeshMid = new THREE.Mesh(skyGeometryMid, skyMaterialMid);
    skyboxMeshMid.rotation.y = Math.PI + 1.0; // Different starting rotation
    skyboxMeshMid.renderOrder = -2; // Render second
    scene.add(skyboxMeshMid);
    
    // NEAR LAYER - Closest asteroids/nebulae (fastest rotation, additive blending)
    const skyGeometryNear = new THREE.SphereGeometry(350, 60, 40); // Much closer for dramatic parallax
    const skyMaterialNear = new THREE.MeshBasicMaterial({
      map: textureNear,
      side: THREE.BackSide,
      fog: false,
      transparent: true,
      opacity: 0.4, // More transparent for dramatic layering
      depthWrite: false,
      blending: THREE.AdditiveBlending // Creates glowing effect
    });
    
    skyboxMeshNear = new THREE.Mesh(skyGeometryNear, skyMaterialNear);
    skyboxMeshNear.rotation.y = Math.PI + 3.5; // Very different offset for variation
    skyboxMeshNear.renderOrder = -1; // Render last (closest)
    scene.add(skyboxMeshNear);
    
    // Also set as environment map for reflections (optional)
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = null; // Disable IBL to prevent environmental lighting
    // scene.background is now handled by skybox meshes
    backgroundTexture = texture; // Store reference for potential future use
    
    pmremGenerator.dispose();
    console.log('🌌 Dual-layer HDRI skybox loaded (parallax depth effect enabled)');
    console.log('� Far layer speed:', skyboxRotationSpeed, '| Near layer speed:', skyboxRotationSpeed * 2);
    console.log('✨ Pulsing stars effect enabled');
    
    // Remove ambient light to eliminate any fill lighting
    // const ambientLight = new THREE.AmbientLight(0x202040, 0.04); // Extremely dim for darker shadows
    // scene.add(ambientLight);
    console.log('💡 Ambient light disabled for darker scene');
    
    // Add dedicated directional light for CHARACTER SHADOWS on ground
    // This light is specifically for shadow casting, not illumination
    const shadowLight = new THREE.DirectionalLight(0xfff4e6, 0.0); // Disabled - light comes from stars
    shadowLight.position.set(150, 50, 50); // Positioned to cast shadows on ground
    shadowLight.castShadow = true; // PRIMARY shadow caster for character
    
    // Configure shadow properties - OPTIMIZED FOR PERFORMANCE
    shadowLight.shadow.mapSize.width = 1024;  // Reduced from 2048 (4x less memory)
    shadowLight.shadow.mapSize.height = 1024; // Reduced from 2048 (4x less memory)
    shadowLight.shadow.camera.near = 0.5;
    shadowLight.shadow.camera.far = 200; // Increased for larger shadow area
    
    // Tighter shadow camera bounds for better shadow resolution where it matters
    shadowLight.shadow.camera.left = -60;   // Reduced from -100
    shadowLight.shadow.camera.right = 60;   // Reduced from 100
    shadowLight.shadow.camera.top = 60;     // Reduced from 100
    shadowLight.shadow.camera.bottom = -60; // Reduced from -100
    
    // Shadow bias for darker, cleaner shadows
    shadowLight.shadow.bias = -0.01; // More negative for darker shadows
    shadowLight.shadow.normalBias = 0;
    
    scene.add(shadowLight);
    scene.userData.shadowLight = shadowLight;
    console.log('🌟 Character shadow light added (casts shadows on ground and walls)');
    
    // Add VERY DIM moonlight for subtle fill - no shadows
    const moonLight = new THREE.DirectionalLight(0x8888bb, 0.0); // Disabled for no dynamic lighting
    moonLight.position.set(50, 80, 30);
    moonLight.castShadow = false; // Shadow light handles shadows
    
    scene.add(moonLight);
    scene.userData.moonLight = moonLight;
    
    console.log('🌙 Moonlight added (fill light only - no shadows)');
  }, undefined, (error) => {
    console.error('❌ Failed to load HDRI:', error);
  });

  // Lighting is provided by a modular LightManager per-level (default lights
  // are added by levels that opt-in). Keep the scene prepared but don't add
  // any hard-coded lights here so levels have full control.

  // Resize handler
  window.addEventListener('resize', () => {
    updateSize();
  });

  // Skybox rotation update function - now rotates THREE layers with pulsing effect for immersive depth
  const updateSkybox = (deltaTime) => {
    if (skyboxMeshFar && skyboxMeshMid && skyboxMeshNear) {
      // Continuous rotation for visible star movement (even when standing still)
      skyboxRotation += skyboxRotationSpeed * (deltaTime / 16.67); // Normalize to 60fps
      
      // FAR LAYER - Slowest rotation (distant stars - millions of light years away)
      skyboxMeshFar.rotation.y = Math.PI + (skyboxRotation * 0.7); // 0.7x speed (very slow)
      
      // MIDDLE LAYER - Medium rotation (mid-distance nebulae)
      skyboxMeshMid.rotation.y = Math.PI + 1.0 + (skyboxRotation * 2.5); // 2.5x speed
      
      // NEAR LAYER - Fastest rotation (nearby asteroids/nebulae) for dramatic parallax
      skyboxMeshNear.rotation.y = Math.PI + 3.5 + (skyboxRotation * 5.0); // 5x speed!
      
      // ===== ENHANCED PULSING STARS EFFECT =====
      // Oscillates brightness to make space feel alive and breathing
      const time = Date.now() * 0.001; // Faster pulse for more life
      const pulseAmount = 0.15; // Pulse intensity
      
      // Far layer - subtle pulse (distant stars are stable)
      const pulseFar = 0.85 + Math.sin(time * 0.5) * (pulseAmount * 0.5);
      skyboxMeshFar.material.opacity = pulseFar;
      
      // Middle layer - moderate pulse at different phase
      const pulseMid = 0.5 + Math.sin(time * 1.2 + 1.0) * pulseAmount;
      skyboxMeshMid.material.opacity = Math.max(0.3, pulseMid);
      
      // Near layer - dramatic pulse (turbulent nearby space)
      const pulseNear = 0.4 + Math.sin(time * 1.8 + 2.5) * (pulseAmount * 1.3);
      skyboxMeshNear.material.opacity = Math.max(0.15, pulseNear);
    }
  };

  return { scene, renderer, updateSkybox, shaderSystem };
}
