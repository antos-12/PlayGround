import { clamp } from './utils.js';

export class InputController {
  constructor({ canvas, boostButton, joystick, joystickThumb, aimRing, onPause }) {
    this.canvas = canvas;
    this.boostButton = boostButton;
    this.joystick = joystick;
    this.joystickThumb = joystickThumb;
    this.aimRing = aimRing;
    this.onPause = onPause;
    this.enabled = false;
    this.angle = -Math.PI / 2;
    this.hasAngle = false;
    this.boost = false;
    this.pointerType = 'mouse';
    this.keys = new Set();
    this.joystickActive = false;
    this.joystickOrigin = { x: 0, y: 0 };
    this.steerPointerId = null;

    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);

    const boostStart = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.boost = true;
      this.boostButton.classList.add('pressed');
    };
    const boostEnd = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.boost = false;
      this.boostButton.classList.remove('pressed');
    };
    boostButton.addEventListener('pointerdown', boostStart);
    boostButton.addEventListener('pointerup', boostEnd);
    boostButton.addEventListener('pointercancel', boostEnd);
    boostButton.addEventListener('pointerleave', boostEnd);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.boost = false;
      this.joystickActive = false;
      this.steerPointerId = null;
      this.boostButton.classList.remove('pressed');
      this.joystick.classList.remove('visible');
      this.aimRing.classList.remove('visible');
      this.keys.clear();
    }
  }

  screenCenter() {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight * (window.innerWidth < 720 ? 0.56 : 0.53)
    };
  }

  steerFromPointer(clientX, clientY, origin = null) {
    const base = origin || this.screenCenter();
    const dx = clientX - base.x;
    const dy = clientY - base.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 9) {
      this.angle = Math.atan2(dy, dx);
      this.hasAngle = true;
      return true;
    }
    return false;
  }

  handlePointerMove(event) {
    if (!this.enabled) return;
    this.pointerType = event.pointerType;
    if (event.pointerType === 'touch') {
      if (!this.joystickActive || event.pointerId !== this.steerPointerId) return;
      const dx = event.clientX - this.joystickOrigin.x;
      const dy = event.clientY - this.joystickOrigin.y;
      const distance = Math.hypot(dx, dy);
      const max = 46;
      const scale = distance > max ? max / distance : 1;
      this.joystickThumb.style.transform = `translate(-50%, -50%) translate(${dx * scale}px, ${dy * scale}px)`;
      this.steerFromPointer(event.clientX, event.clientY, this.joystickOrigin);
      return;
    }
    if (this.steerFromPointer(event.clientX, event.clientY)) {
      this.aimRing.style.left = `${event.clientX}px`;
      this.aimRing.style.top = `${event.clientY}px`;
      this.aimRing.classList.add('visible');
    }
  }

  handlePointerDown(event) {
    if (!this.enabled) return;
    this.pointerType = event.pointerType;
    if (event.pointerType === 'touch') {
      if (this.joystickActive) return;
      this.joystickActive = true;
      this.steerPointerId = event.pointerId;
      this.joystickOrigin = { x: event.clientX, y: event.clientY };
      this.joystick.style.left = `${event.clientX}px`;
      this.joystick.style.top = `${event.clientY}px`;
      this.joystickThumb.style.transform = 'translate(-50%, -50%)';
      this.joystick.classList.add('visible');
      try {
        this.canvas.setPointerCapture?.(event.pointerId);
      } catch {
        /* pointer may already be released */
      }
      return;
    }
    if (event.button === 0) {
      this.boost = true;
      this.boostButton.classList.add('pressed');
    }
    this.steerFromPointer(event.clientX, event.clientY);
  }

  handlePointerUp(event) {
    if (!this.enabled) return;
    if (event.pointerType === 'touch' && event.pointerId === this.steerPointerId) {
      this.joystickActive = false;
      this.steerPointerId = null;
      this.joystick.classList.remove('visible');
      return;
    }
    if (event.pointerType !== 'touch') {
      this.boost = false;
      this.boostButton.classList.remove('pressed');
    }
  }

  handleKeyDown(event) {
    if (event.code === 'KeyP' || event.code === 'Escape') {
      if (this.enabled) {
        event.preventDefault();
        this.onPause?.();
      }
      return;
    }
    if (!this.enabled) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
      event.preventDefault();
    }
    if (key === ' ') this.boost = true;
    this.keys.add(key);
  }

  handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === ' ') this.boost = false;
    this.keys.delete(key);
  }

  handleBlur() {
    this.keys.clear();
    this.boost = false;
    this.joystickActive = false;
    this.joystick.classList.remove('visible');
    this.boostButton.classList.remove('pressed');
  }

  update() {
    if (!this.enabled) return;
    let x = 0;
    let y = 0;
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) y -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) y += 1;
    if (x !== 0 || y !== 0) {
      this.angle = Math.atan2(y, x);
      this.hasAngle = true;
    }
    if (this.pointerType !== 'touch' && !this.joystickActive) {
      this.aimRing.classList.toggle('visible', this.hasAngle);
    }
  }

  getBoostFactor() {
    return clamp(this.boost ? 1 : 0, 0, 1);
  }
}
