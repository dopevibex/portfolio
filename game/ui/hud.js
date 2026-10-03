// Game HUD & Subtitle Runner Overlay (DOM Layer)

export class GameHUD {
  constructor(container, onExitCallback, onRestartCallback) {
    this.container = container;
    this.onExit = onExitCallback;
    this.onRestart = onRestartCallback;

    this.root = document.createElement('div');
    this.root.className = 'dope-game-hud-layer';
    this.container.appendChild(this.root);

    this.buildHTML();
    this.bindEvents();

    this.subtitleQueue = [];
    this.currentSubtitleTimer = 0;
  }

  buildHTML() {
    this.root.innerHTML = `
      <!-- Top Row: Player Meters + Exit -->
      <div class="dope-game-top-row">
        <div class="dope-game-player-meters">
          <div class="dope-game-meter-label">
            <span>SOVEREIGN</span>
            <span id="dope-hud-hp-txt">100 / 100</span>
          </div>
          <div class="dope-game-bar-track">
            <div id="dope-hud-hp-fill" class="dope-game-bar-fill-hp"></div>
          </div>

          <div class="dope-game-meter-label" style="margin-top: 4px;">
            <span style="color: #60a5fa;">STAMINA</span>
          </div>
          <div class="dope-game-bar-track" style="height: 6px;">
            <div id="dope-hud-stam-fill" class="dope-game-bar-fill-stam"></div>
          </div>

          <div class="dope-game-meter-label" style="margin-top: 4px;">
            <span style="color: #f87171;">SOVEREIGN'S WRATH [R]</span>
          </div>
          <div class="dope-game-bar-track" style="height: 6px;">
            <div id="dope-hud-rage-fill" class="dope-game-bar-fill-rage"></div>
          </div>
        </div>

        <button type="button" class="dope-game-exit-btn" id="dope-game-exit-btn" title="Return to Portfolio">
          <i class="fa-solid fa-arrow-left"></i>
          <span>EXIT TO PORTFOLIO [ESC]</span>
        </button>
      </div>

      <!-- Boss Bar (Top Center) -->
      <div class="dope-game-boss-wrap" id="dope-boss-wrap">
        <div class="dope-game-boss-title">MALPHAS, THE THRONE WARDEN</div>
        <div class="dope-game-bar-track" style="height: 12px; border-color: rgba(220, 38, 38, 0.5);">
          <div id="dope-boss-hp-fill" class="dope-game-bar-fill-hp" style="background: linear-gradient(90deg, #7f1d1d, #ef4444);"></div>
        </div>
      </div>

      <!-- Aim Reticle (Center) -->
      <div class="dope-game-aim-dot" id="dope-aim-dot"></div>

      <!-- Subtitle Runner (Bottom Center) -->
      <div class="dope-game-subtitles-wrap">
        <div class="dope-game-subtitle-text" id="dope-subtitle-txt"></div>
      </div>

      <!-- Dev Stats Overlay (Bottom Left) -->
      <div class="dope-game-dev-stats" id="dope-dev-stats">
        FPS: <span id="dope-stat-fps">60</span> | TRIS: <span id="dope-stat-tris">0</span> | CALLS: <span id="dope-stat-calls">0</span>
      </div>

      <!-- End / Victory Modal -->
      <div class="dope-game-modal" id="dope-end-modal">
        <div class="dope-game-modal-box">
          <h2 class="dope-game-modal-title" id="dope-modal-title">VICTORY</h2>
          <p class="dope-game-modal-desc" id="dope-modal-desc">The Warden falls. The chain is shattered.</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button type="button" class="dope-game-enter-btn" id="dope-modal-restart-btn">REMATCH</button>
            <button type="button" class="dope-game-exit-btn" id="dope-modal-exit-btn">RETURN TO SITE</button>
          </div>
        </div>
      </div>
    `;

    this.hpFill = this.root.querySelector('#dope-hud-hp-fill');
    this.hpTxt = this.root.querySelector('#dope-hud-hp-txt');
    this.stamFill = this.root.querySelector('#dope-hud-stam-fill');
    this.rageFill = this.root.querySelector('#dope-hud-rage-fill');
    this.bossWrap = this.root.querySelector('#dope-boss-wrap');
    this.bossHpFill = this.root.querySelector('#dope-boss-hp-fill');
    this.aimDot = this.root.querySelector('#dope-aim-dot');
    this.subtitleTxt = this.root.querySelector('#dope-subtitle-txt');
    this.devStats = this.root.querySelector('#dope-dev-stats');
    this.statFps = this.root.querySelector('#dope-stat-fps');
    this.statTris = this.root.querySelector('#dope-stat-tris');
    this.statCalls = this.root.querySelector('#dope-stat-calls');
    this.endModal = this.root.querySelector('#dope-end-modal');
    this.modalTitle = this.root.querySelector('#dope-modal-title');
    this.modalDesc = this.root.querySelector('#dope-modal-desc');
  }

