import React, { useState } from 'react';
import { DataManager, ITEM_DATABASE } from '../game/DataManager';
import { AssetGenerator } from '../game/AssetGenerator';
import { ItemDef, SlotType } from '../game/types';

interface Props {
  onClose: () => void;
  onPlay: () => void;
}

export const InventoryModal: React.FC<Props> = ({ onClose, onPlay }) => {
  const [equipped, setEquipped] = useState({ ...DataManager.data.equippedItems });
  const [selectedSlot, setSelectedSlot] = useState<SlotType | null>(null);

  const handleEquip = (item: ItemDef) => {
    const newEquipped = { ...equipped, [item.type]: item.id };
    setEquipped(newEquipped);
    DataManager.data.equippedItems = newEquipped;
    DataManager.save();
    setSelectedSlot(null); // Close selection
  };

  const getItemIcon = (item: ItemDef) => {
      // Special cases for old/legacy items if any
      if (item.id === 'kunai') return 'icon_kunai';
      if (item.id === 'katana') return 'icon_katana';
      // For new items, sprite key matches item ID
      return item.id;
  };

  const renderSlot = (type: SlotType, label: string) => {
    const itemId = equipped[type];
    const item = itemId ? ITEM_DATABASE[itemId] : null;
    const iconUrl = item ? AssetGenerator.getInstance().getSpriteDataUrl(getItemIcon(item)) : '';

    const rarityColor = item ? {
        common: 'border-gray-500 bg-gray-500/10',
        rare: 'border-green-400 bg-green-500/10',
        epic: 'border-purple-400 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
        legendary: 'border-yellow-400 bg-yellow-500/10 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
    }[item.rarity] : 'border-gray-700 bg-gray-800';

    return (
      <div className="flex flex-col items-center gap-2">
        <div 
          onClick={() => setSelectedSlot(type)}
          className={`w-20 h-20 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-700/50 transition-all relative border-2
            ${selectedSlot === type ? 'ring-2 ring-white scale-105' : ''}
            ${rarityColor}
          `}
        >
          {item ? (
             <img src={iconUrl} alt={item.name} className="w-14 h-14 object-contain drop-shadow-md" />
          ) : (
             <span className="text-gray-600 text-2xl">➕</span>
          )}
          
          {/* Rarity Label (Tiny) */}
          {item && item.rarity === 'legendary' && (
              <div className="absolute -top-2 -right-2 text-[10px] bg-yellow-500 text-black px-1.5 rounded font-bold animate-pulse">LEGEND</div>
          )}
        </div>
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">{label}</span>
      </div>
    );
  };

  // Filter items for the selected slot
  const availableItems = selectedSlot 
    ? Object.values(ITEM_DATABASE).filter(i => i.type === selectedSlot)
    : [];

  // Get current stats summary
  const getStatSummary = () => {
    const stats: Record<string, number> = { hp: 0, atk: 0, spd: 0, cd: 0, crit: 0 };
    Object.values(equipped).forEach(id => {
        const item = ITEM_DATABASE[id];
        if(!item) return;
        if(item.stats.hp) stats.hp += item.stats.hp;
        if(item.stats.damage) stats.atk += item.stats.damage * 100;
        if(item.stats.speed) stats.spd += item.stats.speed * 100;
        if(item.stats.cooldown) stats.cd += item.stats.cooldown * 100;
        if(item.stats.crit) stats.crit += item.stats.crit * 100;
    });
    return stats;
  };

  // Calculate stat difference
  const getStatDiff = (newItem: ItemDef) => {
      const currentId = equipped[newItem.type];
      const currentItem = currentId ? ITEM_DATABASE[currentId] : null;
      
      const diffs: Record<string, number> = {};
      
      // Keys to check
      const keys = ['hp', 'damage', 'speed', 'cooldown', 'crit', 'critDamage'] as const;
      
      keys.forEach(key => {
          const v1 = currentItem?.stats[key] || 0;
          const v2 = newItem.stats[key] || 0;
          if (v1 !== v2) diffs[key] = v2 - v1;
      });
      
      return diffs;
  };

  const summary = getStatSummary();

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
          <h2 className="text-3xl font-black text-white italic tracking-wider">LOADOUT</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-xl">✕</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            
            {/* Left: Character & Slots */}
            <div className="w-1/2 p-8 flex flex-col items-center justify-center relative bg-gradient-to-b from-gray-800/20 to-gray-900/50">
                {/* Character Silhouette Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                     <div className="w-64 h-96 bg-black rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex gap-8">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6 pt-12">
                        {renderSlot('weapon', 'Weapon')}
                        {renderSlot('glove', 'Gloves')}
                        {renderSlot('boots', 'Boots')}
                    </div>
                    
                    {/* Character Center (Visual Only) */}
                    <div className="w-32 flex flex-col items-center justify-center">
                        <img 
                            src={AssetGenerator.getInstance().getSpriteDataUrl('player')} 
                            className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            alt="Character"
                        />
                        <div className="mt-4 text-center">
                            <div className="text-green-400 font-bold text-sm">SURVIVOR</div>
                            <div className="text-gray-500 text-xs">Lv. 1</div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6 pt-12">
                        {renderSlot('necklace', 'Necklace')}
                        {renderSlot('belt', 'Belt')}
                    </div>
                </div>

                {/* Stat Summary */}
                <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md bg-black/30 p-4 rounded-xl border border-gray-800">
                     <div className="text-center"><div className="text-xs text-gray-500">ATK</div><div className="text-red-400 font-bold">+{summary.atk.toFixed(0)}%</div></div>
                     <div className="text-center"><div className="text-xs text-gray-500">HP</div><div className="text-green-400 font-bold">+{summary.hp}</div></div>
                     <div className="text-center"><div className="text-xs text-gray-500">SPD</div><div className="text-blue-400 font-bold">+{summary.spd.toFixed(0)}%</div></div>
                     <div className="text-center"><div className="text-xs text-gray-500">CD</div><div className="text-yellow-400 font-bold">-{summary.cd.toFixed(0)}%</div></div>
                     <div className="text-center"><div className="text-xs text-gray-500">CRIT</div><div className="text-purple-400 font-bold">+{summary.crit.toFixed(0)}%</div></div>
                </div>
            </div>

            {/* Right: Selection / Details */}
            <div className="w-1/2 border-l border-gray-800 bg-gray-900 p-6 flex flex-col">
                {selectedSlot ? (
                    <>
                        <h3 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
                            <span className="w-2 h-8 bg-yellow-500 rounded-sm"></span>
                            SELECT {selectedSlot.toUpperCase()}
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {availableItems.map(item => {
                                const isEquipped = equipped[item.type] === item.id;
                                const iconUrl = AssetGenerator.getInstance().getSpriteDataUrl(getItemIcon(item));
                                const diffs = !isEquipped ? getStatDiff(item) : {};

                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleEquip(item)}
                                        className={`p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all relative overflow-hidden
                                            ${isEquipped ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-500'}
                                        `}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center bg-gray-900 border border-gray-700 shrink-0
                                                ${item.rarity === 'legendary' ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : ''}
                                                ${item.rarity === 'epic' ? 'border-purple-400' : ''}
                                                ${item.rarity === 'rare' ? 'border-blue-400' : ''}
                                            `}>
                                                <img src={iconUrl} className="w-10 h-10 object-contain" alt={item.name}/>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <div className={`font-bold text-sm truncate ${
                                                        item.rarity === 'common' ? 'text-gray-300' :
                                                        item.rarity === 'rare' ? 'text-blue-400' :
                                                        item.rarity === 'epic' ? 'text-purple-400' : 'text-yellow-400'
                                                    }`}>
                                                        {item.name}
                                                    </div>
                                                    {isEquipped && <div className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">EQUIPPED</div>}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                                            </div>
                                        </div>

                                        {/* Stat Comparison */}
                                        {!isEquipped && Object.keys(diffs).length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-700/50">
                                                {Object.entries(diffs).map(([key, val]) => {
                                                    const isBad = (key === 'cooldown' && val > 0) || (key !== 'cooldown' && val < 0);
                                                    const color = isBad ? 'text-red-400' : 'text-green-400';
                                                    const arrow = isBad ? '🔻' : '🔺';
                                                    const formatVal = key === 'hp' ? val : (val * 100).toFixed(0) + '%';
                                                    return (
                                                        <div key={key} className={`text-xs flex items-center gap-1 ${color}`}>
                                                            <span className="uppercase text-gray-500 font-bold text-[9px]">{key}</span>
                                                            <span className="font-mono">{val > 0 && key !== 'cooldown' ? '+' : ''}{formatVal}</span>
                                                            <span>{arrow}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        
                                        {/* Stat Tags (Static) */}
                                        {isEquipped && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {Object.entries(item.stats).map(([k, v]) => (
                                                    <span key={k} className="text-[10px] px-1.5 py-0.5 bg-black/40 rounded text-gray-400 border border-gray-700">
                                                        {k.toUpperCase()} {k === 'cooldown' ? '-' : '+'}{Math.abs(v * (k==='hp'?1:100))}{k==='hp'?'':'%'}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <div className="text-4xl mb-4">🎒</div>
                        <p>Select a slot to change equipment</p>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-950 flex justify-center">
            <button 
                onClick={onPlay}
                className="px-16 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-black text-2xl rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] transform transition-transform hover:scale-105 active:scale-95 flex items-center gap-3"
            >
                <span>BATTLE!</span>
                <span className="text-xl">⚔️</span>
            </button>
        </div>
      </div>
    </div>
  );
};
