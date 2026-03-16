import React, { useState, useMemo } from 'react';
import { Upload, User, Play, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onStartGame: (config: GameConfig) => void;
}

export interface GameConfig {
  style: string;
  genre: string;
}

function ManaParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      size: Math.random() * 8 + 4,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 20,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
          }}
          className="absolute rounded-full bg-emerald-400/40 blur-[2px] shadow-[0_0_10px_rgba(52,211,153,0.6)]"
        />
      ))}
    </div>
  );
}

function FallbackImage({ src, alt, className }: { src: string, alt: string, className?: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div className={`bg-gradient-to-br from-zinc-800 to-zinc-950 ${className}`} />;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setHasError(true)} 
      referrerPolicy="no-referrer" 
    />
  );
}

export const CHARACTERS = [
  { id: 'default', name: 'Alex (Default)', img: '/images/characters/alex.png' },
];

export const STYLES = [
  { id: 'pixel', name: 'Pixel', img: '/images/styles/img1.png' },
  { id: 'anime', name: 'Anime', img: '/images/styles/anime.png' },
  { id: 'realistic', name: 'Realistic', img: '/images/styles/real.png' },
];

export const GENRES = [
  { id: 'action', name: 'Action', img: '/images/genres/action.png' },
  { id: 'slice-of-life', name: 'Slice of Life', img: '/images/genres/SOL.png' },
  { id: 'dark-fantasy', name: 'Dark Fantasy', img: '/images/genres/DF.png' },
  { id: 'romance', name: 'Romance', img: '/images/genres/RM.png' },
];

export function Dashboard({ onStartGame }: DashboardProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    if (selectedStyle && selectedGenre) {
      setIsLoading(true);
      // Simulate loading delay before actual start
      setTimeout(() => {
        onStartGame({
          style: selectedStyle,
          genre: selectedGenre,
        });
      }, 2000);
    }
  };

  // 2. The Loading View
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-end justify-end p-12">
        {/* Custom Neon Pulse Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-ping"></div>
          <div className="absolute w-12 h-12 border-4 border-t-emerald-500 border-r-transparent border-b-emerald-500 border-l-transparent rounded-full animate-spin"></div>
          <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse"></div>
          <span className="absolute -bottom-8 text-emerald-500/80 font-mono text-xs tracking-widest animate-pulse">INITIALIZING</span>
        </div>
      </div>
    );
  }

  // 1. The Dashboard View
  const isReady = selectedStyle && selectedGenre;

  return (
    <div className="h-screen overflow-y-auto bg-zinc-950 text-white font-sans selection:bg-emerald-500/30 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-900 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-500">
      
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center opacity-40 animate-ken-burns"
          style={{ backgroundImage: 'url(/images/genres/DF.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/90 to-zinc-950" />
        <ManaParticles />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 pb-4">
        
        {/* Header */}
        <header className="mb-16 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase drop-shadow-2xl">
            The Narrator
          </h1>
          <p className="mt-6 text-zinc-400 max-w-2xl text-lg md:text-xl font-light leading-relaxed">
            Open your manuscript. Define your character, choose your visual prose, and set the narrative tone to begin writing your masterpiece.
          </p>
        </header>

        <div className="space-y-20">
        
          {/* Section 1: Art Style */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
              <span className="tracking-wide uppercase">Art Style</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {STYLES.map((style) => (
                <div 
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`h-40 relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 ${
                    selectedStyle === style.id 
                      ? 'ring-4 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02] z-10' 
                      : 'hover:scale-[1.02] hover:shadow-xl opacity-70 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <FallbackImage src={style.img} alt={style.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-black text-2xl uppercase tracking-widest drop-shadow-lg ${selectedStyle === style.id ? 'text-emerald-400' : 'text-white'}`}>
                      {style.name}
                    </span>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                      <Check className="w-4 h-4 text-black stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Genre */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
              <span className="tracking-wide uppercase">Narrative Genre</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {GENRES.map((genre) => (
                <div 
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`aspect-[3/4] relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 ${
                    selectedGenre === genre.id 
                      ? 'ring-4 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02] z-10' 
                      : 'hover:scale-[1.02] hover:shadow-xl opacity-70 hover:opacity-100 grayscale hover:grayscale-0'
                  }`}
                >
                  <FallbackImage src={genre.img} alt={genre.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-6">
                    <span className={`font-bold text-sm md:text-base uppercase tracking-wider leading-tight ${selectedGenre === genre.id ? 'text-emerald-400' : 'text-white'}`}>
                      {genre.name}
                    </span>
                  </div>
                  {selectedGenre === genre.id && (
                    <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                      <Check className="w-4 h-4 text-black stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Spacer to ensure content is not hidden behind the fixed footer */}
          <div className="h-24 w-full" aria-hidden="true" />
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-8 z-50 flex justify-center pointer-events-none bg-gradient-to-t from-zinc-950/90 via-zinc-950/0 to-transparent">
        <button
          onClick={handleStart}
          disabled={!isReady}
          className={`pointer-events-auto group relative px-16 py-5 rounded-full font-black text-xl tracking-widest uppercase transition-all duration-500 flex items-center gap-4 backdrop-blur-md ${
            isReady 
              ? 'bg-emerald-600/80 hover:bg-emerald-500/90 text-white shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_rgba(16,185,129,0.7)] scale-100' 
              : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed scale-95'
          }`}
        >
          <span>Begin Story</span>
          {isReady && <Play className="w-6 h-6 fill-current animate-pulse" />}
        </button>
      </div>

    </div>
  );
}
