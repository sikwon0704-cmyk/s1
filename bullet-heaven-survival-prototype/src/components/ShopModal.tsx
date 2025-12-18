import React, { useState, useEffect } from 'react';
import { DataManager } from '../game/DataManager';
import { PermanentStats } from '../game/types';
import { Swords, Heart, Coins, Footprints, X, RefreshCw, Magnet } from 'lucide-react';
import { Synthesizer } from '../game/Synthesizer';

interface ShopModalProps {
  onClose: () => void;
}

const STAT_CONFIG: Record<keyof PermanentStats, {
  icon: React.ElementType,
  title: string,
  desc: string,
  color: string,
  unit: string
}> = {
  baseDamage: {
    icon: Swords,
    title: "MIGHT",
    desc: "+5% Damage per Level",
    color: "text-red-500",
    unit: "%"
  },
  baseHp: {
    icon: Heart,
    title: "VITALITY",
    desc: "+10 Max HP per Level",
    color: "text-green-500",
    unit: " HP"
  },
  goldGain: {
    icon: Coins,
    title: "GREED",
    desc: "+10% Gold Gain per Level",
    color: "text-yellow-400",
    unit: "%"
  },
  moveSpeed: {
    icon: Footprints,
    title: "AGILITY",
    desc: "+5% Speed per Level",
    color: "text-blue-500",
    unit: "%"
  },
  magnetRange: {
    icon: Magnet,
    title: "MAGNET",
    desc: "+10% Range per Level",
    color: "text-purple-500",
    unit: "%"
  }
};

export const ShopModal: React.FC<ShopModalProps> = ({ onClose }) => {
  const [gold, setGold] = useState(DataManager.data.gold);
  const [stats, setStats] = useState<PermanentStats>(DataManager.data.permanentStats);

  // Force refresh data on mount
  useEffect(() => {
    setGold(DataManager.data.gold);
    setStats(DataManager.data.permanentStats);
  }, []);

  const handleBuy = (statKey: keyof PermanentStats) => {
    if (DataManager.upgradeStat(statKey)) {
      setGold(DataManager.data.gold);
      setStats({ ...DataManager.data.permanentStats });
      Synthesizer.getInstance().playBuy();
    }
  };
  
  const handleReset = () => {
      DataManager.resetStats();
      setGold(DataManager.data.gold);
      setStats(DataManager.data.permanentStats);
      Synthesizer.getInstance().playBuy();
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h2 className="text-5xl font-black text-white italic tracking-wider drop-shadow-[0_4px_0_#000]">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-orange-500">
            EVOLUTION
          </span>
        </h2>
        
        <div className="flex items-center gap-4">
           {/* Gold Display */}
           <div className="flex items-center gap-2 bg-gray-900 border-2 border-yellow-600 rounded-full px-6 py-2 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
             <Coins className="text-yellow-400 fill-yellow-400 w-6 h-6" />
             <span className="text-2xl font-bold text-white font-mono">{gold.toLocaleString()}</span>
           </div>
           
           <button 
             onClick={onClose}
             className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110"
           >
             <X size={28} strokeWidth={3} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-6xl">
        {(Object.keys(STAT_CONFIG) as Array<keyof PermanentStats>).map((key) => {
          const config = STAT_CONFIG[key];
          const level = stats[key] || 0;
          const maxLevel = DataManager.getMaxLevel(key);
          const isMaxed = level >= maxLevel;
          const cost = DataManager.getUpgradeCost(key);
          const canAfford = gold >= cost && !isMaxed;
          const Icon = config.icon;

          return (
            <div key={key} className={`bg-white rounded-xl border-4 ${isMaxed ? 'border-yellow-500/50' : 'border-gray-200'} overflow-hidden shadow-xl flex flex-col relative group hover:scale-105 transition-transform duration-200`}>
              
              {/* Card Header (Level) */}
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold font-mono ${isMaxed ? 'bg-yellow-500 text-black' : 'bg-black text-white'}`}>
                {isMaxed ? 'MAX' : `Lv.${level}`}
              </div>

              {/* Icon Section */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
                <div className={`p-3 rounded-full bg-white shadow-md mb-2 ${config.color}`}>
                  <Icon size={32} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{config.title}</h3>
                <p className="text-[10px] text-gray-500 font-medium text-center mt-1 px-1">{config.desc}</p>
              </div>

              {/* Footer (Button) */}
              <button
                onClick={() => handleBuy(key)}
                disabled={!canAfford}
                className={`
                  w-full py-3 px-2 flex flex-col items-center justify-center gap-0.5 border-t-2 border-gray-100 transition-colors
                  ${isMaxed 
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : canAfford 
                      ? 'bg-yellow-400 hover:bg-yellow-300 text-black active:bg-yellow-500' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                `}
              >
                {isMaxed ? (
                  <span className="font-bold text-lg leading-none">MAXED</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Coins size={16} className={canAfford ? 'fill-black' : 'fill-gray-400'} />
                    <span className="font-bold text-lg leading-none">{cost.toLocaleString()}</span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Reset Button (Debug) */}
      <button 
        onClick={handleReset}
        className="mt-8 flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
      >
        <RefreshCw size={14} />
        Reset Progress (Debug)
      </button>

    </div>
  );
};
