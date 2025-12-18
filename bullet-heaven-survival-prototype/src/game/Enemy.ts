import { Vector2, EnemyType, EnemyConfig } from './types';
import { AssetGenerator } from './AssetGenerator';

export class Enemy {
  public position: Vector2 = { x: 0, y: 0 };
  public active: boolean = false;
  public hp: number = 10;
  public maxHp: number = 10;
  public speed: number = 100;
  public baseRadius: number = 10;
  public radius: number = 10;
  public mass: number = 1.0;
  
  // Physics
  public knockbackVelocity: Vector2 = { x: 0, y: 0 };
  
  public stunTimer: number = 0; // > 0 means Stunned
  
  public lastGarlicHitTime: number = 0;
  public hitFlashTimer: number = 0;
  public lastHitTime: number = 0;
  
  public uid: number = 0;
  private static NEXT_ID: number = 0;

  public type: EnemyType = 'basic';
  public color: string = '#ef4444';
  
  public lastShootTime: number = 0;
  public onShoot: ((x: number, y: number, angle: number, size?: number, color?: string) => void) | null = null;

  constructor() {
    // Initialization
  }

  public spawn(x: number, y: number, config: EnemyConfig, onShoot: ((x: number, y: number, angle: number, size?: number, color?: string) => void) | null = null) {
    this.uid = Enemy.NEXT_ID++;
    this.position.x = x;
    this.position.y = y;
    this.active = true;
    this.type = config.type;
    this.onShoot = onShoot;
    this.color = config.color;

    // Apply stats
    const BASE_HP = 10;
    const BASE_SPEED = 100;
    const BASE_RADIUS = 16; // Visual size 32 -> Radius 16

    this.maxHp = BASE_HP * config.hpMultiplier;
    this.hp = this.maxHp;
    this.speed = BASE_SPEED * config.speedMultiplier;
    this.radius = BASE_RADIUS * config.sizeMultiplier;
    this.mass = config.mass || 1.0;

    this.hitFlashTimer = 0;
    this.stunTimer = 0;
    this.knockbackVelocity = { x: 0, y: 0 };
    this.lastShootTime = Date.now();
  }
  
  public applyKnockback(force: Vector2) {
      if (this.mass >= 50) return; // Boss / Heavy immune
      
      // F = ma -> a = F/m
      // We apply instantaneous velocity change roughly
      const strength = 1.0 / this.mass;
      this.knockbackVelocity.x += force.x * strength;
      this.knockbackVelocity.y += force.y * strength;
  }

