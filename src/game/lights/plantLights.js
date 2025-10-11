import * as THREE from 'three';
import { LightComponent } from '../lightComponent.js';

// Noise function (unchanged)
const SHADER_NOISE = /* glsl */`
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
`;

// HSL to RGB conversion function (unchanged)
const HSL_FUNC = /* glsl */`
    vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
        return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
    }
`;

export class CastleBioluminescentPlantGPU extends LightComponent {
    constructor(props = {}) {
        super(props);
        this.position = new THREE.Vector3().fromArray(props.position || [0, 0, 0]);
        this.clock = new THREE.Clock();
        this.interactionStrength = 0.0;

        this.animationState = 'IDLE';
        this.animationProgress = 0.0;
        this.stateClock = new THREE.Clock();
        this.stateClock.stop();
    }

    mount(scene) {
        this.plantGroup = new THREE.Group();
        this.plantGroup.position.copy(this.position);

        const plantCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(-0.2, 0.5, 0),
            new THREE.Vector3(0.15, 1.0, 0), new THREE.Vector3(-0.1, 1.6, 0),
            new THREE.Vector3(0.05, 2.0, 0)
        ]);
        const topPosition = plantCurve.getPoint(1);

        this._createBioluminescentRoots();
        this._createEnergyVeinBranch(plantCurve);
        this._createCrystallineBloom(topPosition);
        this._createCrystalOrb(topPosition.clone().add(new THREE.Vector3(0, 0.05, 0)));
        this._createInstancedLeaves(plantCurve);
        this._createInstancedMoss(plantCurve);
        this._createFireflies(plantCurve);
        this._createAmbientLight();

        scene.add(this.plantGroup);
        this._mounted = true;
    }

    _createBioluminescentRoots() {
        const rootCount = 8;
        const rootGeometry = new THREE.IcosahedronGeometry(0.1, 1);
        this.roots = new THREE.InstancedMesh(rootGeometry, null, rootCount);
        this.roots.frustumCulled = false;
        const rootData = new Float32Array(rootCount * 4);
        for(let i=0; i<rootCount; i++) {
            const angle = (i / rootCount) * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.15;
            rootData[i*4+0] = Math.cos(angle) * radius;
            rootData[i*4+1] = (Math.random() - 0.5) * 0.05;
            rootData[i*4+2] = Math.sin(angle) * radius;
            rootData[i*4+3] = Math.random();
        }
        this.roots.geometry.setAttribute('aRootData', new THREE.InstancedBufferAttribute(rootData, 4));
        this.roots.material = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `
                uniform float uTime; attribute vec4 aRootData; varying float vRandom;
                void main() {
                    vRandom = aRootData.w;
                    float scale = 0.6 + sin(uTime * 1.5 + vRandom * 6.28) * 0.3;
                    vec3 pos = position * scale;
                    pos += aRootData.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }`,
            fragmentShader: `
                uniform float uTime; varying float vRandom; ${HSL_FUNC}
                void main() {
                    float hue = 0.75 + sin(uTime * 0.2 + vRandom) * 0.08;
                    vec3 color = hsl2rgb(vec3(hue, 1.0, 0.6));
                    gl_FragColor = vec4(color, 0.8);
                }`,
            transparent: true, blending: THREE.AdditiveBlending
        });
        this.plantGroup.add(this.roots);
    }

    _createEnergyVeinBranch(curve) {
        const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
        this.branchMesh = new THREE.Mesh(tubeGeometry, new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `
                uniform float uTime; varying vec2 vUv; ${HSL_FUNC}
                void main() {
                    vec3 baseColor = hsl2rgb(vec3(0.7, 0.5, 0.1));
                    float pulse = pow(sin(vUv.y * 15.0 - uTime * 3.0) * 0.5 + 0.5, 10.0);
                    float veins = smoothstep(0.0, 0.1, pulse);
                    float hue = 0.6 + sin(uTime * 0.5) * 0.1;
                    vec3 veinColor = hsl2rgb(vec3(hue, 1.0, 0.7));
                    vec3 finalColor = mix(baseColor, veinColor, veins);
                    gl_FragColor = vec4(finalColor, 1.0);
                }`
        }));
        this.plantGroup.add(this.branchMesh);
    }

    _createCrystallineBloom(position) {
        const shardCount = 16; // Increased for fuller flower
        const shardGeometry = new THREE.PlaneGeometry(0.3, 0.6, 4, 8); // Changed to plane for better petal shape
        shardGeometry.translate(0, 0.3, 0); // Center the petal
        
        this.crystallineBloom = new THREE.InstancedMesh(shardGeometry, null, shardCount);
        this.crystallineBloom.frustumCulled = false;
        const petalData = new Float32Array(shardCount * 4);
        for(let i=0; i < shardCount; i++) {
            petalData[i*4+0] = (i / shardCount) * Math.PI * 2;
            petalData[i*4+1] = 0.5 + Math.random() * 0.5;
            petalData[i*4+2] = Math.random() * 0.1 + 0.9; // Reduced variation for more uniform petals
            petalData[i*4+3] = 0.5 + Math.random() * 0.5;
        }
        this.crystallineBloom.geometry.setAttribute('aPetalData', new THREE.InstancedBufferAttribute(petalData, 4));
        this.crystallineBloom.material = new THREE.ShaderMaterial({
            uniforms: { 
                uTime: { value: 0 }, 
                uBloomProgress: { value: 0.0 }, 
                uPetalFallProgress: { value: 0.0 },
                uInteractionStrength: { value: 0.0 }
            },
            vertexShader: `
                uniform float uTime; uniform float uBloomProgress; uniform float uPetalFallProgress;
                uniform float uInteractionStrength;
                attribute vec4 aPetalData; varying vec3 vNormal; varying vec3 vViewPosition; varying vec2 vUv;
                
                mat4 rotationY(float angle) { float s = sin(angle); float c = cos(angle); return mat4(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1); }
                mat4 rotationX(float angle) { float s = sin(angle); float c = cos(angle); return mat4(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1); }
                mat4 rotationZ(float angle) { float s = sin(angle); float c = cos(angle); return mat4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); }
                
                void main() {
                    vUv = uv;
                    float angle = aPetalData.x; 
                    float random = aPetalData.y; 
                    vec3 pos = position;
                    
                    // Improved petal shape with natural curve
                    float petalCurve = sin(uv.y * 3.14159) * 0.2;
                    pos.x += petalCurve * (1.0 - abs(uv.x * 2.0 - 1.0));
                    
                    // Scale based on UV for tapered petal
                    float widthScale = 1.0 - pow(uv.y - 0.5, 2.0) * 2.0;
                    pos.x *= widthScale;
                    
                    // Gentle petal curl
                    pos.z += sin(uv.y * 3.14159) * 0.1;
                    
                    // Bloom animation with more natural movement
                    float openProgress = uBloomProgress * (0.8 + random * 0.4);
                    mat4 openMatrix = rotationZ(openProgress * 1.8); 
                    pos = (openMatrix * vec4(pos, 1.0)).xyz;
                    
                    // Placement around center
                    mat4 placementMatrix = rotationY(angle); 
                    pos = (placementMatrix * vec4(pos, 1.0)).xyz;
                    
                    // Gentle breathing animation when in bloom
                    float breath = sin(uTime * 2.0 + angle * 2.0) * 0.05 * uBloomProgress;
                    pos += normalize(pos) * breath;
                    
                    // Interaction response
                    pos += normalize(pos) * uInteractionStrength * 0.1;
                    
                    if (uPetalFallProgress > 0.0) {
                        float fallSpeed = aPetalData.w; 
                        float fallPath = uPetalFallProgress * fallSpeed;
                        pos.y -= fallPath * fallPath * 3.0;
                        pos.x += sin(uTime * 5.0 + random * 10.0) * uPetalFallProgress * 0.2;
                        mat4 fallRotation = rotationY(uPetalFallProgress * 15.0 * random); 
                        pos = (fallRotation * vec4(pos, 1.0)).xyz;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    vNormal = normalize(normalMatrix * normal);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }`,
            fragmentShader: `
                uniform float uTime; varying vec3 vNormal; varying vec3 vViewPosition; varying vec2 vUv;
                uniform float uInteractionStrength; ${HSL_FUNC}
                
                void main() {
                    // Gradient from base to tip
                    float gradient = vUv.y;
                    float hue = 0.58 + sin(uTime * 0.3 + gradient * 2.0) * 0.1 + uInteractionStrength * 0.2;
                    float saturation = 1.0 - gradient * 0.3;
                    float lightness = 0.5 + gradient * 0.3;
                    
                    vec3 color = hsl2rgb(vec3(hue, saturation, lightness));
                    
                    // Veins pattern
                    float veins = sin(vUv.y * 20.0 + uTime) * 0.1 + 0.9;
                    color *= veins;
                    
                    vec3 viewDir = normalize(vViewPosition); 
                    float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);
                    
                    // Transparency based on gradient
                    float alpha = 0.7 + rim * 0.3;
                    alpha *= 1.0 - pow(vUv.y - 0.8, 2.0) * 5.0; // Fade at tips
                    
                    gl_FragColor = vec4(color + rim * 0.3, alpha);
                }`,
            transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.crystallineBloom.position.copy(position);
        this.plantGroup.add(this.crystallineBloom);
    }

    _createCrystalOrb(position) {
        const orbGeometry = new THREE.SphereGeometry(0.12, 32, 32); // Slightly smaller
        this.crystalOrb = new THREE.Mesh(orbGeometry, new THREE.ShaderMaterial({
            uniforms: { 
                uTime: { value: 0 }, 
                uAnimationProgress: { value: 0.0 },
                uInteractionStrength: { value: 0.0 }
            },
            vertexShader: `
                uniform float uAnimationProgress; uniform float uInteractionStrength;
                varying vec3 vNormal; varying vec3 vViewPosition;
                void main() {
                    vec3 pos = position; 
                    pos.y += smoothstep(1.0, 2.0, uAnimationProgress) * 0.6;
                    
                    // Pulsing based on interaction
                    float pulse = sin(uTime * 3.0) * 0.05 * uInteractionStrength;
                    pos += normal * pulse;
                    
                    vNormal = normalMatrix * normal; 
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    vViewPosition = -mvPosition.xyz; 
                    gl_Position = projectionMatrix * mvPosition;
                }`,
            fragmentShader: `
                uniform float uTime; uniform float uAnimationProgress; uniform float uInteractionStrength;
                varying vec3 vNormal; varying vec3 vViewPosition; ${HSL_FUNC}
                void main() {
                    float opacity = 1.0 - smoothstep(3.0, 4.0, uAnimationProgress); 
                    if (opacity < 0.01) discard;
                    
                    vec3 viewDir = normalize(vViewPosition); 
                    float fresnel = 0.1 + 1.0 * pow(1.0 + dot(viewDir, normalize(vNormal)), 2.0);
                    float pulse = 0.5 + sin(uTime * 2.0) * 0.5;
                    
                    // Color shifts with interaction
                    float hueShift = uInteractionStrength * 0.3;
                    vec3 color = hsl2rgb(vec3(0.6 + hueShift, 0.9, 0.7)) * pulse;
                    
                    // Inner glow
                    float innerGlow = sin(uTime * 4.0) * 0.3 + 0.7;
                    color += vec3(1.0, 0.8, 1.0) * innerGlow * 0.2;
                    
                    gl_FragColor = vec4(color + fresnel * 0.5, opacity);
                }`,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.crystalOrb.position.copy(position);
        this.plantGroup.add(this.crystalOrb);
    }

    _createInstancedLeaves(curve) {
        const leavesPerPlant = 24; // Increased for fuller plant
        
        // Create a better leaf shape geometry - longer and more natural
        const leafGeometry = new THREE.PlaneGeometry(0.15, 0.8, 4, 16);
        leafGeometry.translate(0, 0.4, 0); // Center the leaf

        this.leafMesh = new THREE.InstancedMesh(leafGeometry, null, leavesPerPlant);
        this.leafMesh.frustumCulled = false;

        const leafData = new Float32Array(leavesPerPlant * 4);
        const leafRandoms = new Float32Array(leavesPerPlant * 4); // Added extra parameter for growth phase

        for (let j = 0; j < leavesPerPlant; j++) {
            const t = Math.random() * 0.7 + 0.2; // Keep leaves more towards middle/top
            
            const pos = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            const angle = Math.atan2(tangent.x, tangent.z);
            const perpendicular = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0,1,0)).normalize();
            
            // More natural placement around branch
            const branchOffset = (Math.random() - 0.5) * 0.08;
            pos.add(perpendicular.multiplyScalar(branchOffset));

            leafData[j*4+0] = pos.x; 
            leafData[j*4+1] = pos.y; 
            leafData[j*4+2] = pos.z;
            leafData[j*4+3] = angle + (Math.random() - 0.5) * 1.2; // Reduced angle variation
            
            leafRandoms[j*4+0] = Math.random(); // Color variation
            leafRandoms[j*4+1] = 0.3 + Math.random() * 0.4; // Tilt variation (reduced)
            leafRandoms[j*4+2] = 0.7 + Math.random() * 0.3; // Scale variation (reduced)
            leafRandoms[j*4+3] = Math.random() * 6.28; // Growth phase offset
        }

        this.leafMesh.geometry.setAttribute('aLeafData', new THREE.InstancedBufferAttribute(leafData, 4));
        this.leafMesh.geometry.setAttribute('aRandoms', new THREE.InstancedBufferAttribute(leafRandoms, 4));

        this.leafMesh.material = new THREE.ShaderMaterial({
            uniforms: { 
                uTime: { value: 0 },
                uInteractionStrength: { value: 0.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uInteractionStrength;
                attribute vec4 aLeafData;
                attribute vec4 aRandoms;
                varying vec3 vColor;
                varying vec2 vUv;
                ${HSL_FUNC}
                
                mat4 rotationMatrix(vec3 axis, float angle) {
                    axis = normalize(axis);
                    float s = sin(angle);
                    float c = cos(angle);
                    float oc = 1.0 - c;
                    return mat4(
                        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0
                    );
                }

                void main() {
                    vUv = uv;
                    float growthPhase = aRandoms.w;
                    
                    // REALISTIC LEAF SHAPE with slender base and natural taper
                    vec3 leafPos = vec3(0.0);
                    float v = uv.y; // 0 to 1 from base to tip
                    
                    // Natural leaf shape - slender at base, wider in middle, tapered at tip
                    float widthProfile = sin(v * 3.14159); // Perfect smooth curve
                    widthProfile = pow(widthProfile, 1.5) * 1.2; // More natural power curve
                    
                    // Add subtle asymmetry for realism
                    float asymmetry = sin(v * 12.0 + uTime * 0.5) * 0.08;
                    
                    // Apply the shape with proper scaling
                    leafPos.x = position.x * widthProfile + asymmetry;
                    leafPos.y = position.y; // Keep original length
                    
                    // Subtle 3D curvature - leaves aren't perfectly flat
                    leafPos.z = sin(v * 6.283) * 0.02 * (1.0 - abs(position.x));
                    
                    // GROWTH AND SHRINK ANIMATION - more realistic
                    float growthCycle = sin(uTime * 0.8 + growthPhase) * 0.15 + 0.85;
                    float microMovement = sin(uTime * 3.0 + growthPhase * 2.0) * 0.03;
                    float totalScale = growthCycle + microMovement;
                    
                    // Scale the leaf
                    leafPos *= totalScale;
                    
                    // Base scale - much smaller to be proportional to branch
                    float masterScale = 0.25; // Reduced from 0.45
                    float randomScale = aRandoms.z;
                    
                    // Natural leaf movement
                    float gentleSway = sin(uTime * 1.5 + aLeafData.y * 5.0) * 0.1;
                    float leafTwitch = sin(uTime * 4.0 + aLeafData.z * 8.0) * 0.05;
                    
                    // Interaction response
                    float interactionWave = sin(uTime * 6.0 + aLeafData.x * 10.0) * uInteractionStrength * 0.3;
                    
                    // Apply rotations
                    mat4 baseRotMatrix = rotationMatrix(vec3(0.0, 1.0, 0.0), aLeafData.w);
                    mat4 tiltMatrix = rotationMatrix(vec3(1.0, 0.0, 0.0), aRandoms.y);
                    mat4 swayMatrix = rotationMatrix(vec3(0.0, 0.0, 1.0), gentleSway + leafTwitch + interactionWave);
                    
                    // Transform leaf position
                    vec3 finalPos = leafPos * randomScale * masterScale;
                    finalPos = (baseRotMatrix * tiltMatrix * swayMatrix * vec4(finalPos, 1.0)).xyz;
                    finalPos += aLeafData.xyz;
                    
                    // Color variation - greener with some bioluminescence
                    float hue = mix(0.35, 0.5, aRandoms.x); // Green to blue-green
                    float glow = sin(uTime * 2.0 + aRandoms.x * 6.28) * 0.1 + 0.3;
                    vColor = hsl2rgb(vec3(hue, 0.8, 0.4 + glow));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
                }`,
            fragmentShader: `
                varying vec3 vColor;
                varying vec2 vUv;
                ${HSL_FUNC}
                
                void main() {
                    // Leaf vein pattern
                    float vein = sin(vUv.y * 25.0) * 0.1 + 0.9;
                    vein *= 1.0 - smoothstep(0.0, 0.3, abs(vUv.x * 2.0 - 1.0));
                    
                    // Edge fade for softer look
                    float edgeFade = 1.0 - smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
                    edgeFade *= 1.0 - smoothstep(0.9, 1.0, vUv.y);
                    edgeFade *= 1.0 - smoothstep(0.0, 0.1, vUv.y);
                    
                    vec3 finalColor = vColor * vein;
                    float alpha = 0.85 * edgeFade;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }`,
            transparent: true, 
            side: THREE.DoubleSide,
            alphaTest: 0.1
        });
        this.plantGroup.add(this.leafMesh);
    }

    _createInstancedMoss(curve) {
        const mossPatches = 150;
        const mossGeometry = new THREE.SphereGeometry(0.03, 5, 4);
        this.mossMesh = new THREE.InstancedMesh(mossGeometry, null, mossPatches);
        this.mossMesh.frustumCulled = false;
        const mossData = new Float32Array(mossPatches * 4);
        for (let i = 0; i < mossPatches; i++) {
            const t = Math.random();
            const pointOnCurve = curve.getPoint(t);
            const tangent = curve.getTangent(t).normalize();
            const randomVec = new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).normalize();
            const perpendicular = new THREE.Vector3().crossVectors(tangent, randomVec).normalize();
            const offset = perpendicular.multiplyScalar(0.04);
            mossData[i*4+0] = pointOnCurve.x+offset.x; mossData[i*4+1] = pointOnCurve.y+offset.y; mossData[i*4+2] = pointOnCurve.z+offset.z;
            mossData[i*4+3] = Math.random() * Math.PI * 2.0;
        }
        this.mossMesh.geometry.setAttribute('aMossData', new THREE.InstancedBufferAttribute( mossData, 4));
        this.mossMesh.material = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 } },
            vertexShader: `uniform float uTime; attribute vec4 aMossData; void main() { float scale=0.7+sin(uTime*1.5+aMossData.w)*0.3; vec3 pos=position*scale; pos+=aMossData.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}`,
            fragmentShader: `void main() { gl_FragColor = vec4(0.5, 0.1, 0.8, 0.95); }`,
            transparent: true
        });
        this.plantGroup.add(this.mossMesh);
    }

    _createFireflies(curve) {
        const fireflyCount = 35; // Slightly more fireflies
        const positions = new Float32Array(fireflyCount * 3);
        const randoms = new Float32Array(fireflyCount * 4);
        const colors = new Float32Array(fireflyCount * 3); // Individual colors
        
        for (let i = 0; i < fireflyCount; i++) {
            const t = Math.random();
            const pos = curve.getPoint(t);
            // More natural distribution around the plant
            pos.x += (Math.random() - 0.5) * 1.2;
            pos.y += Math.random() * 1.8;
            pos.z += (Math.random() - 0.5) * 1.2;
            pos.toArray(positions, i * 3);
            
            randoms[i * 4 + 0] = Math.random() * 10; 
            randoms[i * 4 + 1] = Math.random() * 10;
            randoms[i * 4 + 2] = Math.random() * 10; 
            randoms[i * 4 + 3] = Math.random() * 10;
            
            // Color variation
            colors[i * 3 + 0] = 0.55 + (Math.random() - 0.5) * 0.1; // hue
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // saturation
            colors[i * 3 + 2] = 0.6 + Math.random() * 0.3; // lightness
        }
        
        const fireflyGeometry = new THREE.BufferGeometry();
        fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        fireflyGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 4));
        fireflyGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        
        this.fireflies = new THREE.Points(fireflyGeometry, new THREE.ShaderMaterial({
            uniforms: { 
                uTime: { value: 0 }, 
                uFireflySize: { value: 35.0 }, // Slightly smaller
                uInteractionStrength: { value: 0.0 }
            },
            vertexShader: `
                uniform float uTime; uniform float uFireflySize; uniform float uInteractionStrength;
                attribute vec4 aRandom; attribute vec3 aColor; 
                varying vec3 vColor;
                ${SHADER_NOISE}
                
                void main() {
                    vec3 basePos = position;
                    
                    // Improved natural movement with 3D noise
                    float noiseX = snoise(vec2(uTime * 0.3 + aRandom.x, aRandom.y));
                    float noiseY = snoise(vec2(uTime * 0.25 + aRandom.z, aRandom.w));
                    float noiseZ = snoise(vec2(uTime * 0.35 + aRandom.y, aRandom.z));
                    
                    // Circular flight pattern around plant
                    float circleTime = uTime * 0.5 + aRandom.x * 6.28;
                    float circleX = sin(circleTime) * 0.3;
                    float circleZ = cos(circleTime) * 0.3;
                    
                    vec3 offset = vec3(noiseX + circleX, noiseY, noiseZ + circleZ) * 0.4;
                    
                    // Interaction response - fireflies get excited
                    vec3 interactionOffset = vec3(
                        sin(uTime * 8.0 + aRandom.x * 10.0),
                        sin(uTime * 6.0 + aRandom.y * 8.0),
                        sin(uTime * 7.0 + aRandom.z * 9.0)
                    ) * uInteractionStrength * 0.8;
                    
                    vec3 finalPos = basePos + offset + interactionOffset;
                    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                    
                    // Size variation
                    float sizeVariation = 0.7 + sin(uTime * 5.0 + aRandom.w * 10.0) * 0.3;
                    gl_PointSize = uFireflySize * sizeVariation * (1.0 / -mvPosition.z);
                    
                    vColor = aColor;
                    gl_Position = projectionMatrix * mvPosition;
                }`,
            fragmentShader: `
                uniform float uTime; varying vec3 vColor;
                ${HSL_FUNC}
                
                void main() {
                    // Soft glow effect with gradient
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    // Bright center
                    float brightCenter = 1.0 - smoothstep(0.0, 0.2, dist);
                    
                    // Pulsing brightness
                    float pulse = (sin(uTime * 6.0) * 0.3 + 0.7);
                    
                    // Combine effects
                    float finalAlpha = glow * pulse;
                    vec3 finalColor = hsl2rgb(vColor) + brightCenter * 0.5;
                    
                    gl_FragColor = vec4(finalColor, finalAlpha);
                }`,
            transparent: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false
        }));
        this.plantGroup.add(this.fireflies);
    }

    _createAmbientLight() {
        this.ambientLight = new THREE.PointLight(0x9040ff, 5.0, 50, 1.5);
        this.ambientLight.position.set(0, 1.5, 0);
        this.plantGroup.add(this.ambientLight);
    }

    updatePlayerPosition(playerPosition) {
        if (!this._mounted) return;
        const distance = this.plantGroup.position.distanceTo(playerPosition);
        const strength = 1.0 - Math.min(distance / 7.0, 1.0);
        this.interactionStrength = THREE.MathUtils.lerp(this.interactionStrength, strength > 0 ? strength * strength : 0, 0.05);
        if (this.animationState === 'IDLE' && this.interactionStrength > 0.8) {
            this.animationState = 'BLOOMING';
            this.animationProgress = 0.0;
            this.stateClock.start();
            this.stateClock.elapsedTime = 0;
        }
    }

    update() {
        if (!this._mounted) return;
        const elapsedTime = this.clock.getElapsedTime();
        if (this.animationState !== 'IDLE') {
            const deltaTime = this.stateClock.getDelta();
            switch(this.animationState) {
                case 'BLOOMING':
                    this.animationProgress += deltaTime / 1.5;
                    if (this.animationProgress >= 1.0) { this.animationProgress = 1.0; this.animationState = 'ORB_RISING'; }
                    break;
                case 'ORB_RISING':
                    this.animationProgress += deltaTime / 2.0;
                    if (this.animationProgress >= 2.0) { this.animationProgress = 2.0; this.animationState = 'PETALS_FALLING'; }
                    break;
                case 'PETALS_FALLING':
                    this.animationProgress += deltaTime / 2.5;
                    if (this.animationProgress >= 3.0) { this.animationProgress = 3.0; this.animationState = 'FADING'; }
                    break;
                case 'FADING':
                    this.animationProgress += deltaTime / 2.0;
                    if (this.animationProgress >= 4.0) { this.animationState = 'IDLE'; this.animationProgress = 0.0; this.stateClock.stop(); }
                    break;
            }
        }
        const bloomProgress = (this.animationState === 'IDLE') ? 0.0 : THREE.MathUtils.smoothstep(this.animationProgress, 0.0, 1.0);
        const petalFallProgress = (this.animationState === 'IDLE') ? 0.0 : THREE.MathUtils.smoothstep(this.animationProgress, 2.0, 3.0);
        const orbAnimationProgress = (this.animationState === 'IDLE') ? 0.0 : this.animationProgress;
        
        // Update interaction strength on materials
        if (this.crystallineBloom) {
            this.crystallineBloom.material.uniforms.uBloomProgress.value = bloomProgress;
            this.crystallineBloom.material.uniforms.uPetalFallProgress.value = petalFallProgress;
            this.crystallineBloom.material.uniforms.uInteractionStrength.value = this.interactionStrength;
        }
        if (this.crystalOrb) {
            this.crystalOrb.material.uniforms.uAnimationProgress.value = orbAnimationProgress;
            this.crystalOrb.material.uniforms.uInteractionStrength.value = this.interactionStrength;
        }
        if (this.leafMesh) {
            this.leafMesh.material.uniforms.uInteractionStrength.value = this.interactionStrength;
        }
        if (this.fireflies) {
            this.fireflies.material.uniforms.uInteractionStrength.value = this.interactionStrength;
        }
        
        this.plantGroup.rotation.z = Math.sin(elapsedTime * 0.4) * 0.05;
        this.plantGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.05;
        const timeUniform = { value: elapsedTime };
        if(this.roots) this.roots.material.uniforms.uTime = timeUniform;
        if(this.branchMesh) this.branchMesh.material.uniforms.uTime = timeUniform;
        if(this.leafMesh) this.leafMesh.material.uniforms.uTime = timeUniform;
        if(this.fireflies) this.fireflies.material.uniforms.uTime = timeUniform;
        if(this.crystallineBloom) this.crystallineBloom.material.uniforms.uTime = timeUniform;
        if(this.crystalOrb) this.crystalOrb.material.uniforms.uTime = timeUniform;
        if (this.ambientLight) {
            const baseIntensity = 1.0 + Math.sin(elapsedTime * 1.5) * 0.2;
            const interactionGlow = this.interactionStrength * 3.0;
            const brightnessMultiplier = 6.0;
            this.ambientLight.intensity = brightnessMultiplier * (baseIntensity + interactionGlow);
        }
    }

    unmount(scene) {
        if (!this._mounted) return;
        scene.remove(this.plantGroup);
        this.roots?.geometry.dispose(); this.roots?.material.dispose();
        this.branchMesh?.geometry.dispose(); this.branchMesh?.material.dispose();
        this.crystallineBloom?.geometry.dispose(); this.crystallineBloom?.material.dispose();
        this.crystalOrb?.geometry.dispose(); this.crystalOrb?.material.dispose();
        this.leafMesh?.geometry.dispose(); this.leafMesh?.material.dispose();
        this.mossMesh?.geometry.dispose(); this.mossMesh?.material.dispose();
        this.fireflies?.geometry.dispose(); this.fireflies?.material.dispose();
        this._mounted = false;
    }
}