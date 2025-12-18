import { WeaponStats, WeaponType, Vector2, EnemyType, EvolutionRecipe, PassiveType, PlayerStats } from './types';
import { QuadTree } from './QuadTree';
import { Projectile, ProjectileBehavior } from './Projectile';

// Interface to interact with the Game world without circular imports
export interface GameContext {
  playerPos: Vector2;
  playerStats: PlayerStats;
  activeEnemies: any[]; // Enemy[]
  activeProjectiles: Projectile[];
  projectilePool: any; // ObjectPool<Projectile>
  spawnProjectile: (
    x: number, y: number, dir: Vector2, 
    config: any // Projectile Config
  ) => Projectile;
  findNearestEnemy: () => any | null;
  findBestTarget: (origin: Vector2, direction: Vector2) => any | null;
  addFloatingText: (x: number, y: number, text: string, color: string) => void;
  spawnParticles: (x: number, y: number, color: string, type?: 'circle' | 'shard') => void;
  drawLightning: (x1: number, y1: number, x2: number, y2: number, generation?: number) => void;
  findNeighbors: (x: number, y: number, radius: number) => any[]; // New for Chain Lightning
  quadTree: QuadTree;
  width: number;
  height: number;
}

import { Synthesizer } from './Synthesizer';

export const EVOLUTION_RECIPES: EvolutionRecipe[] = [
  { weapon: 'molotov', passive: 'he_fuel', result: 'inferno' },
  { weapon: 'guardian', passive: 'energy_cube', result: 'destroyer' }
];

export abstract class Weapon {
  public stats: WeaponStats;
  protected cooldownTimer: number = 0;

  constructor(stats: WeaponStats) {
    this.stats = stats;
  }

  public update(dt: number, game: GameContext) {
    this.cooldownTimer -= dt * 1000;
    if (this.cooldownTimer <= 0) {
      this.fire(game);
      // Apply Cooldown Multiplier from Game
      const cdMult = game.playerStats.cooldownMultiplier || 1.0;
      this.cooldownTimer = this.stats.cooldown * cdMult;
    }
  }

  public abstract fire(game: GameContext): void;
  public abstract upgrade(): void;
  
  public getLevel(): number { return this.stats.level; }
}

// 1. Lightning Emitter
export class LightningWeapon extends Weapon {
  constructor() {
    super({
      id: 'lightning',
      name: 'Lightning Emitter',
      description: 'Strikes random enemies with chain lightning.',
      level: 1,
      damage: 18,
      area: 300, // Bounce radius
      speed: 0,
      duration: 0.2,
      cooldown: 2250,
      amount: 2 // Max targets
    });
  }

  public fire(game: GameContext) {
    // 1. Pick initial target
    let target = null;
    const visibleEnemies = game.activeEnemies.filter(e => {
         const dx = e.position.x - game.playerPos.x;
         const dy = e.position.y - game.playerPos.y;
         return Math.abs(dx) < game.width/2 && Math.abs(dy) < game.height/2;
    });

    if (visibleEnemies.length > 0) {
      target = visibleEnemies[Math.floor(Math.random() * visibleEnemies.length)];
    }

    if (target) {
        this.strikeTarget(game, target, this.stats.amount, []);
    }
  }

  private strikeTarget(game: GameContext, target: any, bouncesLeft: number, hitList: number[]) {
      // 1. Damage & Stun
      target.takeDamage(this.stats.damage);
      if (typeof target.stun === 'function') target.stun(0.5);
      game.addFloatingText(target.position.x, target.position.y - 20, this.stats.damage.toString(), '#3b82f6');
      
      hitList.push(target.uid);

      // 2. Find Next Target (Chain)
      if (bouncesLeft > 0) {
          const neighbors = game.findNeighbors(target.position.x, target.position.y, this.stats.area);
          
          let nearest = null;
          let minDistSq = Infinity;
          
          for (const neighbor of neighbors) {
              if (hitList.includes(neighbor.uid)) continue;
              if (!neighbor.active) continue;
              
              const dx = neighbor.position.x - target.position.x;
              const dy = neighbor.position.y - target.position.y;
              const distSq = dx*dx + dy*dy;
              
              if (distSq < minDistSq) {
                  minDistSq = distSq;
                  nearest = neighbor;
              }
          }
          
          if (nearest) {
              // Visual: Chain
              game.drawLightning(target.position.x, target.position.y, nearest.position.x, nearest.position.y);
              // Recursive Call
              this.strikeTarget(game, nearest, bouncesLeft - 1, hitList);
          } else {
              // Visual: Ground (No chain target)
              game.drawLightning(target.position.x, target.position.y - 300, target.position.x, target.position.y);
          }
      } else {
          // Visual: Initial Strike (First hit only? No, this is recursive. We need to handle first visual differently?)
          // Actually, if it's the first call (how to know?), we draw from sky?
          // Let's modify logic:
          // The `fire` method draws the first bolt from Sky -> Target.
          // Then calls `strikeTarget` for bounces.
      }
  }
  
