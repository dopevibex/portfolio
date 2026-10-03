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

import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('[Fighter Upgrade] Building High-Fidelity Original Dark-Gothic 3D Fighter...');

// ==========================================
// 1. SKELETON HIERARCHY (COMPATIBLE RIG)
// ==========================================
const bones = [];
const boneMap = {};

function createBone(name, x, y, z, parent = null) {
  const bone = new THREE.Bone();
  bone.name = name;
  bone.position.set(x, y, z);
  if (parent) {
    parent.add(bone);
  }
  bones.push(bone);
  boneMap[name] = { bone, index: bones.length - 1 };
  return bone;
}

// 22-Bone Humanoid Standard Rig
const root = createBone('root', 0, 0, 0); // 0
const pelvis = createBone('pelvis', 0, 0.96, 0, root); // 1
const spine = createBone('spine', 0, 0.18, 0, pelvis); // 2 (y ~ 1.14)
const chest = createBone('chest', 0, 0.20, 0, spine); // 3 (y ~ 1.34)
const neck = createBone('neck', 0, 0.18, 0, chest); // 4 (y ~ 1.52)
const head = createBone('head', 0, 0.14, 0, neck); // 5 (y ~ 1.66)

// Left Arm
const shoulderL = createBone('shoulder_l', 0.17, 0.14, 0.0, chest); // 6
const upperarmL = createBone('upperarm_l', 0.18, -0.04, 0.0, shoulderL); // 7 (x ~ 0.35, y ~ 1.44)
const forearmL = createBone('forearm_l', 0.26, 0.0, 0.0, upperarmL); // 8 (x ~ 0.61, y ~ 1.44)
const handL = createBone('hand_l', 0.24, 0.0, 0.0, forearmL); // 9 (x ~ 0.85, y ~ 1.44)

// Right Arm
const shoulderR = createBone('shoulder_r', -0.17, 0.14, 0.0, chest); // 10
const upperarmR = createBone('upperarm_r', -0.18, -0.04, 0.0, shoulderR); // 11 (x ~ -0.35, y ~ 1.44)
const forearmR = createBone('forearm_r', -0.26, 0.0, 0.0, upperarmR); // 12 (x ~ -0.61, y ~ 1.44)
const handR = createBone('hand_r', -0.24, 0.0, 0.0, forearmR); // 13 (x ~ -0.85, y ~ 1.44)

// Left Leg
const thighL = createBone('thigh_l', 0.16, -0.06, 0.0, pelvis); // 14 (x ~ 0.16, y ~ 0.90)
const calfL = createBone('calf_l', 0.0, -0.42, 0.0, thighL); // 15 (x ~ 0.16, y ~ 0.48)
const footL = createBone('foot_l', 0.0, -0.38, 0.0, calfL); // 16 (x ~ 0.16, y ~ 0.10)
const toeL = createBone('toe_l', 0.0, -0.08, 0.14, footL); // 17 (x ~ 0.16, y ~ 0.02, z ~ 0.14)

// Right Leg
const thighR = createBone('thigh_r', -0.16, -0.06, 0.0, pelvis); // 18 (x ~ -0.16, y ~ 0.90)
const calfR = createBone('calf_r', 0.0, -0.42, 0.0, thighR); // 19 (x ~ -0.16, y ~ 0.48)
const footR = createBone('foot_r', 0.0, -0.38, 0.0, calfR); // 20 (x ~ -0.16, y ~ 0.10)
const toeR = createBone('toe_r', 0.0, -0.08, 0.14, footR); // 21 (x ~ -0.16, y ~ 0.02, z ~ 0.14)

root.updateWorldMatrix(true, true);
const skeleton = new THREE.Skeleton(bones);

console.log(`[Fighter Upgrade] Skeleton established with ${bones.length} bones.`);

// ==========================================
// 2. ENHANCED PBR MATERIALS (DOPE AESTHETICS)
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
  roughness: 0.30,
  metalness: 0.65,
  emissive: 0xff1e42,
  emissiveIntensity: 0.70
});

const matUnderLeather = new THREE.MeshStandardMaterial({
  name: 'Mat_UnderLeather',
  color: 0x0b090e,
  roughness: 0.85,
  metalness: 0.08
});

const matVisor = new THREE.MeshStandardMaterial({
  name: 'Mat_Visor',
  color: 0x050206,
  roughness: 0.12,
  metalness: 0.96,
  emissive: 0xff2a4a,
  emissiveIntensity: 1.1
});

const materials = [matDarkPlate, matSilverTrim, matCrimsonConduit, matUnderLeather, matVisor];

