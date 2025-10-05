// Data-driven level definitions with GLTF geometry loading
export const levels = [
  {
    id: "intro",
    name: "Intro Level",
    gltfUrl: "src/assets/levels/introLevel.gltf",
    startPosition: [
      0,
      15,
      8
    ],
    ui: [
      "hud",
      "fps",
      {
        type: "collectibles",
        config: {
          applesTotal: 12,
          potionsStart: 2,
          pointsPerApple: 150,
          collectibleTypes: {
            apples: { 
              icon: '🍎', 
              name: 'Red Apples', 
              color: '#ff6b6b', 
              completeColor: '#51cf66', 
              completeIcon: '🏆' 
            },
            potions: { 
              icon: '🧪', 
              name: 'Health Potions', 
              color: '#4dabf7', 
              lowColor: '#ffd43b', 
              emptyColor: '#ff6b6b', 
              emptyIcon: '💔' 
            }
          }
        }
      }
    ],
    lights: [
      "BasicLights"
    ],
    enemies: [
      {
        type: "snake",
        position: [
          -5,
          0.5,
          5
        ],
        modelUrl: "src/assets/enemies/snake/scene.gltf",
        patrolPoints: [
          [
            -5,
            1,
            5,
            0.3
          ],
          [
            -8,
            1,
            8,
            0.3
          ],
          [
            -3,
            1,
            10,
            0.3
          ]
        ],
        speed: 10,
        chaseRange: 6,
        health: 35
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
    // Example sound configuration (add your audio files to use)
    sounds: {
      music: {
        'intro-theme': {
          url: 'src/assets/audio/music/whispers_beneath_the_canopy.mp3',
          loop: true
        }
      },
      sfx: {
        'sword': {
          url: 'src/assets/audio/sfx/sword.mp3',
          loop: false
        },
        'chest': {
          url: 'src/assets/audio/sfx/chest_open.MP3',
          loop: false
        },
        'snake': {
          url: 'src/assets/audio/sfx/snake.wav',
          loop: false
        },
        'walk': {
          url: 'src/assets/audio/sfx/walking.mp3',
          loop: false
        },
        'jump': {
          url: 'src/assets/audio/sfx/jumping.wav',
          loop: false
        }
      },
      // Auto-play on level start
      playMusic: 'intro-theme'
    }
  },
  {
    id: "level2",
    name: "Level 2",
    gltfUrl: "src/assets/levels/Level2/Level2.gltf",
    startPosition: [
      195,
      6,
      -83
    ],
    ui: [
      "hud",
      "minimap",
      {
        type: "collectibles",
        config: {
          applesTotal: 5,
          potionsStart: 5,
          pointsPerApple: 200,
          collectibleTypes: {
            apples: { 
              icon: '🍏', 
              name: 'Green Apples', 
              color: '#51cf66', 
              completeColor: '#ffd43b', 
              completeIcon: '👑' 
            },
            potions: { 
              icon: '🧪', 
              name: 'Health Potions', 
              color: '#9775fa',
              lowColor: '#ffd43b', 
              emptyColor: '#ff6b6b', 
              emptyIcon: '💔' 
            }
          }
        }
      }
    ],
    lights: ["BasicLights"],
    sounds: {
      music: {
        'level2-theme': {
          url: 'src/assets/audio/music/whispers_beneath_the_canopy.mp3',
          loop: true
        }
      },
      sfx: {
        'door': {
          url: 'src/assets/audio/sfx/door.mp3',
          loop: false
        },
        'torch': {
          url: 'src/assets/audio/ambient/torch.mp3',
          loop: false
        },
        'chest': {
          url: 'src/assets/audio/sfx/chest_open.mp3',
          loop: false
        },
        'snake': {
          url: 'src/assets/audio/sfx/snake.wav',
          loop: false
        }
      },
      ambient: {
        'torch-ambient': {
          url: 'src/assets/audio/ambient/torch.mp3',
          loop: true
        }
      },
      playMusic: 'level2-theme'
    },
    proximitySounds: [
      {
        position: [203, 3.7, -66.7],
        sound: 'torch-ambient',
        radius: 10,
        volume: 0.7
      },
      {
        position: [187.9, 3.7, -66.7],
        sound: 'torch-ambient',
        radius: 10,
        volume: 0.7
      },
      {
        position: [160.3, 4.6, -36.1],
        sound: 'torch-ambient',
        radius: 10,
        volume: 0.7
      },
      {
        position: [160.3, 4.6, -25.7],
        sound: 'torch-ambient',
        radius: 10,
        volume: 0.7
      }
    ],
    enemies: [
      {
        type: "snake",
        position: [140, 1.4, -30],
        patrolPoints: [
          [140, 1.4, -30],
          [130, 1.4, -20],
          [150, 1.4, -20],
          [145, 1.4, -35]
        ],
        health: 35,
        speed: 10,
        chaseRange: 6.0,
        modelUrl: "src/assets/enemies/snake/scene.gltf"
      }
    ],
    collectibles: {
      chests: [
        { id: "chest_1", position: [145, 0.5, -46], contents: "apple" },
        { id: "chest_2", position: [146, 0.5, 49], contents: "apple" },
        { id: "chest_3", position: [108, 0.5, 86], contents: "potion" },
        { id: "chest_4", position: [103, 0.5, 125], contents: "apple" },
        { id: "chest_5", position: [135, 0.5, 116], contents: "potion" },
        { id: "chest_6", position: [18, 0.5, 179], contents: "apple" },
        { id: "chest_7", position: [110, 0.5, 163], contents: "apple" }
      ]
    },
    colliders: [
      {
        id: "collider_20",
        type: "box",
        position: [
          195.56,
          0.16,
          -81.19
        ],
        size: [
          23.3,
          0.1,
          29.4
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_21",
        type: "box",
        position: [
          195.28,
          0.16,
          -46.68
        ],
        size: [
          8.7,
          0.1,
          39.6
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_22",
        type: "box",
        position: [
          176.17,
          0.16,
          -30.92
        ],
        size: [
          29.5,
          0.1,
          9.3
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_23",
        type: "box",
        position: [
          141.24,
          0.16,
          -29.35
        ],
        size: [
          40.3,
          0.1,
          41.4
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_24",
        type: "box",
        position: [
          147.94,
          0.12,
          30.85
        ],
        size: [
          40.3,
          0.1,
          41
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_25",
        type: "box",
        position: [
          140.28,
          0.16,
          0.82
        ],
        size: [
          10,
          0.1,
          19
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_26",
        type: "box",
        position: [
          120.78,
          0.16,
          0.71
        ],
        size: [
          29.1,
          0.1,
          8.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_15",
        type: "box",
        position: [
          166.43,
          0.16,
          0.71
        ],
        size: [
          42.3,
          0.1,
          8.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_17",
        type: "box",
        position: [
          202.09,
          0.14,
          19.4
        ],
        size: [
          45.5,
          0.1,
          8.6
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_18",
        type: "box",
        position: [
          183.58,
          0.16,
          10.01
        ],
        size: [
          9.4,
          0.1,
          10.3
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_19",
        type: "box",
        position: [
          220.77,
          0.16,
          5.92
        ],
        size: [
          9,
          0.1,
          18.4
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_20",
        type: "box",
        position: [
          234.22,
          0.16,
          1.01
        ],
        size: [
          17.9,
          0.1,
          8.6
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_21",
        type: "box",
        position: [
          182.49,
          0.16,
          37.8
        ],
        size: [
          28.8,
          0.1,
          8.6
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_22",
        type: "box",
        position: [
          201.56,
          0.16,
          37.83
        ],
        size: [
          9.3,
          0.1,
          28.3
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_23",
        type: "box",
        position: [
          197.8,
          0.16,
          56.49
        ],
        size: [
          53.6,
          0.1,
          9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_24",
        type: "box",
        position: [
          239.05,
          0.16,
          42.11
        ],
        size: [
          9,
          0.1,
          73.6
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_25",
        type: "box",
        position: [
          216.35,
          0.16,
          75.37
        ],
        size: [
          36.5,
          0.1,
          9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_26",
        type: "box",
        position: [
          220.63,
          0.14,
          65.92
        ],
        size: [
          9.5,
          0.1,
          9.9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_27",
        type: "box",
        position: [
          201.88,
          0.22,
          84.35
        ],
        size: [
          9,
          0.1,
          9.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_28",
        type: "box",
        position: [
          179.48,
          0.23,
          93.31
        ],
        size: [
          53.3,
          0.1,
          8.7
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_29",
        type: "box",
        position: [
          156.61,
          0.23,
          80.1
        ],
        size: [
          9,
          0.1,
          17.7
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_30",
        type: "box",
        position: [
          170.2,
          0.21,
          75
        ],
        size: [
          18.2,
          0.1,
          9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_31",
        type: "box",
        position: [
          174.8,
          0.23,
          66.01
        ],
        size: [
          9,
          0.1,
          9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_32",
        type: "box",
        position: [
          85.56,
          0.16,
          -1.19
        ],
        size: [
          41.4,
          0.1,
          24.7
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_33",
        type: "box",
        position: [
          101.97,
          0.16,
          -30.91
        ],
        size: [
          38.2,
          0.1,
          8.1
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_34",
        type: "box",
        position: [
          87.18,
          0.13,
          -20.24
        ],
        size: [
          8.5,
          0.1,
          13.4
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_35",
        type: "box",
        position: [
          60.73,
          0.16,
          -9.4
        ],
        size: [
          8.4,
          0.1,
          8.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_41",
        type: "box",
        position: [
          27.53,
          0.16,
          -30.07
        ],
        size: [
          58,
          0.1,
          49.7
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_42",
        type: "box",
        position: [
          108.84,
          0.12,
          75.95
        ],
        size: [
          23.9,
          0.1,
          24.8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_43",
        type: "box",
        position: [
          45.12,
          0.12,
          123.13
        ],
        size: [
          23.9,
          0.1,
          24.8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_44",
        type: "box",
        position: [
          125.69,
          0.12,
          125.06
        ],
        size: [
          23.9,
          0.1,
          24.8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_45",
        type: "box",
        position: [
          85.39,
          0.12,
          125
        ],
        size: [
          40.5,
          0.1,
          24.8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_46",
        type: "box",
        position: [
          109.64,
          0.12,
          116.75
        ],
        size: [
          8.1,
          0.1,
          8.3
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_47",
        type: "box",
        position: [
          61.1,
          0.12,
          116.8
        ],
        size: [
          8.1,
          0.1,
          8.3
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_48",
        type: "box",
        position: [
          92.8,
          0.12,
          162.33
        ],
        size: [
          40.4,
          0.1,
          24.9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_49",
        type: "box",
        position: [
          0.51,
          0.12,
          169.27
        ],
        size: [
          40.4,
          0.1,
          24.9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_50",
        type: "box",
        position: [
          46.63,
          0.16,
          169.52
        ],
        size: [
          51.9,
          0.2,
          8.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_51",
        type: "box",
        position: [
          38.39,
          0.16,
          150.49
        ],
        size: [
          8.2,
          0.1,
          29.8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_52",
        type: "box",
        position: [
          26,
          0.16,
          33.28
        ],
        size: [
          8.4,
          0.2,
          77.7
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_53",
        type: "box",
        position: [
          44.49,
          0.16,
          39.18
        ],
        size: [
          8.3,
          0.1,
          45.4
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_54",
        type: "box",
        position: [
          35.24,
          0.16,
          39.14
        ],
        size: [
          10.2,
          0.1,
          8.9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_55",
        type: "box",
        position: [
          87.27,
          0.16,
          17.86
        ],
        size: [
          9,
          0.1,
          13.5
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_56",
        type: "box",
        position: [
          65.73,
          0.16,
          20.5
        ],
        size: [
          34.1,
          0.1,
          8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_57",
        type: "box",
        position: [
          90.22,
          0.16,
          76.49
        ],
        size: [
          13.5,
          0.1,
          8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_58",
        type: "box",
        position: [
          70.12,
          0.16,
          57.64
        ],
        size: [
          43.1,
          0.1,
          8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_59",
        type: "box",
        position: [
          87.45,
          0.16,
          67.04
        ],
        size: [
          8.6,
          0.1,
          10.9
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_60",
        type: "box",
        position: [
          87.98,
          0.16,
          96.59
        ],
        size: [
          9,
          0.1,
          32.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_61",
        type: "box",
        position: [
          50.84,
          0.16,
          91.8
        ],
        size: [
          8.6,
          0.1,
          37.8
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_62",
        type: "box",
        position: [
          64.14,
          0.16,
          76.81
        ],
        size: [
          17.9,
          0.1,
          8.4
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_63",
        type: "box",
        position: [
          69.07,
          0.16,
          90.1
        ],
        size: [
          8.3,
          0.1,
          18.2
        ],
        materialType: "ground",
        meshName: null
      },
      {
        id: "collider_64",
        type: "box",
        position: [
          78.41,
          0.15,
          95.02
        ],
        size: [
          10.3,
          0.1,
          8.8
        ],
        materialType: "ground",
        meshName: null
      }
    ],
    fallbackObjects: [
      {
        type: "box",
        position: [
          0,
          0,
          0
        ],
        size: [
          50,
          1,
          50
        ],
        color: 7048739
      }
    ]
  }
];