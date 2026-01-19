
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameEngine from './components/GameEngine';
import UIOverlay from './components/UIOverlay';
import { GameStatus, GameState, CarStats, Level } from './types';
import { CARS, SECTIONS, RACE_CONFIG, COLORS } from './constants';
import { getRaceDebrief } from './services/geminiService';

const LEADERBOARD_DATA = [
  { name: 'X-PHANTOM', score: 984500 },
  { name: 'ALPHA_SHEPHERD', score: 912100 },
  { name: 'MESSIAH_RIDER', score: 810000 },
  { name: 'EMERALD_DEV', score: 720500 },
  { name: 'GRACE_DRIVE', score: 612000 },
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [showShop, setShowShop] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    distance: 0,
    nitro: 100,
    health: 100,
    speed: 0,
    status: GameStatus.MENU,
    highScore: parseInt(localStorage.getItem('highScore') || '0'),
    lap: 1,
    totalLaps: 3,
    coins: parseInt(localStorage.getItem('totalCoins') || '0'),
    sessionCoins: 0,
    position: 1,
    totalRacers: 7,
    lastDailyReward: parseInt(localStorage.getItem('lastDailyReward') || '0'),
  });

  const [unlockedLevels, setUnlockedLevels] = useState<{ [sectionId: number]: number }>(() => {
    const saved = localStorage.getItem('unlockedLevels');
    return saved ? JSON.parse(saved) : { 1: 1, 2: 0, 3: 0 };
  });

  const [unlockedCars, setUnlockedCars] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlockedCars');
    return saved ? JSON.parse(saved) : ['starter'];
  });

  const [selectedCar, setSelectedCar] = useState<CarStats>(() => {
    const savedId = localStorage.getItem('selectedCarId');
    return CARS.find(c => c.id === savedId) || CARS[0];
  });

  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [countdown, setCountdown] = useState<number | string>(3);
  const [showroomAngle, setShowroomAngle] = useState(0);

  // Persistence
  useEffect(() => {
    localStorage.setItem('totalCoins', gameState.coins.toString());
    localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));
    localStorage.setItem('unlockedCars', JSON.stringify(unlockedCars));
    localStorage.setItem('selectedCarId', selectedCar.id);
    localStorage.setItem('lastDailyReward', (gameState.lastDailyReward || 0).toString());
  }, [gameState.coins, unlockedLevels, unlockedCars, selectedCar, gameState.lastDailyReward]);

  // Car rotation
  useEffect(() => {
    if (status === GameStatus.LOBBY) {
      const interval = setInterval(() => setShowroomAngle(a => (a + 0.5) % 360), 16);
      return () => clearInterval(interval);
    }
  }, [status]);

  const claimDailyReward = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - (gameState.lastDailyReward || 0) > oneDay) {
      const bonus = 7777;
      setGameState(prev => ({ ...prev, coins: prev.coins + bonus, lastDailyReward: now }));
      alert(`CELESTIAL BLESSING! Received ${bonus} C`);
    } else {
      alert("WAIT FOR THE NEXT SUNRISE (24H)");
    }
  };

  const buyCar = (car: CarStats) => {
    if (gameState.coins >= car.price && !unlockedCars.includes(car.id)) {
      setGameState(prev => ({ ...prev, coins: prev.coins - car.price }));
      setUnlockedCars(prev => [...prev, car.id]);
      setSelectedCar(car);
    }
  };

  const startLevel = (level: Level) => {
    setCurrentLevel(level);
    setStatus(GameStatus.COUNTDOWN);
    setGameState(prev => ({ ...prev, status: GameStatus.COUNTDOWN, score: 0, distance: 0, health: 100, nitro: 100, lap: 1, totalLaps: level.laps, sessionCoins: 0, position: 7 }));
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) setCountdown(count);
      else if (count === 0) setCountdown('GO!');
      else { 
        clearInterval(interval); 
        setStatus(GameStatus.PLAYING); 
        setGameState(prev => ({ ...prev, status: GameStatus.PLAYING })); 
      }
    }, 1000);
  };

  const endGame = useCallback(async (finalScore: number, finalDistance: number, isFinished: boolean = false, finalRank: number = 7) => {
    const actuallyWon = isFinished && finalRank === 1;
    const finalStatus = actuallyWon ? GameStatus.FINISHED : GameStatus.GAMEOVER;
    if (actuallyWon && currentLevel) {
      const nextLevelNum = currentLevel.id + 1;
      setUnlockedLevels(prev => {
        const updated = { ...prev };
        if (nextLevelNum <= 10) updated[currentLevel.section] = Math.max(updated[currentLevel.section], nextLevelNum);
        else if (currentLevel.section < 3) updated[currentLevel.section + 1] = Math.max(updated[currentLevel.section + 1], 1);
        return updated;
      });
    }
    setStatus(finalStatus);
    setGameState(prev => ({ ...prev, status: finalStatus, score: finalScore, distance: finalDistance, highScore: Math.max(prev.highScore, finalScore), coins: prev.coins + prev.sessionCoins, position: finalRank }));
    const debrief = await getRaceDebrief(finalScore, finalDistance, selectedCar.name);
    setAiCommentary(debrief || '');
  }, [selectedCar, currentLevel]);

  const touchControls = useRef({ left: false, right: false, gas: false, brake: false, nitro: false });

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col items-center justify-center font-inter text-white touch-none">
      
      {/* Background: Emerald Green and Golden Glory mix */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-emerald-500/30 rounded-full blur-[300px] animate-pulse" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[100%] bg-[#FFD700]/20 rounded-full blur-[300px]" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,78,59,0.5)_0%,transparent_100%)] opacity-80" />
      </div>

      {status === GameStatus.MENU && (
        <div className="z-20 text-center space-y-12 animate-in fade-in zoom-in duration-1000 px-6">
          <div className="relative">
            <h1 className="text-7xl md:text-9xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 drop-shadow-[0_0_60px_#00FF88] tracking-tighter">
              EMERALD AGE
            </h1>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-60">
               <svg width="40" height="60" viewBox="0 0 100 150" fill="none" stroke="#FFD700" strokeWidth="8">
                  <path d="M50 0V150M0 50H100" />
               </svg>
            </div>
            <p className="text-yellow-200 font-orbitron tracking-[0.5em] uppercase text-sm md:text-lg mt-4 font-bold">Golden Glory Edition</p>
          </div>
          <button 
            onClick={() => setStatus(GameStatus.LOBBY)} 
            className="group relative px-12 md:px-24 py-5 bg-gradient-to-r from-emerald-600 via-yellow-500 to-emerald-600 rounded-full font-orbitron font-black text-xl md:text-3xl text-slate-900 shadow-[0_0_60px_rgba(255,215,0,0.4)] hover:scale-110 active:scale-95 transition-all"
          >
            GLORY TO THE DRIVE
          </button>
        </div>
      )}

      {status === GameStatus.LOBBY && (
        <div className="z-20 w-full h-full p-4 md:p-10 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center z-50">
             <div className="flex gap-4">
                <button onClick={() => setStatus(GameStatus.MENU)} className="bg-emerald-950/80 border border-emerald-500/30 px-6 py-2 rounded-full font-orbitron text-xs font-black hover:bg-emerald-500 transition-colors">← LOGOUT</button>
                <button onClick={claimDailyReward} className="bg-gradient-to-r from-yellow-400 to-amber-600 px-6 py-2 rounded-full font-orbitron text-xs font-black text-slate-900 shadow-xl animate-bounce">DAILY GRACE</button>
             </div>
             <div className="bg-slate-900/90 border-2 border-yellow-500 px-6 py-2 rounded-2xl flex items-center gap-3 backdrop-blur-3xl shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                <span className="text-white font-orbitron font-black text-2xl md:text-4xl">{gameState.coins.toLocaleString()}</span>
                <span className="text-yellow-500 font-orbitron font-black text-sm">CREDITS</span>
             </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden items-stretch">
            
            {/* Showroom Center: Brighter, Gold & Emerald Accents */}
            <div className="md:col-span-8 relative flex flex-col items-center justify-center bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden">
                {/* Visual Symbols Backdrop */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <svg width="400" height="400" viewBox="0 0 100 100" fill="none" stroke="#00FF88" strokeWidth="0.5">
                       <circle cx="50" cy="50" r="45" />
                       <path d="M50 5V95M5 50H95" strokeWidth="2" stroke="#FFD700" />
                    </svg>
                </div>

                <div className="absolute w-[250px] h-[250px] md:w-[600px] md:h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.2)_0%,transparent_70%)] rounded-full animate-pulse" />
                
                {/* Rotating Car Showroom Platform */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="absolute w-[200px] h-[200px] md:w-[450px] md:h-[450px] bg-emerald-900/40 rounded-full border-[8px] border-yellow-500/20 shadow-[0_0_100px_rgba(0,255,136,0.4)]" />
                    <div style={{ transform: `rotate(${showroomAngle}deg)` }} className="transition-transform duration-100 ease-linear flex flex-col items-center">
                       <div className="w-[80px] h-[150px] md:w-[110px] md:h-[200px] relative">
                          <div className="absolute inset-0 bg-slate-950 rounded-2xl border-4 border-yellow-500/40 shadow-2xl" />
                          <div className="absolute inset-2 rounded-xl opacity-90 shadow-[0_0_40px_rgba(255,255,255,0.4)]" style={{ backgroundColor: selectedCar.color }} />
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-24 bg-blue-400/20 rounded-t-3xl" />
                          
                          {/* Divine Car Symbols */}
                          {selectedCar.id === 'alpha_saviour' && (
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-slate-900 opacity-80">
                                <div className="font-orbitron font-black text-lg">AΩ</div>
                                <svg width="40" height="20" viewBox="0 0 100 50"><path d="M0 25C20 0 80 0 100 25C80 50 20 50 0 25ZM100 25C110 35 120 45 130 50M100 25C110 15 120 5 130 0" stroke="currentColor" fill="none" strokeWidth="8"/></svg>
                             </div>
                          )}
                       </div>
                    </div>
                </div>

                <div className="absolute bottom-10 flex flex-col items-center gap-4">
                   <h2 className="text-4xl md:text-7xl font-orbitron font-black text-white tracking-tighter drop-shadow-[0_0_20px_#00FF88]">{selectedCar.name}</h2>
                   <div className="flex gap-4">
                      <button onClick={() => setShowShop(true)} className="px-8 py-3 bg-yellow-500 text-slate-950 font-orbitron font-black rounded-full hover:scale-110 transition-all shadow-lg">ENTER SHOP</button>
                      <button onClick={() => setStatus(GameStatus.COUNTDOWN)} className="px-10 py-3 bg-emerald-500 text-slate-950 font-orbitron font-black rounded-full hover:scale-110 transition-all shadow-lg">RACE CIRCUIT</button>
                   </div>
                </div>
            </div>

            {/* Level Grid / World Tour Sidebar */}
            <div className="md:col-span-4 flex flex-col gap-6 overflow-hidden">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 flex-1 flex flex-col gap-6 overflow-hidden shadow-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                      <h3 className="text-white font-orbitron font-black text-2xl uppercase tracking-widest">Global Grid</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 pr-2">
                      {SECTIONS.map(s => {
                        const isLocked = unlockedLevels[s.id] === 0;
                        return (
                          <div key={s.id} className={`transition-all ${isLocked ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                             <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                                <span className="text-white font-orbitron font-black text-lg uppercase">{s.name}</span>
                                <span className="text-xs font-orbitron text-yellow-500 font-bold">{s.difficulty}</span>
                             </div>
                             <div className="grid grid-cols-5 gap-3">
                                {s.levels.map(l => {
                                  const isUnlocked = l.id <= unlockedLevels[s.id];
                                  return (
                                    <button 
                                      key={l.id} 
                                      disabled={!isUnlocked} 
                                      onClick={() => startLevel(l)} 
                                      className={`aspect-square rounded-2xl font-orbitron font-black text-sm flex items-center justify-center transition-all border-2 ${isUnlocked ? 'border-emerald-500 text-white bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'border-white/5 text-slate-800'}`}
                                    >
                                      {l.id}
                                    </button>
                                  );
                                })}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
            </div>
          </div>

          {/* Shop Modal: Mobile-Friendly & Elite */}
          {showShop && (
             <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl p-6 md:p-20 flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-full max-w-5xl flex flex-col h-full">
                    <div className="flex justify-between items-center mb-10">
                       <h2 className="text-5xl md:text-7xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-400">DIVINE SHOP</h2>
                       <button onClick={() => setShowShop(false)} className="text-white font-orbitron font-black text-xl bg-white/5 p-4 rounded-full border border-white/10 hover:bg-white/20 transition-all">CLOSE [X]</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                       {CARS.map(c => {
                          const isUnlocked = unlockedCars.includes(c.id);
                          const isSelected = selectedCar.id === c.id;
                          return (
                             <div key={c.id} className={`group relative p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-6 ${isSelected ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 bg-slate-900/50'}`}>
                                <div className="w-24 h-40 relative">
                                   <div className="absolute inset-0 bg-slate-950 rounded-xl border border-white/10" />
                                   <div className="absolute inset-2 rounded-lg" style={{ backgroundColor: c.color }} />
                                   {c.id === 'alpha_saviour' && (
                                      <div className="absolute inset-0 flex items-center justify-center text-slate-950 font-black text-2xl">♰</div>
                                   )}
                                </div>
                                <div className="text-center">
                                   <div className="text-2xl font-orbitron font-black text-white mb-1 uppercase">{c.name}</div>
                                   <div className={`text-xs font-orbitron font-bold uppercase ${c.tier === 'Divine' ? 'text-yellow-400' : 'text-slate-500'}`}>{c.tier} SPEC</div>
                                </div>
                                <div className="w-full space-y-2">
                                   <div className="flex justify-between text-[10px] font-orbitron font-bold text-slate-400 uppercase"><span>SPD</span><span className="text-white">{Math.floor(c.topSpeed * 4)}</span></div>
                                   <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(c.topSpeed/30)*100}%` }} /></div>
                                </div>
                                <div className="mt-auto w-full">
                                   {isUnlocked ? (
                                      <button onClick={() => { setSelectedCar(c); setShowShop(false); }} className="w-full py-4 bg-emerald-500 text-slate-950 font-orbitron font-black rounded-2xl hover:bg-white transition-all shadow-lg">SELECT</button>
                                   ) : (
                                      <button onClick={() => buyCar(c)} className={`w-full py-4 font-orbitron font-black rounded-2xl transition-all shadow-lg ${gameState.coins >= c.price ? 'bg-yellow-500 text-slate-950 hover:bg-emerald-400' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                                         {c.price.toLocaleString()} C
                                      </button>
                                   )}
                                </div>
                             </div>
                          )
                       })}
                    </div>
                </div>
             </div>
          )}

          {/* Footer Marquee */}
          <div className="bg-emerald-950/60 border-y border-emerald-500/20 h-14 flex items-center overflow-hidden shrink-0 z-50 rounded-full backdrop-blur-xl">
             <div className="bg-yellow-500 text-slate-900 font-orbitron font-black text-xs px-8 h-full flex items-center shrink-0 tracking-tighter">CELESTIAL FEED</div>
             <div className="flex items-center gap-16 animate-marquee whitespace-nowrap px-10">
                {LEADERBOARD_DATA.concat(LEADERBOARD_DATA).map((e, i) => (
                  <div key={i} className="flex items-center gap-4">
                     <span className="text-emerald-400 font-orbitron font-black text-sm">#{ (i % 5) + 1 }</span>
                     <span className="text-white font-orbitron font-black uppercase text-sm tracking-tight">{e.name}</span>
                     <span className="text-yellow-500 font-orbitron font-bold text-xs">{e.score.toLocaleString()} PTS</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {(status === GameStatus.PLAYING || status === GameStatus.COUNTDOWN) && (
        <>
          <GameEngine 
            carStats={selectedCar} 
            onGameOver={endGame} 
            updateState={(s) => setGameState(prev => ({ ...prev, ...s }))} 
            status={status} 
            level={currentLevel || SECTIONS[0].levels[0]} 
            touchControls={touchControls.current}
          />
          <UIOverlay 
            gameState={gameState} 
            carStats={selectedCar} 
            countdown={status === GameStatus.COUNTDOWN ? countdown : undefined}
            onControlChange={(key, val) => { touchControls.current[key] = val; }}
          />
        </>
      )}

      {(status === GameStatus.GAMEOVER || status === GameStatus.FINISHED) && (
        <div className="z-[200] text-center max-w-sm w-full p-10 bg-emerald-950/98 border-4 border-yellow-500 rounded-[3rem] backdrop-blur-3xl shadow-[0_0_100px_rgba(255,215,0,0.3)] animate-in zoom-in px-6">
          <h2 className={`text-6xl font-orbitron font-black mb-1 ${status === GameStatus.FINISHED ? 'text-yellow-400' : 'text-red-500'}`}>{status === GameStatus.FINISHED ? 'ASCENDED' : 'CRASHED'}</h2>
          <div className="text-emerald-400 font-orbitron text-xs mb-8 uppercase tracking-[0.4em] font-bold">Grid Position: {gameState.position} / {gameState.totalRacers}</div>
          <div className="grid grid-cols-2 gap-4 mb-10">
             <div className="bg-white/5 p-6 rounded-3xl border border-emerald-500/20">
                <div className="text-slate-400 text-[10px] font-orbitron uppercase mb-1">SCORE</div>
                <div className="text-white text-3xl font-orbitron font-black">{gameState.score.toLocaleString()}</div>
             </div>
             <div className="bg-white/5 p-6 rounded-3xl border border-emerald-500/20">
                <div className="text-slate-400 text-[10px] font-orbitron uppercase mb-1">BOUNTY</div>
                <div className="text-yellow-400 text-3xl font-orbitron font-black">+{gameState.sessionCoins}</div>
             </div>
          </div>
          {aiCommentary && <div className="mb-10 p-6 bg-emerald-500/10 border-l-4 border-yellow-500 text-emerald-100 italic text-sm text-left leading-relaxed rounded-r-3xl">"{aiCommentary}"</div>}
          <div className="flex flex-col gap-4">
            <button onClick={() => setStatus(GameStatus.LOBBY)} className="w-full py-6 bg-gradient-to-r from-emerald-500 to-yellow-500 text-slate-900 font-orbitron font-black rounded-2xl hover:scale-105 transition-all shadow-xl text-lg">REDEEM GLORY</button>
            <button onClick={() => setStatus(GameStatus.MENU)} className="w-full py-4 text-emerald-500 font-orbitron font-black hover:text-white transition-colors text-xs uppercase tracking-[0.5em]">Main Sanctuary</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