// ==========================================
// 3. SKINNED MESH BUILDER INFRASTRUCTURE
// ==========================================
const masterPositions = [];
const masterNormals = [];
const masterUvs = [];
const masterIndices = [];
const masterSkinIndices = [];
const masterSkinWeights = [];
const masterGroups = [];

let vertexOffset = 0;

function addRiggedPart(geometry, transformMatrix, boneWeights, materialIndex = 0) {
  const geom = geometry.clone();
  geom.applyMatrix4(transformMatrix);
  geom.computeVertexNormals();

  const posAttr = geom.attributes.position;
  const normAttr = geom.attributes.normal;
  const uvAttr = geom.attributes.uv || { getX: () => 0, getY: () => 0, count: posAttr.count };

  const startIdx = masterIndices.length;
  const partVertCount = posAttr.count;

  const b0 = boneMap[boneWeights[0].name]?.index ?? 0;
  const w0 = boneWeights[0].weight;
  const b1 = boneWeights[1] ? (boneMap[boneWeights[1].name]?.index ?? 0) : 0;
  const w1 = boneWeights[1] ? boneWeights[1].weight : 0.0;
  const b2 = boneWeights[2] ? (boneMap[boneWeights[2].name]?.index ?? 0) : 0;
  const w2 = boneWeights[2] ? boneWeights[2].weight : 0.0;
  const b3 = boneWeights[3] ? (boneMap[boneWeights[3].name]?.index ?? 0) : 0;
  const w3 = boneWeights[3] ? boneWeights[3].weight : 0.0;

  const totalWeight = w0 + w1 + w2 + w3 || 1.0;
  const nw0 = w0 / totalWeight;
  const nw1 = w1 / totalWeight;
  const nw2 = w2 / totalWeight;
  const nw3 = w3 / totalWeight;

  for (let i = 0; i < partVertCount; i++) {
    masterPositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    masterNormals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
    masterUvs.push(uvAttr.getX(i), uvAttr.getY(i));

    masterSkinIndices.push(b0, b1, b2, b3);
    masterSkinWeights.push(nw0, nw1, nw2, nw3);
  }

  if (geom.index) {
    const idx = geom.index;
    for (let i = 0; i < idx.count; i++) {
      masterIndices.push(vertexOffset + idx.getX(i));
    }
  } else {
    for (let i = 0; i < partVertCount; i++) {
      masterIndices.push(vertexOffset + i);
    }
  }

  const count = masterIndices.length - startIdx;
  masterGroups.push({ start: startIdx, count, materialIndex });
  vertexOffset += partVertCount;
}

function mat(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3(x, y, z);
  const rot = new THREE.Euler(rx, ry, rz);
  const scl = new THREE.Vector3(sx, sy, sz);
  m.compose(pos, new THREE.Quaternion().setFromEuler(rot), scl);
  return m;
}

// ==========================================
// 4. SCULPTED HIGH-FIDELITY ARMOR GEOMETRY
// ==========================================

// -------------------------------------------------------------
// A. GOTHIC HELM & VISOR (Bone: head, y ~ 1.66 to 1.90)
// -------------------------------------------------------------
// 1. Skull Dome (Curved Bascinet Dome)
addRiggedPart(
  new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
  mat(0, 1.76, -0.01),
  [{ name: 'head', weight: 1.0 }],
  0 // Mat_DarkPlate
);
// 2. Helmet Lower Ring Casing
addRiggedPart(
  new THREE.CylinderGeometry(0.125, 0.135, 0.16, 14),
  mat(0, 1.70, -0.005),
  [{ name: 'head', weight: 1.0 }],
  0
);
// 3. Razor Gothic Crest Fin (Aerodynamic Top Ridge)
addRiggedPart(
  new THREE.BoxGeometry(0.035, 0.10, 0.28),
  mat(0, 1.86, -0.015, -0.16, 0, 0),
  [{ name: 'head', weight: 1.0 }],
  1 // Mat_SilverTrim
);
// 4. Crest Crimson Conduit Line
addRiggedPart(
  new THREE.BoxGeometry(0.012, 0.08, 0.24),
  mat(0, 1.865, -0.015, -0.16, 0, 0),
  [{ name: 'head', weight: 1.0 }],
  2 // Mat_CrimsonConduit
);
// 5. Fluted Cheek Guards (Left & Right)
addRiggedPart(
  new THREE.BoxGeometry(0.05, 0.14, 0.16),
  mat(0.105, 1.67, 0.02, 0, 0.25, -0.12),
  [{ name: 'head', weight: 1.0 }],
  0
);
addRiggedPart(
  new THREE.BoxGeometry(0.05, 0.14, 0.16),
  mat(-0.105, 1.67, 0.02, 0, -0.25, 0.12),
  [{ name: 'head', weight: 1.0 }],
  0
);
// 6. Tapered Gothic Chin / Bevor Guard
addRiggedPart(
  new THREE.ConeGeometry(0.105, 0.13, 8),
  mat(0, 1.62, 0.06, Math.PI - 0.18, 0, 0),
  [{ name: 'head', weight: 1.0 }],
  0
);
// 7. Beveled Visor Brow Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.19, 0.035, 0.06),
  mat(0, 1.75, 0.10, -0.20, 0, 0),
  [{ name: 'head', weight: 1.0 }],
  1 // Mat_SilverTrim
);
// 8. Narrow Glowing Crimson Visor Slit
addRiggedPart(
  new THREE.BoxGeometry(0.17, 0.024, 0.05),
  mat(0, 1.725, 0.115),
  [{ name: 'head', weight: 1.0 }],
  4 // Mat_Visor
);
// 9. Rear Neck Flanged Bevor (Laminar Overhang)
addRiggedPart(
  new THREE.CylinderGeometry(0.135, 0.17, 0.14, 10, 1, false, Math.PI * 0.4, Math.PI * 1.2),
  mat(0, 1.64, -0.03, -0.15, 0, 0),
  [{ name: 'head', weight: 0.7 }, { name: 'neck', weight: 0.3 }],
  0
);

