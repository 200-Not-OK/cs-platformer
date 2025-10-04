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
          scoreStart: 0,
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
            },
            score: { 
              icon: '⭐', 
              name: 'Score', 
              color: '#ffd43b' 
            }
          }
        }
      }
    ],
    lights: [
      "BasicLights"
    ],
    flamePlacementPositions: [
      [27.53, 0.16, -30.07],
      [-30, 0.07, 0]
    ],
    enemies: [
      {
        type: "snake",
        position: [
          -5,
          2,
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
    }
  },
  {
    id: "level2",
    name: "Level 2",
    gltfUrl: "src/assets/levels/Level2/Level2.gltf",
    startPosition: [
      25.9,
      6,
      -4.5
    ],
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
              icon: '🍏', 
              name: 'Green Apples', 
              color: '#51cf66', 
              completeColor: '#ffd43b', 
              completeIcon: '👑' 
            },
            potions: { 
              icon: '🧪', 
              name: 'Mana Potions', 
              color: '#9775fa', 
              lowColor: '#ffd43b', 
              emptyColor: '#ff6b6b', 
              emptyIcon: '💔' 
            },
            score: { 
              icon: '💎', 
              name: 'Score', 
              color: '#66d9ef' 
            }
          }
        }
      }
    ],
    lights: [
      "BasicLights",
      {
        key: "PointPulse",
        props: {
          position: [25.9, 8, -4.5],
          color: 0xff6600,
          intensity: 2.0,
          distance: 15,
          speed: 3.0
        }
      },
      {
        key: "PointPulse", 
        props: {
          position: [56.5, 8, -9.4],
          color: 0xff6600,
          intensity: 2.0,
          distance: 15,
          speed: 2.8
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [145.374145581186, 5.804794296862261, 11.882736073091916],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [134.718151932843, 5.78268465742263, 11.873464661495646],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [122.78516775876871, 5.8474919952326525, -25.81796271767555],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [122.75289002363303, 5.824311796058366, -36.01769063926521],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [134.79668037901118, 5.831041284225208, -10.272701839548002],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [145.54804548665086, 5.8339097924993535, -10.276329057023784],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [159.64732128633787, 5.9357392145356025, -25.767635617352212],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [159.64663134792835, 5.930372938679281, -36.04501493705355],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [187.78189640126286, 5.035426533687112, -67.44935354436615],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [203.18593802560247, 5.048047534339984, -67.47103610381599],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [54.70471656341971, 5.8849883912178385, -38.4618296114502],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [54.88480904996993, 5.6559444764186875, -30.103860185871703],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [54.83320893498765, 5.721480316701198, -21.880698367170048],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [43.38295419129252, 5.7420850327988315, -6.875723878004884],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [35.086182852268365, 5.6551266296830685, -6.808340860162892],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [16.001505350542764, 5.613292466314125, -6.759154512626444],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [7.0153821498284445, 5.669436370044735, -6.841128185313431],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [0.11166590370448343, 5.7438761097532876, -13.588768247718344],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [0.04525689946449157, 5.599711198663363, -21.77999583757773],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [0.09954785225139173, 5.7058433319904465, -30.075894906304015],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [0.0996039348799318, 5.618667104333225, -38.20669516180944],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [91.9121400525824, 5.5043045497272765, 69.33307068033353],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [91.51432073396393, 5.562602432290042, 83.21989440009406],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [92.90541521601358, 5.506758574108859, 114.40778822379639],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [82.56781117153821, 5.440672710092432, 114.15160209205409],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [19.853359171024938, 5.473284686564114, 174.6788413619447],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [46.18353898830183, 5.520312449833668, 165.2070604462412],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [73.35210557060873, 5.447575131243129, 163.71518970921977],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [31.061820073507484, 5.508550899910855, 165.3792369084329],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [166.53481479466527, 5.57478373643869, 32.45325588393239],
          particleCount: 10
        }
      },
      {
        key: "FlameParticles",
        props: {
          position: [166.49003849952368, 5.607541597099899, 42.969325896],
          particleCount: 10
        }
      }
    ],
    flamePlacementPositions: [
      [145.374145581186, 5.804794296862261, 11.882736073091916],
      [134.718151932843, 5.78268465742263, 11.873464661495646],
      [122.78516775876871, 5.8474919952326525, -25.81796271767555],
      [122.75289002363303, 5.824311796058366, -36.01769063926521],
      [134.79668037901118, 5.831041284225208, -10.272701839548002],
      [145.54804548665086, 5.8339097924993535, -10.276329057023784],
      [159.64732128633787, 5.9357392145356025, -25.767635617352212],
      [159.64663134792835, 5.930372938679281, -36.04501493705355],
      [187.78189640126286, 5.035426533687112, -67.44935354436615],
      [203.18593802560247, 5.048047534339984, -67.47103610381599],
      [54.70471656341971, 5.8849883912178385, -38.4618296114502],
      [54.88480904996993, 5.6559444764186875, -30.103860185871703],
      [54.83320893498765, 5.721480316701198, -21.880698367170048],
      [43.38295419129252, 5.7420850327988315, -6.875723878004884],
      [35.086182852268365, 5.6551266296830685, -6.808340860162892],
      [16.001505350542764, 5.613292466314125, -6.759154512626444],
      [7.0153821498284445, 5.669436370044735, -6.841128185313431],
      [0.11166590370448343, 5.7438761097532876, -13.588768247718344],
      [0.04525689946449157, 5.599711198663363, -21.77999583757773],
      [0.09954785225139173, 5.7058433319904465, -30.075894906304015],
      [0.0996039348799318, 5.618667104333225, -38.20669516180944],
      [91.9121400525824, 5.5043045497272765, 69.33307068033353],
      [91.51432073396393, 5.562602432290042, 83.21989440009406],
      [92.90541521601358, 5.506758574108859, 114.40778822379639],
      [82.56781117153821, 5.440672710092432, 114.15160209205409],
      [19.853359171024938, 5.473284686564114, 174.6788413619447],
      [46.18353898830183, 5.520312449833668, 165.2070604462412],
      [73.35210557060873, 5.447575131243129, 163.71518970921977],
      [31.061820073507484, 5.508550899910855, 165.3792369084329],
      [166.53481479466527, 5.57478373643869, 32.45325588393239],
      [166.49003849952368, 5.607541597099899, 42.969325896]
    ],
    enemies: [],
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