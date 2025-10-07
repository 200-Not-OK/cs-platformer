import * as THREE from 'three';

class LightComponent {
    constructor(props = {}) {
        this.props = props;
        this._mounted = false;
    }
}

export class CastleBioluminescentPlant extends LightComponent {
    static sharedClock = new THREE.Clock(true);
    
    // PRECOMPUTED ANIMATION SYSTEM - Record once, replay forever
    static precomputedAnimations = {
        isRecording: false,
        isRecorded: false,
        recordingDuration: 3.0, // Record for 3 seconds only
        recordingFPS: 60,
        playbackFrame: 0, // Current frame for all instances
        totalFrames: 0,
        
        // Recorded data arrays (indexed by frame)
        frames: {
            // Node animations (8 nodes - STATIC during playback for performance)
            nodePositions: [],    // [frame][nodeIndex] = {x, y, z}
            nodeColors: [],       // [frame][nodeIndex] = {r, g, b}
            nodeScales: [],       // [frame][nodeIndex] = scale
            nodeIntensities: [],  // [frame][nodeIndex] = intensity
            
            // Leaf animations (16 leaves - STATIC during playback for performance)
            leafRotations: [],    // [frame][leafIndex] = {x, y, z}
            leafScales: [],       // [frame][leafIndex] = scale
            leafColors: [],       // [frame][leafIndex] = {r, g, b}
            leafIntensities: [],  // [frame][leafIndex] = intensity
            
            // Firefly particles (20 fireflies - ONLY these animate)
            fireflyPositions: [], // [frame][fireflyIndex] = {x, y, z}
            fireflyTime: [],      // [frame] = time value for shader
            
            // Global animations
            swayRotation: [],     // [frame] = rotation value
            glowScale: [],        // [frame] = glow mesh scale
            ambientLightData: [], // [frame][lightIndex] = {intensity, hue}
        }
    };
    
    // PERFORMANCE: Track number of plant instances
    static instanceCount = 0;
    static masterPlant = null; // First plant does recording
    static allPlants = []; // Track all plant instances for animation

    constructor(props = {}) {
        super(props);
        
        // Enable modern color management for vibrant colors
        if (THREE.ColorManagement) {
            THREE.ColorManagement.legacyMode = false;
            THREE.ColorManagement.enabled = true;
        }
        
        this.basePosition = new THREE.Vector3().fromArray(props.position || [0, 0, 0]);
        this.plantGroup = null;
        this.fireflies = null;
        this.glowingNodes = [];
        this.leaves = [];
        
        // PERFORMANCE: Reusable objects to prevent allocations
        this._tempColor = new THREE.Color();
        this._tempVector3 = new THREE.Vector3();
        this._fireflyCurrentPos = new THREE.Vector3();
        this._fireflyCurrentTarget = new THREE.Vector3();
        this._fireflyToTarget = new THREE.Vector3();
        
        // PERFORMANCE: Instance tracking
        CastleBioluminescentPlant.instanceCount++;
        this.instanceId = CastleBioluminescentPlant.instanceCount;
        this.isMasterPlant = (this.instanceId === 1);
        
        // Register this plant in the global list
        CastleBioluminescentPlant.allPlants.push(this);
        
        console.log(`🌱 Creating Plant #${this.instanceId}, isMaster: ${this.isMasterPlant}`);
        
        // Random playback offset (0 to 1500) for visual variety - assigned immediately!
        // Each plant gets a different phase of the animation
        this.playbackOffset = Math.random() * 25.0; // Random time offset (0-25 seconds)
        this.offsetIsFrames = false; // Track if offset has been converted from seconds to frames
        
        if (this.isMasterPlant) {
            CastleBioluminescentPlant.masterPlant = this;
            this.playbackOffset = 0; // Master has no offset
            this.offsetIsFrames = true; // Master's offset is already in frames
            // Start recording if not done yet
            if (!CastleBioluminescentPlant.precomputedAnimations.isRecorded) {
                this.startRecording();
            }
        } else {
            console.log(`✨ Plant #${this.instanceId} will animate with ${this.playbackOffset.toFixed(2)}s time offset`);
        }
        
        // Ultra vibrant color palette with enhanced saturation
        this.colorHSL = {
            electricPurple: { h: 0.78, s: 1.0, l: 0.7 },
            neonBlue: { h: 0.65, s: 1.0, l: 0.7 },
            vibrantCyan: { h: 0.55, s: 1.0, l: 0.8 },
            emerald: { h: 0.4, s: 1.0, l: 0.7 },
            mysticTeal: { h: 0.5, s: 1.0, l: 0.8 },
            crystalBlue: { h: 0.58, s: 1.0, l: 0.8 },
            forestGreen: { h: 0.35, s: 1.0, l: 0.7 },
            aquaGreen: { h: 0.45, s: 1.0, l: 0.8 },
            seaGreen: { h: 0.38, s: 1.0, l: 0.7 },
            turquoise: { h: 0.48, s: 1.0, l: 0.8 },
            marineBlue: { h: 0.62, s: 1.0, l: 0.7 },
            hotPink: { h: 0.95, s: 1.0, l: 0.7 },
            electricLime: { h: 0.15, s: 1.0, l: 0.8 }
        };
        
        this.animationState = {
            breath: 0,
            pulse: 0,
            sway: 0,
            glowIntensity: 1.0,
            time: 0,
            colorShift: 0,
            lightWave: 0
        };
        
        this.pulseInterval = props.pulseInterval || 3.0;
        this.nextPulseTime = 0;
        this.plantType = props.plantType || 'moss';
        
        this.fireflyCount = props.fireflyCount || 20; // REDUCED from 30 to 20 - match flame approach
        this.fireflySpeed = 0.03;
        this.fireflyArea = props.fireflyArea || { x: 4.0, y: 4.0, z: 2.5 };

        this.lightWaveSpeed = 0.8;
        this.lightWaveAmplitude = 0.6;

        this.leafPulseSpeed = 0.6;
        this.leafPulseAmplitude = 0.4;
        this.leafExpansionFactor = 1.3;

        this.boids = {
            separation: 0.3,
            alignment: 0.1,
            cohesion: 0.2,
            perception: 0.8
        };

        this.textureLoader = new THREE.TextureLoader();
        this.normalMap = null;
        this.roughnessMap = null;

        this.plantGlowIntensity = props.plantGlowIntensity || 1.2;
        
        // Ambient light settings - localized range for area around plant
        this.ambientLightRange = 20;
        this.ambientLight = null;
    }

    async loadTextures() {
        this.normalMap = this.createProceduralNormalMap();
        this.roughnessMap = this.createProceduralRoughnessMap();
        
        // Set proper color space for textures
        if (this.normalMap) this.normalMap.colorSpace = THREE.SRGBColorSpace;
        if (this.roughnessMap) this.roughnessMap.colorSpace = THREE.SRGBColorSpace;
    }

    createProceduralNormalMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % 512;
            const y = Math.floor((i / 4) / 512);
            
            const noise = this.fractalNoise(x / 30, y / 30, 6) * 0.7 + 0.3;
            
            imageData.data[i] = 128 + noise * 127;
            imageData.data[i + 1] = 128;
            imageData.data[i + 2] = 255;
            imageData.data[i + 3] = 255;
        }
        
        ctx.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createProceduralRoughnessMap() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, 'rgba(80, 80, 80, 1)');
        gradient.addColorStop(0.7, 'rgba(150, 150, 150, 1)');
        gradient.addColorStop(1, 'rgba(220, 220, 220, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        return new THREE.CanvasTexture(canvas);
    }

    fractalNoise(x, y, octaves) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += this.simplexNoise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }

    simplexNoise(x, y) {
        return Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
    }

    createEnhancedFireflyTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Gentle gradient that preserves color
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.15, 'rgba(240, 240, 255, 0.9)');
        gradient.addColorStop(0.4, 'rgba(200, 200, 255, 0.7)');
        gradient.addColorStop(0.7, 'rgba(150, 150, 200, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 100, 150, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    async mount(scene) {
        this.plantGroup = new THREE.Group();
        this.plantGroup.position.copy(this.basePosition);
        
        // Load textures only once for master
        if (this.isMasterPlant) {
            await this.loadTextures();
        }
        
        // Create individual plant structure with actual meshes
        // These will be used for both recording and playback
        this.createPlantStructure();
        this.createEnhancedFireflies();
        
        // Only master creates lights (reduced from 3 to 1)
        if (this.isMasterPlant) {
            this.createAmbientLight();
        }
        
        scene.add(this.plantGroup);
        this._mounted = true;
    }

    createAmbientLight() {
        // OPTIMIZED: Reduced from 9 lights to 1 light for performance
        const ambientLightGroup = new THREE.Group();
        
        // Single light with larger range for area coverage
        const mainLight = new THREE.PointLight(0x9932cc, 15, 25, 1);
        mainLight.position.set(0, 1.5, 0);
        ambientLightGroup.add(mainLight);
        
        this.plantGroup.add(ambientLightGroup);
        this.ambientLight = ambientLightGroup;
    }

    // ==================== PRECOMPUTED ANIMATION SYSTEM ====================
    
    startRecording() {
        const precomp = CastleBioluminescentPlant.precomputedAnimations;
        precomp.isRecording = true;
        precomp.totalFrames = Math.ceil(precomp.recordingDuration * precomp.recordingFPS);
        precomp.recordingFrame = 0;
        precomp.playbackFrame = 0;
        
        console.log(`🎬 Starting animation recording: ${precomp.totalFrames} frames at ${precomp.recordingFPS}fps`);
        console.log(`⚡ All other plants will WAIT for recording to complete...`);
        
        // Pre-allocate all arrays
        precomp.frames.nodePositions = new Array(precomp.totalFrames);
        precomp.frames.nodeColors = new Array(precomp.totalFrames);
        precomp.frames.nodeScales = new Array(precomp.totalFrames);
        precomp.frames.nodeIntensities = new Array(precomp.totalFrames);
        precomp.frames.leafRotations = new Array(precomp.totalFrames);
        precomp.frames.leafScales = new Array(precomp.totalFrames);
        precomp.frames.leafColors = new Array(precomp.totalFrames);
        precomp.frames.leafIntensities = new Array(precomp.totalFrames);
        precomp.frames.fireflyPositions = new Array(precomp.totalFrames);
        precomp.frames.fireflyTime = new Array(precomp.totalFrames);
        precomp.frames.swayRotation = new Array(precomp.totalFrames);
        precomp.frames.glowScale = new Array(precomp.totalFrames);
        precomp.frames.ambientLightData = new Array(precomp.totalFrames);
    }
    
    recordCurrentFrame(time) {
        const precomp = CastleBioluminescentPlant.precomputedAnimations;
        const frame = precomp.recordingFrame;
        
        // Record node data - now from data structure, not mesh objects
        const nodeData = {
            positions: new Array(this.glowingNodes.length),
            colors: new Array(this.glowingNodes.length),
            scales: new Array(this.glowingNodes.length),
            intensities: new Array(this.glowingNodes.length)
        };
        
        this.glowingNodes.forEach((nodeItem, i) => {
            // Get the mesh node
            const node = nodeItem.node;
            if (!node) return;
            
            // During recording, we compute positions dynamically
            const basePos = nodeItem.basePosition;
            const positionAlongStem = nodeItem.positionAlongStem;
            const wavePhase = nodeItem.wavePhase;
            const baseScale = nodeItem.baseScale;
            const baseColor = node.userData.baseColor || { h: 0.7, s: 1.0, l: 0.5 };
            
            // Apply animation calculations
            const waveOffset = Math.sin(this.animationState.lightWave - positionAlongStem * 5 + wavePhase) * 0.025;
            const sideWave = Math.cos(this.animationState.lightWave * 1.3 - positionAlongStem * 3 + wavePhase) * 0.01;
            const floatOffset = Math.sin(time * 1.2 + i * 0.8) * 0.012;
            
            const animatedPos = {
                x: basePos.x + sideWave,
                y: basePos.y + waveOffset + floatOffset,
                z: basePos.z
            };
            
            // Animated color
            const hueShift = baseColor.h + Math.sin(time * 0.5 + i * 0.7) * 0.08;
            const lightness = 0.55 + Math.sin(time * 0.8 + positionAlongStem * 3) * 0.08;
            this._tempColor.setHSL(hueShift, 1.0, lightness);
            
            // Animated scale
            const wavePulse = Math.sin(this.animationState.lightWave * 3 - positionAlongStem * 8 + wavePhase) * 0.4 + 0.6;
            const basePulse = this.animationState.pulse > 0.1 ? 
                Math.sin(time * 12 + i) * this.animationState.pulse * 0.4 : 0;
            const pulseSize = 1.0 + Math.sin(this.animationState.lightWave * 4 - positionAlongStem * 7) * 0.4;
            
            nodeData.positions[i] = animatedPos;
            nodeData.colors[i] = { r: this._tempColor.r, g: this._tempColor.g, b: this._tempColor.b };
            nodeData.scales[i] = baseScale * pulseSize;
            nodeData.intensities[i] = 1.0;
        });
        
        // Record leaf data
        const leafData = {
            rotations: new Array(this.leaves.length),
            scales: new Array(this.leaves.length),
            colors: new Array(this.leaves.length),
            intensities: new Array(this.leaves.length)
        };
        
        this.leaves.forEach((leafItem, i) => {
            const leaf = leafItem.leaf;
            if (!leaf) return;
            
            const baseRotation = leafItem.baseRotation || 0;
            const baseScale = leaf.userData.baseScale || new THREE.Vector3(1, 1, 1);
            const phase = leaf.userData.phase || 0;
            
            // Apply animation
            const rustle = Math.sin(time * 2.0 + i * 0.5) * 0.15;
            const gentleSway = Math.sin(time * 0.7 + i * 0.3) * 0.08;
            
            const primaryPulse = 1.0 + Math.sin(time * this.leafPulseSpeed + phase) * this.leafPulseAmplitude;
            const secondaryPulse = 1.0 + Math.sin(time * this.leafPulseSpeed * 1.7 + phase * 1.3) * (this.leafPulseAmplitude * 0.4);
            const pulse = primaryPulse * secondaryPulse;
            
            const colorShift = 0.50 + Math.sin(time * 0.3 + i) * 0.08;
            this._tempColor.setHSL(colorShift, 1.0, 0.45);
            
            leafData.rotations[i] = { 
                x: leaf.rotation.x + gentleSway * 0.1, 
                y: leaf.rotation.y, 
                z: baseRotation + rustle 
            };
            leafData.scales[i] = baseScale.x * pulse;
            leafData.colors[i] = { r: this._tempColor.r, g: this._tempColor.g, b: this._tempColor.b };
            leafData.intensities[i] = 1.0;
        });
        
        // Record firefly positions
        const fireflyData = new Array(this.fireflyCount);
        if (this.fireflies) {
            const positions = this.fireflies.geometry.attributes.position.array;
            for (let i = 0; i < this.fireflyCount; i++) {
                const idx = i * 3;
                fireflyData[i] = { x: positions[idx], y: positions[idx + 1], z: positions[idx + 2] };
            }
        }
        
        // Record ambient light data
        const ambientData = [];
        if (this.ambientLight) {
            this.ambientLight.children.forEach((child, i) => {
                if (child.isPointLight) {
                    ambientData[i] = { intensity: child.intensity, hue: 0, saturation: 0, lightness: 0 };
                    child.color.getHSL(ambientData[i]);
                }
            });
        }
        
        // Store frame data
        precomp.frames.nodePositions[frame] = nodeData.positions;
        precomp.frames.nodeColors[frame] = nodeData.colors;
        precomp.frames.nodeScales[frame] = nodeData.scales;
        precomp.frames.nodeIntensities[frame] = nodeData.intensities;
        precomp.frames.leafRotations[frame] = leafData.rotations;
        precomp.frames.leafScales[frame] = leafData.scales;
        precomp.frames.leafColors[frame] = leafData.colors;
        precomp.frames.leafIntensities[frame] = leafData.intensities;
        precomp.frames.fireflyPositions[frame] = fireflyData;
        precomp.frames.fireflyTime[frame] = time;
        precomp.frames.swayRotation[frame] = this.plantGroup.rotation.z;
        precomp.frames.glowScale[frame] = this.glowMesh ? this.glowMesh.scale.x : 1.0;
        precomp.frames.ambientLightData[frame] = ambientData;
        
        precomp.recordingFrame++;
        
        // Check if recording is complete
        if (precomp.recordingFrame >= precomp.totalFrames) {
            this.finishRecording();
        }
    }
    
    finishRecording() {
        const precomp = CastleBioluminescentPlant.precomputedAnimations;
        precomp.isRecording = false;
        precomp.isRecorded = true;
        precomp.playbackFrame = 0; // Start playback from frame 0
        
        console.log(`✅ Recording complete! ${precomp.totalFrames} frames (3 seconds at 60fps)`);
        console.log(`📊 Memory: ~${(JSON.stringify(precomp.frames).length / 1024).toFixed(2)} KB`);
        console.log(`� Master plant plays back, all others are passive clones!`);
        console.log(`🚀 Non-master plants do ZERO calculations - ultimate performance!`);
    }
    
    playbackFrame() {
        const precomp = CastleBioluminescentPlant.precomputedAnimations;
        
        // Only master updates all plants
        if (!this.isMasterPlant) {
            return;
        }
        
        const maxFrames = precomp.totalFrames;
        if (maxFrames === 0) return;
        
        const masterFrame = precomp.playbackFrame;
        
        // SAFETY: Ensure frame data exists
        if (!precomp.frames.nodePositions || !precomp.frames.nodePositions[masterFrame]) {
            return;
        }
        
        // Update all plants
        CastleBioluminescentPlant.allPlants.forEach(plant => {
            // Calculate plant's unique frame with offset
            if (!plant.offsetIsFrames) {
                plant.playbackOffset = Math.round(plant.playbackOffset * precomp.recordingFPS);
                plant.offsetIsFrames = true;
            }
            const plantFrame = (masterFrame + plant.playbackOffset) % maxFrames;
            
            // Apply global plant animation (sway)
            plant.plantGroup.rotation.z = precomp.frames.swayRotation[plantFrame];
            
            // Update nodes
            const nodePositions = precomp.frames.nodePositions[plantFrame];
            const nodeScales = precomp.frames.nodeScales[plantFrame];
            const nodeColors = precomp.frames.nodeColors[plantFrame];
            
            if (nodePositions && nodeScales && nodeColors) {
                for (let i = 0; i < plant.glowingNodes.length; i++) {
                    const nodeItem = plant.glowingNodes[i];
                    const node = nodeItem ? nodeItem.node : null;
                    if (node && nodePositions[i]) {
                        node.position.set(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
                        node.scale.setScalar(nodeScales[i] || 1.0);
                        const colorData = nodeColors[i];
                        if (colorData && node.material) {
                            node.material.color.setRGB(colorData.r, colorData.g, colorData.b);
                        }
                    }
                }
            }
            
            // Update leaves
            const leafRotations = precomp.frames.leafRotations[plantFrame];
            const leafScales = precomp.frames.leafScales[plantFrame];
            const leafColors = precomp.frames.leafColors[plantFrame];
            
            if (leafRotations && leafScales && leafColors) {
                for (let i = 0; i < plant.leaves.length; i++) {
                    const leafItem = plant.leaves[i];
                    const leaf = leafItem ? leafItem.leaf : null;
                    const rotData = leafRotations[i];
                    
                    if (rotData && leaf) {
                        leaf.rotation.set(rotData.x, rotData.y, rotData.z);
                        leaf.scale.setScalar(leafScales[i] || 1.0);
                        
                        const colorData = leafColors[i];
                        if (colorData && leaf.material) {
                            leaf.material.color.setRGB(colorData.r, colorData.g, colorData.b);
                        }
                    }
                }
            }
            
            // Update fireflies
            plant.updateFirefliesFromFrame(plantFrame);
        });
    }
    
    updateFirefliesFromFrame(frame) {
        const precomp = CastleBioluminescentPlant.precomputedAnimations;
        const fireflyPositions = precomp.frames.fireflyPositions[frame];
        
        if (this.fireflies && fireflyPositions) {
            const positions = this.fireflies.geometry.attributes.position.array;
            fireflyPositions.forEach((pos, i) => {
                const idx = i * 3;
                positions[idx] = pos.x;
                positions[idx + 1] = pos.y;
                positions[idx + 2] = pos.z;
            });
            this.fireflies.geometry.attributes.position.needsUpdate = true;
            this.fireflies.material.uniforms.time.value = precomp.frames.fireflyTime[frame];
        }
        
        if (this.glowMesh) {
            this.glowMesh.scale.setScalar(precomp.frames.glowScale[frame]);
            this.glowMesh.material.uniforms.time.value = precomp.frames.fireflyTime[frame];
        }
    }
    
    // ==================== END PRECOMPUTED ANIMATION SYSTEM ====================


    createPlantStructure() {
        switch (this.plantType) {
            case 'crystal':
                this.createEnhancedCrystalCluster();
                break;
            case 'vine':
                this.createEnhancedVineStructure();
                break;
            case 'moss':
            default:
                this.createEnhancedMossStructure();
                break;
        }
    }

    createEnhancedMossStructure() {
        const stemGroup = new THREE.Group();
        
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0.01),
            new THREE.Vector3(-0.3, 0.6, 0.05),
            new THREE.Vector3(0.25, 1.1, 0.02),
            new THREE.Vector3(-0.15, 1.7, 0.06),
            new THREE.Vector3(0.1, 1.9, 0.04),
            new THREE.Vector3(0.05, 2.0, 0.02),
            new THREE.Vector3(-0.05, 2.05, 0.01),
            new THREE.Vector3(-0.1, 2.0, 0.03),
            new THREE.Vector3(-0.05, 1.95, 0.02)
        ]);
        
        const stemMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.38, 1.0, 0.45),
            transparent: true,
            opacity: 0.95,
            toneMapped: false
        });

        const stemGeometry = new THREE.TubeGeometry(curve, 30, 0.06, 8, false);
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stemGroup.add(stem);
        
        // Create individual node meshes (necessary for proper rendering)
        const nodeCount = 8;
        for (let i = 0.1; i < 0.98; i += 1 / nodeCount) {
            const node = this.createEnhancedGlowingNode(0.08);
            const point = curve.getPoint(i);
            const tangent = curve.getTangent(i);
            node.position.copy(point);
            node.rotation.y = Math.atan2(tangent.x, tangent.z);
            stemGroup.add(node);
            
            this.glowingNodes.push({ 
                node,
                basePosition: point.clone(),
                positionAlongStem: i,
                wavePhase: Math.random() * Math.PI * 2,
                baseScale: 1.0
            });
        }
        
        // Tip node
        const tipNode = this.createEnhancedGlowingNode(0.11);
        const tipPoint = curve.getPoint(0.98);
        tipNode.position.copy(tipPoint);
        stemGroup.add(tipNode);
        
        this.glowingNodes.push({
            node: tipNode,
            basePosition: tipPoint.clone(),
            positionAlongStem: 0.98,
            wavePhase: Math.random() * Math.PI * 2,
            baseScale: 1.3
        });
        
        this.createEnhancedLeafClusters(stemGroup, curve);
        this.createEnhancedMossPatches(stemGroup);
        
        this.plantGroup.add(stemGroup);
    }

    createEnhancedGlowingNode(size = 0.07) {
        const geometry = new THREE.SphereGeometry(size, 8, 6);
        
        const vibrantColors = [
            { h: 0.95, s: 1.0, l: 0.45 }, { h: 0.90, s: 1.0, l: 0.47 },
            { h: 0.85, s: 1.0, l: 0.50 }, { h: 0.80, s: 1.0, l: 0.52 },
            { h: 0.75, s: 1.0, l: 0.55 }, { h: 0.70, s: 1.0, l: 0.50 },
            { h: 0.65, s: 1.0, l: 0.47 }, { h: 0.60, s: 1.0, l: 0.45 },
            { h: 0.55, s: 1.0, l: 0.50 }, { h: 0.52, s: 1.0, l: 0.43 },
            { h: 0.50, s: 1.0, l: 0.47 }, { h: 0.48, s: 1.0, l: 0.52 },
            { h: 0.00, s: 1.0, l: 0.55 }, { h: 0.02, s: 1.0, l: 0.50 },
            { h: 0.97, s: 1.0, l: 0.45 }, { h: 0.92, s: 1.0, l: 0.50 }
        ];
        
        const chosenColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
        
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(chosenColor.h, 1.0, 0.7),
            transparent: true,
            opacity: 0.95,
            toneMapped: false
        });
        
        const node = new THREE.Mesh(geometry, material);
        node.userData.baseSize = size;
        node.userData.baseColor = chosenColor;
        return node;
    }

    createEnhancedLeafClusters(stemGroup, curve) {
        const leafPositions = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9];
        
        leafPositions.forEach(t => {
            const cluster = new THREE.Group();
            const basePoint = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            
            const leafCount = 4 + Math.floor(Math.random() * 3);
            for (let i = 0; i < leafCount; i++) {
                const leaf = this.createEnhancedLeaf();
                const angle = (i / leafCount) * Math.PI * 2 + Math.random() * 0.8 - 0.4;
                const distance = 0.18 + Math.random() * 0.1;
                
                leaf.position.set(
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance * 0.8,
                    (Math.random() - 0.5) * 0.08
                );
                
                leaf.rotation.z = angle;
                leaf.rotation.y = Math.PI / 2;
                leaf.rotation.x = (Math.random() - 0.5) * 0.5;
                
                const baseScale = (0.7 + Math.random() * 0.4) * this.leafExpansionFactor;
                leaf.scale.set(baseScale, baseScale * 0.9, baseScale);
                leaf.userData.baseScale = new THREE.Vector3(baseScale, baseScale * 0.9, baseScale);
                leaf.userData.phase = Math.random() * Math.PI * 2;
                
                cluster.add(leaf);
                this.leaves.push({ 
                    leaf,
                    baseRotation: leaf.rotation.z,
                    bendPhase: Math.random() * Math.PI * 2
                });
            }
            
            cluster.position.copy(basePoint);
            cluster.rotation.y = Math.atan2(tangent.x, tangent.z);
            stemGroup.add(cluster);
        });
    }

    createEnhancedLeaf() {
        const leafShape = new THREE.Shape();
        
        leafShape.moveTo(0, 0);
        leafShape.bezierCurveTo(0.15, 0.08, 0.3, 0.12, 0.45, 0);
        leafShape.bezierCurveTo(0.35, -0.1, 0.2, -0.07, 0.1, -0.03);
        leafShape.bezierCurveTo(0.05, -0.01, 0, 0, 0, 0);
        
        const geometry = new THREE.ShapeGeometry(leafShape);
        
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = Math.sin(x * Math.PI * 3) * 0.04 + Math.cos(y * Math.PI * 2) * 0.02;
            posAttr.setZ(i, z);
        }
        geometry.computeVertexNormals();
        
        const leafMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.52, 1.0, 0.5),
            transparent: true,
            opacity: 0.90,
            side: THREE.DoubleSide,
            toneMapped: false
        });
        
        return new THREE.Mesh(geometry, leafMaterial);
    }

    createEnhancedMossPatches(stemGroup) {
        const patchCount = 8;
        for (let i = 0; i < patchCount; i++) {
            const patch = this.createMossPatch();
            patch.position.set(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 1.8,
                0.03
            );
            patch.rotation.z = Math.random() * Math.PI;
            stemGroup.add(patch);
        }
    }

    createMossPatch() {
        const patchGroup = new THREE.Group();
        const blobCount = 5 + Math.floor(Math.random() * 4);
        
        const mossColors = [
            { h: 0.90, s: 1.0, l: 0.40 }, { h: 0.85, s: 1.0, l: 0.36 },
            { h: 0.88, s: 1.0, l: 0.38 }, { h: 0.92, s: 1.0, l: 0.42 },
            { h: 0.95, s: 1.0, l: 0.44 }
        ];
        const chosenMossColor = mossColors[Math.floor(Math.random() * mossColors.length)];
        
        for (let i = 0; i < blobCount; i++) {
            const size = 0.04 + Math.random() * 0.03;
            const geometry = new THREE.SphereGeometry(size, 7, 7);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(chosenMossColor.h, chosenMossColor.s, chosenMossColor.l),
                emissive: new THREE.Color().setHSL(chosenMossColor.h, 0.9, 0.4),
                emissiveIntensity: 0.6,
                toneMapped: false // Prevent ambient light from affecting emissive color
            });
            
            const blob = new THREE.Mesh(geometry, material);
            blob.position.set(
                (Math.random() - 0.5) * 0.08,
                (Math.random() - 0.5) * 0.08,
                0
            );
            patchGroup.add(blob);
        }
        
        return patchGroup;
    }

    createEnhancedFireflies() {
        const fireflyCount = this.fireflyCount;
        const geometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(fireflyCount * 3);
        const colors = new Float32Array(fireflyCount * 3);
        const sizes = new Float32Array(fireflyCount);
        const phases = new Float32Array(fireflyCount);
        const velocities = new Float32Array(fireflyCount * 3);
        const targets = new Float32Array(fireflyCount * 3);
        const wanderStrengths = new Float32Array(fireflyCount);
        const pulsePhases = new Float32Array(fireflyCount);
        const swarmPhases = new Float32Array(fireflyCount);

        for (let i = 0; i < fireflyCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * this.fireflyArea.x;
            positions[i3 + 1] = Math.random() * this.fireflyArea.y;
            positions[i3 + 2] = (Math.random() - 0.5) * this.fireflyArea.z;
            
            velocities[i3] = (Math.random() - 0.5) * 0.0003;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.0003;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.0003;
            
            targets[i3] = (Math.random() - 0.5) * this.fireflyArea.x;
            targets[i3 + 1] = Math.random() * this.fireflyArea.y;
            targets[i3 + 2] = (Math.random() - 0.5) * this.fireflyArea.z;
            
            // Bright vibrant firefly colors with strong contrast - full color spectrum with lower lightness to avoid white
            const colorChoice = Math.random();
            let hue, saturation, lightness;
            
            if (colorChoice < 0.2) {
                hue = 0.48 + Math.random() * 0.06; // Bright cyan
                saturation = 1.0;
                lightness = 0.62 + Math.random() * 0.08; // Higher contrast
            } else if (colorChoice < 0.4) {
                hue = 0.58 + Math.random() * 0.08; // Electric blue
                saturation = 1.0;
                lightness = 0.60 + Math.random() * 0.08; // Higher contrast
            } else if (colorChoice < 0.6) {
                hue = 0.80 + Math.random() * 0.08; // Bright magenta
                saturation = 1.0;
                lightness = 0.58 + Math.random() * 0.1; // Higher contrast
            } else if (colorChoice < 0.8) {
                hue = 0.90 + Math.random() * 0.05; // Hot pink
                saturation = 1.0;
                lightness = 0.60 + Math.random() * 0.08; // Higher contrast
            } else {
                hue = 0.30 + Math.random() * 0.06; // Lime green for contrast
                saturation = 1.0;
                lightness = 0.58 + Math.random() * 0.08; // Higher contrast
            }
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            sizes[i] = 0.12 + Math.random() * 0.06;
            phases[i] = Math.random() * Math.PI * 2;
            wanderStrengths[i] = 0.05 + Math.random() * 0.15;
            pulsePhases[i] = Math.random() * Math.PI * 2;
            swarmPhases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('target', new THREE.BufferAttribute(targets, 3));
        geometry.setAttribute('wanderStrength', new THREE.BufferAttribute(wanderStrengths, 1));
        geometry.setAttribute('pulsePhase', new THREE.BufferAttribute(pulsePhases, 1));
        geometry.setAttribute('swarmPhase', new THREE.BufferAttribute(swarmPhases, 1));

        const fireflyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createEnhancedFireflyTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float pulsePhase;
                attribute float swarmPhase;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying vec2 vUv;
                
                uniform float time;
                
                void main() {
                    vColor = color;
                    vUv = position.xy;
                    
                    float primaryPulse = sin(time * 1.0 + pulsePhase) * 0.4 + 0.6;
                    float secondaryPulse = sin(time * 0.5 + swarmPhase) * 0.3 + 0.7;
                    float tertiaryPulse = sin(time * 1.5 + pulsePhase * 1.3) * 0.2 + 0.8;
                    float combinedPulse = primaryPulse * secondaryPulse * tertiaryPulse;
                    
                    vAlpha = 0.9 + combinedPulse * 0.1;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    float pulseSize = size * (1.4 + combinedPulse * 0.6);
                    
                    gl_PointSize = pulseSize * (130.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                varying float vAlpha;
                varying vec2 vUv;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    float fresnel = 1.0 - smoothstep(0.0, 0.5, dist);
                    fresnel = pow(fresnel, 0.4);
                    
                    float coreGlow = 1.0 - smoothstep(0.0, 0.15, dist);
                    float midGlow = 1.0 - smoothstep(0.15, 0.38, dist);
                    float outerGlow = 1.0 - smoothstep(0.38, 0.5, dist);
                    
                    // Keep the actual color without excessive brightening
                    vec3 glowColor = vColor;
                    
                    float alpha = (coreGlow * 1.2 + midGlow * 0.8 + outerGlow * 0.4 + fresnel * 0.5) * vAlpha;
                    vec3 finalColor = glowColor * (1.0 + coreGlow * 0.5 + midGlow * 0.3);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false // Prevent ambient light from affecting firefly colors
        });

        if (!fireflyMaterial || !fireflyMaterial.uniforms) {
            console.error('Failed to create firefly material');
            return;
        }

        this.fireflies = new THREE.Points(geometry, fireflyMaterial);
        this.plantGroup.add(this.fireflies);
    }

    createEnhancedMagicParticles() {
        const geometry = new THREE.BufferGeometry();
        const particleCount = this.magicParticleCount;
        
        const positions = new Float32Array(particleCount * 3 * this.magicTrailLength);
        const colors = new Float32Array(particleCount * 3 * this.magicTrailLength);
        const sizes = new Float32Array(particleCount * this.magicTrailLength);
        const phases = new Float32Array(particleCount);
        const lifetimes = new Float32Array(particleCount);
        const homeNodes = new Float32Array(particleCount);
        const trailProgress = new Float32Array(particleCount * this.magicTrailLength);

        for (let i = 0; i < particleCount; i++) {
            const homeNodeIndex = this.glowingNodes.length > 0 ? Math.floor(Math.random() * this.glowingNodes.length) : 0;
            homeNodes[i] = homeNodeIndex;
            lifetimes[i] = 2.5 + Math.random() * 4;
            phases[i] = Math.random() * Math.PI * 2;
            
            for (let trailIndex = 0; trailIndex < this.magicTrailLength; trailIndex++) {
                const baseIndex = (i * this.magicTrailLength + trailIndex) * 3;
                const progress = trailIndex / (this.magicTrailLength - 1);
                
                if (this.glowingNodes.length > 0) {
                    const node = this.glowingNodes[homeNodeIndex];
                    positions[baseIndex] = node.basePosition.x + (Math.random() - 0.5) * 0.15;
                    positions[baseIndex + 1] = node.basePosition.y + Math.random() * 0.3;
                    positions[baseIndex + 2] = node.basePosition.z + (Math.random() - 0.5) * 0.08;
                }
                
                // Ultra vibrant particle colors
                const hue = 0.45 + Math.random() * 0.3;
                const saturation = 1.0; // Full saturation
                const lightness = 0.8 + Math.random() * 0.2; // Much brighter
                const color = new THREE.Color().setHSL(hue, saturation, lightness);
                
                colors[baseIndex] = color.r;
                colors[baseIndex + 1] = color.g;
                colors[baseIndex + 2] = color.b;
                
                sizes[i * this.magicTrailLength + trailIndex] = 0.02 * (1 - progress * 0.4); // Larger particles
                trailProgress[i * this.magicTrailLength + trailIndex] = progress;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        geometry.setAttribute('homeNode', new THREE.BufferAttribute(homeNodes, 1));
        geometry.setAttribute('trailProgress', new THREE.BufferAttribute(trailProgress, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                trailLength: { value: this.magicTrailLength }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float phase;
                attribute float trailProgress;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying float vTrailProgress;
                
                uniform float time;
                uniform float trailLength;
                
                void main() {
                    vColor = color;
                    vTrailProgress = trailProgress;
                    
                    vAlpha = (1.0 - trailProgress) * (0.7 + sin(time * 2.5 + phase) * 0.5); // Brighter
                    
                    vec3 pos = position;
                    pos.y += sin(time * 2.0 + phase) * 0.03;
                    pos.x += cos(time * 1.5 + phase) * 0.02;
                    pos.z += sin(time * 1.8 + phase * 1.2) * 0.015;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (65.0 / -mvPosition.z) * (1.0 + sin(time * 4.0 + phase) * 0.6); // Larger and more dynamic
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                varying float vTrailProgress;
                
                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if (dist > 0.5) discard;
                    
                    float innerGlow = 1.0 - smoothstep(0.0, 0.2, dist);
                    float midGlow = 1.0 - smoothstep(0.2, 0.4, dist);
                    float outerGlow = 1.0 - smoothstep(0.4, 0.5, dist);
                    
                    float trailFactor = 1.0 - vTrailProgress * 0.6;
                    float alpha = (innerGlow * 1.5 + midGlow * 1.0 + outerGlow * 0.6) * vAlpha * trailFactor; // Brighter
                    
                    vec3 finalColor = vColor * (1.5 + innerGlow * 1.5 * (1.0 - vTrailProgress)); // Much brighter
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.magicParticles = new THREE.Points(geometry, material);
        this.plantGroup.add(this.magicParticles);
    }

    createColoredIllumination() {
        // Disabled - no longer creating colored glow planes
    }

    createAmbientGlow() {
        // OPTIMIZED: Reduced from 32x32 to 16x16 segments (75% fewer vertices) and size 4.0 to 3.0
        const glowGeometry = new THREE.SphereGeometry(3.0, 16, 16);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0xff00ff) } // Bright magenta
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float intensity = 0.5 + sin(time * 0.6) * 0.3; // Higher intensity
                    float distance = length(vPosition);
                    float falloff = 1.0 - smoothstep(0.8, 4.0, distance); // Larger range
                    
                    float hueShift = sin(time * 0.3) * 0.1; // More color variation
                    vec3 shiftedColor = baseColor * 1.5 + vec3(hueShift * 0.2, hueShift * 0.1, -hueShift * 0.1);
                    
                    vec3 glowColor = shiftedColor * intensity * falloff;
                    gl_FragColor = vec4(glowColor, 0.2 * falloff); // More opacity
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 1.0, 0);
        this.plantGroup.add(glow);
        this.glowMesh = glow;
    }



    update(deltaTime) {
        if (!this._mounted) return;

        const time = CastleBioluminescentPlant.sharedClock.getElapsedTime();
        const precomp = CastleBioluminescentPlant.precomputedAnimations;
        
        // PERFORMANCE: Auto-assign master if none exists
        if (!CastleBioluminescentPlant.masterPlant && CastleBioluminescentPlant.instanceCount > 0) {
            this.isMasterPlant = true;
            CastleBioluminescentPlant.masterPlant = this;
            if (!precomp.isRecorded && !precomp.isRecording) {
                this.startRecording();
            }
        }
        
        // ========== RECORDING MODE (Master plant only, first 3 seconds) ==========
        if (precomp.isRecording) {
            // 🚀 NON-MASTER PLANTS DO NOTHING during recording
            if (!this.isMasterPlant) {
                return;
            }
            
            // ONLY MASTER PLANT records
            this.animationState.time = time;
            this.animationState.breath = Math.sin(time * 0.5) * 0.25 + 0.75;
            this.animationState.sway = Math.sin(time * 0.4) * 0.08;
            this.animationState.colorShift = time * 0.15;
            this.animationState.lightWave = time * this.lightWaveSpeed;
            
            // Pulse timing
            if (time > this.nextPulseTime) {
                this.animationState.pulse = 1.0;
                this.nextPulseTime = time + this.pulseInterval + (Math.random() * 2 - 1);
            } else {
                this.animationState.pulse = Math.max(0, this.animationState.pulse - deltaTime * 2.0);
            }
            
            // Animate fireflies and record
            this.animateFireflies(time, deltaTime);
            this.plantGroup.rotation.z = this.animationState.sway * 0.05;
            
            if (this.glowMesh) {
                this.glowMesh.material.uniforms.time.value = time;
                const glowPulse = Math.sin(time * 0.6) * 0.15 + Math.sin(time * 1.2) * 0.1;
                this.glowMesh.scale.setScalar(1.0 + glowPulse);
            }
            
            this.updateAmbientLight(time);
            
            // Record this frame
            this.recordCurrentFrame(time);
            
            // Advance playback frame counter during recording
            if (precomp.recordingFrame > 0) {
                precomp.playbackFrame = (precomp.playbackFrame + 1) % precomp.recordingFrame;
            }
            return;
        }
        
        // ========== PLAYBACK MODE (Master plant updates all instances) ==========
        if (precomp.isRecorded) {
            if (this.isMasterPlant) {
                // MASTER ONLY: Play back all plants and advance frame counter
                this.playbackFrame();
                precomp.playbackFrame = (precomp.playbackFrame + 1) % precomp.totalFrames;
            }
            // Non-master plants do nothing - instancing handles everything
            return;
        }
    }

    updateAmbientLight(time) {
        // 🚀 OPTIMIZATION: Only master plant has lights
        if (!this.ambientLight || !this.isMasterPlant) return;
        
        // Single light pulsing
        this.ambientLight.children.forEach((child) => {
            if (child.isPointLight) {
                const pulse = Math.sin(time * 0.8) * 0.3 + 0.7;
                const flicker = Math.sin(time * 15) * 0.05 + Math.sin(time * 23) * 0.03;
                child.intensity = 18 * pulse * (1 + flicker);
            }
        });
    }

    animateFireflies(time, deltaTime) {
        if (!this.fireflies || !this.fireflies.material || !this.fireflies.material.uniforms) {
            console.warn('Fireflies not ready for animation');
            return;
        }
        
        const positions = this.fireflies.geometry.attributes.position.array;
        const velocities = this.fireflies.geometry.attributes.velocity.array;
        const targets = this.fireflies.geometry.attributes.target.array;
        const wanderStrengths = this.fireflies.geometry.attributes.wanderStrength.array;
        const swarmPhases = this.fireflies.geometry.attributes.swarmPhase.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const fireflyIndex = i / 3;
            const wanderStrength = wanderStrengths[fireflyIndex];
            
            this._fireflyCurrentPos.set(positions[i], positions[i + 1], positions[i + 2]);
            this._fireflyCurrentTarget.set(targets[i], targets[i + 1], targets[i + 2]);
            
            this._fireflyToTarget.subVectors(this._fireflyCurrentTarget, this._fireflyCurrentPos);
            const distanceToTarget = this._fireflyToTarget.length();
            
            // Pick new target more often to prevent standing still
            if (distanceToTarget < 0.3 || Math.random() < 0.008 * wanderStrength) {
                targets[i] = (Math.random() - 0.5) * this.fireflyArea.x;
                targets[i + 1] = Math.random() * this.fireflyArea.y * 1.3; // Increased height variation
                targets[i + 2] = (Math.random() - 0.5) * this.fireflyArea.z;
            } else {
                this._fireflyToTarget.normalize();
                
                // Vary speed based on height for more natural movement
                const heightFactor = positions[i + 1] / this.fireflyArea.y;
                const speedMultiplier = 0.8 + heightFactor * 0.4; // Faster at top
                
                // More pronounced wandering to prevent stopping
                const wanderX = (Math.random() - 0.5) * 0.012 * wanderStrength;
                const wanderY = (Math.random() - 0.5) * 0.012 * wanderStrength;
                const wanderZ = (Math.random() - 0.5) * 0.012 * wanderStrength;
                
                velocities[i] = this._fireflyToTarget.x * this.fireflySpeed * deltaTime * 12 * speedMultiplier + wanderX;
                velocities[i + 1] = this._fireflyToTarget.y * this.fireflySpeed * deltaTime * 12 * speedMultiplier + wanderY;
                velocities[i + 2] = this._fireflyToTarget.z * this.fireflySpeed * deltaTime * 12 * speedMultiplier + wanderZ;
                
                const speed = Math.sqrt(
                    velocities[i] * velocities[i] + 
                    velocities[i + 1] * velocities[i + 1] + 
                    velocities[i + 2] * velocities[i + 2]
                );
                
                if (speed > 0.012) {
                    velocities[i] *= 0.012 / speed;
                    velocities[i + 1] *= 0.012 / speed;
                    velocities[i + 2] *= 0.012 / speed;
                }
                
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];
            }
            
            this.applySwarmBehavior(i, positions, velocities, swarmPhases[fireflyIndex], time);
            
            if (Math.abs(positions[i]) > this.fireflyArea.x / 2) {
                positions[i] = Math.sign(positions[i]) * this.fireflyArea.x / 2;
                velocities[i] *= -0.3;
            }
            
            if (positions[i + 1] < 0 || positions[i + 1] > this.fireflyArea.y) {
                positions[i + 1] = THREE.MathUtils.clamp(positions[i + 1], 0, this.fireflyArea.y);
                velocities[i + 1] *= -0.3;
            }
            
            if (Math.abs(positions[i + 2]) > this.fireflyArea.z / 2) {
                positions[i + 2] = Math.sign(positions[i + 2]) * this.fireflyArea.z / 2;
                velocities[i + 2] *= -0.3;
            }
        }
        
        this.fireflies.geometry.attributes.position.needsUpdate = true;
        this.fireflies.geometry.attributes.target.needsUpdate = true;
        this.fireflies.geometry.attributes.velocity.needsUpdate = true;
        this.fireflies.material.uniforms.time.value = time;
    }

    applySwarmBehavior(index, positions, velocities, swarmPhase, time) {
        const separation = new THREE.Vector3();
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        let separationCount = 0;
        let alignmentCount = 0;
        let cohesionCount = 0;

        const currentPos = new THREE.Vector3(positions[index], positions[index + 1], positions[index + 2]);
        const currentVel = new THREE.Vector3(velocities[index], velocities[index + 1], velocities[index + 2]);

        for (let j = 0; j < positions.length; j += 3) {
            if (j === index) continue;
            
            const otherPos = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
            const distance = currentPos.distanceTo(otherPos);
            
            if (distance < this.boids.perception) {
                if (distance < this.boids.perception * 0.4) {
                    const avoid = new THREE.Vector3().subVectors(currentPos, otherPos).normalize().divideScalar(distance * 2);
                    separation.add(avoid);
                    separationCount++;
                }
                
                const otherVel = new THREE.Vector3(velocities[j], velocities[j + 1], velocities[j + 2]);
                alignment.add(otherVel);
                alignmentCount++;
                
                cohesion.add(otherPos);
                cohesionCount++;
            }
        }

        if (separationCount > 0) {
            separation.divideScalar(separationCount).normalize().multiplyScalar(this.boids.separation);
            velocities[index] += separation.x;
            velocities[index + 1] += separation.y;
            velocities[index + 2] += separation.z;
        }

        if (alignmentCount > 0) {
            alignment.divideScalar(alignmentCount).normalize().multiplyScalar(this.boids.alignment);
            velocities[index] += alignment.x;
            velocities[index + 1] += alignment.y;
            velocities[index + 2] += alignment.z;
        }

        if (cohesionCount > 0) {
            cohesion.divideScalar(cohesionCount).sub(currentPos).normalize().multiplyScalar(this.boids.cohesion);
            velocities[index] += cohesion.x;
            velocities[index + 1] += cohesion.y;
            velocities[index + 2] += cohesion.z;
        }
    }

    updateEnhancedMagicParticles(time) {
        if (!this.magicParticles || this.glowingNodes.length === 0) return;
        
        const positions = this.magicParticles.geometry.attributes.position.array;
        const phases = this.magicParticles.geometry.attributes.phase.array;
        const lifetimes = this.magicParticles.geometry.attributes.lifetime.array;
        const homeNodes = this.magicParticles.geometry.attributes.homeNode.array;
        
        for (let i = 0; i < this.magicParticleCount; i++) {
            const homeNodeIndex = Math.floor(homeNodes[i]);
            if (homeNodeIndex >= this.glowingNodes.length) continue;
            
            const node = this.glowingNodes[homeNodeIndex];
            const phase = phases[i];
            let lifetime = lifetimes[i];
            
            lifetime -= 0.016;
            
            if (lifetime <= 0) {
                lifetime = 2.5 + Math.random() * 4;
                homeNodes[i] = Math.floor(Math.random() * this.glowingNodes.length);
            }
            
            lifetimes[i] = lifetime;
            
            const lifeRatio = 1.0 - (lifetime / (2.5 + Math.random() * 4));
            
            for (let trailIndex = 0; trailIndex < this.magicTrailLength; trailIndex++) {
                const baseIndex = (i * this.magicTrailLength + trailIndex) * 3;
                const trailLife = lifeRatio - (trailIndex * 0.08);
                
                if (trailLife >= 0) {
                    const nodePos = node.node.position;
                    const riseHeight = 1.2 + Math.random() * 0.8;
                    const spiralRadius = 0.1 + trailLife * 0.2;
                    const spiralAngle = time * 3 + phase + trailIndex * 0.5;
                    
                    positions[baseIndex] = nodePos.x + Math.cos(spiralAngle) * spiralRadius;
                    positions[baseIndex + 1] = nodePos.y + trailLife * riseHeight;
                    positions[baseIndex + 2] = nodePos.z + Math.sin(spiralAngle) * spiralRadius;
                }
            }
        }
        
        this.magicParticles.geometry.attributes.position.needsUpdate = true;
        this.magicParticles.geometry.attributes.lifetime.needsUpdate = true;
        this.magicParticles.geometry.attributes.homeNode.needsUpdate = true;
        this.magicParticles.material.uniforms.time.value = time;
    }

    unmount(scene) {
        if (this.plantGroup) {
            scene.remove(this.plantGroup);
            this.cleanupMesh(this.plantGroup);
        }
        
        // Remove this plant from the global list
        const index = CastleBioluminescentPlant.allPlants.indexOf(this);
        if (index > -1) {
            CastleBioluminescentPlant.allPlants.splice(index, 1);
        }
        
        // Decrease instance count
        CastleBioluminescentPlant.instanceCount--;
        
        // If this was the master plant, clean up global resources
        if (this.isMasterPlant) {
            if (CastleBioluminescentPlant.nodeInstancedMesh) {
                scene.remove(CastleBioluminescentPlant.nodeInstancedMesh);
                CastleBioluminescentPlant.nodeInstancedMesh.geometry.dispose();
                CastleBioluminescentPlant.nodeInstancedMesh.material.dispose();
                CastleBioluminescentPlant.nodeInstancedMesh = null;
            }
            
            if (CastleBioluminescentPlant.leafInstancedMesh) {
                scene.remove(CastleBioluminescentPlant.leafInstancedMesh);
                CastleBioluminescentPlant.leafInstancedMesh.geometry.dispose();
                CastleBioluminescentPlant.leafInstancedMesh.material.dispose();
                CastleBioluminescentPlant.leafInstancedMesh = null;
            }
            
            CastleBioluminescentPlant.masterPlant = null;
            CastleBioluminescentPlant.totalNodeInstances = 0;
            CastleBioluminescentPlant.totalLeafInstances = 0;
            
            // Reset precomputed animations if all plants are removed
            if (CastleBioluminescentPlant.allPlants.length === 0) {
                CastleBioluminescentPlant.precomputedAnimations.isRecorded = false;
                CastleBioluminescentPlant.precomputedAnimations.isRecording = false;
            }
        }
        
        this._mounted = false;
    }

    cleanupMesh(mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(material => material.dispose());
            } else {
                mesh.material.dispose();
            }
        }
        if (mesh.children) {
            mesh.children.forEach(child => this.cleanupMesh(child));
        }
    }

    createEnhancedCrystalCluster() {
        // Implementation for crystal plant type
        const crystalGroup = new THREE.Group();
        this.plantGroup.add(crystalGroup);
    }

    createEnhancedVineStructure() {
        // Implementation for vine plant type  
        const vineGroup = new THREE.Group();
        this.plantGroup.add(vineGroup);
    }
}