// -------------------------------------------------------------
// B. GORGET & NECK COLLAR (Bones: neck, chest, y ~ 1.48 to 1.62)
// -------------------------------------------------------------
// Padded Quilted Doublet Collar
addRiggedPart(
  new THREE.CylinderGeometry(0.095, 0.12, 0.12, 10),
  mat(0, 1.54, 0.0),
  [{ name: 'neck', weight: 0.7 }, { name: 'chest', weight: 0.3 }],
  3 // Mat_UnderLeather
);
// Articulated Gothic Steel Gorget Plates
addRiggedPart(
  new THREE.TorusGeometry(0.125, 0.025, 8, 16),
  mat(0, 1.52, 0.005, Math.PI / 2 + 0.1, 0, 0),
  [{ name: 'chest', weight: 0.8 }, { name: 'neck', weight: 0.2 }],
  1 // Mat_SilverTrim
);
addRiggedPart(
  new THREE.CylinderGeometry(0.13, 0.17, 0.08, 12, 1, false, -Math.PI * 0.4, Math.PI * 0.8),
  mat(0, 1.48, 0.04, 0.25, 0, 0),
  [{ name: 'chest', weight: 0.9 }, { name: 'neck', weight: 0.1 }],
  0
);

// -------------------------------------------------------------
// C. CUIRASS & BREASTPLATE (Bones: chest, spine, y ~ 1.20 to 1.50)
// -------------------------------------------------------------
// Main Contoured Torso Core
addRiggedPart(
  new THREE.CylinderGeometry(0.19, 0.17, 0.28, 14),
  mat(0, 1.36, 0.0),
  [{ name: 'chest', weight: 0.85 }, { name: 'spine', weight: 0.15 }],
  3 // Mat_UnderLeather
);
// Anatomical Pectoral Shell (Left & Right Fluted Chest Plates)
addRiggedPart(
  new THREE.BoxGeometry(0.17, 0.22, 0.08),
  mat(0.10, 1.40, 0.09, -0.15, 0.20, -0.05),
  [{ name: 'chest', weight: 0.9 }, { name: 'spine', weight: 0.1 }],
  0 // Mat_DarkPlate
);
addRiggedPart(
  new THREE.BoxGeometry(0.17, 0.22, 0.08),
  mat(-0.10, 1.40, 0.09, -0.15, -0.20, 0.05),
  [{ name: 'chest', weight: 0.9 }, { name: 'spine', weight: 0.1 }],
  0
);
// Prominent Central Plackart Ridge (Tapul Peak)
addRiggedPart(
  new THREE.BoxGeometry(0.04, 0.24, 0.07),
  mat(0, 1.39, 0.13, -0.12, 0, 0),
  [{ name: 'chest', weight: 0.95 }, { name: 'spine', weight: 0.05 }],
  1 // Mat_SilverTrim
);
// Inlaid Demonic Heart Conduit Crest
addRiggedPart(
  new THREE.BoxGeometry(0.07, 0.14, 0.025),
  mat(0, 1.38, 0.145),
  [{ name: 'chest', weight: 1.0 }],
  2 // Mat_CrimsonConduit
);
// Gothic Fluted Shoulder Clavicle Borders
addRiggedPart(
  new THREE.BoxGeometry(0.40, 0.035, 0.22),
  mat(0, 1.465, 0.01),
  [{ name: 'chest', weight: 0.95 }, { name: 'spine', weight: 0.05 }],
  1 // Mat_SilverTrim
);
// Dorsal Vertebral Spine Casing (Back)
addRiggedPart(
  new THREE.BoxGeometry(0.09, 0.34, 0.07),
  mat(0, 1.34, -0.12),
  [{ name: 'chest', weight: 0.6 }, { name: 'spine', weight: 0.4 }],
  1
);
// Articulated Rib Guards (Back Flanges)
addRiggedPart(
  new THREE.BoxGeometry(0.36, 0.03, 0.12),
  mat(0, 1.38, -0.08),
  [{ name: 'chest', weight: 0.8 }, { name: 'spine', weight: 0.2 }],
  0
);
addRiggedPart(
  new THREE.BoxGeometry(0.34, 0.03, 0.12),
  mat(0, 1.32, -0.08),
  [{ name: 'chest', weight: 0.5 }, { name: 'spine', weight: 0.5 }],
  0
);

