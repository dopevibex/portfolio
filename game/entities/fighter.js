import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

export class Fighter {
  constructor(scene, onLoaded = null) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.idleAction = null;
    this.isLoaded = false;

    this.loadModel(onLoaded);
  }

  loadModel(onLoaded) {
    const loader = new GLTFLoader();
    loader.load(
      './assets/game/fighter_v2.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.name = 'Sovereign_Fighter_V2';

        // Position grounded on the central arena floor
        this.model.position.set(0, 0.0, 0);
        // Face slightly toward the camera for natural framing
        this.model.rotation.set(0, 0.35, 0);

        // Ensure shadows on all skinned mesh primitives
        this.model.traverse((child) => {
          if (child.isMesh || child.isSkinnedMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(this.model);

        // Setup AnimationMixer and play Idle_Combat
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const idleClip = gltf.animations.find(a => a.name === 'Idle_Combat') || gltf.animations[0];
          this.idleAction = this.mixer.clipAction(idleClip);
          this.idleAction.play();
        }

        this.isLoaded = true;
        if (typeof onLoaded === 'function') {
          onLoaded(this);
        }
      },
      undefined,
      (err) => {
        console.error('[Fighter] Error loading assets/game/fighter_v2.glb:', err);
      }
    );
  }

  update(dt) {
    if (this.mixer) {
      this.mixer.update(dt);
    }
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    if (this.model) {
      this.scene.remove(this.model);
      this.model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.model = null;
    }
    this.isLoaded = false;
  }
}
