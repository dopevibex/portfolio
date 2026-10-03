# SANCTUM ARENA 3D MINI-GAME AUDIT

## 1. BASELINE REPOSITORY & BRANCH SAFETY
- **Git Repository Initialized:** Yes
- **Base Commit:** `eaa79d0` on branch `main`
- **Active Working Branch:** `feature/sanctum-game`
- **Rule Confirmation:** All work is strictly isolated to `feature/sanctum-game`.

## 2. CURRENT ENVIRONMENT & FILES AUDIT
### Portfolio Structure:
- `index.html`: Main portfolio document.
  - Sanctum Arena Section: `<section class="section-block game3d-section" id="arena3d">` (Lines ~858 to ~900).
  - Current Content: A basic 3D canvas card (`#game3dViewportCard`) running an orbit-only placeholder viewer.
  - Script Hook: Line ~971 imports `./game/index.js` and auto-mounts `GameModule`.
- `app.js`: Portfolio-wide interactive logic (audio toggles, drawer, scrolls, modals). **DO NOT TOUCH.**
- `styles.css`: Portfolio master styling. **DO NOT TOUCH.**
- `assets/`: Static image, audio, and SVG portfolio assets. **DO NOT TOUCH** (except reading vendor libraries if needed).
- `assets/vendor/three/`: Local Three.js r128 module, GLTFLoader, OrbitControls.

### Existing `/game` Directory:
- `game/core/engine.js`: Basic Three.js setup.
- `game/core/loop.js`: Simple requestAnimationFrame loop.
- `game/entities/fighter.js`: Basic placeholder fighter mesh.
- `game/world/arena.js`: Basic cylinder arena.
- `game/index.js`: Mount/unmount interface.

## 3. EXACT FILES THAT WILL BE TOUCHED
### A. Existing Files Allowed to Be Modified:
1. `index.html`:
   - Replace the interior of `<section class="section-block game3d-section" id="arena3d">` with the clean DOPE-style entry card (Title, Lore, "ENTER SANCTUM" button, Controls hint).
   - Update the bottom script tag to lazy-load `./game/index.js` ONLY upon clicking the "ENTER SANCTUM" button.
2. `package.json`: (Only if a new runtime dependency is strictly required; Three.js is already bundled locally in `assets/vendor/three/`).

### B. Untouched Protected Files (STRICTLY FORBIDDEN TO MODIFY):
- Hero, IDENTITY, ARSENAL, PROJECTS, CHRONICLES, NEXUS, navbar, footer, global CSS (`styles.css`), fonts, audio toggles, portfolio routing, copy.

### C. Isolated New Game Architecture (`/game/` only):
All game code, state machines, combat mechanics, AI, UI, and narrative live exclusively in `/game/`:
- `/game/AUDIT.md`: This file.
- `/game/STORY.md`: Narrative script, prologue, encounter subtitles, boss lore, ending.
- `/game/DESIGN.md`: Combat numbers, frame data, i-frames, damage, enemy specs, boss phases.
- `/game/CREDITS.md`: Full asset licenses, URLs, and attribution.
- `/game/PROGRESS.md`: Step-by-step verification log, FPS, draw calls, triangle metrics.
- `/game/game.css`: Scoped game UI styles (prefixed with `.dope-game-`).
- `/game/index.js`: Lazy-loaded module entry point with clean lifecycle (mount, enter, pause, exit, destroy).
- `/game/core/`: Engine, camera (OTS), input, loop, audio, particle VFX.
- `/game/combat/`: Chained weapon throw/recall, combo state machine, parry/block, rage mode, finisher.
- `/game/entities/`: Player, Thrall, Shielded Brute, Void Caster, Boss.
- `/game/world/`: Ruined gothic cathedral arena, lighting, fog.
- `/game/ui/`: Subtitle runner, HUD (health/stamina/rage), controls overlay, victory/defeat modal.
