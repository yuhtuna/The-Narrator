/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameLayout } from './components/layout/GameLayout';
import { DialogueBox } from './components/ui/DialogueBox';
import { Dashboard, GameConfig } from './components/ui/Dashboard';
import { useAudioSync } from './hooks/useAudioSync';
import { Mic } from 'lucide-react';

// Mock API function to simulate backend latency
const mockDirectorApi = async (audioBlob: Blob, config: GameConfig | null) => {
  return new Promise<{ imageUrl: string; text: string }>((resolve) => {
    setTimeout(() => {
      // Return a random image to demonstrate the transition
      const randomId = Math.floor(Math.random() * 1000);
      resolve({
        imageUrl: `https://picsum.photos/seed/${randomId}/1920/1080`,
        text: `You spoke into the void. The ${config?.genre || 'world'} shifts around you, reacting to your voice. The neon lights flicker in response.`
      });
    }, 2000); // 2 second simulated delay
  });
};

export default function App() {
  // View Routing State
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Visual State Machine
  const [currentImage, setCurrentImage] = useState("https://picsum.photos/seed/cyberpunk/1920/1080");
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Narrative State
  const [narrative, setNarrative] = useState("The neon rain slicks the pavement. The city awaits your command.");

  // Audio Sync Hook
  const { isRecording, startRecording, playNarration } = useAudioSync({
    onRecordingComplete: async (audioBlob) => {
      // State 2: Processing (Time Freeze)
      setIsProcessing(true);
      
      try {
        // Call Mock API with audio and config
        const response = await mockDirectorApi(audioBlob, gameConfig);
        
        // Start the "Hidden Cache" phase
        // We do NOT swap the image yet. We set nextImage to trigger the hidden <img> render.
        setNextImage(response.imageUrl);
        setNarrative(response.text);
        
        // Trigger voice handoff
        playNarration(response.text);
      } catch (error) {
        console.error("API Error", error);
        setIsProcessing(false);
      }
    }
  });

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    setGameState('playing');
  };

  const handleNewImageLoaded = () => {
    // State 3: Reveal
    // The hidden image has finished loading.
    // Instantly swap the main image and remove the grayscale filter.
    if (nextImage) {
      setCurrentImage(nextImage);
      setNextImage(null);
      setIsProcessing(false);
    }
  };

  // 1. The Dashboard View
  if (gameState === 'setup') {
    return <Dashboard onStartGame={handleStartGame} />;
  }

  // 2. The Game View
  return (
    <GameLayout>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        
        {/* --- VISUAL LAYER --- */}
        
        {/* Main Display Image */}
        {/* 
            State 1 (Idle): grayscale-0
            State 2 (Processing): grayscale
            State 3 (Reveal): grayscale-0 (transition handled by React state update)
        */}
        <div className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out">
          <img
            src={currentImage}
            alt="Current Scene"
            className={`w-full h-full object-cover transition-all duration-300 ${
              isProcessing ? 'grayscale scale-105' : 'grayscale-0 scale-100'
            }`}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* The Hidden Cache */}
        {/* This image is invisible but forces the browser to download the asset. */}
        {nextImage && (
          <img
            src={nextImage}
            alt="Preloading..."
            className="absolute opacity-0 pointer-events-none w-1 h-1"
            onLoad={handleNewImageLoaded}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none z-10" />

        {/* --- UI LAYER --- */}

        {/* Microphone Interaction */}
        <div className="absolute bottom-40 left-0 right-0 flex justify-center z-40">
          <button
            onClick={startRecording}
            disabled={isRecording || isProcessing}
            className={`group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold tracking-widest uppercase transition-all duration-300 ${
              isRecording 
                ? 'bg-red-600/80 text-white shadow-[0_0_30px_rgba(220,38,38,0.8)] scale-105 animate-pulse' 
                : isProcessing
                ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                : 'bg-black/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 backdrop-blur-md hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]'
            }`}
          >
            <Mic className={`w-6 h-6 ${isRecording ? 'animate-bounce' : ''}`} />
            <span>
              {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Hold to Speak (Max 4s)'}
            </span>
          </button>
        </div>

        {/* Narrative Interface */}
        <DialogueBox 
          speaker="Narrator"
          text={narrative} 
          isStreaming={!isProcessing} 
        />

      </div>
    </GameLayout>
  );
}

