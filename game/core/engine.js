import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

export class Engine {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 500;

    // 1. Scene & Dark Gothic Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040106);
    this.scene.fog = new THREE.FogExp2(0x040106, 0.012);

    // 2. Camera Setup (Elevated third-person framing focusing on fighter & arena)
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      500
    );
    this.defaultCamPos = new THREE.Vector3(7.5, 9.5, 16.5);
    this.defaultCamTarget = new THREE.Vector3(0, 0.95, 0);
    this.camera.position.copy(this.defaultCamPos);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: false,
      stencil: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.domElement = this.renderer.domElement;
    this.domElement.style.display = 'block';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.container.appendChild(this.domElement);

    // 4. Orbit Camera Controls
    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(this.defaultCamTarget);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 65.0;
    this.controls.update();

    // 5. Resize Handling via ResizeObserver
    this.handleResize = this.handleResize.bind(this);
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);
  }

  handleResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.width = w;
    this.height = h;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  resetCamera() {
    this.camera.position.copy(this.defaultCamPos);
    this.controls.target.copy(this.defaultCamTarget);
    this.controls.update();
  }

  update() {
    if (this.controls) {
      this.controls.update();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.domElement && this.domElement.parentElement) {
        this.domElement.parentElement.removeChild(this.domElement);
      }
      this.renderer = null;
    }

    // Traverse and dispose all scene nodes
    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.scene.clear();
      this.scene = null;
    }
  }
}
