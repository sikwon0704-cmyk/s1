import { ItemDef, ItemStats } from './types';

// Helper to create items easily
const createItem = (
  id: string, 
  type: ItemDef['type'], 
  name: string, 
  rarity: ItemDef['rarity'], 
  stats: ItemStats, 
  desc: string
): ItemDef => ({
  id, type, name, rarity, stats, description: desc
});

// 16 Items Definition (Legendary Baseline for "Max Power" feel)
// Rarity scaling logic can be handled elsewhere, but here we define the definitions.
// For simplicity in this prototype, we define them as their "Best" version or just generic.
// The prompt asks to define 16 items. I will define them with specific IDs.

export const ITEM_DATABASE: Record<string, ItemDef> = {
  // --- NECKLACES ---
  'neck_metal': {
    id: 'neck_metal', type: 'necklace', name: 'Metal Neckguard', rarity: 'legendary',
    stats: { hp: 50, damage: 0.1 },
    description: 'Passive: gain +10% Damage. +50 HP.'
  },
  'neck_bone': {
    id: 'neck_bone', type: 'necklace', name: 'Bone Pendant', rarity: 'epic',
    stats: { cooldown: 0.1, speed: 0.1 },
    description: 'Enemies near you are slowed (Simulated via Speed/CD).'
  },
  'neck_emerald': {
    id: 'neck_emerald', type: 'necklace', name: 'Emerald Necklace', rarity: 'rare',
    stats: { hp: 100 },
    description: 'Periodically heals HP.'
  },
  'neck_trendy': {
    id: 'neck_trendy', type: 'necklace', name: 'Trendy Charm', rarity: 'legendary',
    stats: { cooldown: 0.30, damage: 0.15 },
    description: 'Reduces CD by 30%. Legend: ATK +15%.'
  },

  // --- GLOVES ---
  'glove_army': {
    id: 'glove_army', type: 'glove', name: 'Army Gloves', rarity: 'epic',
    stats: { damage: 0.2 },
    description: '+20% Damage to Bosses/Elites.'
  },
  'glove_shiny': {
    id: 'glove_shiny', type: 'glove', name: 'Shiny Wristguard', rarity: 'rare',
    stats: { damage: 0.1, crit: 0.05 },
    description: 'Explodes enemies on death.'
  },
  'glove_leather': {
    id: 'glove_leather', type: 'glove', name: 'Fingerless Gloves', rarity: 'legendary',
    stats: { damage: 0.15, crit: 0.2, critDamage: 1.0 },
    description: 'Crit Rate +20%, Crit Dmg +100%.'
  },
  'glove_protective': {
    id: 'glove_protective', type: 'glove', name: 'Protective Gloves', rarity: 'epic',
    stats: { hp: 50, damage: 0.1 },
    description: 'Creates a radiation zone.'
  },

  // --- BELTS ---
  'belt_army': {
    id: 'belt_army', type: 'belt', name: 'Army Belt', rarity: 'legendary',
    stats: { hp: 100, damage: 0.1 },
    description: 'After killing an Elite, get a shield.'
  },
  'belt_energy': {
    id: 'belt_energy', type: 'belt', name: 'Energy Belt', rarity: 'rare',
    stats: { damage: 0.1, hp: 20 },
    description: 'Triggers pulse when damaged.'
  },
  'belt_leather': {
    id: 'belt_leather', type: 'belt', name: 'Broad Waistguard', rarity: 'epic',
    stats: { hp: 200 },
    description: 'Heals when picking up food.'
  },
  'belt_sensor': {
    id: 'belt_sensor', type: 'belt', name: 'Waist Sensor', rarity: 'legendary',
    stats: { speed: 0.2, hp: 50 },
    description: 'Increases movement speed by 20%.'
  },

  // --- BOOTS ---
  'boot_army': {
    id: 'boot_army', type: 'boots', name: 'Army Boots', rarity: 'epic',
    stats: { speed: 0.1, cooldown: 0.05 },
    description: 'Inspire: Cooldown -5%.'
  },
  'boot_energy': {
    id: 'boot_energy', type: 'boots', name: 'Energy Runners', rarity: 'rare',
    stats: { damage: 0.1 },
    description: 'Leave a trail of fire.'
  },
  'boot_prosthetic': {
    id: 'boot_prosthetic', type: 'boots', name: 'Prosthetic Legs', rarity: 'legendary',
    stats: { speed: 0.3, hp: 50 },
    description: 'Heal periodically while moving.'
  },
  'boot_thick': {
    id: 'boot_thick', type: 'boots', name: 'High Boots', rarity: 'epic',
    stats: { hp: 100, speed: 0.1 },
    description: 'Reduces collision damage.'
  },
  
  // Keep original defaults just in case
  'kunai': { id: 'kunai', type: 'weapon', name: 'Kunai', rarity: 'common', description: 'Auto-aim.', stats: {} },
  'katana': { id: 'katana', type: 'weapon', name: 'Katana', rarity: 'epic', description: 'Blade waves.', stats: { damage: 0.2 } },
};