// -------------------------------------------------------------
// D. ABDOMEN, BELT & TASSETS (Bones: spine, pelvis, y ~ 0.88 to 1.22)
// -------------------------------------------------------------
// 3-Tier Overlapping Abdomen Laminar Plates
addRiggedPart(
  new THREE.CylinderGeometry(0.165, 0.175, 0.07, 12),
  mat(0, 1.22, 0.01),
  [{ name: 'spine', weight: 0.8 }, { name: 'pelvis', weight: 0.2 }],
  0
);
addRiggedPart(
  new THREE.CylinderGeometry(0.170, 0.180, 0.07, 12),
  mat(0, 1.16, 0.015),
  [{ name: 'spine', weight: 0.5 }, { name: 'pelvis', weight: 0.5 }],
  0
);
addRiggedPart(
  new THREE.CylinderGeometry(0.175, 0.185, 0.07, 12),
  mat(0, 1.10, 0.02),
  [{ name: 'spine', weight: 0.2 }, { name: 'pelvis', weight: 0.8 }],
  0
);

// Heavy Forged Steel Battle Belt
addRiggedPart(
  new THREE.TorusGeometry(0.19, 0.03, 8, 20),
  mat(0, 1.05, 0.0, Math.PI / 2, 0, 0),
  [{ name: 'pelvis', weight: 0.9 }, { name: 'spine', weight: 0.1 }],
  1 // Mat_SilverTrim
);
// Belt Center Buckle
addRiggedPart(
  new THREE.BoxGeometry(0.08, 0.07, 0.04),
  mat(0, 1.05, 0.195),
  [{ name: 'pelvis', weight: 0.95 }, { name: 'spine', weight: 0.05 }],
  1
);
// Buckle Crimson Conduit Gem
addRiggedPart(
  new THREE.BoxGeometry(0.04, 0.04, 0.015),
  mat(0, 1.05, 0.215),
  [{ name: 'pelvis', weight: 0.95 }, { name: 'spine', weight: 0.05 }],
  2 // Mat_CrimsonConduit
);

// Flared Hip Faulds (Armored Skirt Base)
addRiggedPart(
  new THREE.CylinderGeometry(0.185, 0.21, 0.16, 12),
  mat(0, 0.96, 0.0),
  [{ name: 'pelvis', weight: 0.95 }, { name: 'spine', weight: 0.05 }],
  0
);

// 4 Hanging Articulated Tassets (Front-Left, Front-Right, Side-Left, Side-Right)
// Front-Left Tasset
addRiggedPart(
  new THREE.BoxGeometry(0.11, 0.24, 0.04),
  mat(0.10, 0.88, 0.14, 0.22, -0.15, -0.10),
  [{ name: 'pelvis', weight: 0.5 }, { name: 'thigh_l', weight: 0.5 }],
  0
);
addRiggedPart(
  new THREE.BoxGeometry(0.115, 0.03, 0.045),
  mat(0.10, 0.77, 0.16, 0.22, -0.15, -0.10),
  [{ name: 'thigh_l', weight: 0.8 }, { name: 'pelvis', weight: 0.2 }],
  1 // Mat_SilverTrim
);
// Front-Right Tasset
addRiggedPart(
  new THREE.BoxGeometry(0.11, 0.24, 0.04),
  mat(-0.10, 0.88, 0.14, 0.22, 0.15, 0.10),
  [{ name: 'pelvis', weight: 0.5 }, { name: 'thigh_r', weight: 0.5 }],
  0
);
addRiggedPart(
  new THREE.BoxGeometry(0.115, 0.03, 0.045),
  mat(-0.10, 0.77, 0.16, 0.22, 0.15, 0.10),
  [{ name: 'thigh_r', weight: 0.8 }, { name: 'pelvis', weight: 0.2 }],
  1
);
// Side-Left Tasset
addRiggedPart(
  new THREE.BoxGeometry(0.04, 0.26, 0.16),
  mat(0.20, 0.88, 0.0, 0, 0, -0.22),
  [{ name: 'pelvis', weight: 0.4 }, { name: 'thigh_l', weight: 0.6 }],
  0
);
// Side-Right Tasset
addRiggedPart(
  new THREE.BoxGeometry(0.04, 0.26, 0.16),
  mat(-0.20, 0.88, 0.0, 0, 0, 0.22),
  [{ name: 'pelvis', weight: 0.4 }, { name: 'thigh_r', weight: 0.6 }],
  0
);

