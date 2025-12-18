export interface Vector2 {
  x: number;
  y: number;
}

export enum GameState {
  START = 0,
  PLAYING = 1,
  PAUSED = 2,
  GAMEOVER = 3
}

export const MAX_WEAPON_SLOTS = 4;
export const MAX_PASSIVE_SLOTS = 6;

export type EnemyType = 'basic' | 'tank' | 'speedy' | 'elite_shooter' | 'poisoner' | 'boss';

export interface EnemyConfig {
  type: EnemyType;
  hpMultiplier: number;
  speedMultiplier: number;
  sizeMultiplier: number;
  color: string;
  mass: number;
}

export interface PoisonZone {
  x: number;
  y: number;
  radius: number;
  duration: number;
  damage: number;
  damageInterval: number;
}

export interface GameConfig {
  width: number;
  height: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  speed: number;
  magnetRange: number;
  xp: number;
  maxXp: number;
  level: number;
  score: number;
  
  // Permanent Stat Levels
  permDamage: number;
  permHp: number;
  permSpeed: number;
  permGold: number;
  permMagnet: number;

  // Global Multipliers
  damageMultiplier: number;
  durationMultiplier: number;
  cooldownMultiplier: number;
  moveSpeedMultiplier: number;
  magnetRadiusMultiplier: number;
  gainMultiplier: number;
  areaMultiplier: number;        // New: HE Fuel
  bulletSpeedMultiplier: number; // New: Ammo Thruster

  // Weapon Stats
  projectileCount: number;
  fireRate: number;
  bulletSpeed: number;
  damage: number;
  critRate: number;
  critDamage: number;
  
  // Garlic
  garlicLevel: number;
  garlicRadius: number;
  garlicDamage: number;
  garlicInterval: number;
}

export interface PermanentStats {
  baseDamage: number; // Level
  baseHp: number;     // Level
  goldGain: number;   // Level
  moveSpeed: number;  // Level
  magnetRange: number;// Level
}

export interface UpgradeConfig {
  baseCost: number;
  growthRate: number;
  maxLevel: number;
}

export const UPGRADE_CONFIGS: Record<keyof PermanentStats, UpgradeConfig> = {
  baseDamage: { baseCost: 500, growthRate: 1.5, maxLevel: 50 },
  baseHp:     { baseCost: 500, growthRate: 1.5, maxLevel: 50 },
  goldGain:   { baseCost: 1000, growthRate: 1.3, maxLevel: 20 },
  moveSpeed:  { baseCost: 300, growthRate: 1.2, maxLevel: 20 },
  magnetRange:{ baseCost: 300, growthRate: 1.2, maxLevel: 20 },
};

export type UpgradeType = 'weapon' | 'stat' | 'passive';
export type LootType = 'xp' | 'gold' | 'potion' | 'weapon_box' | 'chest' | 'magnet';
export type WeaponType = 'lightning' | 'boomerang' | 'molotov' | 'guardian' | 'brick' | 'soccer' | 'rocket' | 'inferno' | 'destroyer' | 'pistol' | 'katana';
export type PassiveType = 'he_fuel' | 'ammo_thruster' | 'energy_cube' | 'fitness_guide' | 'hi_power_magnet' | 'high_power_fuel' | 'sneakers' | 'energy_drink' | 'oil_barrel' | 'exo_skeleton' | 'super_magnet';

export type SlotType = 'weapon' | 'necklace' | 'glove' | 'belt' | 'boots';

export interface ItemStats {
  damage?: number; // Multiplier add (e.g., 0.1 for +10%)
  hp?: number; // Flat add
  speed?: number; // Multiplier add
  cooldown?: number; // Multiplier subtract (e.g., 0.1 for -10% CD)
  crit?: number; // Flat add (0.05 for +5%)
  critDamage?: number; // Multiplier add
}

export interface ItemDef {
  id: string;
  type: SlotType;
  name: string;
  description: string;
  stats: ItemStats;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}


export interface WeaponStats {
  id: WeaponType;
  name: string;
  description: string;
  level: number;
  damage: number;
  area: number;
  speed: number;
  duration: number;
  cooldown: number;
  amount: number;
  isEvolved?: boolean;
}

export interface EvolutionRecipe {
  weapon: WeaponType;
  passive: PassiveType;
  result: WeaponType;
}

export interface UpgradeOption {
  id: string;
  type: UpgradeType;
  weaponType?: WeaponType;
  passiveType?: PassiveType;
  statType?: string;
  title: string;
  description: string;
  isNew: boolean;
  isEvolution?: boolean;
  evolutionPair?: string;
  evolutionOwned?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  velocityY: number;
}
