#!/usr/bin/env python3
"""
Script to merge adjacent walls in level (13).json for better performance.
This will combine walls that are next to each other into larger single walls.
"""

import json
from collections import defaultdict
import copy

def load_level(filename):
    """Load the level JSON file"""
    with open(filename, 'r') as f:
        return json.load(f)

def save_level(level_data, filename):
    """Save the level JSON file"""
    with open(filename, 'w') as f:
        json.dump(level_data, f, indent=2)

def is_wall(obj):
    """Check if an object is a wall (brown color)"""
    return obj.get('color') == 9127187

def can_merge_horizontal(wall1, wall2):
    """Check if two walls can be merged horizontally (along X axis)"""
    if not (is_wall(wall1) and is_wall(wall2)):
        return False
    
    # Must have same Y, Z position and same Y, Z size
    if (wall1['position'][1] != wall2['position'][1] or
        wall1['position'][2] != wall2['position'][2] or
        wall1['size'][1] != wall2['size'][1] or
        wall1['size'][2] != wall2['size'][2]):
        return False
    
    # Must be adjacent along X axis
    wall1_x_min = wall1['position'][0] - wall1['size'][0] / 2
    wall1_x_max = wall1['position'][0] + wall1['size'][0] / 2
    wall2_x_min = wall2['position'][0] - wall2['size'][0] / 2
    wall2_x_max = wall2['position'][0] + wall2['size'][0] / 2
    
    # Check if they touch
    return abs(wall1_x_max - wall2_x_min) < 0.1 or abs(wall2_x_max - wall1_x_min) < 0.1

def can_merge_vertical(wall1, wall2):
    """Check if two walls can be merged vertically (along Z axis)"""
    if not (is_wall(wall1) and is_wall(wall2)):
        return False
    
    # Must have same X, Y position and same X, Y size
    if (wall1['position'][0] != wall2['position'][0] or
        wall1['position'][1] != wall2['position'][1] or
        wall1['size'][0] != wall2['size'][0] or
        wall1['size'][1] != wall2['size'][1]):
        return False
    
    # Must be adjacent along Z axis
    wall1_z_min = wall1['position'][2] - wall1['size'][2] / 2
    wall1_z_max = wall1['position'][2] + wall1['size'][2] / 2
    wall2_z_min = wall2['position'][2] - wall2['size'][2] / 2
    wall2_z_max = wall2['position'][2] + wall2['size'][2] / 2
    
    # Check if they touch
    return abs(wall1_z_max - wall2_z_min) < 0.1 or abs(wall2_z_max - wall1_z_min) < 0.1

def merge_two_walls(wall1, wall2, direction):
    """Merge two adjacent walls"""
    if direction == 'horizontal':
        # Merge along X axis
        min_x = min(wall1['position'][0] - wall1['size'][0]/2, wall2['position'][0] - wall2['size'][0]/2)
        max_x = max(wall1['position'][0] + wall1['size'][0]/2, wall2['position'][0] + wall2['size'][0]/2)
        
        merged = copy.deepcopy(wall1)
        merged['position'][0] = (min_x + max_x) / 2
        merged['size'][0] = max_x - min_x
        return merged
    
    elif direction == 'vertical':
        # Merge along Z axis
        min_z = min(wall1['position'][2] - wall1['size'][2]/2, wall2['position'][2] - wall2['size'][2]/2)
        max_z = max(wall1['position'][2] + wall1['size'][2]/2, wall2['position'][2] + wall2['size'][2]/2)
        
        merged = copy.deepcopy(wall1)
        merged['position'][2] = (min_z + max_z) / 2
        merged['size'][2] = max_z - min_z
        return merged

def merge_walls(level_data):
    """Merge adjacent walls in the level"""
    objects = level_data['objects']
    walls = [obj for obj in objects if is_wall(obj)]
    non_walls = [obj for obj in objects if not is_wall(obj)]
    
    print(f"Found {len(walls)} walls to potentially merge")
    
    merged_walls = []
    used_indices = set()
    
    # Try to merge walls
    for i, wall1 in enumerate(walls):
        if i in used_indices:
            continue
            
        current_wall = copy.deepcopy(wall1)
        used_indices.add(i)
        
        # Keep trying to merge with other walls
        merged_any = True
        while merged_any:
            merged_any = False
            for j, wall2 in enumerate(walls):
                if j in used_indices:
                    continue
                
                # Try horizontal merge
                if can_merge_horizontal(current_wall, wall2):
                    current_wall = merge_two_walls(current_wall, wall2, 'horizontal')
                    used_indices.add(j)
                    merged_any = True
                    continue
                
                # Try vertical merge
                if can_merge_vertical(current_wall, wall2):
                    current_wall = merge_two_walls(current_wall, wall2, 'vertical')
                    used_indices.add(j)
                    merged_any = True
                    continue
        
        merged_walls.append(current_wall)
    
    print(f"Merged {len(walls)} walls into {len(merged_walls)} walls")
    print(f"Reduction: {len(walls) - len(merged_walls)} fewer objects")
    
    # Update the level data
    level_data['objects'] = non_walls + merged_walls
    return level_data

def main():
    # Load the level
    print("Loading level (13).json...")
    level_data = load_level('src/assets/level.json')
    
    print(f"Original object count: {len(level_data['objects'])}")
    
    # Merge walls
    print("Merging adjacent walls...")
    level_data = merge_walls(level_data)
    
    print(f"New object count: {len(level_data['objects'])}")
    
    # Save the optimized level
    output_file = 'src/assets/level (13)_optimized.json'
    print(f"Saving optimized level to {output_file}...")
    save_level(level_data, output_file)
    
    print("Wall merging complete!")
    print(f"You can replace the original file with {output_file} when ready.")

if __name__ == "__main__":
    main()