// -------------------------------------------------------------
// E. PAULDRONS & SHOULDERS (Bones: shoulder_l/r, upperarm_l/r)
// -------------------------------------------------------------
// Left Pauldron (4-Tier Cascading Gothic Laminar Armor)
addRiggedPart(
  new THREE.SphereGeometry(0.125, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
  mat(0.35, 1.50, 0.0, 0, 0, -0.35),
  [{ name: 'shoulder_l', weight: 0.5 }, { name: 'upperarm_l', weight: 0.5 }],
  0
);
// Upward Spiked Ridge Fin
addRiggedPart(
  new THREE.BoxGeometry(0.035, 0.09, 0.20),
  mat(0.38, 1.56, 0.0, 0, 0, -0.35),
  [{ name: 'shoulder_l', weight: 0.5 }, { name: 'upperarm_l', weight: 0.5 }],
  1 // Mat_SilverTrim
);
// Mid & Lower Pauldron Laminar Shells
addRiggedPart(
  new THREE.CylinderGeometry(0.12, 0.135, 0.08, 10, 1, false, -Math.PI * 0.4, Math.PI * 0.8),
  mat(0.38, 1.43, 0.0, 0, 0, -0.30),
  [{ name: 'shoulder_l', weight: 0.3 }, { name: 'upperarm_l', weight: 0.7 }],
  0
);
addRiggedPart(
  new THREE.CylinderGeometry(0.11, 0.125, 0.07, 10, 1, false, -Math.PI * 0.4, Math.PI * 0.8),
  mat(0.41, 1.37, 0.0, 0, 0, -0.25),
  [{ name: 'upperarm_l', weight: 0.85 }, { name: 'shoulder_l', weight: 0.15 }],
  0
);

// Right Pauldron (4-Tier Cascading Gothic Laminar Armor)
addRiggedPart(
  new THREE.SphereGeometry(0.125, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
  mat(-0.35, 1.50, 0.0, 0, 0, 0.35),
  [{ name: 'shoulder_r', weight: 0.5 }, { name: 'upperarm_r', weight: 0.5 }],
  0
);
addRiggedPart(
  new THREE.BoxGeometry(0.035, 0.09, 0.20),
  mat(-0.38, 1.56, 0.0, 0, 0, 0.35),
  [{ name: 'shoulder_r', weight: 0.5 }, { name: 'upperarm_r', weight: 0.5 }],
  1
);
addRiggedPart(
  new THREE.CylinderGeometry(0.12, 0.135, 0.08, 10, 1, false, Math.PI * 0.6, Math.PI * 0.8),
  mat(-0.38, 1.43, 0.0, 0, 0, 0.30),
  [{ name: 'shoulder_r', weight: 0.3 }, { name: 'upperarm_r', weight: 0.7 }],
  0
);
addRiggedPart(
  new THREE.CylinderGeometry(0.11, 0.125, 0.07, 10, 1, false, Math.PI * 0.6, Math.PI * 0.8),
  mat(-0.41, 1.37, 0.0, 0, 0, 0.25),
  [{ name: 'upperarm_r', weight: 0.85 }, { name: 'shoulder_r', weight: 0.15 }],
  0
);

// -------------------------------------------------------------
// F. ARMS, ELBOWS & GAUNTLETS (Bones: upperarm, forearm, hand)
// -------------------------------------------------------------
// Left Upperarm Rerebrace Armor
addRiggedPart(
  new THREE.CylinderGeometry(0.072, 0.060, 0.24, 10),
  mat(0.48, 1.42, 0.0, 0, 0, Math.PI / 2),
  [{ name: 'upperarm_l', weight: 0.9 }, { name: 'forearm_l', weight: 0.1 }],
  0
);
// Left Elbow Couter Plate (Pointed Diamond Guard)
addRiggedPart(
  new THREE.ConeGeometry(0.07, 0.09, 6),
  mat(0.61, 1.42, -0.05, -Math.PI / 2, 0, 0),
  [{ name: 'forearm_l', weight: 0.7 }, { name: 'upperarm_l', weight: 0.3 }],
  1 // Mat_SilverTrim
);
// Left Vambrace (Contoured Forearm)
addRiggedPart(
  new THREE.CylinderGeometry(0.068, 0.055, 0.22, 10),
  mat(0.73, 1.42, 0.0, 0, 0, Math.PI / 2),
  [{ name: 'forearm_l', weight: 0.9 }, { name: 'hand_l', weight: 0.1 }],
  0
);
// Left Vambrace Outer Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.20, 0.025, 0.03),
  mat(0.73, 1.42, 0.065),
  [{ name: 'forearm_l', weight: 0.9 }, { name: 'hand_l', weight: 0.1 }],
  1
);
// Left Plated Hand Gauntlet
addRiggedPart(
  new THREE.BoxGeometry(0.095, 0.07, 0.095),
  mat(0.88, 1.42, 0.0),
  [{ name: 'hand_l', weight: 1.0 }],
  0
);
// Left Knuckle Spiked Crest
addRiggedPart(
  new THREE.BoxGeometry(0.045, 0.075, 0.10),
  mat(0.92, 1.42, 0.0),
  [{ name: 'hand_l', weight: 1.0 }],
  1 // Mat_SilverTrim
);

// Right Upperarm Rerebrace Armor
addRiggedPart(
  new THREE.CylinderGeometry(0.072, 0.060, 0.24, 10),
  mat(-0.48, 1.42, 0.0, 0, 0, -Math.PI / 2),
  [{ name: 'upperarm_r', weight: 0.9 }, { name: 'forearm_r', weight: 0.1 }],
  0
);
// Right Elbow Couter Plate
addRiggedPart(
  new THREE.ConeGeometry(0.07, 0.09, 6),
  mat(-0.61, 1.42, -0.05, -Math.PI / 2, 0, 0),
  [{ name: 'forearm_r', weight: 0.7 }, { name: 'upperarm_r', weight: 0.3 }],
  1
);
// Right Vambrace
addRiggedPart(
  new THREE.CylinderGeometry(0.068, 0.055, 0.22, 10),
  mat(-0.73, 1.42, 0.0, 0, 0, -Math.PI / 2),
  [{ name: 'forearm_r', weight: 0.9 }, { name: 'hand_r', weight: 0.1 }],
  0
);
// Right Vambrace Outer Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.20, 0.025, 0.03),
  mat(-0.73, 1.42, 0.065),
  [{ name: 'forearm_r', weight: 0.9 }, { name: 'hand_r', weight: 0.1 }],
  1
);
// Right Plated Hand Gauntlet
addRiggedPart(
  new THREE.BoxGeometry(0.095, 0.07, 0.095),
  mat(-0.88, 1.42, 0.0),
  [{ name: 'hand_r', weight: 1.0 }],
  0
);
// Right Knuckle Spiked Crest
addRiggedPart(
  new THREE.BoxGeometry(0.045, 0.075, 0.10),
  mat(-0.92, 1.42, 0.0),
  [{ name: 'hand_r', weight: 1.0 }],
  1
);

