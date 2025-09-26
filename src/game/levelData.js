// Data-driven level definitions with GLTF geometry loading
export const levels = [
  {
    id: 'intro',
    name: 'Intro Level',
    gltfUrl: 'src/assets/levels/intro.gltf', // Base level geometry from GLTF
    startPosition: [0, 3, 8],
    ui: ['hud', 'minimap'],
    lights: [ 'BasicLights' ],
    enemies: [
      { type: 'walker', position: [5, 3, 8], modelUrl: 'src/assets/low_poly_female/scene.gltf', patrolPoints: [[7,2,-8,0.5], [13,2,-8,0.5]], speed: 2.4, chaseRange: 5 },
      { type: 'runner', position: [10, 3, 6], modelUrl: 'src/assets/low_poly_male/scene.gltf', patrolPoints: [[12,2,6,0.4],[16,2,6,0.4]], speed: 4.0, chaseRange: 6 },
      { type: 'jumper', position: [2, 3, 10], modelUrl: 'src/assets/low_poly_female/scene.gltf', patrolPoints: [[2,1,10,0.6]], jumpInterval: 1.8, jumpStrength: 5.5 },
      { type: 'flyer', position: [8, 6, -2], modelUrl: 'src/assets/futuristic_flying_animated_robot_-_low_poly/scene.gltf', patrolPoints: [[8,6,-2],[12,8,-4],[6,7,2]], speed: 2.5 },
    ],
    // Cinematics and dialogue system
    cinematics: {
      onLevelStart: {
        type: 'dialogue',
        character: 'narrator',
        lines: [
          { text: "Welcome to the training grounds!", duration: 3000 },
          { text: "Use WASD to move and Space to jump.", duration: 4000 }
        ]
      },
      onEnemyDefeat: {
        type: 'cutscene',
        cameraPath: [
          { position: [10, 5, 10], lookAt: [0, 0, 0], duration: 2000 }
        ],
        dialogue: [
          { character: 'player', text: "One down, more to go!", duration: 2000 }
        ]
      }
    },
    // Override GLTF geometry with procedural objects if needed (for prototyping)
    fallbackObjects: [
      // Will be used if GLTF fails to load or doesn't exist
      { type: 'box', position: [0, 0, 0], size: [50, 1, 50], color: 0x6b8e23 },
      { type: 'box', position: [25, 2, 0], size: [1, 5, 50], color: 0x8b4513 },
      { type: 'box', position: [0, 2, 25], size: [50, 5, 1], color: 0x8b4513 },
      { type: 'box', position: [-25, 2, 0], size: [1, 5, 50], color: 0x8b4513 },
      { type: 'box', position: [0, 2, -25], size: [50, 5, 1], color: 0x8b4513 },
      { type: 'box', position: [-2, 2, -4], size: [3, 1, 3], color: 0xcd853f },
      { type: 'box', position: [3, 4, -8], size: [5, 1, 5], color: 0xcd853f },
      { type: 'box', position: [10, 6, -10], size: [4, 1, 4], color: 0xcd853f },
      { type: 'box', position: [14, 8, -12], size: [4, 1, 4], color: 0xcd853f }
    ]
  },
  // Custom level
  {
    id: 'custom_level',
    name: 'Custom Level',
    gltfUrl: 'src/assets/levels/custom_level.gltf', // Base level geometry from GLTF
    startPosition: [112, 5, 225],
    ui: ['hud'],
    lights: ['BasicLights'],
    enemies: [
      // Enemies can still be defined here
    ],
    cinematics: {
      onLevelStart: {
        type: 'dialogue',
        character: 'guide',
        lines: [
          { text: "This is a custom built level!", duration: 3000 },
          { text: "Explore and find the exit!", duration: 3000 }
        ]
      }
    },
    // Fallback objects if GLTF doesn't exist (uses existing object data)
    fallbackObjects: [
        {
          type: 'box',
          position: [0, 4, 0],
          size: [170, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [55, 4, -20],
          size: [60, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [55, 4, 20],
          size: [60, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [0, 4, -40],
          size: [10, 1, 70],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, 0, -50],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, 4, 10],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, 4, 20],
          size: [50, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-10, 4, 45],
          size: [10, 1, 40],
          color: 3050327
        },
        {
          type: 'box',
          position: [-5, 4, 70],
          size: [20, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-50, 4, 50],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-65, 4, 70],
          size: [20, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-140, 0, 85],
          size: [30, 1, 20],
          color: 3050327
        },
        {
          type: 'box',
          position: [-140, 0, 55],
          size: [30, 1, 20],
          color: 3050327
        },
        {
          type: 'box',
          position: [-130, 1, 120],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [-140, 1, 30],
          size: [130, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-100, 1, 50],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-85, 1, 50],
          size: [20, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-80, 1, 40],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-130, 1, 15],
          size: [30, 1, 20],
          color: 3050327
        },
        {
          type: 'box',
          position: [-200, 5, 80],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-200, 5, 110],
          size: [30, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-200, -3, -40],
          size: [30, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-70, 4, 80],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-70, 4, 100],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 4, 70],
          size: [30, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [30, 4, 40],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [40, 4, 80],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [50, 0, 150],
          size: [50, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [50, 0, 200],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [75, 0, 220],
          size: [40, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [115, 0, 220],
          size: [40, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, -2, 150],
          size: [50, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [10, -1, 180],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [0, -1, 200],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-10, -1, 220],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [0, -1, 240],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [10, -1, 250],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [-35, -1, 260],
          size: [80, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-70, -1, 235],
          size: [10, 1, 40],
          color: 3050327
        },
        {
          type: 'box',
          position: [-60, -1, 240],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-50, -1, 220],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, -1, 220],
          size: [30, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-60, -1, 200],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-70, -1, 190],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [-80, -1, 180],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-90, -1, 200],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-80, -1, 220],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-40, 0, -50],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-50, 0, -70],
          size: [10, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-60, 0, -90],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-70, 0, -95],
          size: [10, 1, 20],
          color: 3050327
        },
        {
          type: 'box',
          position: [-70, -4, -165],
          size: [30, 1, 40],
          color: 3050327
        },
        {
          type: 'box',
          position: [-165, -10, -170],
          size: [40, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-180, -10, -130],
          size: [50, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [-180, -10, -210],
          size: [50, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 3, -70],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 2, -100],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, 0, -90],
          size: [30, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 2, -120],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 2, -130],
          size: [50, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [0, 2, -175],
          size: [10, 1, 80],
          color: 3050327
        },
        {
          type: 'box',
          position: [40, 2, -150],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [10, 4, -240],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 4, -250],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [50, 6, -210],
          size: [70, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [20, 4, -290],
          size: [30, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [60, 6, -220],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [60, 6, -245],
          size: [30, 1, 40],
          color: 3050327
        },
        {
          type: 'box',
          position: [80, 4, -165],
          size: [10, 1, 40],
          color: 3050327
        },
        {
          type: 'box',
          position: [125, 3, -130],
          size: [80, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [130, 2, -180],
          size: [50, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [120, 2, -200],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [110, 2, -230],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [130, 2, -230],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [140, 2, -220],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [165, 2, -210],
          size: [40, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [180, 2, -225],
          size: [10, 1, 20],
          color: 3050327
        },
        {
          type: 'box',
          position: [210, 3, -230],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [160, 2, -175],
          size: [10, 1, 60],
          color: 3050327
        },
        {
          type: 'box',
          position: [200, 3, -180],
          size: [50, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [140, 2, -170],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [140, 2, -160],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [150, 2, -160],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [120, 2, -160],
          size: [10, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [140, 4, -100],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [100, 4, -100],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [120, 4, -100],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [100, 4, -80],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [115, 4, -70],
          size: [40, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [120, 4, -60],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [180, 7, -70],
          size: [30, 1, 30],
          color: 3050327
        },
        {
          type: 'box',
          position: [200, 7, -70],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [220, 7, -70],
          size: [30, 1, 50],
          color: 3050327
        },
        {
          type: 'box',
          position: [170, 7, -50],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [170, 7, -10],
          size: [50, 1, 70],
          color: 3050327
        },
        {
          type: 'box',
          position: [65, 4, -50],
          size: [120, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [60, 4, -40],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [10, -1, 150],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, -1, 190],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, -1, 200],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-30, -1, 210],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [50, 4, 80],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-130, 0, 70],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-140, 0, 70],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-150, 0, 70],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-100, 2, 70],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-180, -10, -160],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [-180, -10, -180],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [0, 4, -240],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [130, 4, -80],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'box',
          position: [80, 3, -130],
          size: [10, 1, 10],
          color: 3050327
        },
        {
          type: 'slope',
          position: [20, -0.5, 150],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [0, -1.5, 150],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-30, -1.5, 180],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [50, 0.5, 120],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [50, 1.5, 110],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [50, 2.5, 100],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [50, 3.5, 90],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [10, 3.5, 100],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [10, 2.5, 110],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [10, 1.5, 120],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [10, 0.5, 130],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [10, -0.5, 140],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-120, 0.5, 70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-110, 1.5, 70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-80, 3.5, 70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-90, 2.5, 70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-100, 1.5, 60],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-130, 0.5, 40],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-130, 0.5, 100],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, 1.5, 40],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, 2.5, 50],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, 3.5, 60],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, 4.5, 70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, 0.5, 20],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, -0.5, 10],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, -1.5, 0],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-200, -2.5, -10],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-30, 3.5, -10],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-30, 2.5, -20],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-30, 1.5, -30],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-30, 0.5, -40],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-10, 3.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-20, 2.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-30, 1.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-40, 0.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [10, 3.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 4.71238898038469, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [20, 2.5, -80],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [0, 1.5, -90],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-10, 0.5, -90],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-70, -0.5, -110],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-70, -1.5, -120],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-70, -2.5, -130],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-70, -3.5, -140],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-90, -4.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-100, -5.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-110, -6.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-120, -7.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-130, -8.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [-140, -9.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [40, 2.5, -170],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [40, 3.5, -180],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [40, 4.5, -190],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [40, 5.5, -200],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [20, 5.5, -220],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [20, 4.5, -230],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [0, 3.5, -230],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [0, 2.5, -220],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [140, 4.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [150, 5.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [160, 6.5, -70],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [140, 3.5, -120],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [100, 3.5, -120],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [80, 5.5, -200],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [80, 4.5, -190],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [80, 3.5, -140],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 3.141592653589793, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [90, 3.5, -180],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 4.71238898038469, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [100, 2.5, -180],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 4.71238898038469, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [120, 2.5, -140],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [160, 2.5, -140],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 0, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [170, 2.5, -180],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'slope',
          position: [190, 2.5, -230],
          size: [10, 1, 10],
          color: 9159498,
          rotation: [0, 1.5707963267948966, 0],
          slopeDirection: 'north'
        },
        {
          type: 'box',
          position: [220, 9.5, -95],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [206, 9.5, -84.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [206, 9.5, -55.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [220.5, 9.5, -46],
          size: [28, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [234, 9.5, -70.5],
          size: [1, 4, 48],
          color: 9127187
        },
        {
          type: 'box',
          position: [200, 9.5, -75],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [200.5, 9.5, -65],
          size: [12, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [196, 9.5, -75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [199, 9.5, -75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [195, 9.5, -80.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [180, 9.5, -85],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 9.5, -79.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 9.5, -55],
          size: [1, 4, 21],
          color: 9127187
        },
        {
          type: 'box',
          position: [195, 9.5, -59.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [184.5, 9.5, -55],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175, 9.5, -49.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [185.5, 9.5, -45],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [195, 9.5, -9.5],
          size: [1, 4, 70],
          color: 9127187
        },
        {
          type: 'box',
          position: [169.5, 9.5, 25],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 9.5, -10.5],
          size: [1, 4, 70],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 9.5, -45],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175, 5.5, -170],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [200.5, 5.5, -165],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [225, 5.5, -180.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [199.5, 5.5, -195],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175, 5.5, -189.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 4.5, -160],
          size: [1, 4, 31],
          color: 9127187
        },
        {
          type: 'box',
          position: [170, 3, -175],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 4.5, -195],
          size: [1, 4, 21],
          color: 9127187
        },
        {
          type: 'box',
          position: [170, 3, -185],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175.5, 4.5, -205],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [185, 4.5, -215.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [190, 3, -225],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [195, 5.5, -220],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [210.5, 5.5, -215],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [225, 5.5, -230.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [209.5, 5.5, -245],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [195, 5.5, -239.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [180, 4.5, -235],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [190, 3, -235],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175, 4.5, -224.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [159.5, 4.5, -215],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 4.5, -225.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [134.5, 4.5, -235],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 4.5, -240.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [109.5, 4.5, -245],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 4.5, -229.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [105.5, 4.5, -215],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 4.5, -199.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 3, -185],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [109.5, 4.5, -185],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 5, -185],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 8.5, -210],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 4, -195],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 6.5, -185],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 6, -195],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 6.5, -185],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 8, -195],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [74.5, 8.5, -215],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [65, 8.5, -220.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [70.5, 8.5, -225],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [75, 8.5, -245.5],
          size: [1, 4, 40],
          color: 9127187
        },
        {
          type: 'box',
          position: [59.5, 8.5, -265],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 8.5, -244.5],
          size: [1, 4, 40],
          color: 9127187
        },
        {
          type: 'box',
          position: [50.5, 8.5, -225],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 8.5, -219.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [39.5, 8.5, -215],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 6.5, -250],
          size: [1, 4, 31],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 6, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 6.5, -235],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 8, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [30.5, 6.5, -265],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 6.5, -290.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [19.5, 6.5, -315],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6.5, -289.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [10.5, 6.5, -265],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 6.5, -254.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [4.5, 6.5, -245],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 6.5, -239.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 5, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 4.5, -170],
          size: [1, 4, 91],
          color: 9127187
        },
        {
          type: 'box',
          position: [5.5, 4.5, -125],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 4.5, -125],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 4.5, -145.5],
          size: [1, 4, 40],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 3, -182.5],
          size: [1, 4, 34],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 5, -185],
          size: [1, 4, 39],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 7, -191],
          size: [1, 4, 27],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 2, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 4.5, -175],
          size: [1, 4, 81],
          color: 9127187
        },
        {
          type: 'box',
          position: [10, 6.5, -235],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 4, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6.5, -235],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 5, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 8.5, -210],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 7, -225],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 9, -222],
          size: [1, 4, 13],
          color: 9127187
        },
        {
          type: 'box',
          position: [25.5, 8.5, -205],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 6, -185],
          size: [1, 4, 39],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 4.5, -150],
          size: [1, 4, 31],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 3, -173],
          size: [1, 4, 15],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 4.5, -165],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [19.5, 4.5, -135],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [60, 8.5, -205],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [75, 6, -195],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [75, 6.5, -165],
          size: [1, 4, 41],
          color: 9127187
        },
        {
          type: 'box',
          position: [75, 6, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [75, 5.5, -130],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 6.5, -160],
          size: [1, 4, 31],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 5, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [100, 5.5, -135],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 5.5, -125],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [120, 5.5, -125],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 5.5, -125],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 4, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 5.5, -130.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [170, 6, -185],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175, 5.5, -185],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 4.5, -175],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [170, 6, -175],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [175, 5.5, -175],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [130, 4.5, -225],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 4.5, -214.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 4.5, -207],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [145.5, 4.5, -205],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 4.5, -194.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [139.5, 4.5, -185],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 4.5, -205],
          size: [1, 4, 41],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 4, -175],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [110, 4.5, -175],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 6, -175],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 7, -185],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [105.5, 4.5, -185],
          size: [2, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 4.5, -159.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 2, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 5.5, -135],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 4.5, -145],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 5, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 5.5, -135],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [130, 4.5, -175],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 4.5, -159.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 3, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [140, 5.5, -135],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 4.5, -145],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 5, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 4.5, -164.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [145.5, 4.5, -155],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 4.5, -149.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 3, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 5, -140],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 4.5, -170],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [149.5, 4.5, -175],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 4.5, -169.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [150, 4.5, -165],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 4, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [150, 6.5, -115],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 6, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 6.5, -115],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 4, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [130, 6.5, -115],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 8, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 6.5, -115],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 6.5, -109.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 6.5, -85],
          size: [1, 4, 21],
          color: 9127187
        },
        {
          type: 'box',
          position: [145, 6.5, -85],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [155, 6.5, -100],
          size: [1, 4, 29],
          color: 9127187
        },
        {
          type: 'box',
          position: [119.5, 6.5, -105],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 6.5, -110.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [109.5, 6.5, -115],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [105, 4, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [105, 6, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 5, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [90, 6.5, -115],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 5.5, -125],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 8, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 6.5, -115],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 6.5, -99.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [90.5, 6.5, -85],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [110, 6.5, -85],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 6.5, -90.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [120, 6.5, -95],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 6.5, -74.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [105.5, 6.5, -65],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [105, 6.5, -79.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 6.5, -75],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 6.5, -79.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [150, 5, -75],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 9.5, -75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [150.5, 9, -75],
          size: [28, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 9.5, -75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [136, 7, -75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [130, 6.5, -65],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [150, 5, -65],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [165, 9.5, -65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 6.5, -65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [150, 7, -65],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [150, 9, -65],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [115, 6.5, -59.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [125, 6.5, -54.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [94.5, 6.5, -45],
          size: [60, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [60, 6.5, -55],
          size: [111, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [65, 6.5, -39.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 6.5, -40],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [29.5, 6.5, -45],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [75.5, 6.5, -35],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [85, 6.5, 0.5],
          size: [1, 4, 70],
          color: 9127187
        },
        {
          type: 'box',
          position: [59.5, 6.5, 35],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [39.5, 6.5, -35],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 6.5, -19.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 6.5, 25],
          size: [1, 4, 41],
          color: 9127187
        },
        {
          type: 'box',
          position: [14.5, 6.5, -5],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6.5, -25],
          size: [1, 4, 39],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6.5, -60.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [10, 5, -65],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [20, 5.5, -65],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [0, 6.5, -75],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [10, 4, -75],
          size: [9, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 5.5, -75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [10, 4.5, -85],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 3, -80],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [30, 4.5, -85],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 4, -80],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 5.5, -70.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 4.5, -100.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [29.5, 4.5, -115],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 4.5, -120],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 4.5, -119.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [9.5, 4.5, -115],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 4.5, -104.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 4.5, -85],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 4.5, -85],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-40, 2.5, -95],
          size: [51, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 2, -95],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15.5, 2.5, -95],
          size: [2, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 4, -95],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-30, 2.5, -85],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 3, -85],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15, 2.5, -85],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 5, -85],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45, 2.5, -80],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [-16, 2.5, -95],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 1, -75],
          size: [39, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-24, 4, -75],
          size: [37, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15.5, 6, -75],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45, 2.5, -60],
          size: [1, 4, 11],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 4, -65],
          size: [39, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 6.5, -35],
          size: [1, 4, 61],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, 2.5, -65],
          size: [1, 4, 41],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65.5, 2.5, -85],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, 2.5, -95.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [-60, -1.5, -145],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 1, -125],
          size: [1, 4, 39],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 2.5, -100.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-80, -1.5, -145],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, 0, -125],
          size: [1, 4, 39],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, -1.5, -165.5],
          size: [1, 4, 40],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, -1.5, -146],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-70.5, -1.5, -185],
          size: [30, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, -1.5, -179.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, -1.5, -155.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [-86, 0, -165],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-160, -7.5, -175],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-160, -7.5, -165],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-175, -7.5, -159.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-164.5, -7.5, -155],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-155, -7.5, -129.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [-180.5, -7.5, -105],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, -7.5, -130.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [-194.5, -7.5, -155],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-185, -7.5, -170.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195.5, -7.5, -185],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, -7.5, -210.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [-179.5, -7.5, -235],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-155, -7.5, -209.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [-165.5, -7.5, -185],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-175, -7.5, -180],
          size: [1, 4, 9],
          color: 9127187
        },
        {
          type: 'box',
          position: [-131.5, -9, -175],
          size: [26, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-145, -7.5, -175],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-120.5, -7, -175],
          size: [48, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-115, -5, -175],
          size: [59, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, -1.5, -175],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-101, -3, -175],
          size: [31, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, -1.5, -175],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-100, -4, -165],
          size: [29, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, -6, -165],
          size: [23, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-139, -8, -165],
          size: [11, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, -3, -134.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, -3, -137],
          size: [1, 4, 15],
          color: 9127187
        },
        {
          type: 'box',
          position: [-34.5, 2.5, -55],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 2.5, -49.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 5, -17.5],
          size: [1, 4, 24],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15.5, 6.5, -5],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 0, -36.5],
          size: [1, 4, 16],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 2, -36.5],
          size: [1, 4, 16],
          color: 9127187
        },
        {
          type: 'box',
          position: [-35, 5, -12.5],
          size: [1, 4, 14],
          color: 9127187
        },
        {
          type: 'box',
          position: [-60, 6.5, -5],
          size: [51, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-44.5, 2.5, -45],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-35, 3, -32],
          size: [1, 4, 25],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, 6.5, 0.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-59.5, 6.5, 5],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-0.5, 6.5, 5],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-35, 6.5, 10.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 6.5, 10.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [-14.5, 6.5, 15],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 6.5, 40.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [0.5, 6.5, 65],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6.5, 54.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 6.5, 45],
          size: [19, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 6.5, 55.5],
          size: [1, 4, 40],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15, 6.5, 50],
          size: [1, 4, 51],
          color: 9127187
        },
        {
          type: 'box',
          position: [-4.5, 6.5, 75],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 6.5, 85.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 6.5, 95],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 6.5, 89.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [40.5, 6.5, 85],
          size: [10, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45.5, 6.5, 75],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 6.5, 80.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 5, 96],
          size: [1, 4, 21],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 2, 115.5],
          size: [1, 4, 18],
          color: 9127187
        },
        {
          type: 'box',
          position: [65, 2.5, 125],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 1, 115],
          size: [1, 4, 19],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 2.5, 125],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 6.5, 85],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 3, 98],
          size: [1, 4, 25],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 6, 94],
          size: [1, 4, 17],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 4, 109],
          size: [1, 4, 5],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 2.5, 125],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 2.5, 135.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [75, 2.5, 150.5],
          size: [1, 4, 50],
          color: 9127187
        },
        {
          type: 'box',
          position: [64.5, 2.5, 175],
          size: [20, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [35, 2.5, 175],
          size: [21, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 2.5, 164.5],
          size: [1, 4, 20],
          color: 9127187
        },
        {
          type: 'box',
          position: [55, 2.5, 195.5],
          size: [1, 4, 40],
          color: 9127187
        },
        {
          type: 'box',
          position: [75.5, 2.5, 215],
          size: [40, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 2.5, 209.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [115.5, 2.5, 205],
          size: [40, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [135, 2.5, 220.5],
          size: [1, 4, 30],
          color: 9127187
        },
        {
          type: 'box',
          position: [114.5, 2.5, 235],
          size: [40, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [95, 2.5, 229.5],
          size: [1, 4, 10],
          color: 9127187
        },
        {
          type: 'box',
          position: [69.5, 2.5, 225],
          size: [50, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [45, 2.5, 200],
          size: [1, 4, 49],
          color: 9127187
        },
        {
          type: 'box',
          position: [-30.5, 6.5, 25],
          size: [30.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45.5, 6.5, 15],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, 6.5, 40.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45, 6.5, 50.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55.5, 6.5, 75],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85.0, 5, 65],
          size: [19.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65.5, 6.5, 65],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-106.5, 5, 75],
          size: [2.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-100.0, 4.5, 75],
          size: [11.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85.0, 5, 75],
          size: [19.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, 6.5, 80.0],
          size: [1, 4, 11.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 2.5, 85.0],
          size: [1, 4, 21.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-115.0, 2, 75],
          size: [19.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-95, 4.5, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-94, 3, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 2.5, 55.0],
          size: [1, 4, 21.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-115.0, 2, 65],
          size: [19.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-105, 4.5, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 2.5, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-115.0, 4, 65],
          size: [19.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-105.0, 3.5, 35],
          size: [41.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 1, 40.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 2.5, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 1, 100.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-120.0, 3.5, 105],
          size: [11.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-145.0, 2.5, 95],
          size: [21.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-135, 2, 100.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-140.0, 3.5, 105],
          size: [11.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-135, 2.5, 95],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-155, 2.5, 69.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-144.5, 2.5, 45],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-130.0, 3.5, 135],
          size: [31.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-145, 3.5, 120.0],
          size: [1, 4, 29.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-115, 3.5, 120.0],
          size: [1, 4, 29.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 3, 100.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-165.0, 3.5, 35],
          size: [61.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-135, 2, 40.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-135, 2.5, 45],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-125, 3, 40.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-135, 4, 40.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-135, 2.5, 45],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, 3.5, 40.0],
          size: [1, 4, 31.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85.5, 3.5, 55],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-105, 3.5, 50.0],
          size: [1, 4, 11.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-105, 2, 60.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-105, 4.5, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-95, 2, 60.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-95, 4.5, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-93, 6, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-93, 6, 65],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-95, 4, 60.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-105, 4, 60.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-94.5, 3.5, 45],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, 3.5, 40.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-95.5, 3.5, 25],
          size: [40.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-115, 3.5, 14.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-130.0, 3.5, 5],
          size: [31.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-145, 3.5, 15.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-170.5, 3.5, 25],
          size: [50.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195, 5, 55.5],
          size: [1, 4, 38.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195, 7.5, 80.0],
          size: [1, 4, 11.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-189.5, 7.5, 85],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-185, 7.5, 110.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-200.5, 7.5, 135],
          size: [30.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-215, 7.5, 109.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 1, 23.5],
          size: [1, 4, 2.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 3.5, 30.0],
          size: [1, 4, 11.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 1, 55.0],
          size: [1, 4, 39.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 7.5, 80.0],
          size: [1, 4, 11.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-209.5, 7.5, 85],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 5, 55.0],
          size: [1, 4, 39.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 7.5, 75],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195, 2, 36],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195, 4, 36],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, 0, 4.5],
          size: [1, 4, 38.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195, 0, 5.0],
          size: [1, 4, 39.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-210.0, -0.5, -15],
          size: [11.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-190.0, -0.5, -15],
          size: [11.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-215, -0.5, -40.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-205, -0.5, -15],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-185, -0.5, -40.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-195, -0.5, -15],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-185, -0.5, -16],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-200.0, -0.5, -65],
          size: [29.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, 6.5, 100.0],
          size: [1, 4, 31.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-70.0, 6.5, 115],
          size: [31.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-60.5, 6.5, 85],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-80.5, 6.5, 85],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 6.5, 80.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, 6.5, 99.5],
          size: [1, 4, 30.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 4, 120.0],
          size: [1, 4, 49.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 1.5, 145],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [20.0, 1, 145],
          size: [9.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 2.5, 145],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 1.5, 179.5],
          size: [1, 4, 50.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [20.0, 1, 155],
          size: [9.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [25, 2.5, 155],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 0.5, 165.0],
          size: [1, 4, 21.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [0.0, 0, 155],
          size: [9.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 0.5, 135.0],
          size: [1, 4, 21.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [0.0, 0, 145],
          size: [9.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 0, 120.0],
          size: [1, 4, 49.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 1.5, 145],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 2, 120.0],
          size: [1, 4, 49.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 4, 98.5],
          size: [1, 4, 6.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 0, 144],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 2, 131.5],
          size: [1, 4, 26.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 0.5, 145],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [0.0, 2, 145],
          size: [9.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 0.5, 155],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [0.0, 2, 155],
          size: [9.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-30.5, 0.5, 125],
          size: [50.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, 0, 126],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, 0.5, 151.0],
          size: [1, 4, 49.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-44.5, 0.5, 175],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15.5, 0.5, 175],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-35, 0, 180.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-35, 1.5, 200.0],
          size: [1, 4, 31.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 0.5, 175],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 0, 180.0],
          size: [1, 4, 9.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-25, 1.5, 200.0],
          size: [1, 4, 31.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-19.5, 1.5, 215],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-40.5, 1.5, 215],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15, 1.5, 204.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-4.5, 1.5, 195],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 1.5, 174.5],
          size: [1, 4, 40.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [4.5, 1.5, 205],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-5, 1.5, 220.5],
          size: [1, 4, 30.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [5.5, 1.5, 235],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [15, 1.5, 250.0],
          size: [1, 4, 29.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-30.5, 1.5, 264],
          size: [90.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, 1.5, 243.5],
          size: [1, 4, 40.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85.5, 1.5, 224],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-95, 1.5, 199.0],
          size: [1, 4, 49.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-79.5, 1.5, 175],
          size: [30.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 1.5, 185.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-54.5, 1.5, 195],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45, 1.5, 205.0],
          size: [1, 4, 19.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-30.0, 1.5, 225],
          size: [31.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-15, 1.5, 235.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-4.5, 1.5, 245],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [5, 1.5, 250.5],
          size: [1, 4, 10.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-30.5, 1.5, 255],
          size: [70.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [4, 1.5, 255],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 1.5, 249.5],
          size: [1, 4, 10.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-54.5, 1.5, 245],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45, 1.5, 235.0],
          size: [1, 4, 19.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-60.0, 1.5, 235],
          size: [11.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 1.5, 224.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-65, 1.5, 232],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75.5, 1.5, 215],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-85, 1.5, 199.5],
          size: [1, 4, 30.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-79.5, 1.5, 185],
          size: [10.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-75, 1.5, 195.5],
          size: [1, 4, 20.0],
          color: 9127187
        },
        {
          type: 'box',
          position: [-64.5, 1.5, 205],
          size: [20.0, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-45, 1.5, 196],
          size: [1, 4, 1],
          color: 9127187
        },
        {
          type: 'box',
          position: [-55, 1.5, 220.0],
          size: [1, 4, 29.0],
          color: 9127187
        }
    ]
  }
];