  public fire(game: GameContext) {
    // 1. Pick initial target (Random visible enemy)
    const visibleEnemies = game.activeEnemies.filter(e => {
        const dx = e.position.x - game.playerPos.x;
        const dy = e.position.y - game.playerPos.y;
        return Math.abs(dx) < game.width/2 && Math.abs(dy) < game.height/2;
    });

    if (visibleEnemies.length === 0) return;
    
    // First target: Random or Nearest? Logic says Random visible.
    const firstTarget = visibleEnemies[Math.floor(Math.random() * visibleEnemies.length)];
    
    // Draw Sky Bolt (Generation 0)
    game.drawLightning(firstTarget.position.x, firstTarget.position.y - 400, firstTarget.position.x, firstTarget.position.y, 0);
    
    // Start Chain
    this.processChain(game, firstTarget);
  }

  private processChain(game: GameContext, startTarget: any) {
    let current = startTarget;
    let bounces = Math.max(0, this.stats.amount - 1); // Amount is total targets
    
    // 1. Initial Hit (100% Damage)
    let currentDamage = this.stats.damage;
    
    const visited = new Set<number>();
    
    // Hit first target
    this.applyHit(game, current, currentDamage);
    visited.add(current.uid);

    // 2. Prepare Decay for Chain (80%)
    currentDamage = Math.floor(currentDamage * 0.8);

    let generation = 1;

    while (bounces > 0 && current && currentDamage >= 1) { // Stop if damage is too low
        // Spatial Query: 300px range around current target
        const range = {
            x: current.position.x - 150,
            y: current.position.y - 150,
            width: 300,
            height: 300
        };

        const candidates = game.quadTree.query(range);
        
        let nextTarget = null;
        let minDistSq = Infinity;

        // Find NEAREST unhit neighbor
        for (const candidate of candidates) {
            if (!candidate.active || visited.has(candidate.uid)) continue;
            
            const dx = candidate.position.x - current.position.x;
            const dy = candidate.position.y - current.position.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq < this.stats.area * this.stats.area && distSq < minDistSq) {
                minDistSq = distSq;
                nextTarget = candidate;
            }
        }

        if (nextTarget) {
            // Visual: Connect A -> B (Tapering width handled in Game.ts via generation)
            game.drawLightning(current.position.x, current.position.y, nextTarget.position.x, nextTarget.position.y, generation);
            
            // Hit Next Target with Decayed Damage
            this.applyHit(game, nextTarget, currentDamage);
            visited.add(nextTarget.uid);
            
            // Decay for next bounce (20% reduction)
            currentDamage = Math.floor(currentDamage * 0.8);
            
            current = nextTarget;
            bounces--;
            generation++;
        } else {
            // No valid targets nearby, break chain
            break;
        }
    }
  }

  private applyHit(game: GameContext, target: any, damage: number) {
      target.takeDamage(damage);
      if (typeof target.stun === 'function') target.stun(0.5);
      game.addFloatingText(target.position.x, target.position.y - 20, damage.toString(), '#3b82f6');
  }

  public upgrade() {
    this.stats.level++;
    switch (this.stats.level) {
      case 2:
        this.stats.damage = 22;
        this.stats.amount = 3;
        break;
      case 3:
        this.stats.damage = 27;
        this.stats.amount = 4;
        break;
      case 4:
        this.stats.damage = 31;
        this.stats.amount = 5;
        break;
      case 5:
        this.stats.damage = 36;
        this.stats.amount = 6;
        break;
    }
  }
}

