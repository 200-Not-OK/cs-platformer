# Snake Enemy Assets

Place your snake enemy GLTF model and related files in this directory.

## Expected Files:
- `snake.gltf` - Main model file
- `snake.bin` (if applicable) - Binary data
- Texture files (PNG/JPG)

## Animation Requirements:
The snake model should include the following animations:
- **slither** or **walk** - Normal movement animation
- **slither_fast** or **run** - Fast movement for chasing
- **strike** or **attack** - Attack animation for biting/striking
- **coil** or **idle** - Resting/idle animation
- **hiss** or **threat** - Threat display animation (optional)

## Model Specifications:
- Size: Approximately 0.8 x 0.4 x 2.0 units (width x height x length)
- Low-poly style preferred for performance
- Should be facing forward along the negative Z axis
- Ground-based creature (Y=0 baseline)

## Fallback:
If no model is provided, the system will attempt to use default fallback models but snake-specific animations will not be available.