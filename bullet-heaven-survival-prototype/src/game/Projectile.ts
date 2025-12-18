import { Vector2 } from './types';
import { AssetGenerator } from './AssetGenerator';

export type ProjectileBehavior = 'linear' | 'boomerang' | 'orbit' | 'gravity' | 'stationary' | 'bounce';

export class Projectile {
  public position: Vector2 = { x: 0, y: 0 };
  public velocity: Vector2 = { x: 0, y: 0 };
  public active: boolean = false;
  
  public damage: number = 10;
  public size: number = 8;
  public speed: number = 600;
  public color: string = '#fde047';
  public visualType: string = ''; // Key for AssetGenerator
  public pierce: number = 1;
  public behavior: ProjectileBehavior = 'linear';
  public owner: any = null;
  
  public boomerangState: 'out' | 'return' = 'out';
  public orbitAngle: number = 0;
  public orbitRadius: number = 100;
  public orbitSpeed: number = 5;
  public gravity: number = 0;
  public bounces: number = 0;
  public lastHitId: number = -1;
  public rotation: number = 0;
  
  public damageInterval: number = 0;
  public hitTimers: Map<number, number> = new Map();

  public lifeTime: number = 0;
  public maxLifeTime: number = 2;
  
  public onDespawn: ((x: number, y: number) => void) | null = null;

  constructor() {}

  public spawn(x: number, y: number, direction: Vector2, config: any) {
    this.position.x = x;
    this.position.y = y;
    
    this.damage = config.damage;
    this.speed = config.speed;
    this.size = config.size || 8;
    this.color = config.color || '#fde047';
    this.visualType = config.visualType || '';
    this.behavior = config.behavior || 'linear';
    this.pierce = config.pierce ?? 1;
    this.maxLifeTime = config.maxLifeTime || 2;
    this.owner = config.owner;
    
    this.lifeTime = 0;
    this.active = true;
    this.onDespawn = null;
    this.boomerangState = 'out';
    this.lastHitId = -1;
    this.hitTimers.clear();
    this.damageInterval = config.damageInterval || 0;

    if (this.behavior === 'orbit') {
      this.orbitAngle = Math.atan2(direction.y, direction.x);
      this.orbitRadius = config.orbitRadius || 100;
      this.orbitSpeed = config.orbitSpeed || 2;
    } else {
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (length > 0) {
        this.velocity.x = (direction.x / length) * this.speed;
        this.velocity.y = (direction.y / length) * this.speed;
      } else {
        this.velocity.x = this.speed;
        this.velocity.y = 0;
      }
    }

    if (this.behavior === 'gravity') {
      this.gravity = config.gravity || 1000;
      // Arc throw: Give it upward initial velocity
      this.velocity.y = -300; 
    }
    
    // Reset rotation
    this.rotation = 0;
    
    if (this.behavior === 'bounce') {
      this.bounces = config.bounces || 0;
    }
  }

  public update(dt: number) {
    if (!this.active) return;

    this.lifeTime += dt;
    if (this.lifeTime >= this.maxLifeTime) {
      this.deactivate();
      return;
    }

    switch (this.behavior) {
      case 'linear':
      case 'bounce':
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        break;

      case 'gravity':
        this.velocity.y += this.gravity * dt;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.rotation += dt * 10; // Spin while flying
        break;

      case 'boomerang':
        if (this.boomerangState === 'out') {
          this.position.x += this.velocity.x * dt;
          this.position.y += this.velocity.y * dt;
          if (this.lifeTime > this.maxLifeTime * 0.4) this.boomerangState = 'return';
        } else {
          if (this.owner) {
            const dx = this.owner.x - this.position.x;
            const dy = this.owner.y - this.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const returnSpeed = this.speed * 1.5;
            
            if (dist < 10) this.deactivate();
            else {
              this.position.x += (dx / dist) * returnSpeed * dt;
              this.position.y += (dy / dist) * returnSpeed * dt;
            }
          }
        }
        break;

      case 'orbit':
        if (this.owner) {
          this.orbitAngle += this.orbitSpeed * dt;
          this.position.x = this.owner.x + Math.cos(this.orbitAngle) * this.orbitRadius;
          this.position.y = this.owner.y + Math.sin(this.orbitAngle) * this.orbitRadius;
        }
        break;
    }
  }
  
  public deactivate() {
    this.active = false;
    if (this.onDespawn) this.onDespawn(this.position.x, this.position.y);
  }