// -------------------------------------------------------------
// G. THIGHS, KNEES & POLEYNS (Bones: thigh, calf, y ~ 0.44 to 0.90)
// -------------------------------------------------------------
// Left Thigh Cuisse (Sculpted Armor)
addRiggedPart(
  new THREE.CylinderGeometry(0.105, 0.082, 0.38, 12),
  mat(0.16, 0.71, 0.0),
  [{ name: 'thigh_l', weight: 0.9 }, { name: 'pelvis', weight: 0.1 }],
  0
);
// Left Thigh Outer Silver Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.03, 0.36, 0.04),
  mat(0.25, 0.71, 0.0),
  [{ name: 'thigh_l', weight: 0.9 }, { name: 'pelvis', weight: 0.1 }],
  1
);
// Left Gothic Knee Poleyn (Articulated Spiked Guard)
addRiggedPart(
  new THREE.BoxGeometry(0.12, 0.12, 0.09),
  mat(0.16, 0.49, 0.065, 0.22, 0, 0),
  [{ name: 'calf_l', weight: 0.6 }, { name: 'thigh_l', weight: 0.4 }],
  1 // Mat_SilverTrim
);
// Knee Central Crimson Gem
addRiggedPart(
  new THREE.ConeGeometry(0.045, 0.07, 6),
  mat(0.16, 0.49, 0.12, Math.PI / 2, 0, 0),
  [{ name: 'calf_l', weight: 0.6 }, { name: 'thigh_l', weight: 0.4 }],
  2 // Mat_CrimsonConduit
);

