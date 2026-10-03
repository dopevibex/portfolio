import * as THREE from 'three';

export class Arena {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.lights = [];
    this.brazierLights = [];

    this.initLighting();
    this.buildArenaArchitecture();
  }

  initLighting() {
    // 1. Ambient Shadow Fill (Deep Charcoal Slate)
    const ambientLight = new THREE.AmbientLight(0x201a26, 1.35);
    this.group.add(ambientLight);
    this.lights.push(ambientLight);

    // 2. Hemisphere Ambient Fill (Cold Silver Sky vs Dark Iron Earth)
    const hemiLight = new THREE.HemisphereLight(0xdce6f5, 0x18101a, 0.9);
    hemiLight.position.set(0, 35, 0);
    this.group.add(hemiLight);
    this.lights.push(hemiLight);

    // 3. High Cold-Silver Moonlight Key Light (Shadow Caster)
    const moonKeyLight = new THREE.DirectionalLight(0xeef4fc, 2.7);
    moonKeyLight.position.set(18, 32, 16);
    moonKeyLight.castShadow = true;
    moonKeyLight.shadow.mapSize.width = 2048;
    moonKeyLight.shadow.mapSize.height = 2048;
    moonKeyLight.shadow.camera.near = 0.5;
    moonKeyLight.shadow.camera.far = 80;
    moonKeyLight.shadow.camera.left = -24;
    moonKeyLight.shadow.camera.right = 24;
    moonKeyLight.shadow.camera.top = 24;
    moonKeyLight.shadow.camera.bottom = -24;
    moonKeyLight.shadow.bias = -0.0004;
    moonKeyLight.shadow.radius = 2.0;
    this.group.add(moonKeyLight);
    this.lights.push(moonKeyLight);

    // 4. Deep Crimson Atmospheric Rim Light (Back & Left Angle)
    const crimsonRimLight = new THREE.DirectionalLight(0xff1e42, 1.6);
    crimsonRimLight.position.set(-22, 16, -20);
    this.group.add(crimsonRimLight);
    this.lights.push(crimsonRimLight);

    // 5. Muted Cold Silver Edge Highlight Light (Right & Back Angle)
    const silverRimLight = new THREE.DirectionalLight(0xa0b2c8, 1.2);
    silverRimLight.position.set(-16, 14, 22);
    this.group.add(silverRimLight);
    this.lights.push(silverRimLight);

    // 6. Central Arena Subterranean Conduit Glow (Beneath Platform)
    const coreGlow = new THREE.PointLight(0xb81428, 3.2, 24, 1.3);
    coreGlow.position.set(0, -0.3, 0);
    this.group.add(coreGlow);
    this.lights.push(coreGlow);

    // 7. Frontal Fighter Focal Fill Light (Cold Silver Metallic Sheen)
    const fighterFocalLight = new THREE.DirectionalLight(0xf2f7ff, 2.2);
    fighterFocalLight.position.set(4, 9, 8);
    this.group.add(fighterFocalLight);
    this.lights.push(fighterFocalLight);
  }

  buildArenaArchitecture() {
    // ==========================================
    // SHARED REUSABLE DARK FANTASY MATERIALS
    // ==========================================
    const matObsidianDais = new THREE.MeshStandardMaterial({
      color: 0x16121c,
      roughness: 0.68,
      metalness: 0.32
    });

    const matDarkGraniteTier = new THREE.MeshStandardMaterial({
      color: 0x0e0a14,
      roughness: 0.82,
      metalness: 0.22
    });

    const matAbyssBasement = new THREE.MeshStandardMaterial({
      color: 0x050308,
      roughness: 0.92,
      metalness: 0.15
    });

    const matForgedIron = new THREE.MeshStandardMaterial({
      color: 0x221c28,
      roughness: 0.42,
      metalness: 0.75
    });

    const matSilverTrim = new THREE.MeshStandardMaterial({
      color: 0x645e6c,
      roughness: 0.28,
      metalness: 0.82
    });

    const matCrimsonChannel = new THREE.MeshStandardMaterial({
      color: 0x30050d,
      emissive: 0x6e0918,
      emissiveIntensity: 0.65,
      roughness: 0.38,
      metalness: 0.6,
      side: THREE.DoubleSide
    });

    const matGothicStonePillar = new THREE.MeshStandardMaterial({
      color: 0x140e1a,
      roughness: 0.74,
      metalness: 0.38
    });

    const matRuinedBlock = new THREE.MeshStandardMaterial({
      color: 0x110c16,
      roughness: 0.86,
      metalness: 0.2
    });

    // ==========================================
    // 1. CENTRAL PLAYABLE DUEL DAIS (OPEN CENTER)
    // ==========================================
    // Main Battle Dais Platform (Radius 14.5, Height 1.0)
    const mainDaisGeo = new THREE.CylinderGeometry(14.2, 14.8, 1.0, 64);
    const mainDais = new THREE.Mesh(mainDaisGeo, matObsidianDais);
    mainDais.position.y = -0.5;
    mainDais.receiveShadow = true;
    this.group.add(mainDais);

    // Beveled Upper Dais Edge Ring
    const daisBevelGeo = new THREE.TorusGeometry(14.2, 0.18, 12, 64);
    const daisBevel = new THREE.Mesh(daisBevelGeo, matForgedIron);
    daisBevel.rotation.x = Math.PI / 2;
    daisBevel.position.y = 0.0;
    daisBevel.receiveShadow = true;
    this.group.add(daisBevel);

    // ==========================================
    // 2. INLAID CONCENTRIC BATTLE RINGS & MARKERS
    // ==========================================
    // Outer Duel Boundary Inlay (Muted Silver & Dark Iron)
    const outerDuelRingGeo = new THREE.RingGeometry(11.8, 12.15, 64);
    const outerDuelRing = new THREE.Mesh(outerDuelRingGeo, matSilverTrim);
    outerDuelRing.rotation.x = -Math.PI / 2;
    outerDuelRing.position.y = 0.012;
    outerDuelRing.receiveShadow = true;
    this.group.add(outerDuelRing);

    // Mid Ritual Conduit Ring (Deep Crimson Emissive)
    const midConduitRingGeo = new THREE.RingGeometry(8.2, 8.55, 64);
    const midConduitRing = new THREE.Mesh(midConduitRingGeo, matCrimsonChannel);
    midConduitRing.rotation.x = -Math.PI / 2;
    midConduitRing.position.y = 0.014;
    midConduitRing.receiveShadow = true;
    this.group.add(midConduitRing);

    // Inner Stance Focus Ring (Radius 4.8 - Center left wide open)
    const innerFocusRingGeo = new THREE.RingGeometry(4.6, 4.85, 64);
    const innerFocusRing = new THREE.Mesh(innerFocusRingGeo, matSilverTrim);
    innerFocusRing.rotation.x = -Math.PI / 2;
    innerFocusRing.position.y = 0.016;
    innerFocusRing.receiveShadow = true;
    this.group.add(innerFocusRing);

    // 8 Radial Inlaid Iron Divisor Spokes (from radius 4.85 to 11.8)
    for (let s = 0; s < 8; s++) {
      const angle = (s / 8) * Math.PI * 2;
      const spokeLength = 6.95;
      const spokeGeo = new THREE.PlaneGeometry(0.18, spokeLength);
      const spoke = new THREE.Mesh(spokeGeo, matForgedIron);
      spoke.rotation.x = -Math.PI / 2;
      spoke.rotation.z = -angle;
      const midDist = 4.85 + spokeLength / 2;
      spoke.position.set(
        Math.cos(angle + Math.PI / 2) * midDist,
        0.015,
        Math.sin(angle + Math.PI / 2) * midDist
      );
      spoke.receiveShadow = true;
      this.group.add(spoke);
    }

    // ==========================================
    // 3. TIERED PERIMETER PLATFORMS & SUNKEN ABYSS
    // ==========================================
    // Tier 1 Step Down (Radius 17.5, y = -1.1)
    const tier1Geo = new THREE.CylinderGeometry(17.2, 17.8, 1.2, 64);
    const tier1 = new THREE.Mesh(tier1Geo, matDarkGraniteTier);
    tier1.position.y = -1.1;
    tier1.receiveShadow = true;
    this.group.add(tier1);

    // Tier 2 Outer Rampart (Radius 21.0, y = -1.8)
    const tier2Geo = new THREE.CylinderGeometry(20.5, 21.2, 1.4, 64);
    const tier2 = new THREE.Mesh(tier2Geo, matDarkGraniteTier);
    tier2.position.y = -1.8;
    tier2.receiveShadow = true;
    this.group.add(tier2);

    // Deep Sunken Abyss Rim Base (Radius 28.0, y = -4.0)
    const abyssBaseGeo = new THREE.CylinderGeometry(27.5, 28.5, 3.0, 48);
    const abyssBase = new THREE.Mesh(abyssBaseGeo, matAbyssBasement);
    abyssBase.position.y = -3.5;
    abyssBase.receiveShadow = true;
    this.group.add(abyssBase);

    // ==========================================
    // 4. 8 MONUMENTAL GOTHIC SPIRES & BRAZIERS
    // ==========================================
    const spireCount = 8;
    const spireRadius = 20.8;

    // Shared Spire Geometries
    const plinthGeo = new THREE.CylinderGeometry(1.6, 1.9, 1.6, 8);
    const shaftGeo = new THREE.CylinderGeometry(0.85, 1.15, 12.5, 8);
    const capitalGeo = new THREE.BoxGeometry(2.1, 0.6, 2.1);
    const finialGeo = new THREE.ConeGeometry(0.65, 3.2, 8);
    const ironBandGeo = new THREE.TorusGeometry(1.05, 0.12, 8, 16);
    const brazierBowlGeo = new THREE.CylinderGeometry(0.8, 0.45, 0.7, 8);

    for (let i = 0; i < spireCount; i++) {
      const angle = (i / spireCount) * Math.PI * 2;
      const px = Math.cos(angle) * spireRadius;
      const pz = Math.sin(angle) * spireRadius;

      // Base Stepped Plinth
      const plinth = new THREE.Mesh(plinthGeo, matGothicStonePillar);
      plinth.position.set(px, -0.2, pz);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      this.group.add(plinth);

      // Fluted Vertical Monolith Shaft
      const shaft = new THREE.Mesh(shaftGeo, matGothicStonePillar);
      shaft.position.set(px, 6.2, pz);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      this.group.add(shaft);

      // Forged Iron Reinforcement Rings (Lower & Mid)
      const band1 = new THREE.Mesh(ironBandGeo, matForgedIron);
      band1.rotation.x = Math.PI / 2;
      band1.position.set(px, 3.2, pz);
      band1.castShadow = true;
      this.group.add(band1);

      const band2 = new THREE.Mesh(ironBandGeo, matForgedIron);
      band2.rotation.x = Math.PI / 2;
      band2.position.set(px, 8.5, pz);
      band2.castShadow = true;
      this.group.add(band2);

      // Tiered Gothic Capital Platform
      const capital = new THREE.Mesh(capitalGeo, matForgedIron);
      capital.position.set(px, 12.6, pz);
      capital.castShadow = true;
      this.group.add(capital);

      // Gothic Crowning Spire Finial
      const finial = new THREE.Mesh(finialGeo, matGothicStonePillar);
      finial.position.set(px, 14.5, pz);
      finial.castShadow = true;
      this.group.add(finial);

      // Brazier Hearth Basin (Projecting inward toward the arena)
      const innerDirX = -Math.cos(angle) * 1.35;
      const innerDirZ = -Math.sin(angle) * 1.35;

      const brazier = new THREE.Mesh(brazierBowlGeo, matForgedIron);
      brazier.position.set(px + innerDirX, 9.8, pz + innerDirZ);
      brazier.castShadow = true;
      this.group.add(brazier);

      // Brazier Crimson Hearth Light
      const brazierLight = new THREE.PointLight(0xff1e42, 1.45, 12, 2);
      brazierLight.position.set(px + innerDirX, 10.4, pz + innerDirZ);
      this.group.add(brazierLight);
      this.brazierLights.push(brazierLight);
    }

    // ==========================================
    // 5. PERIMETER GOTHIC BALUSTRADES & RUINS
    // ==========================================
    // Low Curved Balustrade Curbs between Spires (Radius 19.5)
    for (let b = 0; b < spireCount; b++) {
      const midAngle = ((b + 0.5) / spireCount) * Math.PI * 2;
      const bx = Math.cos(midAngle) * 19.4;
      const bz = Math.sin(midAngle) * 19.4;

      const curbGeo = new THREE.BoxGeometry(4.2, 0.75, 0.6);
      const curb = new THREE.Mesh(curbGeo, matGothicStonePillar);
      curb.position.set(bx, -0.7, bz);
      curb.rotation.y = -midAngle + Math.PI / 2;
      curb.castShadow = true;
      curb.receiveShadow = true;
      this.group.add(curb);
    }

    // 4 Fractured Monolithic Ruin Archways / Weathered Slabs
    const ruinAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    for (let r = 0; r < ruinAngles.length; r++) {
      const rAngle = ruinAngles[r];
      const rx = Math.cos(rAngle) * 23.5;
      const rz = Math.sin(rAngle) * 23.5;

      // Fractured Stone Slab
      const slabGeo = new THREE.BoxGeometry(2.4, 7.5 + (r % 2) * 2.0, 1.2);
      const slab = new THREE.Mesh(slabGeo, matRuinedBlock);
      slab.position.set(rx, 2.5 + (r % 2) * 1.0, rz);
      slab.rotation.y = -rAngle + (r % 2 ? 0.25 : -0.3);
      slab.rotation.z = (r % 2 ? 0.08 : -0.06);
      slab.castShadow = true;
      slab.receiveShadow = true;
      this.group.add(slab);

      // Fallen Fragment Slabs around Base
      const fallenGeo = new THREE.BoxGeometry(1.6, 0.8, 1.8);
      const fallen = new THREE.Mesh(fallenGeo, matRuinedBlock);
      fallen.position.set(rx * 0.92, -1.2, rz * 0.92);
      fallen.rotation.set(0.12, rAngle + 0.4, -0.15);
      fallen.castShadow = true;
      fallen.receiveShadow = true;
      this.group.add(fallen);
    }
  }

  update(dt) {
    // Smooth organic breathing pulse on brazier hearth lights
    const time = performance.now() * 0.0025;
    for (let i = 0; i < this.brazierLights.length; i++) {
      const bLight = this.brazierLights[i];
      bLight.intensity = 1.35 + Math.sin(time + i * 1.25) * 0.3;
    }
  }

  dispose() {
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      this.group.clear();
      this.group = null;
    }
  }
}
