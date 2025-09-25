#!/usr/bin/env python3
"""
Script to convert level.json to levelData.js format
"""

import json

def load_level(filename):
    """Load the level JSON file"""
    with open(filename, 'r') as f:
        return json.load(f)

def convert_to_leveldata_format(level_data):
    """Convert level.json format to levelData.js format"""
    
    # Extract the level data
    level_id = level_data.get('id', 'custom_level')
    level_name = level_data.get('name', 'Custom Level')
    start_position = level_data.get('startPosition', [0, 2, 8])
    ui = level_data.get('ui', ['hud'])
    lights = level_data.get('lights', ['BasicLights'])
    
    # Convert objects
    objects = []
    enemies = []
    
    for obj in level_data.get('objects', []):
        if obj['type'] == 'box':
            # Convert box object
            box_obj = {
                'type': 'box',
                'position': obj['position'],
                'size': obj['size']
            }
            if 'color' in obj:
                box_obj['color'] = obj['color']
            objects.append(box_obj)
        
        elif obj['type'] == 'slope':
            # Convert slope object (if any exist)
            slope_obj = {
                'type': 'slope',
                'position': obj['position'],
                'size': obj['size']
            }
            if 'color' in obj:
                slope_obj['color'] = obj['color']
            if 'rotation' in obj:
                slope_obj['rotation'] = obj['rotation']
            if 'slopeDirection' in obj:
                slope_obj['slopeDirection'] = obj['slopeDirection']
            objects.append(slope_obj)
    
    # Handle enemies if they exist in the JSON
    if 'enemies' in level_data:
        enemies = level_data['enemies']
    
    # Create the levelData.js level object
    js_level = {
        'id': level_id,
        'name': level_name,
        'startPosition': start_position,
        'ui': ui,
        'lights': lights,
        'objects': objects
    }
    
    if enemies:
        js_level['enemies'] = enemies
    
    return js_level

def format_js_object(obj, indent=2):
    """Format a Python object as JavaScript object notation"""
    def format_value(value, current_indent=0):
        spaces = ' ' * current_indent
        
        if isinstance(value, dict):
            if not value:
                return '{}'
            
            lines = ['{']
            for i, (k, v) in enumerate(value.items()):
                comma = ',' if i < len(value) - 1 else ''
                if isinstance(v, (dict, list)) and v:
                    lines.append(f'{spaces}  {k}: {format_value(v, current_indent + 2)}{comma}')
                else:
                    lines.append(f'{spaces}  {k}: {format_value(v, current_indent + 2)}{comma}')
            lines.append(f'{spaces}}}')
            return '\n'.join(lines)
        
        elif isinstance(value, list):
            if not value:
                return '[]'
            
            # Check if it's a simple array (all numbers or all strings)
            if all(isinstance(x, (int, float)) for x in value):
                return '[' + ', '.join(str(x) for x in value) + ']'
            elif all(isinstance(x, str) for x in value):
                return '[' + ', '.join(f"'{x}'" for x in value) + ']'
            else:
                # Complex array
                lines = ['[']
                for i, item in enumerate(value):
                    comma = ',' if i < len(value) - 1 else ''
                    lines.append(f'{spaces}  {format_value(item, current_indent + 2)}{comma}')
                lines.append(f'{spaces}]')
                return '\n'.join(lines)
        
        elif isinstance(value, str):
            return f"'{value}'"
        else:
            return str(value)
    
    return format_value(obj, indent)

def generate_leveldata_js(js_level):
    """Generate the complete levelData.js file content"""
    
    js_content = """// Data-driven level definitions (no hard-coded meshes). Add new objects here.
export const levels = [
  {
    id: 'platformer',
    name: 'Platform Course',
    startPosition: [0, 2.2, 0],
    ui: ['hud', 'objectives', 'minimap'],
    lights: [ 'BasicLights', { key: 'PointPulse', props: { position: [6, 4, -10], color: 0xffcc88, intensity: 1.2, speed: 3 } } ],
    objects: [
      { type: 'box', position: [0, 0, 0], size: [12, 1, 12], color: 0x2e8b57 },
    ]
  },
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
  // Your custom level
  {
"""
    
    # Add the converted level
    js_content += format_js_object(js_level, 4)
    
    js_content += """
  }
];"""
    
    return js_content

def main():
    # Load the level
    print("Loading level.json...")
    level_data = load_level('src/assets/level.json')
    
    print(f"Converting level with {len(level_data.get('objects', []))} objects...")
    
    # Convert to levelData.js format
    js_level = convert_to_leveldata_format(level_data)
    
    # Generate the complete JavaScript file
    js_content = generate_leveldata_js(js_level)
    
    # Save the result
    output_file = 'src/game/levelData_updated.js'
    print(f"Saving converted level to {output_file}...")
    
    with open(output_file, 'w') as f:
        f.write(js_content)
    
    print("Conversion complete!")
    print(f"Your custom level has been added to {output_file}")
    print("You can replace the original levelData.js with this file when ready.")
    print(f"The level will be accessible with id: '{js_level['id']}'")

if __name__ == "__main__":
    main()