// Right Thigh Cuisse
addRiggedPart(
  new THREE.CylinderGeometry(0.105, 0.082, 0.38, 12),
  mat(-0.16, 0.71, 0.0),
  [{ name: 'thigh_r', weight: 0.9 }, { name: 'pelvis', weight: 0.1 }],
  0
);
// Right Thigh Outer Silver Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.03, 0.36, 0.04),
  mat(-0.25, 0.71, 0.0),
  [{ name: 'thigh_r', weight: 0.9 }, { name: 'pelvis', weight: 0.1 }],
  1
);
// Right Gothic Knee Poleyn
addRiggedPart(
  new THREE.BoxGeometry(0.12, 0.12, 0.09),
  mat(-0.16, 0.49, 0.065, 0.22, 0, 0),
  [{ name: 'calf_r', weight: 0.6 }, { name: 'thigh_r', weight: 0.4 }],
  1
);
addRiggedPart(
  new THREE.ConeGeometry(0.045, 0.07, 6),
  mat(-0.16, 0.49, 0.12, Math.PI / 2, 0, 0),
  [{ name: 'calf_r', weight: 0.6 }, { name: 'thigh_r', weight: 0.4 }],
  2
);

// -------------------------------------------------------------
// H. CALVES, GREAVES & GROUNDED SABATONS (Bones: calf, foot, toe)
// -------------------------------------------------------------
// Left Shin Greave (Anatomical Fluted Shin Armor)
addRiggedPart(
  new THREE.CylinderGeometry(0.082, 0.065, 0.36, 12),
  mat(0.16, 0.28, 0.0),
  [{ name: 'calf_l', weight: 0.9 }, { name: 'foot_l', weight: 0.1 }],
  0
);
// Left Shin Prominent Front Blade Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.035, 0.35, 0.05),
  mat(0.16, 0.28, 0.075),
  [{ name: 'calf_l', weight: 0.9 }, { name: 'foot_l', weight: 0.1 }],
  1 // Mat_SilverTrim
);
// Left Calf Posterior Flange (Back)
addRiggedPart(
  new THREE.CylinderGeometry(0.07, 0.055, 0.22, 8, 1, false, Math.PI * 0.5, Math.PI),
  mat(0.16, 0.32, -0.04),
  [{ name: 'calf_l', weight: 0.95 }, { name: 'thigh_l', weight: 0.05 }],
  0
);
// Left Gothic Sabaton Boot (Arch & Heel grounded on Y = 0.0)
addRiggedPart(
  new THREE.BoxGeometry(0.12, 0.10, 0.23),
  mat(0.16, 0.05, 0.035),
  [{ name: 'foot_l', weight: 0.8 }, { name: 'toe_l', weight: 0.2 }],
  0
);
// Left Sabaton Gothic Spiked Toe Cap
addRiggedPart(
  new THREE.ConeGeometry(0.065, 0.09, 6),
  mat(0.16, 0.042, 0.175, Math.PI / 2, 0, 0),
  [{ name: 'toe_l', weight: 1.0 }],
  1 // Mat_SilverTrim
);

// Right Shin Greave
addRiggedPart(
  new THREE.CylinderGeometry(0.082, 0.065, 0.36, 12),
  mat(-0.16, 0.28, 0.0),
  [{ name: 'calf_r', weight: 0.9 }, { name: 'foot_r', weight: 0.1 }],
  0
);
// Right Shin Front Blade Ridge
addRiggedPart(
  new THREE.BoxGeometry(0.035, 0.35, 0.05),
  mat(-0.16, 0.28, 0.075),
  [{ name: 'calf_r', weight: 0.9 }, { name: 'foot_r', weight: 0.1 }],
  1
);
// Right Calf Posterior Flange
addRiggedPart(
  new THREE.CylinderGeometry(0.07, 0.055, 0.22, 8, 1, false, Math.PI * 0.5, Math.PI),
  mat(-0.16, 0.32, -0.04),
  [{ name: 'calf_r', weight: 0.95 }, { name: 'thigh_r', weight: 0.05 }],
  0
);
// Right Gothic Sabaton Boot
addRiggedPart(
  new THREE.BoxGeometry(0.12, 0.10, 0.23),
  mat(-0.16, 0.05, 0.035),
  [{ name: 'foot_r', weight: 0.8 }, { name: 'toe_r', weight: 0.2 }],
  0
);
// Right Sabaton Spiked Toe Cap
addRiggedPart(
  new THREE.ConeGeometry(0.065, 0.09, 6),
  mat(-0.16, 0.042, 0.175, Math.PI / 2, 0, 0),
  [{ name: 'toe_r', weight: 1.0 }],
  1
);

