# Shadow System Configuration (UPDATED)

## Overview
This document describes the optimized shadow-casting light configuration that works within GPU texture unit limitations while providing comprehensive shadow coverage.

## GPU Texture Limitations - THE REALITY
- **Maximum Texture Units**: 16 per fragment shader (hardware limit)
- **Shadow Maps Per Light**: Each shadow-casting PointLight uses ~2 texture units
- **Practical Limit**: **6-8 shadow-casting lights maximum** for stable operation
- **Solution**: Strategic placement + VSM + minimal shadow map sizes

## Current Configuration (OPTIMIZED)

### Primary Lights (Stars) - 8 Total (ALL with shadows)
All star lights cast shadows as they are the primary illumination source:

**Star Settings:**
- Intensity: 180
- Range: 300 units
- **Shadow Map: 512x512 (VSM)** - Reduced for texture efficiency
- Shadow Radius: 4 (soft shadows)
- Decay: 1.8

### Secondary Lights (Flames) - Strategic Selection
Due to GPU limits, we can add **0-2 flames** with shadows alongside 8 stars.

**Flame Settings (with shadows):**
- Intensity: 45 (dynamic flickering 20-70)
- Range: 100 units
- **Shadow Map: 128x128 (VSM)** - Ultra-minimal but acceptable with VSM blur
- Shadow Radius: 3 (compensates for small map size)
- Decay: 1.5

**Flame Settings (without shadows):**
- Same lighting, no shadow map overhead
- Still provides illumination and atmosphere

## RECOMMENDED CONFIGURATION

### Option A: Maximum Coverage (8 shadow-casting lights)
- ✅ **8 Stars** with shadows
- ❌ **0 Flames** with shadows (all provide light only)
- **Total**: 8 shadow-casting lights
- **Texture Units Used**: ~16 (at limit but stable)

---
Last Updated: October 4, 2025
