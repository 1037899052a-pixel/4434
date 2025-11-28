import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { generateTacticalDebrief } from './services/geminiService';
import { GameState, TacticalDebrief } from './types';
import { Play, RotateCcw, Shield, ShieldAlert, Crosshair, BrainCircuit, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    wave: 1,
    isGameOver: false,
    isPlaying: false,
    health: 100,
    maxHealth: 100
  });

  const [debrief, setDebrief] = useState<TacticalDebrief | null>(null);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const handleStartGame = () => {
    setGameState({
      score: 0,
      wave: 1,
      isGameOver: false,
      isPlaying: true,
      health: 100,
      maxHealth: 100
    });
    setDebrief(null);
    setStartTime(Date.now());
  };

  const handleGameOver = async (finalScore: number, finalWave: number) => {
    setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
    
    // Fetch Debrief from Gemini
    if (process.env.API_KEY) {
        setIsLoadingDebrief(true);
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const data = await generateTacticalDebrief(finalScore, finalWave, duration);
        setDebrief(data);
        setIsLoadingDebrief(false);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex flex-col md:flex-row text-white overflow-hidden">
      
      {/* Sidebar / Topbar (Desktop: Left, Mobile: Top) */}
      <div className="w-full md:w-80 bg-slate-900 border-b md:border-r border-slate-700 p-6 flex flex-col justify-between z-10 shadow-2xl">
        <div>
          <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 tracking-tighter uppercase italic">
            Sky Guardian
          </h1>
          <h2 className="text-sm font-sans tracking-widest text-slate-400 mb-8 uppercase">
            Project Aether Assault
          </h2>

          <div className="space-y-6">
             {/* Stats Panel */}
             <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Crosshair size={14} /> Score
                    </span>
                    <span className="text-2xl font-mono font-bold text-cyan-300">
                        {gameState.score.toLocaleString().padStart(6, '0')}
                    </span>
                </div>
                <div className="h-px bg-slate-700 my-2" />
                 <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Shield size={14} /> Hull Integrity
                    </span>
                    <span className={`text-xl font-mono font-bold ${gameState.health < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {Math.max(0, gameState.health)}%
                    </span>
                </div>
                 {/* Health Bar Visual */}
                 <div className="w-full bg-slate-900 h-1.5 mt-2 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${gameState.health < 30 ? 'bg-red-500' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.max(0, gameState.health)}%` }}
                    />
                 </div>
             </div>

             <div className="bg-slate-800/30 p-3 rounded border border-slate-700/50">
                 <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                    <span>WAVE STATUS</span>
                    <span>LEVEL {gameState.wave}</span>
                 </div>
                 <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 animate-[pulse_2s_infinite]" style={{width: '100%'}}></div>
                 </div>
             </div>
          </div>
        </div>

        {/* Start Button Area (Hidden if game over/playing logic requires) */}
        {!gameState.isPlaying && !gameState.isGameOver && (
             <button 
                onClick={handleStartGame}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 group uppercase tracking-widest text-sm"
             >
                <Play size={18} className="fill-current" />
                Initiate Sortie
             </button>
        )}
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
        
        <GameCanvas 
            isPlaying={gameState.isPlaying}
            onGameOver={handleGameOver}
            onScoreUpdate={(s) => setGameState(prev => ({...prev, score: s}))}
            onHealthUpdate={(h) => setGameState(prev => ({...prev, health: h}))}
        />

        {/* Overlays */}
        
        {/* Main Menu Overlay (First Load) */}
        {!gameState.isPlaying && !gameState.isGameOver && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none md:hidden">
                <div className="text-center animate-bounce opacity-50">
                    <p className="text-cyan-400 text-xs tracking-[0.3em]">TAP START TO ENGAGE</p>
                </div>
             </div>
        )}

        {/* Game Over Screen */}
        {gameState.isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.3s_ease-out]">
                <h2 className="text-5xl font-display font-black text-red-500 mb-2 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    Mission Failed
                </h2>
                <div className="text-slate-400 mb-8 font-mono text-sm">
                    UNIT LOST IN SECTOR {gameState.wave}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Final Score</div>
                        <div className="text-2xl font-bold text-white">{gameState.score.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Waves Cleared</div>
                        <div className="text-2xl font-bold text-amber-400">{gameState.wave - 1}</div>
                    </div>
                </div>

                {/* Tactical Debrief Section */}
                <div className="w-full max-w-md bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-8 relative overflow-hidden">
                    <div className="flex items-center gap-2 text-cyan-400 mb-4 border-b border-slate-800 pb-2">
                        <BrainCircuit size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">A.I. Tactical Analysis</span>
                    </div>

                    {isLoadingDebrief ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                             <Loader2 className="animate-spin mb-2" size={24} />
                             <span className="text-xs animate-pulse">Analyzing Flight Data...</span>
                        </div>
                    ) : debrief ? (
                        <div className="text-left space-y-3">
                             <div className="flex justify-between items-baseline">
                                 <span className="text-xs text-slate-500 uppercase">Pilot Rank Assigned</span>
                                 <span className="text-amber-400 font-display font-bold text-lg">{debrief.rank}</span>
                             </div>
                             <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-cyan-500 pl-3">
                                "{debrief.message}"
                             </p>
                             <div className="space-y-1 mt-3">
                                 {debrief.tips.map((tip, i) => (
                                     <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                         <span className="text-cyan-500 mt-0.5">›</span> {tip}
                                     </div>
                                 ))}
                             </div>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-600">analysis unavailable</div>
                    )}
                </div>

                <button 
                    onClick={handleStartGame}
                    className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors rounded shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
                >
                    <RotateCcw size={16} />
                    Re-Deploy
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;