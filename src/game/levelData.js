// Data-driven level definitions with GLTF geometry loading
export const levels = [
  {
    "id": "intro",
    "name": "Intro Level",
    "order": 1,
    "gltfUrl": "src/assets/levels/introLevel.gltf",
    "startPosition": [
      0,
      15,
      8
    ],
    "ui": [
      "hud",
      "fps",
      {
        "type": "collectibles",
        "config": {
          "applesTotal": 12,
          "potionsStart": 2,
          "pointsPerApple": 150,
          "collectibleTypes": {
            "apples": {
              "icon": "🍎",
              "name": "Red Apples",
              "color": "#ff6b6b",
              "completeColor": "#51cf66",
              "completeIcon": "🏆"
            },
            "potions": {
              "icon": "🧪",
              "name": "Health Potions",
              "color": "#4dabf7",
              "lowColor": "#ffd43b",
              "emptyColor": "#ff6b6b",
              "emptyIcon": "💔"
            }
          }
        }
      }
    ],
    "lights": [
      "BasicLights"
    ],
    "enemies": [
      {
        "type": "snake",
        "position": [
          -5,
          0.5,
          5
        ],
        "modelUrl": "src/assets/enemies/snake/scene.gltf",
        "patrolPoints": [
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
        "speed": 10,
        "chaseRange": 6,
        "health": 35
      }
    ],
    "colliders": [
      {
        "id": "collider_18",
        "type": "box",
        "position": [
          0,
          2,
          0
        ],
        "size": [
          11.6,
          0.1,
          6
        ],
        "rotation": [
          44,
          0,
          0
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_10",
        "type": "box",
        "position": [
          0,
          0,
          0
        ],
        "size": [
          42.917484283447266,
          0.5594812631607056,
          38.855934143066406
        ],
        "materialType": "ground",
        "meshName": "collider_playground"
      },
      {
        "id": "collider_11",
        "type": "box",
        "position": [
          -21.06,
          3.44,
          0
        ],
        "size": [
          0.7933826446533203,
          6.32648104429245,
          38.855934143066406
        ],
        "materialType": "wall",
        "meshName": "collider_playground001"
      },
      {
        "id": "collider_12",
        "type": "box",
        "position": [
          0,
          3.44,
          -19.03
        ],
        "size": [
          42.917484283447266,
          6.32648104429245,
          0.7933826446533203
        ],
        "materialType": "wall",
        "meshName": "collider_playground002"
      },
      {
        "id": "collider_13",
        "type": "box",
        "position": [
          0,
          3.44,
          19.03
        ],
        "size": [
          42.917484283447266,
          6.32648104429245,
          0.7933826446533203
        ],
        "materialType": "wall",
        "meshName": "collider_playground004"
      },
      {
        "id": "collider_14",
        "type": "box",
        "position": [
          21.06,
          3.44,
          0
        ],
        "size": [
          0.7933826446533203,
          6.32648104429245,
          38.855934143066406
        ],
        "materialType": "wall",
        "meshName": "collider_playground003"
      }
    ],
    "cinematics": {
      "onLevelStart": {
        "type": "dialogue",
        "character": "narrator",
        "lines": [
          {
            "text": "Welcome to the training grounds!",
            "duration": 3000
          },
          {
            "text": "Use WASD to move and Space to jump.",
            "duration": 4000
          }
        ]
      },
      "onEnemyDefeat": {
        "type": "cutscene",
        "cameraPath": [
          {
            "position": [
              10,
              5,
              10
            ],
            "lookAt": [
              0,
              0,
              0
            ],
            "duration": 2000
          }
        ],
        "dialogue": [
          {
            "character": "player",
            "text": "One down, more to go!",
            "duration": 2000
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
        'potion': {
          url: 'src/assets/audio/sfx/potion.wav',
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
    "id": "level2",
    "name": "Level 3: The Serpent's Labyrinth",
    "order": 0,
    "gltfUrl": "src/assets/levels/Level2/Level2.gltf",
    "startPosition": [
      195,
      6,
      -83
    ],
    "ui": [
      "hud",
      {
        "type": "minimap",
        "config": {
          "zoom": 1.6
        }
      },
      {
        "type": "collectibles",
        "config": {
          "applesTotal": 5,
          "potionsStart": 5,
          "pointsPerApple": 200,
          "collectibleTypes": {
            "apples": {
              "icon": "🍏",
              "name": "Green Apples",
              "color": "#51cf66",
              "completeColor": "#ffd43b",
              "completeIcon": "👑"
            },
            "potions": {
              "icon": "🧪",
              "name": "Health Potions",
              "color": "#9775fa",
              "lowColor": "#ffd43b",
              "emptyColor": "#ff6b6b",
              "emptyIcon": "💔"
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
        },
        'potion': {
          url: 'src/assets/audio/sfx/potion.wav',
          loop: false
        },
        'low-health': {
          url: 'src/assets/audio/sfx/low_health.mp3',
          loop: false
        },
        'rumbling': {
          url: 'src/assets/audio/sfx/rumbling.wav',
          loop: false
        },
        'vo-levelstart': {
          url: 'src/assets/audio/ambient/pravesh_levelstart_vo.mp3',
          loop: false
        },
        'vo-maze': {
          url: 'src/assets/audio/ambient/pravesh_01.mp3',
          loop: false
        },
        'vo-chest': {
          url: 'src/assets/audio/ambient/pravesh_02.mp3',
          loop: false
        },
        'vo-lastchest': {
          url: 'src/assets/audio/ambient/pravesh_05.mp3',
          loop: false
        },
        'vo-fail': {
          url: 'src/assets/audio/ambient/pravesh_fail_vo.mp3',
          loop: false
        },
        'vo-success': {
          url: 'src/assets/audio/ambient/pravesh_success_vo.mp3',
          loop: false
        }
      },
      ambient: {
        'torch-ambient': {
          url: 'src/assets/audio/ambient/torch.mp3',
          loop: true
        }
      },
      playMusic: 'level2-theme',
      playVoiceover: null
    },
cinematics: {
  onLevelStart: {
    sequence: [
      { type: 'takeCamera' },
      { type: 'fadeOut', ms: 300 },

      // Tighter establishing on the knight (closer + slightly narrower FOV)
      { type: 'cut', position: [196.2, 6.9, -82.2], lookAt: [195, 5.8, -83], fov: 48 },
      { type: 'fadeIn', ms: 600 },

      // === 35s VO with timed captions ===
      {
        type: 'playVO',
        vo: 'vo-levelstart',
        block: true, // hold the sequence until VO is done

        // Your locked caption timings
        segments: [
          { at:     0,  ms: 2000, text: "Hey everybody, welcome to the Serpent’s Labyrinth." },
          { at:  2400,  ms: 2700, text: "You’re a knight now, in a world of stone walls and lurking dangers." },
          { at:  5500,  ms: 2500, text: "Inside, you’ll find apples hidden in chests." },
          { at:  8500,  ms: 1500, text: "They’re your key to escape." },
          { at: 10000,  ms: 3500, text: "But beware—the snakes that guard them are not ordinary creatures;" },
          { at: 14000,  ms: 6000, text: "each one slithers with its own cunning, and if they catch you—well, let’s just say you won’t be making it out alive." },
          { at: 21000,  ms: 6000, text: "And there’s talk of something far worse: a great beast, a serpent older than the labyrinth itself." },
          { at: 27500,  ms: 3500, text: "If you hear the ground tremble, don’t stick around to find out why." },
          { at: 31500,  ms: 3500, text: "Gather the apples, find the exit, and escape before it finds you." }
        ],

        // Camera timeline aligned to those beats (computed waits include prior step durations)
        concurrent: [
          // 0.0s → 13.0s: slow hero orbit (starts 1s in)
          { type: 'wait', ms: 1000 },
          { type: 'orbit', center: 'player', radius: 7.5, startDeg: 30, endDeg: 50, height: 4.8, duration: 12000 },

          // // ~14.0s: "each one slithers..." → CUT to a snake and showcase it
          { type: 'wait', ms: 1000 },                   // brings us to ~14.0s
          // { type: 'fadeOut', ms: 140 },
          // // // snake at [140, 1.4, -30]
          { type: 'cut', position: [137.00079992092608, 0.1245687627273453, -39.95321271964637], lookAt:  [135.5589805717232, 0.1245687627273453, -23.224077180845633], fov: 52 },
          { type: 'fadeIn', ms: 140 },
          { type: 'orbit', center: [132.98057775780848, 0.1245687627273453, -20.09886231664358], radius: 7, startDeg: 75, endDeg: 65, height: 3.0, duration: 5200 },

          // ~21.0s: "something far worse..." → BOSS DOOR tease + ominous zoom/rumble
          { type: 'wait', ms: 1220 },                   // lands ~21.0s
          // { type: 'fadeIn', ms: 1460 },
          { type: 'cut', position:[72, 4, -6], lookAt:[68.89083005033424, 3, -8.], fov: 100 },
                    { type: 'orbit', center: [70.20661523837512, 3.5, -7], radius: 2, startDeg: 230, endDeg: 180, height: 3.0, duration: 5200 },
          // { type: 'fadeIn', ms: 160 },
          { type: 'rumble', sfx: 'rumbling', seconds: 1.2, magnitude: 0.18, volume: 0.7 },
          // // { type: 'zoom', fov: 39, duration: 3000 },

          // // ~27.5s: "hear the ground tremble" → second rumble hit
          // { type: 'wait', ms: 5180 },                   // lands ~27.5s
          { type: 'rumble', sfx: 'rumbling', seconds: 1.1, magnitude: 0.15, volume: 0.6 },

          // // ~31.5s: "Gather the apples..." → CUT to a chest and push in
          { type: 'wait', ms: 4000 },                   // lands ~31.5s
          // { type: 'fadeOut', ms: 120 },
          // chest_1 at [145, 0.5, -46]
          { type: 'cut', position:  [138,4,120], lookAt: [135,4,116], fov: 100 },
           { type: 'orbit', center:  [138,4,120], radius: 2, startDeg: 230, endDeg: 180, height: 1.0, duration: 200 },
          { type: 'fadeIn', ms: 120 },
          // { type: 'zoom', fov: 70, duration: 900 }
          // (we let the shot hold on the chest until VO completes)
        ]
      },

      // Hand back control
      { type: 'fadeOut', ms: 250 },
      { type: 'releaseCamera' },
      { type: 'fadeIn', ms: 250 }
    ]
  },
onLevelComplete: {
  sequence: [
    { type: 'takeCamera' },
    { type: 'fadeOut', ms: 200 },
    { type: 'cut', position: [32, 6, -24], lookAt: [30, 2, -25], fov: 60 },
    { type: 'fadeIn', ms: 300 },
    // { type: 'playVO', vo: 'vo-success', block: false },
    { type: 'orbit', center: 'player', radius: 6, startDeg: 10, endDeg: 70, height: 3.2, duration: 2500 },
    { type: 'fadeOut', ms: 250 },
    { type: 'releaseCamera' },
    { type: 'fadeIn', ms: 250 }
  ]
}
,
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
    "enemies": [
      {
        "type": "snake",
        "position": [140, 1.4, -30],
        "patrolPoints": [
          [140, 1.4, -30],
          [130, 1.4, -20],
          [150, 1.4, -20],
          [145, 1.4, -35]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake",
        "position": [151.97, 1.4, 28.12],
        "patrolPoints": [
          [151.97, 1.4, 28.12],
          [141.97, 1.4, 38.12],
          [161.97, 1.4, 38.12],
          [156.97, 1.4, 23.12]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake",
        "position": [122.02, 1.4, 126.51],
        "patrolPoints": [
          [122.02, 1.4, 126.51],
          [112.02, 1.4, 136.51],
          [132.02, 1.4, 136.51],
          [127.02, 1.4, 121.51]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake",
        "position": [88.65, 1.4, 165.63],
        "patrolPoints": [
          [88.65, 1.4, 165.63],
          [78.65, 1.4, 175.63],
          [98.65, 1.4, 175.63],
          [93.65, 1.4, 160.63]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake",
        "position": [220.46, 1.4, 69.91],
        "patrolPoints": [
          [220.46, 1.4, 69.91],
          [210.46, 1.4, 79.91],
          [230.46, 1.4, 79.91],
          [225.46, 1.4, 64.91]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake",
        "position": [-4.63, 1.4, 179.30],
        "patrolPoints": [
          [-4.63, 1.4, 179.30],
          [-14.63, 1.4, 189.30],
          [5.37, 1.4, 189.30],
          [0.37, 1.4, 174.30]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake",
        "position": [75.63, 1.4, -7.35],
        "patrolPoints": [
          [75.63, 1.4, -7.35],
          [65.63, 1.4, 2.65],
          [85.63, 1.4, 2.65],
          [80.63, 1.4, -12.35]
        ],
        "health": 35,
        "speed": 10,
        "chaseRange": 6,
        "modelUrl": "src/assets/enemies/snake/scene.gltf"
      },
      {
        "type": "snake_boss",
        "position": [
          30,
          2,
          -25
        ],
        "patrolPoints": [
          [
            30,
            2,
            -25
          ],
          [
            25,
            2,
            -20
          ],
          [
            35,
            2,
            -30
          ],
          [
            40,
            2,
            -20
          ],
          [
            25,
            2,
            -35
          ]
        ],
        "health": 500,
        "speed": 5,
        "chaseRange": 12
      }
    ],
    "collectibles": {
      "chests": [
        {
          "id": "chest_1",
          "position": [
            145,
            0.5,
            -46
          ],
          "contents": "apple"
        },
        {
          "id": "chest_2",
          "position": [
            146,
            0.5,
            49
          ],
          "contents": "apple"
        },
        {
          "id": "chest_3",
          "position": [
            108,
            0.5,
            86
          ],
          "contents": "potion"
        },
        {
          "id": "chest_4",
          "position": [
            103,
            0.5,
            125
          ],
          "contents": "apple"
        },
        {
          "id": "chest_5",
          "position": [
            135,
            0.5,
            116
          ],
          "contents": "potion"
        },
        {
          "id": "chest_6",
          "position": [
            18,
            0.5,
            179
          ],
          "contents": "apple"
        },
        {
          "id": "chest_7",
          "position": [
            110,
            0.5,
            163
          ],
          "contents": "apple"
        }
      ]
    },
    "colliders": [
      {
        "id": "collider_20",
        "type": "box",
        "position": [
          195.56,
          0.16,
          -81.19
        ],
        "size": [
          23.3,
          0.1,
          29.4
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_21",
        "type": "box",
        "position": [
          195.28,
          0.16,
          -46.68
        ],
        "size": [
          8.7,
          0.1,
          39.6
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_22",
        "type": "box",
        "position": [
          176.17,
          0.16,
          -30.92
        ],
        "size": [
          29.5,
          0.1,
          9.3
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_23",
        "type": "box",
        "position": [
          141.24,
          0.16,
          -29.35
        ],
        "size": [
          40.3,
          0.1,
          41.4
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_24",
        "type": "box",
        "position": [
          147.94,
          0.12,
          30.85
        ],
        "size": [
          40.3,
          0.1,
          41
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_25",
        "type": "box",
        "position": [
          140.28,
          0.16,
          0.82
        ],
        "size": [
          10,
          0.1,
          19
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_26",
        "type": "box",
        "position": [
          120.78,
          0.16,
          0.71
        ],
        "size": [
          29.1,
          0.1,
          8.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          166.43,
          0.16,
          0.71
        ],
        "size": [
          42.3,
          0.1,
          8.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_17",
        "type": "box",
        "position": [
          202.09,
          0.14,
          19.4
        ],
        "size": [
          45.5,
          0.1,
          8.6
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_18",
        "type": "box",
        "position": [
          183.58,
          0.16,
          10.01
        ],
        "size": [
          9.4,
          0.1,
          10.3
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_19",
        "type": "box",
        "position": [
          220.77,
          0.16,
          5.92
        ],
        "size": [
          9,
          0.1,
          18.4
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_65",
        "type": "box",
        "position": [
          234.22,
          0.16,
          1.01
        ],
        "size": [
          17.9,
          0.1,
          8.6
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_66",
        "type": "box",
        "position": [
          182.49,
          0.16,
          37.8
        ],
        "size": [
          28.8,
          0.1,
          8.6
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_67",
        "type": "box",
        "position": [
          201.56,
          0.16,
          37.83
        ],
        "size": [
          9.3,
          0.1,
          28.3
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_68",
        "type": "box",
        "position": [
          197.8,
          0.16,
          56.49
        ],
        "size": [
          53.6,
          0.1,
          9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_69",
        "type": "box",
        "position": [
          239.05,
          0.16,
          42.11
        ],
        "size": [
          9,
          0.1,
          73.6
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_70",
        "type": "box",
        "position": [
          216.35,
          0.16,
          75.37
        ],
        "size": [
          36.5,
          0.1,
          9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_71",
        "type": "box",
        "position": [
          220.63,
          0.14,
          65.92
        ],
        "size": [
          9.5,
          0.1,
          9.9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_27",
        "type": "box",
        "position": [
          201.88,
          0.22,
          84.35
        ],
        "size": [
          9,
          0.1,
          9.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_28",
        "type": "box",
        "position": [
          179.48,
          0.23,
          93.31
        ],
        "size": [
          53.3,
          0.1,
          8.7
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_29",
        "type": "box",
        "position": [
          156.61,
          0.23,
          80.1
        ],
        "size": [
          9,
          0.1,
          17.7
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_30",
        "type": "box",
        "position": [
          170.2,
          0.21,
          75
        ],
        "size": [
          18.2,
          0.1,
          9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_31",
        "type": "box",
        "position": [
          174.8,
          0.23,
          66.01
        ],
        "size": [
          9,
          0.1,
          9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_32",
        "type": "box",
        "position": [
          85.56,
          0.16,
          -1.19
        ],
        "size": [
          41.4,
          0.1,
          24.7
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_33",
        "type": "box",
        "position": [
          101.97,
          0.16,
          -30.91
        ],
        "size": [
          38.2,
          0.1,
          8.1
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_34",
        "type": "box",
        "position": [
          87.18,
          0.13,
          -20.24
        ],
        "size": [
          8.5,
          0.1,
          13.4
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_35",
        "type": "box",
        "position": [
          60.73,
          0.16,
          -9.4
        ],
        "size": [
          8.4,
          0.1,
          8.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_41",
        "type": "box",
        "position": [
          27.53,
          0.16,
          -30.07
        ],
        "size": [
          58,
          0.1,
          49.7
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_42",
        "type": "box",
        "position": [
          108.84,
          0.12,
          75.95
        ],
        "size": [
          23.9,
          0.1,
          24.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_43",
        "type": "box",
        "position": [
          45.12,
          0.12,
          123.13
        ],
        "size": [
          23.9,
          0.1,
          24.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_44",
        "type": "box",
        "position": [
          125.69,
          0.12,
          125.06
        ],
        "size": [
          23.9,
          0.1,
          24.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_45",
        "type": "box",
        "position": [
          85.39,
          0.12,
          125
        ],
        "size": [
          40.5,
          0.1,
          24.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_46",
        "type": "box",
        "position": [
          109.64,
          0.12,
          116.75
        ],
        "size": [
          8.1,
          0.1,
          8.3
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_47",
        "type": "box",
        "position": [
          61.1,
          0.12,
          116.8
        ],
        "size": [
          8.1,
          0.1,
          8.3
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_48",
        "type": "box",
        "position": [
          92.8,
          0.12,
          162.33
        ],
        "size": [
          40.4,
          0.1,
          24.9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_49",
        "type": "box",
        "position": [
          0.51,
          0.12,
          176.77
        ],
        "size": [
          40.4,
          0.1,
          22.9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_50",
        "type": "box",
        "position": [
          46.63,
          0.16,
          169.52
        ],
        "size": [
          51.9,
          0.2,
          8.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_51",
        "type": "box",
        "position": [
          38.39,
          0.16,
          150.49
        ],
        "size": [
          8.2,
          0.1,
          29.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_52",
        "type": "box",
        "position": [
          26,
          0.16,
          33.28
        ],
        "size": [
          8.4,
          0.2,
          77.7
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_53",
        "type": "box",
        "position": [
          44.49,
          0.16,
          39.18
        ],
        "size": [
          8.3,
          0.1,
          45.4
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_54",
        "type": "box",
        "position": [
          35.24,
          0.16,
          39.14
        ],
        "size": [
          10.2,
          0.1,
          8.9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_55",
        "type": "box",
        "position": [
          87.27,
          0.16,
          17.86
        ],
        "size": [
          9,
          0.1,
          13.5
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_56",
        "type": "box",
        "position": [
          65.73,
          0.16,
          20.5
        ],
        "size": [
          34.1,
          0.1,
          8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_57",
        "type": "box",
        "position": [
          90.22,
          0.16,
          76.49
        ],
        "size": [
          13.5,
          0.1,
          8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_58",
        "type": "box",
        "position": [
          70.12,
          0.16,
          57.64
        ],
        "size": [
          43.1,
          0.1,
          8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_59",
        "type": "box",
        "position": [
          87.45,
          0.16,
          67.04
        ],
        "size": [
          8.6,
          0.1,
          10.9
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_60",
        "type": "box",
        "position": [
          87.98,
          0.16,
          96.59
        ],
        "size": [
          9,
          0.1,
          32.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_61",
        "type": "box",
        "position": [
          50.84,
          0.16,
          91.8
        ],
        "size": [
          8.6,
          0.1,
          37.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_62",
        "type": "box",
        "position": [
          64.14,
          0.16,
          76.81
        ],
        "size": [
          17.9,
          0.1,
          8.4
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_63",
        "type": "box",
        "position": [
          69.07,
          0.16,
          90.1
        ],
        "size": [
          8.3,
          0.1,
          18.2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_64",
        "type": "box",
        "position": [
          78.41,
          0.15,
          95.02
        ],
        "size": [
          10.3,
          0.1,
          8.8
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "wall_7000",
        "type": "box",
        "position": [
          188.52,
          3,
          -66.49
        ],
        "size": [
          9.7,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7001",
        "type": "box",
        "position": [
          202.62,
          3.1,
          -66.49
        ],
        "size": [
          9.7,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7002",
        "type": "box",
        "position": [
          195.56,
          3,
          -95.89
        ],
        "size": [
          23.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7003",
        "type": "box",
        "position": [
          207.21,
          3,
          -81.19
        ],
        "size": [
          0.5,
          6,
          29.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7004",
        "type": "box",
        "position": [
          183.91,
          3,
          -81.19
        ],
        "size": [
          0.5,
          6,
          29.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7005",
        "type": "box",
        "position": [
          195.28,
          3,
          -26.88
        ],
        "size": [
          8.7,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7006",
        "type": "box",
        "position": [
          199.63,
          3,
          -46.68
        ],
        "size": [
          0.5,
          6,
          39.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7007",
        "type": "box",
        "position": [
          190.93,
          3,
          -51.025000000000006
        ],
        "size": [
          0.5,
          6,
          30.910000000000004
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7008",
        "type": "box",
        "position": [
          176.17,
          3,
          -26.270000000000003
        ],
        "size": [
          29.5,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7009",
        "type": "box",
        "position": [
          176.17,
          3,
          -35.57
        ],
        "size": [
          29.5,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7010",
        "type": "box",
        "position": [
          129.89,
          3,
          -8.65
        ],
        "size": [
          15.8,
          6,
          0.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7011",
        "type": "box",
        "position": [
          151.54,
          3,
          -8.65
        ],
        "size": [
          18.4,
          6,
          1.1
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7012",
        "type": "box",
        "position": [
          141.24,
          3,
          -50.05
        ],
        "size": [
          40.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7013",
        "type": "box",
        "position": [
          161.39000000000001,
          3,
          -42.81
        ],
        "size": [
          0.5,
          6,
          14.479999999999997
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7014",
        "type": "box",
        "position": [
          161.39000000000001,
          3,
          -17.46
        ],
        "size": [
          0.5,
          6,
          17.62
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7015",
        "type": "box",
        "position": [
          121.09,
          3,
          -41
        ],
        "size": [
          1,
          6,
          16
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7016",
        "type": "box",
        "position": [
          121.09,
          3,
          -19.06
        ],
        "size": [
          1,
          6,
          19
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7017",
        "type": "box",
        "position": [
          147.94,
          3,
          51.35
        ],
        "size": [
          40.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7018",
        "type": "box",
        "position": [
          133.33,
          3,
          10.35
        ],
        "size": [
          9,
          6,
          2.1
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7019",
        "type": "box",
        "position": [
          154.69,
          3,
          10.35
        ],
        "size": [
          24.810000000000002,
          6,
          1.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7020",
        "type": "box",
        "position": [
          168.09,
          3,
          23.13
        ],
        "size": [
          1.6,
          6,
          24.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7021",
        "type": "box",
        "position": [
          168.09,
          3,
          45.22
        ],
        "size": [
          1.6,
          6,
          10.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7022",
        "type": "box",
        "position": [
          127.78999999999999,
          3,
          30.85
        ],
        "size": [
          0.5,
          6,
          41
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7023",
        "type": "box",
        "position": [
          145.28,
          3,
          -6.035
        ],
        "size": [
          0.5,
          6,
          5.29
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7024",
        "type": "box",
        "position": [
          145.28,
          3,
          7.5649999999999995
        ],
        "size": [
          0.5,
          6,
          5.510000000000001
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7025",
        "type": "box",
        "position": [
          135.28,
          3,
          -6.035
        ],
        "size": [
          0.5,
          6,
          5.29
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7026",
        "type": "box",
        "position": [
          135.28,
          3,
          7.5649999999999995
        ],
        "size": [
          0.5,
          6,
          5.510000000000001
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7027",
        "type": "box",
        "position": [
          120.78,
          3,
          4.81
        ],
        "size": [
          29.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7028",
        "type": "box",
        "position": [
          120.78,
          3,
          -3.3899999999999997
        ],
        "size": [
          29.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7029",
        "type": "box",
        "position": [
          162.08,
          3,
          4.81
        ],
        "size": [
          33.60000000000002,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7030",
        "type": "box",
        "position": [
          166.43,
          3,
          -3.3899999999999997
        ],
        "size": [
          42.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7031",
        "type": "box",
        "position": [
          187.58,
          3,
          0.71
        ],
        "size": [
          0.5,
          6,
          8.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7032",
        "type": "box",
        "position": [
          188.125,
          3,
          23.7
        ],
        "size": [
          17.569999999999993,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7033",
        "type": "box",
        "position": [
          215.525,
          3,
          23.7
        ],
        "size": [
          18.629999999999995,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7034",
        "type": "box",
        "position": [
          202.275,
          3,
          15.099999999999998
        ],
        "size": [
          27.99000000000001,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7035",
        "type": "box",
        "position": [
          224.84,
          3,
          19.4
        ],
        "size": [
          0.5,
          6,
          8.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7036",
        "type": "box",
        "position": [
          179.34,
          3,
          19.4
        ],
        "size": [
          0.5,
          6,
          8.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7037",
        "type": "box",
        "position": [
          188.28,
          3,
          10.01
        ],
        "size": [
          0.5,
          6,
          10.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7038",
        "type": "box",
        "position": [
          178.88000000000002,
          3,
          10.01
        ],
        "size": [
          0.5,
          6,
          10.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7039",
        "type": "box",
        "position": [
          220.77,
          3,
          -3.2799999999999994
        ],
        "size": [
          9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7040",
        "type": "box",
        "position": [
          225.27,
          3,
          10.215
        ],
        "size": [
          0.5,
          6,
          9.809999999999999
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7041",
        "type": "box",
        "position": [
          216.27,
          3,
          5.92
        ],
        "size": [
          0.5,
          6,
          18.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7042",
        "type": "box",
        "position": [
          229.91000000000003,
          3,
          5.31
        ],
        "size": [
          9.280000000000001,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7043",
        "type": "box",
        "position": [
          234.22,
          3,
          -3.29
        ],
        "size": [
          17.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7044",
        "type": "box",
        "position": [
          243.17,
          3,
          1.01
        ],
        "size": [
          0.5,
          6,
          8.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7045",
        "type": "box",
        "position": [
          182.49,
          3,
          42.099999999999994
        ],
        "size": [
          28.8,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7046",
        "type": "box",
        "position": [
          182.49,
          3,
          33.5
        ],
        "size": [
          28.8,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7047",
        "type": "box",
        "position": [
          206.21,
          3,
          37.83
        ],
        "size": [
          0.5,
          6,
          28.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7048",
        "type": "box",
        "position": [
          196.91,
          3,
          28.59
        ],
        "size": [
          0.5,
          6,
          9.82
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7049",
        "type": "box",
        "position": [
          196.91,
          3,
          47.03999999999999
        ],
        "size": [
          0.5,
          6,
          9.880000000000003
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7050",
        "type": "box",
        "position": [
          197.59,
          3,
          60.99
        ],
        "size": [
          36.579999999999984,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7051",
        "type": "box",
        "position": [
          183.95499999999998,
          3,
          51.99
        ],
        "size": [
          25.909999999999997,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7052",
        "type": "box",
        "position": [
          215.40500000000003,
          3,
          51.99
        ],
        "size": [
          18.390000000000015,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7053",
        "type": "box",
        "position": [
          224.60000000000002,
          3,
          56.49
        ],
        "size": [
          0.5,
          6,
          9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7054",
        "type": "box",
        "position": [
          171,
          3,
          56.49
        ],
        "size": [
          0.5,
          6,
          9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7055",
        "type": "box",
        "position": [
          239.05,
          3,
          78.91
        ],
        "size": [
          9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7056",
        "type": "box",
        "position": [
          243.55,
          3,
          42.11
        ],
        "size": [
          0.5,
          6,
          73.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7057",
        "type": "box",
        "position": [
          234.55,
          3,
          38.09
        ],
        "size": [
          0.5,
          6,
          65.56
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7058",
        "type": "box",
        "position": [
          220.49,
          3,
          79.87
        ],
        "size": [
          28.22,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7059",
        "type": "box",
        "position": [
          206.99,
          3,
          70.87
        ],
        "size": [
          17.78,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7060",
        "type": "box",
        "position": [
          229.99,
          3,
          70.87
        ],
        "size": [
          9.219999999999999,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7061",
        "type": "box",
        "position": [
          198.1,
          3,
          75.37
        ],
        "size": [
          0.5,
          6,
          9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7062",
        "type": "box",
        "position": [
          225.38,
          3,
          65.92
        ],
        "size": [
          0.5,
          6,
          9.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7063",
        "type": "box",
        "position": [
          215.88,
          3,
          65.92
        ],
        "size": [
          0.5,
          6,
          9.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7064",
        "type": "box",
        "position": [
          206.38,
          3,
          84.35
        ],
        "size": [
          0.5,
          6,
          9.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7065",
        "type": "box",
        "position": [
          197.38,
          3,
          84.35
        ],
        "size": [
          0.5,
          6,
          9.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7066",
        "type": "box",
        "position": [
          179.48,
          3,
          97.66
        ],
        "size": [
          53.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7067",
        "type": "box",
        "position": [
          179.245,
          3,
          88.96000000000001
        ],
        "size": [
          36.26999999999998,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7068",
        "type": "box",
        "position": [
          206.13,
          3,
          93.31
        ],
        "size": [
          0.5,
          6,
          8.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7069",
        "type": "box",
        "position": [
          152.82999999999998,
          3,
          93.31
        ],
        "size": [
          0.5,
          6,
          8.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7070",
        "type": "box",
        "position": [
          156.61,
          3,
          71.25
        ],
        "size": [
          9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7071",
        "type": "box",
        "position": [
          161.11,
          3,
          84.225
        ],
        "size": [
          0.5,
          6,
          9.449999999999989
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7072",
        "type": "box",
        "position": [
          152.11,
          3,
          80.1
        ],
        "size": [
          0.5,
          6,
          17.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7073",
        "type": "box",
        "position": [
          170.2,
          3,
          79.5
        ],
        "size": [
          18.2,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7074",
        "type": "box",
        "position": [
          165.7,
          3,
          70.5
        ],
        "size": [
          9.200000000000017,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7075",
        "type": "box",
        "position": [
          179.29999999999998,
          3,
          75
        ],
        "size": [
          0.5,
          6,
          9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7076",
        "type": "box",
        "position": [
          179.3,
          3,
          66.01
        ],
        "size": [
          0.5,
          6,
          9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7077",
        "type": "box",
        "position": [
          170.3,
          3,
          66.01
        ],
        "size": [
          0.5,
          6,
          9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7078",
        "type": "box",
        "position": [
          75.41,
          3,
          10.66
        ],
        "size": [
          20,
          6,
          1.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7079",
        "type": "box",
        "position": [
          97.72,
          3,
          10.86
        ],
        "size": [
          16,
          6,
          1.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7080",
        "type": "box",
        "position": [
          71.3,
          3,
          -13.54
        ],
        "size": [
          27,
          6,
          1.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7081",
        "type": "box",
        "position": [
          97.04,
          3,
          -13.24
        ],
        "size": [
          15.3,
          6,
          1.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7082",
        "type": "box",
        "position": [
          106.26,
          3,
          -7.66
        ],
        "size": [
          1.4,
          6,
          12.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7083",
        "type": "box",
        "position": [
          106.26,
          3,
          6.78
        ],
        "size": [
          1.5,
          6,
          7.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7084",
        "type": "box",
        "position": [
          64.86,
          3,
          2.9299999999999997
        ],
        "size": [
          0.5,
          6,
          16.46
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7085",
        "type": "box",
        "position": [
          106.25,
          3,
          -26.86
        ],
        "size": [
          29.639999999999986,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7086",
        "type": "box",
        "position": [
          101.97,
          3,
          -34.96
        ],
        "size": [
          38.2,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7087",
        "type": "box",
        "position": [
          82.87,
          3,
          -30.91
        ],
        "size": [
          0.5,
          6,
          8.1
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7088",
        "type": "box",
        "position": [
          91.43,
          3,
          -20.24
        ],
        "size": [
          0.5,
          6,
          13.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7089",
        "type": "box",
        "position": [
          82.93,
          3,
          -20.24
        ],
        "size": [
          0.5,
          6,
          13.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7090",
        "type": "box",
        "position": [
          60.73,
          3,
          -5.300000000000001
        ],
        "size": [
          8.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7091",
        "type": "box",
        "position": [
          60.73,
          3,
          -13.5
        ],
        "size": [
          8.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7092",
        "type": "box",
        "position": [
          10.17,
          7.7,
          -5.22
        ],
        "size": [
          23.27,
          15.2,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7093",
        "type": "box",
        "position": [
          43.37,
          7.7,
          -5.22
        ],
        "size": [
          26.330000000000002,
          15.2,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7094",
        "type": "box",
        "position": [
          27.53,
          7.7,
          -54.92
        ],
        "size": [
          58,
          15.2,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7095",
        "type": "box",
        "position": [
          56.53,
          7.7,
          -34.21
        ],
        "size": [
          0.5,
          15.2,
          41.42
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7096",
        "type": "box",
        "position": [
          -1.47,
          7.7,
          -30.07
        ],
        "size": [
          0.5,
          15.2,
          49.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7097",
        "type": "box",
        "position": [
          108.84,
          3,
          88.35000000000001
        ],
        "size": [
          23.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7098",
        "type": "box",
        "position": [
          108.84,
          3,
          63.550000000000004
        ],
        "size": [
          23.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7099",
        "type": "box",
        "position": [
          120.79,
          3,
          75.95
        ],
        "size": [
          0.5,
          6,
          24.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7100",
        "type": "box",
        "position": [
          96.89,
          3,
          69.42
        ],
        "size": [
          1.6,
          6,
          9.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7101",
        "type": "box",
        "position": [
          96.89,
          3,
          83.02
        ],
        "size": [
          1.6,
          6,
          8.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7102",
        "type": "box",
        "position": [
          33.730000000000004,
          3,
          135.53
        ],
        "size": [
          1.1199999999999974,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7103",
        "type": "box",
        "position": [
          49.78,
          3,
          135.53
        ],
        "size": [
          14.579999999999991,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7104",
        "type": "box",
        "position": [
          39.855000000000004,
          3,
          110.72999999999999
        ],
        "size": [
          13.370000000000005,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7105",
        "type": "box",
        "position": [
          56.105,
          3,
          110.72999999999999
        ],
        "size": [
          1.9299999999999926,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7106",
        "type": "box",
        "position": [
          57.06999999999999,
          3,
          111.69
        ],
        "size": [
          0.5,
          6,
          1.9200000000000017
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7107",
        "type": "box",
        "position": [
          57.06999999999999,
          3,
          128.24
        ],
        "size": [
          0.5,
          6,
          14.579999999999998
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7108",
        "type": "box",
        "position": [
          33.17,
          3,
          123.13
        ],
        "size": [
          0.5,
          6,
          24.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7109",
        "type": "box",
        "position": [
          125.69,
          3,
          137.46
        ],
        "size": [
          23.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7110",
        "type": "box",
        "position": [
          125.69,
          3,
          112.66
        ],
        "size": [
          23.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7111",
        "type": "box",
        "position": [
          137.64,
          3,
          125.06
        ],
        "size": [
          0.5,
          6,
          24.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7112",
        "type": "box",
        "position": [
          113.74,
          3,
          129.18
        ],
        "size": [
          0.5,
          6,
          16.560000000000002
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7113",
        "type": "box",
        "position": [
          85.39,
          3,
          137.4
        ],
        "size": [
          40.5,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7114",
        "type": "box",
        "position": [
          74.31,
          3,
          112.6
        ],
        "size": [
          18.340000000000003,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7115",
        "type": "box",
        "position": [
          99.06,
          3,
          112.6
        ],
        "size": [
          13.159999999999997,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7116",
        "type": "box",
        "position": [
          105.64,
          3,
          129.15
        ],
        "size": [
          0.5,
          6,
          16.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7117",
        "type": "box",
        "position": [
          65.14,
          3,
          129.175
        ],
        "size": [
          0.5,
          6,
          16.450000000000003
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7118",
        "type": "box",
        "position": [
          109.64,
          3,
          120.9
        ],
        "size": [
          8.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7119",
        "type": "box",
        "position": [
          109.64,
          3,
          112.6
        ],
        "size": [
          8.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7120",
        "type": "box",
        "position": [
          61.1,
          3,
          120.95
        ],
        "size": [
          8.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7121",
        "type": "box",
        "position": [
          61.1,
          3,
          112.64999999999999
        ],
        "size": [
          8.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7122",
        "type": "box",
        "position": [
          92.8,
          3,
          174.78
        ],
        "size": [
          40.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7123",
        "type": "box",
        "position": [
          92.8,
          3,
          149.88000000000002
        ],
        "size": [
          40.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7124",
        "type": "box",
        "position": [
          113,
          3,
          162.33
        ],
        "size": [
          0.5,
          6,
          24.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7125",
        "type": "box",
        "position": [
          72.6,
          3,
          158.95
        ],
        "size": [
          1.6,
          6,
          17
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7126",
        "type": "box",
        "position": [
          72.6,
          3,
          174.2
        ],
        "size": [
          0.5,
          6,
          1.1599999999999966
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7127",
        "type": "box",
        "position": [
          0.51,
          3,
          188.92
        ],
        "size": [
          40.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7128",
        "type": "box",
        "position": [
          0.51,
          3,
          164.62
        ],
        "size": [
          40.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7129",
        "type": "box",
        "position": [
          20.71,
          3,
          176.22
        ],
        "size": [
          1.6,
          6,
          9.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7130",
        "type": "box",
        "position": [
          20.71,
          3,
          184.47
        ],
        "size": [
          0.5,
          6,
          8.099999999999994
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7131",
        "type": "box",
        "position": [
          -19.39,
          3,
          176.17
        ],
        "size": [
          0.5,
          6,
          24.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7132",
        "type": "box",
        "position": [
          46.63,
          3,
          173.62
        ],
        "size": [
          51.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7133",
        "type": "box",
        "position": [
          27.485,
          3,
          165.42000000000002
        ],
        "size": [
          13.609999999999996,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7134",
        "type": "box",
        "position": [
          57.535,
          3,
          165.42000000000002
        ],
        "size": [
          30.089999999999996,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7135",
        "type": "box",
        "position": [
          42.49,
          3,
          150.49
        ],
        "size": [
          0.5,
          6,
          29.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7136",
        "type": "box",
        "position": [
          34.29,
          3,
          150.49
        ],
        "size": [
          0.5,
          6,
          29.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7137",
        "type": "box",
        "position": [
          26,
          3,
          72.13
        ],
        "size": [
          8.4,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7138",
        "type": "box",
        "position": [
          30.2,
          3,
          14.559999999999999
        ],
        "size": [
          0.5,
          6,
          40.26
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7139",
        "type": "box",
        "position": [
          30.2,
          3,
          57.86
        ],
        "size": [
          0.5,
          6,
          28.539999999999992
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7140",
        "type": "box",
        "position": [
          21.8,
          3,
          33.28
        ],
        "size": [
          0.5,
          6,
          77.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7141",
        "type": "box",
        "position": [
          44.49,
          3,
          61.879999999999995
        ],
        "size": [
          8.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7142",
        "type": "box",
        "position": [
          44.49,
          3,
          16.48
        ],
        "size": [
          8.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7143",
        "type": "box",
        "position": [
          48.64,
          3,
          39.07
        ],
        "size": [
          0.5,
          6,
          29.14
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7144",
        "type": "box",
        "position": [
          40.34,
          3,
          25.585
        ],
        "size": [
          0.5,
          6,
          18.209999999999997
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7145",
        "type": "box",
        "position": [
          40.34,
          3,
          52.735
        ],
        "size": [
          0.5,
          6,
          18.289999999999992
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7146",
        "type": "box",
        "position": [
          35.24,
          3,
          43.59
        ],
        "size": [
          10.2,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7147",
        "type": "box",
        "position": [
          35.24,
          3,
          34.69
        ],
        "size": [
          10.2,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7148",
        "type": "box",
        "position": [
          87.27,
          3,
          24.61
        ],
        "size": [
          9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7149",
        "type": "box",
        "position": [
          91.77,
          3,
          17.86
        ],
        "size": [
          0.5,
          6,
          13.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7150",
        "type": "box",
        "position": [
          82.77,
          3,
          13.805
        ],
        "size": [
          0.5,
          6,
          5.390000000000001
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7151",
        "type": "box",
        "position": [
          65.73,
          3,
          24.5
        ],
        "size": [
          34.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7152",
        "type": "box",
        "position": [
          65.73,
          3,
          16.5
        ],
        "size": [
          34.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7153",
        "type": "box",
        "position": [
          94.725,
          3,
          80.49
        ],
        "size": [
          4.489999999999995,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7154",
        "type": "box",
        "position": [
          94.36,
          3,
          72.49
        ],
        "size": [
          5.219999999999999,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7155",
        "type": "box",
        "position": [
          83.47,
          3,
          76.49
        ],
        "size": [
          0.5,
          6,
          8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7156",
        "type": "box",
        "position": [
          65.86000000000001,
          3,
          61.64
        ],
        "size": [
          34.58,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7157",
        "type": "box",
        "position": [
          70.12,
          3,
          53.64
        ],
        "size": [
          43.1,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7158",
        "type": "box",
        "position": [
          91.67,
          3,
          57.64
        ],
        "size": [
          0.5,
          6,
          8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7159",
        "type": "box",
        "position": [
          91.75,
          3,
          67.04
        ],
        "size": [
          0.5,
          6,
          10.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7160",
        "type": "box",
        "position": [
          83.15,
          3,
          67.04
        ],
        "size": [
          0.5,
          6,
          10.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7161",
        "type": "box",
        "position": [
          92.48,
          3,
          96.59
        ],
        "size": [
          0.5,
          6,
          32.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7162",
        "type": "box",
        "position": [
          83.48,
          3,
          85.555
        ],
        "size": [
          0.5,
          6,
          10.129999999999981
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7163",
        "type": "box",
        "position": [
          83.48,
          3,
          106.055
        ],
        "size": [
          0.5,
          6,
          13.269999999999996
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7164",
        "type": "box",
        "position": [
          50.84,
          3,
          72.9
        ],
        "size": [
          8.6,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7165",
        "type": "box",
        "position": [
          55.14,
          3,
          95.85499999999999
        ],
        "size": [
          0.5,
          6,
          29.689999999999984
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7166",
        "type": "box",
        "position": [
          46.540000000000006,
          3,
          91.8
        ],
        "size": [
          0.5,
          6,
          37.8
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7167",
        "type": "box",
        "position": [
          60.05499999999999,
          3,
          81.01
        ],
        "size": [
          9.72999999999999,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7168",
        "type": "box",
        "position": [
          64.14,
          3,
          72.61
        ],
        "size": [
          17.9,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7169",
        "type": "box",
        "position": [
          73.09,
          3,
          76.81
        ],
        "size": [
          0.5,
          6,
          8.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7170",
        "type": "box",
        "position": [
          69.07,
          3,
          99.19999999999999
        ],
        "size": [
          8.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7171",
        "type": "box",
        "position": [
          73.22,
          3,
          85.81
        ],
        "size": [
          0.5,
          6,
          9.61999999999999
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7172",
        "type": "box",
        "position": [
          64.91999999999999,
          3,
          90.1
        ],
        "size": [
          0.5,
          6,
          18.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7173",
        "type": "box",
        "position": [
          78.41,
          3,
          99.42
        ],
        "size": [
          10.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7174",
        "type": "box",
        "position": [
          78.41,
          3,
          90.61999999999999
        ],
        "size": [
          10.3,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_10",
        "type": "box",
        "position": [
          195.52,
          6.76,
          -65.87
        ],
        "size": [
          4,
          2,
          2
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_10",
        "type": "box",
        "position": [
          161.53,
          6.98,
          -31.09
        ],
        "size": [
          2,
          2,
          8.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_11",
        "type": "box",
        "position": [
          161.33,
          3.71,
          -34.08
        ],
        "size": [
          1.5,
          6,
          2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_12",
        "type": "box",
        "position": [
          161.43,
          3.64,
          -27.73
        ],
        "size": [
          1.4,
          6,
          2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_10",
        "type": "box",
        "position": [
          121,
          6.63,
          -30.9
        ],
        "size": [
          1.1,
          2,
          4.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          140.3,
          7.1,
          -8.58
        ],
        "size": [
          4,
          2,
          1.1
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_10",
        "type": "box",
        "position": [
          106.22,
          7.03,
          0.83
        ],
        "size": [
          1.2,
          2,
          4.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_11",
        "type": "box",
        "position": [
          87.37,
          6.73,
          -13.37
        ],
        "size": [
          4.2,
          2,
          1.1
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_12",
        "type": "box",
        "position": [
          87.6,
          7.01,
          10.85
        ],
        "size": [
          4,
          2,
          1.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_13",
        "type": "box",
        "position": [
          140.05,
          6.89,
          10.35
        ],
        "size": [
          4.2,
          2,
          1.6
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_16",
        "type": "box",
        "position": [
          168.14,
          6.97,
          37.64
        ],
        "size": [
          1.6,
          2,
          4.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_17",
        "type": "box",
        "position": [
          96.91,
          6.82,
          76.51
        ],
        "size": [
          1.6,
          2,
          4.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_19",
        "type": "box",
        "position": [
          72.72,
          3.12,
          172.79
        ],
        "size": [
          1.6,
          6,
          1.9
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_20",
        "type": "box",
        "position": [
          72.72,
          7,
          169.59
        ],
        "size": [
          1.6,
          2,
          4.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_21",
        "type": "box",
        "position": [
          20.48,
          3.23,
          166.4
        ],
        "size": [
          1.6,
          6,
          1.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_22",
        "type": "box",
        "position": [
          20.68,
          7.06,
          169.3
        ],
        "size": [
          1.6,
          2,
          4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          134.35,
          3.77,
          23.64
        ],
        "size": [
          11.7,
          7.2,
          1.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_17",
        "type": "box",
        "position": [
          134.32,
          2.96,
          33.17
        ],
        "size": [
          11.7,
          7.2,
          1.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_18",
        "type": "box",
        "position": [
          134.39,
          3.56,
          42.3
        ],
        "size": [
          11.7,
          7.2,
          1.7
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_19",
        "type": "box",
        "position": [
          140.91,
          3.64,
          25.23
        ],
        "size": [
          1.5,
          7.2,
          5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_20",
        "type": "box",
        "position": [
          140.93,
          3.66,
          34.78
        ],
        "size": [
          1.5,
          7.2,
          5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_22",
        "type": "box",
        "position": [
          140.88,
          3.99,
          43.97
        ],
        "size": [
          1.5,
          7.2,
          5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          27.4,
          4.33,
          -47.91
        ],
        "size": [
          56.7,
          0.1,
          12.6
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_16",
        "type": "box",
        "position": [
          27.71,
          2.12,
          -41.79
        ],
        "size": [
          28.7,
          4.5,
          0.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_17",
        "type": "box",
        "position": [
          6.68,
          2.17,
          -39.44
        ],
        "size": [
          11.5,
          0.1,
          6.2
        ],
        "rotation": [
          44,
          0,
          0
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_18",
        "type": "box",
        "position": [
          48.84,
          2.27,
          -39.74
        ],
        "size": [
          11.6,
          0.1,
          6
        ],
        "rotation": [
          44,
          0,
          0
        ],
        "materialType": "ground",
        "meshName": null
      },
      {
        "id": "collider_19",
        "type": "box",
        "position": [
          12.98,
          0.93,
          -39.72
        ],
        "size": [
          1.2,
          1.5,
          4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_20",
        "type": "box",
        "position": [
          12.98,
          2.98,
          -40.98
        ],
        "size": [
          1.2,
          2.5,
          1.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_21",
        "type": "box",
        "position": [
          12.98,
          2.25,
          -39.72
        ],
        "size": [
          1.2,
          1.1,
          1.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_22",
        "type": "box",
        "position": [
          42.43,
          2.33,
          -39.89
        ],
        "size": [
          1.2,
          1.1,
          1.2
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_23",
        "type": "box",
        "position": [
          42.33,
          0.89,
          -39.76
        ],
        "size": [
          1.2,
          1.9,
          4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_24",
        "type": "box",
        "position": [
          42.33,
          3,
          -41.09
        ],
        "size": [
          1.2,
          2.3,
          1.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          188.82,
          2.93,
          -92.23
        ],
        "size": [
          5.7,
          7,
          6.4
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          204,
          1.45,
          -82.54
        ],
        "size": [
          5.7,
          2.5,
          8.1
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_16",
        "type": "box",
        "position": [
          186.31,
          0.75,
          -74.02
        ],
        "size": [
          2.4,
          1.4,
          3.3
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          204.59,
          1.44,
          -87.89
        ],
        "size": [
          1.757465370328589,
          2.5572642381467574,
          1.7574413663201511
        ],
        "materialType": "wall",
        "meshName": "chair002"
      },
      {
        "id": "collider_16",
        "type": "box",
        "position": [
          204.84,
          1.44,
          -77.08
        ],
        "size": [
          2.152840001657381,
          2.5572642381467574,
          2.152830954113398
        ],
        "materialType": "wall",
        "meshName": "chair003"
      },
      {
        "id": "collider_17",
        "type": "box",
        "position": [
          124.62,
          2.36,
          -45.85
        ],
        "size": [
          4.35594794524178,
          4.466686896193157,
          4.690001612282799
        ],
        "materialType": "wall",
        "meshName": "crates_stacked"
      },
      {
        "id": "collider_18",
        "type": "box",
        "position": [
          137.08,
          4.29,
          -49.6
        ],
        "size": [
          7.072999954223633,
          8.34000015258789,
          2.85144659878398
        ],
        "materialType": "wall",
        "meshName": "wall_shelves"
      },
      {
        "id": "collider_19",
        "type": "box",
        "position": [
          144.78,
          4.29,
          -49.6
        ],
        "size": [
          8.34000015258789,
          8.34000015258789,
          2.85144659878398
        ],
        "materialType": "wall",
        "meshName": "wall_shelves001"
      },
      {
        "id": "collider_20",
        "type": "box",
        "position": [
          157.44,
          2.26,
          -44.43
        ],
        "size": [
          5.124869306974489,
          4.275760503148355,
          7.8348425867092
        ],
        "materialType": "wall",
        "meshName": "keg_decorated"
      },
      {
        "id": "collider_21",
        "type": "box",
        "position": [
          157.94,
          1.97,
          -14.85
        ],
        "size": [
          4.052922466748356,
          3.690738274420097,
          4.30761308253085
        ],
        "materialType": "wall",
        "meshName": "barrel_small_stack"
      },
      {
        "id": "collider_22",
        "type": "box",
        "position": [
          155.39,
          1.97,
          -11.73
        ],
        "size": [
          4.052922466748356,
          3.690738274420097,
          4.30761308253085
        ],
        "materialType": "wall",
        "meshName": "barrel_small_stack001"
      },
      {
        "id": "collider_23",
        "type": "box",
        "position": [
          124.47,
          3.01,
          -17.64
        ],
        "size": [
          4.170001070499438,
          5.7703789499025575,
          8.392271500590141
        ],
        "materialType": "wall",
        "meshName": "table_long_decorated_C"
      },
      {
        "id": "collider_24",
        "type": "box",
        "position": [
          124.59,
          0.65,
          -11.65
        ],
        "size": [
          1.5637501528859161,
          1.042499956935643,
          1.5637740138177492
        ],
        "materialType": "wall",
        "meshName": "stool"
      },
      {
        "id": "collider_25",
        "type": "box",
        "position": [
          164.35,
          1.17,
          21.16
        ],
        "size": [
          4.170000821948065,
          2.0849998672679035,
          8.340001146793384
        ],
        "materialType": "wall",
        "meshName": "table_long"
      },
      {
        "id": "collider_26",
        "type": "box",
        "position": [
          162.77,
          3.57,
          46.61
        ],
        "size": [
          8.7,
          6.8990676468725525,
          6.7
        ],
        "materialType": "wall",
        "meshName": "box_stacked001"
      },
      {
        "id": "collider_27",
        "type": "box",
        "position": [
          154.06,
          1.67,
          48.99
        ],
        "size": [
          3.1848668356683163,
          3.0917049312002973,
          3.1795514938651124
        ],
        "materialType": "wall",
        "meshName": "box_small_decorated"
      },
      {
        "id": "collider_28",
        "type": "box",
        "position": [
          131.43,
          1.69,
          13.76
        ],
        "size": [
          4.260210182779048,
          3.1274999329447724,
          4.2602102300157
        ],
        "materialType": "wall",
        "meshName": "box_large"
      },
      {
        "id": "collider_29",
        "type": "box",
        "position": [
          118.24,
          1.67,
          66.17
        ],
        "size": [
          3.1465359855462083,
          3.0917049312002973,
          3.1519117178215623
        ],
        "materialType": "wall",
        "meshName": "box_small_decorated001"
      },
      {
        "id": "collider_30",
        "type": "box",
        "position": [
          101.78,
          3.57,
          68.04
        ],
        "size": [
          7.7,
          6.1,
          7.5
        ],
        "materialType": "wall",
        "meshName": "box_stacked002"
      },
      {
        "id": "collider_31",
        "type": "box",
        "position": [
          49.02,
          1.21,
          133.02
        ],
        "size": [
          3.349154446603606,
          2.16980228698435,
          2.614415169395528
        ],
        "materialType": "wall",
        "meshName": "chest_gold"
      },
      {
        "id": "collider_32",
        "type": "box",
        "position": [
          36.79,
          2.79,
          114.43
        ],
        "size": [
          4.040640519874842,
          5.330205046825412,
          3.868601585774684
        ],
        "materialType": "wall",
        "meshName": "barrel_large_decorated"
      },
      {
        "id": "collider_33",
        "type": "box",
        "position": [
          89.57,
          1.97,
          135.2
        ],
        "size": [
          3.8625783454449305,
          3.690738274420097,
          2.0943309827061967
        ],
        "materialType": "wall",
        "meshName": "barrel_small_stack002"
      },
      {
        "id": "collider_34",
        "type": "box",
        "position": [
          81.71,
          3.01,
          134.11
        ],
        "size": [
          8.393263917184925,
          5.7703789499025575,
          4.171997504070561
        ],
        "materialType": "wall",
        "meshName": "table_long_decorated_C001"
      },
      {
        "id": "collider_35",
        "type": "box",
        "position": [
          71.1,
          2.26,
          134.35
        ],
        "size": [
          7.337932731056867,
          4.275760503148355,
          4.170000076293945
        ],
        "materialType": "wall",
        "meshName": "keg_decorated001"
      },
      {
        "id": "collider_36",
        "type": "box",
        "position": [
          93.68,
          1.97,
          135.05
        ],
        "size": [
          3.8625783454449305,
          3.690738274420097,
          2.0943309827061967
        ],
        "materialType": "wall",
        "meshName": "barrel_small_stack003"
      },
      {
        "id": "collider_15",
        "type": "box",
        "position": [
          120.71,
          1.21,
          134.96
        ],
        "size": [
          3.396459982979863,
          2.16980228698435,
          2.67561891825045
        ],
        "materialType": "wall",
        "meshName": "chest_gold001"
      },
      {
        "id": "collider_16",
        "type": "box",
        "position": [
          100.57,
          3.57,
          132.58
        ],
        "size": [
          7.245948341737744,
          6.8990676468725525,
          7.578448686971569
        ],
        "materialType": "wall",
        "meshName": "box_stacked003"
      },
      {
        "id": "collider_17",
        "type": "box",
        "position": [
          135.14,
          2.37,
          120.4
        ],
        "size": [
          2.1111022819883942,
          4.497112573409595,
          2.0850000381469727
        ],
        "materialType": "wall",
        "meshName": "table_small_decorated_B"
      },
      {
        "id": "collider_18",
        "type": "box",
        "position": [
          78.94,
          1.44,
          153.65
        ],
        "size": [
          9.687037760079306,
          2.640169605041251,
          6.017541128824746
        ],
        "materialType": "wall",
        "meshName": "table_long_broken"
      },
      {
        "id": "collider_19",
        "type": "box",
        "position": [
          107.07,
          1.44,
          153.64
        ],
        "size": [
          9.466253568379997,
          2.640169605041251,
          5.561150127080623
        ],
        "materialType": "wall",
        "meshName": "table_long_broken001"
      },
      {
        "id": "collider_20",
        "type": "box",
        "position": [
          109.13,
          1.14,
          171.19
        ],
        "size": [
          4.746952188438058,
          2.026126515893545,
          5.063198392341803
        ],
        "materialType": "wall",
        "meshName": "table_medium_broken"
      },
      {
        "id": "collider_21",
        "type": "box",
        "position": [
          -15.77,
          1.14,
          185.58
        ],
        "size": [
          6.501108033266455,
          2.026126515893545,
          6.644120551591669
        ],
        "materialType": "wall",
        "meshName": "table_medium_broken001"
      },
      {
        "id": "collider_22",
        "type": "box",
        "position": [
          -9.03,
          1.44,
          185.92
        ],
        "size": [
          9.570408109219692,
          2.640169605041251,
          5.771688765302258
        ],
        "materialType": "wall",
        "meshName": "table_long_broken002"
      },
      {
        "id": "collider_23",
        "type": "box",
        "position": [
          -14.81,
          3.77,
          168.25
        ],
        "size": [
          8.339277862299657,
          7.297500146141733,
          6.255000362992291
        ],
        "materialType": "wall",
        "meshName": "rubble_half001"
      },
      {
        "id": "collider_24",
        "type": "box",
        "position": [
          8.01,
          0.75,
          186.52
        ],
        "size": [
          3.336000110745431,
          1.2510001968741449,
          2.5974991752096344
        ],
        "materialType": "wall",
        "meshName": "chest001"
      },
      {
        "id": "collider_25",
        "type": "box",
        "position": [
          18.03,
          1.81,
          186.62
        ],
        "size": [
          2.16635034337466,
          3.3804100273628137,
          2.5254335686679497
        ],
        "materialType": "wall",
        "meshName": "table_small_decorated_A"
      },
      {
        "id": "collider_26",
        "type": "box",
        "position": [
          90.08,
          3.57,
          153.81
        ],
        "size": [
          6.6,
          6.2,
          7.9
        ],
        "materialType": "wall",
        "meshName": "box_stacked004"
      },
      {
        "id": "collider_27",
        "type": "box",
        "position": [
          92.78,
          4.33,
          10.49
        ],
        "size": [
          4.6537252908040045,
          8.34000015258789,
          3.5656915300789365
        ],
        "materialType": "wall",
        "meshName": "pillar_decorated003"
      },
      {
        "id": "collider_28",
        "type": "box",
        "position": [
          116.06,
          3.57,
          83.54
        ],
        "size": [
          7.245948341737744,
          6.8990676468725525,
          7.578448686971569
        ],
        "materialType": "wall",
        "meshName": "box_stacked005"
      },
      {
        "id": "collider_29",
        "type": "box",
        "position": [
          115.15,
          1.76,
          128.84
        ],
        "size": [
          1.9397143695487529,
          3.4966749854724894,
          4.655946352112522
        ],
        "materialType": "wall",
        "meshName": "sword_shield_gold"
      },
      {
        "id": "collider_30",
        "type": "box",
        "position": [
          115.15,
          1.76,
          124.05
        ],
        "size": [
          1.9397143695487529,
          3.4966749854724894,
          4.655946352112508
        ],
        "materialType": "wall",
        "meshName": "sword_shield_gold001"
      }
    ],
    "fallbackObjects": [
      {
        "type": "box",
        "position": [
          0,
          0,
          0
        ],
        "size": [
          50,
          1,
          50
        ],
        "color": 7048739
      }
    ]
  },
  
];// Data-driven level definitions with GLTF geometry loading
