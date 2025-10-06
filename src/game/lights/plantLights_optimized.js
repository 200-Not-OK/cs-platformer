import * as THREE from 'three';

class LightComponent {
    constructor(props = {}) {
        this.props = props;
        this._mounted = false;
    }
}

export class CastleBioluminescentPlant extends LightComponent {
    static sharedClock = new THREE.Clock(true);
    
    // CRITICAL: Shared resources - created ONCE, reused by ALL plants
    static sharedFireflyTexture = null;
    static sharedFireflyMaterial = null;
    static sharedNodeGeometry = null;
    static sharedNodeMaterials = [];
    static sharedStemMaterial = null;
    static resourcesInitialized = false;

    constructor(props = {}) {
        super(props);
        this.basePosition = new THREE.Vector3().fromArray(props.position || [0, 0, 0]);
        this.plantGroup = null;
        this.fireflies = null;
        this.light = null;
        this.glowingNodes = [];
        
        // CRITICAL: Minimal particles for 60fps
        this.fireflyCount = 12; // Drastically reduced
        this.fireflyArea = { x: 2.5, y: 2.5, z: 1.5 };
        this.fireflySpeed = 0.03;
        
        // CRITICAL: Update throttling
        this.updateCounter = 0;
        this.updateInterval = 3; // Update every 3 frames
        
        // Instance-specific phase offset for variety
        this.phaseOffset = Math.random() * Math.PI * 2;
    }

    static initializeSharedResources() {
        if (this.resourcesInitialized) return;
        
        console.log('🌿 Initializing shared plant resources...');
        
        // Shared firefly texture - BRIGHT CYAN glow
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 1)'); // Bright cyan
        gradient.addColorStop(0.4, 'rgba(0, 200, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 150, 200, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 100, 150, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        this.sharedFireflyTexture = new THREE.CanvasTexture(canvas);
        
        // Shared firefly material
        this.sharedFireflyMaterial = new THREE.PointsMaterial({
            size: 0.2, // Larger and more visible
            map: this.sharedFireflyTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: true
        });
        
        // Shared node geometry (reused for all bubbles)
        this.sharedNodeGeometry = new THREE.SphereGeometry(0.06, 8, 6); // Low poly
        
        // Shared node materials - VIBRANT colors (no white!)
        this.sharedNodeMaterials = [
            new THREE.MeshStandardMaterial({ 
                color: 0x00FFFF, // Cyan
                emissive: 0x00FFFF, 
                emissiveIntensity: 2.0,
                transparent: true, 
                opacity: 0.9 
            }),
            new THREE.MeshStandardMaterial({ 
                color: 0x0088FF, // Blue
                emissive: 0x0088FF, 
                emissiveIntensity: 2.0,
                transparent: true, 
                opacity: 0.9 
            }),
            new THREE.MeshStandardMaterial({ 
                color: 0x00FFAA, // Green-cyan
                emissive: 0x00FFAA, 
                emissiveIntensity: 2.0,
                transparent: true, 
                opacity: 0.9 
            }),
            new THREE.MeshStandardMaterial({ 
                color: 0xAA00FF, // Purple
                emissive: 0xAA00FF, 
                emissiveIntensity: 2.0,
                transparent: true, 
                opacity: 0.9 
            }),
            new THREE.MeshStandardMaterial({ 
                color: 0x00CCAA, // Teal
                emissive: 0x00CCAA, 
                emissiveIntensity: 2.0,
                transparent: true, 
                opacity: 0.9 
            })
        ];
        
        // Shared stem material - GREEN-CYAN glow
        this.sharedStemMaterial = new THREE.MeshStandardMaterial({
            color: 0x00AA77,
            emissive: 0x00CCAA,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.85
        });
        
        this.resourcesInitialized = true;
        console.log('✅ Plant resources initialized - all plants share these materials');
    }

    async mount(scene) {
        // Initialize shared resources if needed
        CastleBioluminescentPlant.initializeSharedResources();
        
        this.plantGroup = new THREE.Group();
        this.plantGroup.position.copy(this.basePosition);
        
        this.createSimplePlantStructure();
        this.createOptimizedFireflies();
        this.createBrightCyanLight();
        
        scene.add(this.plantGroup);
        this._mounted = true;
    }

