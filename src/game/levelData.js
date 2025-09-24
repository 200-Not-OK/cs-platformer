// Data-driven level definitions (no hard-coded meshes). Add new objects here.
export const levels = [
  {
    id: 'intro',
    name: 'Intro Level',
    startPosition: [0, 3, 8],
    ui: ['hud', 'minimap'],
    lights: [ 'BasicLights' ],
    enemies: [
      { type: 'walker', position: [5, 3, 8], modelUrl: 'src/assets/low_poly_female/scene.gltf', patrolPoints: [[7,2,-8,0.5], [13,2,-8,0.5]], speed: 2.4, chaseRange: 5 },
      { type: 'runner', position: [10, 3, 6], modelUrl: 'src/assets/low_poly_male/scene.gltf', patrolPoints: [[12,2,6,0.4],[16,2,6,0.4]], speed: 4.0, chaseRange: 6 },
      { type: 'jumper', position: [2, 3, 10], modelUrl: 'src/assets/low_poly_female/scene.gltf', patrolPoints: [[2,1,10,0.6]], jumpInterval: 1.8, jumpStrength: 5.5 },
      { type: 'flyer', position: [8, 6, -2], modelUrl: 'src/assets/futuristic_flying_animated_robot_-_low_poly/scene.gltf', patrolPoints: [[8,6,-2],[12,8,-4],[6,7,2]], speed: 2.5 },
    ],
    objects: [
      // platform objects are generic "box" objects: position + size + optional color
      { type: 'box', position: [0, 0, 0], size: [50, 1, 50], color: 0x6b8e23 }, // ground
      { type: 'box', position: [25, 2, 0], size: [1, 5, 50], color: 0x8b4513 },
      { type: 'box', position: [0, 2, 25], size: [50, 5, 1], color: 0x8b4513 },
      { type: 'box', position: [-25, 2, 0], size: [1, 5, 50], color: 0x8b4513 },
      { type: 'box', position: [0, 2, -25], size: [50, 5, 1], color: 0x8b4513 },
      // simple floating platforms to jump on
      { type: 'box', position: [-2, 2, -4], size: [3, 1, 3], color: 0xcd853f },
      { type: 'box', position: [3, 4, -8], size: [5, 1, 5], color: 0xcd853f },
      { type: 'box', position: [10, 6, -10], size: [4, 1, 4], color: 0xcd853f },
      { type: 'box', position: [14, 8, -12], size: [4, 1, 4], color: 0xcd853f }
    ]
  },
  {
    id: 'platformer',
    name: 'Platform Course',
    startPosition: [-8, 2.1, 5],
    ui: ['hud', 'objectives', 'minimap'],
    lights: [ 'BasicLights', { key: 'PointPulse', props: { position: [6, 4, -10], color: 0xffcc88, intensity: 1.2, speed: 3 } } ],
    objects: [
      { type: 'box', position: [-8, 0, 0], size: [24, 1, 12], color: 0x2e8b57 },
      { type: 'box', position: [-2, 2, -4], size: [3, 1, 3], color: 0xcd853f },
      { type: 'box', position: [3, 4, -8], size: [5, 1, 5], color: 0xcd853f },
      { type: 'box', position: [10, 6, -12], size: [4, 1, 4], color: 0xcd853f }
    ]
  }
];
