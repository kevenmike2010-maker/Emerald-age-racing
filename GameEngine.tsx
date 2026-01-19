
import React, { useRef, useEffect } from 'react';
import { CarStats, Vector2, Particle, Obstacle, AIRacer, GameStatus, Level, Scenery } from '../types';
import { WORLD_CONFIG, COLORS, CARS, RACE_CONFIG } from '../constants';

interface GameEngineProps {
  carStats: CarStats;
  onGameOver: (score: number, distance: number, finished?: boolean, rank?: number) => void;
  updateState: (state: Partial<{ score: number; distance: number; nitro: number; health: number; speed: number; lap: number; sessionCoins: number; position: number }>) => void;
  status: GameStatus;
  level: Level;
  touchControls?: { left: boolean; right: boolean; gas: boolean; brake: boolean; nitro: boolean };
}

const GameEngine: React.FC<GameEngineProps> = ({ carStats, onGameOver, updateState, status, level, touchControls }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const pos = useRef<Vector2>({ x: 400, y: 300 });
  const vel = useRef<Vector2>({ x: 0, y: 0 });
  const angle = useRef<number>(-Math.PI / 2);
  const cameraY = useRef<number>(0);
  const cameraZoom = useRef<number>(0);
  
  const nitro = useRef<number>(100);
  const health = useRef<number>(100);
  const score = useRef<number>(0);
  const distance = useRef<number>(0);
  const sessionCoins = useRef<number>(0);
  const currentLap = useRef<number>(1);
  const speed = useRef<number>(0);
  const currentRank = useRef<number>(7);
  
  const particles = useRef<Particle[]>([]);
  const obstacles = useRef<Obstacle[]>([]);
  const scenery = useRef<Scenery[]>([]);
  const aiRacers = useRef<AIRacer[]>([]);
  const screenShake = useRef<number>(0);
  const frameCounter = useRef(0);

  const keys = useRef<{ [key: string]: boolean }>({});

  const initWorld = () => {
    // Reset Player
    pos.current = { x: 400, y: 400 };
    vel.current = { x: 0, y: 0 };
    angle.current = -Math.PI / 2;
    cameraY.current = pos.current.y - 500;
    distance.current = 0;
    score.current = 0;
    health.current = 100;
    nitro.current = 100;

    // Reset AI Racers - Place on a grid
    const racers: AIRacer[] = [];
    const gridRows = 3;
    const gridCols = 2;
    for (let i = 0; i < 6; i++) {
      const stats = CARS[i % CARS.length];
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      
      racers.push({
        id: `ai-${i}`,
        pos: { x: 250 + col * 300, y: 200 - (row * 200) },
        vel: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        stats: { ...stats },
        targetLane: col === 0 ? 1 : 2,
        health: 100,
        speed: 0,
        laneSwitchTimer: 150 + Math.random() * 200,
        nitroCharge: 100,
        aggression: level.section * 0.15,
        isBoosting: false,
        speedProfile: i % 3 === 0 ? 'fast' : 'medium',
        distance: 0
      });
    }
    aiRacers.current = racers;

    // Reset Scenery
    scenery.current = [];
    for (let i = 0; i < 20; i++) spawnScenery(500 - (i * 450));
  };

  const spawnScenery = (yPos: number) => {
    const rand = Math.random();
    const type = rand < 0.2 ? 'church' : rand < 0.4 ? 'cross_beacon' : 'building';
    const side = Math.random() < 0.5 ? -1 : 1;
    scenery.current.push({
      id: Math.random().toString(36),
      x: 400 + (side * (350 + 50 + Math.random() * 150)),
      y: yPos,
      type: type,
      width: type === 'church' ? 150 : type === 'cross_beacon' ? 60 : 80,
      height: type === 'church' ? 250 : type === 'cross_beacon' ? 180 : 120,
      seed: Math.random()
    });
  };

  useEffect(() => {
    initWorld();
    const handleKeyDown = (e: KeyboardEvent) => keys.current[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.key] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [level]);

  const createParticle = (x: number, y: number, color: string, isNitro: boolean = false) => {
    const angleVar = (Math.random() - 0.5) * (isNitro ? 0.9 : 0.4);
    const pSpeed = isNitro ? 15 + Math.random() * 10 : 3;
    particles.current.push({
      x, y,
      vx: Math.cos(angle.current + Math.PI + angleVar) * pSpeed,
      vy: Math.sin(angle.current + Math.PI + angleVar) * pSpeed,
      life: 1, maxLife: isNitro ? 70 : 30, color,
      size: isNitro ? 8 + Math.random() * 10 : 2 + Math.random() * 3,
    });
  };

  const update = (canvas: HTMLCanvasElement) => {
    if (status !== GameStatus.PLAYING) return;
    frameCounter.current++;
    
    const isAccelerating = keys.current['ArrowUp'] || keys.current['w'] || touchControls?.gas;
    const isBraking = keys.current['ArrowDown'] || keys.current['s'] || touchControls?.brake;
    const isTurningLeft = keys.current['ArrowLeft'] || keys.current['a'] || touchControls?.left;
    const isTurningRight = keys.current['ArrowRight'] || keys.current['d'] || touchControls?.right;
    const isNitroActive = (keys.current['Shift'] || keys.current[' '] || touchControls?.nitro) && nitro.current > 1 && isAccelerating;

    const currentTopSpeed = isNitroActive ? carStats.topSpeed * 1.6 : carStats.topSpeed;
    
    const turnStrength = carStats.handling * (Math.min(speed.current / 5, 1.2));
    if (isTurningLeft) angle.current -= turnStrength;
    if (isTurningRight) angle.current += turnStrength;

    let acc = isAccelerating ? carStats.acceleration : isBraking ? -carStats.acceleration * 2.0 : 0;
    
    if (isNitroActive) {
      acc *= carStats.nitroPower; 
      nitro.current -= 1.5;
      const nitroCol = carStats.tier === 'Divine' ? COLORS.GOLD : COLORS.EMERALD;
      createParticle(pos.current.x, pos.current.y, nitroCol, true);
      createParticle(pos.current.x, pos.current.y, COLORS.NITRO_PURPLE, true);
      if (frameCounter.current % 2 === 0) createParticle(pos.current.x, pos.current.y, COLORS.CRYSTAL_WHITE, true);
      
      screenShake.current = Math.max(screenShake.current, 6.0);
      cameraZoom.current = (cameraZoom.current + 20) * 0.5;
    } else {
      nitro.current = Math.min(100, nitro.current + WORLD_CONFIG.NITRO_REGEN);
      cameraZoom.current *= 0.9;
    }

    vel.current.x += Math.cos(angle.current) * acc;
    vel.current.y += Math.sin(angle.current) * acc;
    speed.current = Math.sqrt(vel.current.x ** 2 + vel.current.y ** 2);
    
    const driftFactor = 1 - Math.abs((vel.current.x * Math.cos(angle.current) + vel.current.y * Math.sin(angle.current)) / (speed.current || 1));
    let friction = driftFactor > 0.15 ? WORLD_CONFIG.DRIFT_FRICTION : WORLD_CONFIG.FRICTION;
    if (isBraking) friction *= 0.92;
    
    vel.current.x *= friction;
    vel.current.y *= friction;

    if (speed.current > currentTopSpeed) {
      const scale = currentTopSpeed / speed.current;
      vel.current.x *= scale; vel.current.y *= scale;
    }

    pos.current.x += vel.current.x;
    pos.current.y += vel.current.y;
    distance.current = Math.max(0, -pos.current.y + 400);

    const newLap = Math.floor(distance.current / RACE_CONFIG.LAP_DISTANCE) + 1;
    if (newLap > currentLap.current) {
        currentLap.current = newLap;
        if (currentLap.current > level.laps) {
            onGameOver(score.current, distance.current, true, currentRank.current);
            return;
        }
    }

    const camTargetY = pos.current.y - (canvas.height * 0.7) + (speed.current * 10) + cameraZoom.current;
    cameraY.current += (camTargetY - cameraY.current) * 0.15;

    const margin = 50;
    if (pos.current.x < margin) { pos.current.x = margin; vel.current.x *= -0.4; health.current -= speed.current * 0.1; screenShake.current = speed.current; }
    if (pos.current.x > canvas.width - margin) { pos.current.x = canvas.width - margin; vel.current.x *= -0.4; health.current -= speed.current * 0.1; screenShake.current = speed.current; }

    score.current += Math.floor(speed.current * 0.5);

    const rankings = [{ id: 'player', dist: distance.current }];
    
    // AI Racers Persistent Movement (No Teleporting)
    aiRacers.current.forEach(ai => {
      // Basic AI logic: Move forward, switch lanes occasionally
      const aiTargetSpeed = ai.stats.topSpeed * level.aiSpeedMult;
      
      // Rubber banding: If AI is too far behind, boost them slightly; if too far ahead, slow down
      let rubberBandMult = 1.0;
      const playerDiff = distance.current - ai.distance;
      if (playerDiff > 2000) rubberBandMult = 1.2;
      else if (playerDiff < -2000) rubberBandMult = 0.8;

      ai.speed += (aiTargetSpeed * rubberBandMult - ai.speed) * 0.05;
      
      // AI lane switching logic
      ai.laneSwitchTimer--;
      if (ai.laneSwitchTimer <= 0) {
        ai.targetLane = Math.floor(Math.random() * 4);
        ai.laneSwitchTimer = 150 + Math.random() * 300;
      }
      
      const targetX = 100 + ai.targetLane * 150;
      ai.pos.x += (targetX - ai.pos.x) * 0.04;
      ai.pos.y -= ai.speed;
      
      // Correcting AI angle based on lateral movement
      ai.angle = -Math.PI / 2 + (targetX - ai.pos.x) * 0.005;
      ai.distance = -ai.pos.y + 400;

      rankings.push({ id: ai.id, dist: ai.distance });
    });

    rankings.sort((a, b) => b.dist - a.dist);
    currentRank.current = rankings.findIndex(r => r.id === 'player') + 1;

    // Obstacle and Scenery spawning
    if (Math.random() < WORLD_CONFIG.OBSTACLE_SPAWN_RATE) {
        obstacles.current.push({ id: Math.random().toString(36), x: 100 + Math.floor(Math.random() * 4) * 150, y: cameraY.current - 400, width: 60, height: 60, health: 100, maxHealth: 100, type: 'crate' });
    }
    if (Math.random() < WORLD_CONFIG.COIN_SPAWN_RATE) {
        obstacles.current.push({ id: Math.random().toString(36), x: 100 + Math.floor(Math.random() * 4) * 150, y: cameraY.current - 400, width: 50, height: 50, health: 1, maxHealth: 1, type: 'coin' });
    }
    if (scenery.current.length < 35 || scenery.current[scenery.current.length-1].y > cameraY.current - 1200) {
        spawnScenery(cameraY.current - 2000);
    }

    particles.current.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life += 1;
      if (p.life > p.maxLife) particles.current.splice(i, 1);
    });

    obstacles.current.forEach((obs, i) => {
      if (Math.abs(pos.current.x - obs.x) < 45 && Math.abs(pos.current.y - obs.y) < 45) {
        if (obs.type === 'coin') { sessionCoins.current += 150; for(let j=0; j<20; j++) createParticle(obs.x, obs.y, COLORS.GOLD); }
        else { health.current -= speed.current * 1.5 + 15; screenShake.current = speed.current * 4; for(let j=0; j<25; j++) createParticle(obs.x, obs.y, COLORS.WARNING_RED); }
        obstacles.current.splice(i, 1);
      }
      // Remove off-screen obstacles
      if (obs.y - cameraY.current > canvas.height + 200) obstacles.current.splice(i, 1);
    });

    updateState({ score: score.current, distance: distance.current, nitro: nitro.current, health: health.current, speed: speed.current, lap: currentLap.current, sessionCoins: sessionCoins.current, position: currentRank.current });
    screenShake.current *= 0.9;
    if (health.current <= 0) onGameOver(score.current, distance.current, false, currentRank.current);
  };

  const drawScenery = (ctx: CanvasRenderingContext2D, obj: Scenery) => {
    const screenY = obj.y - cameraY.current;
    if (screenY < -600 || screenY > ctx.canvas.height + 600) return;
    ctx.save();
    ctx.translate(obj.x, screenY);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = obj.type === 'church' ? COLORS.GOLD : COLORS.EMERALD;
    ctx.lineWidth = 3;
    ctx.fillRect(-obj.width/2, -obj.height/2, obj.width, obj.height);
    ctx.strokeRect(-obj.width/2, -obj.height/2, obj.width, obj.height);

    const isDivine = obj.type === 'church' || obj.type === 'cross_beacon';
    if (isDivine) {
       const crossSize = obj.type === 'church' ? 50 : 30;
       const crossY = -obj.height/2 - (obj.type === 'church' ? 40 : 25);
       ctx.strokeStyle = COLORS.GOLD;
       ctx.shadowBlur = 20;
       ctx.shadowColor = COLORS.GOLD;
       ctx.lineWidth = 5;
       ctx.beginPath(); ctx.moveTo(-crossSize/2, crossY); ctx.lineTo(crossSize/2, crossY); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(0, crossY - crossSize*0.7); ctx.lineTo(0, crossY + crossSize*1.3); ctx.stroke();
    }
    ctx.restore();
  };

  const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, carAngle: number, color: string, label?: string, isPlayer: boolean = false) => {
    const screenX = x; const screenY = y - cameraY.current;
    if (screenY < -200 || screenY > ctx.canvas.height + 200) return;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(carAngle + Math.PI / 2);
    
    if (isPlayer && speed.current > 20) {
       ctx.shadowBlur = 30; ctx.shadowColor = color;
    } else {
       ctx.shadowBlur = 15; ctx.shadowColor = color;
    }

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(18, -18); ctx.lineTo(24, 25); ctx.lineTo(0, 18); ctx.lineTo(-24, 25); ctx.lineTo(-18, -18); ctx.closePath(); ctx.fill();
    
    if (isPlayer && carStats.id === 'alpha_saviour') {
       ctx.shadowBlur = 40; ctx.shadowColor = COLORS.GOLD;
       ctx.strokeStyle = '#000';
       ctx.lineWidth = 3;
       ctx.beginPath();
       ctx.moveTo(-15, 8); ctx.quadraticCurveTo(0, -5, 15, 8); ctx.quadraticCurveTo(0, 21, -15, 8);
       ctx.moveTo(15, 8); ctx.lineTo(22, 0); ctx.moveTo(15, 8); ctx.lineTo(22, 16);
       ctx.stroke();
       ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 5); ctx.moveTo(-6, -12); ctx.lineTo(6, -12); ctx.stroke();
    }
    ctx.restore();
    if (label) {
      ctx.fillStyle = color; ctx.font = 'black 12px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(label.toUpperCase(), screenX, screenY - 55);
    }
  };

  const drawSpeedLines = (ctx: CanvasRenderingContext2D) => {
    const intensity = Math.min((speed.current / 35) * 1.0, 1.0);
    if (intensity < 0.05) return;
    
    const lines = Math.floor(25 * intensity);
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 136, ${intensity * 0.4})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < lines; i++) {
       const x = Math.random() * ctx.canvas.width;
       const y = Math.random() * ctx.canvas.height;
       const length = 150 * intensity + Math.random() * 100;
       ctx.beginPath();
       ctx.moveTo(x, y);
       ctx.lineTo(x, y + length);
       ctx.stroke();
    }
    ctx.restore();
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    if (screenShake.current > 0.1) ctx.translate((Math.random() - 0.5) * screenShake.current, (Math.random() - 0.5) * screenShake.current);
    ctx.fillStyle = COLORS.VOID_DARK;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const roadStart = 50; const roadEnd = ctx.canvas.width - 50;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
    for (let x = 100; x < ctx.canvas.width; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke(); }
    
    const startY = Math.floor(cameraY.current / 150) * 150;
    for (let y = startY; y < cameraY.current + ctx.canvas.height + 300; y += 150) {
      const screenY = y - cameraY.current;
      ctx.beginPath(); ctx.moveTo(roadStart, screenY); ctx.lineTo(roadEnd, screenY); ctx.stroke();
    }

    ctx.strokeStyle = COLORS.EMERALD; ctx.lineWidth = 6;
    ctx.shadowBlur = 20; ctx.shadowColor = COLORS.EMERALD;
    ctx.beginPath(); ctx.moveTo(roadStart, 0); ctx.lineTo(roadStart, ctx.canvas.height); ctx.moveTo(roadEnd, 0); ctx.lineTo(roadEnd, ctx.canvas.height); ctx.stroke();
    ctx.shadowBlur = 0;
    
    scenery.current.forEach(obj => drawScenery(ctx, obj));
    drawSpeedLines(ctx);

    particles.current.forEach(p => { 
        const sY = p.y - cameraY.current; 
        if (sY < -100 || sY > ctx.canvas.height + 100) return;
        ctx.globalAlpha = 1 - (p.life/p.maxLife); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, sY, p.size, 0, Math.PI*2); ctx.fill(); 
    });
    ctx.globalAlpha = 1;
    
    obstacles.current.forEach(obs => {
      const sY = obs.y - cameraY.current;
      if (sY < -100 || sY > ctx.canvas.height + 100) return;
      if (obs.type === 'coin') { ctx.fillStyle = COLORS.GOLD; ctx.shadowBlur = 20; ctx.shadowColor = COLORS.GOLD; ctx.beginPath(); ctx.moveTo(obs.x, sY - 25); ctx.lineTo(obs.x + 20, sY); ctx.lineTo(obs.x, sY + 25); ctx.lineTo(obs.x - 20, sY); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; }
      else { ctx.fillStyle = '#1e293b'; ctx.fillRect(obs.x - 30, sY - 30, 60, 60); ctx.strokeStyle = COLORS.WARNING_RED; ctx.lineWidth = 4; ctx.strokeRect(obs.x - 30, sY - 30, 60, 60); }
    });
    
    aiRacers.current.forEach(ai => drawCar(ctx, ai.pos.x, ai.pos.y, ai.angle, ai.stats.color, ai.stats.name));
    drawCar(ctx, pos.current.x, pos.current.y, angle.current, carStats.color, "Alpha", true);
    ctx.restore();
  };

  const loop = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) { update(canvasRef.current); draw(ctx); }
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [status]);

  return <canvas ref={canvasRef} width={800} height={window.innerHeight} className="max-w-full h-full shadow-[0_0_100px_rgba(0,0,0,1)] border-x-4 border-emerald-950" />;
};

export default GameEngine;
