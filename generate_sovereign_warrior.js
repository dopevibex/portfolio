// Polyfills for Node.js
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

import * as THREE from './assets/vendor/three/three.module.js';
import * as BufferGeometryUtils from './assets/vendor/three/BufferGeometryUtils.js';
import { GLTFExporter } from './assets/vendor/three/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';

console.log('[Sovereign Warrior Generator] Initializing procedural dark-fantasy warrior synthesis...');

// ============================================================================
// 1. PBR MATERIALS DEFINITIONS (DOPE Dark-Fantasy Identity)
// ============================================================================
const matObsidianPlate = new THREE.MeshStandardMaterial({
  name: 'Mat_ObsidianPlate',
  color: new THREE.Color(0x131016),
  roughness: 0.28,
  metalness: 0.88
});

const matColdSilver = new THREE.MeshStandardMaterial({
  name: 'Mat_ColdSilver',
  color: new THREE.Color(0x9ca5b4),
  roughness: 0.20,
  metalness: 0.94
});

const matUnderGambeson = new THREE.MeshStandardMaterial({
  name: 'Mat_UnderGambeson',
  color: new THREE.Color(0x0a080d),
  roughness: 0.82,
  metalness: 0.15
});

const matCrimsonVisor = new THREE.MeshStandardMaterial({
  name: 'Mat_CrimsonVisor',
  color: new THREE.Color(0x220005),
  roughness: 0.15,
  metalness: 0.60,
  emissive: new THREE.Color(0xff1438),
  emissiveIntensity: 2.8
});

const matCrimsonTrim = new THREE.MeshStandardMaterial({
  name: 'Mat_CrimsonTrim',
  color: new THREE.Color(0x35040a),
  roughness: 0.35,
  metalness: 0.50,
  emissive: new THREE.Color(0xcc1130),
  emissiveIntensity: 0.9
});

// ============================================================================
// 2. PROCEDURAL HIGH-FIDELITY GEOMETRY BUILDERS
// ============================================================================

/**
 * Creates a smooth surface of revolution with radial modulation and vertical profile.
 */
