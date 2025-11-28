export const CANVAS_WIDTH = 450; // Vertical aspect ratio logic usually handled by CSS, but internal resolution is fixed
export const CANVAS_HEIGHT = 800;

export const PLAYER_SPEED = 0.15; // LERP factor
export const PLAYER_FIRE_RATE = 5; // Frames between shots
export const PLAYER_SIZE = 20;

export const ENEMY_SPAWN_RATE_BASE = 60; // Frames
export const DIFFICULTY_SCALING = 0.98; // Multiplier per wave/time

export const COLORS = {
  player: '#38bdf8', // Sky blue
  playerBullet: '#f0f9ff',
  enemyBasic: '#ef4444', // Red
  enemyFast: '#f59e0b', // Amber
  enemyTank: '#a855f7', // Purple
  enemyBullet: '#fbbf24', // Amber
  background: '#020617',
  stars: '#94a3b8',
};
