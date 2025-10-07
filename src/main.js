import { Game } from './game/game.js';

window.addEventListener('load', () => {
  const game = new Game();
  // Convenience: expose to console for debugging
  window.__GAME__ = game;
  window.togglePhysicsDebug = () => game.physicsWorld.enableDebugRenderer(!game.physicsWorld.isDebugEnabled());
  window.toggleCombatDebug = () => game.combatSystem.toggleDebug();
});
