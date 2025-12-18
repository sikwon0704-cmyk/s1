import { Vector2 } from './types';

export type ParticleType = 'circle' | 'shard';

export class Particle {
  public position: Vector2 = { x: 0, y: 0 };
  public velocity: Vector2 = { x: 0, y: 0 };
  public life: number = 1.0; // 1.0 to 0.0
  public active: boolean = false;
  public color: string = '#ef4444';
  public size: number = 5;
  public type: ParticleType = 'circle';
  public rotation: number = 0;
  public rotationSpeed: number = 0;
  public readonly DECAY_RATE: number = 2.0; // Disappear in 0.5 seconds

  constructor() {
    // Init
  }

  public spawn(x: number, y: number, color: string, type: ParticleType = 'circle') {
    this.position.x = x;
    this.position.y = y;
    this.active = true;
    this.life = 1.0;
    this.color = color;
    this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 100; // 100-200 px/sec
    this.velocity.x = Math.cos(angle) * speed;
    this.velocity.y = Math.sin(angle) * speed;
  }

  public update(dt: number) {
    if (!this.active) return;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.rotation += this.rotationSpeed * dt;
    this.life -= this.DECAY_RATE * dt;

    if (this.life <= 0) {
      this.active = false;
    }
  }

  public draw(ctx: CanvasRenderingContext2D, screenCenter: Vector2, playerPos: Vector2) {
    if (!this.active) return;

    const screenX = (this.position.x - playerPos.x) + screenCenter.x;
    const screenY = (this.position.y - playerPos.y) + screenCenter.y;

    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;

    if (this.type === 'shard') {
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.8, this.size * 0.8);
        ctx.lineTo(-this.size * 0.8, this.size * 0.8);
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
    }
    
    ctx.restore();
  }
}
