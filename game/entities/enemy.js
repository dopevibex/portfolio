// Enemy AI Entities: Ashen Thrall, Ironclad Brute, Void Weaver, and Boss Malphas
import * as THREE from '../../assets/vendor/three/three.module.js';

export class Enemy {
  constructor(scene, type = 'THRALL', spawnPos = new THREE.Vector3(0, 0, -6), soundSystem) {
    this.scene = scene;
    this.type = type; // THRALL, BRUTE, CASTER, BOSS
    this.sounds = soundSystem;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(spawnPos);
    this.scene.add(this.mesh);

    // Combat Stats & Config
    this.initStats();

    // AI State Machine: IDLE, APPROACH, CIRCLE, TELEGRAPH, ATTACK, RECOVER, STAGGER, DEAD
    this.aiState = 'IDLE';
    this.stateTimer = 0;
    this.decisionTimer = Math.random() * 0.8;
    this.isDead = false;
    this.isStaggered = false;
    this.staggerTimer = 0;
    this.hasDealtDamage = false;

    // Visual Mesh Assembly
    this.buildVisualMesh();
  }

  get position() {
    return this.mesh.position;
  }

  initStats() {
    if (this.type === 'THRALL') {
      this.hp = 50;
      this.maxHp = 50;
      this.speed = 3.4;
      this.attackRange = 2.0;
      this.attackDamage = 14;
      this.telegraphTime = 0.45;
      this.attackDuration = 0.35;
      this.recoveryTime = 0.6;
    } else if (this.type === 'BRUTE') {
      this.hp = 120;
      this.maxHp = 120;
      this.speed = 2.2;
      this.attackRange = 2.4;
      this.attackDamage = 28;
      this.telegraphTime = 0.65;
      this.attackDuration = 0.45;
      this.recoveryTime = 0.9;
      this.hasShield = true;
    } else if (this.type === 'CASTER') {
      this.hp = 65;
      this.maxHp = 65;
      this.speed = 2.6;
      this.attackRange = 14.0;
      this.attackDamage = 22;
      this.telegraphTime = 0.8;
      this.attackDuration = 0.4;
      this.recoveryTime = 1.2;
      this.isHovering = true;
    } else if (this.type === 'BOSS') {
      this.hp = 320;
      this.maxHp = 320;
      this.speed = 3.6;
      this.attackRange = 2.8;
      this.attackDamage = 32;
      this.telegraphTime = 0.55;
      this.attackDuration = 0.48;
      this.recoveryTime = 0.7;
      this.phase = 1;
    }
  }

