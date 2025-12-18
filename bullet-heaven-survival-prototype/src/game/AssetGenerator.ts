import { EnemyType } from './types';

export class AssetGenerator {
  private static instance: AssetGenerator;
  public sprites: Record<string, HTMLCanvasElement> = {};
  public backgroundPattern: CanvasPattern | null = null;
  public firePattern: CanvasPattern | null = null;
  public poisonPattern: CanvasPattern | null = null;
  private ctx: CanvasRenderingContext2D;

  private constructor() {
    const canvas = document.createElement('canvas');
    this.ctx = canvas.getContext('2d')!;
    this.initAssets();
  }

  public static getInstance(): AssetGenerator {
    if (!AssetGenerator.instance) {
      AssetGenerator.instance = new AssetGenerator();
    }
    return AssetGenerator.instance;
  }

  private initAssets() {
    // Generate Bright Grid Background
    this.backgroundPattern = this.generateGridPattern();
    
    // Generate Fire Pattern (Cached)
    this.firePattern = this.generateFireZonePattern();

    // Generate Poison Pattern (Cached)
    this.poisonPattern = this.generatePoisonZonePattern();

    // Generate Cartoon Player
    this.sprites['player'] = this.generateCartoonPlayer();

    // Generate Cartoon Enemies
    this.sprites['basic'] = this.generateCartoonEnemy('#86efac', 'basic'); // Light Green Zombie
    this.sprites['tank'] = this.generateCartoonEnemy('#60a5fa', 'tank');   // Blue Robot/Tank
    this.sprites['speedy'] = this.generateCartoonEnemy('#a78bfa', 'speedy'); // Purple Bat
    this.sprites['elite_shooter'] = this.generateCartoonEnemy('#f472b6', 'elite'); // Pink
    this.sprites['poisoner'] = this.generateCartoonEnemy('#a3e635', 'poisoner'); // Lime
    this.sprites['boss'] = this.generateCartoonEnemy('#f87171', 'boss'); // Red
    
    // Generate Equipment Icons
    this.sprites['icon_kunai'] = this.generateKunaiIcon();
    this.sprites['icon_katana'] = this.generateKatanaIcon();

    // Necklaces
    this.sprites['neck_metal'] = this.generateNecklace('metal');
    this.sprites['neck_bone'] = this.generateNecklace('bone');
    this.sprites['neck_emerald'] = this.generateNecklace('emerald');
    this.sprites['neck_trendy'] = this.generateNecklace('trendy');

    // Gloves
    this.sprites['glove_army'] = this.generateGlove('army');
    this.sprites['glove_shiny'] = this.generateGlove('shiny');
    this.sprites['glove_leather'] = this.generateGlove('leather');
    this.sprites['glove_protective'] = this.generateGlove('protective');

    // Belts
    this.sprites['belt_army'] = this.generateBelt('army');
    this.sprites['belt_energy'] = this.generateBelt('energy');
    this.sprites['belt_leather'] = this.generateBelt('leather');
    this.sprites['belt_sensor'] = this.generateBelt('sensor');

    // Boots
    this.sprites['boot_army'] = this.generateBoots('army');
    this.sprites['boot_energy'] = this.generateBoots('energy');
    this.sprites['boot_prosthetic'] = this.generateBoots('prosthetic');
    this.sprites['boot_thick'] = this.generateBoots('thick');


    // Generate Items

    this.sprites['gem_xp'] = this.generateGemSprite('#60a5fa');
    this.sprites['gem_gold'] = this.generateCoinSprite();
    this.sprites['potion'] = this.generatePotionSprite();
    this.sprites['weapon_box'] = this.generateBoxSprite();
    this.sprites['magnet'] = this.generateMagnetSprite();
    
    // Generate Projectiles (Tang Tang Style)
    this.sprites['proj_soccer'] = this.generateSoccerBall();
    this.sprites['proj_brick'] = this.generateBrick();
    this.sprites['proj_rocket'] = this.generateRocket();
    this.sprites['proj_bullet'] = this.generateBullet();
    this.sprites['proj_boomerang'] = this.generateBoomerang();
    this.sprites['proj_guardian'] = this.generateGuardian();
    this.sprites['proj_molotov'] = this.generateMolotov();
    this.sprites['proj_blade_wave'] = this.generateBladeWave();

    // Generate Passives

    this.sprites['passive_he_fuel'] = this.generateHEFuel();
    this.sprites['passive_ammo_thruster'] = this.generateAmmoThruster();
    this.sprites['passive_energy_cube'] = this.generateEnergyCube();
    this.sprites['passive_fitness_guide'] = this.generateFitnessGuide();
    this.sprites['passive_hi_power_magnet'] = this.generateHiPowerMagnet();
    this.sprites['passive_super_magnet'] = this.sprites['passive_hi_power_magnet']; // Alias
    
    // Generate UI Icons
    this.sprites['icon_crown'] = this.generateCrown();
  }

