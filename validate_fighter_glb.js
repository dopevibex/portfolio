import * as fs from 'fs';
import * as path from 'path';

console.log('=== RIGGED FIGHTER GLB VALIDATION SUITE ===\n');

const filePath = path.resolve('assets/game/fighter.glb');

// 1. File existence
if (!fs.existsSync(filePath)) {
  console.error('[FAIL] fighter.glb does not exist!');
  process.exit(1);
}
console.log('[PASS] 1. File exists at:', filePath);

// 2. Binary GLB Magic Header Check
const buffer = fs.readFileSync(filePath);
console.log(`[PASS] 2. File size: ${(buffer.length / 1024).toFixed(2)} KB (${buffer.length} bytes)`);

const magic = buffer.toString('utf8', 0, 4);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

if (magic !== 'glTF') {
  console.error(`[FAIL] Magic header is "${magic}", expected "glTF"`);
  process.exit(1);
}
console.log(`[PASS] 3. Valid binary glTF (GLB) header. Version: ${version}, Declared Length: ${length}`);

// 3. Inspect JSON Chunk inside GLB
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.toString('utf8', 16, 20);

if (jsonChunkType !== 'JSON') {
  console.error(`[FAIL] First chunk is "${jsonChunkType}", expected "JSON"`);
  process.exit(1);
}

const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonString);

console.log('[PASS] 4. Embedded GLTF JSON Chunk parsed successfully:');
console.log('       - Meshes:', gltf.meshes?.length || 0);
console.log('       - Nodes:', gltf.nodes?.length || 0);
console.log('       - Skins (Armatures):', gltf.skins?.length || 0);
console.log('       - Materials:', gltf.materials?.length || 0);
console.log('       - Animations:', gltf.animations?.length || 0);

// Validate Skin / Bones
if (!gltf.skins || gltf.skins.length === 0) {
  console.error('[FAIL] No skin/armature found in GLB!');
  process.exit(1);
}
const skin = gltf.skins[0];
console.log(`[PASS] 5. Skinned armature present with ${skin.joints?.length || 0} joint bones bound to mesh.`);

// Print Node Hierarchy
console.log('\n--- Bone / Joint Nodes ---');
skin.joints.forEach((jointIdx, i) => {
  const node = gltf.nodes[jointIdx];
  console.log(`   [Joint ${i}] Node #${jointIdx}: "${node.name}" (pos: ${JSON.stringify(node.translation || [0,0,0])})`);
});

// Print Materials
console.log('\n--- Materials Defined ---');
gltf.materials.forEach((mat, i) => {
  console.log(`   [Material ${i}] "${mat.name}" (BaseColor: ${JSON.stringify(mat.pbrMetallicRoughness?.baseColorFactor || [])}, Emissive: ${JSON.stringify(mat.emissiveFactor || [0,0,0])})`);
});

// Print Animations
console.log('\n--- Animations Embedded ---');
if (gltf.animations && gltf.animations.length > 0) {
  gltf.animations.forEach((anim, i) => {
    console.log(`   [Animation ${i}] "${anim.name}" with ${anim.channels?.length || 0} animated channels.`);
  });
}

console.log('\n=== ALL GLB ASSET VALIDATION CHECKS PASSED PERFECTLY! ===');
