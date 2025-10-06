import * as THREE from 'three';

class LightComponent {
    constructor(props = {}) {
        this.props = props;
        this._mounted = false;
    }
}

export class CastleBioluminescentPlant extends LightComponent {
    static sharedClock = new THREE.Clock(true);

    constructor(props = {}) {
        super(props);
        this.basePosition = new THREE.Vector3().fromArray(props.position || [0, 0, 0]);
        this.plantGroup = null;
        this.fireflies = null;
        this.glowingNodes = [];
        this.leaves = [];
        
        // Pure vibrant color palette
        this.colorHSL = {
            deepCyan: { h: 0.55, s: 1.0, l: 0.7 },
            emerald: { h: 0.4, s: 1.0, l: 0.7 },
            mysticTeal: { h: 0.5, s: 1.0, l: 0.7 },
            crystalBlue: { h: 0.58, s: 1.0, l: 0.7 }
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
        
        this.fireflyCount = props.fireflyCount || 60;
        this.fireflySpeed = 0.03;
        this.fireflyArea = props.fireflyArea || { x: 4.0, y: 4.0, z: 2.5 };

        this.magicParticleCount = 120;
        this.magicTrailLength = 4;

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

        // REMOVED all white light properties
        this.plantGlowIntensity = props.plantGlowIntensity || 3.0;
    }

    async loadTextures() {
        this.normalMap = this.createProceduralNormalMap();
        this.roughnessMap = this.createProceduralRoughnessMap();
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
        
        // Pure cyan-blue-green gradient - NO WHITE!
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(100, 255, 255, 1)');
        gradient.addColorStop(0.05, 'rgba(80, 255, 220, 0.95)');
        gradient.addColorStop(0.2, 'rgba(60, 220, 180, 0.8)');
        gradient.addColorStop(0.5, 'rgba(40, 180, 140, 0.5)');
        gradient.addColorStop(0.8, 'rgba(20, 140, 100, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 100, 80, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        return new THREE.CanvasTexture(canvas);
    }

    async mount(scene) {
        await this.loadTextures();
        
        this.plantGroup = new THREE.Group();
        this.plantGroup.position.copy(this.basePosition);
        
        this.createPlantStructure();
        this.createEnhancedFireflies();
        this.createEnhancedMagicParticles();
        this.createColoredIllumination(); // REPLACED createPlantGlowLights
        this.createAmbientGlow();
        this.createWallLightProjection();
        
        scene.add(this.plantGroup);
        this._mounted = true;
    }

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
        
        // PURE colored materials - NO LIGHTS!
        const stemMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color().setHSL(0.52, 1.0, 0.15),
            emissive: new THREE.Color().setHSL(0.50, 1.0, 0.4), // BRIGHT emissive only
            emissiveIntensity: 4.0, // High emissive = no need for lights
            roughness: 0.9,
            metalness: 0.0,
            normalMap: this.normalMap,
            normalScale: new THREE.Vector2(0.5, 0.5),
            transparent: true,
            opacity: 0.95,
            transmission: 0.05,
            thickness: 0.8
        });

        const stemGeometry = new THREE.TubeGeometry(curve, 60, 0.06, 20, false);
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stemGroup.add(stem);
        
        const nodeCount = 18;
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
        
        this.createEnhancedLeafClusters(stemGroup, curve);
        this.createEnhancedMossPatches(stemGroup);
        
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
        