// 2. Boomerang
export class BoomerangWeapon extends Weapon {
  constructor() {
    super({
      id: 'boomerang',
      name: 'Boomerang',
      description: 'Throws a boomerang that returns.',
      level: 1,
      damage: 24,
      area: 1.0, // Size multiplier
      speed: 280,
      duration: 2,
      cooldown: 1800,
      amount: 1
    });
  }

  public fire(game: GameContext) {
    const target = game.findBestTarget(game.playerPos, {x:0, y:0});
    let baseDir = { x: 1, y: 0 };
    
    if (target) {
      baseDir = { x: target.position.x - game.playerPos.x, y: target.position.y - game.playerPos.y };
    } else {
      const angle = Math.random() * Math.PI * 2;
      baseDir = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    // Normalize baseDir to calculate offsets
    const len = Math.sqrt(baseDir.x * baseDir.x + baseDir.y * baseDir.y);
    const normDir = { x: baseDir.x / (len || 1), y: baseDir.y / (len || 1) };

    for (let i = 0; i < this.stats.amount; i++) {
        // Calculate spread (e.g., -15 deg, +15 deg)
        const spreadAngle = 0.3; // ~17 degrees
        const totalSpread = spreadAngle * (this.stats.amount - 1);
        const startAngle = -totalSpread / 2;
        const currentAngleOffset = startAngle + (i * spreadAngle);

        const cos = Math.cos(currentAngleOffset);
        const sin = Math.sin(currentAngleOffset);
        const finalDir = {
            x: normDir.x * cos - normDir.y * sin,
            y: normDir.x * sin + normDir.y * cos
        };

        game.spawnProjectile(game.playerPos.x, game.playerPos.y, finalDir, {
            damage: this.stats.damage,
            speed: this.stats.speed,
            behavior: 'boomerang',
            pierce: 999,
            owner: game.playerPos,
            size: 16 * this.stats.area,
            color: '#fb923c',
            visualType: 'proj_boomerang',
            maxLifeTime: this.stats.duration
        });
    }
  }

  public upgrade() {
    this.stats.level++;
    switch (this.stats.level) {
      case 2:
        this.stats.damage = 24;
        this.stats.amount = 2;
        break;
      case 3:
        this.stats.damage = 48; // Double Damage!
        this.stats.amount = 2;
        break;
      case 4:
        this.stats.damage = 48;
        this.stats.amount = 2;
        this.stats.area = 1.2; // Area up
        break;
      case 5:
        this.stats.damage = 60;
        this.stats.amount = 2;
        this.stats.area = 1.5; // Area max
        break;
    }
  }
}

// 3. Molotov
export class MolotovWeapon extends Weapon {
  constructor() {
    super({
      id: 'molotov',
      name: 'Molotov',
      description: 'Throws a fire bomb that burns an area.',
      level: 1,
      damage: 6, // DoT
      area: 60, // Zone radius
      speed: 210, // Throw speed
      duration: 3, // Zone duration
      cooldown: 3750,
      amount: 2
    });
  }

  public fire(game: GameContext) {
    // Throw in random directions or towards enemies
    for (let i = 0; i < this.stats.amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        
        const proj = game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
            damage: 0, // No impact damage
            speed: this.stats.speed,
            behavior: 'gravity',
            pierce: 1,
            gravity: 400, // Simple gravity arc
            color: '#ef4444',
            size: 10,
            visualType: 'proj_molotov',
            maxLifeTime: 0.8 // Explodes quickly
        });
        
        // Initial "Up" velocity for arc
        proj.velocity.y = -200; 

        // On Impact (Despawn), create Fire Zone
        proj.onDespawn = (x, y) => {
             // 1. Play Sound
             Synthesizer.getInstance().playGlassBreak();
             
             // 2. Spawn Glass Shards (Particles)
             // We can spawn multiple times to create a burst
             game.spawnParticles(x, y, '#d1d5db', 'shard'); // Grey/White glass
             game.spawnParticles(x, y, '#fca5a5', 'shard'); // Red liquid bits
             
             // 3. Spawn Fire Zone
             game.spawnProjectile(x, y, {x:0, y:0}, {
                 damage: this.stats.damage,
                 speed: 0,
                 behavior: 'stationary',
                 pierce: 999,
                 color: '#f87171',
                 size: this.stats.area,
                 maxLifeTime: this.stats.duration,
                 visualType: 'fire_zone',
                 damageInterval: 500
                 // Note: Needs logic in Game.ts to deal DoT for stationary projectiles
                 // And remove poison zones
             });
        };
    }
  }

  public upgrade() {
    this.stats.level++;
    switch (this.stats.level) {
      case 2:
        this.stats.damage = 8;
        this.stats.amount = 3;
        break;
      case 3:
        this.stats.damage = 9;
        this.stats.amount = 4;
        break;
      case 4:
        this.stats.damage = 11;
        this.stats.amount = 5;
        break;
      case 5:
        this.stats.damage = 12;
        this.stats.amount = 6;
        break;
    }
  }
}