  public applySeparation(neighbors: Enemy[], dt: number) {
    const SEPARATION_RADIUS = this.radius * 2.0; 
    const PUSH_FORCE = 300; 

    for (const other of neighbors) {
      if (other === this || !other.active) continue;

      const dx = this.position.x - other.position.x;
      const dy = this.position.y - other.position.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > 0 && distSq < SEPARATION_RADIUS * SEPARATION_RADIUS) {
        const dist = Math.sqrt(distSq);
        const force = (SEPARATION_RADIUS - dist) / SEPARATION_RADIUS;
        
        const pushX = (dx / dist) * force * PUSH_FORCE * dt;
        const pushY = (dy / dist) * force * PUSH_FORCE * dt;

        this.position.x += pushX;
        this.position.y += pushY;
      }
    }
  }

  public takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.hitFlashTimer = 0.08;
    this.lastHitTime = Date.now();
    if (this.hp <= 0) {
      this.active = false;
      return true; // Died
    }
    return false; // Still alive
  }

  public update(playerPos: Vector2, dt: number) {
    if (!this.active) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Apply Knockback Decay (Friction)
    if (Math.abs(this.knockbackVelocity.x) > 1 || Math.abs(this.knockbackVelocity.y) > 1) {
        this.position.x += this.knockbackVelocity.x * dt;
        this.position.y += this.knockbackVelocity.y * dt;
        
        const friction = 5.0; // Damping
        this.knockbackVelocity.x -= this.knockbackVelocity.x * friction * dt;
        this.knockbackVelocity.y -= this.knockbackVelocity.y * friction * dt;
    }

    // Stun Check
    if (this.stunTimer > 0) {
        this.stunTimer -= dt;
        return; // Skip AI Movement
    }

    // AI Movement (only if knockback is low, otherwise they are stunned/pushed)
    const kbSpeed = Math.sqrt(this.knockbackVelocity.x**2 + this.knockbackVelocity.y**2);
    if (kbSpeed < 50) {
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (this.type === 'boss') {
            if (distance > 0) {
                this.position.x += (dx / distance) * this.speed * dt;
                this.position.y += (dy / distance) * this.speed * dt;
            }
            this.handleBossBehavior(distance, dt);
        } else if (this.type === 'elite_shooter') {
            const KEEP_DISTANCE = 300;
            if (distance > KEEP_DISTANCE) {
                if (distance > 0) {
                    this.position.x += (dx / distance) * this.speed * dt;
                    this.position.y += (dy / distance) * this.speed * dt;
                }
            }
            this.handleShooterBehavior(dx, dy, dt);
        } else {
            // Standard Chase
            if (distance > 0) {
                this.position.x += (dx / distance) * this.speed * dt;
                this.position.y += (dy / distance) * this.speed * dt;
            }
        }
    }
  }
  
  private handleBossBehavior(dist: number, dt: number) {
      const now = Date.now();
      if (now - this.lastShootTime >= 3000) {
        if (this.onShoot) {
          const bulletCount = 16;
          const spacing = (Math.PI * 2) / bulletCount;
          const offset = (now / 1000) % (Math.PI * 2); 
          for (let i = 0; i < bulletCount; i++) {
            this.onShoot(this.position.x, this.position.y, (i * spacing) + offset, 24, '#ef4444');
          }
        }
        this.lastShootTime = now;
      }
  }

  private handleShooterBehavior(dx: number, dy: number, dt: number) {
      const now = Date.now();
      if (now - this.lastShootTime >= 2000) {
        if (this.onShoot) {
          const baseAngle = Math.atan2(dy, dx);
          const spread = 0.2;
          this.onShoot(this.position.x, this.position.y, baseAngle - spread);
          this.onShoot(this.position.x, this.position.y, baseAngle);
          this.onShoot(this.position.x, this.position.y, baseAngle + spread);
        }
        this.lastShootTime = now;
      }
  }

  public stun(duration: number) {
      if (this.type === 'boss') return; // Boss is immune to stun
      this.stunTimer = Math.max(this.stunTimer, duration);
  }

  public draw(ctx: CanvasRenderingContext2D, screenCenter: Vector2, playerPos: Vector2) {
    if (!this.active) return;

    let screenX = (this.position.x - playerPos.x) + screenCenter.x;
    let screenY = (this.position.y - playerPos.y) + screenCenter.y;
    
    // Stun Vibration
    if (this.stunTimer > 0) {
        screenX += (Math.random() - 0.5) * 4;
        screenY += (Math.random() - 0.5) * 4;
    }

    // Visually larger than hitbox
    const size = this.radius * 2.5; 
    
    if (screenX < -size || screenX > ctx.canvas.width + size || screenY < -size || screenY > ctx.canvas.height + size) return;

    let spriteKey = this.type;
    if (this.type === 'elite_shooter') spriteKey = 'elite_shooter';
    
    const sprite = AssetGenerator.getInstance().sprites[spriteKey] || AssetGenerator.getInstance().sprites['basic'];

    if (sprite) {
        ctx.save();
        ctx.translate(screenX, screenY);
        if (playerPos.x < this.position.x) ctx.scale(-1, 1);
        
        ctx.drawImage(sprite, -size/2, -size/2, size, size);
        
        if (this.hitFlashTimer > 0) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = 'white';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(-size/2, -size/2, size, size);
        } else if (this.stunTimer > 0) {
            // Stun Visual (Yellow Tint / Blink)
            ctx.globalCompositeOperation = 'source-atop';
            // Blink faster
            ctx.fillStyle = Math.floor(Date.now() / 50) % 2 === 0 ? '#fef08a' : '#facc15'; // Light Yellow / Yellow
            ctx.globalAlpha = 0.6;
            ctx.fillRect(-size/2, -size/2, size, size);
        }
        
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
    }
    
    // Debug Hitbox
    // ctx.strokeStyle='red'; ctx.beginPath(); ctx.arc(screenX, screenY, this.radius, 0, Math.PI*2); ctx.stroke();

    // Health Bar Logic
    if (this.type === 'boss' || Date.now() - this.lastHitTime < 2000) {
        const isBoss = this.type === 'boss';
        
        // Configuration
        const barWidth = isBoss ? 60 : 32; // Boss is wider
        const barHeight = isBoss ? 10 : 5; // Boss is thicker
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        const yOffset = isBoss ? 25 : 12;

        // Position: Above the sprite (size is calculated earlier as radius * 2.5)
        const barX = screenX - barWidth / 2;
        const barY = screenY - (size / 2) - yOffset;

        // 1. Border (Stroke) - Tang Tang Style (1px black outline)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = isBoss ? 2 : 1; 
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // 2. Background (Black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 3. Fill (Color)
        // Boss: Purple (Tang Tang Boss Style), Mob: Red
        ctx.fillStyle = isBoss ? '#a855f7' : '#ef4444'; 
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
  }
}