function createLoftedVolume(layers, radialSteps = 24, zScale = 1.0) {
  // layers: Array of { y, rx, rz, cx, cz }
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const numLayers = layers.length;

  for (let i = 0; i < numLayers; i++) {
    const layer = layers[i];
    const v = i / (numLayers - 1);

    for (let j = 0; j <= radialSteps; j++) {
      const u = j / radialSteps;
      const angle = u * Math.PI * 2;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Fluting modulation for gothic aesthetic
      const flute = 1.0 + 0.03 * Math.cos(angle * 6);

      const x = (layer.cx || 0) + layer.rx * cosA * flute;
      const z = (layer.cz || 0) + layer.rz * sinA * flute * zScale;
      const y = layer.y;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radialSteps + 1;
  for (let i = 0; i < numLayers - 1; i++) {
    for (let j = 0; j < radialSteps; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates an extruded beveled gothic plate along a parametric curve.
 */
function createBeveledGothicPlate(width, height, thickness, bevel, tapulDepth = 0.04) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;

  shape.moveTo(-hw + bevel, -hh);
  shape.lineTo(hw - bevel, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + bevel);
  shape.lineTo(hw * 0.85, hh - bevel);
  shape.quadraticCurveTo(hw * 0.85, hh, hw * 0.85 - bevel, hh);
  shape.lineTo(0, hh + bevel * 0.5); // Gothic peak
  shape.lineTo(-hw * 0.85 + bevel, hh);
  shape.quadraticCurveTo(-hw * 0.85, hh, -hw * 0.85, hh - bevel);
  shape.lineTo(-hw, -hh + bevel);
  shape.quadraticCurveTo(-hw, -hh, -hw + bevel, -hh);

  const extrudeSettings = {
    steps: 2,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 3
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();

  // Apply tapul forward ridge curvature
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const distFromCenter = Math.abs(x) / (width * 0.5 + 0.001);
    const ridgeBend = Math.max(0, 1.0 - distFromCenter) * tapulDepth;

    pos.setZ(i, z + ridgeBend);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates articulated gothic finger with knuckles.
 */
function createDetailedFinger(length, radius, segments = 3) {
  const parts = [];
  const segLength = length / segments;

  for (let i = 0; i < segments; i++) {
    const r1 = radius * (1.0 - i * 0.12);
    const r2 = radius * (0.9 - i * 0.12);
    const phalanxGeo = new THREE.CylinderGeometry(r2, r1, segLength, 8);
    phalanxGeo.translate(0, segLength / 2, 0);

    // Knuckle plate cap
    const knuckleGeo = new THREE.SphereGeometry(r1 * 1.15, 8, 6);
    knuckleGeo.scale(1.0, 0.8, 1.2);
    knuckleGeo.translate(0, 0, r1 * 0.3);

    const merged = BufferGeometryUtils.mergeGeometries([phalanxGeo, knuckleGeo]);
    merged.translate(0, i * segLength, 0);
    parts.push(merged);
  }

  const fingerGeo = BufferGeometryUtils.mergeGeometries(parts);
  return fingerGeo;
}

// ============================================================================
// 3. ANATOMICAL SKELETON DEFINITION
// ============================================================================
// We define a standard, cleanly proportioned humanoid armature (~1.88m height, realistic proportions)

const boneDefs = [
  { name: 'root', pos: [0, 0, 0], parent: null },
  { name: 'mixamorigHips', pos: [0, 0.98, 0], parent: 'root' },
  { name: 'mixamorigSpine', pos: [0, 0.10, -0.01], parent: 'mixamorigHips' },
  { name: 'mixamorigSpine1', pos: [0, 0.12, 0.01], parent: 'mixamorigSpine' },
  { name: 'mixamorigSpine2', pos: [0, 0.15, 0.02], parent: 'mixamorigSpine1' },
  { name: 'mixamorigNeck', pos: [0, 0.15, -0.01], parent: 'mixamorigSpine2' },
  { name: 'mixamorigHead', pos: [0, 0.12, 0.02], parent: 'mixamorigNeck' },

  // Left Arm
  { name: 'mixamorigLeftShoulder', pos: [0.12, 0.12, -0.01], parent: 'mixamorigSpine2' },
  { name: 'mixamorigLeftArm', pos: [0.16, 0.0, -0.01], parent: 'mixamorigLeftShoulder' },
  { name: 'mixamorigLeftForeArm', pos: [0.0, -0.28, 0.01], parent: 'mixamorigLeftArm' },
  { name: 'mixamorigLeftHand', pos: [0.0, -0.26, 0.0], parent: 'mixamorigLeftForeArm' },

  // Right Arm
  { name: 'mixamorigRightShoulder', pos: [-0.12, 0.12, -0.01], parent: 'mixamorigSpine2' },
  { name: 'mixamorigRightArm', pos: [-0.16, 0.0, -0.01], parent: 'mixamorigRightShoulder' },
  { name: 'mixamorigRightForeArm', pos: [0.0, -0.28, 0.01], parent: 'mixamorigRightArm' },
  { name: 'mixamorigRightHand', pos: [0.0, -0.26, 0.0], parent: 'mixamorigRightForeArm' },

  // Left Leg
  { name: 'mixamorigLeftUpLeg', pos: [0.11, -0.06, 0.0], parent: 'mixamorigHips' },
  { name: 'mixamorigLeftLeg', pos: [0.0, -0.42, 0.01], parent: 'mixamorigLeftUpLeg' },
  { name: 'mixamorigLeftFoot', pos: [0.0, -0.42, -0.03], parent: 'mixamorigLeftLeg' },
  { name: 'mixamorigLeftToeBase', pos: [0.0, -0.08, 0.14], parent: 'mixamorigLeftFoot' },

  // Right Leg
  { name: 'mixamorigRightUpLeg', pos: [-0.11, -0.06, 0.0], parent: 'mixamorigHips' },
  { name: 'mixamorigRightLeg', pos: [0.0, -0.42, 0.01], parent: 'mixamorigRightUpLeg' },
  { name: 'mixamorigRightFoot', pos: [0.0, -0.42, -0.03], parent: 'mixamorigRightLeg' },
  { name: 'mixamorigRightToeBase', pos: [0.0, -0.08, 0.14], parent: 'mixamorigRightFoot' }
];

const bones = [];
const boneMap = {};

for (const def of boneDefs) {
  const bone = new THREE.Bone();
  bone.name = def.name;
  bone.position.set(...def.pos);
  bones.push(bone);
  boneMap[def.name] = bone;
}

for (const def of boneDefs) {
  if (def.parent) {
    boneMap[def.parent].add(boneMap[def.name]);
  }
}

const rootNode = boneMap['root'];
const skeleton = new THREE.Skeleton(bones);

// Compute world positions of bones in rest pose
rootNode.updateMatrixWorld(true);
const boneWorldPos = {};
for (const b of bones) {
  const v = new THREE.Vector3();
  b.getWorldPosition(v);
  boneWorldPos[b.name] = v;
}

console.log('[Sovereign Warrior Generator] Skeleton hierarchy assembled. Total bones:', bones.length);

// ============================================================================
// 4. SCULPTING THE GOTHIC WARRIOR ANATOMY & ARMOR
// ============================================================================

const meshPieces = {
  obsidian: [],
  silver: [],
  gambeson: [],
  visor: [],
  crimsonTrim: []
};

function standardizeGeometry(geo) {
  let g = geo.clone();
  if (!g.index) {
    const count = g.attributes.position.count;
    const indices = [];
    for (let i = 0; i < count; i++) indices.push(i);
    g.setIndex(indices);
  }
  if (!g.attributes.normal) {
    g.computeVertexNormals();
  }
  if (!g.attributes.uv) {
    const count = g.attributes.position.count;
    const uvs = new Float32Array(count * 2);
    g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }
  const standardAttrs = ['position', 'normal', 'uv'];
  for (const name in g.attributes) {
    if (!standardAttrs.includes(name)) {
      g.deleteAttribute(name);
    }
  }
  return g;
}

function addPart(materialKey, geometry, worldMatrix) {
  const geo = standardizeGeometry(geometry);
  if (worldMatrix) {
    geo.applyMatrix4(worldMatrix);
  }
  meshPieces[materialKey].push(geo);
}

// ----------------------------------------------------------------------------
// A. GOTHIC SALLET HELM & VISOR (Head)
// ----------------------------------------------------------------------------
const headPos = boneWorldPos['mixamorigHead'];
console.log('Head Pos:', headPos);

// Helmet Skull Cap
const helmLayers = [
  { y: headPos.y - 0.06, rx: 0.105, rz: 0.125, cx: 0, cz: -0.01 },
  { y: headPos.y - 0.02, rx: 0.118, rz: 0.135, cx: 0, cz: -0.01 },
  { y: headPos.y + 0.04, rx: 0.122, rz: 0.142, cx: 0, cz: -0.01 },
  { y: headPos.y + 0.09, rx: 0.115, rz: 0.138, cx: 0, cz: -0.02 },
  { y: headPos.y + 0.13, rx: 0.095, rz: 0.120, cx: 0, cz: -0.02 },
  { y: headPos.y + 0.16, rx: 0.050, rz: 0.080, cx: 0, cz: -0.03 },
  { y: headPos.y + 0.18, rx: 0.010, rz: 0.020, cx: 0, cz: -0.03 }
];
const helmDome = createLoftedVolume(helmLayers, 20);
addPart('obsidian', helmDome);

// Razor Crest Ridge (Top Sagittal Fin)
const crestGeo = new THREE.BoxGeometry(0.022, 0.08, 0.26);
crestGeo.translate(0, headPos.y + 0.15, headPos.z - 0.02);
crestGeo.rotateX(-0.12);
addPart('silver', crestGeo);

const crestGlow = new THREE.BoxGeometry(0.008, 0.06, 0.22);
crestGlow.translate(0, headPos.y + 0.155, headPos.z - 0.02);
crestGlow.rotateX(-0.12);
addPart('crimsonTrim', crestGlow);

// Gothic Sallet Bevor (Chin and Throat Guard)
const bevorLayers = [
  { y: headPos.y - 0.14, rx: 0.085, rz: 0.095, cx: 0, cz: 0.01 },
  { y: headPos.y - 0.08, rx: 0.102, rz: 0.115, cx: 0, cz: 0.03 },
  { y: headPos.y - 0.02, rx: 0.115, rz: 0.128, cx: 0, cz: 0.05 },
  { y: headPos.y + 0.01, rx: 0.118, rz: 0.132, cx: 0, cz: 0.06 }
];
const bevorGeo = createLoftedVolume(bevorLayers, 16);
addPart('obsidian', bevorGeo);

// Gothic Brow Ridge & Slanted Visor Plate
const browPlate = createBeveledGothicPlate(0.20, 0.05, 0.04, 0.01, 0.03);
browPlate.rotateX(-0.25);
browPlate.translate(0, headPos.y + 0.05, headPos.z + 0.11);
addPart('silver', browPlate);

// Deep Crimson Glowing Visor Slit (Recessed inside the brow armor)
const visorSlit = new THREE.BoxGeometry(0.14, 0.018, 0.035);
visorSlit.translate(0, headPos.y + 0.025, headPos.z + 0.112);
addPart('visor', visorSlit);

// Cheek Guard Flanges
const cheekL = createBeveledGothicPlate(0.06, 0.12, 0.02, 0.008, 0.015);
cheekL.rotateY(0.35);
cheekL.rotateZ(-0.15);
cheekL.translate(0.10, headPos.y - 0.02, headPos.z + 0.03);
addPart('obsidian', cheekL);

const cheekR = createBeveledGothicPlate(0.06, 0.12, 0.02, 0.008, 0.015);
cheekR.rotateY(-0.35);
cheekR.rotateZ(0.15);
cheekR.translate(-0.10, headPos.y - 0.02, headPos.z + 0.03);
addPart('obsidian', cheekR);

// ----------------------------------------------------------------------------
// B. GORGET, CUIRASS & SPINE COLUMN (Torso)
// ----------------------------------------------------------------------------
const spine2Pos = boneWorldPos['mixamorigSpine2'];
const spine1Pos = boneWorldPos['mixamorigSpine1'];
const spine0Pos = boneWorldPos['mixamorigSpine'];
const hipsPos = boneWorldPos['mixamorigHips'];

// Gorget (Articulated Neck Collar)
const gorgetLayers = [
  { y: spine2Pos.y + 0.10, rx: 0.082, rz: 0.088, cx: 0, cz: 0.0 },
  { y: spine2Pos.y + 0.04, rx: 0.115, rz: 0.120, cx: 0, cz: 0.0 },
  { y: spine2Pos.y - 0.01, rx: 0.145, rz: 0.140, cx: 0, cz: 0.0 }
];
const gorgetGeo = createLoftedVolume(gorgetLayers, 18);
addPart('silver', gorgetGeo);

// Master Gothic Cuirass (Breastplate & Backplate)
const cuirassLayers = [
  { y: spine2Pos.y + 0.06, rx: 0.185, rz: 0.135, cx: 0, cz: 0.01 },
  { y: spine2Pos.y + 0.00, rx: 0.205, rz: 0.145, cx: 0, cz: 0.015 },
  { y: spine2Pos.y - 0.08, rx: 0.198, rz: 0.140, cx: 0, cz: 0.02 },
  { y: spine1Pos.y + 0.02, rx: 0.178, rz: 0.130, cx: 0, cz: 0.015 },
  { y: spine1Pos.y - 0.06, rx: 0.165, rz: 0.125, cx: 0, cz: 0.01 }
];
const cuirassGeo = createLoftedVolume(cuirassLayers, 24);
addPart('obsidian', cuirassGeo);

// Central Tapul Ridge on Chest
const tapulSpine = createBeveledGothicPlate(0.045, 0.24, 0.03, 0.008, 0.025);
tapulSpine.rotateX(-0.12);
tapulSpine.translate(0, spine2Pos.y - 0.02, spine2Pos.z + 0.135);
addPart('silver', tapulSpine);

// Inlaid Crimson Core Sigil on Chest Center
const coreSigil = new THREE.OctahedronGeometry(0.032, 0);
coreSigil.scale(0.8, 1.4, 0.5);
coreSigil.translate(0, spine2Pos.y - 0.01, spine2Pos.z + 0.142);
addPart('crimsonTrim', coreSigil);

// Articulated Dorsal Spine Column (Reinforced Back Plate)
for (let i = 0; i < 5; i++) {
  const y = spine2Pos.y + 0.04 - i * 0.055;
  const vertebraGeo = createBeveledGothicPlate(0.075, 0.045, 0.025, 0.006, 0.015);
  vertebraGeo.translate(0, y, spine2Pos.z - 0.125 + i * 0.008);
  addPart('silver', vertebraGeo);
}

// Abdominal Plackart Lames (Articulated midriff plates)
for (let i = 0; i < 3; i++) {
  const y = spine0Pos.y + 0.08 - i * 0.05;
  const plackartGeo = createBeveledGothicPlate(0.24 - i * 0.02, 0.045, 0.025, 0.006, 0.02);
  plackartGeo.rotateX(0.08);
  plackartGeo.translate(0, y, 0.115 - i * 0.005);
  addPart('obsidian', plackartGeo);
}

// Under-Armor Gambeson (Waist & Rib flanks)
const gambesonLayers = [
  { y: spine1Pos.y + 0.04, rx: 0.160, rz: 0.120, cx: 0, cz: 0.0 },
  { y: spine0Pos.y + 0.02, rx: 0.155, rz: 0.118, cx: 0, cz: 0.0 },
  { y: hipsPos.y + 0.04,   rx: 0.165, rz: 0.125, cx: 0, cz: 0.0 }
];
const gambesonWaist = createLoftedVolume(gambesonLayers, 18);
addPart('gambeson', gambesonWaist);

// ----------------------------------------------------------------------------
// C. WAR BELT, FAULDS & HANGING TASSETS (Pelvis)
// ----------------------------------------------------------------------------
// Heavy Forged War Belt
const beltGeo = new THREE.TorusGeometry(0.175, 0.022, 10, 24);
beltGeo.rotateX(Math.PI / 2);
beltGeo.translate(0, hipsPos.y + 0.04, 0);
addPart('silver', beltGeo);

// Center Gothic Belt Buckle & Conduit Gem
const buckleGeo = createBeveledGothicPlate(0.08, 0.065, 0.025, 0.006, 0.015);
buckleGeo.translate(0, hipsPos.y + 0.04, 0.185);
addPart('silver', buckleGeo);

const buckleGem = new THREE.BoxGeometry(0.035, 0.035, 0.015);
buckleGem.translate(0, hipsPos.y + 0.04, 0.198);
addPart('crimsonTrim', buckleGem);

// 4 Hanging Articulated Tassets (Gothic Skirt Plating)
function buildTasset(posX, angleY, angleZ) {
  const tassetGroup = [];
  for (let i = 0; i < 3; i++) {
    const lame = createBeveledGothicPlate(0.115 - i * 0.01, 0.075, 0.018, 0.005, 0.02);
    lame.translate(0, -i * 0.055, i * 0.008);
    tassetGroup.push(lame);
  }
  const merged = BufferGeometryUtils.mergeGeometries(tassetGroup);
  merged.rotateZ(angleZ);
  merged.rotateY(angleY);
  merged.rotateX(0.18);
  merged.translate(posX, hipsPos.y - 0.04, 0.12);
  return merged;
}

// Front-Left & Front-Right Tassets
addPart('obsidian', buildTasset(0.09, -0.22, -0.08));
addPart('obsidian', buildTasset(-0.09, 0.22, 0.08));

// Side Flank Tassets
function buildFlankTasset(posX, isLeft) {
  const flankGroup = [];
  for (let i = 0; i < 3; i++) {
    const lame = createBeveledGothicPlate(0.12 - i * 0.01, 0.07, 0.018, 0.005, 0.015);
    lame.translate(0, -i * 0.05, i * 0.006);
    flankGroup.push(lame);
  }
  const merged = BufferGeometryUtils.mergeGeometries(flankGroup);
  merged.rotateY(isLeft ? Math.PI / 2 + 0.1 : -Math.PI / 2 - 0.1);
  merged.rotateZ(isLeft ? -0.2 : 0.2);
  merged.translate(posX, hipsPos.y - 0.04, 0.0);
  return merged;
}
addPart('obsidian', buildFlankTasset(0.18, true));
addPart('obsidian', buildFlankTasset(-0.18, false));

// ----------------------------------------------------------------------------
// D. GOTHIC SPAULDERS / PAULDRONS (Shoulders)
// ----------------------------------------------------------------------------
function buildGothicPauldron(isLeft) {
  const side = isLeft ? 1 : -1;
  const shPos = boneWorldPos[isLeft ? 'mixamorigLeftShoulder' : 'mixamorigRightShoulder'];
  const armPos = boneWorldPos[isLeft ? 'mixamorigLeftArm' : 'mixamorigRightArm'];

  const partsObsidian = [];
  const partsSilver = [];

  // Main Shoulder Dome
  const domeLayers = [
    { y: 0.10, rx: 0.04, rz: 0.05, cx: 0, cz: 0 },
    { y: 0.05, rx: 0.11, rz: 0.13, cx: 0, cz: 0 },
    { y: -0.02, rx: 0.13, rz: 0.14, cx: 0, cz: 0 },
    { y: -0.08, rx: 0.12, rz: 0.13, cx: 0, cz: 0 }
  ];
  const dome = createLoftedVolume(domeLayers, 18);
  dome.rotateZ(side * -0.35);
  dome.translate(armPos.x + side * 0.02, armPos.y + 0.05, armPos.z);
  partsObsidian.push(dome);

  // Vertical Gardbrace (Sword Breaker Fin on Top Rim)
  const gardbrace = createBeveledGothicPlate(0.04, 0.11, 0.02, 0.006, 0.015);
  gardbrace.rotateY(side * 0.3);
  gardbrace.translate(armPos.x - side * 0.01, armPos.y + 0.14, armPos.z);
  partsSilver.push(gardbrace);

  // 3 Downward Overlapping Tiered Laminar Plates
  for (let i = 0; i < 3; i++) {
    const lame = createBeveledGothicPlate(0.14 - i * 0.015, 0.065, 0.02, 0.005, 0.02);
    lame.rotateZ(side * -0.42);
    lame.rotateY(side * 0.15);
    lame.translate(armPos.x + side * (0.04 + i * 0.02), armPos.y - 0.04 - i * 0.05, armPos.z);
    partsObsidian.push(lame);
  }

  return { obsidian: partsObsidian, silver: partsSilver };
}

const leftPauldron = buildGothicPauldron(true);
leftPauldron.obsidian.forEach(g => addPart('obsidian', g));
leftPauldron.silver.forEach(g => addPart('silver', g));

const rightPauldron = buildGothicPauldron(false);
rightPauldron.obsidian.forEach(g => addPart('obsidian', g));
rightPauldron.silver.forEach(g => addPart('silver', g));

// ----------------------------------------------------------------------------
// E. ARMS, ELBOW COUTERS, VAMBRACES & GAUNTLETS (Forearms & Hands)
// ----------------------------------------------------------------------------
function buildArmAndGauntlet(isLeft) {
  const side = isLeft ? 1 : -1;
  const armPos = boneWorldPos[isLeft ? 'mixamorigLeftArm' : 'mixamorigRightArm'];
  const forePos = boneWorldPos[isLeft ? 'mixamorigLeftForeArm' : 'mixamorigRightForeArm'];
  const handPos = boneWorldPos[isLeft ? 'mixamorigLeftHand' : 'mixamorigRightHand'];

  // 1. Rerebrace (Upper Arm Armored Shell)
  const rereLayers = [
    { y: armPos.y - 0.02, rx: 0.062, rz: 0.065, cx: armPos.x, cz: armPos.z },
    { y: armPos.y - 0.12, rx: 0.058, rz: 0.060, cx: armPos.x, cz: armPos.z },
    { y: forePos.y + 0.04, rx: 0.052, rz: 0.055, cx: forePos.x, cz: forePos.z }
  ];
  const rereGeo = createLoftedVolume(rereLayers, 16);
  addPart('obsidian', rereGeo);

  // Underarm Chainmail sleeve at elbow joint
  const elbowJointGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.08, 12);
  elbowJointGeo.translate(forePos.x, forePos.y, forePos.z);
  addPart('gambeson', elbowJointGeo);

  // 2. Gothic Couter (Pointed Elbow Cop & Wing Flanchard)
  const couterGeo = new THREE.ConeGeometry(0.055, 0.08, 8);
  couterGeo.rotateX(-Math.PI / 2);
  couterGeo.translate(forePos.x, forePos.y, forePos.z - 0.055);
  addPart('silver', couterGeo);

  const flanchard = createBeveledGothicPlate(0.06, 0.08, 0.015, 0.005, 0.01);
  flanchard.rotateY(side * 0.4);
  flanchard.translate(forePos.x + side * 0.045, forePos.y, forePos.z - 0.02);
  addPart('obsidian', flanchard);

  // 3. Anatomical Vambrace (Forearm Armor)
  const vamLayers = [
    { y: forePos.y - 0.02, rx: 0.056, rz: 0.058, cx: forePos.x, cz: forePos.z },
    { y: forePos.y - 0.12, rx: 0.052, rz: 0.050, cx: forePos.x, cz: forePos.z },
    { y: handPos.y + 0.03, rx: 0.044, rz: 0.042, cx: handPos.x, cz: handPos.z }
  ];
  const vamGeo = createLoftedVolume(vamLayers, 16);
  addPart('obsidian', vamGeo);

  // Vambrace Blade Ridge
  const vamBlade = createBeveledGothicPlate(0.025, 0.20, 0.02, 0.004, 0.015);
  vamBlade.translate(forePos.x + side * 0.048, forePos.y - 0.10, forePos.z);
  addPart('silver', vamBlade);

  // 4. Flared Gauntlet Cuff & Metacarpal Hand Shell
  const cuffGeo = new THREE.CylinderGeometry(0.052, 0.044, 0.06, 12, 1, true);
  cuffGeo.translate(handPos.x, handPos.y + 0.01, handPos.z);
  addPart('silver', cuffGeo);

  const palmGeo = new THREE.BoxGeometry(0.065, 0.065, 0.035);
  palmGeo.translate(handPos.x, handPos.y - 0.04, handPos.z);
  addPart('obsidian', palmGeo);

  // Metacarpal overlapping scales
  for (let k = 0; k < 3; k++) {
    const scalePlate = createBeveledGothicPlate(0.058, 0.022, 0.012, 0.003, 0.008);
    scalePlate.translate(handPos.x, handPos.y - 0.025 - k * 0.018, handPos.z + 0.018);
    addPart('silver', scalePlate);
  }

  // 5. Articulated 5-Fingered Hand (Thumb + 4 Fingers with Knuckles)
  const fingerConfigs = [
    { xOff: side * 0.035, yOff: -0.03, zOff: 0.015, len: 0.045, rad: 0.009, rotX: 0.3, rotZ: side * 0.5 }, // Thumb
    { xOff: side * 0.022, yOff: -0.075, zOff: 0.008, len: 0.055, rad: 0.008, rotX: 0.2, rotZ: side * 0.1 }, // Index
    { xOff: 0.0,          yOff: -0.078, zOff: 0.008, len: 0.060, rad: 0.008, rotX: 0.2, rotZ: 0.0 },        // Middle
    { xOff: -side * 0.02, yOff: -0.074, zOff: 0.008, len: 0.052, rad: 0.0075, rotX: 0.2, rotZ: -side * 0.1 }, // Ring
    { xOff: -side * 0.035, yOff: -0.068, zOff: 0.006, len: 0.042, rad: 0.007, rotX: 0.2, rotZ: -side * 0.2 }  // Pinky
  ];

  for (const fc of fingerConfigs) {
    const fGeo = createDetailedFinger(fc.len, fc.rad, 3);
    fGeo.rotateX(Math.PI - fc.rotX); // Curled slightly in combat grip
    fGeo.rotateZ(fc.rotZ);
    fGeo.translate(handPos.x + fc.xOff, handPos.y + fc.yOff, handPos.z + fc.zOff);
    addPart('obsidian', fGeo);
  }
}

buildArmAndGauntlet(true);
buildArmAndGauntlet(false);

// ----------------------------------------------------------------------------
// F. LEGS, KNEE POLEYNS, GREAVES & GROUNDED SABATONS (Lower Body)
// ----------------------------------------------------------------------------
function buildLegAndSabaton(isLeft) {
  const side = isLeft ? 1 : -1;
  const upLegPos = boneWorldPos[isLeft ? 'mixamorigLeftUpLeg' : 'mixamorigRightUpLeg'];
  const legPos = boneWorldPos[isLeft ? 'mixamorigLeftLeg' : 'mixamorigRightLeg'];
  const footPos = boneWorldPos[isLeft ? 'mixamorigLeftFoot' : 'mixamorigRightFoot'];
  const toePos = boneWorldPos[isLeft ? 'mixamorigLeftToeBase' : 'mixamorigRightToeBase'];

  // 1. Cuisses (Armored Muscular Thigh)
  const cuisseLayers = [
    { y: upLegPos.y - 0.02, rx: 0.095, rz: 0.105, cx: upLegPos.x, cz: upLegPos.z },
    { y: upLegPos.y - 0.18, rx: 0.088, rz: 0.092, cx: upLegPos.x, cz: upLegPos.z },
    { y: legPos.y + 0.05,   rx: 0.072, rz: 0.075, cx: legPos.x, cz: legPos.z }
  ];
  const cuisseGeo = createLoftedVolume(cuisseLayers, 18);
  addPart('obsidian', cuisseGeo);

  // Cuisse Upper Flared Crest
  const cuisseFlange = createBeveledGothicPlate(0.12, 0.06, 0.02, 0.005, 0.015);
  cuisseFlange.rotateY(side * 0.3);
  cuisseFlange.translate(upLegPos.x + side * 0.06, upLegPos.y - 0.04, upLegPos.z);
  addPart('silver', cuisseFlange);

  // Under-knee Chainmail joint
  const kneeJointGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.09, 12);
  kneeJointGeo.translate(legPos.x, legPos.y, legPos.z);
  addPart('gambeson', kneeJointGeo);

  // 2. Gothic Poleyn (Pointed Knee Cop & Side Flanchards)
  const poleynLayers = [
    { y: legPos.y + 0.06, rx: 0.075, rz: 0.075, cx: legPos.x, cz: legPos.z + 0.03 },
    { y: legPos.y + 0.00, rx: 0.085, rz: 0.095, cx: legPos.x, cz: legPos.z + 0.05 },
    { y: legPos.y - 0.06, rx: 0.075, rz: 0.075, cx: legPos.x, cz: legPos.z + 0.03 }
  ];
  const poleynGeo = createLoftedVolume(poleynLayers, 16);
  addPart('silver', poleynGeo);

  // Central Knee Spike
  const kneeSpike = new THREE.ConeGeometry(0.035, 0.065, 6);
  kneeSpike.rotateX(Math.PI / 2);
  kneeSpike.translate(legPos.x, legPos.y, legPos.z + 0.12);
  addPart('crimsonTrim', kneeSpike);

  // 3. Anatomical Greaves (Shin & Calf Armor)
  const greaveLayers = [
    { y: legPos.y - 0.04,  rx: 0.072, rz: 0.078, cx: legPos.x, cz: legPos.z },
    { y: legPos.y - 0.18,  rx: 0.068, rz: 0.082, cx: legPos.x, cz: legPos.z - 0.01 }, // Anatomical calf bulge
    { y: footPos.y + 0.06, rx: 0.054, rz: 0.058, cx: footPos.x, cz: footPos.z }
  ];
  const greaveGeo = createLoftedVolume(greaveLayers, 18);
  addPart('obsidian', greaveGeo);

  // Anterior Shin Razor Ridge
  const shinSpine = createBeveledGothicPlate(0.03, 0.32, 0.025, 0.005, 0.02);
  shinSpine.translate(legPos.x, legPos.y - 0.20, legPos.z + 0.068);
  addPart('silver', shinSpine);

  // 4. Articulated Segmented Gothic Sabatons (Boots grounded at Y=0.00)
  // Ankle Collar
  const ankleGeo = new THREE.CylinderGeometry(0.058, 0.054, 0.06, 12);
  ankleGeo.translate(footPos.x, footPos.y + 0.02, footPos.z);
  addPart('silver', ankleGeo);

  // Layered Foot Arch Plates
  for (let k = 0; k < 4; k++) {
    const archPlate = createBeveledGothicPlate(0.095 - k * 0.008, 0.045, 0.025, 0.004, 0.015);
    archPlate.rotateX(-0.15);
    archPlate.translate(footPos.x, 0.045 - k * 0.008, footPos.z + 0.04 + k * 0.035);
    addPart('obsidian', archPlate);
  }

  // Tapered Pointed Gothic Toe Cap (Grounded precisely at Y=0.00)
  const toeCap = new THREE.ConeGeometry(0.048, 0.085, 8);
  toeCap.rotateX(Math.PI / 2);
  toeCap.scale(1.1, 0.6, 1.2);
  toeCap.translate(toePos.x, 0.022, toePos.z + 0.04);
  addPart('silver', toeCap);

  // Flat Heavy Sole (Y = 0.00 to Y = 0.015)
  const soleGeo = new THREE.BoxGeometry(0.105, 0.018, 0.24);
  soleGeo.translate(footPos.x, 0.009, footPos.z + 0.06);
  addPart('gambeson', soleGeo);
}

buildLegAndSabaton(true);
buildLegAndSabaton(false);

// ============================================================================
// 5. SMOOTH SKINNING & WEIGHT BINDING CALCULATION
// ============================================================================
console.log('[Sovereign Warrior Generator] Calculating smooth skin weights across armature bones...');

function skinGeometry(geometry) {
  const pos = geometry.attributes.position;
  const numVertices = pos.count;

  const skinIndices = [];
  const skinWeights = [];

  const tempVec = new THREE.Vector3();

  for (let i = 0; i < numVertices; i++) {
    tempVec.set(pos.getX(i), pos.getY(i), pos.getZ(i));

    // Calculate distance to each bone and apply exponential distance falloff
    const boneDists = [];

    for (let bIndex = 0; bIndex < bones.length; bIndex++) {
      const b = bones[bIndex];
      const bPos = boneWorldPos[b.name];
      const dist = tempVec.distanceTo(bPos);

      // Anatomical bias weights
      let bias = 1.0;
      if (b.name.includes('Head') && tempVec.y > 1.55) bias = 3.0;
      if (b.name.includes('Foot') && tempVec.y < 0.25) bias = 3.0;
      if (b.name.includes('Hand') && Math.abs(tempVec.x) > 0.28 && tempVec.y < 0.95 && tempVec.y > 0.60) bias = 3.0;

      boneDists.push({ index: bIndex, dist: dist / bias });
    }

    // Sort by closest bones
    boneDists.sort((a, b) => a.dist - b.dist);

    // Pick top 4 influencing bones
    const top4 = boneDists.slice(0, 4);

    let totalWeight = 0;
    const weights = [];

    for (let k = 0; k < 4; k++) {
      const w = 1.0 / Math.pow(Math.max(0.001, top4[k].dist), 3.0);
      weights.push(w);
      totalWeight += w;
    }

    // Normalize weights
    for (let k = 0; k < 4; k++) {
      weights[k] /= totalWeight;
    }

    skinIndices.push(top4[0].index, top4[1].index, top4[2].index, top4[3].index);
    skinWeights.push(weights[0], weights[1], weights[2], weights[3]);
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
}

// Merge all pieces per material and skin them
const skinnedMeshes = [];

const materialMapping = [
  { key: 'obsidian', mat: matObsidianPlate },
  { key: 'silver', mat: matColdSilver },
  { key: 'gambeson', mat: matUnderGambeson },
  { key: 'visor', mat: matCrimsonVisor },
  { key: 'crimsonTrim', mat: matCrimsonTrim }
];

let totalVerts = 0;
let totalTris = 0;

for (const { key, mat } of materialMapping) {
  const geos = meshPieces[key];
  if (geos.length > 0) {
    const merged = BufferGeometryUtils.mergeGeometries(geos);
    merged.computeVertexNormals();
    skinGeometry(merged);

    const skinnedMesh = new THREE.SkinnedMesh(merged, mat);
    skinnedMesh.name = `Sovereign_${key}`;
    skinnedMesh.bind(skeleton);
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    skinnedMeshes.push(skinnedMesh);

    totalVerts += merged.attributes.position.count;
    totalTris += merged.index.count / 3;
    console.log(` - Material Group [${key}]: ${merged.attributes.position.count} vertices, ${merged.index.count / 3} triangles`);
  }
}

console.log(`[Sovereign Warrior Generator] Total character geometry: ${totalVerts} vertices, ${totalTris} triangles.`);

// Assemble character root scene
const characterRoot = new THREE.Group();
characterRoot.name = 'Sovereign_Dark_Warrior';
characterRoot.add(rootNode);
for (const sm of skinnedMeshes) {
  characterRoot.add(sm);
}

// ============================================================================
// 6. IDLE_COMBAT ANIMATION SYNTHESIS (Fluid 2.5s Combat Stance Loop)
// ============================================================================
console.log('[Sovereign Warrior Generator] Generating Idle_Combat keyframe animation track...');

const animTracks = [];
const times = [0.0, 0.625, 1.25, 1.875, 2.5];

// Helper to create quaternion rotation track from euler angles
function makeRotationTrack(boneName, eulerFrames) {
  const values = [];
  const q = new THREE.Quaternion();
  const euler = new THREE.Euler();

  for (const [x, y, z] of eulerFrames) {
    euler.set(x, y, z, 'XYZ');
    q.setFromEuler(euler);
    values.push(q.x, q.y, q.z, q.w);
  }

  return new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, values);
}

function makePositionTrack(boneName, posFrames) {
  const values = [];
  for (const [x, y, z] of posFrames) {
    values.push(x, y, z);
  }
  return new THREE.VectorKeyframeTrack(`${boneName}.position`, times, values);
}

// Hips (Slight combat bounce and breathing shift)
animTracks.push(makePositionTrack('mixamorigHips', [
  [0, 0.98, 0],
  [0.005, 0.965, -0.005],
  [0, 0.98, 0],
  [-0.005, 0.965, -0.005],
  [0, 0.98, 0]
]));

animTracks.push(makeRotationTrack('mixamorigHips', [
  [0.02, 0.08, 0.0],
  [0.04, 0.07, 0.01],
  [0.02, 0.08, 0.0],
  [0.04, 0.09, -0.01],
  [0.02, 0.08, 0.0]
]));

// Spine / Chest Breathing
animTracks.push(makeRotationTrack('mixamorigSpine', [
  [0.04, -0.04, 0.0],
  [0.06, -0.03, 0.01],
  [0.04, -0.04, 0.0],
  [0.06, -0.05, -0.01],
  [0.04, -0.04, 0.0]
]));

animTracks.push(makeRotationTrack('mixamorigSpine2', [
  [0.05, -0.04, 0.0],
  [0.08, -0.03, 0.0],
  [0.05, -0.04, 0.0],
  [0.08, -0.05, 0.0],
  [0.05, -0.04, 0.0]
]));

// Head (Alert tactical scan)
animTracks.push(makeRotationTrack('mixamorigHead', [
  [-0.06, -0.04, 0.0],
  [-0.04, 0.02, 0.02],
  [-0.06, -0.04, 0.0],
  [-0.08, -0.08, -0.02],
  [-0.06, -0.04, 0.0]
]));

// Left Arm (Raised tactical guard)
animTracks.push(makeRotationTrack('mixamorigLeftArm', [
  [0.35, 0.20, 0.15],
  [0.38, 0.22, 0.18],
  [0.35, 0.20, 0.15],
  [0.32, 0.18, 0.12],
  [0.35, 0.20, 0.15]
]));

animTracks.push(makeRotationTrack('mixamorigLeftForeArm', [
  [-0.75, -0.20, 0.10],
  [-0.80, -0.22, 0.12],
  [-0.75, -0.20, 0.10],
  [-0.70, -0.18, 0.08],
  [-0.75, -0.20, 0.10]
]));

// Right Arm (Poised sword-ready grip)
animTracks.push(makeRotationTrack('mixamorigRightArm', [
  [0.25, -0.15, -0.20],
  [0.28, -0.18, -0.22],
  [0.25, -0.15, -0.20],
  [0.22, -0.12, -0.18],
  [0.25, -0.15, -0.20]
]));

animTracks.push(makeRotationTrack('mixamorigRightForeArm', [
  [-0.65, 0.25, -0.15],
  [-0.70, 0.28, -0.18],
  [-0.65, 0.25, -0.15],
  [-0.60, 0.22, -0.12],
  [-0.65, 0.25, -0.15]
]));

// Legs (Stance stability)
animTracks.push(makeRotationTrack('mixamorigLeftUpLeg', [
  [-0.08, 0.05, 0.04],
  [-0.10, 0.06, 0.05],
  [-0.08, 0.05, 0.04],
  [-0.06, 0.04, 0.03],
  [-0.08, 0.05, 0.04]
]));

animTracks.push(makeRotationTrack('mixamorigRightUpLeg', [
  [-0.08, -0.05, -0.04],
  [-0.10, -0.06, -0.05],
  [-0.08, -0.05, -0.04],
  [-0.06, -0.04, -0.03],
  [-0.08, -0.05, -0.04]
]));

const idleCombatClip = new THREE.AnimationClip('Idle_Combat', 2.5, animTracks);

// ============================================================================
// 7. EXPORT GLB (assets/game/fighter_v2.glb)
// ============================================================================
const outputPath = path.resolve('assets/game/fighter_v2.glb');
console.log(`[Sovereign Warrior Generator] Exporting binary GLTF to ${outputPath}...`);

const exporter = new GLTFExporter();
exporter.parse(
  characterRoot,
  (gltfBuffer) => {
    if (gltfBuffer instanceof ArrayBuffer) {
      const buffer = Buffer.from(gltfBuffer);
      fs.writeFileSync(outputPath, buffer);
      console.log(`[SUCCESS] Sovereign Warrior fighter_v2.glb exported successfully!`);
      console.log(`File Size: ${(buffer.length / 1024).toFixed(2)} KB (${buffer.length} bytes)`);
    } else {
      console.error('[Error] Exporter did not return an ArrayBuffer:', gltfBuffer);
    }
  },
  (err) => {
    console.error('[Export Error]', err);
  },
  {
    binary: true,
    animations: [idleCombatClip],
    embedImages: true
  }
);
