// Player Entity: The Bound Sovereign (Vaelor)
import * as THREE from '../../assets/vendor/three/three.module.js';
import { GLTFLoader } from '../../assets/vendor/three/GLTFLoader.js';
import { CinderCleaver } from '../combat/weapon.js';

export class Player {
  constructor(scene, soundSystem) {
    this.scene = scene;
    this.sounds = soundSystem;

    // Transform
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 8);
    this.scene.add(this.mesh);

    // Combat Stats
    this.hp = 100;
    this.maxHp = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.rage = 0;
    this.maxRage = 100;
    this.isRaging = false;
    this.rageDuration = 0;

    // Movement & Orientation
    this.velocity = new THREE.Vector3();
    this.facingYaw = 0;
    this.speed = 3.6;

    // States & Combo
    this.state = 'IDLE'; // IDLE, MOVE, LIGHT1, LIGHT2, LIGHT3, HEAVY, BLOCK, PARRY, DODGE, FINISHER, HIT, DEAD
    this.stateTimer = 0;
    this.stateDuration = 0;
    this.activeHitWindow = false;
    this.comboQueued = false;
    this.isInvulnerable = false;
    this.isParrying = false;
    this.parryWindow = 0;
    this.staminaRegenDelay = 0;

    // Weapon
    this.weapon = new CinderCleaver(this.scene);
    this.handBone = null;
    this.isLoaded = false;