// 4. Guardian
export class GuardianWeapon extends Weapon {
  private projectiles: Projectile[] = [];

  constructor() {
    super({
      id: 'guardian',
      name: 'Guardian',
      description: 'Spins around the player.',
      level: 1,
      damage: 5,
      area: 80, // Orbit radius
      speed: 3, // Rotation speed
      duration: 4, // Active time
      cooldown: 3000, // Wait time after despawn (unless max level)
      amount: 2 // Number of spinners
    });
  }

  // Override update to handle permanent state at max level
  public update(dt: number, game: GameContext) {
     if (this.stats.level >= 5) {
         // Permanent
         this.stats.duration = 9999;
         this.stats.cooldown = 0;
     }

     // Logic: Ensure X spinners are active
     // Filter dead ones
     this.projectiles = this.projectiles.filter(p => p.active);
     
     // Only respawn if we need to and cooldown is ready (or if permanent)
     if (this.projectiles.length < this.stats.amount && (this.stats.level >= 5 || this.cooldownTimer <= 0)) {
        if (this.stats.level < 5) {
             // Normal cycle: wait for cooldown then spawn all
             if (this.projectiles.length === 0) {
                 this.fire(game);
                 // Apply Cooldown Multiplier
                 const cdMult = game.playerStats.cooldownMultiplier || 1.0;
                 this.cooldownTimer = this.stats.cooldown * cdMult;
             }
        } else {
            // Permanent: just keep spawning if missing
            this.fire(game);
        }
     } else if (this.stats.level < 5) {
        this.cooldownTimer -= dt * 1000;
     }
  }

  public fire(game: GameContext) {
    const needed = this.stats.amount - this.projectiles.length;
    if (needed <= 0) return;

    const spacing = (Math.PI * 2) / this.stats.amount;
    for (let i = 0; i < needed; i++) {
        // Find first open slot or just append?
        // Simple logic: just add based on current count + i
        const idx = this.projectiles.length + i;
        const angle = idx * spacing;
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        
        const p = game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
            damage: this.stats.damage,
            speed: 0,
            behavior: 'orbit',
            pierce: 999,
            owner: game.playerPos,
            orbitRadius: this.stats.area,
            orbitSpeed: this.stats.speed,
            maxLifeTime: this.stats.duration,
            size: 12,
            visualType: 'proj_guardian',
            color: '#fbbf24'
        });
        
        // Manual override of angle
        p.orbitAngle = angle;
        this.projectiles.push(p);
    }
  }

  public upgrade() {
    this.stats.level++;
    this.stats.speed += 0.5; // Speed up
    switch (this.stats.level) {
      case 2:
        this.stats.damage = 6;
        this.stats.amount = 3;
        break;
      case 3:
        this.stats.damage = 7;
        this.stats.amount = 4;
        break;
      case 4:
        this.stats.damage = 9;
        this.stats.amount = 5;
        break;
      case 5:
        this.stats.damage = 9;
        this.stats.amount = 6;
        break;
    }
  }
}

// 5. Brick
export class BrickWeapon extends Weapon {
  constructor() {
    super({
      id: 'brick',
      name: 'Brick',
      description: 'Throws a heavy brick upwards.',
      level: 1,
      damage: 20,
      area: 1, 
      speed: 0, // Horizontal speed
      duration: 3,
      cooldown: 1500,
      amount: 1
    });
  }

  public fire(game: GameContext) {
     game.spawnProjectile(game.playerPos.x, game.playerPos.y - 40, {x:0, y:-1}, {
         damage: this.stats.damage,
         speed: 0, // Mostly vertical
         behavior: 'gravity',
         pierce: 999,
         gravity: 1500,
         size: 16,
         color: '#9f1239', // Dark red
         visualType: 'proj_brick',
         maxLifeTime: 3
     }).velocity.y = -600; // Throw UP hard
  }

