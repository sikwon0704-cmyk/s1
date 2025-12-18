import { InputManager } from './InputManager';
import { Vector2, PlayerStats, UpgradeType, LootType, EnemyType, EnemyConfig, PoisonZone, UpgradeOption, WeaponType, GameState, MAX_WEAPON_SLOTS, MAX_PASSIVE_SLOTS } from './types';
import { ObjectPool } from './ObjectPool';
import { Enemy } from './Enemy';
import { Projectile, EnemyProjectile } from './Projectile';
import { Gem } from './Gem';
import { Particle, ParticleType } from './Particle';
import { QuadTree } from './QuadTree';
import { Weapon, createWeapon, GameContext, EVOLUTION_RECIPES } from './Weapon';
import { PASSIVE_ITEMS } from './Passives';
import { AssetGenerator } from './AssetGenerator';
import { Synthesizer } from './Synthesizer';
import { DataManager, ITEM_DATABASE } from './DataManager';
import { DamageText } from './DamageText';

// Enemy Configurations

const ENEMY_TYPES: Record<EnemyType, EnemyConfig> = {
  basic: {
    type: 'basic',
    hpMultiplier: 1.0,
    speedMultiplier: 1.0,
    sizeMultiplier: 1.0,
    color: '#86efac', 
    mass: 1.0
  },
  tank: {
    type: 'tank',
    hpMultiplier: 3.0,
    speedMultiplier: 0.6,
    sizeMultiplier: 1.5,
    color: '#60a5fa',
    mass: 10.0 // Heavy
  },
  speedy: {
    type: 'speedy',
    hpMultiplier: 0.5,
    speedMultiplier: 1.6,
    sizeMultiplier: 0.8,
    color: '#a78bfa',
    mass: 0.8
  },
  elite_shooter: {
    type: 'elite_shooter',
    hpMultiplier: 1.5,
    speedMultiplier: 0.8,
    sizeMultiplier: 1.2,
    color: '#f472b6',
    mass: 2.0
  },
  poisoner: {
    type: 'poisoner',
    hpMultiplier: 1.0,
    speedMultiplier: 1.3,
    sizeMultiplier: 1.0,
    color: '#a3e635', 
    mass: 1.0
  },
  boss: {
    type: 'boss',
    hpMultiplier: 50.0,
    speedMultiplier: 0.4,
    sizeMultiplier: 5.0,
    color: '#f87171',
    mass: 100.0 // Boss immunity
  }
};

interface LightningEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  generation: number;
}

export class Game implements GameContext {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning: boolean = false;
  public state: GameState = GameState.START;
  private lastTime: number = 0;
  private onUIUpdate: (stats: PlayerStats) => void;
  private onLevelUp: (options: UpgradeOption[]) => void;
  private onStateChange: (state: GameState) => void;
  
  public input: InputManager;
  public playerPos: Vector2 = { x: 0, y: 0 };
  public playerStats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    speed: 300, 
    magnetRange: 150,
    xp: 0,
    maxXp: 100,
    level: 1,
    score: 0,
    
    // Global Stats
    damageMultiplier: 1.0,
    durationMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    moveSpeedMultiplier: 1.0,
    magnetRadiusMultiplier: 1.0,
    gainMultiplier: 1.0,
    areaMultiplier: 1.0,
    bulletSpeedMultiplier: 1.0,

