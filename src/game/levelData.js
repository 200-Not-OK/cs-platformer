// Data-driven level definitions with GLTF geometry loading
export const levels = [
  {
    "id": "intro",
    "name": "Intro Level",
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
    }
  },
  {
    "id": "level2",
    "name": "Level 2",
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
    "lights": [
      "BasicLights"
    ],
    "enemies": [
      {
        "type": "snake",
        "position": [
          140,
          1.4,
          -30
        ],
        "patrolPoints": [
          [
            140,
            1.4,
            -30
          ],
          [
            130,
            1.4,
            -20
          ],
          [
            150,
            1.4,
            -20
          ],
          [
            145,
            1.4,
            -35
          ]
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
        "health": 300,
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
          187.42000000000002,
          3,
          -66.49
        ],
        "size": [
          7.02000000000001,
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
          203.42000000000002,
          3,
          -66.49
        ],
        "size": [
          7.5800000000000125,
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
          128.185,
          3,
          -8.650000000000002
        ],
        "size": [
          14.189999999999998,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7011",
        "type": "box",
        "position": [
          153.335,
          3,
          -8.650000000000002
        ],
        "size": [
          16.110000000000014,
          6,
          0.5
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
          -42.504999999999995
        ],
        "size": [
          0.5,
          6,
          15.089999999999996
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
          -17.755000000000003
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
          131.535,
          3,
          10.350000000000001
        ],
        "size": [
          7.490000000000009,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7019",
        "type": "box",
        "position": [
          156.685,
          3,
          10.350000000000001
        ],
        "size": [
          22.810000000000002,
          6,
          0.5
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
          21.925
        ],
        "size": [
          0.5,
          6,
          23.15
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
          46.724999999999994
        ],
        "size": [
          0.5,
          6,
          9.250000000000007
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
          73.815,
          3,
          11.16
        ],
        "size": [
          17.909999999999997,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7079",
        "type": "box",
        "position": [
          99.015,
          3,
          11.16
        ],
        "size": [
          14.490000000000009,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7080",
        "type": "box",
        "position": [
          73.89500000000001,
          3,
          -13.54
        ],
        "size": [
          18.070000000000007,
          6,
          0.5
        ],
        "materialType": "wall",
        "meshName": null
      },
      {
        "id": "wall_7081",
        "type": "box",
        "position": [
          98.845,
          3,
          -13.54
        ],
        "size": [
          14.829999999999998,
          6,
          0.5
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
          -8.465
        ],
        "size": [
          0.5,
          6,
          10.149999999999999
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
          7.984999999999999
        ],
        "size": [
          0.5,
          6,
          6.3500000000000005
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
          68.02
        ],
        "size": [
          0.5,
          6,
          8.93999999999999
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
          84.42
        ],
        "size": [
          0.5,
          6,
          7.860000000000014
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
          157.65000000000003
        ],
        "size": [
          0.5,
          6,
          15.539999999999992
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
          176.52
        ],
        "size": [
          0.5,
          6,
          8.599999999999994
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
  }
];