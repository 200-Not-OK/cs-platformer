import { UIComponent } from '../uiComponent.js';

export class FPS extends UIComponent {
  constructor(container, props = {}) {
    super(container, props);
    this.root.className = 'fps-counter';
    
    // Debug: Log that FPS component is being created
    console.log('🎯 FPS component created');
    
    // FPS counter styling - make it very visible for debugging
    this.root.style.position = 'fixed'; // Changed from absolute to fixed
    this.root.style.top = '20px';
    this.root.style.right = '20px';
    this.root.style.color = '#00ff00';
    this.root.style.fontFamily = 'Consolas, "Courier New", monospace';
    this.root.style.fontSize = '18px'; // Increased font size
    this.root.style.fontWeight = 'bold';
    this.root.style.background = 'rgba(0, 0, 0, 0.9)'; // More opaque background
    this.root.style.padding = '12px 16px'; // Larger padding
    this.root.style.borderRadius = '6px';
    this.root.style.pointerEvents = 'none';
    this.root.style.zIndex = '10000'; // Very high z-index
    this.root.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 1)';
    this.root.style.border = '2px solid #00ff00'; // Add visible border
    this.root.style.minWidth = '100px'; // Ensure minimum width
    
    // FPS calculation variables
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.fpsUpdateInterval = 500; // Update display every 500ms
    this.lastFpsUpdate = this.lastTime;
    
    // FPS history for smoothing
    this.fpsHistory = [];
    this.historySize = 10;
    
    this._createElements();
    this.setProps(props);
  }
  
  // Override mount to add debugging
  mount() {
    super.mount();
  }
  
  _createElements() {
    this.fpsDisplay = document.createElement('div');
    this.fpsDisplay.textContent = 'FPS: --';
    this.root.appendChild(this.fpsDisplay);
    
    // Optional: Add frame time display
    this.frameTimeDisplay = document.createElement('div');
    this.frameTimeDisplay.style.fontSize = '14px'; // Slightly larger
    this.frameTimeDisplay.style.opacity = '0.8';
    this.frameTimeDisplay.style.marginTop = '2px';
    this.frameTimeDisplay.textContent = 'ms: --';
    this.root.appendChild(this.frameTimeDisplay);
  }
  
  // Call this every frame to update FPS
  update(deltaTime) {
    const currentTime = performance.now();
    this.frameCount++;
    
    // Update FPS calculation periodically
    if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      // Calculate average FPS over the interval
      const elapsed = currentTime - this.lastFpsUpdate;
      const currentFps = (this.frameCount * 1000) / elapsed;
      
      // Add to history for smoothing
      this.fpsHistory.push(currentFps);
      if (this.fpsHistory.length > this.historySize) {
        this.fpsHistory.shift();
      }
      
      // Calculate smoothed FPS
      const smoothedFps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
      this.fps = Math.round(smoothedFps);
      
      // Update display
      this.updateDisplay(deltaTime);
      
      // Reset counters
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
    
    this.lastTime = currentTime;
  }
  
  updateDisplay(deltaTime) {
    // Update FPS display with color coding
    this.fpsDisplay.textContent = `FPS: ${this.fps}`;
    
    // Color code based on performance
    if (this.fps >= 55) {
      this.fpsDisplay.style.color = '#00ff00'; // Green for good FPS
    } else if (this.fps >= 30) {
      this.fpsDisplay.style.color = '#ffff00'; // Yellow for OK FPS
    } else {
      this.fpsDisplay.style.color = '#ff0000'; // Red for poor FPS
    }
    
    // Update frame time (in milliseconds)
    const frameTimeMs = deltaTime * 1000;
    this.frameTimeDisplay.textContent = `ms: ${frameTimeMs.toFixed(1)}`;
    
    // Color code frame time (lower is better)
    if (frameTimeMs <= 16.7) { // 60 FPS = 16.7ms
      this.frameTimeDisplay.style.color = '#00ff00';
    } else if (frameTimeMs <= 33.3) { // 30 FPS = 33.3ms
      this.frameTimeDisplay.style.color = '#ffff00';
    } else {
      this.frameTimeDisplay.style.color = '#ff0000';
    }
  }
  
  setProps(props) {
    super.setProps(props);
    
    // Allow customization of position
    if (props.position) {
      const { top, right, bottom, left } = props.position;
      if (top !== undefined) this.root.style.top = `${top}px`;
      if (right !== undefined) this.root.style.right = `${right}px`;
      if (bottom !== undefined) this.root.style.bottom = `${bottom}px`;
      if (left !== undefined) this.root.style.left = `${left}px`;
    }
    
    // Allow hiding frame time
    if (props.showFrameTime === false) {
      this.frameTimeDisplay.style.display = 'none';
    }
  }
  
  // Method to reset FPS calculation
  reset() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.fpsHistory = [];
    this.fps = 0;
  }
}