  public upgrade() {
    this.stats.level++;
    this.stats.damage += 10;
    this.stats.area += 0.2; // Size
  }
}

// 6. Soccer Ball
export class SoccerBallWeapon extends Weapon {
  constructor() {
    super({
      id: 'soccer',
      name: 'Soccer Ball',
      description: 'Bounces between enemies.',
      level: 1,
      damage: 25,
      area: 1,
      speed: 350,
      duration: 5,
      cooldown: 3000,
      amount: 1
    });
  }

  public fire(game: GameContext) {
    const target = game.findBestTarget(game.playerPos, {x:0, y:0});
    const dir = target 
       ? { x: target.position.x - game.playerPos.x, y: target.position.y - game.playerPos.y }
       : { x: Math.random() - 0.5, y: Math.random() - 0.5 };

    game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
        damage: this.stats.damage,
        speed: this.stats.speed,
        behavior: 'bounce',
        pierce: 3 + Math.floor(this.stats.level / 2),
        bounces: 3 + this.stats.level, // Reuse pierce or dedicated bounce count
        size: 14,
        color: '#ffffff',
        visualType: 'proj_soccer'
    });
  }

  public upgrade() {
    this.stats.level++;
    this.stats.damage += 5;
    this.stats.speed += 50;
  }
}

// 7. Rocket
export class RocketWeapon extends Weapon {
  constructor() {
    super({
      id: 'rocket',
      name: 'Rocket',
      description: 'Explodes on impact.',
      level: 1,
      damage: 30,
      area: 80, // Explosion radius
      speed: 420, // Faster for bullet feel
      duration: 3,
      cooldown: 3750,
      amount: 1
    });
  }

  public fire(game: GameContext) {
    const target = game.findBestTarget(game.playerPos, {x:0, y:0});
    
    if (!target) return; 

    const dx = target.position.x - game.playerPos.x;
    const dy = target.position.y - game.playerPos.y;
    const dir = { x: dx, y: dy };

    const proj = game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
        damage: this.stats.damage,
        speed: this.stats.speed,
        behavior: 'linear',
        pierce: 1,
        size: 24, // Bigger size for Bullet visual
        color: '#ffff00', // Neon Yellow
        visualType: 'proj_bullet'
    });

    proj.onDespawn = (x, y) => {
        // Spawn Explosion Visual/Damage
        // For simplicity, we create a short-lived "Stationary" projectile that hits once
        game.spawnProjectile(x, y, {x:0, y:0}, {
            damage: this.stats.damage, // AoE damage
            speed: 0,
            behavior: 'stationary',
            pierce: 999,
            size: this.stats.area, // Radius
            maxLifeTime: 0.1, // 1 frame basically
            color: '#fcd34d' // Explosion color
        });
    };
  }

  public upgrade() {
    this.stats.level++;
    this.stats.damage += 10;
    this.stats.area += 20;
  }
}

// 7.5 Pistol (Reimagined as Kunai - Hardcore Nerf)
export class PistolWeapon extends Weapon {
  constructor() {
    super({
      id: 'pistol',
      name: 'Kunai',
      description: 'Hardcore Mode: Weak & Slow starting weapon.',
      level: 1,
      damage: 12, // Nerfed from 15/25 -> 12 (Hardcore)
      area: 1.0, 
      speed: 300, // Nerfed from 700 -> 300 (Slow projectile)
      duration: 3,
      cooldown: 1200, // Nerfed from 300ms -> 1200ms (1.2s cooldown)
      amount: 1,
      pierce: 1, 
      isEvolved: false
    });
  }

  public fire(game: GameContext) {
    const target = game.findNearestEnemy();
    if (!target) return;

    const dx = target.position.x - game.playerPos.x;
    const dy = target.position.y - game.playerPos.y;
    const baseAngle = Math.atan2(dy, dx);

    for (let i = 0; i < this.stats.amount; i++) {
        // Spread logic: e.g., -10 deg, 0, +10 deg
        // Formula: (i - (amount - 1) / 2) * spread_angle
        const spreadStep = 0.15; // ~8.5 degrees spacing
        const spread = (i - (this.stats.amount - 1) / 2) * spreadStep; 
        const angle = baseAngle + spread;
        
        // Pierce 999 if Evolved (Spirit Shuriken)
        const currentPierce = this.stats.isEvolved ? 999 : 1;
        const currentColor = this.stats.isEvolved ? '#a78bfa' : '#fde047'; // Purple if Evo, Yellow if Kunai

        game.spawnProjectile(game.playerPos.x, game.playerPos.y, {x: Math.cos(angle), y: Math.sin(angle)}, {
            damage: this.stats.damage,
            speed: this.stats.speed,
            behavior: 'linear',
            pierce: currentPierce,
            size: 10, 
            color: currentColor,
            visualType: 'proj_bullet' // Using standard bullet visual for now
        });
    }
  }