  public draw(ctx: CanvasRenderingContext2D, screenCenter: Vector2, playerPos: Vector2, performanceMode: boolean = false) {
    if (!this.active) return;

    const screenX = (this.position.x - playerPos.x) + screenCenter.x;
    const screenY = (this.position.y - playerPos.y) + screenCenter.y;

    if (screenX < -50 || screenX > ctx.canvas.width + 50 || 
        screenY < -50 || screenY > ctx.canvas.height + 50) return;

    if (performanceMode) {
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
        return;
    }
    
    const assets = AssetGenerator.getInstance().sprites;
    const sprite = this.visualType ? assets[this.visualType] : null;

    if (sprite) {
        ctx.save();
        ctx.translate(screenX, screenY);

        // Apply visual rotation based on type
        if (this.visualType === 'proj_rocket' || this.visualType === 'proj_bullet') {
             // Face velocity
             ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x));
        } else if (this.visualType === 'proj_soccer') {
             ctx.rotate(this.lifeTime * 15);
        } else if (this.visualType === 'proj_boomerang') {
             ctx.rotate(this.lifeTime * 20);
        } else if (this.visualType === 'proj_guardian') {
             // Guardian already handles orbit rotation in update(), but this is self-rotation
             ctx.rotate(this.lifeTime * 10);
        } else if (this.visualType === 'proj_molotov') {
             ctx.rotate(this.rotation); // Use physical rotation
        }
        // Brick doesn't rotate

        // Draw Centered
        // Scale sprite if needed? Assuming sprites are 32x32 and size is relevant
        const scale = this.size / 24; // Base scale
        ctx.scale(scale, scale);
        ctx.drawImage(sprite, -sprite.width/2, -sprite.height/2);

        ctx.restore();
        return;
    }

    // Fallback Drawing (Original Logic)
    // Draw with thick outline (Cartoon Style)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2d2d2d';
    ctx.fillStyle = this.color;

    if (this.behavior === 'orbit') {
      // Shuriken / Spinner
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(this.lifeTime * 15);
      
      ctx.beginPath();
      // Draw 4-point Star
      for(let i=0; i<4; i++) {
          ctx.rotate(Math.PI/2);
          ctx.moveTo(0, -this.size);
          ctx.quadraticCurveTo(this.size/2, -this.size/2, this.size, 0);
          ctx.quadraticCurveTo(this.size/2, this.size/2, 0, this.size);
      }
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    } else if (this.behavior === 'boomerang') {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(this.lifeTime * 20);
      
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.quadraticCurveTo(0, -12, 8, -8);
      ctx.quadraticCurveTo(0, 8, -8, -8);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
    } else if (this.behavior === 'gravity') {
       // Brick / Rock
       ctx.fillRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
       ctx.strokeRect(screenX - this.size/2, screenY - this.size/2, this.size, this.size);
    } else if (this.behavior === 'stationary') {
       // Fire Puddle (Fire Zone) - ONLY for Molotov (visualType === 'fire_zone')
       
       const isFireZone = this.visualType === 'fire_zone';

       if (isFireZone) {
           // Pulsing Effect
           const pulse = 0.8 + Math.sin(this.lifeTime * 10) * 0.2; // 0.6 to 1.0
           ctx.globalAlpha = pulse;
           
           // Use Pattern if available
           const pattern = AssetGenerator.getInstance().generateFireZonePattern();
           if (pattern) {
               ctx.save();
               ctx.translate(screenX, screenY);
               ctx.fillStyle = pattern;
               ctx.beginPath();
               ctx.arc(0, 0, this.size, 0, Math.PI * 2);
               ctx.fill();
               
               // Glow ring
               ctx.strokeStyle = '#f97316';
               ctx.lineWidth = 2;
               ctx.stroke();
               ctx.restore();
           } else {
               // Fallback
               ctx.beginPath();
               ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
               ctx.fillStyle = '#ef4444';
               ctx.fill();
           }
           ctx.globalAlpha = 1.0;
       } else {
           // Generic Stationary (Explosions, etc.)
           ctx.beginPath();
           ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
           ctx.fillStyle = this.color;
           ctx.fill();
           // Optional: Flash/Fade out logic could go here
       }
    } else {
      // Standard Bullet (Round)
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export class EnemyProjectile {
  public position: Vector2 = { x: 0, y: 0 };
  public velocity: Vector2 = { x: 0, y: 0 };
  public active: boolean = false;
  public damage: number = 10;
  public size: number = 8;
  public color: string = '#ef4444';
  
  private lifeTime: number = 0;
  private readonly MAX_LIFETIME: number = 4;

  constructor() {}

  public spawn(x: number, y: number, velocity: Vector2, damage: number, size: number = 8, color: string = '#ef4444') {
    this.position.x = x;
    this.position.y = y;
    this.velocity = velocity;
    this.damage = damage;
    this.size = size;
    this.color = color;
    this.active = true;
    this.lifeTime = 0;
  }

  public update(dt: number) {
    if (!this.active) return;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.lifeTime += dt;
    if (this.lifeTime >= this.MAX_LIFETIME) this.active = false;
  }

  public draw(ctx: CanvasRenderingContext2D, screenCenter: Vector2, playerPos: Vector2) {
    if (!this.active) return;
    const screenX = (this.position.x - playerPos.x) + screenCenter.x;
    const screenY = (this.position.y - playerPos.y) + screenCenter.y;

    ctx.fillStyle = this.color; 
    ctx.strokeStyle = '#2d2d2d'; 
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