  bindEvents() {
    this.root.querySelector('#dope-game-exit-btn').addEventListener('click', () => {
      if (this.onExit) this.onExit();
    });
    this.root.querySelector('#dope-modal-exit-btn').addEventListener('click', () => {
      if (this.onExit) this.onExit();
    });
    this.root.querySelector('#dope-modal-restart-btn').addEventListener('click', () => {
      this.endModal.classList.remove('visible');
      if (this.onRestart) this.onRestart();
    });
  }

  showSubtitle(text, duration = 4.0) {
    this.subtitleTxt.innerText = text;
    this.subtitleTxt.classList.add('visible');
    this.currentSubtitleTimer = duration;
  }

  update(dt, player, boss = null, stats = null) {
    // 1. Update Player Meters
    if (player) {
      const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
      this.hpFill.style.width = `${hpPct}%`;
      this.hpTxt.innerText = `${Math.ceil(player.hp)} / 100`;

      const stamPct = Math.max(0, (player.stamina / player.maxStamina) * 100);
      this.stamFill.style.width = `${stamPct}%`;

      const ragePct = Math.max(0, (player.rage / player.maxRage) * 100);
      this.rageFill.style.width = `${ragePct}%`;

      // Aim Reticle Toggle
      if (player.state === 'BLOCK' && player.weapon.state === 'EQUIPPED') {
        this.aimDot.classList.add('active');
      } else {
        this.aimDot.classList.remove('active');
      }
    }

    // 2. Boss Health Bar
    if (boss && !boss.isDead) {
      this.bossWrap.classList.add('active');
      const bossPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
      this.bossHpFill.style.width = `${bossPct}%`;
    } else {
      this.bossWrap.classList.remove('active');
    }

    // 3. Subtitle Timer Decay
    if (this.currentSubtitleTimer > 0) {
      this.currentSubtitleTimer -= dt;
      if (this.currentSubtitleTimer <= 0) {
        this.subtitleTxt.classList.remove('visible');
      }
    }

    // 4. Dev Stats Display
    if (stats) {
      this.statFps.innerText = stats.fps;
      this.statTris.innerText = stats.triangles;
      this.statCalls.innerText = stats.drawCalls;
    }
  }

  toggleDevStats() {
    this.devStats.classList.toggle('visible');
  }

  showEndModal(isWin) {
    this.endModal.classList.add('visible');
    if (isWin) {
      this.modalTitle.innerText = 'SOVEREIGN RECLAIMED';
      this.modalTitle.style.color = '#ef4444';
      this.modalDesc.innerText = 'The Warden falls. The chain is shattered. The Sanctum belongs to the Sovereign once more.';
    } else {
      this.modalTitle.innerText = 'FALLEN IN CHAINS';
      this.modalTitle.style.color = '#94a3b8';
      this.modalDesc.innerText = 'Your blood stains the altar stone once more. The bell tolls your demise.';
    }
  }

  dispose() {
    if (this.root && this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
  }
}
