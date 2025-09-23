// Data-driven level definitions (no hard-coded meshes). Add new objects here.
export const levels = [
  {
    id: 'intro',
    name: 'Intro Level',
    startPosition: [0, 2, 8],
    ui: ['hud', 'minimap'],
    objects: [
      // platform objects are generic "box" objects: position + size + optional color
      { type: 'box', position: [0, 0, 0], size: [20, 1, 20], color: 0x6b8e23 }, // ground
      { type: 'box', position: [0, 1.8, -6], size: [4, 1, 4], color: 0x8b4513 },
      { type: 'box', position: [6, 4, -10], size: [6, 1, 6], color: 0x8b4513 }
    ]
  },
  {
    id: 'platformer',
    name: 'Platform Course',
    startPosition: [-8, 2, 5],
    ui: ['hud', 'objectives'],
    objects: [
      { type: 'box', position: [-8, 0, 0], size: [24, 1, 12], color: 0x2e8b57 },
      { type: 'box', position: [-2, 2, -4], size: [3, 1, 3], color: 0xcd853f },
      { type: 'box', position: [3, 4, -8], size: [5, 1, 5], color: 0xcd853f },
      { type: 'box', position: [10, 6, -12], size: [4, 1, 4], color: 0xcd853f }
    ]
  }
];