  public upgrade() {
    this.stats.level++;
    switch (this.stats.level) {
      case 2:
        this.stats.damage = 24; // Double damage (12->24)
        break;
      case 3:
        this.stats.damage = 48; // Double damage (24->48)
        break;
      case 4:
        this.stats.damage = 96; // Double damage (48->96)
        break;
      case 5:
        this.stats.damage = 192; // Double damage (96->192)
        break;
      case 6: // EVO
        this.stats.damage = 192; 
        this.stats.cooldown = 300; // Restore fast fire rate (1200ms -> 300ms)
        this.stats.speed = 700; // Restore speed
        this.stats.isEvolved = true;
        this.stats.name = "Spirit Shuriken";
        this.stats.description = "In and out like a ghost. Infinite pierce.";
        this.stats.pierce = 999;
        break;
    }
  }
}

// 8. Inferno (Evolved Molotov)
export class InfernoWeapon extends Weapon {
  constructor() {
    super({
      id: 'inferno',
      name: 'INFERNO',
      description: 'Evolved Molotov. Hellfire consumes everything.',
      level: 1,
      damage: 20, 
      area: 120, // Huge Zone
      speed: 400, 
      duration: 5, 
      cooldown: 1500,
      amount: 2,
      isEvolved: true
    });
  }

  public fire(game: GameContext) {
    for (let i = 0; i < this.stats.amount; i++) {
        // Spiral pattern or random
        const angle = Math.random() * Math.PI * 2;
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        
        const proj = game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
            damage: 0, 
            speed: this.stats.speed,
            behavior: 'gravity',
            pierce: 1,
            gravity: 400,
            color: '#b91c1c', // Dark Red
            size: 15,
            visualType: 'proj_molotov',
            maxLifeTime: 0.8
        });
        
        proj.velocity.y = -300; 

        proj.onDespawn = (x, y) => {
             game.spawnProjectile(x, y, {x:0, y:0}, {
                 damage: this.stats.damage,
                 speed: 0,
                 behavior: 'stationary',
                 pierce: 999,
                 color: '#7f1d1d', // Darker Red
                 size: this.stats.area,
                 maxLifeTime: this.stats.duration,
                 visualType: 'fire_zone',
                 damageInterval: 500
             });
        };
    }
  }

  public upgrade() {
    // Evolved weapons might just gain stats without "levels" or max out at 1
    // But for system consistency we allow leveling or cap it
    this.stats.level++;
    this.stats.damage += 5;
  }
}

// 9. Destroyer (Evolved Guardian)
export class DestroyerWeapon extends Weapon {
  private projectiles: Projectile[] = [];

  constructor() {
    super({
      id: 'destroyer',
      name: 'DESTROYER',
      description: 'Evolved Guardian. A vortex of destruction.',
      level: 1,
      damage: 30,
      area: 150, // Huge Orbit
      speed: 6, // Very Fast
      duration: 9999, // Permanent
      cooldown: 0, 
      amount: 4,
      isEvolved: true
    });
  }

  public update(dt: number, game: GameContext) {
     this.projectiles = this.projectiles.filter(p => p.active);
     
     if (this.projectiles.length < this.stats.amount) {
        this.fire(game);
     }
  }

  public fire(game: GameContext) {
    const needed = this.stats.amount - this.projectiles.length;
    if (needed <= 0) return;

    const spacing = (Math.PI * 2) / this.stats.amount;
    for (let i = 0; i < needed; i++) {
        const idx = this.projectiles.length + i;
        const angle = idx * spacing;
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        
        const p = game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
            damage: this.stats.damage,
            speed: 0,
            behavior: 'orbit',
            pierce: 999,
            owner: game.playerPos,
            orbitRadius: this.stats.area,
            orbitSpeed: this.stats.speed,
            maxLifeTime: this.stats.duration,
            size: 20, // Bigger
            color: '#dc2626', // Red Orbit
            visualType: 'proj_guardian'
        });
        
