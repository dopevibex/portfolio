// Isolated Three.js Engine with Full Lifecycle & Performance Budgeting
import * as THREE from '../../assets/vendor/three/three.module.js';

export class Engine {
  constructor(mountContainer) {
    this.container = mountContainer;
    this.width = mountContainer.clientWidth || window.innerWidth;
    this.height = mountContainer.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06070b);
    this.scene.fog = new THREE.FogExp2(0x08090f, 0.038);

    // 2. Camera: Over-The-Shoulder (God-of-War style)
    this.camera = new THREE.PerspectiveCamera(54, this.width / this.height, 0.1, 120);
    this.cameraTarget = new THREE.Vector3(0, 1.4, 0);
    this.cameraOffset = new THREE.Vector3(0.85, 1.85, -3.2); // Offset right & up
    this.currentCameraPos = new THREE.Vector3(0, 2, -4);
    this.camera.position.copy(this.currentCameraPos);

    // 3. Renderer (Capped Pixel Ratio & WebGL Optimization)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);

    // 4. Directional Moonlight (Single Shadow Caster for Budget)
    this.moonLight = new THREE.DirectionalLight(0xd8e4f0, 2.2);
    this.moonLight.position.set(-12, 26, -14);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.moonLight.shadow.camera.near = 0.5;
    this.moonLight.shadow.camera.far = 70;
    this.moonLight.shadow.camera.left = -22;
    this.moonLight.shadow.camera.right = 22;
    this.moonLight.shadow.camera.top = 22;
    this.moonLight.shadow.camera.bottom = -22;
    this.moonLight.shadow.bias = -0.0006;
    this.scene.add(this.moonLight);

    // 5. Ambient Fill & Rim Lighting (Hemisphere Sky/Floor + Ambient Fill)
    this.hemiLight = new THREE.HemisphereLight(0x64748b, 0x1a1e2b, 1.3);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0x1e293b, 0.65);
    this.scene.add(this.ambientLight);

    // 6. Camera Shake & Hit-Stop State
    this.shakeIntensity = 0;
    this.shakeDecay = 6.0;

    // 7. Performance Monitor & Dev Stats
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.adaptiveCheckCounter = 0;

    // Bound Event Listeners
    this._onResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  triggerCameraShake(intensity = 0.25) {
    this.shakeIntensity = Math.min(intensity, 0.6);
  }

  updateCamera(targetObj, yaw, pitch, isAiming = false, dt = 0.016) {
    if (!targetObj) return;

    // Calculate base anchor point (spine/head level)
    const targetBase = targetObj.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.cameraTarget.lerp(targetBase, 12.0 * dt);

    // Over-the-shoulder offset
    const sideOffset = isAiming ? 0.65 : 0.85;
    const heightOffset = isAiming ? 1.65 : 1.85;
    const distOffset = isAiming ? 2.0 : 3.4;

    // Spherical yaw/pitch orbit around target
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    // Forward, Right, Up vectors relative to camera orientation
    const right = new THREE.Vector3(cosYaw, 0, -sinYaw);
    const desiredPos = this.cameraTarget.clone()
      .addScaledVector(right, sideOffset)
      .add(new THREE.Vector3(
        -sinYaw * cosPitch * distOffset,
        heightOffset + sinPitch * distOffset * 0.8,
        -cosYaw * cosPitch * distOffset
      ));

    // Smooth camera lag
    this.currentCameraPos.lerp(desiredPos, 14.0 * dt);

    // Apply Screen Shake (restrained, heavy hits only)
    if (this.shakeIntensity > 0.001) {
      this.currentCameraPos.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.currentCameraPos.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    this.camera.position.copy(this.currentCameraPos);

    // Look slightly ahead of the character
    const lookTarget = this.cameraTarget.clone().addScaledVector(right, sideOffset * 0.5);
    this.camera.lookAt(lookTarget);
  }

  onWindowResize() {
    if (!this.container || !this.renderer) return;
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);

    // Frame stats tracking
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;

      // Adaptive Performance: downscale if frames dip under 40 FPS
      if (this.fps < 40 && this.pixelRatio > 1.0) {
        this.adaptiveCheckCounter++;
        if (this.adaptiveCheckCounter > 4) {
          this.pixelRatio = 1.0;
          this.renderer.setPixelRatio(1.0);
          this.renderer.shadowMap.type = THREE.BasicShadowMap;
          console.warn('[Engine] Adaptive Quality: lowered pixel ratio to 1.0 for performance.');
        }
      }
    }
  }

  getStats() {
    const info = this.renderer ? this.renderer.info : null;
    return {
      fps: this.fps,
      drawCalls: info ? info.render.calls : 0,
      triangles: info ? info.render.triangles : 0,
      geometries: info ? info.memory.geometries : 0,
      textures: info ? info.memory.textures : 0
    };
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);

    // Deep scene object disposal
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
  }
}
