export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY_BASIC = 'ENEMY_BASIC',
  ENEMY_FAST = 'ENEMY_FAST',
  ENEMY_TANK = 'ENEMY_TANK',
  BULLET_PLAYER = 'BULLET_PLAYER',
  BULLET_ENEMY = 'BULLET_ENEMY',
}

export interface GameEntity extends Entity {
  type: EntityType;
  markedForDeletion: boolean;
  scoreValue: number;
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

export interface GameState {
  score: number;
  wave: number;
  isGameOver: boolean;
  isPlaying: boolean;
  health: number;
  maxHealth: number;
}

export interface TacticalDebrief {
  rank: string;
  message: string;
  tips: string[];
}