        this.plantGroup.add(stemGroup);
    }

    createEnhancedGlowingNode(size = 0.07) {
        const geometry = new THREE.SphereGeometry(size, 16, 14);
        
        const vibrantColors = [
            { h: 0.78, s: 1.0, l: 0.2 }, { h: 0.82, s: 1.0, l: 0.18 },
            { h: 0.60, s: 1.0, l: 0.22 }, { h: 0.55, s: 1.0, l: 0.25 },
            { h: 0.52, s: 1.0, l: 0.28 }, { h: 0.48, s: 1.0, l: 0.24 },
            { h: 0.45, s: 1.0, l: 0.22 }, { h: 0.40, s: 1.0, l: 0.20 },
            { h: 0.35, s: 1.0, l: 0.24 }, { h: 0.30, s: 1.0, l: 0.18 },
            { h: 0.25, s: 1.0, l: 0.22 }, { h: 0.15, s: 1.0, l: 0.26 },
            { h: 0.08, s: 1.0, l: 0.28 }, { h: 0.05, s: 1.0, l: 0.24 },
            { h: 0.95, s: 1.0, l: 0.20 }, { h: 0.88, s: 1.0, l: 0.24 }
        ];
        
        const chosenColor = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
        
        // HIGH EMISSIVE materials - NO LIGHTS NEEDED!
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color().setHSL(chosenColor.h, chosenColor.s, chosenColor.l),
            emissive: new THREE.Color().setHSL(chosenColor.h, 1.0, 0.5), // VERY bright emissive
            emissiveIntensity: 6.0, // Extremely high - creates own light
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.98,
            transmission: 0.02,
            thickness: size * 6,
            ior: 1.3
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
        
        // HIGH EMISSIVE leaves - NO LIGHTS!
        const leafMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color().setHSL(0.30, 1.0, 0.15),
            emissive: new THREE.Color().setHSL(0.28, 1.0, 0.4),
            emissiveIntensity: 4.5,
            roughness: 0.9,
            metalness: 0.0,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            normalMap: this.normalMap,
            normalScale: new THREE.Vector2(0.2, 0.2),
            transmission: 0.03,
            thickness: 0.25
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
            { h: 0.35, s: 1.0, l: 0.20 }, { h: 0.30, s: 1.0, l: 0.16 },
            { h: 0.28, s: 1.0, l: 0.18 }, { h: 0.45, s: 1.0, l: 0.22 },
            { h: 0.50, s: 1.0, l: 0.24 }
        ];
        const chosenMossColor = mossColors[Math.floor(Math.random() * mossColors.length)];
        
        for (let i = 0; i < blobCount; i++) {
            const size = 0.04 + Math.random() * 0.03;
            const geometry = new THREE.SphereGeometry(size, 7, 7);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(chosenMossColor.h, chosenMossColor.s, chosenMossColor.l),
                emissive: new THREE.Color().setHSL(chosenMossColor.h, 0.9, 0.3),
                emissiveIntensity: 2.5
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
            
            // Pure colored fireflies
            const hueChoice = Math.random();
            let hue, saturation, lightness;
            
            if (hueChoice < 0.5) {
                hue = 0.50 + Math.random() * 0.05;
                saturation = 1.0;
                lightness = 0.45 + Math.random() * 0.08;
            } else {
                hue = 0.45 + Math.random() * 0.08;
                saturation = 1.0;
                lightness = 0.42 + Math.random() * 0.08;
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
                    
                    vec3 glowColor = vColor * 2.0;
                    glowColor = mix(glowColor, vec3(0.3, 1.0, 1.0), coreGlow * 0.5);
                    
                    float alpha = (coreGlow * 1.8 + midGlow * 1.2 + outerGlow * 0.6 + fresnel * 0.9) * vAlpha;
                    vec3 finalColor = glowColor * (1.5 + coreGlow * 2.5 + midGlow * 1.2 + fresnel * 0.8);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
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
                
                const hue = 0.45 + Math.random() * 0.3;
                const saturation = 0.9 + Math.random() * 0.1;
                const lightness = 0.7 + Math.random() * 0.25;
                const color = new THREE.Color().setHSL(hue, saturation, lightness);
                
                colors[baseIndex] = color.r;
                colors[baseIndex + 1] = color.g;
                colors[baseIndex + 2] = color.b;
                
                sizes[i * this.magicTrailLength + trailIndex] = 0.015 * (1 - progress * 0.4);
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
                    
                    vAlpha = (1.0 - trailProgress) * (0.5 + sin(time * 2.5 + phase) * 0.4);
                    
                    vec3 pos = position;
                    pos.y += sin(time * 2.0 + phase) * 0.03;
                    pos.x += cos(time * 1.5 + phase) * 0.02;
                    pos.z += sin(time * 1.8 + phase * 1.2) * 0.015;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (55.0 / -mvPosition.z) * (1.0 + sin(time * 4.0 + phase) * 0.4);
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
                    float alpha = (innerGlow * 1.2 + midGlow * 0.8 + outerGlow * 0.4) * vAlpha * trailFactor;
                    
                    vec3 finalColor = vColor * (1.0 + innerGlow * 1.0 * (1.0 - vTrailProgress));
                    
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
        // COMPLETELY REMOVED all Three.js lights
        // We only use high-emissive materials and particles for illumination
        
        console.log("Using pure emissive materials - NO white lights created");
        
        // Create additional colored glow planes for area illumination
        this.createColoredGlowPlanes();
    }

    createColoredGlowPlanes() {
        // Create colored glow planes that act as area lights but are pure color
        const glowPlaneGeometry = new THREE.PlaneGeometry(3, 3);
        
        // Multiple colored glow planes
        const glowColors = [
            { h: 0.55, s: 1.0, l: 0.3 }, // Cyan
            { h: 0.45, s: 1.0, l: 0.25 }, // Teal  
            { h: 0.35, s: 1.0, l: 0.2 },  // Green
            { h: 0.65, s: 1.0, l: 0.25 }  // Blue
        ];
        
        glowColors.forEach((color, index) => {
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    baseColor: { value: new THREE.Color().setHSL(color.h, color.s, color.l) },
                    intensity: { value: 0.8 + Math.random() * 0.4 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 baseColor;
                    uniform float intensity;
                    varying vec2 vUv;
                    
                    void main() {
                        vec2 center = vec2(0.5, 0.5);
                        float dist = distance(vUv, center);
                        float gradient = 1.0 - smoothstep(0.0, 0.7, dist);
                        
                        float pulse = sin(time * 0.3 + float(${index}) * 1.5) * 0.3 + 0.7;
                        float alpha = gradient * pulse * intensity;
                        
                        vec3 color = baseColor * alpha * 1.5;
                        gl_FragColor = vec4(color, alpha * 0.4);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const glowPlane = new THREE.Mesh(glowPlaneGeometry, glowMaterial);
            glowPlane.position.set(
                (Math.random() - 0.5) * 1.5,
                1.0 + (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 1.0
            );
            glowPlane.rotation.x = Math.PI / 2;
            this.plantGroup.add(glowPlane);
        });
    }

    createAmbientGlow() {
        // Pure colored volumetric glow - NO WHITE!
        const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0x004444) } // Dark cyan
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
                    float intensity = 0.3 + sin(time * 0.6) * 0.15;
                    float distance = length(vPosition);
                    float falloff = 1.0 - smoothstep(0.8, 3.5, distance);
                    
                    float hueShift = sin(time * 0.3) * 0.08;
                    vec3 shiftedColor = baseColor + vec3(hueShift * 0.1, hueShift * 0.05, -hueShift * 0.05);
                    
                    vec3 glowColor = shiftedColor * intensity * falloff;
                    gl_FragColor = vec4(glowColor, 0.15 * falloff);
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

    createWallLightProjection() {
        // Pure colorful light projection
        const projectionGeometry = new THREE.PlaneGeometry(8, 8);
        const projectionMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                plantPos: { value: new THREE.Vector3(0, 1, 0) },
                baseColor: { value: new THREE.Color(0x006666) } // Dark cyan
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 plantPos;
                uniform vec3 baseColor;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    float gradient = 1.0 - smoothstep(0.0, 0.8, dist);
                    
                    float pulse = sin(time * 0.6) * 0.3 + 0.7;
                    
                    float hueShift = sin(time * 0.3 + dist * 3.0) * 0.1;
                    vec3 shiftedColor = baseColor * 1.5 + vec3(hueShift * 0.15, hueShift * 0.1, -hueShift * 0.05);
                    
                    float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) * 0.06;
                    
                    float alpha = gradient * pulse + noise;
                    alpha *= 0.6;
                    
                    vec3 color = shiftedColor * alpha;
                    gl_FragColor = vec4(color, alpha * 0.7);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const projection = new THREE.Mesh(projectionGeometry, projectionMaterial);
        projection.position.set(0, 1, -1.2);
        projection.rotation.x = Math.PI / 2;
        this.plantGroup.add(projection);
        this.wallProjection = projection;
    }

    update(deltaTime) {
        if (!this._mounted) return;

        const time = CastleBioluminescentPlant.sharedClock.getElapsedTime();
        this.animationState.time = time;
        this.animationState.colorShift = time * 0.15;
        this.animationState.lightWave = time * this.lightWaveSpeed;
        
        this.animationState.breath = Math.sin(time * 0.5) * 0.25 + 0.75;
        this.animationState.sway = Math.sin(time * 0.4) * 0.08;
        
        if (time > this.nextPulseTime) {
            this.animationState.pulse = 1.0;
            this.nextPulseTime = time + this.pulseInterval + (Math.random() * 2 - 1);
        } else {
            this.animationState.pulse = Math.max(0, this.animationState.pulse - deltaTime * 2.0);
        }
        
        this.updateGlowingNodes(time);
        this.updateLeaves(time);
        this.animateFireflies(time, deltaTime);
        this.updateEnhancedMagicParticles(time);
        // REMOVED updateNodeLights - no lights to update!
        
        this.plantGroup.rotation.z = this.animationState.sway * 0.05;
        
        if (this.glowMesh) {
            this.glowMesh.material.uniforms.time.value = time;
        }
        
        if (this.wallProjection) {
            this.wallProjection.material.uniforms.time.value = time;
        }
    }

    updateGlowingNodes(time) {
        this.glowingNodes.forEach((nodeData, index) => {
            const node = nodeData.node;
            const basePos = nodeData.basePosition;
            const positionAlongStem = nodeData.positionAlongStem;
            const wavePhase = nodeData.wavePhase;
            const baseScale = nodeData.baseScale;
            
            const waveOffset = Math.sin(this.animationState.lightWave - positionAlongStem * 5 + wavePhase) * 0.025;
            const sideWave = Math.cos(this.animationState.lightWave * 1.3 - positionAlongStem * 3 + wavePhase) * 0.01;
            node.position.y = basePos.y + waveOffset;
            node.position.x = basePos.x + sideWave;
            
            const floatOffset = Math.sin(time * 1.2 + index * 0.8) * 0.012;
            node.position.y += floatOffset;
            
            // Keep pure vibrant colors
            const baseColor = node.userData.baseColor;
            if (baseColor) {
                const hueShift = baseColor.h + Math.sin(time * 0.5 + index * 0.7) * 0.05;
                const saturation = 1.0;
                const lightness = 0.5 + Math.sin(time * 0.8 + positionAlongStem * 3) * 0.1;
                
                const color = new THREE.Color().setHSL(hueShift, saturation, lightness);
                node.material.emissive = color;
            }
            
            const wavePulse = Math.sin(this.animationState.lightWave * 3 - positionAlongStem * 8 + wavePhase) * 0.4 + 0.6;
            const basePulse = this.animationState.pulse > 0.1 ? 
                Math.sin(time * 12 + index) * this.animationState.pulse * 0.3 : 0;
            
            const intensity = (this.animationState.breath + basePulse) * wavePulse;
            if (node.material.emissiveIntensity !== undefined) {
                node.material.emissiveIntensity = 4.0 + intensity * 2.0;
            }

            const pulseSize = 1.0 + Math.sin(this.animationState.lightWave * 4 - positionAlongStem * 7) * 0.3;
            node.scale.setScalar(baseScale * pulseSize);
        });
    }

    updateLeaves(time) {
        this.leaves.forEach((leafData, index) => {
            const leaf = leafData.leaf;
            const baseRotation = leafData.baseRotation;
            
            const baseScale = leaf.userData.baseScale;
            if (!baseScale) {
                leaf.userData.baseScale = new THREE.Vector3().copy(leaf.scale);
                return;
            }
            
            const rustle = Math.sin(time * 2.0 + index * 0.5) * 0.12;
            const gentleSway = Math.sin(time * 0.7 + index * 0.3) * 0.05;
            leaf.rotation.z = baseRotation + rustle;
            leaf.rotation.x += gentleSway * 0.1;
            
            const phase = leaf.userData.phase || 0;
            const primaryPulse = 1.0 + Math.sin(time * this.leafPulseSpeed + phase) * this.leafPulseAmplitude;
            const secondaryPulse = 1.0 + Math.sin(time * this.leafPulseSpeed * 1.7 + phase * 1.3) * (this.leafPulseAmplitude * 0.3);
            const pulse = primaryPulse * secondaryPulse;
            
            leaf.scale.set(
                baseScale.x * pulse,
                baseScale.y * pulse, 
                baseScale.z * pulse
            );
            
            // PURE green leaf color
            const greenShift = 0.28 + Math.sin(time * 0.3 + index) * 0.08;
            leaf.material.emissive.setHSL(greenShift, 1.0, 0.4);
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
            
            const currentPos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            const currentTarget = new THREE.Vector3(targets[i], targets[i + 1], targets[i + 2]);
            
            const toTarget = new THREE.Vector3().subVectors(currentTarget, currentPos);
            const distanceToTarget = toTarget.length();
            
            if (distanceToTarget < 0.2 || Math.random() < 0.002 * wanderStrength) {
                targets[i] = (Math.random() - 0.5) * this.fireflyArea.x;
                targets[i + 1] = Math.random() * this.fireflyArea.y;
                targets[i + 2] = (Math.random() - 0.5) * this.fireflyArea.z;
            } else {
                toTarget.normalize();
                
                const wanderX = (Math.random() - 0.5) * 0.005 * wanderStrength;
                const wanderY = (Math.random() - 0.5) * 0.005 * wanderStrength;
                const wanderZ = (Math.random() - 0.5) * 0.005 * wanderStrength;
                
                velocities[i] = toTarget.x * this.fireflySpeed * deltaTime * 12 + wanderX;
                velocities[i + 1] = toTarget.y * this.fireflySpeed * deltaTime * 12 + wanderY;
                velocities[i + 2] = toTarget.z * this.fireflySpeed * deltaTime * 12 + wanderZ;
                
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