import { PassiveType } from './types';

export interface PassiveDefinition {
  id: PassiveType;
  name: string;
  description: string;
  maxLevel: number;
  rarity: 'common' | 'rare' | 'unique';
  statPerLevel: {
    area?: number;
    bulletSpeed?: number;
    cooldown?: number;
    maxHp?: number;
    magnet?: number;
    damage?: number; // Legacy/Fallback support
    duration?: number; // Legacy/Fallback support
  };
}

export const PASSIVE_ITEMS: Record<PassiveType, PassiveDefinition> = {
  // Common Tier
  high_power_fuel: { // Assuming key in types.ts is high_power_fuel or similar. Using strict match from previous Context or inference.
    // Wait, let's check types.ts later if needed, but based on user request "Common: high_power_fuel"
    // The user listed: high_power_fuel, sneakers
    id: 'high_power_fuel',
    name: 'High Power Fuel',
    description: 'Increases all weapon range by 10%.',
    maxLevel: 5,
    rarity: 'common',
    statPerLevel: { area: 0.10 }
  },
  sneakers: {
    id: 'sneakers',
    name: 'Sneakers',
    description: 'Increases Movement Speed by 10%.',
    maxLevel: 5,
    rarity: 'common',
    statPerLevel: { } // Speed logic handled in Game.ts via passive count or we add speed to interface
  },

  // Rare Tier
  energy_drink: {
    id: 'energy_drink',
    name: 'Energy Drink',
    description: 'Restores 1% HP every 5s & increases Speed by 5%.',
    maxLevel: 5,
    rarity: 'rare',
    statPerLevel: { } // Custom logic or mapped
  },
  fitness_guide: {
    id: 'fitness_guide',
    name: 'Fitness Guide',
    description: 'Increases Max HP by 20%.',
    maxLevel: 5,
    rarity: 'rare',
    statPerLevel: { maxHp: 0.20 }
  },

  // Unique Tier
  oil_barrel: {
    id: 'oil_barrel',
    name: 'Oil Barrel',
    description: 'Increases Gold Gain by 10%.',
    maxLevel: 5,
    rarity: 'unique',
    statPerLevel: { } // Gold gain logic
  },
  exo_skeleton: {
    id: 'exo_skeleton',
    name: 'Exo Skeleton',
    description: 'Increases Weapon Duration by 10%.',
    maxLevel: 5,
    rarity: 'unique',
    statPerLevel: { duration: 0.10 }
  },
  super_magnet: { // mapped to hi_power_magnet in code usually, but user said super_magnet. I will stick to existing keys if possible or alias.
    // Existing file had: hi_power_magnet. I will use hi_power_magnet as ID but maybe display name Super Magnet?
    // User asked for "Unique: super_magnet".
    // I will rename hi_power_magnet to super_magnet if possible, OR just use super_magnet and add it.
    id: 'super_magnet', 
    name: 'Super Magnet',
    description: 'Increases item loot range by 50%.',
    maxLevel: 5,
    rarity: 'unique',
    statPerLevel: { magnet: 0.5 }
  },
  he_fuel: {
    id: 'he_fuel',
    name: 'HE Fuel',
    description: 'Increases all weapon blast radius by 15%.',
    maxLevel: 5,
    rarity: 'unique',
    statPerLevel: { area: 0.15 }
  },
  ammo_thruster: {
    id: 'ammo_thruster',
    name: 'Ammo Thruster',
    description: 'Increases bullet speed by 10% & reduces drag.',
    maxLevel: 5,
    rarity: 'unique',
    statPerLevel: { bulletSpeed: 0.10 }
  },
  energy_cube: {
    id: 'energy_cube',
    name: 'Energy Cube',
    description: 'Reduces cooldown by 8%.',
    maxLevel: 5,
    rarity: 'unique',
    statPerLevel: { cooldown: 0.08 }
  }
};
