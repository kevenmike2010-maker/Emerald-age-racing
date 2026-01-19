
import React, { useState } from 'react';
import { GameState, CarStats } from '../types';
import { COLORS } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  carStats: CarStats;
  countdown?: number | string;
  onControlChange: (key: 'left' | 'right' | 'gas' | 'brake' | 'nitro', val: boolean) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, carStats, countdown, onControlChange }) => {
  const [wheelRotation, setWheelRotation] = useState(0);

  const getPositionSuffix = (pos: number) => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  const handleSteer = (dir: 'left' | 'right' | 'center') => {
    if (dir === 'left') {
      onControlChange('left', true);
      onControlChange('right', false);
      setWheelRotation(-60);
    } else if (dir === 'right') {
      onControlChange('right', true);
      onControlChange('left', false);
      setWheelRotation(60);
    } else {
      onControlChange('left', false);
      onControlChange('right', false);
      setWheelRotation(0);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-14 flex flex-col justify-between z-[150]">
      {countdown !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-9xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-400 drop-shadow-[0_0_80px_rgba(0,255,136,1)] animate-ping">
            {countdown}
          </div>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex justify-between items-start pt-2">
        <div className="space-y-1">
          <div className="text-white text-xl md:text-4xl font-orbitron font-black flex items-center gap-3">
            <span className="w-5 h-5 rounded-full shadow-[0_0_20px_white] animate-pulse" style={{ backgroundColor: carStats.color }}></span>
            {carStats.name.toUpperCase()}
          </div>
          <div className="text-emerald-400 text-4xl md:text-7xl font-orbitron font-black drop-shadow-[0_0_30px_rgba(0,255,136,0.6)]">
            {gameState.score.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col items-center">
            <div className="bg-slate-950/95 border-4 border-yellow-500 px-8 py-3 rounded-3xl flex items-baseline gap-2 shadow-[0_0_50px_rgba(255,215,0,0.3)] backdrop-blur-3xl">
                <span className="text-4xl md:text-8xl font-black font-orbitron text-white leading-none">{gameState.position}</span>
                <span className="text-yellow-500 font-orbitron font-black uppercase text-lg">{getPositionSuffix(gameState.position)}</span>
            </div>
            <div className="mt-2 text-[12px] font-orbitron text-emerald-400 font-black uppercase tracking-[0.4em]">RANK</div>
        </div>

        <div className="text-right">
          <div className="text-white text-3xl md:text-5xl font-orbitron font-black leading-none">{Math.floor(gameState.distance)}m</div>
          <div className="text-yellow-500 text-lg md:text-3xl font-orbitron font-black uppercase tracking-tighter mt-1">LAP {gameState.lap}</div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex justify-between items-end pointer-events-auto mt-auto pb-8">
        
        {/* Steering Wheel */}
        <div className="relative flex items-center justify-center">
           <div 
             className="w-56 h-56 md:w-80 md:h-80 rounded-full border-[12px] border-emerald-900/60 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center transition-transform duration-150 shadow-2xl"
             style={{ transform: `rotate(${wheelRotation}deg)` }}
           >
              <div className="w-full h-6 bg-emerald-500/10 absolute rotate-90" />
              <div className="w-full h-6 bg-emerald-500/10 absolute" />
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,136,0.7)] z-10 border-4 border-yellow-500/50">
                 <div className="text-slate-950 font-black text-2xl">♰</div>
              </div>
           </div>
           <div className="absolute inset-0 flex">
              <div onPointerDown={() => handleSteer('left')} onPointerUp={() => handleSteer('center')} onPointerLeave={() => handleSteer('center')} className="w-1/2 h-full" />
              <div onPointerDown={() => handleSteer('right')} onPointerUp={() => handleSteer('center')} onPointerLeave={() => handleSteer('center')} className="w-1/2 h-full" />
           </div>
        </div>

        {/* Dashboard Center */}
        <div className="hidden md:flex flex-col items-center bg-black/60 p-6 rounded-[2rem] border-2 border-emerald-500/30 backdrop-blur-3xl shadow-2xl">
            <div className="text-emerald-400 text-8xl font-orbitron font-black leading-none drop-shadow-lg">{Math.floor(gameState.speed * 20)}</div>
            <div className="text-yellow-500 text-sm font-orbitron font-black uppercase tracking-[0.6em] mt-2">VELOCITY</div>
        </div>

        {/* Pedals */}
        <div className="flex gap-8 items-end">
           <div className="flex flex-col gap-8">
              <button 
                onPointerDown={() => onControlChange('nitro', true)}
                onPointerUp={() => onControlChange('nitro', false)}
                onPointerLeave={() => onControlChange('nitro', false)}
                className={`w-24 h-24 rounded-[2rem] border-4 border-white/20 flex items-center justify-center active:scale-95 transition-all shadow-2xl ${gameState.nitro > 10 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 animate-pulse' : 'bg-slate-800 opacity-50'}`}
              >
                <div className="text-slate-950 font-orbitron font-black text-sm uppercase text-center leading-tight">DIVINE<br/>NITRO</div>
              </button>
              <button 
                onPointerDown={() => onControlChange('brake', true)}
                onPointerUp={() => onControlChange('brake', false)}
                onPointerLeave={() => onControlChange('brake', false)}
                className="w-28 h-32 rounded-t-[2.5rem] bg-red-950/60 border-t-[10px] border-red-600 flex items-center justify-center active:bg-red-600 active:scale-95 transition-all backdrop-blur-2xl shadow-xl"
              >
                <span className="text-white font-orbitron font-black text-sm uppercase">BRAKE</span>
              </button>
           </div>
           <button 
             onPointerDown={() => onControlChange('gas', true)}
             onPointerUp={() => onControlChange('gas', false)}
             onPointerLeave={() => onControlChange('gas', false)}
             className="w-32 h-56 rounded-t-[3rem] bg-emerald-950/60 border-t-[16px] border-emerald-400 flex items-center justify-center active:bg-emerald-400 active:scale-95 transition-all backdrop-blur-2xl shadow-[0_0_80px_rgba(0,255,136,0.4)]"
           >
             <span className="text-white font-orbitron font-black text-3xl uppercase rotate-[-90deg]">ACCEL</span>
           </button>
        </div>
      </div>

      {/* Bottom Gauges */}
      <div className="w-full flex justify-between gap-12 pointer-events-none pt-4 pb-4">
          <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-orbitron font-black text-emerald-400 uppercase tracking-widest"><span>HULL INTEGRITY</span><span>{Math.floor(gameState.health)}%</span></div>
              <div className="h-6 bg-slate-900/80 rounded-full overflow-hidden border-2 border-emerald-500/40 shadow-inner">
                  <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${gameState.health}%` }} />
              </div>
          </div>
          <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-orbitron font-black text-yellow-500 uppercase tracking-widest"><span>NITRO RESONANCE</span><span>{Math.floor(gameState.nitro)}%</span></div>
              <div className="h-6 bg-slate-900/80 rounded-full overflow-hidden border-2 border-yellow-500/40 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-600 shadow-[0_0_30px_#ffd700] transition-all duration-300" style={{ width: `${gameState.nitro}%` }} />
              </div>
          </div>
      </div>
    </div>
  );
};

export default UIOverlay;
