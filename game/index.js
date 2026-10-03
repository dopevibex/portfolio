// Master Game Module: Sanctum - The Bound Sovereign
import { Engine } from './core/engine.js';
import { CathedralArena } from './world/cathedral_arena.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { InputManager } from './core/input.js';
import { SoundSystem } from './core/audio.js';
import { GameHUD } from './ui/hud.js';
import * as THREE from '../assets/vendor/three/three.module.js';

let activeGameInstance = null;

export class SanctumGame {
  constructor(onExitToPortfolio) {
    this.onExitToPortfolio = onExitToPortfolio;

    // 1. Create Fullscreen Overlay Container
    this.overlay = document.createElement('div');
    this.overlay.className = 'dope-game-fullscreen-overlay';

    this.canvasWrap = document.createElement('div');
    this.canvasWrap.className = 'dope-game-canvas-wrap';
    this.overlay.appendChild(this.canvasWrap);

    document.body.appendChild(this.overlay);

    // 2. Initialize Audio & Engine
    this.sounds = new SoundSystem();
    this.engine = new Engine(this.canvasWrap);
    this.arena = new CathedralArena(this.engine.scene);
    this.input = new InputManager(this.engine.renderer.domElement);

    // 3. Initialize Player Entity
    this.player = new Player(this.engine.scene, this.sounds);

    // 4. Initialize HUD Layer
    this.hud = new GameHUD(
      this.overlay,
      () => this.exit(),
      () => this.restart()
    );

    // 5. Wave & Encounter State
    this.wave = 0; // 0: Prologue, 1: Wave 1, 2: Wave 2, 3: Wave 3, 4: Boss, 5: Victory
    this.waveTimer = 0;
    this.enemies = [];
    this.boss = null;
    this.isPaused = false;
    this.isRunning = true;

    // Hit-stop effect state
    this.hitStopTimer = 0;

    // Start Prologue & Game Loop
    this.startPrologue();
    this.lastTime = performance.now();
    this.loop = this.gameLoop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  startPrologue() {
    this.wave = 0;
    this.hud.showSubtitle('They broke your crown upon the altar stone, yet left the iron in your blood.', 4.5);
    setTimeout(() => {
      if (!this.isRunning) return;
      this.hud.showSubtitle('Rise, Sovereign. The cathedral bell tolls for what remains of you.', 4.0);
    }, 4800);

    setTimeout(() => {
      if (!this.isRunning) return;
      this.spawnWave1();
    }, 9200);
  }

  spawnWave1() {
    this.wave = 1;
    this.hud.showSubtitle('The forgotten dead still wear your sigil. Release them from their vigil.', 4.0);
    // 3 Ashen Thralls
    const positions = [
      new THREE.Vector3(-4, 0, -8),
      new THREE.Vector3(4, 0, -8),
      new THREE.Vector3(0, 0, -11)
    ];
    positions.forEach((pos) => {
      this.enemies.push(new Enemy(this.engine.scene, 'THRALL', pos, this.sounds));
    });
  }

  spawnWave2() {
    this.wave = 2;
    this.hud.showSubtitle('The Bastion yields to neither prayers nor blunt blows. Time your parry, or be crushed.', 4.5);
    // 2 Ashen Thralls + 1 Ironclad Brute
    this.enemies.push(new Enemy(this.engine.scene, 'BRUTE', new THREE.Vector3(0, 0, -10), this.sounds));
    this.enemies.push(new Enemy(this.engine.scene, 'THRALL', new THREE.Vector3(-5, 0, -8), this.sounds));
    this.enemies.push(new Enemy(this.engine.scene, 'THRALL', new THREE.Vector3(5, 0, -8), this.sounds));
  }

  spawnWave3() {
    this.wave = 3;
    this.hud.showSubtitle('A coward magic seeks the high rafters. Cast the Cinder Cleaver and drag it down.', 4.5);
    // 2 Ashen Thralls + 1 Void Weaver
    this.enemies.push(new Enemy(this.engine.scene, 'CASTER', new THREE.Vector3(0, 1.8, -9), this.sounds));
    this.enemies.push(new Enemy(this.engine.scene, 'THRALL', new THREE.Vector3(-4, 0, -6), this.sounds));
    this.enemies.push(new Enemy(this.engine.scene, 'THRALL', new THREE.Vector3(4, 0, -6), this.sounds));
  }

  spawnBoss() {
    this.wave = 4;
    this.hud.showSubtitle('Malphas... the warden who hammered the chains to your flesh.', 5.0);
    this.boss = new Enemy(this.engine.scene, 'BOSS', new THREE.Vector3(0, 0, -12), this.sounds);
    this.enemies.push(this.boss);
  }

  gameLoop(now) {
    if (!this.isRunning) return;
    this.rafId = requestAnimationFrame(this.loop);

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.1);

    // Hit-stop freeze
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    if (this.isPaused) return;

    // Handle Esc Exit
    if (this.input.consume('escape')) {
      this.exit();
      return;
    }

    // Toggle Dev Stats on 'F' key if not executing finisher
    if (this.input.keys['f'] && !this.checkNearFinisher()) {
      // (Optional dev stats key)
    }

    // Check Finisher Execution (F)
    if (this.input.consume('finisher')) {
      const staggeredEnemy = this.findNearestStaggeredEnemy();
      if (staggeredEnemy) {
        staggeredEnemy.executeFinisher();
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25); // Regain health
        this.player.rage = Math.min(this.player.maxRage, this.player.rage + 20);
        this.engine.triggerCameraShake(0.45);
        this.hitStopTimer = 0.14;
      }
    }

