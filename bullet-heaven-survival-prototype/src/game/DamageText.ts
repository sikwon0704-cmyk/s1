import { Vector2 } from './types';

export class DamageText {
  public x: number = 0;
  public y: number = 0;
  public text: string = '';
  public color: string = '#fff';
  public fontSize: number = 20;
  public life: number = 0;
  public active: boolean = false;
  
  // Physics
  public velocity: Vector2 = { x: 0, y: 0 };
  public gravity: number = 1000;
  public scale: number = 1;

  public spawn(x: number, y: number, damage: number | string, isCrit: boolean, color: string = '#fff') {
    this.x = x;
    this.y = y;
    this.text = damage.toString();
    this.color = color;
    this.active = true;
    this.life = 0.8; // Seconds
    
    this.fontSize = isCrit ? 36 : 24;
    this.scale = isCrit ? 1.5 : 1.0;
    
    // Pop up and random spread
    this.velocity.x = (Math.random() - 0.5) * 100;
    this.velocity.y = -300 - (Math.random() * 100); // Jump up
    
    if (isCrit) {
        this.velocity.y -= 100; // Jump higher
        this.color = '#ef4444'; // Red
    }
  }

  public update(dt: number) {
    if (!this.active) return;
    
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Apply Physics
    this.velocity.y += this.gravity * dt;
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
    
    // Scale animation (pop in then shrink slightly)
    if (this.life > 0.6) {
        // First 0.2s: Overshoot
        this.scale += dt * 2;
    } else {
        // Settle
        this.scale = Math.max(1, this.scale - dt);
    }
  }

  public draw(ctx: CanvasRenderingContext2D, screenCenter: Vector2, playerPos: Vector2) {
    if (!this.active) return;

    const screenX = (this.x - playerPos.x) + screenCenter.x;
    const screenY = (this.y - playerPos.y) + screenCenter.y;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(this.scale, this.scale);
    
    // Stroke
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.lineJoin = 'round';
    ctx.font = `900 ${this.fontSize}px "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeText(this.text, 0, 0);
    
    // Fill
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);
    
    ctx.restore();
  }
}