        p.orbitAngle = angle;
        this.projectiles.push(p);
    }
  }

  public upgrade() {
    this.stats.level++;
    this.stats.damage += 10;
  }
}

// 10. Katana (New Melee/Ranged Hybrid)
export class KatanaWeapon extends Weapon {
  constructor() {
    super({
      id: 'katana',
      name: 'Katana',
      description: 'Shoots blade waves. Slice through enemies.',
      level: 1,
      damage: 25, 
      area: 1.0, 
      speed: 400, 
      duration: 3, 
      cooldown: 1000, // 1.0s
      amount: 1, // Number of directions
      pierce: 999, // Infinite pierce
      isEvolved: false
    });
  }

  public fire(game: GameContext) {
    const directions: Vector2[] = [];
    const facing = { x: game.playerPos.x > 0 ? 1 : -1, y: 0 }; // Determine facing from input? 
    // Actually GameContext doesn't provide input directly, but we can infer or use last move dir?
    // For now, let's use "Nearest Enemy" or "Mouse" logic? 
    // "Blade Wave" usually goes in facing direction.
    // Let's assume right facing default or use nearest enemy direction as "Front"
    
    let frontDir = { x: 1, y: 0 };
    const nearest = game.findNearestEnemy();
    if (nearest) {
        const dx = nearest.position.x - game.playerPos.x;
        const dy = nearest.position.y - game.playerPos.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0) frontDir = { x: dx/len, y: dy/len };
    }

    // Directions based on Level
    // Lv 1: Front
    // Lv 2: Front + Back
    // Lv 3: Front + Back + Up (assuming Up is relative or absolute?) -> Let's do Absolute Directions for simplicity?
    // No, relative to "Front" is cooler.
    // Let's do 4-Way slash pattern.
    
    // Front
    directions.push(frontDir);

    if (this.stats.level >= 2) {
        // Back
        directions.push({ x: -frontDir.x, y: -frontDir.y });
    }
    if (this.stats.level >= 3) {
        // Up (Perpendicular)
        directions.push({ x: frontDir.y, y: -frontDir.x }); // -90 deg
    }
    if (this.stats.level >= 4) {
        // Down
        directions.push({ x: -frontDir.y, y: frontDir.x }); // +90 deg
    }

    const color = this.stats.isEvolved ? '#ef4444' : '#60a5fa'; // Red vs Blue

    for (const dir of directions) {
        const proj = game.spawnProjectile(game.playerPos.x, game.playerPos.y, dir, {
            damage: this.stats.damage,
            speed: this.stats.speed,
            behavior: 'linear',
            pierce: this.stats.pierce,
            size: 24, 
            color: color, 
            visualType: 'proj_blade_wave',
            maxLifeTime: 0.8 // Short range
        });
        
        // Rotate projectile sprite to match direction
        proj.angle = Math.atan2(dir.y, dir.x);
    }
  }

  public upgrade() {
    this.stats.level++;
    switch (this.stats.level) {
      case 2:
        // +Back direction
        break;
      case 3:
        // +Up direction
        break;
      case 4:
        // +Down direction
        break;
      case 5:
        this.stats.damage = 50; // Double Damage
        break;
      case 6: // EVO
        this.stats.name = "Blade Dance";
        this.stats.description = "A storm of bloody slashes.";
        this.stats.damage = 60;
        this.stats.cooldown = 500; // 2x Attack Speed
        this.stats.area = 2.0; // 2x Size
        this.stats.isEvolved = true;
        break;
    }
  }
}

// Factory
export function createWeapon(type: WeaponType): Weapon {
    switch (type) {
        case 'lightning': return new LightningWeapon();
        case 'boomerang': return new BoomerangWeapon();
        case 'molotov': return new MolotovWeapon();
        case 'guardian': return new GuardianWeapon();
        case 'brick': return new BrickWeapon();
        case 'soccer': return new SoccerBallWeapon();
        case 'rocket': return new RocketWeapon();
        case 'pistol': return new PistolWeapon();
        case 'inferno': return new InfernoWeapon();
        case 'destroyer': return new DestroyerWeapon();
        case 'katana': return new KatanaWeapon();
        default: return new RocketWeapon();
    }
}