    // 1. Update Player
    this.player.update(
      dt,
      this.input,
      this.input.mouse.yaw,
      this.enemies,
      (enemy, dmg, isHeavy) => this.onPlayerHitEnemy(enemy, dmg, isHeavy)
    );

    // 2. Update Enemies & AI
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player, (atkEnemy, dmg, isUnblockable) => {
        this.onEnemyHitPlayer(atkEnemy, dmg, isUnblockable);
      });
    }

    // Check Wave Completion
    this.checkWaveProgression();

    // 3. Update Camera (Over-the-shoulder)
    const isAiming = this.input.mouse.rightDown;
    this.engine.updateCamera(this.player.mesh, this.input.mouse.yaw, this.input.mouse.pitch, isAiming, dt);

    // 4. Update HUD Layer
    this.hud.update(dt, this.player, this.boss, this.engine.getStats());

    // 5. Render Scene
    this.engine.render();
  }

  onPlayerHitEnemy(enemy, dmg, isHeavy) {
    const result = enemy.takeDamage(dmg, isHeavy);
    if (result === 'HIT') {
      this.hitStopTimer = isHeavy ? 0.08 : 0.04;
      this.engine.triggerCameraShake(isHeavy ? 0.28 : 0.12);
    }
  }

  onEnemyHitPlayer(enemy, dmg, isUnblockable) {
    const result = this.player.takeDamage(dmg, isUnblockable);
    if (result === 'PARRY') {
      // Timed Parry Success! Staggers attacking enemy
      enemy.takeDamage(0, true, false);
      this.hitStopTimer = 0.12;
      this.engine.triggerCameraShake(0.35);
      this.hud.showSubtitle('PARRY COUNTER — EXECUTE [F]', 2.0);
    } else if (result === 'HIT') {
      this.engine.triggerCameraShake(0.32);
      if (this.player.hp <= 0) {
        this.hud.showEndModal(false);
      }
    }
  }

  findNearestStaggeredEnemy() {
    for (const enemy of this.enemies) {
      if (!enemy.isDead && enemy.isStaggered) {
        if (this.player.mesh.position.distanceTo(enemy.position) < 2.8) {
          return enemy;
        }
      }
    }
    return null;
  }

  checkNearFinisher() {
    return this.findNearestStaggeredEnemy() !== null;
  }

  checkWaveProgression() {
    const aliveEnemies = this.enemies.filter(e => !e.isDead);
    if (aliveEnemies.length === 0) {
      if (this.wave === 1) {
        this.hud.showSubtitle('Their ashes settle. But deeper iron stirs ahead.', 3.5);
        this.wave = 1.5;
        setTimeout(() => { if (this.isRunning) this.spawnWave2(); }, 3800);
      } else if (this.wave === 2) {
        this.hud.showSubtitle('Brute iron yields to unbroken will.', 3.5);
        this.wave = 2.5;
        setTimeout(() => { if (this.isRunning) this.spawnWave3(); }, 3800);
      } else if (this.wave === 3) {
        this.hud.showSubtitle('The air burns cold. The gates of the High Dais groan open.', 4.0);
        this.wave = 3.5;
        setTimeout(() => { if (this.isRunning) this.spawnBoss(); }, 4200);
      } else if (this.wave === 4 && this.boss && this.boss.isDead) {
        this.wave = 5;
        this.hud.showSubtitle('No crown of gold awaits. But your name echoes through the deep.', 6.0);
        setTimeout(() => {
          if (this.isRunning) this.hud.showEndModal(true);
        }, 3500);
      }
    }
  }

  restart() {
    // Clear all enemies
    this.enemies.forEach(e => e.dispose());
    this.enemies = [];
    this.boss = null;

    // Reset Player
    this.player.hp = 100;
    this.player.stamina = 100;
    this.player.rage = 0;
    this.player.isRaging = false;
    this.player.state = 'IDLE';
    this.player.mesh.position.set(0, 0, 8);

    this.startPrologue();
  }

  exit() {
    this.destroy();
    if (this.onExitToPortfolio) {
      this.onExitToPortfolio();
    }
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.enemies) {
      this.enemies.forEach(e => e.dispose());
      this.enemies = [];
    }

    if (this.player) {
      this.player.dispose();
      this.player = null;
    }

    if (this.arena) {
      this.arena.dispose();
      this.arena = null;
    }

    if (this.input) {
      this.input.dispose();
      this.input = null;
    }

    if (this.sounds) {
      this.sounds.dispose();
      this.sounds = null;
    }

    if (this.hud) {
      this.hud.dispose();
      this.hud = null;
    }

    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    activeGameInstance = null;
  }
}

// Module Export: Lazy Mount / Unmount API
export function mountGame(hostContainer, onExitCallback) {
  if (activeGameInstance) {
    activeGameInstance.destroy();
  }
  activeGameInstance = new SanctumGame(onExitCallback);
  return activeGameInstance;
}

export function unmountGame() {
  if (activeGameInstance) {
    activeGameInstance.destroy();
    activeGameInstance = null;
  }
}

export const GameModule = {
  mount: mountGame,
  destroy: unmountGame
};

export default GameModule;
