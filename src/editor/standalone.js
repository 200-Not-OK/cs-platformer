import { StandaloneLevelEditor } from './StandaloneLevelEditor.js';

// Initialize the standalone level editor
const container = document.getElementById('editor-container');
const statusElement = document.getElementById('status');

// Create the editor (it handles its own render loop)
const editor = new StandaloneLevelEditor(container, statusElement);

// Expose editor to window for debugging and UI callbacks
window.editor = editor;