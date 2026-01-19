
export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'crate' | 'barrier' | 'crystal' | 'coin';
}

export interface Scenery {
  id: string;
  x: number;
  y: number;
  type: 'building' | 'church' | 'cross_beacon';
  width: number;
  height: number;
  seed: number;
}

export interface CarStats {
  id: string;
  name: string;
  acceleration: number;
  topSpeed: number;
  handling: number;
  nitroPower: number;
  color: string;
  price: number;
  tier: 'Slow' | 'Fast' | 'Hyper' | 'Divine';
}

export interface AIRacer {
  id: string;
  pos: Vector2;
  vel: Vector2;
  angle: number;
  stats: CarStats;
  targetLane: number;
  health: number;
  speed: number;
  laneSwitchTimer: number;
  nitroCharge: number;
  aggression: number;
  isBoosting: boolean;
  speedProfile: 'slow' | 'medium' | 'fast';
  distance: number;
}

export enum GameStatus {
  MENU = 'MENU',
  LOBBY = 'LOBBY',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  FINISHED = 'FINISHED'
}

export interface Level {
  id: number;
  section: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  laps: number;
  aiSpeedMult: number;
}

export interface GameState {
  score: number;
  distance: number;
  nitro: number;
  health: number;
  speed: number;
  status: GameStatus;
  highScore: number;
  lap: number;
  totalLaps: number;
  coins: number;
  sessionCoins: number;
  position: number;
  totalRacers: number;
  lastDailyReward?: number;
}
