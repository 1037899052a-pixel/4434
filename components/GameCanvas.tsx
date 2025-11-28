import React, { useRef, useEffect, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PLAYER_SIZE } from '../constants';
import { GameEntity, EntityType, Particle, GameState } from '../types';

interface GameCanvasProps {
  isPlaying: boolean;
  onGameOver: (score: number, wave: number) => void;
  onScoreUpdate: (score: number) => void;
  onHealthUpdate: (health: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ isPlaying, onGameOver, onScoreUpdate, onHealthUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for performance loop)
  const requestRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const framesRef = useRef(0);
  const waveRef = useRef(1);
  const entitiesRef = useRef<GameEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef(0); // Screen shake intensity
  
  // Player Input Refs
  const mousePosRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 });
  const isMouseDownRef = useRef(false);

  // --- Core Game Functions ---

  const spawnPlayer = () => {
    entitiesRef.current.push({
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 100 },
      vel: { x: 0, y: 0 },
      radius: PLAYER_SIZE,
      color: COLORS.player,
      health: 100,
      maxHealth: 100,
      markedForDeletion: false,
      scoreValue: 0
    });
    onHealthUpdate(100);
  };

  const createExplosion = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: Math.random() * 3 + 1
      });
    }
  };

  const spawnEnemy = () => {
    const difficulty = Math.min(waveRef.current * 0.5, 5);
    const rand = Math.random();
    
    let type = EntityType.ENEMY_BASIC;
    let radius = 15;
    let health = 10 + difficulty * 2;
    let color = COLORS.enemyBasic;
    let speed = 2 + difficulty * 0.2;
    let score = 100;

    if (rand > 0.8) {
      type = EntityType.ENEMY_FAST;
      radius = 10;
      health = 5 + difficulty;
      color = COLORS.enemyFast;
      speed = 4 + difficulty * 0.3;
      score = 200;
    } else if (rand > 0.95) {
      type = EntityType.ENEMY_TANK;
      radius = 30;
      health = 40 + difficulty * 5;
      color = COLORS.enemyTank;
      speed = 1;
      score = 500;
    }

    entitiesRef.current.push({
      id: `enemy_${framesRef.current}`,
      type,
      pos: { x: Math.random() * (CANVAS_WIDTH - 40) + 20, y: -50 },
      vel: { x: (Math.random() - 0.5) * 1, y: speed },
      radius,
      color,
      health,
      maxHealth: health,
      markedForDeletion: false,
      scoreValue: score
    });
  };

  const fireBullet = (source: GameEntity) => {
    const isPlayer = source.type === EntityType.PLAYER;
    const speed = isPlayer ? -12 : 5;
    const color = isPlayer ? COLORS.playerBullet : COLORS.enemyBullet;
    const type = isPlayer ? EntityType.BULLET_PLAYER : EntityType.BULLET_ENEMY;
    
    // Spread for tank enemies
    if (source.type === EntityType.ENEMY_TANK) {
       for(let i = -1; i <= 1; i++) {
          entitiesRef.current.push({
            id: `bullet_${framesRef.current}_${Math.random()}`,
            type,
            pos: { x: source.pos.x, y: source.pos.y + source.radius },
            vel: { x: i * 2, y: speed },
            radius: 4,
            color,
            health: 1,
            maxHealth: 1,
            markedForDeletion: false,
            scoreValue: 0
          });
       }
       return;
    }

    entitiesRef.current.push({
      id: `bullet_${framesRef.current}_${Math.random()}`,
      type,
      pos: { x: source.pos.x, y: isPlayer ? source.pos.y - source.radius : source.pos.y + source.radius },
      vel: { x: 0, y: speed },
      radius: isPlayer ? 4 : 5, // Player bullets smaller
      color,
      health: 1,
      maxHealth: 1,
      markedForDeletion: false,
      scoreValue: 0
    });
  };

  // --- Main Loop ---

  const update = () => {
    framesRef.current++;

    // Screen Shake Decay
    if (shakeRef.current > 0) shakeRef.current *= 0.9;
    if (shakeRef.current < 0.5) shakeRef.current = 0;

    // --- Difficulty & Spawning ---
    if (framesRef.current % 600 === 0) waveRef.current++;
    const spawnRate = Math.max(20, 60 - waveRef.current * 2);
    if (framesRef.current % spawnRate === 0) spawnEnemy();

    // --- Entity Logic ---
    const entities = entitiesRef.current;
    
    // Player Finding
    const player = entities.find(e => e.type === EntityType.PLAYER);
    if (player) {
      // Move Player (1:1 with mouse/touch, clamped to screen)
      // Slight smooth lerp for feel
      const dx = mousePosRef.current.x - player.pos.x;
      const dy = mousePosRef.current.y - player.pos.y;
      player.pos.x += dx * 0.15; 
      player.pos.y += dy * 0.15;
      
      // Clamp
      player.pos.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.pos.x));
      player.pos.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.pos.y));

      // Auto Fire
      if (framesRef.current % 8 === 0) fireBullet(player);
    }

    // Update Entities
    entities.forEach(entity => {
      // Movement
      entity.pos.x += entity.vel.x;
      entity.pos.y += entity.vel.y;

      // Bounds check cleanup
      if (
        entity.pos.y < -100 || 
        entity.pos.y > CANVAS_HEIGHT + 100 || 
        entity.pos.x < -100 || 
        entity.pos.x > CANVAS_WIDTH + 100
      ) {
        if (entity.type !== EntityType.PLAYER) {
           entity.markedForDeletion = true;
        }
      }

      // Enemy AI (Shooting)
      if (entity.type.includes('ENEMY') && Math.random() < 0.02) {
        fireBullet(entity);
      }
    });

    // --- Collision Detection ---
    for (let i = 0; i < entities.length; i++) {
      const a = entities[i];
      if (a.markedForDeletion) continue;

      for (let j = i + 1; j < entities.length; j++) {
        const b = entities[j];
        if (b.markedForDeletion) continue;

        // Filter friendly fire
        const aIsPlayerTeam = a.type === EntityType.PLAYER || a.type === EntityType.BULLET_PLAYER;
        const bIsPlayerTeam = b.type === EntityType.PLAYER || b.type === EntityType.BULLET_PLAYER;
        
        if (aIsPlayerTeam === bIsPlayerTeam) continue;

        // Circle Collision
        const dx = a.pos.x - b.pos.x;
        const dy = a.pos.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.radius + b.radius) {
          // Hit!
          
          // Damage
          const damage = 20; // Base damage
          
          // Apply damage logic
          if (a.type.includes('BULLET')) a.markedForDeletion = true;
          else {
              a.health -= damage;
              if (a.health <= 0) a.markedForDeletion = true;
          }

          if (b.type.includes('BULLET')) b.markedForDeletion = true;
          else {
              b.health -= damage;
              if (b.health <= 0) b.markedForDeletion = true;
          }

          // Effects
          createExplosion((a.pos.x + b.pos.x)/2, (a.pos.y + b.pos.y)/2, '#fff', 5);
          
          // Scoring & Death
          const processDeath = (e: GameEntity) => {
             if (e.markedForDeletion && !e.type.includes('BULLET')) {
                 if (e.type === EntityType.PLAYER) {
                    onGameOver(scoreRef.current, waveRef.current);
                    // Big explosion
                    createExplosion(e.pos.x, e.pos.y, COLORS.player, 50);
                 } else {
                    scoreRef.current += e.scoreValue;
                    onScoreUpdate(scoreRef.current);
                    shakeRef.current += 5; // Screen shake on kill
                    createExplosion(e.pos.x, e.pos.y, e.color, 15);
                 }
             }
          };
          processDeath(a);
          processDeath(b);

          if (a.type === EntityType.PLAYER) onHealthUpdate(a.health);
          if (b.type === EntityType.PLAYER) onHealthUpdate(b.health);
        }
      }
    }

    // Remove Dead Entities
    entitiesRef.current = entitiesRef.current.filter(e => !e.markedForDeletion);

    // --- Particle Logic ---
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Fill Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Apply Shake
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Draw Stars (Parallax simplified)
    ctx.fillStyle = COLORS.stars;
    for(let i=0; i<50; i++) {
        const x = (i * 137) % CANVAS_WIDTH;
        const y = (framesRef.current * (1 + (i % 3)) + i * 50) % CANVAS_HEIGHT;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }

    // Draw Entities
    entitiesRef.current.forEach(e => {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      
      if (e.type === EntityType.PLAYER) {
        // Draw Player Ship (Triangle)
        ctx.moveTo(e.pos.x, e.pos.y - e.radius);
        ctx.lineTo(e.pos.x + e.radius, e.pos.y + e.radius);
        ctx.lineTo(e.pos.x, e.pos.y + e.radius * 0.7);
        ctx.lineTo(e.pos.x - e.radius, e.pos.y + e.radius);
        ctx.closePath();
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        
        // Engine Trail
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(e.pos.x - 5, e.pos.y + e.radius + Math.random() * 10, 3, 0, Math.PI * 2);
        ctx.arc(e.pos.x + 5, e.pos.y + e.radius + Math.random() * 10, 3, 0, Math.PI * 2);
        ctx.fill();

      } else if (e.type.includes('ENEMY')) {
        // Draw Enemy (Diamond or Box)
        ctx.shadowBlur = 0;
        if (e.type === EntityType.ENEMY_TANK) {
           ctx.rect(e.pos.x - e.radius, e.pos.y - e.radius, e.radius*2, e.radius*2);
        } else {
           ctx.moveTo(e.pos.x, e.pos.y + e.radius);
           ctx.lineTo(e.pos.x + e.radius, e.pos.y - e.radius);
           ctx.lineTo(e.pos.x - e.radius, e.pos.y - e.radius);
           ctx.closePath();
        }
      } else {
        // Bullets (Circle)
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
      }
      
      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  };

  const loop = () => {
    if (!isPlaying) return;
    
    update();
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }

    requestRef.current = requestAnimationFrame(loop);
  };

  // --- Setup & Cleanup ---

  useEffect(() => {
    if (isPlaying) {
      // Reset State
      framesRef.current = 0;
      scoreRef.current = 0;
      waveRef.current = 1;
      entitiesRef.current = [];
      particlesRef.current = [];
      shakeRef.current = 0;
      onScoreUpdate(0);
      spawnPlayer();
      
      requestRef.current = requestAnimationFrame(loop);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // --- Input Handlers ---
  
  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full max-w-[450px] max-h-[800px] object-contain cursor-crosshair touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={() => isMouseDownRef.current = true}
        onPointerUp={() => isMouseDownRef.current = false}
        // Touch events
        onTouchMove={(e) => {
            const touch = e.touches[0];
             const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            mousePosRef.current = {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY
            };
        }}
      />
      {/* Decorative Border for Desktop */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-slate-800/50 hidden md:block max-w-[450px] mx-auto h-full" />
    </div>
  );
};

export default GameCanvas;