  public getSpriteDataUrl(key: string): string {
      const canvas = this.sprites[key];
      if (!canvas) {
          // Return a transparent 1x1 pixel as fallback or generate a placeholder
          const placeholder = document.createElement('canvas');
          placeholder.width = 32; placeholder.height = 32;
          return placeholder.toDataURL();
      }
      return canvas.toDataURL();
  }


  private createBuffer(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  private generateGridPattern(): CanvasPattern | null {
    const size = 128; // Tile size
    const { canvas, ctx } = this.createBuffer(size, size);

    // 1. Bright Grass Base
    ctx.fillStyle = '#86c25e'; // Bright, cheerful green
    ctx.fillRect(0, 0, size, size);

    // 2. Subtle Checkerboard (lighter green)
    ctx.fillStyle = '#94cf6b';
    ctx.fillRect(0, 0, size/2, size/2);
    ctx.fillRect(size/2, size/2, size/2, size/2);

    // 3. Grid Lines (White, very faint)
    ctx.fillStyle = '#7ab354';
    for(let i=0; i<10; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillRect(x, y, 4, 2); // Grass blade
    }

    return ctx.createPattern(canvas, 'repeat');
  }

  public generateFireZonePattern(): CanvasPattern | null {
      if (this.firePattern) return this.firePattern;

      const size = 64;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // 1. Lava/Magma Base
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size);
      grad.addColorStop(0, '#fbbf24'); // Center Yellow
      grad.addColorStop(0.4, '#f97316'); // Orange
      grad.addColorStop(0.8, '#ef4444'); // Red
      grad.addColorStop(1, '#7f1d1d'); // Dark Red Edge
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      
      // 2. Noise / Texture (Bubbles)
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      for(let i=0; i<10; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 2 + Math.random() * 6;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fill();
      }
      
      // 3. Dark Charred Spots
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for(let i=0; i<5; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 4 + Math.random() * 8;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fill();
      }

      return ctx.createPattern(canvas, 'repeat');
  }

  public generatePoisonZonePattern(): CanvasPattern | null {
      if (this.poisonPattern) return this.poisonPattern;

      const size = 64;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // 1. Dark Purple + Green Gradient Base
      const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size);
      grad.addColorStop(0, '#a3e635');   // Center Lime (Toxic Core)
      grad.addColorStop(0.3, '#84cc16'); // Lime Green
      grad.addColorStop(0.6, '#7e22ce'); // Purple
      grad.addColorStop(1, '#581c87');   // Dark Purple Edge
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      
      // 2. Toxic Bubbles (Random Pop)
      // Bright Lime Bubbles
      ctx.fillStyle = 'rgba(163, 230, 53, 0.6)'; // #a3e635
      for(let i=0; i<8; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 2 + Math.random() * 5;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fill();
      }
      
      // Dark Purple Bubbles (Depth)
      ctx.fillStyle = 'rgba(59, 7, 100, 0.5)';
      for(let i=0; i<6; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 3 + Math.random() * 6;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fill();
      }

