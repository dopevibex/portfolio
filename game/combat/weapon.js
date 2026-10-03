// Signature Weapon: The Cinder Cleaver & Soul-Chain (Throw & Recall)
import * as THREE from '../../assets/vendor/three/three.module.js';

export class CinderCleaver {
  constructor(scene) {
    this.scene = scene;
    this.state = 'EQUIPPED'; // EQUIPPED, THROWN, EMBEDDED, RECALLING

    // 1. Procedural 3D Weapon Mesh
    this.mesh = new THREE.Group();

    // Hilt & Grip
    const hiltGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.38, 6);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.4 });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.y = -0.15;
    this.mesh.add(hilt);

    // Crossguard
    const guardGeo = new THREE.BoxGeometry(0.32, 0.05, 0.08);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.85 });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.02;
    this.mesh.add(guard);

    // Heavy Notched Cleaver Blade
    const bladeGeo = new THREE.BoxGeometry(0.16, 1.25, 0.035);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xcfd4dc,
      roughness: 0.18,
      metalness: 0.94
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.65;
    blade.castShadow = true;
    this.mesh.add(blade);

    // Crimson Runic Edge (Center channel)
    const runeGeo = new THREE.BoxGeometry(0.04, 1.15, 0.04);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const runeEdge = new THREE.Mesh(runeGeo, runeMat);
    runeEdge.position.set(0, 0.62, 0);
    this.mesh.add(runeEdge);

    this.scene.add(this.mesh);

    // 2. Dynamic Soul-Chain (Line segments between Hand and Cleaver)
    this.chainPoints = [];
    const chainSegments = 16;
    for (let i = 0; i < chainSegments; i++) {
      this.chainPoints.push(new THREE.Vector3());
    }
    this.chainGeo = new THREE.BufferGeometry().setFromPoints(this.chainPoints);
    this.chainMat = new THREE.LineBasicMaterial({ color: 0xdc2626, linewidth: 2, transparent: true, opacity: 0.75 });
    this.chainLine = new THREE.Line(this.chainGeo, this.chainMat);
    this.chainLine.visible = false;
    this.scene.add(this.chainLine);

    // Flight & Recall Physics
    this.velocity = new THREE.Vector3();
    this.embeddedTarget = null;
    this.embeddedOffset = new THREE.Vector3();
    this.recallT = 0;
    this.recallStartPos = new THREE.Vector3();
    this.handBone = null;
  }

  attachToHand(bone) {
    this.handBone = bone;
    if (this.state === 'EQUIPPED') {
      this.snapToHand();
    }
  }

  snapToHand() {
    if (!this.handBone) return;
    const handWorldPos = new THREE.Vector3();
    const handWorldQuat = new THREE.Quaternion();
    this.handBone.getWorldPosition(handWorldPos);
    this.handBone.getWorldQuaternion(handWorldQuat);

    this.mesh.position.copy(handWorldPos);
    this.mesh.quaternion.copy(handWorldQuat);
    // Align blade forward
    this.mesh.rotateX(Math.PI / 2);
    this.mesh.visible = true;
    this.chainLine.visible = false;
  }

  throwWeapon(origin, direction) {
    if (this.state !== 'EQUIPPED') return;

    this.state = 'THROWN';
    this.mesh.position.copy(origin);
    this.velocity.copy(direction).normalize().multiplyScalar(38.0); // 38 m/s
    this.chainLine.visible = true;
  }

  recallWeapon() {
    if (this.state === 'EQUIPPED' || this.state === 'RECALLING') return;

    this.state = 'RECALLING';
    this.recallT = 0;
    this.recallStartPos.copy(this.mesh.position);
    this.embeddedTarget = null;
    this.chainLine.visible = true;
  }

  update(dt, playerHandPos, enemies = [], onHitCallback = null) {
    if (this.state === 'EQUIPPED') {
      this.snapToHand();
      return;
    }

    // 1. Update Chain Visuals
    if (this.chainLine.visible) {
      const p1 = playerHandPos;
      const p2 = this.mesh.position;
      const positions = this.chainGeo.attributes.position.array;

      for (let i = 0; i < 16; i++) {
        const alpha = i / 15;
        // Natural sag / arc in chain
        const sag = Math.sin(alpha * Math.PI) * -0.6;
        positions[i * 3] = p1.x + (p2.x - p1.x) * alpha;
        positions[i * 3 + 1] = p1.y + (p2.y - p1.y) * alpha + sag;
        positions[i * 3 + 2] = p1.z + (p2.z - p1.z) * alpha;
      }
      this.chainGeo.attributes.position.needsUpdate = true;
    }

    // 2. Flight Trajectory (THROWN)
    if (this.state === 'THROWN') {
      this.mesh.position.addScaledVector(this.velocity, dt);
      this.mesh.rotateZ(25.0 * dt); // High-speed spin in air

      // Check Enemy Collisions
      for (const enemy of enemies) {
        if (!enemy.isDead && enemy.position.distanceTo(this.mesh.position) < 1.4) {
          this.state = 'EMBEDDED';
          this.embeddedTarget = enemy;
          this.embeddedOffset.subVectors(this.mesh.position, enemy.position);
          if (onHitCallback) onHitCallback(enemy, 38, true);
          return;
        }
      }

      // Ground / Arena Wall Collision
      if (this.mesh.position.y <= 0.4 || this.mesh.position.length() >= 20.0) {
        this.state = 'EMBEDDED';
        this.mesh.position.y = Math.max(0.2, this.mesh.position.y);
      }
    }

    // 3. Embedded State (Tracks target movement if stuck in enemy)
    else if (this.state === 'EMBEDDED') {
      if (this.embeddedTarget) {
        if (this.embeddedTarget.isDead) {
          this.embeddedTarget = null;
          this.mesh.position.y = 0.2;
        } else {
          this.mesh.position.copy(this.embeddedTarget.position).add(this.embeddedOffset);
        }
      }
    }

    // 4. Recall Trajectory (RECALLING)
    else if (this.state === 'RECALLING') {
      this.recallT += dt * 3.2; // Return in ~0.3s
      const t = Math.min(1.0, this.recallT);

      // Bezier curve return path
      const midPoint = new THREE.Vector3().addVectors(this.recallStartPos, playerHandPos).multiplyScalar(0.5);
      midPoint.y += 2.0; // Upward return arc

      // Quadratic Bezier
      const p = new THREE.Vector3()
        .copy(this.recallStartPos).multiplyScalar((1 - t) * (1 - t))
        .addScaledVector(midPoint, 2 * (1 - t) * t)
        .addScaledVector(playerHandPos, t * t);

      this.mesh.position.copy(p);
      this.mesh.rotateZ(-30.0 * dt);

      // Damage enemies on return path
      for (const enemy of enemies) {
        if (!enemy.isDead && enemy.position.distanceTo(this.mesh.position) < 1.3) {
          if (onHitCallback) onHitCallback(enemy, 26, false);
        }
      }

      if (t >= 1.0) {
        this.state = 'EQUIPPED';
        this.snapToHand();
      }
    }
  }

  dispose() {
    if (this.scene) {
      this.scene.remove(this.mesh);
      this.scene.remove(this.chainLine);
    }
    if (this.chainGeo) this.chainGeo.dispose();
    if (this.chainMat) this.chainMat.dispose();
  }
}
