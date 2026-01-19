
import { CarStats, Level } from './types';

export const COLORS = {
  EMERALD: '#00FF88', // Emerald Green Glow
  EMERALD_DEEP: '#064E3B', // Deep Emerald
  GOLD: '#FFD700', // Golden Glory
  GOLD_DEEP: '#B45309', // Deep Gold
  ELECTRIC_BLUE: '#00A3FF',
  VOID_DARK: '#020617',
  CRYSTAL_WHITE: '#F8FAFC',
  NITRO_PURPLE: '#BC00FF',
  WARNING_RED: '#FF3131',
  DIVINE_LIGHT: '#FFF7ED',
};

export const CARS: CarStats[] = [
  {
    id: 'starter',
    name: 'Neon Breeze',
    acceleration: 0.2,
    topSpeed: 15,
    handling: 0.12,
    nitroPower: 2.0,
    color: '#94a3b8',
    price: 0,
    tier: 'Slow',
  },
  {
    id: 'emerald_apex',
    name: 'Emerald Apex',
    acceleration: 0.3,
    topSpeed: 22,
    handling: 0.1,
    nitroPower: 2.8,
    color: COLORS.EMERALD,
    price: 1500,
    tier: 'Fast',
  },
  {
    id: 'cobalt_specter',
    name: 'Cobalt Specter',
    acceleration: 0.28,
    topSpeed: 28,
    handling: 0.08,
    nitroPower: 3.5,
    color: COLORS.ELECTRIC_BLUE,
    price: 5000,
    tier: 'Fast',
  },
  {
    id: 'alpha_saviour',
    name: 'Alpha Saviour',
    acceleration: 0.6, // Divine burst
    topSpeed: 45,
    handling: 0.2,
    nitroPower: 6.0, // God-like speed
    color: COLORS.GOLD,
    price: 77777,
    tier: 'Divine',
  },
  {
    id: 'zenith_crystal',
    name: 'Zenith Crystal',
    acceleration: 0.45,
    topSpeed: 35,
    handling: 0.15,
    nitroPower: 4.5,
    color: COLORS.CRYSTAL_WHITE,
    price: 50000,
    tier: 'Hyper',
  }
];

const generateLevels = (count: number, section: number, difficulty: Level['difficulty'], baseSpeed: number): Level[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    section,
    difficulty,
    laps: section + 2,
    aiSpeedMult: baseSpeed + (i * 0.03)
  }));
};

export const SECTIONS = [
  { id: 1, name: 'EMERALD DISTRICT', difficulty: 'Easy', levels: generateLevels(10, 1, 'Easy', 0.6) },
  { id: 2, name: 'GOLDEN GLORY PATH', difficulty: 'Medium', levels: generateLevels(17, 2, 'Medium', 0.85) },
  { id: 3, name: 'CELESTIAL SUMMIT', difficulty: 'Hard', levels: generateLevels(20, 3, 'Hard', 1.1) },
];

export const WORLD_CONFIG = {
  LANE_WIDTH: 150,
  ROAD_WIDTH: 600,
  GRAVITY: 0,
  FRICTION: 0.99, // High retention of speed
  DRIFT_FRICTION: 0.97,
  OBSTACLE_SPAWN_RATE: 0.015,
  COIN_SPAWN_RATE: 0.02,
  NITRO_REGEN: 0.3, // Fast recharge for non-stop action
};

export const RACE_CONFIG = {
  LAP_DISTANCE: 10000,
};
