import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';
import { loadGLTFModel } from '../gltfLoader.js';

export class StarLight extends LightComponent {
    constructor(props = {}) {
        super(props);
    this.light = null;
    this.starModel = null;
        // glowMesh removed, using stronger emissive materials instead
        this.time = 0;
    }

    async mount(scene) {
        console.log('StarLight mounting with props:', this.props);
        const pos = this.props.position || [0, 50, 0];
        const color = 0xffdd99;
        const modelPath = this.props.modelPath || 'src/assets/cute_little_star.glb';
        const createLight = this.props.createLight !== false;

        try {
            console.log('Loading star model from:', modelPath);
            const gltf = await loadGLTFModel(modelPath);
            this.starModel = gltf.scene.clone();
            console.log('Star model loaded successfully');
        } catch (error) {
            console.error("Failed to load star model:", error);
            this.starModel = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 5 })
            );
        }

        // Create a container group to ensure proper positioning
        this.starContainer = new THREE.Group();
        
        // Center the model geometry
        this.starModel.traverse((child) => {
            if (child.isMesh && child.geometry) {
                child.geometry.center();
            }
        });

        // Apply emissive glow with MeshBasicMaterial for maximum glow visibility
        this.starModel.traverse((child) => {
            if (child.isMesh && child.material) {
                // Use MeshBasicMaterial for stars - always glows, unaffected by lighting
                const originalColor = child.material.color || new THREE.Color(0xffdd99);
                
                const glowMaterial = new THREE.MeshBasicMaterial({
                    map: child.material.map,
                    color: originalColor,
                    transparent: child.material.transparent,
                    opacity: child.material.opacity || 1.0,
                    side: child.material.side || THREE.FrontSide
                });
                
                child.material = glowMaterial;
                child.material.needsUpdate = true;
                
                // Mark this mesh so it won't be affected by shader system or shadows
                child.userData.isStar = true;
                child.castShadow = false; // Stars themselves don't cast shadows
                child.receiveShadow = false;
            }
        });

    // Set up the star model with uniform scale or optional override
    const scale = this.props.scale ?? 5;
    this.starModel.scale.setScalar(scale);
    // Make the star lie flat on its face (front side upwards)
    // Make the star lie flat on its face (front side upwards)
    this.starModel.rotation.x = Math.PI / 2;

        // Add star model to container
        this.starContainer.add(this.starModel);
    // Position container slightly left and towards camera
    this.starContainer.position.set(pos[0] - 5, pos[1], pos[2] - 5);

        // Create light if needed
        if (createLight) {
            console.log('🌟 Creating PointLight for star at position:', pos);
            // Warm yellowish point light for castle ambiance
            const lightColor = this.props.lightColor ?? 0xFFF8DC; // Softer golden color
            
            // Stars are PRIMARY light sources - increased intensity for proper illumination
            // DirectionalLight handles all shadow casting for optimal performance
            this.light = new THREE.PointLight(lightColor, 50, 300, 1.8); // Reduced intensity
            this.light.position.set(...pos);
            
            // PERFORMANCE: Shadows will be enabled dynamically for closest star only
            // This saves significant GPU resources (no cubemap shadow maps needed for distant stars)
            this.light.castShadow = false; // Will be enabled for closest star
            console.log('⭐ Star light configured WITHOUT shadows (will enable for closest star)');
            
            // Configure shadow properties (will be used when this becomes the closest star)
            this.light.shadow.mapSize.width = 256; // Reduced for performance
            this.light.shadow.mapSize.height = 256; // Reduced for performance
            this.light.shadow.camera.near = 0.1;
            this.light.shadow.camera.far = 100; // Adjusted for star distance
            this.light.shadow.bias = -0.001;
            
            // Enable light on all layers so it's available to all objects
            this.light.layers.enableAll();
            
            scene.add(this.light);
            console.log('✅ PointLight added to scene with intensity:', this.light.intensity, 'range:', this.light.distance);

        } else {
            console.log('⭐ Star created without PointLight (createLight=false) at position:', pos);
        }

        scene.add(this.starContainer);
        this._mounted = true;
        console.log(createLight ? '🌟 Model-based Star Light Mounted!' : '⭐ Model-only Star Mounted (no lighting)', 'at position:', pos);
    }

    unmount(scene) {
    if (this.light) scene.remove(this.light);
    if (this.starContainer) scene.remove(this.starContainer);
    }

    update(delta) {
        this.time += delta;
        // Subtle glow pulse: slight variation for star-like effect
        const pulse = Math.sin(this.time * 1.0) * 0.05 + 1.0; // Range [0.95,1.05]
        if (this.light) {
            this.light.intensity = 50 * pulse; // Reduced intensity
        }
        // No need to pulse emissive since we're using MeshBasicMaterial
        // The PointLight provides all the dynamic lighting

    }
    
    // Get light position for distance calculations
    getLightPosition() {
        return this.light ? this.light.position : null;
    }
    
    // Enable or disable shadow casting
    setCastShadow(enabled) {
        if (this.light) {
            this.light.castShadow = enabled;
        }
    }
}