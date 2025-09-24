import { StandaloneLevelEditor } from './StandaloneLevelEditor.js';

// Initialize the standalone level editor
const container = document.getElementById('editor-container');
const statusElement = document.getElementById('status');

// Create the editor
const editor = new StandaloneLevelEditor(container, statusElement);

// Start the render loop
function animate() {
    requestAnimationFrame(animate);
    editor.update();
    editor.render();
}

animate();

// Expose editor to window for debugging
window.editor = editor;