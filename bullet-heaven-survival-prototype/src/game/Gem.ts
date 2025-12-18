import { Vector2, LootType } from './types';
import { AssetGenerator } from './AssetGenerator';

export class Gem {
  public position: Vector2 = { x: 0, y: 0 };
  public active: boolean = false;
  public value: number = 10;
  public type: LootType = 'xp';
  public readonly SIZE: number = 8;
  
  // Animation/Magnet logic
  private velocity: Vector2 = { x: 0, y: 0 };
  public isMagnetized: boolean = false;
  private currentSpeed: number = 0;
  private readonly MAGNET_BASE_SPEED: number = 400;

  constructor() {
    // Init
  }

  public spawn(x: number, y: number, value: number, type: LootType = 'xp', initialVelocity?: Vector2) {
    this.position.x = x;
    this.position.y = y;
    this.value = value;
    this.type = type;
    this.active = true;
    this.isMagnetized = false;
    this.currentSpeed = 0; // Reset speed
    
    if (initialVelocity) {
        this.velocity = { ...initialVelocity };
    } else {
        this.velocity = { x: 0, y: 0 };
    }
  }

  public update(playerPos: Vector2, magnetRange: number, dt: number) {
    if (!this.active) return;

    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const distSq = dx*dx + dy*dy;

    // Normal Magnet Range check (only if not already magnetized globally)
    if (!this.isMagnetized && distSq < magnetRange * magnetRange && this.type === 'xp') {
      this.isMagnetized = true;
    }

    // Move towards player if magnetized
    if (this.isMagnetized) {
      const distance = Math.sqrt(distSq);
      if (distance > 0) {
        // Accelerating Suction Logic
        // Start slow (or current velocity), accelerate rapidly
        if (this.currentSpeed === 0) this.currentSpeed = this.MAGNET_BASE_SPEED;
        
        // Acceleration: +800 px/s^2
        this.currentSpeed += dt * 800;
        
        this.velocity.x = (dx / distance) * this.currentSpeed;
        this.velocity.y = (dy / distance) * this.currentSpeed;
      }
      
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
    } else {
        // Friction for "popped" items (Jump effect decay)
        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
            this.position.x += this.velocity.x * dt;
            this.position.y += this.velocity.y * dt;
            
            // Apply friction
            const friction = 5.0 * dt;
            this.velocity.x -= this.velocity.x * friction;
            this.velocity.y -= this.velocity.y * friction;
            
            if (Math.abs(this.velocity.x) < 10) this.velocity.x = 0;
            if (Math.abs(this.velocity.y) < 10) this.velocity.y = 0;
        }
    }
  }

  public draw(ctx: CanvasRenderingContext2D, screenCenter: Vector2, playerPos: Vector2) {
    if (!this.active) return;

    const screenX = (this.position.x - playerPos.x) + screenCenter.x;
    const screenY = (this.position.y - playerPos.y) + screenCenter.y;

    if (this.type === 'potion') {
      // Draw Potion (Red Bottle)
      ctx.fillStyle = '#ef4444'; // Red
      
      // Bottle shape
      ctx.beginPath();
      ctx.arc(screenX, screenY + 2, 5, 0, Math.PI * 2); // Bottom round
      ctx.fill();
      ctx.fillRect(screenX - 2, screenY - 5, 4, 6); // Neck
      
      // Glow
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ef4444';
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (this.type === 'weapon_box') {
      // Draw Weapon Box (Purple/Gold Box)
      ctx.fillStyle = '#8b5cf6'; // Violet
      ctx.fillRect(screenX - 6, screenY - 6, 12, 12);
      
      // Gold Border
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX - 6, screenY - 6, 12, 12);
      
      // Question mark or symbol
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', screenX, screenY);
    } else if (this.type === 'magnet') {
        const sprite = AssetGenerator.getInstance().sprites['magnet'];
        if (sprite) {
            ctx.drawImage(sprite, screenX - 16, screenY - 16, 32, 32);
        }
        
        // Sparkle Effect
        if (Math.random() < 0.1) {
            ctx.fillStyle = 'white';
            const rx = screenX + (Math.random() - 0.5) * 30;
            const ry = screenY + (Math.random() - 0.5) * 30;
            ctx.fillRect(rx, ry, 2, 2);
        }
    } else {
      // Draw XP Gem
      const isGold = this.value >= 50;
      const sprite = AssetGenerator.getInstance().sprites[isGold ? 'gem_gold' : 'gem_xp'];
      
      if (sprite) {
          ctx.drawImage(sprite, screenX - this.SIZE/2, screenY - this.SIZE/2, this.SIZE, this.SIZE);
      } else {
          ctx.fillStyle = isGold ? '#fbbf24' : '#3b82f6'; // Gold or Blue
          
          // Simple Diamond shape
          ctx.beginPath();
          ctx.moveTo(screenX, screenY - this.SIZE/2);
          ctx.lineTo(screenX + this.SIZE/2, screenY);
          ctx.lineTo(screenX, screenY + this.SIZE/2);
          ctx.lineTo(screenX - this.SIZE/2, screenY);
          ctx.closePath();
          ctx.fill();
    
          // Glow
          ctx.shadowBlur = 5;
          ctx.shadowColor = isGold ? '#fbbf24' : '#3b82f6';
          ctx.stroke(); // Optional outline
          ctx.shadowBlur = 0;
      }
    }
  }
}
