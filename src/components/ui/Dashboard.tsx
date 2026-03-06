import React, { useState } from 'react';
import { Upload, User, Play, Check } from 'lucide-react';

interface DashboardProps {
  onStartGame: (config: GameConfig) => void;
}

export interface GameConfig {
  character: string;
  style: string;
  genre: string;
  customImage?: File | null;
}

const CHARACTERS = [
  { id: 'detective', name: 'The Detective', img: 'https://picsum.photos/seed/detective/300/400' },
  { id: 'mage', name: 'The Mage', img: 'https://picsum.photos/seed/mage/300/400' },
  { id: 'civilian', name: 'The Civilian', img: 'https://picsum.photos/seed/civilian/300/400' },
];

const STYLES = [
  { id: 'stickman', name: 'Stickman', img: 'https://picsum.photos/seed/stickman/400/225' },
  { id: '90s-anime', name: '90s Anime', img: 'https://picsum.photos/seed/anime/400/225' },
  { id: 'hyper-realistic', name: 'Hyper-Realistic', img: 'https://picsum.photos/seed/real/400/225' },
  { id: '2d-flat', name: '2D Flat', img: 'https://picsum.photos/seed/flat/400/225' },
];

const GENRES = [
  { id: 'cyberpunk', name: 'Cyberpunk Action', img: 'https://picsum.photos/seed/cyber/300/450' },
  { id: 'slice-of-life', name: 'Slice of Life', img: 'https://picsum.photos/seed/life/300/450' },
  { id: 'dark-fantasy', name: 'Dark Fantasy', img: 'https://picsum.photos/seed/fantasy/300/450' },
  { id: 'romance', name: 'Romance', img: 'https://picsum.photos/seed/romance/300/450' },
];

export function Dashboard({ onStartGame }: DashboardProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    if (selectedCharacter && selectedStyle && selectedGenre) {
      setIsLoading(true);
      // Simulate loading delay before actual start
      setTimeout(() => {
        onStartGame({
          character: selectedCharacter,
          style: selectedStyle,
          genre: selectedGenre,
          customImage
        });
      }, 2000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomImage(e.target.files[0]);
      setSelectedCharacter('custom');
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
  const isReady = selectedCharacter && selectedStyle && selectedGenre;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="px-8 py-12 bg-gradient-to-b from-zinc-900/80 to-transparent">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 uppercase drop-shadow-lg">
          The Narrator
        </h1>
        <p className="mt-4 text-zinc-400 max-w-xl text-lg font-light">
          Configure your simulation parameters. Choose your avatar, visual style, and narrative genre to begin the sequence.
        </p>
      </header>

      <div className="space-y-12 px-8">
        
        {/* Row 1: Protagonist */}
        <section>
          <h2 className="text-xl font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" /> Select Protagonist
          </h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 [&::-webkit-scrollbar]:hidden -mx-8 px-8">
            
            {/* Custom Upload Card */}
            <div 
              className={`snap-start shrink-0 w-[200px] h-[300px] relative group cursor-pointer border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                selectedCharacter === 'custom' 
                  ? 'border-emerald-500 bg-emerald-950/20' 
                  : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900'
              }`}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <Upload className={`w-10 h-10 mb-4 ${selectedCharacter === 'custom' ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className={`font-medium ${selectedCharacter === 'custom' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {customImage ? 'Image Uploaded' : 'Upload Custom'}
              </span>
              {selectedCharacter === 'custom' && (
                <div className="absolute top-4 right-4 bg-emerald-500 rounded-full p-1">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}
            </div>

            {/* Default Characters */}
            {CHARACTERS.map((char) => (
              <div 
                key={char.id}
                onClick={() => setSelectedCharacter(char.id)}
                className={`snap-start shrink-0 w-[200px] h-[300px] relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedCharacter === char.id 
                    ? 'ring-4 ring-emerald-500 scale-105 z-10' 
                    : 'hover:scale-105 hover:z-10 opacity-80 hover:opacity-100'
                }`}
              >
                <img src={char.img} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
                  <span className={`font-medium text-lg ${selectedCharacter === char.id ? 'text-emerald-400' : 'text-white'}`}>
                    {char.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Row 2: Art Style */}
        <section>
          <h2 className="text-xl font-medium text-zinc-300 mb-4">Visual Style</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 [&::-webkit-scrollbar]:hidden -mx-8 px-8">
            {STYLES.map((style) => (
              <div 
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`snap-start shrink-0 w-[280px] h-[160px] relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                  selectedStyle === style.id 
                    ? 'ring-4 ring-emerald-500 scale-105 z-10' 
                    : 'hover:scale-105 hover:z-10 opacity-80 hover:opacity-100'
                }`}
              >
                <img src={style.img} alt={style.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                <div className="absolute bottom-3 left-4">
                  <span className={`font-bold text-lg tracking-wide ${selectedStyle === style.id ? 'text-emerald-400' : 'text-white'}`}>
                    {style.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Row 3: Genre */}
        <section>
          <h2 className="text-xl font-medium text-zinc-300 mb-4">Narrative Genre</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 [&::-webkit-scrollbar]:hidden -mx-8 px-8">
            {GENRES.map((genre) => (
              <div 
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`snap-start shrink-0 w-[180px] h-[270px] relative group cursor-pointer rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                  selectedGenre === genre.id 
                    ? 'ring-4 ring-emerald-500 -translate-y-2 shadow-emerald-900/50' 
                    : 'hover:-translate-y-2 hover:shadow-xl opacity-80 hover:opacity-100'
                }`}
              >
                <img src={genre.img} alt={genre.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
                  <span className={`font-bold text-sm uppercase tracking-wider leading-tight ${selectedGenre === genre.id ? 'text-emerald-400' : 'text-white'}`}>
                    {genre.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-40 flex justify-center pointer-events-none">
        <button
          onClick={handleStart}
          disabled={!isReady}
          className={`pointer-events-auto group relative px-12 py-6 rounded-full font-black text-xl tracking-widest uppercase transition-all duration-500 flex items-center gap-4 ${
            isReady 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_40px_rgba(5,150,105,0.6)] hover:shadow-[0_0_60px_rgba(16,185,129,0.8)] scale-100' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed scale-95 opacity-50'
          }`}
        >
          <span>Start Game</span>
          {isReady && <Play className="w-6 h-6 fill-current animate-pulse" />}
        </button>
      </div>

    </div>
  );
}
