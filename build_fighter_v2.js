// Polyfill FileReader for Node.js
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(buf => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
        if (this.onload) this.onload();
      });
    }
  };
}
globalThis.ProgressEvent = class ProgressEvent { constructor(type, dict) { Object.assign(this, dict); } };

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('[Fighter V2 Builder] Transforming base humanoid into Sovereign Dark-Gothic Warrior...');

const baseModelPath = path.resolve('assets/game/base_humanoid.glb');
const buf = fs.readFileSync(baseModelPath);
const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuf, '', (gltf) => {
  const rootScene = gltf.scene;
  const animations = gltf.animations;

  // ==========================================
  // 1. DOPE DARK-FANTASY PBR MATERIALS
  // ==========================================
  const matDarkPlate = new THREE.MeshStandardMaterial({
    name: 'Mat_DarkPlate',
    color: 0x141118,
    roughness: 0.32,
    metalness: 0.88
  });

  const matSilverTrim = new THREE.MeshStandardMaterial({
    name: 'Mat_SilverTrim',
    color: 0x787280,
    roughness: 0.22,
    metalness: 0.92
  });

  const matCrimsonConduit = new THREE.MeshStandardMaterial({
    name: 'Mat_CrimsonConduit',
    color: 0x38050e,
    roughness: 0.28,
    metalness: 0.65,
    emissive: new THREE.Color(0xff1e42),
    emissiveIntensity: 0.85
  });

  const matUnderLeather = new THREE.MeshStandardMaterial({
    name: 'Mat_UnderLeather',
    color: 0x0b090e,
    roughness: 0.78,
    metalness: 0.18
  });

  const matVisor = new THREE.MeshStandardMaterial({
    name: 'Mat_Visor',
    color: 0x050206,
    roughness: 0.10,
    metalness: 0.98,
    emissive: new THREE.Color(0xff2a4a),
    emissiveIntensity: 1.4
  });

  // Re-skin the base continuous body with DOPE obsidian armor & leather materials
  rootScene.traverse((child) => {
    if (child.isSkinnedMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.name.includes('Joints')) {
        child.material = matUnderLeather;
      } else {
        child.material = matDarkPlate;
      }
    }
  });

  // Find skeleton bone nodes
  const bones = {};
  rootScene.traverse((node) => {
    if (node.isBone) {
      bones[node.name] = node;
    }
  });

  console.log(`[Fighter V2 Builder] Located ${Object.keys(bones).length} skeleton bones.`);

  // Helper to attach an armor piece to a specific bone
  function attachArmor(boneName, geometry, material, posOffset = [0, 0, 0], rotOffset = [0, 0, 0], scale = [1, 1, 1]) {
    const bone = bones[boneName];
    if (!bone) {
      console.warn(`[Fighter V2 Builder] Bone not found: ${boneName}`);
      return null;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posOffset[0], posOffset[1], posOffset[2]);
    mesh.rotation.set(rotOffset[0], rotOffset[1], rotOffset[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    bone.add(mesh);
    return mesh;
  }

  // ==========================================
  // 2. SCULPTED GOTHIC HELM & VISOR (mixamorigHead)
  // ==========================================
  const headBone = 'mixamorigHead';

  // Gothic Helmet Skull Cap Dome
  attachArmor(headBone, new THREE.SphereGeometry(0.125, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65), matDarkPlate, [0, 0.08, 0.01]);
  // Helmet Lower Casing
  attachArmor(headBone, new THREE.CylinderGeometry(0.115, 0.125, 0.14, 14), matDarkPlate, [0, 0.04, 0.01]);
  // Gothic Crest Fin (Aerodynamic Top Ridge)
  attachArmor(headBone, new THREE.BoxGeometry(0.03, 0.09, 0.26), matSilverTrim, [0, 0.16, 0.0], [-0.15, 0, 0]);
  // Crest Crimson Conduit Line
  attachArmor(headBone, new THREE.BoxGeometry(0.01, 0.07, 0.22), matCrimsonConduit, [0, 0.165, 0.0], [-0.15, 0, 0]);
  // Cheek Guards (Left & Right)
  attachArmor(headBone, new THREE.BoxGeometry(0.04, 0.12, 0.14), matDarkPlate, [0.095, 0.02, 0.02], [0, 0.22, -0.1]);
  attachArmor(headBone, new THREE.BoxGeometry(0.04, 0.12, 0.14), matDarkPlate, [-0.095, 0.02, 0.02], [0, -0.22, 0.1]);
  // Tapered Gothic Chin / Bevor Guard
  attachArmor(headBone, new THREE.ConeGeometry(0.095, 0.12, 8), matDarkPlate, [0, -0.04, 0.06], [Math.PI - 0.2, 0, 0]);
  // Beveled Visor Brow Ridge
  attachArmor(headBone, new THREE.BoxGeometry(0.17, 0.03, 0.05), matSilverTrim, [0, 0.07, 0.095], [-0.2, 0, 0]);
  // Glowing Crimson Visor Eye Slit
  attachArmor(headBone, new THREE.BoxGeometry(0.15, 0.02, 0.04), matVisor, [0, 0.045, 0.105]);

  // ==========================================
  // 3. GORGET & CHESTPLATE (mixamorigSpine2 / mixamorigSpine1)
  // ==========================================
  const chestBone = 'mixamorigSpine2';
  const spineBone = 'mixamorigSpine1';

  // Gothic Gorget Collar (Neck base)
  attachArmor(chestBone, new THREE.TorusGeometry(0.11, 0.025, 8, 16), matSilverTrim, [0, 0.14, 0.0], [Math.PI / 2, 0, 0]);
  // Anatomical Breastplate Left & Right Pectoral Shells
  attachArmor(chestBone, new THREE.BoxGeometry(0.15, 0.18, 0.07), matDarkPlate, [0.085, 0.04, 0.08], [-0.15, 0.2, -0.05]);
  attachArmor(chestBone, new THREE.BoxGeometry(0.15, 0.18, 0.07), matDarkPlate, [-0.085, 0.04, 0.08], [-0.15, -0.2, 0.05]);
  // Central Tapul Ridge (Center Chest Bevel)
  attachArmor(chestBone, new THREE.BoxGeometry(0.035, 0.20, 0.06), matSilverTrim, [0, 0.03, 0.11], [-0.12, 0, 0]);
  // Inlaid Demonic Heart Conduit Sigil
  attachArmor(chestBone, new THREE.BoxGeometry(0.06, 0.12, 0.02), matCrimsonConduit, [0, 0.03, 0.125]);
  // Dorsal Spine Reinforced Column (Back)
  attachArmor(chestBone, new THREE.BoxGeometry(0.08, 0.28, 0.06), matSilverTrim, [0, 0.0, -0.10]);

  // Abdomen Laminar Plackart (mixamorigSpine1)
  attachArmor(spineBone, new THREE.CylinderGeometry(0.155, 0.165, 0.08, 12), matDarkPlate, [0, 0.04, 0.0]);
  attachArmor(spineBone, new THREE.CylinderGeometry(0.160, 0.170, 0.08, 12), matDarkPlate, [0, -0.03, 0.0]);

  // ==========================================
  // 4. PAULDRONS & SHOULDERS (mixamorigLeftShoulder / mixamorigRightShoulder)
  // ==========================================
  // Left Pauldron (3-Tier Spiked Laminar Armor)
  attachArmor('mixamorigLeftShoulder', new THREE.SphereGeometry(0.115, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matDarkPlate, [0.12, 0.06, 0.0], [0, 0, -0.35]);
  attachArmor('mixamorigLeftShoulder', new THREE.BoxGeometry(0.03, 0.08, 0.18), matSilverTrim, [0.14, 0.11, 0.0], [0, 0, -0.35]);
  attachArmor('mixamorigLeftShoulder', new THREE.CylinderGeometry(0.10, 0.115, 0.07, 10, 1, false, -Math.PI * 0.4, Math.PI * 0.8), matDarkPlate, [0.15, -0.01, 0.0], [0, 0, -0.28]);

  // Right Pauldron (3-Tier Spiked Laminar Armor)
  attachArmor('mixamorigRightShoulder', new THREE.SphereGeometry(0.115, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matDarkPlate, [-0.12, 0.06, 0.0], [0, 0, 0.35]);
  attachArmor('mixamorigRightShoulder', new THREE.BoxGeometry(0.03, 0.08, 0.18), matSilverTrim, [-0.14, 0.11, 0.0], [0, 0, 0.35]);
  attachArmor('mixamorigRightShoulder', new THREE.CylinderGeometry(0.10, 0.115, 0.07, 10, 1, false, Math.PI * 0.6, Math.PI * 0.8), matDarkPlate, [-0.15, -0.01, 0.0], [0, 0, 0.28]);

  // ==========================================
  // 5. GAUNTLETS & FOREARMS (mixamorigLeftForeArm / mixamorigRightForeArm)
  // ==========================================
  // Left Elbow Couter Plate
  attachArmor('mixamorigLeftForeArm', new THREE.ConeGeometry(0.06, 0.08, 6), matSilverTrim, [0, -0.02, -0.05], [-Math.PI / 2, 0, 0]);
  // Left Forearm Vambrace
  attachArmor('mixamorigLeftForeArm', new THREE.CylinderGeometry(0.062, 0.052, 0.18, 10), matDarkPlate, [0, 0.10, 0.0]);
  attachArmor('mixamorigLeftForeArm', new THREE.BoxGeometry(0.025, 0.17, 0.03), matSilverTrim, [0, 0.10, 0.055]);

  // Right Elbow Couter Plate
  attachArmor('mixamorigRightForeArm', new THREE.ConeGeometry(0.06, 0.08, 6), matSilverTrim, [0, -0.02, -0.05], [-Math.PI / 2, 0, 0]);
  // Right Forearm Vambrace
  attachArmor('mixamorigRightForeArm', new THREE.CylinderGeometry(0.062, 0.052, 0.18, 10), matDarkPlate, [0, 0.10, 0.0]);
  attachArmor('mixamorigRightForeArm', new THREE.BoxGeometry(0.025, 0.17, 0.03), matSilverTrim, [0, 0.10, 0.055]);

  // ==========================================
  // 6. BELT, FAULDS & TASSETS (mixamorigHips)
  // ==========================================
  const hipsBone = 'mixamorigHips';

  // Forged Battle Belt
  attachArmor(hipsBone, new THREE.TorusGeometry(0.18, 0.025, 8, 20), matSilverTrim, [0, 0.06, 0.0], [Math.PI / 2, 0, 0]);
  // Center Belt Buckle with Crimson Conduit Core
  attachArmor(hipsBone, new THREE.BoxGeometry(0.07, 0.06, 0.03), matSilverTrim, [0, 0.06, 0.185]);
  attachArmor(hipsBone, new THREE.BoxGeometry(0.035, 0.035, 0.015), matCrimsonConduit, [0, 0.06, 0.20]);

  // 4 Articulated Hanging Tassets
  // Front-Left Tasset
  attachArmor(hipsBone, new THREE.BoxGeometry(0.10, 0.20, 0.03), matDarkPlate, [0.09, -0.06, 0.13], [0.2, -0.15, -0.1]);
  attachArmor(hipsBone, new THREE.BoxGeometry(0.105, 0.025, 0.035), matSilverTrim, [0.09, -0.15, 0.15], [0.2, -0.15, -0.1]);
  // Front-Right Tasset
  attachArmor(hipsBone, new THREE.BoxGeometry(0.10, 0.20, 0.03), matDarkPlate, [-0.09, -0.06, 0.13], [0.2, 0.15, 0.1]);
  attachArmor(hipsBone, new THREE.BoxGeometry(0.105, 0.025, 0.035), matSilverTrim, [-0.09, -0.15, 0.15], [0.2, 0.15, 0.1]);
  // Side-Left Tasset
  attachArmor(hipsBone, new THREE.BoxGeometry(0.03, 0.22, 0.14), matDarkPlate, [0.18, -0.06, 0.0], [0, 0, -0.2]);
  // Side-Right Tasset
  attachArmor(hipsBone, new THREE.BoxGeometry(0.03, 0.22, 0.14), matDarkPlate, [-0.18, -0.06, 0.0], [0, 0, 0.2]);

  // ==========================================
  // 7. POLEYNS, GREAVES & GROUNDED SABATONS (mixamorigLeftLeg / mixamorigRightLeg)
  // ==========================================
  // Left Knee Poleyn (Knee Cap)
  attachArmor('mixamorigLeftLeg', new THREE.BoxGeometry(0.10, 0.10, 0.08), matSilverTrim, [0, 0.02, 0.07], [0.2, 0, 0]);
  attachArmor('mixamorigLeftLeg', new THREE.ConeGeometry(0.04, 0.06, 6), matCrimsonConduit, [0, 0.02, 0.12], [Math.PI / 2, 0, 0]);
  // Left Shin Greave Blade
  attachArmor('mixamorigLeftLeg', new THREE.BoxGeometry(0.03, 0.30, 0.04), matSilverTrim, [0, -0.16, 0.07]);

  // Right Knee Poleyn
  attachArmor('mixamorigRightLeg', new THREE.BoxGeometry(0.10, 0.10, 0.08), matSilverTrim, [0, 0.02, 0.07], [0.2, 0, 0]);
  attachArmor('mixamorigRightLeg', new THREE.ConeGeometry(0.04, 0.06, 6), matCrimsonConduit, [0, 0.02, 0.12], [Math.PI / 2, 0, 0]);
  // Right Shin Greave Blade
  attachArmor('mixamorigRightLeg', new THREE.BoxGeometry(0.03, 0.30, 0.04), matSilverTrim, [0, -0.16, 0.07]);

  // Left Sabaton Toe Cap
  attachArmor('mixamorigLeftFoot', new THREE.ConeGeometry(0.055, 0.08, 6), matSilverTrim, [0, -0.04, 0.14], [Math.PI / 2, 0, 0]);
  // Right Sabaton Toe Cap
  attachArmor('mixamorigRightFoot', new THREE.ConeGeometry(0.055, 0.08, 6), matSilverTrim, [0, -0.04, 0.14], [Math.PI / 2, 0, 0]);

  // ==========================================
  // 8. IDLE_COMBAT ANIMATION RETENTION
  // ==========================================
  const idleAnim = animations.find(a => a.name === 'idle') || animations[0];
  const idleCombatClip = idleAnim.clone();
  idleCombatClip.name = 'Idle_Combat';

  const exportAnims = [idleCombatClip];

  // ==========================================
  // 9. EXPORT TO fighter_v2.glb
  // ==========================================
  const outputPath = path.resolve('assets/game/fighter_v2.glb');
  console.log(`[Fighter V2 Builder] Exporting to ${outputPath}...`);

  const exporter = new GLTFExporter();
  exporter.parse(
    rootScene,
    (gltfBuffer) => {
      if (gltfBuffer instanceof ArrayBuffer) {
        const buffer = Buffer.from(gltfBuffer);
        fs.writeFileSync(outputPath, buffer);
        console.log(`[SUCCESS] fighter_v2.glb generated successfully! File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB (${buffer.length} bytes)`);
      } else {
        console.error('[Error] Exporter did not return ArrayBuffer:', gltfBuffer);
      }
    },
    (err) => {
      console.error('[Export Error]', err);
    },
    {
      binary: true,
      animations: exportAnims,
      embedImages: true
    }
  );
});
