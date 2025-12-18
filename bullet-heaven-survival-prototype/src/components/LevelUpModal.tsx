import React, { useEffect, useState } from 'react';
import { UpgradeOption, PassiveType } from '../game/types';
import { PASSIVE_ITEMS } from '../game/Passives';
import { AssetGenerator } from '../game/AssetGenerator';
import { Sparkles, Zap, Shield, Swords, Star, Flame, Skull } from 'lucide-react';

interface LevelUpModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
}

// Internal Confetti Component
const Confetti: React.FC = () => {
  const [particles] = useState(() => 
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)],
      size: 5 + Math.random() * 10,
      rotation: Math.random() * 360
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-[fall_linear_infinite]"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ options, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (option: UpgradeOption) => {
    if (selectedOptionId) return; // Prevent double clicks
    setSelectedOptionId(option.id);
    
    // Delay actual selection for visual feedback
    setTimeout(() => {
      onSelect(option);
    }, 300);
  };

  const getIcon = (option: UpgradeOption) => {
    // 1. Passive Skills (Generated Assets)
    if (option.type === 'passive' && option.passiveType) {
        const spriteKey = `passive_${option.passiveType}`;
        const imgUrl = AssetGenerator.getInstance().getSpriteDataUrl(spriteKey);
        
        // Check if this upgrade leads to Max Level (Lv 5)
        // Description format: "Lv 5: ..."
        const isMaxLevel = option.description.startsWith("Lv 5");

        return (
            <div className="relative w-full h-full flex items-center justify-center">
                <img src={imgUrl} alt={option.title} className="w-16 h-16 object-contain drop-shadow-md" />
                {isMaxLevel && (
                    <img 
                        src={AssetGenerator.getInstance().getSpriteDataUrl('icon_crown')} 
                        className="absolute -top-3 -right-3 w-8 h-8 animate-bounce drop-shadow-md opacity-90"
                        alt="Max Level"
                    />
                )}
            </div>
        );
    }

    // 2. Stats
    if (option.type === 'stat') {
      if (option.statType === 'chicken') return <div className="text-4xl">🍗</div>;
      if (option.statType === 'gold') return <div className="text-4xl">💰</div>;
    }

    // 3. Weapons (Lucide Icons or SVGs)
    switch (option.weaponType) {
      case 'inferno': return (
        <div className="text-red-600 animate-pulse">
           <Flame size={40} strokeWidth={3} fill="orange" />
        </div>
      );
      case 'destroyer': return (
        <div className="text-red-700 animate-[spin_3s_linear_infinite]">
           <Skull size={40} strokeWidth={2} />
        </div>
      );
      case 'lightning': return (
        <div className="text-yellow-400 drop-shadow-md">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
        </div>
      );
      case 'boomerang': return (
        <div className="text-orange-400">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2l-1 5h5l-1-5zM4 14l5-1v5l-5-1z" /></svg>
        </div>
      );
      case 'molotov': return (
        <div className="text-red-500">
           <Flame size={40} />
        </div>
      );
      case 'guardian': return (
        <div className="text-yellow-600 animate-[spin_4s_linear_infinite]">
           <Shield size={40} />
        </div>
      );
      case 'brick': return (
        <div className="w-10 h-6 bg-red-800 border-2 border-red-950 shadow-md transform -rotate-12" />
      );
      case 'soccer': return (
        <div className="w-10 h-10 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 bg-black rounded-full" />
        </div>
      );
      case 'rocket': return (
        <div className="text-blue-500 rotate-45 transform hover:scale-110 transition-transform">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5s-4 4-4 10c0 4 3 7 4 7s4-3 4-7c0-6-4-10-4-10z" /></svg>
        </div>
      );
      case 'pistol': return (
        <div className="text-gray-700">
           <Swords size={40} />
        </div>
      );
      default: return <Sparkles size={40} className="text-blue-400" />;
    }
  };

  const getCardStyle = (option: UpgradeOption) => {
    // 1. Evolution (Rainbow)
    if (option.isEvolution) {
      return "border-transparent bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 shadow-[0_0_30px_rgba(255,215,0,0.6)] ring-2 ring-white/50";
    }

    // 2. Passives (Rarity System)
    if (option.type === 'passive' && option.passiveType) {
        const def = PASSIVE_ITEMS[option.passiveType];
        if (def) {
            switch (def.rarity) {
                case 'unique': 
                    return "bg-purple-50 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-1 ring-purple-200";
                case 'rare':
                    return "bg-blue-50 border-blue-300 shadow-[0_2px_10px_rgba(59,130,246,0.2)]";
                case 'common':
                default:
                    return "bg-slate-100 border-slate-300";
            }
        }
    }

    // 3. Weapons (Orange)
    if (option.type === 'weapon') {
      return "border-orange-200 shadow-orange-500/20";
    }

    // Fallback
    return "border-slate-200 shadow-slate-500/20";
  };

  const getButtonStyle = (option: UpgradeOption) => {
    if (option.isEvolution) {
      return "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_4px_0_#9d174d] hover:bg-pink-500";
    }
    
    // Rarity Button Styles
    if (option.type === 'passive' && option.passiveType) {
         const def = PASSIVE_ITEMS[option.passiveType];
         if (def?.rarity === 'unique') return "bg-purple-600 shadow-[0_4px_0_#6b21a8] hover:bg-purple-500";
         if (def?.rarity === 'rare') return "bg-blue-500 shadow-[0_4px_0_#1e40af] hover:bg-blue-400";
    }

    return "bg-green-500 shadow-[0_4px_0_#15803d] hover:bg-green-400";
  };
  
  const getBadge = (option: UpgradeOption) => {
      if (option.type === 'passive' && option.passiveType) {
          const def = PASSIVE_ITEMS[option.passiveType];
          if (def?.rarity === 'unique') {
              return (
                  <div className="absolute top-0 right-0 z-20">
                    <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl shadow-md">
                        UNIQUE
                    </div>
                  </div>
              );
          }
      }
      return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background with Blur & Radial Burst */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent animate-pulse" />
      
      {/* Confetti Effect */}
      <Confetti />

      <div className={`relative max-w-5xl w-full p-4 md:p-8 flex flex-col items-center transition-all duration-500 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        
        {/* Header - Giant Golden Text */}
        <div className="text-center mb-8 relative z-10 transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-6xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-orange-600 drop-shadow-[0_4px_0px_rgba(0,0,0,0.5)] filter">
            LEVEL UP!
          </h2>
          <h2 className="absolute top-0 left-0 w-full text-6xl md:text-7xl font-black italic tracking-tighter text-transparent [-webkit-text-stroke:2px_#7c2d12] z-[-1]" aria-hidden="true">
            LEVEL UP!
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl z-10">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={`
                group relative flex flex-col bg-white rounded-3xl border-4 overflow-hidden cursor-pointer
                transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl
                ${getCardStyle(option)}
                ${visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
                ${selectedOptionId === option.id 
                  ? 'ring-4 ring-white scale-105 brightness-110 z-50' 
                  : selectedOptionId 
                    ? 'opacity-50 blur-sm scale-95' 
                    : ''
                }
              `}
              style={{ transitionDelay: `${index * 150}ms` }}
              onClick={() => handleSelect(option)}
            >
              {/* Unique Badge */}
              {getBadge(option)}

              {/* New Badge - Ribbon Style */}
              {(option.isNew && !option.isEvolution) && (
                <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none z-20">
                  <div className="absolute top-[10px] right-[-30px] w-[100px] bg-red-600 text-white text-xs font-bold text-center py-1 rotate-45 shadow-md border-2 border-white">
                    NEW!
                  </div>
                </div>
              )}

              {/* Evo Glow Effect */}
              {option.isEvolution && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent z-10 pointer-events-none mix-blend-overlay" />
              )}

              {/* Top Section: Icon & Background */}
              <div className="h-32 relative flex items-center justify-center overflow-hidden bg-slate-50/50">
                {/* Radial Glow behind icon */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/80 to-transparent scale-150" />
                
                {/* Icon Container */}
                <div className={`relative z-10 w-20 h-20 rounded-2xl bg-white shadow-lg border-b-4 border-slate-200 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                  {getIcon(option)}
                  {option.isEvolution && (
                    <div className="absolute -top-2 -right-2 text-yellow-500 animate-spin-slow">
                      <Star fill="currentColor" size={24} />
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-5 flex flex-col text-center bg-white/90 relative z-0">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2 leading-none">
                  {option.title}
                </h3>
                
                <p className="text-slate-600 text-sm font-medium leading-snug mb-6 flex-1">
                  {option.description}
                </p>

                {/* Evolution Guide */}
                {option.evolutionPair && !option.isEvolution && (
                  <div className={`text-xs font-bold mb-4 px-3 py-1.5 rounded-full border flex items-center justify-center gap-1 transition-colors ${
                    option.evolutionOwned 
                      ? 'bg-green-50 text-green-600 border-green-200 shadow-sm' 
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                     {option.evolutionOwned ? (
                       <>
                         <span className="text-lg leading-none">⚡</span>
                         <span>Ready: {option.evolutionPair}</span>
                       </>
                     ) : (
                       <>
                         <span className="opacity-70">🔒 Needs:</span>
                         <span className="ml-1">{option.evolutionPair}</span>
                       </>
                     )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  className={`
                    w-full py-3 rounded-xl font-bold text-white text-lg tracking-wide uppercase
                    transform transition-all duration-100 active:translate-y-[4px] active:shadow-none
                    ${getButtonStyle(option)}
                  `}
                >
                  {option.isEvolution ? 'EVOLVE!' : 'GET'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
