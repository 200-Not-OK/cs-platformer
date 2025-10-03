import fs from 'fs';

const levelDataContent = fs.readFileSync('src/game/levelData.js', 'utf8');

// Extract all ground colliders
const groundColliders = [];
const colliderRegex = /{\s*id: "([^"]+)",\s*type: "box",\s*position: \[([^\]]+)\],\s*size: \[([^\]]+)\],\s*materialType: "ground"/g;

let match;
while ((match = colliderRegex.exec(levelDataContent)) !== null) {
  const id = match[1];
  const position = match[2].split(',').map(s => parseFloat(s.trim()));
  const size = match[3].split(',').map(s => parseFloat(s.trim()));

  groundColliders.push({
    id,
    position,
    size
  });
}

console.log(`Found ${groundColliders.length} ground colliders`);

// Generate wall colliders for each ground collider
const wallColliders = [];

groundColliders.forEach((ground, index) => {
  const { id, position, size } = ground;

  // Calculate boundaries
  const halfWidth = size[0] / 2;
  const halfDepth = size[2] / 2;

  const leftX = position[0] - halfWidth;
  const rightX = position[0] + halfWidth;
  const backZ = position[2] - halfDepth;
  const frontZ = position[2] + halfDepth;

  // Create walls on all four sides
  const wallHeight = 6; // Standard wall height
  const wallThickness = 0.5;

  // Left wall
  wallColliders.push({
    id: `wall_${id}_left`,
    type: "box",
    position: [leftX - wallThickness/2, wallHeight/2, position[2]],
    size: [wallThickness, wallHeight, size[2]],
    materialType: "wall",
    meshName: null,
    comment: `Left wall for ${id}`
  });

  // Right wall
  wallColliders.push({
    id: `wall_${id}_right`,
    type: "box",
    position: [rightX + wallThickness/2, wallHeight/2, position[2]],
    size: [wallThickness, wallHeight, size[2]],
    materialType: "wall",
    meshName: null,
    comment: `Right wall for ${id}`
  });

  // Back wall
  wallColliders.push({
    id: `wall_${id}_back`,
    type: "box",
    position: [position[0], wallHeight/2, backZ - wallThickness/2],
    size: [size[0], wallHeight, wallThickness],
    materialType: "wall",
    meshName: null,
    comment: `Back wall for ${id}`
  });

  // Front wall
  wallColliders.push({
    id: `wall_${id}_front`,
    type: "box",
    position: [position[0], wallHeight/2, frontZ + wallThickness/2],
    size: [size[0], wallHeight, wallThickness],
    materialType: "wall",
    meshName: null,
    comment: `Front wall for ${id}`
  });
});

// Generate the wall collider code
const wallCode = wallColliders.map(wall => `      {
        id: "${wall.id}",
        type: "box",
        position: [${wall.position.map(v => v.toFixed(2)).join(', ')}],
        size: [${wall.size.map(v => v.toFixed(2)).join(', ')}],
        materialType: "${wall.materialType}",
        meshName: ${wall.meshName === null ? 'null' : `"${wall.meshName}"`}
      }`).join(',\n');

console.log(`Generated ${wallColliders.length} wall colliders`);
console.log('\n// Add this before the closing bracket of colliders array:');
console.log(wallCode);