    // Load Rigged Model
    this.loadCharacterModel();
  }

  loadCharacterModel() {
    const loader = new GLTFLoader();
    loader.load(
      './assets/game/fighter_v2.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.set(1.0, 1.0, 1.0);
        this.mesh.add(this.model);

        this.model.traverse((child) => {
          if (child.isMesh || child.isSkinnedMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          // Locate hand bone for weapon attachment
          if (child.isBone && (child.name.includes('RightHand') || child.name.includes('Hand_R'))) {
            this.handBone = child;
          }
        });

        // Fallback hand anchor if bone not explicitly found
        if (!this.handBone) {
          const dummyHand = new THREE.Object3D();
          dummyHand.position.set(0.42, 1.1, 0.2);
          this.mesh.add(dummyHand);
          this.handBone = dummyHand;
        }

        this.weapon.attachToHand(this.handBone);

        // Animation Mixer setup
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const clip = gltf.animations[0];
          this.animAction = this.mixer.clipAction(clip);
          this.animAction.play();
        }

        this.isLoaded = true;
      },
      undefined,
      (err) => {
        console.warn('[Player] Loading fallback character visual:', err);
        this.createProceduralFallback();
      }
    );
  }

  createProceduralFallback() {
    // High-quality dark warrior fallback if GLB fails
    const group = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x141118, roughness: 0.35, metalness: 0.85 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 1.8, 8), coatMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    const dummyHand = new THREE.Object3D();
    dummyHand.position.set(0.42, 1.05, 0.1);
    group.add(dummyHand);
    this.handBone = dummyHand;

    this.mesh.add(group);
    this.weapon.attachToHand(this.handBone);
    this.isLoaded = true;
  }

  update(dt, input, cameraYaw, enemies, onCombatHit) {
    if (this.hp <= 0 && this.state !== 'DEAD') {
      this.state = 'DEAD';
      return;
    }
    if (this.state === 'DEAD') return;

    this.stateTimer += dt;

    // 1. Stamina Regeneration
    this.staminaRegenDelay -= dt;
    if (this.staminaRegenDelay <= 0 && this.state !== 'BLOCK') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 25.0 * dt);
    }

    // 2. Sovereign's Wrath Rage Drain
    if (this.isRaging) {
      this.rage = Math.max(0, this.rage - 10.0 * dt);
      if (this.rage <= 0) {
        this.isRaging = false;
      }
    }

    // 3. Parry Window Countdown
    if (this.parryWindow > 0) {
      this.parryWindow -= dt;
      this.isParrying = (this.parryWindow > 0);
    }

    // 4. Handle Combat Action Inputs
    this.handleCombatInputs(input, cameraYaw);

    // 5. Update Movement
    this.handleLocomotion(dt, input, cameraYaw);

    // 6. Update Active Attack Windows
    this.handleAttackPhases(enemies, onCombatHit);

    // 7. Update Weapon & Chains
    const handWorldPos = new THREE.Vector3();
    if (this.handBone) this.handBone.getWorldPosition(handWorldPos);
    else handWorldPos.copy(this.mesh.position).add(new THREE.Vector3(0.4, 1.1, 0));

    this.weapon.update(dt, handWorldPos, enemies, onCombatHit);

    // 8. Mixer Update
    if (this.mixer) this.mixer.update(dt);
  }

  handleCombatInputs(input, cameraYaw) {
    // Activate Rage Mode (R)
    if (input.consume('rage') && this.rage >= 100 && !this.isRaging) {
      this.isRaging = true;
      this.sounds.playRageRoar();
    }

    // Weapon Recall (E)
    if (input.consume('recall') && this.weapon.state !== 'EQUIPPED') {
      this.weapon.recallWeapon();
      this.sounds.playChainRattle();
    }

    // Dodge Roll (Space)
    if (input.consume('dodge') && this.stamina >= 22 && this.state !== 'DODGE') {
      this.state = 'DODGE';
      this.stateTimer = 0;
      this.stateDuration = 0.48;
      this.stamina -= 22;
      this.staminaRegenDelay = 0.8;
      this.isInvulnerable = true;

      // Dodge in input direction or backward
      const move = input.getMoveVector();
      let rollAngle = cameraYaw;
      if (move.forward !== 0 || move.right !== 0) {
        rollAngle = cameraYaw + Math.atan2(move.right, move.forward);
      } else {
        rollAngle += Math.PI; // Backstep if standing still
      }
      this.velocity.set(Math.sin(rollAngle) * 9.5, 0, Math.cos(rollAngle) * 9.5);
      this.sounds.playCleaverSwing(0.7);
      return;
    }

    // Cleaver Throw (RMB Release while aiming)
    if (input.mouse.rightDown && input.consume('lightAttack') && this.weapon.state === 'EQUIPPED') {
      // Aim Ray Direction
      const aimDir = new THREE.Vector3(
        -Math.sin(cameraYaw) * Math.cos(input.mouse.pitch),
        Math.sin(input.mouse.pitch),
        -Math.cos(cameraYaw) * Math.cos(input.mouse.pitch)
      ).normalize();

      const spawnPos = this.mesh.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      this.weapon.throwWeapon(spawnPos, aimDir);
      this.sounds.playCleaverSwing(1.3);
      this.sounds.playChainRattle();
      return;
    }

    // Block / Parry (Hold RMB)
    if (input.mouse.rightDown && this.weapon.state === 'EQUIPPED' && !this.isAttacking()) {
      if (this.state !== 'BLOCK') {
        this.state = 'BLOCK';
        this.parryWindow = 0.16; // 0.16s parry window on first raise
        this.isParrying = true;
      }
      return;
    } else if (this.state === 'BLOCK' && !input.mouse.rightDown) {
      this.state = 'IDLE';
      this.isParrying = false;
    }

    // Heavy Attack (Q or Shift+LMB)
    if (input.consume('heavyAttack') && this.stamina >= 28 && !this.isAttacking() && this.weapon.state === 'EQUIPPED') {
      this.startAttack('HEAVY', 0.65, 0.32, 0.50, 52, 28);
      return;
    }

    // Light Attack Combo (LMB)
    if (input.consume('lightAttack') && this.weapon.state === 'EQUIPPED') {
      if (this.state === 'IDLE' || this.state === 'MOVE') {
        this.startAttack('LIGHT1', 0.44, 0.14, 0.26, 16, 10);
      } else if (this.state === 'LIGHT1' && this.stateTimer > 0.18) {
        this.startAttack('LIGHT2', 0.42, 0.12, 0.24, 22, 12);
      } else if (this.state === 'LIGHT2' && this.stateTimer > 0.16) {
        this.startAttack('LIGHT3', 0.60, 0.22, 0.38, 36, 18);
      }
    }
  }

  startAttack(attackName, totalDur, startActive, endActive, dmg, stamCost) {
    if (this.stamina < stamCost) return;
    this.state = attackName;
    this.stateTimer = 0;
    this.stateDuration = totalDur;
    this.activeHitStart = startActive;
    this.activeHitEnd = endActive;
    this.attackDamage = this.isRaging ? dmg * 1.4 : dmg;
    this.stamina -= stamCost;
    this.staminaRegenDelay = 0.75;
    this.hasHitCurrentAttack = false;

    // Small forward lunge on attack swing
    const fwd = new THREE.Vector3(Math.sin(this.facingYaw), 0, Math.cos(this.facingYaw));
    this.velocity.addScaledVector(fwd, 4.0);

    const pitchMap = { LIGHT1: 1.0, LIGHT2: 1.2, LIGHT3: 0.85, HEAVY: 0.7 };
    this.sounds.playCleaverSwing(pitchMap[attackName] || 1.0);
  }

  isAttacking() {
    return ['LIGHT1', 'LIGHT2', 'LIGHT3', 'HEAVY', 'FINISHER'].includes(this.state);
  }

  handleAttackPhases(enemies, onCombatHit) {
    if (!this.isAttacking()) {
      this.activeHitWindow = false;
      return;
    }

    const t = this.stateTimer;
    // Active Hit Window
    this.activeHitWindow = (t >= this.activeHitStart && t <= this.activeHitEnd);

    if (this.activeHitWindow && !this.hasHitCurrentAttack) {
      const reach = (this.state === 'HEAVY') ? 2.5 : 2.1;
      const fwd = new THREE.Vector3(Math.sin(this.facingYaw), 0, Math.cos(this.facingYaw));

      for (const enemy of enemies) {
        if (enemy.isDead) continue;
        const dist = this.mesh.position.distanceTo(enemy.position);
        if (dist <= reach) {
          const toEnemy = new THREE.Vector3().subVectors(enemy.position, this.mesh.position).normalize();
          if (fwd.dot(toEnemy) > 0.3) {
            // Valid Frontal Hit
            this.hasHitCurrentAttack = true;
            const isHeavy = (this.state === 'HEAVY' || this.state === 'LIGHT3');
            if (onCombatHit) onCombatHit(enemy, this.attackDamage, isHeavy);

            // Rage Gain & Life Siphon
            this.rage = Math.min(this.maxRage, this.rage + (isHeavy ? 8 : 4));
            if (this.isRaging) {
              this.hp = Math.min(this.maxHp, this.hp + this.attackDamage * 0.1);
            }
          }
        }
      }
    }

    // End Attack Recovery
    if (t >= this.stateDuration) {
      this.state = 'IDLE';
      this.activeHitWindow = false;
    }
  }

  handleLocomotion(dt, input, cameraYaw) {
    if (this.state === 'DODGE') {
      this.mesh.position.addScaledVector(this.velocity, dt);
      this.velocity.multiplyScalar(0.92);
      this.isInvulnerable = (this.stateTimer >= 0.06 && this.stateTimer <= 0.30);
      if (this.stateTimer >= this.stateDuration) {
        this.state = 'IDLE';
        this.isInvulnerable = false;
      }
      return;
    }

    if (this.isAttacking() || this.state === 'BLOCK') {
      // Damped movement during swings/block
      this.mesh.position.addScaledVector(this.velocity, dt);
      this.velocity.multiplyScalar(0.82);
      return;
    }

    const move = input.getMoveVector();
    if (move.forward !== 0 || move.right !== 0) {
      this.state = 'MOVE';
      const moveAngle = cameraYaw + Math.atan2(move.right, move.forward);
      this.facingYaw = THREE.MathUtils.lerp(this.facingYaw, moveAngle, 12.0 * dt);
      this.mesh.rotation.y = this.facingYaw;

      const targetSpeed = (move.isSprinting && this.stamina > 5) ? 6.4 : 3.6;
      if (move.isSprinting) {
        this.stamina = Math.max(0, this.stamina - 8.0 * dt);
        this.staminaRegenDelay = 0.5;
      }

      const moveDir = new THREE.Vector3(Math.sin(moveAngle), 0, Math.cos(moveAngle));
      this.mesh.position.addScaledVector(moveDir, targetSpeed * dt);
    } else {
      this.state = 'IDLE';
    }

    // Arena Boundary Clamp (Radius 18.5m)
    if (this.mesh.position.length() > 18.5) {
      this.mesh.position.setLength(18.5);
    }
  }

  takeDamage(amount, isUnblockable = false) {
    if (this.isInvulnerable || this.state === 'DEAD') return false;

    // Check Parry
    if (this.isParrying && !isUnblockable) {
      this.sounds.playParryClang();
      this.rage = Math.min(this.maxRage, this.rage + 15);
      return 'PARRY';
    }

    // Check Block
    if (this.state === 'BLOCK' && !isUnblockable) {
      this.sounds.playParryClang();
      const staminaLoss = 18;
      this.stamina = Math.max(0, this.stamina - staminaLoss);
      this.hp = Math.max(0, this.hp - amount * 0.25); // 75% absorbed
      if (this.stamina <= 0) {
        // Guard Broken
        this.state = 'HIT';
        this.stateTimer = 0;
        this.stateDuration = 0.8;
      }
      return 'BLOCKED';
    }

    // Direct Hit
    this.hp = Math.max(0, this.hp - amount);
    this.sounds.playHeavyImpact();
    this.state = 'HIT';
    this.stateTimer = 0;
    this.stateDuration = 0.28;

    if (this.hp <= 0) {
      this.state = 'DEAD';
    }
    return 'HIT';
  }

  dispose() {
    if (this.weapon) this.weapon.dispose();
    if (this.mixer) this.mixer.stopAllAction();
    if (this.scene) this.scene.remove(this.mesh);
  }
}
