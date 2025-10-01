// Data-driven level definitions with GLTF geometry loading
export const levels = [
  {
    id: "intro",
    name: "Intro Level",
    gltfUrl: "src/assets/levels/introLevel.gltf",
    startPosition: [
      0,
      5,
      8
    ],
    ui: [
      "hud",
      "fps"
    ],
    lights: [
      "BasicLights"
    ],
    enemies: [
      {
        type: "walker",
        position: [
          5,
          6,
          8
        ],
        modelUrl: "src/assets/low_poly_female/scene.gltf",
        patrolPoints: [[7,2,-8,0.5],[13,2,-8,0.5]],
        speed: 15,
        chaseRange: 5
      },
      {
        type: "runner",
        position: [
          10,
          6,
          6
        ],
        modelUrl: "src/assets/low_poly_male/scene.gltf",
        patrolPoints: [
          [
            12,
            2,
            6,
            0.4
          ],
          [
            16,
            2,
            6,
            0.4
          ]
        ],
        speed: 17,
        chaseRange: 7
      },
      {
        type: "jumper",
        position: [
          2,
          6,
          10
        ],
        modelUrl: "src/assets/low_poly_female/scene.gltf",
        patrolPoints: [
          [
            2,
            1,
            10,
            0.6
          ]
        ],
        jumpInterval: 1.8,
        jumpStrength: 5.5
      },
      {
        type: "flyer",
        position: [
          8,
          6,
          -2
        ],
        modelUrl: "src/assets/futuristic_flying_animated_robot_-_low_poly/scene.gltf",
        patrolPoints: [
          [
            8,
            6,
            -2
          ],
          [
            12,
            8,
            -4
          ],
          [
            6,
            7,
            2
          ]
        ],
        speed: 2.5
      }
    ],
    colliders: [
      {
        id: "collider_10",
        type: "box",
        position: [
          0,
          0,
          0
        ],
        size: [
          42.917484283447266,
          0.5594812631607056,
          38.855934143066406
        ],
        materialType: "ground",
        meshName: "collider_playground"
      },
      {
        id: "collider_11",
        type: "box",
        position: [
          -21.06,
          3.44,
          0
        ],
        size: [
          0.7933826446533203,
          6.32648104429245,
          38.855934143066406
        ],
        materialType: "wall",
        meshName: "collider_playground001"
      },
      {
        id: "collider_12",
        type: "box",
        position: [
          0,
          3.44,
          -19.03
        ],
        size: [
          42.917484283447266,
          6.32648104429245,
          0.7933826446533203
        ],
        materialType: "wall",
        meshName: "collider_playground002"
      },
      {
        id: "collider_13",
        type: "box",
        position: [
          0,
          3.44,
          19.03
        ],
        size: [
          42.917484283447266,
          6.32648104429245,
          0.7933826446533203
        ],
        materialType: "wall",
        meshName: "collider_playground004"
      },
      {
        id: "collider_14",
        type: "box",
        position: [
          21.06,
          3.44,
          0
        ],
        size: [
          0.7933826446533203,
          6.32648104429245,
          38.855934143066406
        ],
        materialType: "wall",
        meshName: "collider_playground003"
      }
    ],
    cinematics: {
      onLevelStart: {
        type: "dialogue",
        character: "narrator",
        lines: [
          {
            text: "Welcome to the training grounds!",
            duration: 3000
          },
          {
            text: "Use WASD to move and Space to jump.",
            duration: 4000
          }
        ]
      },
      onEnemyDefeat: {
        type: "cutscene",
        cameraPath: [
          {
            position: [
              10,
              5,
              10
            ],
            lookAt: [
              0,
              0,
              0
            ],
            duration: 2000
          }
        ],
        dialogue: [
          {
            character: "player",
            text: "One down, more to go!",
            duration: 2000
          }
        ]
      }
    },
    doors: [
      {
        type: "basic",
        position: [0, 0, 8],
        width: 3,
        height: 6,
        preset: "wooden",
        color: 0x8B4513,
        swingDirection: "right",
        interactionDistance: 20
      },
      {
        type: "model",
        position: [4, 0, 8],
        width: 3,
        height: 6,
        modelUrl: "src/assets/models/door.glb",
        preset: "wooden",
        passcode: "123",
        swingDirection: "left",
        interactionDistance: 20
      },
      {
        type: "model",
        position: [8, 0, 8],
        width: 3,
        height: 6,
        modelUrl: "src/assets/models/3d_door_model.glb",
        preset: "metal",
        color: 0xC0C0C0,
        passcode: "123",
        swingDirection: "forward left",
        interactionDistance: 20
      },
      {
        type: "model",
        position: [16, 0, 12],
        width: 30,
        height: 60,
        modelUrl: "src/assets/models/building_door_01.glb",
        preset: "futuristic",
        color: 0x00FFFF,
        passcode: "123",
        swingDirection: "forward left",
        interactionDistance: 20
      }
    ]
  },
  {
    id: 'level2',
    name: 'Level 2',
    gltfUrl: 'src/assets/levels/Level2/Level2.gltf',
    startPosition: [44, 6, -13],
    ui: ['hud', 'minimap'],
    lights: [ 'BasicLights' ],
    enemies: [
      { type: 'walker', position: [5, 3, 8], modelUrl: 'src/assets/low_poly_female/scene.gltf', patrolPoints: [[7,2,-8,0.5], [13,2,-8,0.5]], speed: 1, chaseRange: 5 },
      { type: 'runner', position: [10, 3, 6], modelUrl: 'src/assets/low_poly_male/scene.gltf', patrolPoints: [[12,2,6,0.4],[16,2,6,0.4]], speed: 2, chaseRange: 6 },
      { type: 'jumper', position: [2, 3, 10], modelUrl: 'src/assets/low_poly_female/scene.gltf', patrolPoints: [[2,1,10,0.6]], jumpInterval: 1.8, jumpStrength: 5.5 },
      { type: 'flyer', position: [8, 6, -2], modelUrl: 'src/assets/futuristic_flying_animated_robot_-_low_poly/scene.gltf', patrolPoints: [[8,6,-2],[12,8,-4],[6,7,2]], speed: 2.5 }
      ],
    // Manual colliders (created in editor) - if present, these override auto-generated colliders
    colliders: [
      // Colliders will be defined here by the editor
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
      { type: 'box', position: [0, 0, 0], size: [50, 1, 50], color: 0x6b8e23 }
    ]
  }
];