    createSimplePlantStructure() {
        // Simple curved stem
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.2, 0.5, 0),
            new THREE.Vector3(0.1, 1.0, 0),
            new THREE.Vector3(-0.1, 1.5, 0),
            new THREE.Vector3(0.05, 1.8, 0)
        ]);
        
        // Use shared stem material
        const stemGeometry = new THREE.TubeGeometry(curve, 20, 0.04, 8, false);
        const stem = new THREE.Mesh(stemGeometry, CastleBioluminescentPlant.sharedStemMaterial);
        this.plantGroup.add(stem);
        
        // Add glowing nodes/bubbles with vibrant colors
        const nodePositions = [0.2, 0.35, 0.5, 0.65, 0.8, 0.95];
        nodePositions.forEach((t, index) => {
            const node = this.createColoredNode();
            const point = curve.getPoint(t);
            node.position.copy(point);
            this.plantGroup.add(node);
            this.glowingNodes.push({ 
                node, 
                basePosition: point.clone(),
                phase: Math.random() * Math.PI * 2,
                colorIndex: node.userData.colorIndex
            });
        });
    }

    createColoredNode() {
        // Reuse shared geometry and pick random colored material
        const colorIndex = Math.floor(Math.random() * CastleBioluminescentPlant.sharedNodeMaterials.length);
        const node = new THREE.Mesh(
            CastleBioluminescentPlant.sharedNodeGeometry, 
            CastleBioluminescentPlant.sharedNodeMaterials[colorIndex]
        );
        node.userData.colorIndex = colorIndex;
        return node;
    }

    createOptimizedFireflies() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.fireflyCount * 3);
        const colors = new Float32Array(this.fireflyCount * 3);
        const velocities = new Float32Array(this.fireflyCount * 3);
        
        for (let i = 0; i < this.fireflyCount; i++) {
            const i3 = i * 3;
            
            // Random positions
            positions[i3] = (Math.random() - 0.5) * this.fireflyArea.x;
            positions[i3 + 1] = Math.random() * this.fireflyArea.y;
            positions[i3 + 2] = (Math.random() - 0.5) * this.fireflyArea.z;
            
            // Random velocities
            velocities[i3] = (Math.random() - 0.5) * 0.001;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.001;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.001;
            
            // BRIGHT CYAN color (no white!)
            const brightness = 0.8 + Math.random() * 0.2;
            colors[i3] = 0; // R
            colors[i3 + 1] = brightness; // G
            colors[i3 + 2] = brightness; // B (cyan = 0, G, B)
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        // Use shared material
        this.fireflies = new THREE.Points(geometry, CastleBioluminescentPlant.sharedFireflyMaterial);
        this.plantGroup.add(this.fireflies);
    }

    createBrightCyanLight() {
        // Main CYAN point light (no white!)
        this.light = new THREE.PointLight(0x00FFFF, 3.0, 15);
        this.light.position.set(0, 1.0, 0);
        this.light.castShadow = false; // Disabled for performance
        this.plantGroup.add(this.light);
        
        // Secondary BLUE-GREEN light for color variety
        const fillLight = new THREE.PointLight(0x00CCAA, 1.5, 10);
        fillLight.position.set(0, 0.5, 0);
        this.plantGroup.add(fillLight);
    }

    update(deltaTime) {
        if (!this._mounted) return;

        // Throttle updates
        this.updateCounter++;
        if (this.updateCounter < this.updateInterval) return;
        this.updateCounter = 0;

        const time = CastleBioluminescentPlant.sharedClock.getElapsedTime() + this.phaseOffset;
        
        // Simple pulsing animation for nodes
        this.glowingNodes.forEach((nodeData, index) => {
            const pulse = Math.sin(time * 2 + nodeData.phase) * 0.3 + 1.0;
            nodeData.node.scale.setScalar(pulse);
        });
        
        // Simple firefly movement
        if (this.fireflies) {
            const positions = this.fireflies.geometry.attributes.position.array;
            const velocities = this.fireflies.geometry.attributes.velocity.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Simple wandering
                velocities[i] += (Math.random() - 0.5) * 0.0001;
                velocities[i + 1] += (Math.random() - 0.5) * 0.0001;
                velocities[i + 2] += (Math.random() - 0.5) * 0.0001;
                
                // Update position
                positions[i] += velocities[i] * this.fireflySpeed;
                positions[i + 1] += velocities[i + 1] * this.fireflySpeed;
                positions[i + 2] += velocities[i + 2] * this.fireflySpeed;
                
                // Boundary wrapping (simple)
                if (Math.abs(positions[i]) > this.fireflyArea.x / 2) velocities[i] *= -1;
                if (positions[i + 1] < 0 || positions[i + 1] > this.fireflyArea.y) velocities[i + 1] *= -1;
                if (Math.abs(positions[i + 2]) > this.fireflyArea.z / 2) velocities[i + 2] *= -1;
            }
            
            this.fireflies.geometry.attributes.position.needsUpdate = true;
        }
        
        // Simple light pulsing
        if (this.light) {
            this.light.intensity = 3.0 + Math.sin(time * 1.5) * 0.5;
        }
    }

    unmount(scene) {
        if (this.plantGroup) {
            scene.remove(this.plantGroup);
            // Note: Don't dispose shared resources - they're reused by other plants
        }
        this._mounted = false;
    }
}
