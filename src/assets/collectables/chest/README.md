# Chest Assets

Please place the chest GLTF model here:
- `scene.gltf` - Main chest model with open/close animations

The CollectiblesManager will automatically load this model and use the animations named:
- "open" or containing "open" - for chest opening animation
- "close" or containing "close" - for chest closing animation

If the GLTF model fails to load, the system will fall back to a procedurally generated chest mesh.