import { Engine } from './core/engine.js';
import { Loop } from './core/loop.js';
import { Arena } from './world/arena.js';
import { Fighter } from './entities/fighter.js';

let engine = null;
let loop = null;
let arena = null;
let fighter = null;
let isInitialized = false;

export const GameModule = {
  mount(container) {
    if (isInitialized && engine) {
      this.resume();
      return;
    }

    if (!container) {
      console.warn('[GameModule] Mount container element not provided.');
      return;
    }

    // 1. Initialize 3D Engine & Scene Graph
    engine = new Engine(container);

    // 2. Initialize Gothic Arena Environment & Lighting
    arena = new Arena(engine.scene);

    // 3. Load & Initialize the 3D Fighter Character
    fighter = new Fighter(engine.scene);

    // 4. Initialize Render & Animation Loop
    loop = new Loop(
      (dt) => {
        if (arena) arena.update(dt);
        if (fighter) fighter.update(dt);
        if (engine) engine.update();
      },
      () => {
        if (engine) engine.render();
      }
    );

    loop.start();
    isInitialized = true;
  },

  pause() {
    if (loop) {
      loop.pause();
    }
  },

  resume() {
    if (loop) {
      loop.resume();
    }
  },

  resetCamera() {
    if (engine) {
      engine.resetCamera();
    }
  },

  destroy() {
    if (loop) {
      loop.stop();
      loop = null;
    }

    if (fighter) {
      fighter.dispose();
      fighter = null;
    }

    if (arena) {
      arena.dispose();
      arena = null;
    }

    if (engine) {
      engine.dispose();
      engine = null;
    }

    isInitialized = false;
  },

  isMounted() {
    return isInitialized && engine !== null;
  },

  getFighter() {
    return fighter;
  }
};

export default GameModule;
