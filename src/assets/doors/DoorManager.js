import * as THREE from 'three';
import { DoorBase } from './DoorBase.js';
import { DoorInteractionHandler } from './DoorInteractionHandler.js';

export class DoorManager {
  constructor(scene, physicsWorld, gameInstance) {
    console.log('DoorManager constructor called');
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.gameInstance = gameInstance;
    this.doors = [];
    this.interactionHandler = new DoorInteractionHandler(gameInstance);
    this.typeRegistry = {
      basic: DoorBase,
      model: DoorBase,
      // register more door types here
    };
  }

  spawn(type, options = {}) {
    try {
      console.log('DoorManager.spawn called with type:', type, 'options:', options);
      const Cls = this.typeRegistry[type];
      if (!Cls) throw new Error('Unknown door type: ' + type);
      const position = options.position || [0, 0, 0];
      console.log('Spawning door:', { type, position, options });
      const door = new Cls(this.scene, this.physicsWorld, position, options);
      this.doors.push(door);
      console.log('Door spawned successfully, total doors:', this.doors.length);
      return door;
    } catch (error) {
      console.error('Error spawning door:', error);
      console.error('Door config:', { type, options });
      throw error; // Re-throw to prevent silent failures
    }
  }

  update(delta) {
    for (const door of this.doors) door.update(delta);
    this.interactionHandler.update(delta);
  }

  // Simplified interaction method - handles everything automatically
  interactWithClosestDoor(playerPosition) {
    console.log('DoorManager.interactWithClosestDoor called with playerPosition:', playerPosition);
    console.log('Available doors:', this.doors.length);
    
    const door = this.findClosestInteractableDoor(playerPosition);
    if (door) {
      console.log('Found interactable door:', door.mesh.position);
      return this.interactionHandler.handleInteraction(door);
    }
    console.log('No door found to interact with');
    return false;
  }

  // Find the closest door that can be interacted with
  findClosestInteractableDoor(playerPosition) {
    const interactableDoors = this.doors.filter(door => door.canPlayerInteract(playerPosition));
    console.log('Filtered interactable doors:', interactableDoors.length, 'out of', this.doors.length);
    
    if (interactableDoors.length === 0) return null;

    // Find closest door
    let closestDoor = null;
    let closestDistance = Infinity;

    for (const door of interactableDoors) {
      const distance = door.mesh.position.distanceTo(playerPosition);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestDoor = door;
      }
    }

    console.log('Closest door found at distance:', closestDistance);
    return closestDoor;
  }

  toggleColliders(v) {
    for (const door of this.doors) door.toggleHelperVisible(v);
  }

  dispose() {
    for (const door of this.doors) door.dispose();
    this.doors = [];
    this.interactionHandler.cleanup();
  }

  setGameInstance(gameInstance) {
    this.gameInstance = gameInstance;
    if (this.interactionHandler) {
      this.interactionHandler.game = gameInstance;
    }
  }
}