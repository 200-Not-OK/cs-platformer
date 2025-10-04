import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

export class FlameParticles extends LightComponent {
    static noiseTexture = null;
    static alphaTexture = null;
    static sharedClock = new THREE.Clock(true);
    constructor(props = {}) {
        super(props);
        this.flameMesh = null;
        this.particleSystem = null;
        this.flameLight = null;
        this.time = 0;
        this.basePosition = new THREE.Vector3().fromArray(props.position || [0, 0, 0]);
        this.noiseTexture = null;
        this.alphaTexture = null;
        this.particleCount = props.particleCount || 50;
        this.heatPulse = 0;
        this.flameHeight = props.height || 2.0; 
        this.maxBaseRadius = props.baseRadius || 0.3; 
    }

    async mount(scene) {
        if (!FlameParticles.noiseTexture || !FlameParticles.alphaTexture) {
            await this.loadTextures();
            FlameParticles.noiseTexture = this.noiseTexture;
            FlameParticles.alphaTexture = this.alphaTexture;
        } else {
            this.noiseTexture = FlameParticles.noiseTexture;
            this.alphaTexture = FlameParticles.alphaTexture;
        }
        
        // --- VOLUMETRIC CORE FLAME (Main Shape) ---
        const geometry = this.createFlameGeometry();
        
        const flameMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                noiseTexture: { value: this.noiseTexture },
                alphaTexture: { value: this.alphaTexture },
                baseColor1: { value: new THREE.Color(0xFFAA00) }, 
                baseColor2: { value: new THREE.Color(0xFF8800) }, 
                baseColor3: { value: new THREE.Color(0xFF5500) }, 
                baseColor4: { value: new THREE.Color(0xCC3300) }, 
                baseColor5: { value: new THREE.Color(0x882200) }, 
                flameIntensity: { value: 4.0 }, 
                flameSpeed: { value: 2.5 }, 
                noiseScale: { value: 4.0 }, 
                turbulence: { value: 0.5 }, 
                heatPulse: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying float vHeight;
                uniform float time;
                uniform float noiseScale;
                uniform float turbulence;
                uniform float heatPulse;
                uniform sampler2D noiseTexture;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vHeight = uv.y;
                    
                    vec3 pos = position;
                    float heightFactor = uv.y; 
                    
                    // Base pulse and noise offsets
                    float pulseWave = sin(time * 3.0) * heatPulse * 0.2;
                    
                    vec4 noiseSample1 = texture2D(noiseTexture, vec2(pos.x * 0.1 + time * 4.3, pos.y * 0.2 + time * 5.5));
                    vec4 noiseSample2 = texture2D(noiseTexture, vec2(pos.z * 0.15 + time * 6.7, pos.x * 0.12 + time * 3.4));
                    
                    float randomOffset1 = (noiseSample1.r - 0.5) * 2.0;
                    float randomOffset2 = (noiseSample2.g - 0.5) * 2.0;
                    
                    // Combine multiple turbulence sources with faster time variations
                    float turbulenceX = 0.0;
                    turbulenceX += sin(time * 12.5 + pos.y * 20.0 + randomOffset1 * 4.0) * turbulence * 1.0; 
                    turbulenceX += sin(time * 9.7 + pos.z * 15.0 + randomOffset2 * 2.0) * turbulence * 0.6;
                    turbulenceX += cos(time * 7.2 + pos.x * 10.0) * turbulence * 0.4;
                    
                    float turbulenceZ = 0.0;
                    turbulenceZ += cos(time * 11.8 + pos.y * 18.0 + randomOffset1 * 3.5) * turbulence * 1.0; 
                    turbulenceZ += cos(time * 8.1 + pos.x * 14.0 + randomOffset2 * 1.5) * turbulence * 0.6;
                    turbulenceZ += sin(time * 6.9 + pos.z * 11.0) * turbulence * 0.4;
                    
                    // Movement intensity is aggressively ramped up at the top
                    float movementIntensity = pow(heightFactor, 2.0); 
                    
                    pos.x += (turbulenceX + pulseWave * 0.5) * movementIntensity;
                    pos.z += (turbulenceZ + pulseWave * 0.5) * movementIntensity;
                    
                    // Pulsating effect on Y with additional chaotic noise
                    float basePulse = sin(time * 3.0) * 0.18 * heightFactor; 
                    float randomPulse = sin(time * 9.0 + pos.x * 12.0) * 0.08 * heightFactor;
                    pos.y += basePulse + randomPulse;
                    
                    // Scale variation with pulse and random factor
                    float scale = 1.0 + pulseWave * 0.4 + (randomOffset1 + randomOffset2) * 0.03; 
                    pos.x *= scale;
                    pos.z *= scale;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform sampler2D noiseTexture;
                uniform sampler2D alphaTexture;
                uniform vec3 baseColor1;
                uniform vec3 baseColor2;
                uniform vec3 baseColor3;
                uniform vec3 baseColor4;
                uniform vec3 baseColor5;
                uniform float flameIntensity;
                uniform float flameSpeed;
                uniform float noiseScale;
                uniform float heatPulse;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying float vHeight;
                
                void main() {
                    vec2 baseUV = vUv * noiseScale;
                    
                    vec2 chaosUV = vec2(
                        sin(vPosition.x * 8.0 + time * 4.0) * 0.1,
                        cos(vPosition.z * 6.0 + time * 3.0) * 0.1
                    );
                    baseUV += chaosUV;
                    
                    // Use higher frequencies for less static flame look
                    vec2 distortedUV1 = baseUV;
                    distortedUV1.x += sin(time * flameSpeed * 2.0 + vPosition.y * 10.0) * 0.4;
                    distortedUV1.y -= time * flameSpeed * 1.2 + cos(vPosition.z * 8.0) * 0.2;
                    
                    vec2 distortedUV2 = baseUV * 2.3;
                    distortedUV2.x += sin(time * 1.7 + vPosition.y * 15.0) * 0.6;
                    distortedUV2.y += time * 0.5 + sin(vPosition.x * 12.0) * 0.3;
                    
                    vec4 noise1 = texture2D(noiseTexture, distortedUV1);
                    vec4 noise2 = texture2D(noiseTexture, distortedUV2);
                    
                    // FIX 1: Ensure combined noise never dips too low by biasing it upward.
                    float combinedNoise = (
                        noise1.r * 0.5 + 
                        noise2.g * 0.5
                    );
                    
                    // Bias the noise upward (0.5 to 1.5 range, instead of 0 to 1)
                    combinedNoise = combinedNoise * 0.7 + 0.3; 
                    
                    float positionTurbulence = sin(vPosition.x * 8.0 + time * 4.0) * 0.1 +
                                             cos(vPosition.z * 6.0 + time * 3.0) * 0.1;
                    
                    combinedNoise += positionTurbulence;
                    combinedNoise *= (1.0 + heatPulse * 0.3);
                    
                    // Stronger vertical gradient for a more defined, triangular tip
                    float verticalGradient = 1.0 - vUv.y;
                    verticalGradient = pow(verticalGradient, 3.0); 
                    
                    float chaoticGradient = verticalGradient * (0.5 + combinedNoise * 1.0);
                    chaoticGradient += sin(vUv.x * 20.0 + time * 6.0) * 0.05; 
                    
                    vec2 alphaUV = vec2(
                        vUv.x * 0.7 + 0.15 + sin(time * 1.5 + vPosition.x * 10.0) * 0.08,
                        vUv.y - time * 0.6 + cos(vPosition.z * 8.0) * 0.05
                    );
                    vec4 alphaSample = texture2D(alphaTexture, alphaUV);
                    
                    // Final alpha calculation
                    float baseAlpha = alphaSample.r * flameIntensity;
                    
                    // FIX 2: Add a minimum alpha and raise the power of combinedNoise to boost density.
                    float alpha = combinedNoise * pow(chaoticGradient, 1.5) * baseAlpha; 
                    
                    // Minimum alpha to prevent complete disappearance (gaps)
                    float minAlpha = 0.05; 
                    alpha = max(alpha, minAlpha); 
                    
                    alpha *= (1.0 + heatPulse * 0.4);
                    
                    float topFade = 1.0 - vUv.y; 
                    alpha = clamp(alpha, 0.0, 1.0);
                    
                    // Realistic flame color progression
                    vec3 color;
                    float heatBoost = 1.0 + heatPulse * 0.2;
                    
                    if (chaoticGradient > 0.8) {
                        color = baseColor1 * heatBoost;
                    } else if (chaoticGradient > 0.6) {
                        color = mix(baseColor1, baseColor2, (0.8 - chaoticGradient) * 5.0) * heatBoost;
                    } else if (chaoticGradient > 0.4) {
                        color = mix(baseColor2, baseColor3, (0.6 - chaoticGradient) * 5.0);
                    } else if (chaoticGradient > 0.2) {
                        color = mix(baseColor3, baseColor4, (0.4 - chaoticGradient) * 5.0);
                    } else if (chaoticGradient > 0.05) {
                        color = mix(baseColor4, baseColor5, (0.2 - chaoticGradient) * 6.67);
                    } else {
                        color = baseColor5 * (0.6 + chaoticGradient * 4.0);
                    }
                    
                    color *= (0.6 + combinedNoise * 0.5 + heatPulse * 0.3);
                    
                    // Edge softening
                    float edge = smoothstep(0.0, 0.4, alpha);
                    alpha *= edge;
                    
                    // Heat-based glow effect
                    float glow = pow(alpha, 0.7) * (0.3 + heatPulse * 0.2);
                    color += vec3(glow * 0.4, glow * 0.2, 0.0);
                    
                    vec3 finalColor = color;
                    finalColor.r = max(finalColor.r, 0.7); 
                    finalColor.g = min(finalColor.g, finalColor.r * 0.8); 
                    finalColor.b = min(finalColor.b, 0.05); 
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.95);
                }
            `,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.flameMesh = new THREE.Mesh(geometry, flameMaterial);
        this.flameMesh.position.copy(this.basePosition);
        this.flameMesh.position.y += this.flameHeight / 2; 
        scene.add(this.flameMesh);

        // --- ENHANCED PARTICLE SYSTEM (Embers & Sparks) ---
        this.createParticleSystem(scene);

        // --- ENHANCED REALISTIC LIGHTING FOR BETTER AMBIANCE ---
        this.flameLight = new THREE.PointLight(0xFF8020, 12, 100); 
        this.flameLight.position.copy(this.basePosition).y += 1.2;
        scene.add(this.flameLight);

        this._mounted = true;
    }

    createFlameGeometry() {
        const height = this.flameHeight; 
        const maxBaseRadius = this.maxBaseRadius; 
        const heightSegments = 64; 
        
        const taperPower = 2.0 + (height - 2.0) * 0.5; 

        const radialSegments = 36;
        const geometry = new THREE.CylinderGeometry(
            1, 1, 
            height,
            radialSegments,
            heightSegments,
            true 
        );
        
        const positionAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);
            
            const normalizedY = (vertex.y + (height / 2)) / height; 
            
            let taperFactor;

            if (normalizedY < 0.03) {
                taperFactor = Math.pow(normalizedY * 33.3, 2.0) * 0.1;
            } else if (normalizedY < 0.2) {
                const t = (normalizedY - 0.03) / 0.17; 
                taperFactor = 0.1 + Math.sin(t * Math.PI / 2.0) * 0.9;
            } else {
                const t = (normalizedY - 0.2) / 0.8; 
                taperFactor = 1.0 - Math.pow(t, taperPower); 
                taperFactor = Math.max(0.01, taperFactor) * 0.9;
            }

            vertex.x *= taperFactor * maxBaseRadius;
            vertex.z *= taperFactor * maxBaseRadius;
            
            const angle = Math.atan2(vertex.z, vertex.x);
            const flicker = Math.sin(angle * 8 + normalizedY * 12) * 0.08;
            vertex.x += flicker * (1.0 - normalizedY);
            vertex.z += Math.cos(angle * 6 + normalizedY * 10) * 0.06 * (1.0 - normalizedY);
            
            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        geometry.computeVertexNormals();
        geometry.attributes.position.needsUpdate = true;
        return geometry;
    }

    createParticleSystem(scene) {
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const alphas = new Float32Array(this.particleCount);
        const velocities = new Float32Array(this.particleCount * 3);
        const phases = new Float32Array(this.particleCount);
        const lifetimes = new Float32Array(this.particleCount);
        const types = new Float32Array(this.particleCount);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.4;
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.random() * 0.8;
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            const particleType = Math.random();
            types[i] = particleType;
            
            if (particleType < 0.5) {
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.7 + Math.random() * 0.2;
                colors[i3 + 2] = 0.2 + Math.random() * 0.2;
                lifetimes[i] = 1.5 + Math.random() * 1.0;
            } else if (particleType < 0.8) {
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.4 + Math.random() * 0.2;
                lifetimes[i] = 0.8 + Math.random() * 0.5;
            } else if (particleType < 0.95) {
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.5 + Math.random() * 0.3;
                colors[i3 + 2] = 0.1;
                lifetimes[i] = 2.0 + Math.random() * 1.0;
            } else {
                const gray = 0.2 + Math.random() * 0.3;
                colors[i3] = gray;
                colors[i3 + 1] = gray;
                colors[i3 + 2] = gray;
                lifetimes[i] = 3.0 + Math.random() * 2.0;
            }
            
            sizes[i] = Math.random() * 0.2 + 0.03;
            alphas[i] = 0.4 + Math.random() * 0.5;
            
            if (particleType < 0.95) {
                velocities[i3] = (Math.random() - 0.5) * 0.3;
                velocities[i3 + 1] = Math.random() * 2.0 + 1.0;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
            } else {
                velocities[i3] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] = Math.random() * 0.8 + 0.2;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            
            phases[i] = Math.random() * Math.PI * 2;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particleGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        particleGeometry.setAttribute('type', new THREE.BufferAttribute(types, 1));

        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createParticleTexture() },
                heatPulse: { value: 0.0 }
            },
            vertexShader: `
                attribute float size;
                attribute float alpha;
                attribute vec3 color;
                attribute vec3 velocity;
                attribute float phase;
                attribute float lifetime;
                attribute float type;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying float vType;
                
