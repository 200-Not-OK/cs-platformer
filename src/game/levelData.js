// src/game/levels.js
// Data-driven level definitions with GLTF geometry loading
export const levels = [
  {
    id: "intro",
    name: "Intro Level",
    gltfUrl: "src/assets/levels/introLevel.gltf",
    startPosition: [0, 15, 8],
    ui: [
      "hud",
      "fps",
      {
        type: "collectibles",
        config: {
          applesTotal: 12,
          potionsStart: 2,
          scoreStart: 0,
          pointsPerApple: 150,
          collectibleTypes: {
            apples: {
              icon: "🍎",
              name: "Red Apples",
              color: "#ff6b6b",
              completeColor: "#51cf66",
              completeIcon: "🏆"
            },
            potions: {
              icon: "🧪",
              name: "Health Potions",
              color: "#4dabf7",
              lowColor: "#ffd43b",
              emptyColor: "#ff6b6b",
              emptyIcon: "💔"
            },
            score: {
              icon: "⭐",
              name: "Score",
              color: "#ffd43b"
            }
          }
        }
      }
    ],
    lights: ["BasicLights"],
    enemies: [
      {
        type: "snake",
        position: [-5, 2, 5],
        modelUrl: "src/assets/enemies/snake/scene.gltf",
        patrolPoints: [
          [-5, 1, 5, 0.3],
          [-8, 1, 8, 0.3],
          [-3, 1, 10, 0.3]
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
        position: [0, 0, 0],
        size: [42.917484283447266, 0.5594812631607056, 38.855934143066406],
        materialType: "ground",
        meshName: "collider_playground"
      },
      {
        id: "collider_11",
        type: "box",
        position: [-21.06, 3.44, 0],
        size: [0.7933826446533203, 6.32648104429245, 38.855934143066406],
        materialType: "wall",
        meshName: "collider_playground001"
      },
      {
        id: "collider_12",
        type: "box",
        position: [0, 3.44, -19.03],
        size: [42.917484283447266, 6.32648104429245, 0.7933826446533203],
        materialType: "wall",
        meshName: "collider_playground002"
      },
      {
        id: "collider_13",
        type: "box",
        position: [0, 3.44, 19.03],
        size: [42.917484283447266, 6.32648104429245, 0.7933826446533203],
        materialType: "wall",
        meshName: "collider_playground004"
      },
      {
        id: "collider_14",
        type: "box",
        position: [21.06, 3.44, 0],
        size: [0.7933826446533203, 6.32648104429245, 38.855934143066406],
        materialType: "wall",
        meshName: "collider_playground003"
      }
    ],
    cinematics: {
      onLevelStart: {
        type: "dialogue",
        character: "narrator",
        lines: [
          { text: "Welcome to the training grounds!", duration: 3000 },
          { text: "Use WASD to move and Space to jump.", duration: 4000 }
        ]
      },
      onEnemyDefeat: {
        type: "cutscene",
        cameraPath: [
          {
            position: [10, 5, 10],
            lookAt: [0, 0, 0],
            duration: 2000
          }
        ],
        dialogue: [
          { character: "player", text: "One down, more to go!", duration: 2000 }
        ]
      }
    }
  },

    {
    id: "linked_list_labyrinth",
    name: "Linked List Labyrinth",

    // Optional: swap to your GLTF when ready; fallback keeps it playable now
    // gltfUrl: "src/assets/levels/linked_list_lab.gltf",

    // Player spawn
    startPosition: [0, 3, 8],

    // UI composition (world map is always re-added by applyLevelUI)
    ui: ["hud", "minimap", "objectives", "worldmap", "menu", "timer"],

    // Objectives shown in the Objectives UI
    objectives: [
      "Link the nodes in the target order",
      "Reverse the linked list",
      "Reveal the passcode & unlock the door"
    ],

    // Linked-list nodes
    nodePoints: [
      [-12, 3.6, 0],
      [-6, 3.6, 6],
      [0, 3.6, 0],
      [6, 3.6, -6],
      [12, 3.6, 4]
    ],
    nodeOrder: [0, 2, 1, 4, 3],
    firstBugSpawn: [6, 3, -4],

    // Countdown HUD
    timerSeconds: 120,

    // Cinematics & dialogue
    cinematics: {
      onLevelStart: {
        type: "cutscene",
        sequence: [
          { position: [0, 8, 18], lookAt: [0, 3, 0], duration: 1200, linger: 300 },
          { useNodeTour: true, tourHeight: 5.5, radius: 4.5, perNodeMs: 750, gapMs: 150 },
          { position: [6, 5, -2], lookAt: [6, 3, -4], duration: 900, linger: 300 }
        ],
        dialogue: [
          { character: "RICHARD", text: "Welcome to the Linked List Labyrinth.", duration: 2400 },
          { character: "RICHARD", text: "Link the nodes in order… then reverse them.", duration: 2600 },
          { character: "RICHARD", text: "Time is not your friend.", duration: 1800 }
        ],
        after: "spawnFirstBug"
      },

      timeWarning30: {
        type: "dialogue",
        character: "RICHARD",
        lines: [
          { text: "You’re running out of time! 30 seconds!", duration: 2200 },
          { text: "Those bugs are getting smarter—finish the list, quick!", duration: 2200 }
        ]
      },

      bugIntro: {
        type: "dialogue",
        character: "RICHARD",
        lines: [
          { text: "Oh no! A bug has entered the system!", duration: 2200 },
          { text: "If it steals a node, chase it down before it hides it away!", duration: 2600 }
        ]
      },

      bugChaos: {
        type: "dialogue",
        character: "RICHARD",
        lines: [
          { text: "Another bug?! They really can’t leave my lab alone!", duration: 2400 },
          { text: "Keep it together—you’ve got this!", duration: 2000 }
        ]
      },

      onLevelComplete: {
        type: "dialogue",
        character: "RICHARD",
        lines: [
          { text: "You did it! Passcode unlocked and door open—brilliant!", duration: 2800 },
          { text: "Looks like those bugs underestimated you.", duration: 2200 },
          { text: "Level two awaits. No bugs allowed… for now!", duration: 2200 }
        ]
      },

      onLevelFail: {
        type: "dialogue",
        character: "RICHARD",
        lines: [
          { text: "Time’s up! The bugs caused too much chaos.", duration: 2400 },
          { text: "Regroup and try again—I know you can crack it.", duration: 2400 }
        ]
      }
    },

    // Lighting: cinematic atmosphere + scanning spotlight
    lights: [
      "BasicLights",
      { key: "FogPulse", props: { color: 0x0b1020, density: 0.012, pulseSpeed: 0.3, densityMin: 0.008, densityMax: 0.02 } },
      { key: "SpotSweep", props: { position: [0, 9, 0], sweepAmplitude: Math.PI / 4, sweepSpeed: 0.6, intensity: 2.8 } }
    ],

    // TEMP enemies as “bugs”
    enemies: [
      { type: "runner", position: [6, 3, -4], modelUrl: "src/assets/low_poly_male/scene.gltf", speed: 4.5, chaseRange: 10 },
      { type: "jumper", position: [-6, 3, 2], modelUrl: "src/assets/low_poly_female/scene.gltf", jumpInterval: 1.6, jumpStrength: 6.2 }
    ],

    // Procedural fallback geometry (keeps level playable without GLTF)
    fallbackObjects: [
      { type: "box", position: [0, 0, 0], size: [90, 1, 90], color: 0x1a2233 },
      { type: "box", position: [45, 2, 0], size: [1, 6, 90], color: 0x263247 },
      { type: "box", position: [-45, 2, 0], size: [1, 6, 90], color: 0x263247 },
      { type: "box", position: [0, 2, 45], size: [90, 6, 1], color: 0x263247 },
      { type: "box", position: [0, 2, -45], size: [90, 6, 1], color: 0x263247 },

      // raised lab platforms
      { type: "box", position: [-16, 2.0, -12], size: [14, 1, 10], color: 0x2a3954 },
      { type: "box", position: [16, 2.0, -12], size: [14, 1, 10], color: 0x2a3954 },
      { type: "box", position: [0, 2.0, 14], size: [24, 1, 10], color: 0x2a3954 },

      // node pads
      { type: "box", position: [-12, 3.1, 0], size: [1.5, 0.4, 1.5], color: 0x2dd4bf },
      { type: "box", position: [-6, 3.1, 6], size: [1.5, 0.4, 1.5], color: 0x93c5fd },
      { type: "box", position: [0, 3.1, 0], size: [1.5, 0.4, 1.5], color: 0xfab387 },
      { type: "box", position: [6, 3.1, -6], size: [1.5, 0.4, 1.5], color: 0xa6e3a1 },
      { type: "box", position: [12, 3.1, 4], size: [1.5, 0.4, 1.5], color: 0xf38ba8 },

      // door placeholder
      { type: "box", position: [0, 4, -44.5], size: [8, 8, 1], color: 0x4c566a },

      // Reverse Station set
      { type: "box", position: [28, 3.2, 18], size: [8, 0.5, 6], color: 0x1f2a38 },
      { type: "box", position: [27, 4.1, 18], size: [2, 2, 2], color: 0x334155 },
      { type: "box", position: [27, 5.2, 17.2], size: [2.2, 1.2, 0.2], color: 0x8ecaff },
      { type: "box", position: [24.5, 3.7, 18], size: [0.2, 1.4, 6], color: 0x93a1b1 },
      { type: "box", position: [31.5, 3.7, 18], size: [0.2, 1.4, 6], color: 0x93a1b1 },
      { type: "box", position: [28, 4.3, 20.8], size: [8, 2.0, 0.2], color: 0x2b3648 },
      { type: "box", position: [25.2, 4.8, 20.8], size: [0.3, 0.3, 0.2], color: 0x22c55e },
      { type: "box", position: [26.0, 4.8, 20.8], size: [0.3, 0.3, 0.2], color: 0xf59e0b },
      { type: "box", position: [26.8, 4.8, 20.8], size: [0.3, 0.3, 0.2], color: 0xef4444 }
    ],

    // Reverse station metadata used by Level to enable interaction (press E)
    reverseStation: {
      position: [28, 3.2, 18],
      interactRadius: 3.0
    }
  },

  {
    id: "level2",
    name: "Level 2",
    gltfUrl: "src/assets/levels/Level2/Level2.gltf",
    startPosition: [195, 6, -82],
    ui: [
      "hud",
      "minimap",
      {
        type: "collectibles",
        config: {
          applesTotal: 8,
          potionsStart: 5,
          scoreStart: 1500,
          pointsPerApple: 200,
          collectibleTypes: {
            apples: {
              icon: "🍏",
              name: "Green Apples",
              color: "#51cf66",
              completeColor: "#ffd43b",
              completeIcon: "👑"
            },
            potions: {
              icon: "🧪",
              name: "Mana Potions",
              color: "#9775fa",
              lowColor: "#ffd43b",
              emptyColor: "#ff6b6b",
              emptyIcon: "💔"
            },
            score: {
              icon: "💎",
              name: "Score",
              color: "#66d9ef"
            }
          }
        }
      }
    ],
    lights: ["BasicLights"],
    enemies: [],
    colliders: [
      { id: "collider_20", type: "box", position: [195.56, 0.16, -81.19], size: [23.3, 0.1, 29.4], materialType: "ground", meshName: null },
      { id: "collider_21", type: "box", position: [195.28, 0.16, -46.68], size: [8.7, 0.1, 39.6], materialType: "ground", meshName: null },
      { id: "collider_22", type: "box", position: [176.17, 0.16, -30.92], size: [29.5, 0.1, 9.3], materialType: "ground", meshName: null },
      { id: "collider_23", type: "box", position: [141.24, 0.16, -29.35], size: [40.3, 0.1, 41.4], materialType: "ground", meshName: null },
      { id: "collider_24", type: "box", position: [147.94, 0.12, 30.85], size: [40.3, 0.1, 41], materialType: "ground", meshName: null },
      { id: "collider_25", type: "box", position: [140.28, 0.16, 0.82], size: [10, 0.1, 19], materialType: "ground", meshName: null },
      { id: "collider_26", type: "box", position: [120.78, 0.16, 0.71], size: [29.1, 0.1, 8.2], materialType: "ground", meshName: null },
      { id: "collider_15", type: "box", position: [166.43, 0.16, 0.71], size: [42.3, 0.1, 8.2], materialType: "ground", meshName: null },
      { id: "collider_17", type: "box", position: [202.09, 0.14, 19.4], size: [45.5, 0.1, 8.6], materialType: "ground", meshName: null },
      { id: "collider_18", type: "box", position: [183.58, 0.16, 10.01], size: [9.4, 0.1, 10.3], materialType: "ground", meshName: null },
      { id: "collider_19", type: "box", position: [220.77, 0.16, 5.92], size: [9, 0.1, 18.4], materialType: "ground", meshName: null },
      { id: "collider_20", type: "box", position: [234.22, 0.16, 1.01], size: [17.9, 0.1, 8.6], materialType: "ground", meshName: null },
      { id: "collider_21", type: "box", position: [182.49, 0.16, 37.8], size: [28.8, 0.1, 8.6], materialType: "ground", meshName: null },
      { id: "collider_22", type: "box", position: [201.56, 0.16, 37.83], size: [9.3, 0.1, 28.3], materialType: "ground", meshName: null },
      { id: "collider_23", type: "box", position: [197.8, 0.16, 56.49], size: [53.6, 0.1, 9], materialType: "ground", meshName: null },
      { id: "collider_24", type: "box", position: [239.05, 0.16, 42.11], size: [9, 0.1, 73.6], materialType: "ground", meshName: null },
      { id: "collider_25", type: "box", position: [216.35, 0.16, 75.37], size: [36.5, 0.1, 9], materialType: "ground", meshName: null },
      { id: "collider_26", type: "box", position: [220.63, 0.14, 65.92], size: [9.5, 0.1, 9.9], materialType: "ground", meshName: null },
      { id: "collider_27", type: "box", position: [201.88, 0.22, 84.35], size: [9, 0.1, 9.2], materialType: "ground", meshName: null },
      { id: "collider_28", type: "box", position: [179.48, 0.23, 93.31], size: [53.3, 0.1, 8.7], materialType: "ground", meshName: null },
      { id: "collider_29", type: "box", position: [156.61, 0.23, 80.1], size: [9, 0.1, 17.7], materialType: "ground", meshName: null },
      { id: "collider_30", type: "box", position: [170.2, 0.21, 75], size: [18.2, 0.1, 9], materialType: "ground", meshName: null },
      { id: "collider_31", type: "box", position: [174.8, 0.23, 66.01], size: [9, 0.1, 9], materialType: "ground", meshName: null },
      { id: "collider_32", type: "box", position: [85.56, 0.16, -1.19], size: [41.4, 0.1, 24.7], materialType: "ground", meshName: null },
      { id: "collider_33", type: "box", position: [101.97, 0.16, -30.91], size: [38.2, 0.1, 8.1], materialType: "ground", meshName: null },
      { id: "collider_34", type: "box", position: [87.18, 0.13, -20.24], size: [8.5, 0.1, 13.4], materialType: "ground", meshName: null },
      { id: "collider_35", type: "box", position: [60.73, 0.16, -9.4], size: [8.4, 0.1, 8.2], materialType: "ground", meshName: null },
      { id: "collider_41", type: "box", position: [27.53, 0.16, -30.07], size: [58, 0.1, 49.7], materialType: "ground", meshName: null },
      { id: "collider_42", type: "box", position: [108.84, 0.12, 75.95], size: [23.9, 0.1, 24.8], materialType: "ground", meshName: null },
      { id: "collider_43", type: "box", position: [45.12, 0.12, 123.13], size: [23.9, 0.1, 24.8], materialType: "ground", meshName: null },
      { id: "collider_44", type: "box", position: [125.69, 0.12, 125.06], size: [23.9, 0.1, 24.8], materialType: "ground", meshName: null },
      { id: "collider_45", type: "box", position: [85.39, 0.12, 125], size: [40.5, 0.1, 24.8], materialType: "ground", meshName: null },
      { id: "collider_46", type: "box", position: [109.64, 0.12, 116.75], size: [8.1, 0.1, 8.3], materialType: "ground", meshName: null },
      { id: "collider_47", type: "box", position: [61.1, 0.12, 116.8], size: [8.1, 0.1, 8.3], materialType: "ground", meshName: null },
      { id: "collider_48", type: "box", position: [92.8, 0.12, 162.33], size: [40.4, 0.1, 24.9], materialType: "ground", meshName: null },
      { id: "collider_49", type: "box", position: [0.51, 0.12, 169.27], size: [40.4, 0.1, 24.9], materialType: "ground", meshName: null },
      { id: "collider_50", type: "box", position: [46.63, 0.16, 169.52], size: [51.9, 0.2, 8.2], materialType: "ground", meshName: null },
      { id: "collider_51", type: "box", position: [38.39, 0.16, 150.49], size: [8.2, 0.1, 29.8], materialType: "ground", meshName: null },
      { id: "collider_52", type: "box", position: [26, 0.16, 33.28], size: [8.4, 0.2, 77.7], materialType: "ground", meshName: null },
      { id: "collider_53", type: "box", position: [44.49, 0.16, 39.18], size: [8.3, 0.1, 45.4], materialType: "ground", meshName: null },
      { id: "collider_54", type: "box", position: [35.24, 0.16, 39.14], size: [10.2, 0.1, 8.9], materialType: "ground", meshName: null },
      { id: "collider_55", type: "box", position: [87.27, 0.16, 17.86], size: [9, 0.1, 13.5], materialType: "ground", meshName: null },
      { id: "collider_56", type: "box", position: [65.73, 0.16, 20.5], size: [34.1, 0.1, 8], materialType: "ground", meshName: null },
      { id: "collider_57", type: "box", position: [90.22, 0.16, 76.49], size: [13.5, 0.1, 8], materialType: "ground", meshName: null },
      { id: "collider_58", type: "box", position: [70.12, 0.16, 57.64], size: [43.1, 0.1, 8], materialType: "ground", meshName: null },
      { id: "collider_59", type: "box", position: [87.45, 0.16, 67.04], size: [8.6, 0.1, 10.9], materialType: "ground", meshName: null },
      { id: "collider_60", type: "box", position: [87.98, 0.16, 96.59], size: [9, 0.1, 32.2], materialType: "ground", meshName: null },
      { id: "collider_61", type: "box", position: [50.84, 0.16, 91.8], size: [8.6, 0.1, 37.8], materialType: "ground", meshName: null },
      { id: "collider_62", type: "box", position: [64.14, 0.16, 76.81], size: [17.9, 0.1, 8.4], materialType: "ground", meshName: null },
      { id: "collider_63", type: "box", position: [69.07, 0.16, 90.1], size: [8.3, 0.1, 18.2], materialType: "ground", meshName: null },
      { id: "collider_64", type: "box", position: [78.41, 0.15, 95.02], size: [10.3, 0.1, 8.8], materialType: "ground", meshName: null }
    ],
    fallbackObjects: [
      { type: "box", position: [0, 0, 0], size: [50, 1, 50], color: 7048739 }
    ]
  }


  // --- Additional level from the other branch (kept alongside yours) --------
];