    projectileCount: 0,
    fireRate: 1.0,
    bulletSpeed: 1.0,
    damage: 1.0,
    critRate: 0.1,
    critDamage: 1.5,
    garlicLevel: 0,
    garlicRadius: 0,
    garlicDamage: 0,
    garlicInterval: 0
  };

  public activeWeapons: Weapon[] = [];
  public activePassives: Record<string, number> = {};
  public availableWeaponTypes: WeaponType[] = ['pistol', 'lightning', 'boomerang', 'molotov', 'guardian', 'brick', 'soccer', 'rocket'];
  public availablePassiveTypes: string[] = Object.keys(PASSIVE_ITEMS);

  private enemyPool: ObjectPool<Enemy>;
  public activeEnemies: Enemy[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 0.5; 
  private poisonZones: PoisonZone[] = [];
  private lastPoisonDamageTime: number = 0;
  public quadTree: QuadTree;

  public projectilePool: ObjectPool<Projectile>;
  public activeProjectiles: Projectile[] = [];

  private gemPool: ObjectPool<Gem>;
  private activeGems: Gem[] = [];
  
  private particlePool: Particle[] = [];
  
  // New: Damage Text Pool
  private damageTextPool: ObjectPool<DamageText>;
  private activeDamageTexts: DamageText[] = [];

  private enemyBullets: EnemyProjectile[] = [];

  // Visuals
  private playerSprite: HTMLCanvasElement;
  private playerFrame: number = 0;
  private playerAnimTimer: number = 0;
  private playerFacingRight: boolean = true;
  private playerHitFlashTimer: number = 0; // New: Flash effect timer
  private readonly PLAYER_SPRITE_SIZE = 32;

  private lightnings: LightningEffect[] = [];
  private waveMessage: string = "";
  private waveMessageTimer: number = 0;
  private lastWaveMinute: number = -1;

  private gameTime: number = 0; 
  private bossSpawned: boolean = false;
  private isBossAlive: boolean = false;
  
  // Boss Warning State
  private bossWarningActive: boolean = false;
  private bossWarningTimer: number = 0;
  
  // New: Poison Status Tracking
  private playerInPoisonZone: boolean = false;
  
  private readonly GRID_SIZE = 128; // Updated for new tile
  public readonly width: number;
  public readonly height: number;
  private readonly PLAYER_SIZE = 40;

  constructor(canvas: HTMLCanvasElement, input: InputManager, onUIUpdate: (stats: PlayerStats) => void, onLevelUp: (options: UpgradeOption[]) => void, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    const assets = AssetGenerator.getInstance();
    this.playerSprite = assets.sprites['player'];

    this.width = canvas.width;
    this.height = canvas.height;
    this.input = input;
    this.onUIUpdate = onUIUpdate;
    this.onLevelUp = onLevelUp;
    this.onStateChange = onStateChange;
    
    DataManager.load(); // Load Save Data

    this.quadTree = new QuadTree({ x: -1000, y: -1000, width: this.width + 2000, height: this.height + 2000 }, 4);

    this.enemyPool = new ObjectPool<Enemy>(
      () => new Enemy(),
      (enemy) => { enemy.active = true; } 
    );

    this.projectilePool = new ObjectPool<Projectile>(
      () => new Projectile(),
      (proj) => { proj.active = true; }
    );

    this.gemPool = new ObjectPool<Gem>(
      () => new Gem(),
      (gem) => { gem.active = true; }
    );
    
    this.damageTextPool = new ObjectPool<DamageText>(
      () => new DamageText(),
      (dt) => { dt.active = true; }
    );
    
    for (let i = 0; i < 200; i++) {
      this.particlePool.push(new Particle());
    }

    this.addWeapon('pistol');

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.onUIUpdate(this.playerStats);
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // @ts-ignore
    this.width = this.canvas.width;
    // @ts-ignore
    this.height = this.canvas.height;
  }

  public start() {
    Synthesizer.getInstance().init();

    if (this.state === GameState.START || this.state === GameState.GAMEOVER) {
        this.resetGame();
    }
    this.state = GameState.PLAYING;
    this.onStateChange(this.state);
    
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  public stop() {
    this.state = GameState.GAMEOVER;
    this.onStateChange(this.state);
    Synthesizer.getInstance().playGameOver();
    DataManager.save(); // Save progress
  }

  public togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.lastTime = performance.now();
    }
    this.onStateChange(this.state);
  }

  private loop(currentTime: number) {
    if (!this.isRunning) return;
    requestAnimationFrame((time) => this.loop(time));

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.state !== GameState.PLAYING) {
      this.render();
      return; 
    }

    this.update(deltaTime);
    this.render();
  }

  private resetGame() {
    // 1. Load Permanent Stats
    const perm = DataManager.data.permanentStats;
    const bonusHp = perm.baseHp * 10;

    // 2. Apply Base Stats
    this.playerStats.maxHp = 100 + bonusHp;
    this.playerStats.hp = this.playerStats.maxHp;
    this.playerStats.xp = 0;
    this.playerStats.level = 1;
    this.playerStats.score = 0;
    this.playerStats.maxXp = 100;
    this.gameTime = 0;
    
    // 3. Apply Multipliers from Permanent Stats
    this.playerStats.damageMultiplier = 1.0 + (perm.baseDamage * 0.05);
    this.playerStats.gainMultiplier = 1.0 + (perm.goldGain * 0.10);
    this.playerStats.moveSpeedMultiplier = 1.0 + (perm.moveSpeed * 0.05);
    this.playerStats.magnetRadiusMultiplier = 1.0 + ((perm.magnetRange || 0) * 0.10);
    // Reset others to 1.0 (they will be recalculated if we had passives, but this is full reset)
    this.playerStats.durationMultiplier = 1.0;
    this.playerStats.cooldownMultiplier = 1.0;
    this.playerStats.magnetRadiusMultiplier = 1.0;
    
    // 4. Apply Equipment Stats
    this.applyEquipmentStats();

    this.activeWeapons = [];
    this.activePassives = {};
    this.activeEnemies.forEach(e => this.enemyPool.release(e));
    this.activeEnemies = [];
    this.activeProjectiles.forEach(p => this.projectilePool.release(p));
    this.activeProjectiles = [];
    this.activeGems.forEach(g => this.gemPool.release(g));
    this.activeGems = [];
    this.activeDamageTexts.forEach(d => this.damageTextPool.release(d));
    this.activeDamageTexts = [];
    
    this.enemyBullets = [];
    
    // Equip Selected Weapon
    const startWeapon = DataManager.data.equippedItems?.weapon as WeaponType || 'pistol';
    this.addWeapon(startWeapon);
    
    this.onUIUpdate(this.playerStats);
  }

  private applyEquipmentStats() {
    const equipped = DataManager.data.equippedItems;
    if (!equipped) return;

    Object.values(equipped).forEach(itemId => {
        const item = ITEM_DATABASE[itemId];
        if (!item || !item.stats) return;
        
        const s = item.stats;
        if (s.hp) this.playerStats.maxHp += s.hp;
        if (s.damage) this.playerStats.damageMultiplier += s.damage;
        if (s.speed) this.playerStats.moveSpeedMultiplier += s.speed;
        if (s.cooldown) this.playerStats.cooldownMultiplier -= s.cooldown;
        if (s.crit) this.playerStats.critRate += s.crit;
        if (s.critDamage) this.playerStats.critDamage += s.critDamage;
    });
    
    // Re-clamp HP
    this.playerStats.hp = this.playerStats.maxHp;
  }

  private update(dt: number) {
    this.gameTime += dt;
    const moveDir = this.input.getMovementVector();
    
    const isMoving = moveDir.x !== 0 || moveDir.y !== 0;
    if (moveDir.x !== 0) this.playerFacingRight = moveDir.x > 0;

    this.playerAnimTimer += dt;
    if (this.playerAnimTimer > 0.1) {
        this.playerFrame = (this.playerFrame + 1) % 6;
        this.playerAnimTimer = 0;
    }

    if (this.playerHitFlashTimer > 0) {
        this.playerHitFlashTimer -= dt;
    }
    
    const finalSpeed = this.playerStats.speed * this.playerStats.moveSpeedMultiplier;
    this.playerPos.x += moveDir.x * finalSpeed * dt;
    this.playerPos.y += moveDir.y * finalSpeed * dt;

    for (const weapon of this.activeWeapons) {
        weapon.update(dt, this);
    }

    this.updateEnemies(dt);
    this.updatePoisonZones(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateGems(dt);
    this.updateEnemyBullets(dt);
    this.updateWaveNotification(dt);
    this.updateDamageTexts(dt);
    this.checkCollisions();
    
    // Boss Warning Logic
    if (this.bossWarningActive) {
        this.bossWarningTimer -= dt;
        if (this.bossWarningTimer <= 0) {
            this.bossWarningActive = false;
            this.spawnActualBoss();
        }
    }
    
    for (let i = this.lightnings.length - 1; i >= 0; i--) {
        this.lightnings[i].life -= dt;
        if (this.lightnings[i].life <= 0) this.lightnings.splice(i, 1);
    }
  }

  public addWeapon(type: WeaponType) {
      const existing = this.activeWeapons.find(w => w.stats.id === type);
      if (existing) {
          existing.upgrade();
      } else {
          this.activeWeapons.push(createWeapon(type));
      }
  }
  
  public hasPassive(type: string): boolean {
      return (this.activePassives[type] || 0) > 0;
  }
  
  public getPassiveLevel(type: string): number {
      return this.activePassives[type] || 0;
  }

  public spawnProjectile(x: number, y: number, dir: Vector2, config: any): Projectile {
      const proj = this.projectilePool.get();
      const finalDamage = (config.damage || 10) * this.playerStats.damageMultiplier;
      let maxLifeTime = config.maxLifeTime;
      if (maxLifeTime && maxLifeTime < 999) {
          maxLifeTime *= this.playerStats.durationMultiplier;
      }
      
      // Apply Area (Size)
      let size = config.size || 10;
      size *= this.playerStats.areaMultiplier;

      // Apply Bullet Speed
      let speed = config.speed || 0;
      if (speed > 0) speed *= this.playerStats.bulletSpeedMultiplier;

      const finalConfig = {
          ...config,
          damage: finalDamage,
          maxLifeTime,
          size,
          speed
      };
      
      proj.spawn(x, y, dir, finalConfig);
      this.activeProjectiles.push(proj);
      
      if (Math.random() < 0.3) Synthesizer.getInstance().playShoot(); 
      return proj;
  }

  public findBestTarget(origin: Vector2, direction: Vector2): Enemy | null {
    if (this.activeEnemies.length === 0) return null;

    const boss = this.activeEnemies.find(e => e.active && e.type === 'boss');
    if (boss) {
        const dx = boss.position.x - origin.x;
        const dy = boss.position.y - origin.y;
        if (dx*dx + dy*dy < 2000*2000) return boss;
    }

    let nearestInCone: Enemy | null = null;
    let minConeDistSq = Infinity;
    let nearestAny: Enemy | null = null;
    let minAnyDistSq = Infinity;

    const moveDir = this.input.getMovementVector();
    const hasInput = moveDir.x !== 0 || moveDir.y !== 0;

    for (const enemy of this.activeEnemies) {
      if (!enemy.active) continue;
      const dx = enemy.position.x - origin.x;
      const dy = enemy.position.y - origin.y;
      const distSq = dx*dx + dy*dy;

      if (distSq < minAnyDistSq) {
        minAnyDistSq = distSq;
        nearestAny = enemy;
      }

      if (hasInput) {
          const dist = Math.sqrt(distSq);
          if (dist > 0) {
              const ex = dx / dist;
              const ey = dy / dist;
              const dot = ex * moveDir.x + ey * moveDir.y;
              if (dot > 0.707) {
                  if (distSq < minConeDistSq) {
                      minConeDistSq = distSq;
                      nearestInCone = enemy;
                  }
              }
          }
      }
    }
    
    return nearestInCone || nearestAny;
  }

  public findNeighbors(x: number, y: number, radius: number): Enemy[] {
      const range = { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 };
      return this.quadTree.query(range);
  }

  public findNearestEnemy(): Enemy | null {
    return this.findBestTarget(this.playerPos, {x:0, y:0});
  }
  
  public drawLightning(x1: number, y1: number, x2: number, y2: number, generation: number = 0) {
      this.lightnings.push({ x1, y1, x2, y2, life: 0.15, generation });
  }

  private renderLightnings(w: number, h: number) {
      const cx = w/2, cy = h/2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      for (const l of this.lightnings) {
          // Calculate life percentage for fading/thinning (0.0 to 1.0)
          const lifePct = Math.max(0, l.life / 0.15);
          if (lifePct <= 0) continue;

          const sx1 = (l.x1 - this.playerPos.x) + cx;
          const sy1 = (l.y1 - this.playerPos.y) + cy;
          const sx2 = (l.x2 - this.playerPos.x) + cx;
          const sy2 = (l.y2 - this.playerPos.y) + cy;

          // Tapering width based on generation (chain index)
          // Gen 0 (Sky): 4px
          // Gen 1 (A->B): 3px
          // Gen 2 (B->C): 2px
          // Gen 3+ : 1px
          const baseWidth = Math.max(1, 4 - l.generation);
          const glowWidth = Math.max(2, 10 - l.generation * 2);

          // Jagged Line Algorithm
          const segments = 6; // 5-8 points
          const dx = sx2 - sx1;
          const dy = sy2 - sy1;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const normal = { x: -dy/dist, y: dx/dist };
          
          this.ctx.beginPath();
          this.ctx.moveTo(sx1, sy1);
          
          // Generate midpoints
          for (let i = 1; i < segments; i++) {
              const t = i / segments;
              const nominalX = sx1 + dx * t;
              const nominalY = sy1 + dy * t;
              
              // Jitter amount based on lightning width, scaled by distance but clamped
              const jitter = (Math.random() - 0.5) * 40; 
              
              const px = nominalX + normal.x * jitter;
              const py = nominalY + normal.y * jitter;
              
              this.ctx.lineTo(px, py);
          }
          this.ctx.lineTo(sx2, sy2);
          
          // Glow Pass (Cyan)
          this.ctx.save();
          this.ctx.lineWidth = glowWidth * lifePct;
          this.ctx.strokeStyle = '#00FFFF'; // Cyan
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = '#00FFFF';
          this.ctx.globalAlpha = lifePct;
          this.ctx.stroke();
          this.ctx.restore();

          // Core Pass (White)
          this.ctx.save();
          this.ctx.lineWidth = baseWidth * lifePct;
          this.ctx.strokeStyle = '#FFFFFF';
          this.ctx.globalAlpha = lifePct;
          this.ctx.stroke();
          this.ctx.restore();
      }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, isCrit: boolean = false) {
    const dt = this.damageTextPool.get();
    dt.spawn(x, y, text, isCrit, color);
    this.activeDamageTexts.push(dt);
  }

  private updatePoisonZones(dt: number) {
    const now = Date.now();
    let playerInZone = false;
    
    while (this.poisonZones.length > 30) this.poisonZones.shift();

    for (let i = this.poisonZones.length - 1; i >= 0; i--) {
      const zone = this.poisonZones[i];
      zone.duration -= dt * 1000;
      
      const dx = this.playerPos.x - zone.x;
      const dy = this.playerPos.y - zone.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < zone.radius + (this.PLAYER_SIZE / 2)) playerInZone = true;

      if (zone.duration <= 0) this.poisonZones.splice(i, 1);
    }

    if (playerInZone && (now - this.lastPoisonDamageTime > 500)) {
       this.takePlayerDamage(2);
       this.lastPoisonDamageTime = now;
    }
    
    // Track status for rendering
    this.playerInPoisonZone = playerInZone;
  }

  private updateEnemies(dt: number) {
    const minutes = this.gameTime / 60;
    
    // Wave Logic: Set Spawn Interval & Difficulty
    if (minutes < 1) {
        this.spawnInterval = 1.5; // Wave 1: Slow
    } else if (minutes < 3) {
        this.spawnInterval = 0.8; // Wave 2: Faster
    } else if (minutes < 5) {
        this.spawnInterval = 0.4; // Wave 3: Intense
    } else if (minutes < 8) {
        this.spawnInterval = 0.2; // Wave 4: Swarm
    } else {
        this.spawnInterval = 2.0; // Boss Phase: Slow spawns or stop
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      if (!this.isBossAlive) this.spawnEnemy();
    }

    this.quadTree.clear();
    this.quadTree = new QuadTree({ 
        x: this.playerPos.x - this.width, 
        y: this.playerPos.y - this.height, 
        width: this.width * 2, 
        height: this.height * 2 
    }, 4);

    for (const enemy of this.activeEnemies) {
      if (enemy.active) {
          this.quadTree.insert({
              x: enemy.position.x - enemy.radius,
              y: enemy.position.y - enemy.radius,
              width: enemy.radius * 2,
              height: enemy.radius * 2,
              data: enemy
          });
      }
    }

    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      const range = { 
          x: enemy.position.x - enemy.radius * 3, 
          y: enemy.position.y - enemy.radius * 3, 
          width: enemy.radius * 6, 
          height: enemy.radius * 6 
      };
      const neighbors = this.quadTree.query(range);
      enemy.applySeparation(neighbors, dt);
      enemy.update(this.playerPos, dt);
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      proj.update(dt);
      
      if (!proj.active) {
        this.projectilePool.release(proj);
        this.activeProjectiles.splice(i, 1);
      }
    }
  }
  
  private updateEnemyBullets(dt: number) {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
          const bullet = this.enemyBullets[i];
          bullet.update(dt);
          if (!bullet.active) this.enemyBullets.splice(i, 1);
      }
  }

  private checkCollisions() {
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      if (!proj.active) continue;

      if (proj.behavior === 'orbit') {
          for (let k = this.enemyBullets.length - 1; k >= 0; k--) {
              const eb = this.enemyBullets[k];
              const dx = proj.position.x - eb.position.x;
              const dy = proj.position.y - eb.position.y;
              if (dx*dx + dy*dy < (proj.size + eb.size)**2) {
                  eb.active = false; 
              }
          }
      }
      
      if (proj.behavior === 'stationary') {
           for (let k = this.poisonZones.length - 1; k >= 0; k--) {
              const zone = this.poisonZones[k];
              const dx = proj.position.x - zone.x;
              const dy = proj.position.y - zone.y;
              if (Math.sqrt(dx*dx + dy*dy) < proj.size + zone.radius) {
                  this.poisonZones.splice(k, 1); 
              }
          }
      }

      const range = {
          x: proj.position.x - proj.size,
          y: proj.position.y - proj.size,
          width: proj.size * 2,
          height: proj.size * 2
      };
      
      const potentialTargets = this.quadTree.query(range);

      for (const enemy of potentialTargets) {
        if (!enemy.active) continue;
        
        // Tick Damage Check
        if (proj.behavior === 'stationary' && proj.damageInterval > 0) {
            const now = Date.now();
            const lastHit = proj.hitTimers.get(enemy.uid) || 0;
            if (now - lastHit < proj.damageInterval) continue;
            // Proceed to hit check... logic continues below
            // Note: We need to set timer IF hit occurs
        } else if (enemy.hitFlashTimer > 0 && proj.behavior !== 'stationary') {
             continue; 
        }

        const dx = proj.position.x - enemy.position.x;
        const dy = proj.position.y - enemy.position.y;
        const distSq = dx*dx + dy*dy;
        const radiusSum = (proj.size / 2) + enemy.radius;

        if (distSq < radiusSum * radiusSum) {
          // HIT!
          if (proj.behavior === 'stationary' && proj.damageInterval > 0) {
               proj.hitTimers.set(enemy.uid, Date.now());
          }
          
          // Apply Knockback
          enemy.applyKnockback(proj.velocity);

          // Apply Damage
          const isCrit = Math.random() < this.playerStats.critRate;
          const rawDamage = isCrit 
            ? proj.damage * this.playerStats.critDamage 
            : proj.damage;
            
          const finalDamage = Math.max(1, Math.floor(rawDamage));
            
          const dead = enemy.takeDamage(finalDamage);
          this.addFloatingText(
            enemy.position.x, 
            enemy.position.y - 10, 
            finalDamage.toLocaleString() + (isCrit ? '!' : ''), 
            isCrit ? '#ff0000' : '#ffffff',
            isCrit
          );
          
          if (!dead) Synthesizer.getInstance().playHit();

          if (dead) {
            this.handleEnemyDeath(enemy);
            this.enemyPool.release(enemy);
            const idx = this.activeEnemies.indexOf(enemy);
            if (idx !== -1) this.activeEnemies.splice(idx, 1);
            if (enemy.type === 'boss') {
              this.isBossAlive = false;
              this.bossSpawned = false;
              this.addFloatingText(enemy.position.x, enemy.position.y, "VICTORY!", "#fbbf24", true);
              this.enemyBullets = [];
            }
          }
          
          if (proj.behavior === 'bounce') {
             proj.bounces--;
             if (proj.bounces <= 0) proj.deactivate();
             else {
                 const nextTarget = this.findNearestEnemy(); 
                 if (nextTarget && nextTarget !== enemy) {
                     const ndx = nextTarget.position.x - proj.position.x;
                     const ndy = nextTarget.position.y - proj.position.y;
                     const len = Math.sqrt(ndx*ndx + ndy*ndy);
                     proj.velocity.x = (ndx/len) * proj.speed;
                     proj.velocity.y = (ndy/len) * proj.speed;
                 } else {
                     proj.velocity.x *= -1;
                 }
             }
          } else if (proj.pierce < 999) {
              proj.pierce--;
              if (proj.pierce <= 0) proj.deactivate();
          }
          
          break;
        }
      }
    }

    for (const bullet of this.enemyBullets) {
        if (!bullet.active) continue;
        const dx = bullet.position.x - this.playerPos.x;
        const dy = bullet.position.y - this.playerPos.y;
        if (dx*dx+dy*dy < (bullet.size/2 + this.PLAYER_SIZE/2)**2) {
            bullet.active = false;
            this.takePlayerDamage(bullet.damage);
        }
    }
    
    const playerRange = { 
        x: this.playerPos.x - 50, y: this.playerPos.y - 50, width: 100, height: 100 
    };
    const nearbyEnemies = this.quadTree.query(playerRange);
    
    for (const enemy of nearbyEnemies) {
        if (!enemy.active) continue;
        const dx = this.playerPos.x - enemy.position.x;
        const dy = this.playerPos.y - enemy.position.y;
        if (dx*dx+dy*dy < (enemy.radius + this.PLAYER_SIZE/2)**2) {
            this.takePlayerDamage(1);
        }
    }

    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const gem = this.activeGems[i];
      if (!gem.active) continue;
      const dx = this.playerPos.x - gem.position.x;
      const dy = this.playerPos.y - gem.position.y;
      if (dx*dx+dy*dy < (gem.SIZE/2 + this.PLAYER_SIZE/2)**2) this.collectGem(gem);
    }
  }

  private spawnGem(x: number, y: number, value: number, type: LootType = 'xp', initialVelocity?: Vector2) {
    const gem = this.gemPool.get();
    gem.spawn(x, y, value, type, initialVelocity);
    this.activeGems.push(gem);
  }

  private handleEnemyDeath(enemy: Enemy) {
    if (enemy.type === 'poisoner') {
      this.poisonZones.push({ x: enemy.position.x, y: enemy.position.y, radius: 60, duration: 4000, damage: 2, damageInterval: 500 });
    }
    this.spawnParticles(enemy.position.x, enemy.position.y, '#ef4444');
    
    // Elite Chest (30% chance from elite/tank)
    if ((enemy.type === 'elite_shooter' || enemy.type === 'tank') && Math.random() < 0.3) {
        this.spawnGem(enemy.position.x, enemy.position.y, 1, 'chest');
    } else if (enemy.type === 'elite_shooter' && Math.random() < 0.3) {
      this.spawnGem(enemy.position.x, enemy.position.y, 1, 'weapon_box');
    } else if (Math.random() < 0.1) {
      this.spawnGem(enemy.position.x, enemy.position.y, 10, 'gold'); // Drop Gold
    } else if (Math.random() < 0.05) {
      this.spawnGem(enemy.position.x, enemy.position.y, 20, 'potion');
    } else {
      this.spawnGem(enemy.position.x, enemy.position.y, 10, 'xp');
    }
  }

  public spawnParticles(x: number, y: number, color: string, type: ParticleType = 'circle') {
    let spawnedCount = 0;
    for (const p of this.particlePool) {
      if (!p.active) {
        p.spawn(x, y, color, type);
        spawnedCount++;
        if (spawnedCount >= 4) break;
      }
    }
  }

  private collectGem(gem: Gem) {
    gem.active = false;
    Synthesizer.getInstance().playCollect();
    if (gem.type === 'chest') {
        this.addFloatingText(this.playerPos.x, this.playerPos.y - 50, "BONUS!", "#f59e0b", true);
        const roll = Math.random();
        if (roll < 0.33) {
            // 1. XP
            this.playerStats.xp += this.playerStats.maxXp;
            this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, "MAX XP!", "#60a5fa");
        } else if (roll < 0.66) {
            // 2. Heal
            this.playerStats.hp = this.playerStats.maxHp;
            this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, "FULL HEAL!", "#4ade80");
        } else {
            // 3. Nuke
            this.killAllEnemies();
            this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, "NUKE!", "#ef4444");
        }
    } else if (gem.type === 'potion') {
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + gem.value);
      this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, `+${gem.value}`, '#00ff00');
    } else if (gem.type === 'weapon_box') {
      // Gacha Logic
      this.spawnParticles(gem.position.x, gem.position.y, '#fbbf24', 'star');
      this.addFloatingText(gem.position.x, gem.position.y - 20, "Open!", "#ffffff");
      
      const rng = Math.random();
      // Jump/Pop Physics for spawned item
      const jumpVel = { x: (Math.random() - 0.5) * 200, y: -300 }; // Pop Up and Scatter

      if (rng < 0.2) {
          // 20% Magnet
          this.spawnGem(gem.position.x, gem.position.y, 1, 'magnet', jumpVel);
      } else if (rng < 0.5) {
          // 30% Potion (High HP Potion)
          this.spawnGem(gem.position.x, gem.position.y, 50, 'potion', jumpVel);
      } else {
          // 50% Gold
          this.spawnGem(gem.position.x, gem.position.y, 500, 'gold', jumpVel);
      }
    } else if (gem.type === 'magnet') {
        // Magnet Effect
        Synthesizer.getInstance().playMagnet();
        this.addFloatingText(this.playerPos.x, this.playerPos.y - 40, "MAGNET FIELD!", "#ef4444", true);
        
        // Magnetize all XP gems
        for (const g of this.activeGems) {
            if (g.active && g.type === 'xp') {
                g.isMagnetized = true;
            }
        }
    } else if (gem.type === 'gold') {
      DataManager.addGold(gem.value);
      this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, `+${gem.value}G`, '#fbbf24');
    } else {
      this.playerStats.xp += gem.value * this.playerStats.gainMultiplier;
    }
    
    if (this.playerStats.xp >= this.playerStats.maxXp) this.levelUp();
    this.onUIUpdate({ ...this.playerStats });
  }
  
  private killAllEnemies() {
      for (const enemy of this.activeEnemies) {
          if (!enemy.active || enemy.type === 'boss') continue; // Don't kill boss
          enemy.takeDamage(99999);
          this.addFloatingText(enemy.position.x, enemy.position.y, "9999", "#ff0000", true);
          if (enemy.hp <= 0) {
              this.handleEnemyDeath(enemy);
              this.enemyPool.release(enemy);
          }
      }
      this.activeEnemies = this.activeEnemies.filter(e => e.active);
      // Screen shake or flash?
      this.spawnParticles(this.playerPos.x, this.playerPos.y, '#ffffff', 'shard');
  }

  private levelUp() {
    Synthesizer.getInstance().playLevelUp();
    this.playerStats.level++;
    this.playerStats.xp -= this.playerStats.maxXp;
    this.playerStats.maxXp = Math.floor(this.playerStats.maxXp * 1.2); 
    this.playerStats.hp = this.playerStats.maxHp; 
    
    this.state = GameState.PAUSED;
    this.onStateChange(this.state);
    
    const options: UpgradeOption[] = [];
    
    const activePassiveCount = Object.keys(this.activePassives).length;
    const activeWeaponCount = this.activeWeapons.length;

    for (const recipe of EVOLUTION_RECIPES) {
        const weapon = this.activeWeapons.find(w => w.stats.id === recipe.weapon);
        const hasPassive = this.activePassives[recipe.passive] > 0;
        
        if (weapon && weapon.stats.level >= 5 && hasPassive) {
             const evolvedWeapon = createWeapon(recipe.result);
             options.push({
                 id: 'evo_' + recipe.result,
                 type: 'weapon',
                 weaponType: recipe.result,
                 title: evolvedWeapon.stats.name,
                 description: evolvedWeapon.stats.description,
                 isNew: true,
                 isEvolution: true
             });
        }
    }

    const availableWeapons = [];
    const availablePassives = [];

    for (const type of this.availableWeaponTypes) {
        const existing = this.activeWeapons.find(w => w.stats.id === type);
        
        if (existing) {
            if (existing.stats.level < 5) {
                 availableWeapons.push({ type, existing: true, level: existing.stats.level });
            }
        } else {
            if (activeWeaponCount < MAX_WEAPON_SLOTS) {
                availableWeapons.push({ type, existing: false, level: 0 });
            }
        }
    }

    for (const type of this.availablePassiveTypes) {
        const currentLv = this.activePassives[type] || 0;
        
        if (currentLv > 0) {
            if (currentLv < 5) {
                availablePassives.push({ type, existing: true, level: currentLv });
            }
        } else {
            if (activePassiveCount < MAX_PASSIVE_SLOTS) {
                availablePassives.push({ type, existing: false, level: 0 });
            }
        }
    }

    let attempts = 0;
    
    // Weighted RNG Logic
    // Priorities: New Item (High), Evolution (Highest), Upgrade (Low)
    interface Candidate {
        type: 'weapon' | 'passive';
        id: string;
        weight: number;
        data: any;
    }
    
    const candidates: Candidate[] = [];

    // 1. Weapons
    for (const type of this.availableWeaponTypes) {
        const existing = this.activeWeapons.find(w => w.stats.id === type);
        if (existing) {
             if (existing.stats.level < 5) {
                 candidates.push({ 
                     type: 'weapon', 
                     id: type, 
                     weight: 1, // Low priority for upgrades
                     data: { existing: true, level: existing.stats.level } 
                 });
             }
        } else {
             if (activeWeaponCount < MAX_WEAPON_SLOTS) {
                 candidates.push({ 
                     type: 'weapon', 
                     id: type, 
                     weight: 5, // High priority for new
                     data: { existing: false, level: 0 } 
                 });
             }
        }
    }
    
    // 2. Passives
    for (const type of this.availablePassiveTypes) {
        const currentLv = this.activePassives[type] || 0;
        if (currentLv > 0) {
             if (currentLv < 5) {
                 candidates.push({ 
                     type: 'passive', 
                     id: type, 
                     weight: 1, // Low priority for upgrades
                     data: { existing: true, level: currentLv } 
                 });
             }
        } else {
             if (activePassiveCount < MAX_PASSIVE_SLOTS) {
                 candidates.push({ 
                     type: 'passive', 
                     id: type, 
                     weight: 5, // High priority for new
                     data: { existing: false, level: 0 } 
                 });
             }
        }
    }

    // Pick 3 Options
    while (options.length < 3 && candidates.length > 0) {
        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let r = Math.random() * totalWeight;
        
        let selected: Candidate | null = null;
        for (const c of candidates) {
            r -= c.weight;
            if (r <= 0) {
                selected = c;
                break;
            }
        }
        
        if (!selected) selected = candidates[candidates.length - 1];
        
        // Remove selected from candidates to avoid duplicates
        const index = candidates.indexOf(selected);
        if (index > -1) candidates.splice(index, 1);
        
        // Convert to UpgradeOption
        if (selected.type === 'weapon') {
            const dummy = createWeapon(selected.id as WeaponType);
            
            // Check Evolution
            let evoPair = undefined;
            let evoOwned = false;
            const recipe = EVOLUTION_RECIPES.find(r => r.weapon === selected.id);
            if (recipe) {
                const passiveDef = PASSIVE_ITEMS[recipe.passive];
                evoPair = passiveDef ? passiveDef.name : recipe.passive;
                evoOwned = this.activePassives[recipe.passive] > 0;
            }

            options.push({
                 id: selected.id,
                 type: 'weapon',
                 weaponType: selected.id as WeaponType,
                 title: dummy.stats.name,
                 description: selected.data.existing ? `Upgrade to Lv ${selected.data.level + 1}` : "New Weapon!",
                 isNew: !selected.data.existing,
                 evolutionPair: evoPair,
                 evolutionOwned: evoOwned
             });
        } else {
            const passiveDef = PASSIVE_ITEMS[selected.id as PassiveType];
            options.push({
                id: selected.id,
                type: 'passive',
                passiveType: selected.id as PassiveType,
                title: passiveDef.name,
                description: `Lv ${selected.data.level + 1}: ${passiveDef.description}`,
                isNew: !selected.data.existing
            });
        }
    }
    
    while (options.length < 3) {
        const isChicken = Math.random() < 0.5;
        options.push({
            id: `fallback_${options.length}_${Date.now()}`,
            type: 'stat', 
            statType: isChicken ? 'chicken' : 'gold',
            title: isChicken ? 'Delicious Chicken' : 'Bag of Gold',
            description: 'Recover 30 HP & +500 Score',
            isNew: false
        });
    }

    this.onLevelUp(options);
    this.onUIUpdate({ ...this.playerStats });
  }

  public resume() {
    this.state = GameState.PLAYING;
    this.lastTime = performance.now();
    this.onStateChange(this.state);
  }

  public applyUpgrade(option: UpgradeOption) {
    if (option.isEvolution && option.weaponType) {
        const recipe = EVOLUTION_RECIPES.find(r => r.result === option.weaponType);
        if (recipe) {
            const idx = this.activeWeapons.findIndex(w => w.stats.id === recipe.weapon);
            if (idx !== -1) {
                this.activeWeapons.splice(idx, 1); 
            }
        }
        this.addWeapon(option.weaponType); 
    } else if (option.type === 'weapon' && option.weaponType) {
        this.addWeapon(option.weaponType);
    } else if (option.type === 'passive' && option.passiveType) {
        if (!this.activePassives[option.passiveType]) this.activePassives[option.passiveType] = 0;
        
        const oldMaxHp = this.playerStats.maxHp;
        const oldHpPct = this.playerStats.hp / oldMaxHp;

        this.activePassives[option.passiveType]++;
        this.updatePlayerStats();
        
        // Heal proportionally if MaxHP increased
        if (this.playerStats.maxHp > oldMaxHp) {
            this.playerStats.hp = this.playerStats.maxHp * oldHpPct;
        }
    } else if (option.type === 'stat') {
        this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 30);
        this.playerStats.score += 500;
        
        if (option.statType === 'chicken') {
            this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, '+30 HP', '#00ff00');
        } else if (option.statType === 'gold') {
             this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, '+500 Pts', '#fbbf24');
        }
    }
    this.onUIUpdate({ ...this.playerStats });
  }

  private updatePlayerStats() {
      const perm = DataManager.data.permanentStats;

      this.playerStats.damageMultiplier = 1.0 + (perm.baseDamage * 0.05);
      this.playerStats.durationMultiplier = 1.0;
      this.playerStats.cooldownMultiplier = 1.0;
      this.playerStats.moveSpeedMultiplier = 1.0 + (perm.moveSpeed * 0.05);
      this.playerStats.magnetRadiusMultiplier = 1.0 + ((perm.magnetRange || 0) * 0.10);
      this.playerStats.gainMultiplier = 1.0 + (perm.goldGain * 0.10);
      
      // New Stats
      this.playerStats.areaMultiplier = 1.0;
      this.playerStats.bulletSpeedMultiplier = 1.0;
      let hpBonusPercent = 0;

      for (const [key, level] of Object.entries(this.activePassives)) {
          const passive = PASSIVE_ITEMS[key as PassiveType];
          if (!passive) continue;

          // Updated Logic for New Passives
          if (passive.statPerLevel.area) this.playerStats.areaMultiplier += passive.statPerLevel.area * level;
          if (passive.statPerLevel.bulletSpeed) this.playerStats.bulletSpeedMultiplier += passive.statPerLevel.bulletSpeed * level;
          if (passive.statPerLevel.cooldown) this.playerStats.cooldownMultiplier -= passive.statPerLevel.cooldown * level;
          if (passive.statPerLevel.maxHp) hpBonusPercent += passive.statPerLevel.maxHp * level;
          if (passive.statPerLevel.magnet) this.playerStats.magnetRadiusMultiplier += passive.statPerLevel.magnet * level;
          
          // Legacy support (optional, if any old passives remain)
          if (passive.statPerLevel['damage' as keyof typeof passive.statPerLevel]) this.playerStats.damageMultiplier += (passive.statPerLevel as any).damage * level;
          if (passive.statPerLevel['duration' as keyof typeof passive.statPerLevel]) this.playerStats.durationMultiplier += (passive.statPerLevel as any).duration * level;
      }
      
      // Apply HP Bonus
      const baseHp = 100 + (perm.baseHp * 10);
      this.playerStats.maxHp = Math.floor(baseHp * (1 + hpBonusPercent));
      // Ensure HP doesn't exceed new Max (if it somehow did, unlikely)
      if (this.playerStats.hp > this.playerStats.maxHp) this.playerStats.hp = this.playerStats.maxHp;

      if (this.playerStats.cooldownMultiplier < 0.2) this.playerStats.cooldownMultiplier = 0.2;
  }

  private spawnEnemy() {
     // Logic moved to updateEnemies for interval control
     const minutes = this.gameTime / 60;
     const currentMinuteInt = Math.floor(minutes);
     
     if (this.lastWaveMinute !== currentMinuteInt) {
         if (currentMinuteInt === 8) this.showWaveMessage("WARNING: BOSS APPROACHING");
         else if (currentMinuteInt === 5) this.showWaveMessage("WAVE 4: TOTAL WAR");
         else if (currentMinuteInt === 3) this.showWaveMessage("WAVE 3: HEAVY ASSAULT");
         else if (currentMinuteInt === 1) this.showWaveMessage("WAVE 2: SWARM");
         else if (currentMinuteInt === 0 && this.gameTime < 1) this.showWaveMessage("WAVE 1: SURVIVE");
         this.lastWaveMinute = currentMinuteInt;
     }

     if (minutes >= 8) {
         if (this.bossSpawned) return;
         if (!this.bossWarningActive) {
             this.startBossWarning();
         }
         return;
     }

     const enemy = this.enemyPool.get();
     const angle = Math.random() * Math.PI * 2;
     const spawnRadius = Math.sqrt(this.width**2 + this.height**2) / 2 + 50;
     const x = this.playerPos.x + Math.cos(angle) * spawnRadius;
     const y = this.playerPos.y + Math.sin(angle) * spawnRadius;
     
     let config: EnemyConfig = ENEMY_TYPES.basic;
     const rand = Math.random();
     
     // Wave Spawning Composition
     if (minutes < 1) {
         // Wave 1: Mostly Basic
         config = ENEMY_TYPES.basic;
     } else if (minutes < 3) {
         // Wave 2: Basic + Speedy
         if (rand < 0.3) config = ENEMY_TYPES.speedy;
         else config = ENEMY_TYPES.basic;
     } else if (minutes < 5) {
         // Wave 3: Tank + Basic/Speedy
         if (rand < 0.4) config = ENEMY_TYPES.tank;
         else if (rand < 0.7) config = ENEMY_TYPES.speedy;
         else config = ENEMY_TYPES.basic;
     } else {
         // Wave 4: Elite + Poisoner + Tank + Speedy
         if (rand < 0.3) config = ENEMY_TYPES.elite_shooter;
         else if (rand < 0.5) config = ENEMY_TYPES.poisoner;
         else if (rand < 0.7) config = ENEMY_TYPES.tank;
         else config = ENEMY_TYPES.speedy;
     }
     
     // Scaling: BaseHP * (1 + (minutes * 0.8))
     const scaling = 1 + (minutes * 0.8);
     enemy.spawn(x, y, { ...config, hpMultiplier: config.hpMultiplier * scaling }, this.spawnEnemyBullet);
     this.activeEnemies.push(enemy);
  }

  private startBossWarning() {
      this.bossSpawned = true; // Prevent re-triggering
      this.bossWarningActive = true;
      this.bossWarningTimer = 3.0; // 3 Seconds
      Synthesizer.getInstance().playSiren();
  }

  private spawnActualBoss() {
      this.isBossAlive = true;
      const enemy = this.enemyPool.get();
      const config = { ...ENEMY_TYPES.boss };
      const minutes = this.gameTime / 60;
      
      // Boss Scaling: minutes * 1.5
      // Base is 50x, so we apply the multiplier on top
      config.hpMultiplier *= (1 + (minutes * 1.5));
      
      // Spawn at top
      enemy.spawn(this.playerPos.x, this.playerPos.y - this.height/2 - 100, config, this.spawnEnemyBullet);
      this.activeEnemies.push(enemy);
      
      this.addFloatingText(enemy.position.x, enemy.position.y, "BOSS!", "#ff0000", true);
  }

  private spawnEnemyBullet = (x: number, y: number, angle: number, size: number = 8, color: string = '#ef4444') => {
      const speed = size > 10 ? 150 : 200;
      const vel = { x: Math.cos(angle)*speed, y: Math.sin(angle)*speed };
      const b = new EnemyProjectile();
      b.spawn(x, y, vel, 5, size, color);
      this.enemyBullets.push(b);
  };

  private updateParticles(dt: number) {
      for (const p of this.particlePool) if (p.active) p.update(dt);
  }
  
  private updateGems(dt: number) {
      const finalMagnetRange = this.playerStats.magnetRange * this.playerStats.magnetRadiusMultiplier;
      for (let i = this.activeGems.length - 1; i >= 0; i--) {
          const g = this.activeGems[i];
          g.update(this.playerPos, finalMagnetRange, dt);
          if (!g.active) { this.gemPool.release(g); this.activeGems.splice(i, 1); }
      }
  }

  private updateDamageTexts(dt: number) {
      for (let i = this.activeDamageTexts.length - 1; i >= 0; i--) {
          const dtObj = this.activeDamageTexts[i];
          dtObj.update(dt);
          if (!dtObj.active) {
              this.damageTextPool.release(dtObj);
              this.activeDamageTexts.splice(i, 1);
          }
      }
  }

  private updateWaveNotification(dt: number) {
      if (this.waveMessageTimer > 0) this.waveMessageTimer -= dt;
  }
  
  private showWaveMessage(msg: string) {
      this.waveMessage = msg;
      this.waveMessageTimer = 3;
  }

  private render() {
    const { width, height } = this;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw Pattern (Bright Grass)
    const pattern = AssetGenerator.getInstance().backgroundPattern;
    if (pattern) {
        ctx.fillStyle = pattern;
        // Scroll Pattern relative to player
        ctx.save();
        ctx.translate(-this.playerPos.x, -this.playerPos.y);
        ctx.fillRect(this.playerPos.x, this.playerPos.y, width, height);
        ctx.restore();
    } else {
        ctx.fillStyle = '#86c25e';
        ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Scrolling Grid Lines (White)
    this.renderGrid(width, height);
    
    this.renderPoisonZones(width, height);
    this.renderGems(width, height);
    this.renderParticles(width, height);
    this.renderEnemies(width, height);
    this.renderProjectiles(width, height);
    this.renderEnemyBullets(width, height);
    this.renderLightnings(width, height);
    this.renderPlayer(width, height);
    this.renderDamageTexts(width, height);
    this.renderWaveNotification(width, height);
    this.renderBossWarning(width, height);
    this.renderHUD();
  }

  private renderGrid(w: number, h: number) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // White grid
      this.ctx.lineWidth = 1;
      const ox = Math.floor(this.playerPos.x) % this.GRID_SIZE;
      const oy = Math.floor(this.playerPos.y) % this.GRID_SIZE;
      const cx = w/2, cy = h/2;
      
      // Vertical
      for (let x = cx-(cx%this.GRID_SIZE)-ox-this.GRID_SIZE; x < w+this.GRID_SIZE; x+=this.GRID_SIZE) {
          this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, h); this.ctx.stroke();
      }
      // Horizontal
      for (let y = cy-(cy%this.GRID_SIZE)-oy-this.GRID_SIZE; y < h+this.GRID_SIZE; y+=this.GRID_SIZE) {
          this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); this.ctx.stroke();
      }
  }

  private renderLightnings(w: number, h: number) {
      // Logic moved to upper helper method or inline
      // Replaced by the implementation above, but wait, `renderLightnings` was private method near bottom.
      // I must be careful with replace location.
      // The previous replace for drawLightning included renderLightnings?
      // No, drawLightning was public, renderLightnings was private.
      // My previous replace block for drawLightning REPLACED renderLightnings too because I included it?
      // No, I see `public addFloatingText` in `before` block of previous call. 
      // Wait, I messed up the order in my thought.
      
      // Let's correct. I will use a separate modify action for renderLightnings at the bottom of file.
  }

  private renderPoisonZones(w: number, h: number) {
      const cx = w/2, cy = h/2;
      const pattern = AssetGenerator.getInstance().poisonPattern;
      const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.2; // 0.5 ~ 0.9

      for (const z of this.poisonZones) {
          const sx = (z.x - this.playerPos.x) + cx;
          const sy = (z.y - this.playerPos.y) + cy;
          
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, z.radius, 0, Math.PI*2);
          
          this.ctx.save();
          this.ctx.globalAlpha = pulse * Math.min(1, z.duration / 500); // Fade out at end
          
          if (pattern) {
              this.ctx.translate(sx - z.radius, sy - z.radius); // Align pattern
              this.ctx.fillStyle = pattern;
              this.ctx.fill();
          } else {
              this.ctx.fillStyle = '#581c87'; // Fallback
              this.ctx.fill();
          }
          this.ctx.restore();

          // Border
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = '#a3e635'; // Fluorescent Lime
          this.ctx.globalAlpha = Math.min(1, z.duration / 500);
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
      }
  }
  
  private renderProjectiles(w: number, h: number) { 
      const performanceMode = this.activeProjectiles.length > 200;
      const c = {x:w/2, y:h/2}; 
      for(const p of this.activeProjectiles) {
          p.draw(this.ctx, c, this.playerPos, performanceMode); 
      }
  }

  private renderEnemies(w: number, h: number) { const c = {x:w/2, y:h/2}; for(const e of this.activeEnemies) e.draw(this.ctx, c, this.playerPos); }
  private renderGems(w: number, h: number) { const c = {x:w/2, y:h/2}; for(const g of this.activeGems) g.draw(this.ctx, c, this.playerPos); }
  private renderParticles(w: number, h: number) { const c = {x:w/2, y:h/2}; for(const p of this.particlePool) p.draw(this.ctx, c, this.playerPos); }
  private renderEnemyBullets(w: number, h: number) { const c = {x:w/2, y:h/2}; for(const b of this.enemyBullets) b.draw(this.ctx, c, this.playerPos); }
  
  private takePlayerDamage(amount: number) {
      this.playerStats.hp -= amount;
      this.playerHitFlashTimer = 0.2; // Flash for 200ms
      this.addFloatingText(this.playerPos.x, this.playerPos.y - 20, `-${amount}`, '#ef4444');
      this.onUIUpdate({ ...this.playerStats });
      
      if (this.playerStats.hp <= 0) this.stop();
      else Synthesizer.getInstance().playHit(); // Optional: Play sound on player hit
  }

  private renderPlayer(w: number, h: number) {
      const cx = w/2, cy = h/2;
      const isMoving = this.input.getMovementVector().x !== 0 || this.input.getMovementVector().y !== 0;
      
      // 1. Dynamic Shadow (Draw BEFORE player)
      this.ctx.save();
      const shadowY = cy + 35; // Position at feet
      const shadowBaseScale = 1.0;
      // Shadow shrinks when player bobs up (jump effect)
      const shadowPulse = isMoving ? Math.sin(this.playerAnimTimer * 20) * 0.15 : 0; 
      // Shadow also breathes slightly when idle
      const shadowBreath = !isMoving ? Math.sin(Date.now() / 200) * 0.05 : 0;
      
      this.ctx.translate(cx, shadowY);
      this.ctx.scale(shadowBaseScale - shadowPulse + shadowBreath, 0.6); // Flattened circle
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillStyle = 'black';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // 2. Player Animation Transforms
      this.ctx.save();
      
      // -- Pivot Adjustment --
      // We want to rotate around the bottom/feet area to look like a waddle.
      // Move origin to feet
      const pivotOffsetY = 35; 
      this.ctx.translate(cx, cy + pivotOffsetY);

      // -- Facing Direction --
      if (!this.playerFacingRight) this.ctx.scale(-1, 1);

      // -- Waddle Animation (Rotation) --
      if (isMoving) {
          // Rotate hips: +/- 5 degrees approx (0.1 rad)
          const waddleAngle = Math.sin(this.playerAnimTimer * 20) * 0.1;
          this.ctx.rotate(waddleAngle);
      }

      // -- Bobbing (Vertical Movement) --
      let bobY = 0;
      if (isMoving) {
          // Bob up and down
          bobY = Math.abs(Math.sin(this.playerAnimTimer * 20)) * 6; // Hopping effect
          // Note: We subtract bobY to move UP
      }
      this.ctx.translate(0, -bobY);

      // -- Idle Breathing (Squash & Stretch) --
      if (!isMoving) {
          const breathFreq = Date.now() / 200;
          const scaleY = 1.0 + Math.sin(breathFreq) * 0.03; // Stretch Y
          const scaleX = 1.0 - Math.sin(breathFreq) * 0.03; // Squash X
          this.ctx.scale(scaleX, scaleY);
      }
      
      // -- Draw Sprite --
      // Since origin is now at feet (cy + 35), and sprite is 80x80 centered:
      // We need to draw the sprite so its feet align with (0,0).
      // If sprite center is (40, 40), feet are roughly at y=75 in sprite space.
      // So we draw at (-40, -75).
      const spriteDrawX = -40;
      const spriteDrawY = -75;

      if (this.playerSprite) {
          this.ctx.drawImage(this.playerSprite, spriteDrawX, spriteDrawY, 80, 80);
          
          // -- Visual Effects (Tint/Flash) --
          this.ctx.globalCompositeOperation = 'source-atop';

          // A. Hit Flash (Red/White)
          if (this.playerHitFlashTimer > 0) {
              const flashPhase = Math.floor(Date.now() / 50) % 2; // Fast strobe
              this.ctx.fillStyle = flashPhase === 0 ? '#ff0000' : '#ffffff';
              this.ctx.globalAlpha = 0.6;
              this.ctx.fillRect(spriteDrawX, spriteDrawY, 80, 80);
          }
          // B. Poison Effect (Green Tint)
          else if (this.playerInPoisonZone) {
              const blink = 0.5 + Math.sin(Date.now() / 100) * 0.2;
              this.ctx.globalAlpha = blink;
              this.ctx.fillStyle = '#4ade80'; // Neon Green
              this.ctx.fillRect(spriteDrawX, spriteDrawY, 80, 80);
          }

          // Reset Composite
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.globalAlpha = 1.0;

      } else {
          // Fallback Rect
          this.ctx.fillStyle = '#3b82f6';
          this.ctx.fillRect(-15, -30, 30, 30);
      }

      this.ctx.restore();
  }
  
  private renderDamageTexts(w: number, h: number) {
      const c = {x:w/2, y:h/2};
      for(const dt of this.activeDamageTexts) {
          dt.draw(this.ctx, c, this.playerPos);
      }
  }
  
  private renderHUD() {
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'left';
    
    // Score
    this.ctx.strokeText(`Score: ${this.playerStats.score}`, 20, 40);
    this.ctx.fillText(`Score: ${this.playerStats.score}`, 20, 40);
    
    // Gold
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.strokeText(`Gold: ${DataManager.data.gold}`, 20, 70);
    this.ctx.fillText(`Gold: ${DataManager.data.gold}`, 20, 70);
    
    // Stats
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Lv: ${this.playerStats.level}`, 20, 100);
    this.ctx.fillText(`Enemies: ${this.activeEnemies.length}`, 20, 120);
    
    // Timer
    const min = Math.floor(this.gameTime/60);
    const sec = Math.floor(this.gameTime%60);
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeText(`${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`, this.width/2, 50);
    this.ctx.fillText(`${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`, this.width/2, 50);
  }

  private renderWaveNotification(w: number, h: number) {
      if (this.waveMessageTimer <= 0) return;
      this.ctx.save();
      this.ctx.globalAlpha = Math.min(1, this.waveMessageTimer);
      this.ctx.font = '900 48px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.strokeStyle = 'black'; this.ctx.lineWidth = 8;
      this.ctx.strokeText(this.waveMessage, w/2, h/3);
      this.ctx.fillStyle = 'white';
      this.ctx.fillText(this.waveMessage, w/2, h/3);
      this.ctx.restore();
  }
  
  private renderBossWarning(w: number, h: number) {
      if (!this.bossWarningActive) return;
      
      // 1. Red Pulse Overlay
      // Sine wave 0 -> 0.3 -> 0
      const pulse = (Math.sin(Date.now() / 150) + 1) / 2; // 0 to 1
      this.ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + pulse * 0.2})`;
      this.ctx.fillRect(0, 0, w, h);
      
      // 2. Warning Text
      this.ctx.save();
      const scale = 1 + pulse * 0.1; // Slight scale pulse
      this.ctx.translate(w/2, h/2);
      this.ctx.scale(scale, scale);
      
      this.ctx.font = '900 64px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // Stroke
      this.ctx.strokeStyle = '#facc15'; // Yellow
      this.ctx.lineWidth = 6;
      this.ctx.lineJoin = 'round';
      this.ctx.strokeText("WARNING", 0, 0);
      
      // Fill
      this.ctx.fillStyle = '#ef4444'; // Red
      this.ctx.fillText("WARNING", 0, 0);
      
      // Subtext
      this.ctx.font = 'bold 32px monospace';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText("BOSS APPROACHING", 0, 60);
      this.ctx.fillStyle = 'white';
      this.ctx.fillText("BOSS APPROACHING", 0, 60);
      
      this.ctx.restore();
  }
}