                uniform float time;
                uniform float heatPulse;
                
                void main() {
                    vColor = color;
                    vAlpha = alpha;
                    vType = type;
                    
                    vec3 pos = position;
                    float particleTime = mod(time, lifetime);
                    
                    vec3 adjustedVelocity = velocity * (1.0 + heatPulse * 0.5);
                    pos += adjustedVelocity * particleTime;
                    
                    float turbulenceIntensity = mix(0.1, 0.4, type);
                    
                    float turbulenceX = sin(time * 12.0 + phase + particleTime * 15.0) * turbulenceIntensity; 
                    float turbulenceZ = cos(time * 11.0 + phase * 1.3 + particleTime * 14.0) * turbulenceIntensity;
                    
                    float particleChaosX = sin(time * 11.0 + phase * 2.0 + particleTime * 12.0) * turbulenceIntensity * 0.5;
                    float particleChaosZ = cos(time * 9.5 + phase * 1.7 + particleTime * 10.0) * turbulenceIntensity * 0.5;
                    
                    pos.x += turbulenceX * (1.0 - particleTime / lifetime) + particleChaosX;
                    pos.z += turbulenceZ * (1.0 - particleTime / lifetime) + particleChaosZ;
                    
                    if (type > 0.8) {
                        pos.y -= particleTime * particleTime * 0.2;
                    }
                    
                    vAlpha *= (1.0 - particleTime / lifetime);
                    
                    if (particleTime > lifetime - 0.01 || pos.y > 4.0 || length(pos.xz) > 2.0) {
                        float spawnRadius = 0.3 + heatPulse * 0.2;
                        pos = vec3(
                            (sin(time * 2.0 + phase) - 0.5) * spawnRadius,
                            mix(0.0, 0.5, type),
                            (cos(time * 2.0 + phase) - 0.5) * spawnRadius
                        );
                        vAlpha = alpha;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (350.0 / -mvPosition.z) * (1.0 + heatPulse * 0.2);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                varying float vAlpha;
                varying float vType;
                
                void main() {
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    float alpha = texColor.a * vAlpha;
                    
                    if (vType > 0.8) {
                        alpha *= smoothstep(0.0, 0.4, texColor.r);
                        gl_FragColor = vec4(vColor, alpha * 0.7);
                    } else {
                        alpha *= smoothstep(0.0, 0.3, texColor.r);
                        vec3 glowColor = vColor * (1.0 + texColor.r * 0.5);
                        gl_FragColor = vec4(glowColor, alpha);
                    }
                }
            `,
            transparent: true,
            blending: THREE.NormalBlending, 
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.position.copy(this.basePosition);
        scene.add(this.particleSystem);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.9)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(0.8, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        return new THREE.CanvasTexture(canvas);
    }

    async loadTextures() {
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = 512;
        noiseCanvas.height = 512;
        const noiseCtx = noiseCanvas.getContext('2d');
        
        const imageData = noiseCtx.createImageData(512, 512);
        const data = imageData.data;
        
        for (let y = 0; y < 512; y++) {
            for (let x = 0; x < 512; x++) {
                const idx = (y * 512 + x) * 4;
                const value = this.fractalNoise(x, y, 512, 512, 4) * 255;
                data[idx] = value;
                data[idx + 1] = value;
                data[idx + 2] = value;
                data[idx + 3] = 255;
            }
        }
        
        noiseCtx.putImageData(imageData, 0, 0);
        this.noiseTexture = new THREE.CanvasTexture(noiseCanvas);

        const alphaCanvas = document.createElement('canvas');
        alphaCanvas.width = 256;
        alphaCanvas.height = 512;
        const alphaCtx = alphaCanvas.getContext('2d');
        
        for (let y = 0; y < 512; y++) {
            const height = y / 512;
            
            const widthVariation = Math.sin(height * Math.PI * 4) * 0.1;
            const width = 0.15 + (1.0 - Math.pow(1.0 - height, 1.8)) * 0.8 + widthVariation;
            
            const baseAlpha = Math.pow(height, 0.7) * (1.0 - Math.pow(height, 2.0));
            const alphaVariation = Math.sin(height * Math.PI * 6) * 0.1 + 0.9;
            const alpha = baseAlpha * alphaVariation;
            
            const gradient = alphaCtx.createRadialGradient(
                128, y, 0,
                128, y, 128 * width
            );
            
            gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
            gradient.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            
            alphaCtx.fillStyle = gradient;
            alphaCtx.fillRect(0, y, 256, 1);
        }
        
        this.alphaTexture = new THREE.CanvasTexture(alphaCanvas);
    }

    fractalNoise(x, y, width, height, octaves) {
        let value = 0;
        let amplitude = 1.0;
        let frequency = 0.01;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            const random = Math.sin((x * frequency) * 12.9898 + (y * frequency) * 78.233) * 43758.5453;
            const noise = random - Math.floor(random);
            
            value += amplitude * noise;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        
        return value / maxValue;
    }

    update(delta) {
        if (!this.flameMesh || !this.particleSystem) return;
        
        this.time = FlameParticles.sharedClock.getElapsedTime();
        
        this.heatPulse = Math.sin(this.time * 1.3) * 0.5 + 0.5;
        this.heatPulse *= Math.sin(this.time * 0.7) * 0.3 + 0.7;
        
        this.flameMesh.material.uniforms.time.value = this.time;
        this.flameMesh.material.uniforms.heatPulse.value = this.heatPulse;
        
        this.particleSystem.material.uniforms.time.value = this.time;
        this.particleSystem.material.uniforms.heatPulse.value = this.heatPulse;
        
        if (this.flameLight) {
            const baseFlicker = Math.sin(this.time * 15) * 0.5;
            const highFreq = (Math.random() - 0.5) * 0.4;
            const lowFreq = Math.sin(this.time * 2.0) * 0.8;
            const pulseFlicker = Math.sin(this.time * 8.0 + this.heatPulse * 2.0) * 0.3;
            
            const intensity = Math.max(2.0, 5.0 + baseFlicker + highFreq + lowFreq + pulseFlicker);
            const heatIntensity = intensity * (0.9 + this.heatPulse * 0.2);
            
            const heightFactor = this.flameHeight / 2.0;
            
            this.flameLight.intensity = heatIntensity * 2.4 * heightFactor;
            
            const lightBob = Math.sin(this.time * 4) * 0.2;
            const heatBob = this.heatPulse * 0.1;
            
            this.flameLight.position.set(
                this.basePosition.x + Math.sin(this.time * 10) * 0.25,
                this.basePosition.y + this.flameHeight * 0.6 + lightBob + heatBob, 
                this.basePosition.z + Math.cos(this.time * 11) * 0.25
            );
        }
    }

    unmount(scene) {
        if (this.flameMesh) {
            scene.remove(this.flameMesh);
            this.flameMesh.material.dispose();
            this.flameMesh.geometry.dispose();
            this.flameMesh = null;
        }
        
        if (this.particleSystem) {
            scene.remove(this.particleSystem);
            this.particleSystem.material.dispose();
            this.particleSystem.geometry.dispose();
            this.particleSystem = null;
        }
        
        if (this.flameLight) {
            scene.remove(this.flameLight);
            this.flameLight = null;
        }
    }
}