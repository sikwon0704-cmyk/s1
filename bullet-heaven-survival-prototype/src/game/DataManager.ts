import { PermanentStats, UPGRADE_CONFIGS, SlotType } from './types';
import { ITEM_DATABASE } from './ItemDatabase';

export { ITEM_DATABASE }; // Re-export for compatibility


export class DataManager {
  private static readonly STORAGE_KEY = 'agent8_survivor_data';
  
  public static data = {
    gold: 0,
    highScore: 0,
    unlockedWeapons: ['rocket'],
    permanentStats: {
      baseDamage: 0,
      baseHp: 0,
      goldGain: 0,
      moveSpeed: 0,
      magnetRange: 0
    } as PermanentStats,
    equippedItems: {
      weapon: 'kunai',
      necklace: 'neck_trendy',
      glove: 'glove_leather',
      belt: 'belt_army',
      boots: 'boot_prosthetic'
    } as Record<SlotType, string>,
    // Give player ALL items for testing
    inventory: Object.keys(ITEM_DATABASE)
  };

  public static load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = { 
          ...this.data, 
          ...parsed,
          permanentStats: { ...this.data.permanentStats, ...(parsed.permanentStats || {}) },
          equippedItems: { ...this.data.equippedItems, ...(parsed.equippedItems || {}) }
        };
      }
    } catch (e) {
      console.error('Failed to load save data', e);
    }
  }


  public static save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save data', e);
    }
  }

  public static addGold(amount: number) {
    this.data.gold += amount;
    this.save();
  }

  public static spendGold(amount: number): boolean {
    if (this.data.gold >= amount) {
      this.data.gold -= amount;
      this.save();
      return true;
    }
    return false;
  }

  public static getUpgradeCost(stat: keyof PermanentStats): number {
    const level = this.data.permanentStats[stat];
    const config = UPGRADE_CONFIGS[stat];
    return Math.floor(config.baseCost * Math.pow(config.growthRate, level));
  }

  public static getMaxLevel(stat: keyof PermanentStats): number {
    return UPGRADE_CONFIGS[stat].maxLevel;
  }

  public static upgradeStat(stat: keyof PermanentStats): boolean {
    const currentLevel = this.data.permanentStats[stat];
    const maxLevel = this.getMaxLevel(stat);

    if (currentLevel >= maxLevel) return false;

    const cost = this.getUpgradeCost(stat);
    
    if (this.spendGold(cost)) {
      this.data.permanentStats[stat]++;
      this.save();
      return true;
    }
    return false;
  }
  
  public static resetStats() {
    this.data.gold = 10000; // Debug start
    this.data.permanentStats = {
      baseDamage: 0,
      baseHp: 0,
      goldGain: 0,
      moveSpeed: 0,
      magnetRange: 0
    };
    this.data.equippedItems = {
      weapon: 'kunai',
      necklace: 'metal_neck',
      glove: 'leather_glove',
      belt: 'leather_belt',
      boots: 'leather_boots'
    };
    this.save();
  }


  public static updateHighScore(score: number) {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
    }
  }
}
