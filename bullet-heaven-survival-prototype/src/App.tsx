import { useEffect, useRef, useState } from 'react';
import './App.css';
import { Game } from './game/Game';
import { InputManager } from './game/InputManager';
import { GameState, PlayerStats, UpgradeOption } from './game/types';
import { VirtualJoystick } from './components/VirtualJoystick';
import { ShopModal } from './components/ShopModal';
import { InventoryModal } from './components/InventoryModal';
import { AssetGenerator } from './game/AssetGenerator';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<InputManager>(new InputManager());
  
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  
  const [stats, setStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    speed: 0,
    magnetRange: 0,
    xp: 0,
    maxXp: 100,
    level: 1,
    score: 0,
    
    // Permanent Stats
    permDamage: 0,
    permHp: 0,
    permSpeed: 0,
    permGold: 0,

    // Global Multipliers
    damageMultiplier: 1,
    durationMultiplier: 1,
    cooldownMultiplier: 1,
    moveSpeedMultiplier: 1,
    magnetRadiusMultiplier: 1,
    gainMultiplier: 1,

    // Weapon Stats
    projectileCount: 0,
    fireRate: 1,
    bulletSpeed: 1,
    damage: 1,
    critRate: 0.1,
    critDamage: 1.5,
    
    // Garlic
    garlicLevel: 0,
    garlicRadius: 0,
    garlicDamage: 0,
    garlicInterval: 0
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Game
    setGameState(GameState.START); // 1. State Init: Force START state
    const game = new Game(
      canvasRef.current, 
      inputRef.current,
      (newStats) => setStats({ ...newStats }), // Update React State
      (options) => { // On Level Up
        setUpgradeOptions(options);
        setIsLevelUp(true);
      },
      (newState) => setGameState(newState) // On State Change
    );
    gameRef.current = game;
    // Don't auto start, wait for user
    // game.start();

    // Cleanup
    return () => {
      game.stop();
      inputRef.current.cleanup();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        gameRef.current?.togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleJoystickMove = (x: number, y: number) => {
    inputRef.current.setJoystickVector(x, y);
  };

  const handleUpgradeSelect = (option: UpgradeOption) => {
    if (gameRef.current) {
      gameRef.current.applyUpgrade(option);
      gameRef.current.resume();
      setIsLevelUp(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Game Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Level Up Modal */}
      {isLevelUp && (
        <LevelUpModal 
          options={upgradeOptions} 
          onSelect={handleUpgradeSelect} 
        />
      )}

      {/* Shop Modal */}
      {isShopOpen && (
        <ShopModal onClose={() => setIsShopOpen(false)} />
      )}

      {/* Inventory Modal */}
      {isInventoryOpen && (
        <InventoryModal 
          onClose={() => setIsInventoryOpen(false)}
          onPlay={() => {
             setIsInventoryOpen(false);
             gameRef.current?.start();
          }}
        />
      )}

      {/* UI Overlay */}

      <div className="absolute inset-0 pointer-events-none">
        
        {/* Top HUD (Level & XP) - Only show when PLAYING or PAUSED */}
        {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="absolute top-0 left-0 right-0 p-4 flex flex-col items-center gap-2">
          {/* Level Indicator */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-white drop-shadow-md">
              LVL {stats.level}
            </div>
            <div className="text-xl font-bold text-yellow-400 drop-shadow-md">
              SCORE: {stats.score}
            </div>
          </div>
          
          {/* XP Bar */}
          <div className="w-full max-w-md h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative">
            <div 
              className="h-full bg-green-500 transition-all duration-200"
              style={{ width: `${(stats.xp / stats.maxXp) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
              {Math.floor(stats.xp)} / {Math.floor(stats.maxXp)} XP
            </div>
          </div>
        </div>
        )}

        {/* Joystick - Only visible when PLAYING */}
        {gameState === GameState.PLAYING && (
          <div className="pointer-events-auto absolute inset-0">
            <VirtualJoystick onMove={handleJoystickMove} />
          </div>
        )}
        
        {/* Controls Hint */}
        {gameState === GameState.PLAYING && (
        <div className="absolute top-4 right-4 text-white/50 text-sm font-mono text-right">
          <p>WASD / Arrows to Move</p>
          <p>Drag Joystick to Move</p>
          <p>ESC to Pause</p>
        </div>
        )}
      </div>

      {/* --- Game State Overlays --- */}

      {/* Start Screen - UI Visibility Init */}
      <div 
        id="startScreen"
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50"
        style={{ display: (gameState === GameState.START && !isShopOpen && !isInventoryOpen) ? 'flex' : 'none' }}
      >
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-red-600 mb-8 drop-shadow-lg">
          BULLET HEAVEN
        </h1>
        
        <div className="flex flex-col gap-4 w-64">
          <button 
            onClick={() => setIsInventoryOpen(true)}
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-2xl rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>PLAY</span>
          </button>
          
          <button 
            onClick={() => setIsShopOpen(true)}
            className="px-8 py-3 bg-white hover:bg-gray-100 text-black font-bold text-xl rounded-full shadow-lg transition-all transform hover:scale-105"
          >
            🛍️ SHOP
          </button>
        </div>
      </div>

      {/* Pause Screen */}
      {gameState === GameState.PAUSED && !isLevelUp && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-40">
          <h2 className="text-5xl font-bold text-white mb-8 tracking-widest drop-shadow-md">PAUSED</h2>
          
          {/* Stats Display */}
          <div className="bg-gray-900/80 p-6 rounded-xl border border-gray-700 mb-8 w-80">
            <h3 className="text-yellow-400 font-bold mb-4 border-b border-gray-700 pb-2">PLAYER STATS</h3>
            <div className="space-y-2 text-sm font-mono text-gray-300">
              <div className="flex justify-between"><span>Score:</span> <span className="text-yellow-400">{stats.score}</span></div>
              <div className="flex justify-between"><span>Max HP:</span> <span className="text-green-400">{stats.maxHp}</span></div>
              <div className="flex justify-between"><span>Damage:</span> <span className="text-red-400">x{stats.damageMultiplier.toFixed(1)}</span></div>
              <div className="flex justify-between"><span>Speed:</span> <span className="text-blue-400">x{stats.moveSpeedMultiplier.toFixed(1)}</span></div>
              <div className="flex justify-between"><span>Cooldown:</span> <span className="text-yellow-400">x{stats.cooldownMultiplier.toFixed(1)}</span></div>
              <div className="flex justify-between"><span>Area:</span> <span className="text-purple-400">x{stats.areaMultiplier?.toFixed(1) || '1.0'}</span></div>
            </div>

            {/* Passive Inventory */}
            {gameRef.current && Object.keys(gameRef.current.activePassives).length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h3 className="text-blue-400 font-bold mb-3 text-xs uppercase tracking-wider">Passive Inventory</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(gameRef.current.activePassives).map(([key, level]) => {
                    const spriteKey = `passive_${key}`;
                    const imgUrl = AssetGenerator.getInstance().getSpriteDataUrl(spriteKey);
                    const isMax = level >= 5;

                    return (
                      <div key={key} className="relative group">
                        {/* Icon Box */}
                        <div className={`w-12 h-12 rounded-lg bg-gray-800 border-2 flex items-center justify-center relative overflow-visible
                          ${isMax ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-gray-600'}
                        `}>
                          <img src={imgUrl} alt={key} className="w-8 h-8 object-contain" />
                          
                          {/* Crown Overlay for Max Level */}
                          {isMax && (
                            <img 
                              src={AssetGenerator.getInstance().getSpriteDataUrl('icon_crown')} 
                              className="absolute -top-4 -right-3 w-8 h-8 animate-bounce drop-shadow-md z-10"
                              alt="Max"
                            />
                          )}
                        </div>

                        {/* Level Badge */}
                        <div className={`absolute -bottom-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm z-20
                          ${isMax ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-gray-700 text-white border-gray-500'}
                        `}>
                          Lv.{level}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => gameRef.current?.togglePause()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded shadow-lg transition-colors"
          >
            RESUME
          </button>
        </div>
      )}

      {/* Game Over Screen - UI Visibility Init */}
      <div 
        id="gameOverScreen"
        className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/30 backdrop-blur-md z-50"
        style={{ display: gameState === GameState.GAMEOVER ? 'flex' : 'none' }}
      >
        <h2 className="text-6xl font-black text-red-500 mb-4 drop-shadow-[0_4px_0_rgba(0,0,0,1)]">GAME OVER</h2>
        <div className="text-3xl text-yellow-400 mb-2 font-bold drop-shadow-md">FINAL SCORE: {stats.score}</div>
        <p className="text-2xl text-white mb-8 font-mono">Survival Time: {Math.floor((gameRef.current?.input as any /* hack to get time if needed, but easier to use ref */) || 0)}s</p> 
        
        <button 
          onClick={() => gameRef.current?.start()}
          className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded-full hover:bg-gray-200 transition-transform hover:scale-105 shadow-xl"
        >
          RETRY
        </button>
      </div>

    </div>
  );
}

export default App;