// ==========================================
// 5. ASSEMBLE MASTER BUFFER GEOMETRY & SKINNED MESH
// ==========================================
const masterGeometry = new THREE.BufferGeometry();
masterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(masterPositions, 3));
masterGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(masterNormals, 3));
masterGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(masterUvs, 2));
masterGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(masterSkinIndices, 4));
masterGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(masterSkinWeights, 4));
masterGeometry.setIndex(masterIndices);

for (const grp of masterGroups) {
  masterGeometry.addGroup(grp.start, grp.count, grp.materialIndex);
}

masterGeometry.computeBoundingBox();
masterGeometry.computeBoundingSphere();

console.log(`[Fighter Upgrade] Master geometry: ${masterPositions.length / 3} vertices, ${masterIndices.length / 3} triangles, ${masterGroups.length} sculpted armor sub-plates.`);

const skinnedMesh = new THREE.SkinnedMesh(masterGeometry, materials);
skinnedMesh.name = 'Fighter_Body';
skinnedMesh.castShadow = true;
skinnedMesh.receiveShadow = true;

skinnedMesh.add(root);
skinnedMesh.bind(skeleton);
skeleton.calculateInverses();

// ==========================================
// 6. IDLE COMBAT ANIMATION (POISE & RESPIRATION)
// ==========================================
const tracks = [];
const times = [0, 1.2, 2.4]; // 2.4s seamless loop

// 1. Chest Respiration (Vertical & Depth expansion)
tracks.push(new THREE.VectorKeyframeTrack(
  'chest.position',
  times,
  [
    0, 0.20, 0,
    0, 0.208, 0.004,
    0, 0.20, 0
  ]
));
tracks.push(new THREE.QuaternionKeyframeTrack(
  'chest.quaternion',
  times,
  [
    0, 0, 0, 1,
    Math.sin(-0.025), 0, 0, Math.cos(-0.025),
    0, 0, 0, 1
  ]
));

// 2. Spine subtle stance sway
tracks.push(new THREE.QuaternionKeyframeTrack(
  'spine.quaternion',
  times,
  [
    0, 0, 0, 1,
    Math.sin(0.018), 0, 0, Math.cos(0.018),
    0, 0, 0, 1
  ]
));

// 3. Pelvis subtle center-of-mass weight shift
tracks.push(new THREE.VectorKeyframeTrack(
  'pelvis.position',
  times,
  [
    0, 0.96, 0,
    0, 0.956, 0,
    0, 0.96, 0
  ]
));

// 4. Arms ready poise breathing
tracks.push(new THREE.QuaternionKeyframeTrack(
  'upperarm_l.quaternion',
  times,
  [
    0, 0, 0, 1,
    0, 0, Math.sin(0.03), Math.cos(0.03),
    0, 0, 0, 1
  ]
));
tracks.push(new THREE.QuaternionKeyframeTrack(
  'upperarm_r.quaternion',
  times,
  [
    0, 0, 0, 1,
    0, 0, Math.sin(-0.03), Math.cos(-0.03),
    0, 0, 0, 1
  ]
));

const idleClip = new THREE.AnimationClip('Idle_Combat', 2.4, tracks);

// ==========================================
// 7. EXPORT TO GLB CONTAINER
// ==========================================
const scene = new THREE.Scene();
scene.name = 'Fighter_Character_Scene';
scene.add(skinnedMesh);

const outputDir = path.resolve('assets/game');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'fighter.glb');

console.log(`[Fighter Upgrade] Exporting to ${outputPath}...`);

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (gltfBuffer) => {
    if (gltfBuffer instanceof ArrayBuffer) {
      const buffer = Buffer.from(gltfBuffer);
      fs.writeFileSync(outputPath, buffer);
      console.log(`[SUCCESS] High-Fidelity fighter.glb exported successfully! File size: ${(buffer.length / 1024).toFixed(2)} KB (${buffer.length} bytes)`);
    } else {
      console.error('[Error] Exporter did not return ArrayBuffer:', gltfBuffer);
    }
  },
  (err) => {
    console.error('[Export Error]', err);
  },
  {
    binary: true,
    animations: [idleClip],
    embedImages: true
  }
);