      return ctx.createPattern(canvas, 'repeat');
  }

  private drawOutlinedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius: number = 0) {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      
      ctx.fillStyle = color;
      ctx.fill();
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2d2d2d'; // Dark Outline (Cartoon Style)
      ctx.stroke();
  }

  private generateCartoonPlayer(): HTMLCanvasElement {
    const size = 64; // High res for crispness
    const { canvas, ctx } = this.createBuffer(size, size);
    
    // Body (Army Jacket)
    this.drawOutlinedRect(ctx, 20, 36, 24, 20, '#4ade80'); // Green Uniform
    
    // Head (Skin)
    ctx.beginPath();
    ctx.arc(32, 24, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe0bd'; // Skin
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2d2d2d';
    ctx.stroke();

    // Red Bandana
    ctx.beginPath();
    ctx.rect(18, 14, 28, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.stroke();
    // Bandana knot
    ctx.beginPath();
    ctx.moveTo(46, 16);
    ctx.lineTo(54, 14);
    ctx.lineTo(54, 22);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.stroke();

    // Gun (Simple grey block)
    this.drawOutlinedRect(ctx, 36, 36, 20, 6, '#94a3b8');
    
    // Eyes (Dot eyes for cute look)
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath(); ctx.arc(28, 24, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(36, 24, 2, 0, Math.PI*2); ctx.fill();

    return canvas;
  }

  private generateCartoonEnemy(color: string, type: string): HTMLCanvasElement {
    const size = 64;
    const { canvas, ctx } = this.createBuffer(size, size);

    if (type === 'basic') {
      // Box Zombie
      this.drawOutlinedRect(ctx, 16, 20, 32, 32, color);
      // Face
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(24, 30, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(40, 30, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Mouth (Stitched)
      ctx.beginPath();
      ctx.moveTo(26, 42); ctx.lineTo(38, 42);
      ctx.moveTo(28, 40); ctx.lineTo(28, 44);
      ctx.moveTo(32, 40); ctx.lineTo(32, 44);
      ctx.moveTo(36, 40); ctx.lineTo(36, 44);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2d2d2d';
      ctx.stroke();

    } else if (type === 'tank') {
      // Big Robot
      this.drawOutlinedRect(ctx, 12, 12, 40, 40, color);
      // Cyclops Eye
      this.drawOutlinedRect(ctx, 20, 24, 24, 8, '#1e293b'); // Visor
      ctx.fillStyle = 'red';
      ctx.beginPath(); ctx.arc(32, 28, 3, 0, Math.PI*2); ctx.fill();

    } else if (type === 'speedy') {
      // Bat Wings
      ctx.beginPath();
      ctx.moveTo(32, 24);
      ctx.bezierCurveTo(48, 10, 60, 20, 50, 40); // R Wing
      ctx.lineTo(32, 48); // Body Btm
      ctx.lineTo(14, 40); // L Wing Btm
      ctx.bezierCurveTo(4, 20, 16, 10, 32, 24); // L Wing Top
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2d2d2d';
      ctx.stroke();
      
      // Eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(28, 32, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(36, 32, 2, 0, Math.PI*2); ctx.fill();

    } else if (type === 'boss') {
      // Giant Skull shape
      ctx.beginPath();
      ctx.arc(32, 28, 20, 0, Math.PI*2); // Cranium
      ctx.rect(22, 40, 20, 12); // Jaw
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2d2d2d';
      ctx.stroke();
      
      // Angry Eyes
      ctx.beginPath();
      ctx.moveTo(22, 24); ctx.lineTo(30, 28); // L Brow
      ctx.moveTo(42, 24); ctx.lineTo(34, 28); // R Brow
      ctx.stroke();
      
    } else {
        // Fallback Blob
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI*2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2d2d2d';
        ctx.stroke();
    }

    return canvas;
  }

  private generateGemSprite(color: string): HTMLCanvasElement {
    const size = 32;
    const { canvas, ctx } = this.createBuffer(size, size);
    
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(16, 4);
    ctx.lineTo(28, 16);
    ctx.lineTo(16, 28);
    ctx.lineTo(4, 16);
    ctx.closePath();
    
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2d2d2d';
    ctx.stroke();
    
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(16, 8);
    ctx.lineTo(22, 16);
    ctx.lineTo(16, 20);
    ctx.lineTo(10, 16);
    ctx.fill();

    return canvas;
  }
  
  private generateCoinSprite(): HTMLCanvasElement {
    const size = 32;
    const { canvas, ctx } = this.createBuffer(size, size);
    
    // Circle
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI*2);
    ctx.fillStyle = '#fbbf24'; // Gold
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();
    
    // 'C' or '$'
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 16, 16);
    
    return canvas;
  }

  private generatePotionSprite(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // Flask
      ctx.beginPath();
      ctx.arc(16, 20, 8, 0, Math.PI*2);
      ctx.fillStyle = '#f87171'; // Red Liquid
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2d2d2d';
      ctx.stroke();
      
      // Neck
      ctx.fillStyle = '#fff';
      ctx.fillRect(14, 8, 4, 6);
      ctx.strokeRect(14, 8, 4, 6);
      
      return canvas;
  }
  
  private generateBoxSprite(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // Elite Chest (Gold & Red)
      this.drawOutlinedRect(ctx, 4, 10, 24, 16, '#b91c1c'); // Deep Red
      
      // Gold trim/bands
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 10, 4, 16); // Vertical Band
      ctx.fillRect(4, 16, 24, 4);  // Horizontal Band
      
      // Gold Border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(4, 10, 24, 16);
      
      return canvas;
  }
  
  private generateMagnetSprite(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // Rotate slightly for style
      ctx.translate(16, 16);
      ctx.rotate(-Math.PI / 4);
      ctx.translate(-16, -16);

      // U-Shape Path
      ctx.beginPath();
      ctx.arc(16, 16, 10, Math.PI, 0); // Top arc
      ctx.lineTo(26, 26); // Right leg down
      ctx.lineTo(18, 26); // Right leg inner
      ctx.lineTo(18, 16); // Right inner up
      ctx.arc(16, 16, 2, 0, Math.PI, true); // Inner arc
      ctx.lineTo(14, 26); // Left inner down
      ctx.lineTo(6, 26); // Left leg down
      ctx.lineTo(6, 16); // Left leg up
      ctx.closePath();

      // Fill Red (N) and Blue (S)
      // We'll split it vertically for visual style
      ctx.save();
      ctx.clip();
      
      // Left side (Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, 0, 16, 32);
      
      // Right side (Blue)
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(16, 0, 16, 32);
      
      ctx.restore();
      
      // Outline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#2d2d2d';
      ctx.stroke();
      
      // Silver Tips at bottom
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(6, 22, 8, 4);
      ctx.strokeRect(6, 22, 8, 4);
      
      ctx.fillRect(18, 22, 8, 4);
      ctx.strokeRect(18, 22, 8, 4);
      
      return canvas;
  }

  // --- Equipment Icons (Parameterized) ---

  private generateNecklace(style: 'metal' | 'bone' | 'emerald' | 'trendy'): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);

      // Chain
      ctx.beginPath();
      ctx.ellipse(0, -5, 20, 15, 0, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = style === 'bone' ? '#f5f5f4' : style === 'trendy' ? '#f472b6' : '#d4d4d8';
      ctx.stroke();

      // Pendant
      if (style === 'metal') {
          // Dog Tag style
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-8, 5, 16, 22);
          ctx.strokeRect(-8, 5, 16, 22);
      } else if (style === 'bone') {
          // Skull/Bone
          ctx.fillStyle = '#e7e5e4';
          ctx.beginPath();
          ctx.arc(0, 15, 8, 0, Math.PI*2);
          ctx.fill();
          ctx.beginPath(); ctx.arc(-5, 22, 4, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(5, 22, 4, 0, Math.PI*2); ctx.fill();
      } else if (style === 'emerald') {
          // Green Gem
          ctx.beginPath();
          ctx.moveTo(0, 5); ctx.lineTo(12, 15); ctx.lineTo(0, 25); ctx.lineTo(-12, 15);
          ctx.closePath();
          ctx.fillStyle = '#10b981'; 
          ctx.fill();
          ctx.strokeStyle = '#047857'; ctx.lineWidth = 2; ctx.stroke();
      } else if (style === 'trendy') {
          // Pink Charm
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.moveTo(0, 8);
          ctx.bezierCurveTo(8, 2, 16, 10, 0, 26);
          ctx.bezierCurveTo(-16, 10, -8, 2, 0, 8);
          ctx.fill();
          ctx.stroke();
      }

      return canvas;
  }

  private generateGlove(style: 'army' | 'shiny' | 'leather' | 'protective'): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);
      
      const color = 
        style === 'army' ? '#57534e' : // Dark Grey/Khaki
        style === 'shiny' ? '#fbbf24' : // Gold
        style === 'leather' ? '#78350f' : // Brown
        '#10b981'; // Green (Protective)

      // Glove Shape
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-15, -15, 30, 30, 5);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2d2d2d';
      ctx.stroke();

      // Fingers
      ctx.fillStyle = color;
      ctx.fillRect(-15, -15, 8, 12); // Pinky
      ctx.fillRect(-5, -20, 8, 17); // Ring
      ctx.fillRect(5, -20, 8, 17); // Middle
      
      // Knuckles / Detail
      if (style === 'shiny') {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
      } else if (style === 'army') {
          ctx.fillStyle = '#292524'; // Camo patch
          ctx.fillRect(-10, -5, 20, 10);
      } else if (style === 'protective') {
          // Biohazard symbolish
          ctx.strokeStyle = '#ecfccb';
          ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
      }

      return canvas;
  }

  private generateBelt(style: 'army' | 'energy' | 'leather' | 'sensor'): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);

      // Strap Color
      const strapColor = 
        style === 'army' ? '#57534e' : 
        style === 'energy' ? '#1e3a8a' :
        style === 'sensor' ? '#581c87' : '#3f2c22';

      // Strap
      ctx.fillStyle = strapColor;
      ctx.fillRect(-28, -8, 56, 16);
      ctx.strokeRect(-28, -8, 56, 16);

      // Buckle
      ctx.fillStyle = style === 'energy' ? '#3b82f6' : '#fbbf24';
      ctx.fillRect(-10, -12, 20, 24);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2d2d2d';
      ctx.strokeRect(-10, -12, 20, 24);

      // Detail
      if (style === 'energy') {
          ctx.fillStyle = '#93c5fd';
          ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
      } else if (style === 'sensor') {
          ctx.fillStyle = '#d8b4fe';
          ctx.fillRect(-8, -4, 16, 8);
      }

      return canvas;
  }

  private generateBoots(style: 'army' | 'energy' | 'prosthetic' | 'thick'): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);

      const color = 
        style === 'army' ? '#57534e' : 
        style === 'energy' ? '#2563eb' :
        style === 'thick' ? '#e5e5e5' : '#525252';

      // Boot Shape
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-10, -15);
      ctx.lineTo(10, -15);
      ctx.lineTo(10, 10);
      ctx.quadraticCurveTo(15, 15, 20, 25); // Toe
      ctx.lineTo(-10, 25); // Sole
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#171717';
      ctx.stroke();

      // Details
      if (style === 'energy') {
          ctx.fillStyle = '#facc15'; // Lightning
          ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(15, 5); ctx.lineTo(5, 10); ctx.fill();
      } else if (style === 'prosthetic') {
          ctx.fillStyle = '#94a3b8'; // Metal
          ctx.fillRect(-5, -15, 10, 30);
          ctx.strokeRect(-5, -15, 10, 30);
      }

      return canvas;
  }
  
  private generateKunaiIcon(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);
      ctx.rotate(-Math.PI / 4);

      // Blade
      ctx.fillStyle = '#e2e8f0'; // Silver
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      // Handle
      ctx.fillStyle = '#ef4444'; // Red Handle
      ctx.fillRect(-2, 8, 4, 10);
      
      // Ring
      ctx.beginPath();
      ctx.arc(0, 22, 4, 0, Math.PI*2);
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();

      return canvas;
  }

  private generateKatanaIcon(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);
      ctx.rotate(-Math.PI / 4);

      // Blade (Curved)
      ctx.beginPath();
      ctx.moveTo(-20, -10);
      ctx.quadraticCurveTo(0, -15, 20, -20); // Top Edge
      ctx.lineTo(25, -15); // Tip
      ctx.quadraticCurveTo(5, -10, -15, -5); // Bottom Edge
      ctx.closePath();
      
      // Gradient Blade
      const grad = ctx.createLinearGradient(-20, -10, 25, -15);
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.5, '#e2e8f0');
      grad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      // Tsuba (Guard)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(-16, -6, 4, 8, Math.PI/4, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Handle
      ctx.fillStyle = '#1e293b'; // Dark Blue/Black
      ctx.beginPath();
      ctx.moveTo(-18, -4);
      ctx.lineTo(-28, 4);
      ctx.lineTo(-24, 8);
      ctx.lineTo(-14, 0);
      ctx.fill();
      
      // Diamond Pattern on handle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(-21, 2, 1, 0, Math.PI*2); ctx.fill();

      return canvas;
  }

  private generateBladeWave(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(64, 64);
      ctx.translate(32, 32);
      
      // Crescent Moon Shape
      ctx.beginPath();
      ctx.arc(0, 0, 20, -Math.PI/2, Math.PI/2, false); // Outer arc
      ctx.bezierCurveTo(10, 10, 10, -10, 0, -20); // Inner curve
      ctx.closePath();
      
      // Gradient
      const grad = ctx.createLinearGradient(-10, 0, 20, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0)'); // Fade to transparent blue
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Glow Outline
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#60a5fa'; // Blue
      ctx.stroke();
      
      return canvas;
  }

  // --- Projectile Generators ---


  private generateBullet(): HTMLCanvasElement {
      const w = 36; 
      const h = 14; 
      const size = 48; 
      const { canvas, ctx } = this.createBuffer(size, size);
      
      const cx = size / 2;
      const cy = size / 2;
      
      ctx.translate(cx, cy);
      
      // 1. Thick Outline (Black)
      ctx.fillStyle = '#000000';
      this.drawCapsule(ctx, -w/2 - 2, -h/2 - 2, w + 4, h + 4);
      
      // 2. Core Body (Neon Yellow / Gold)
      const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
      grad.addColorStop(0, '#ffff00'); // Neon Yellow
      grad.addColorStop(1, '#eab308'); // Darker Gold
      ctx.fillStyle = grad;
      this.drawCapsule(ctx, -w/2, -h/2, w, h);
      
      // 3. Highlight (Shiny White) - Top half
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.drawCapsule(ctx, -w/2 + 4, -h/2 + 2, w - 8, h/2 - 2);

      return canvas;
  }

  private drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
      const r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arc(x + w - r, y + r, r, -Math.PI/2, Math.PI/2);
      ctx.lineTo(x + r, y + h);
      ctx.arc(x + r, y + r, r, Math.PI/2, -Math.PI/2);
      ctx.closePath();
      ctx.fill();
  }

  private generateSoccerBall(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // White Background
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // Black Pentagons (Symbolic)
      ctx.fillStyle = '#171717'; // Almost black
      
      // Center Pentagon
      ctx.beginPath();
      for(let i=0; i<5; i++) {
          const angle = (i * 72 - 18) * Math.PI/180;
          const r = 5;
          const x = 16 + Math.cos(angle) * r;
          const y = 16 + Math.sin(angle) * r;
          if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Side Patches (Partial)
      for(let i=0; i<5; i++) {
          const angle = (i * 72 - 18) * Math.PI/180;
          const x = 16 + Math.cos(angle) * 12;
          const y = 16 + Math.sin(angle) * 12;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI*2);
          ctx.fill();
      }

      // Thick Outline
      ctx.beginPath();
      ctx.arc(16, 16, 14, 0, Math.PI*2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      return canvas;
  }

  private generateBrick(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);

      // Drop Shadow (3D effect)
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(6, 6, 22, 12);

      // Main Body
      ctx.fillStyle = '#9f1239'; // Brick Red
      ctx.fillRect(4, 4, 22, 12);
      
      // Holes
      ctx.fillStyle = '#4c0519'; // Dark Red
      ctx.beginPath(); ctx.arc(10, 10, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, 10, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 10, 2, 0, Math.PI*2); ctx.fill();

      // Outline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(4, 4, 22, 12);

      return canvas;
  }

  private generateRocket(): HTMLCanvasElement {
      const size = 32; // Rotated in engine, draw pointing RIGHT
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // Fins
      ctx.fillStyle = '#64748b'; // Slate Grey
      ctx.beginPath();
      ctx.moveTo(4, 10); ctx.lineTo(12, 10); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 22); ctx.lineTo(12, 22); ctx.lineTo(4, 28); ctx.closePath(); ctx.fill(); ctx.stroke();

      // Body (Cylinder)
      ctx.fillStyle = '#f8fafc'; // White
      ctx.fillRect(6, 10, 18, 12);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(6, 10, 18, 12);

      // Warhead (Red Cone)
      ctx.fillStyle = '#ef4444'; // Red
      ctx.beginPath();
      ctx.moveTo(24, 10);
      ctx.lineTo(30, 16); // Tip
      ctx.lineTo(24, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      return canvas;
  }

  private generateBoomerang(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // V-Shape
      ctx.fillStyle = '#2dd4bf'; // Teal
      ctx.beginPath();
      ctx.moveTo(28, 4);
      ctx.quadraticCurveTo(16, 16, 4, 28); // Inner curve
      ctx.quadraticCurveTo(16, 20, 28, 14); // Outer top
      ctx.lineTo(28, 4); // Close tip
      ctx.fill();
      
      // Outline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Wood accent stripe
      ctx.strokeStyle = '#115e59';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 8);
      ctx.quadraticCurveTo(16, 16, 8, 24);
      ctx.stroke();

      return canvas;
  }

  private generateGuardian(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      ctx.translate(16, 16);
      
      // Gear / Spinner
      ctx.fillStyle = '#fbbf24'; // Amber/Gold
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      
      ctx.beginPath();
      const outerRadius = 14;
      const innerRadius = 8;
      const spikes = 6;
      
      for(let i=0; i<spikes * 2; i++) {
          const r = (i % 2 === 0) ? outerRadius : innerRadius;
          const angle = (i / (spikes * 2)) * Math.PI * 2;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Center Hub
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      return canvas;
  }

  private generateMolotov(): HTMLCanvasElement {
      const size = 32;
      const { canvas, ctx } = this.createBuffer(size, size);
      
      // Bottle Body (Brown Glass)
      ctx.translate(16, 16);
      
      // Glass color
      ctx.fillStyle = '#92400e'; 
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      
      // Main Body
      ctx.beginPath();
      ctx.roundRect(-6, -2, 12, 14, 2);
      ctx.fill();
      ctx.stroke();
      
      // Neck
      ctx.beginPath();
      ctx.rect(-3, -8, 6, 6);
      ctx.fill();
      ctx.stroke();
      
      // Wick (White Cloth)
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.rect(-2, -10, 4, 4);
      ctx.fill();
      
      // Flame (Animated feel via shape)
      const grad = ctx.createLinearGradient(0, -18, 0, -10);
      grad.addColorStop(0, '#ef4444'); // Red Top
      grad.addColorStop(1, '#fbbf24'); // Yellow Base
      ctx.fillStyle = grad;
      
      ctx.beginPath();
      ctx.moveTo(-2, -10);
      ctx.quadraticCurveTo(-6, -16, 0, -22); // Flame tip left
      ctx.quadraticCurveTo(6, -16, 2, -10); // Flame tip right
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, 2, 8, 4);

      return canvas;
  }

  // --- Passive Icons ---

  private generateHEFuel(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(40, 40);
      const cx = 20, cy = 20;
      
      // Canister Body (Red)
      this.drawOutlinedRect(ctx, 10, 10, 20, 24, '#ef4444');
      
      // Yellow Stripe
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 20, 20, 6);
      ctx.strokeRect(10, 20, 20, 6);
      
      // Cap
      ctx.fillStyle = '#525252';
      ctx.fillRect(16, 6, 8, 4);
      ctx.strokeRect(16, 6, 8, 4);
      
      // "HE" Text
      ctx.fillStyle = 'black';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HE', 20, 26);
      
      return canvas;
  }

  private generateAmmoThruster(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(40, 40);
      
      // Missile pointing UP
      ctx.translate(20, 20);
      ctx.rotate(-Math.PI / 4); // Angled dynamic look
      
      // Body
      ctx.fillStyle = '#cbd5e1'; // Silver
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(6, -10);
      ctx.lineTo(6, 10);
      ctx.lineTo(-6, 10);
      ctx.fill();
      ctx.stroke();
      
      // Warhead
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(0, -18);
      ctx.lineTo(6, -10);
      ctx.fill();
      ctx.stroke();
      
      // Fins
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-6, 6); ctx.lineTo(-12, 12); ctx.lineTo(-6, 10);
      ctx.moveTo(6, 6); ctx.lineTo(12, 12); ctx.lineTo(6, 10);
      ctx.fill();
      ctx.stroke();
      
      // Thruster Flame
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-4, 10); ctx.lineTo(0, 18); ctx.lineTo(4, 10);
      ctx.fill();

      return canvas;
  }

  private generateEnergyCube(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(40, 40);
      
      // Isometric Cube
      ctx.translate(20, 20);
      
      const size = 12;
      
      // Top Face
      ctx.fillStyle = '#60a5fa'; // Blue
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size, -size/2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-size, -size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Right Face
      ctx.fillStyle = '#3b82f6'; // Darker Blue
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, -size/2);
      ctx.lineTo(size, size);
      ctx.lineTo(0, size*1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Left Face
      ctx.fillStyle = '#2563eb'; // Even Darker
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, -size/2);
      ctx.lineTo(-size, size);
      ctx.lineTo(0, size*1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Glow (Neon)
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, 4, 4); // Core

      return canvas;
  }

  private generateFitnessGuide(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(40, 40);
      
      // Green Book
      ctx.translate(20, 20);
      
      // Back Cover
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-12, -14, 26, 30);
      
      // Pages
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(-10, -12, 22, 26);
      
      // Cover
      ctx.fillStyle = '#22c55e'; // Green
      ctx.fillRect(-12, -14, 22, 30);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#14532d';
      ctx.strokeRect(-12, -14, 22, 30);
      
      // Heart Icon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.bezierCurveTo(-1, -3, -5, -3, -5, 0);
      ctx.bezierCurveTo(-5, 4, -1, 6, -1, 8);
      ctx.bezierCurveTo(-1, 6, 3, 4, 3, 0);
      ctx.bezierCurveTo(3, -3, -1, -3, -1, 0);
      ctx.fill();

      return canvas;
  }

  private generateHiPowerMagnet(): HTMLCanvasElement {
      // Reuse magnet sprite but add Halo
      const base = this.generateMagnetSprite();
      const { canvas, ctx } = this.createBuffer(40, 40);
      
      // Halo (Gold Ring) behind
      ctx.beginPath();
      ctx.ellipse(20, 12, 14, 6, 0, 0, Math.PI*2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fbbf24'; // Gold
      ctx.stroke();
      
      // Draw Base Magnet centered
      ctx.drawImage(base, 4, 4);
      
      // Shine on Halo
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(20, 12, 14, 6, 0, 0, Math.PI*0.5);
      ctx.stroke();
      
      return canvas;
  }

  private generateCrown(): HTMLCanvasElement {
      const { canvas, ctx } = this.createBuffer(32, 32);
      ctx.fillStyle = '#fbbf24'; // Gold
      ctx.strokeStyle = '#b45309'; // Dark Gold Outline
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(4, 24); 
      ctx.lineTo(28, 24); // Base
      ctx.lineTo(28, 12); 
      ctx.lineTo(22, 18); 
      ctx.lineTo(16, 6); // Center Point
      ctx.lineTo(10, 18); 
      ctx.lineTo(4, 12); 
      ctx.closePath();
      
      ctx.fill(); 
      ctx.stroke();
      
      // Gems
      ctx.fillStyle = '#ef4444'; // Red Gem
      ctx.beginPath(); ctx.arc(16, 20, 2, 0, Math.PI*2); ctx.fill();
      
      return canvas;
  }
}
