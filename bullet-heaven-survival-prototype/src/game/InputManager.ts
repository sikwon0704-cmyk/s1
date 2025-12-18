import { Vector2 } from './types';

export class InputManager {
  keys: { [key: string]: boolean } = {};
  joystickVector: Vector2 = { x: 0, y: 0 };

  constructor() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true;
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false;
  }

  public setJoystickVector(x: number, y: number) {
    this.joystickVector = { x, y };
  }

  public getMovementVector(): Vector2 {
    let x = 0;
    let y = 0;

    // Keyboard Input (WASD or Arrow Keys)
    if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    // Normalize Keyboard Vector
    if (x !== 0 || y !== 0) {
      const length = Math.sqrt(x * x + y * y);
      x /= length;
      y /= length;
    }

    // Combine with Joystick (Prioritize non-zero inputs)
    // If keyboard is active, use it. Otherwise use joystick.
    if (x === 0 && y === 0) {
      x = this.joystickVector.x;
      y = this.joystickVector.y;
    }

    return { x, y };
  }

  public cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
