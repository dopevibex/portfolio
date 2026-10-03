// Isolated Input Handler (WASD, Mouse, Combat Keys, Pointer Lock)

export class InputManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.keys = {};
    this.mouse = {
      yaw: 0,
      pitch: 0.18,
      leftDown: false,
      rightDown: false,
      isAiming: false
    };

    // Action triggers (single-frame pulses)
    this.actions = {
      lightAttack: false,
      heavyAttack: false,
      dodge: false,
      recall: false,
      finisher: false,
      rage: false,
      lockOn: false,
      toggleStats: false,
      escape: false
    };

    this.isLocked = false;

    // Bind listeners
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onPointerLockChange = this.onPointerLockChange.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this.canvas.addEventListener('contextmenu', this._onContextMenu);

    // Click canvas to acquire pointer lock
    this._onCanvasClick = () => {
      if (!this.isLocked && this.canvas.requestPointerLock) {
        this.canvas.requestPointerLock();
      }
    };
    this.canvas.addEventListener('click', this._onCanvasClick);
  }

  onPointerLockChange() {
    this.isLocked = (document.pointerLockElement === this.canvas);
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = true;

    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.actions.dodge = true;
    } else if (key === 'q') {
      this.actions.heavyAttack = true;
    } else if (key === 'e') {
      this.actions.recall = true;
    } else if (key === 'f') {
      this.actions.finisher = true;
    } else if (key === 'r') {
      this.actions.rage = true;
    } else if (key === 'tab') {
      e.preventDefault();
      this.actions.lockOn = true;
    } else if (key === 'escape') {
      this.actions.escape = true;
    }
  }

  onKeyUp(e) {
    const key = e.key.toLowerCase();
    this.keys[key] = false;
  }

  onMouseDown(e) {
    if (!this.isLocked) return;

    if (e.button === 0) {
      // Left Click: Light Attack (or Heavy if Shift is held)
      if (this.keys['shift']) {
        this.actions.heavyAttack = true;
      } else {
        this.actions.lightAttack = true;
      }
      this.mouse.leftDown = true;
    } else if (e.button === 2) {
      // Right Click: Block / Aim
      this.mouse.rightDown = true;
      this.mouse.isAiming = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 0) {
      this.mouse.leftDown = false;
    } else if (e.button === 2) {
      this.mouse.rightDown = false;
      this.mouse.isAiming = false;
    }
  }

  onMouseMove(e) {
    if (!this.isLocked) return;

    const sensitivity = 0.0022;
    this.mouse.yaw -= e.movementX * sensitivity;
    this.mouse.pitch = Math.max(-0.25, Math.min(0.55, this.mouse.pitch + e.movementY * sensitivity));
  }

  // Consume single-frame pulses
  consume(actionName) {
    const val = this.actions[actionName];
    this.actions[actionName] = false;
    return val;
  }

  getMoveVector() {
    let forward = 0;
    let right = 0;
    if (this.keys['w']) forward += 1;
    if (this.keys['s']) forward -= 1;
    if (this.keys['d']) right += 1;
    if (this.keys['a']) right -= 1;

    const isSprinting = !!this.keys['shift'] && forward > 0;
    return { forward, right, isSprinting };
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.canvas.removeEventListener('contextmenu', this._onContextMenu);
    this.canvas.removeEventListener('click', this._onCanvasClick);

    if (document.exitPointerLock && document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
  }
}
