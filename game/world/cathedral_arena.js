// Ruined Gothic Cathedral Arena (Instanced Pillars, Broken Arches, Runic Dais)
import * as THREE from '../../assets/vendor/three/three.module.js';

export class CathedralArena {
  constructor(scene) {
    this.scene = scene;
    this.disposables = [];

    this.createArenaDais();
    this.createInstancedPillars();
    this.createGothicArchways();
    this.createCrimsonRunicCore();
    this.createHangingChains();
  }

  createArenaDais() {
    // 1. Central Flagstone Ground (Capped cylinder with stepped edge)
    const daisGeo = new THREE.CylinderGeometry(20, 20.8, 1.4, 32);
    const daisMat = new THREE.MeshStandardMaterial({
      color: 0x12141c,
      roughness: 0.88,
      metalness: 0.18,
      flatShading: true
    });
    this.disposables.push(daisGeo, daisMat);

    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.y = -0.7;
    dais.receiveShadow = true;
    this.scene.add(dais);

    // 2. Outer Perimeter Barrier (Ruined low balustrade to demarcate bounds)
    const wallGeo = new THREE.RingGeometry(19.2, 20.4, 32);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e2029,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    this.disposables.push(wallGeo, wallMat);

    const ring = new THREE.Mesh(wallGeo, wallMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    ring.receiveShadow = true;
    this.scene.add(ring);
  }

  createInstancedPillars() {
    // Single Instanced Mesh for all 8 shattered gothic pillars (1 draw call)
    const pillarGeo = new THREE.CylinderGeometry(0.85, 1.25, 11, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x161822,
      roughness: 0.85,
      metalness: 0.15
    });
    this.disposables.push(pillarGeo, pillarMat);

    const pillarCount = 8;
    const instancedPillars = new THREE.InstancedMesh(pillarGeo, pillarMat, pillarCount);
    instancedPillars.castShadow = true;
    instancedPillars.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const radius = 17.5;

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i / pillarCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const heightOffset = (i % 2 === 0) ? 5.2 : 3.8; // Varied broken pillar heights
      const tilt = (i % 3 === 0) ? 0.08 : -0.05;

      dummy.position.set(x, heightOffset, z);
      dummy.rotation.set(tilt, angle, 0);
      dummy.scale.set(1, (i % 2 === 0) ? 1.0 : 0.75, 1);
      dummy.updateMatrix();

      instancedPillars.setMatrixAt(i, dummy.matrix);
    }

    instancedPillars.instanceMatrix.needsUpdate = true;
    this.scene.add(instancedPillars);
  }

  createGothicArchways() {
    // Ruined High Sanctuary Portal (North End of Arena)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -18.5);

    const pillarLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 14, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.9 })
    );
    pillarLeft.position.set(-4.5, 7, 0);
    pillarLeft.castShadow = true;
    pillarLeft.receiveShadow = true;
    archGroup.add(pillarLeft);

    const pillarRight = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 14, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.9 })
    );
    pillarRight.position.set(4.5, 7, 0);
    pillarRight.castShadow = true;
    pillarRight.receiveShadow = true;
    archGroup.add(pillarRight);

    // Broken Pointed Arch Lintel
    const lintelLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 5.5, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.9 })
    );
    lintelLeft.position.set(-2.2, 13.2, 0);
    lintelLeft.rotation.z = -Math.PI / 4;
    lintelLeft.castShadow = true;
    archGroup.add(lintelLeft);

    const lintelRight = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 5.5, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.9 })
    );
    lintelRight.position.set(2.2, 13.2, 0);
    lintelRight.rotation.z = Math.PI / 4;
    lintelRight.castShadow = true;
    archGroup.add(lintelRight);

    this.scene.add(archGroup);
  }

  createCrimsonRunicCore() {
    // Restrained central runic floor circle
    const runeGeo = new THREE.RingGeometry(0.2, 7.5, 48);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      wireframe: true
    });
    this.disposables.push(runeGeo, runeMat);

    const runeRing = new THREE.Mesh(runeGeo, runeMat);
    runeRing.rotation.x = -Math.PI / 2;
    runeRing.position.y = 0.02;
    this.scene.add(runeRing);

    // Subtle Crimson Brazier Ambient Light (Center)
    const brazierLight = new THREE.PointLight(0xdc2626, 1.4, 18, 2.0);
    brazierLight.position.set(0, 1.2, 0);
    this.scene.add(brazierLight);
  }

  createHangingChains() {
    // Hanging soul-chains suspended from broken pillars
    const chainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.35
    });

    for (let c = 0; c < 4; c++) {
      const chainGroup = new THREE.Group();
      const angle = (c / 4) * Math.PI * 2 + 0.4;
      const x = Math.cos(angle) * 16.5;
      const z = Math.sin(angle) * 16.5;

      const linkCount = 7;
      for (let i = 0; i < linkCount; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 10), chainMat);
        link.position.set(0, 6.5 - i * 0.45, 0);
        link.rotation.x = (i % 2 === 0) ? 0 : Math.PI / 2;
        chainGroup.add(link);
      }
      chainGroup.position.set(x, 0, z);
      this.scene.add(chainGroup);
    }
  }

  update(dt) {
    // Static high-performance geometry (no per-frame allocations)
  }

  dispose() {
    this.disposables.forEach((item) => {
      if (item.dispose) item.dispose();
    });
    this.disposables = [];
  }
}