  buildVisualMesh() {
    // Shared dark gothic palette
    const armorMat = new THREE.MeshStandardMaterial({
      color: this.type === 'BOSS' ? 0x090a0f : 0x181a24,
      roughness: 0.38,
      metalness: 0.82
    });
    const clothMat = new THREE.MeshStandardMaterial({
      color: this.type === 'CASTER' ? 0x450a0a : 0x0d0e14,
      roughness: 0.9
    });

    // 1. Torso
    const scaleY = (this.type === 'BRUTE' || this.type === 'BOSS') ? 1.3 : 1.0;
    const scaleXZ = (this.type === 'BRUTE' || this.type === 'BOSS') ? 1.4 : 1.0;

    const bodyGeo = new THREE.CylinderGeometry(0.24 * scaleXZ, 0.22 * scaleXZ, 1.4 * scaleY, 8);
    const body = new THREE.Mesh(bodyGeo, armorMat);
    body.position.y = 0.85 * scaleY;
    body.castShadow = true;
    this.mesh.add(body);

    // 2. Head & Horns
    const headGeo = new THREE.BoxGeometry(0.26 * scaleXZ, 0.28 * scaleY, 0.26 * scaleXZ);
    const head = new THREE.Mesh(headGeo, armorMat);
    head.position.y = 1.65 * scaleY;
    head.castShadow = true;
    this.mesh.add(head);

    // Boss & Brute Curved Horns
    if (this.type === 'BOSS' || this.type === 'BRUTE') {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), armorMat);
        horn.position.set(side * 0.22, 1.85 * scaleY, 0);
        horn.rotation.z = side * -0.7;
        this.mesh.add(horn);
      }
    }

    // 3. Shield (for Ironclad Brute)
    if (this.type === 'BRUTE') {
      const shieldGeo = new THREE.BoxGeometry(0.12, 1.4, 0.75);
      const shieldMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.9 });
      this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      this.shieldMesh.position.set(-0.45, 0.9, 0.35);
      this.shieldMesh.castShadow = true;
      this.mesh.add(this.shieldMesh);
    }

    // 4. Weapons
    this.weaponGroup = new THREE.Group();
    const weaponMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.25, metalness: 0.92 });

    if (this.type === 'BOSS') {
      // Dual Executioner Axes
      for (const side of [-1, 1]) {
        const axe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.45), weaponMat);
        axe.position.set(side * 0.65, 0.8, 0.2);
        axe.castShadow = true;
        this.weaponGroup.add(axe);
      }
    } else {
      // Heavy Cleaver / Mace
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.18), weaponMat);
      blade.position.set(0.45, 0.8, 0.2);
      blade.castShadow = true;
      this.weaponGroup.add(blade);
    }
    this.mesh.add(this.weaponGroup);

    // Hovering Elevation for Caster
    if (this.isHovering) {
      this.mesh.position.y = 1.8;
    }
  }

  update(dt, player, onDealDamage) {
    if (this.isDead) return;

    this.stateTimer += dt;
    this.decisionTimer -= dt;

    const toPlayer = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
    if (!this.isHovering) toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    const dirToPlayer = toPlayer.clone().normalize();

    // Always orient toward player
    if (distToPlayer > 0.1 && this.aiState !== 'DEAD') {
      const targetAngle = Math.atan2(dirToPlayer.x, dirToPlayer.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, 8.0 * dt);
    }

    // --- State Machine ---
    switch (this.aiState) {
      case 'IDLE':
      case 'APPROACH':
        if (distToPlayer > this.attackRange) {
          this.mesh.position.addScaledVector(dirToPlayer, this.speed * dt);
          this.aiState = 'APPROACH';
        } else {
          // Within combat range: choose attack or circle
          if (this.decisionTimer <= 0) {
            this.aiState = (Math.random() < 0.7) ? 'TELEGRAPH' : 'CIRCLE';
            this.stateTimer = 0;
            this.decisionTimer = 1.2;
          }
        }
        break;

      case 'CIRCLE':
        // Strafe around player
        const strafeDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
        this.mesh.position.addScaledVector(strafeDir, (this.speed * 0.7) * dt);
        if (this.stateTimer > 1.0) {
          this.aiState = 'TELEGRAPH';
          this.stateTimer = 0;
        }
        break;

      case 'TELEGRAPH':
        // Windup phase with visual tell (draw back weapon)
        this.weaponGroup.position.z = -0.3;
        if (this.stateTimer >= this.telegraphTime) {
          this.aiState = 'ATTACK';
          this.stateTimer = 0;
          this.hasDealtDamage = false;
          this.sounds.playCleaverSwing(this.type === 'BOSS' ? 0.6 : 0.85);
        }
        break;

      case 'ATTACK':
        // Swing weapon forward
        this.weaponGroup.position.z = 0.5;
        if (!this.hasDealtDamage && this.stateTimer >= 0.12 && this.stateTimer <= 0.28) {
          if (distToPlayer <= this.attackRange + 0.6) {
            this.hasDealtDamage = true;
            const isUnblockable = (this.type === 'BRUTE' || (this.type === 'BOSS' && this.phase === 2));
            if (onDealDamage) onDealDamage(this, this.attackDamage, isUnblockable);
          }
        }
        if (this.stateTimer >= this.attackDuration) {
          this.aiState = 'RECOVER';
          this.stateTimer = 0;
          this.weaponGroup.position.z = 0;
        }
        break;

      case 'RECOVER':
        if (this.stateTimer >= this.recoveryTime) {
          this.aiState = 'IDLE';
          this.decisionTimer = 0.5;
        }
        break;

      case 'STAGGER':
        // Vulnerable state for Finisher (F)
        this.staggerTimer -= dt;
        this.mesh.rotation.x = -0.35;
        if (this.staggerTimer <= 0) {
          this.isStaggered = false;
          this.mesh.rotation.x = 0;
          this.aiState = 'IDLE';
        }
        break;
    }

    // Boss Phase 2 Check
    if (this.type === 'BOSS' && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.speed = 4.2;
      this.attackDamage = 44;
      this.sounds.playRageRoar();
    }
  }

  takeDamage(amount, isHeavy = false, isThrow = false) {
    if (this.isDead) return;

    // Check Frontal Shield Defense (Ironclad Brute)
    if (this.hasShield && !isHeavy && !this.isStaggered) {
      this.sounds.playParryClang();
      this.mesh.position.addScaledVector(new THREE.Vector3(0, 0, 1).applyEuler(this.mesh.rotation), -0.6);
      return 'SHIELD_BLOCKED';
    }

    this.hp = Math.max(0, this.hp - amount);
    this.sounds.playHeavyImpact();

    // Heavy breaks shield or staggers
    if (isHeavy || isThrow) {
      this.isStaggered = true;
      this.staggerTimer = 2.4; // 2.4s Finisher window
      this.aiState = 'STAGGER';
      this.stateTimer = 0;
    }

    // Death Check
    if (this.hp <= 0) {
      this.isDead = true;
      this.aiState = 'DEAD';
      this.mesh.rotation.x = -Math.PI / 2;
      this.mesh.position.y = 0.2;
    }
    return 'HIT';
  }

  executeFinisher() {
    this.hp = 0;
    this.isDead = true;
    this.aiState = 'DEAD';
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.2;
    this.sounds.playHeavyImpact();
  }

  dispose() {
    if (this.scene) {
      this.scene.remove(this.mesh);
    }
  }
}
