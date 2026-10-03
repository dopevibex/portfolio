# SANCTUM: THE BOUND SOVEREIGN — GAME DESIGN & COMBAT SPECIFICATION

---

## 1. PLAYER COMBAT METRICS & FRAME DATA

### Base Stats
- **Health:** 100 (No passive regen. Regain only via Finisher execution or Sovereign's Wrath).
- **Stamina:** 100 (Passive regen: 25/sec after 0.75s delay. Depleted stamina causes brief exhaustion).
- **Rage (Sovereign's Wrath):** 0 to 100.
  - Gain: +4 per Light Hit, +8 per Heavy Hit, +15 per Timed Parry, +20 per Finisher.
  - Activation: Press `R` when Rage = 100. Lasts 10 seconds (drains at 10/sec).
  - Buff: +40% attack damage, hyper-armor (uninterruptible poise), 10% life-steal on hit.

### Movement
- **Walk Speed:** 3.6 m/s
- **Sprint Speed:** 6.4 m/s (Costs 8 stamina/sec)
- **Dodge Roll:** Duration 0.48s. Total travel: 4.8m.
  - **i-Frames (Invulnerable Window):** `0.06s` to `0.30s` (0.24s total).
  - **Stamina Cost:** 22.

---

## 2. ATTACK TIMINGS & HIT WINDOWS
*Damage is calculated strictly inside the active hitbox window, NEVER upon button press.*

| Attack Name | Key | Startup | Active Window | Recovery | Damage | Stagger | Stamina Cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Light Cleave 1** | `LMB` | 0.14s | `0.14s - 0.26s` | 0.20s | 16 | 15 | 10 |
| **Light Uppercut 2** | `LMB` (Combo) | 0.12s | `0.12s - 0.24s` | 0.22s | 22 | 20 | 12 |
| **Heavy Ground Slam 3**| `LMB` (Finisher)| 0.22s | `0.22s - 0.38s` | 0.35s | 36 | 45 | 18 |
| **Heavy Breaker** | `Shift+LMB` / `Q`| 0.32s | `0.32s - 0.50s` | 0.42s | 52 | 80 *(Breaks Shield)* | 28 |
| **Cleaver Throw** | Hold `RMB` + `Release` | 0.18s | Projectile (38 m/s) | 0.25s | 38 | 50 *(Grounds Fly)* | 15 |
| **Cleaver Recall** | `E` | 0.10s | Return Arc (45 m/s) | 0.20s | 26 | 30 *(Pulls Enemy)*| 10 |
| **Brutal Finisher** | `F` (Near Staggered) | 0.08s | Cinematic Execution | 0.40s | **Insta-kill / 120**| Full | 0 (Regens 25 HP)|

---

## 3. DEFENSE, PARRY & HIT-STOP

### Block (`Hold RMB` when not aiming throw)
- Absorbs **75%** of physical damage.
- Depletes **18 stamina** per blocked hit.
- If stamina reaches 0 while blocking, guard is broken (staggered for 1.0s).

### Timed Parry (`Tap RMB` within 0.15s of incoming attack)
- Absorbs **100%** of damage.
- Inflicts **100 Stagger** on the attacking enemy, immediately knocking them into the vulnerable Finisher state.
- Triggers **Hit-Stop:** 0.12s world freeze, cinematic camera kick, metallic sparks, and +15 Rage gain.

---

## 4. ENEMY DESIGN & WAVE COMPOSITION

### Enemy 1: Ashen Thrall (Melee Grunt)
- **Health:** 50 | **Speed:** 3.4 m/s | **Stagger Threshold:** 45
- **Attacks:** Rusted Cleave (14 dmg, 0.4s telegraph).
- **Behavior:** Circles in groups of 2-3, lunges forward when player is in mid-recovery.

### Enemy 2: Ironclad Brute (Shielded Tank)
- **Health:** 120 | **Speed:** 2.2 m/s | **Stagger Threshold:** 85
- **Defense:** Tower shield blocks all front light attacks with metallic deflection.
- **Vulnerability:** Shield breaks on **Heavy Breaker (Q)** or **Timed Parry**, exposing him to brutal attacks.
- **Attacks:** Overhead Mace Smash (28 dmg, unblockable, must dodge), Shield Bash (12 dmg, knocks player back).

### Enemy 3: Void Weaver (Ranged Caster)
- **Health:** 65 | **Speed:** 2.6 m/s | **Stagger Threshold:** 35
- **Elevation:** Hovers 1.8m above ground; melee attacks miss unless grounded.
- **Attacks:** Crimson Seeker Skull (22 dmg, slow homing, can be destroyed by weapon throw or parried back).
- **Counter:** Throwing the Cinder Cleaver knocks it to the ground for 3 seconds.

---

## 5. BOSS: MALPHAS, THE THRONE WARDEN

### Boss Stats
- **Health:** 320 Total (Phase 1: 320 to 160 | Phase 2: 160 to 0)
- **Poise / Super-Armor:** Does not stagger from single light attacks; requires 120 stagger build-up or parries.

### Phase 1 (100% to 50% HP)
- **Twin Crescent Cleave:** Sweeps dual executioner axes in a 180-degree frontal arc (24 dmg, blockable).
- **Executioner Leap Slam:** Leaps 10 meters into the air, crashes down with radial shockwave (36 dmg, telegraphed red ground ring, unblockable — must dodge roll).
- **Iron Riposte:** Raises crossed axes; hitting him during this stance counters the player for 20 dmg.

### Phase 2: The Sovereign's Scourge (50% to 0% HP)
- **Cinematic Transition:** Malphas roars, his axes ignite with crimson hellfire, and chains whip around his waist.
- **Whirlwind Chain Storm:** Spins across the arena for 2.5 seconds (4 hits of 12 dmg each, requires spacing or running).
- **Hellfire Fissure:** Slams axes into the stone, sending a jagged crimson fissure toward the player.
- **Vulnerability:** After heavy slams, his axes get stuck in the stone floor for 1.4 seconds, opening a prime DPS window.

---

## 6. WAVE PROGRESSION
- **Wave 1:** 3 Ashen Thralls (Tutorial on light combos and dodge).
- **Wave 2:** 2 Ashen Thralls + 1 Ironclad Brute (Tutorial on heavy shield break and parrying).
- **Wave 3:** 2 Ashen Thralls + 1 Void Weaver (Forces weapon throw and distance management).
- **Boss Encounter:** Malphas, The Throne Warden (Two full phases, epic duel).
