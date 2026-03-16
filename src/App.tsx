import React, { useState, useEffect } from 'react';
import { GameLayout } from './components/layout/GameLayout';
import { DialogueBox } from './components/ui/DialogueBox';
import { Dashboard, GameConfig, GENRES, STYLES } from './components/ui/Dashboard';
import { useAudioSync } from './hooks/useAudioSync';
import { Mic } from 'lucide-react';
import { useGame } from './context/GameContext';

export default function App() {
  const { state, dispatch } = useGame();
  
  // View Routing State
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  // Visual State Machine
  const [currentImage, setCurrentImage] = useState("/images/genres/DF.png"); // Default dark fantasy placeholder instead of picsum
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Narrative State
  const [narrative, setNarrative] = useState("The ink dries on the manuscript. The world awaits your command.");
  const [speaker, setSpeaker] = useState('Narrator');
  const [inputText, setInputText] = useState('');

  // Audio Sync Hook
  const { isRecording, startRecording, playNarration, playFillerLine } = useAudioSync({
    onRecordingComplete: async (audioBlob) => {
      // State 2: Processing (Time Freeze)
      setIsProcessing(true);
      
      try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          
          try {
            const response = await fetch('/api/director/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userAction: "The player has spoken. Listen to the provided audio to determine their action.",
                previousContext: `Setting: ${gameConfig?.genre} / ${gameConfig?.style}. ${narrative}`,
                audioBase64: base64data,
                gameConfig
              })
            });
            
            const data = await response.json();
            handleDirectorResponse(data);
          } catch (error) {
            console.error("API Error", error);
            setIsProcessing(false);
          }
        };
      } catch (error) {
        console.error("Audio Processing Error", error);
        setIsProcessing(false);
      }
    }
  });

  const handleDirectorResponse = (data: any) => {
    let script = data.narration_script || "";
    
    // Parse [ALEX_TAG] (If still returned by backend, strip it since character portrait is removed)
    const tagMatch = script.match(/\[ALEX_TAG:(\w+)\]/);
    if (tagMatch) {
      script = script.replace(/\[ALEX_TAG:\w+\]/, '').trim();
    }

    setNarrative(script);
    const currentSpeaker = data.speaker_name || 'Narrator';
    setSpeaker(currentSpeaker);
    playNarration(script, currentSpeaker);

    if (data.imageUrl) {
      setNextImage(data.imageUrl);
    }

    if (!data.imageUrl) {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && narrative === "The ink dries on the manuscript. The world awaits your command.") {
      setIsProcessing(true);
      setNarrative("Initializing world...");
      
      fetch('/api/director/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAction: 'The player has entered the world. Introduce the scene.',
          previousContext: `Setting: ${gameConfig?.genre} / ${gameConfig?.style}.`,
          gameConfig
        })
      })
      .then(res => res.json())
      .then(handleDirectorResponse)
      .catch(error => {
        console.error("API Error", error);
        setIsProcessing(false);
      });
    }
  }, [gameState, narrative, gameConfig]);

  const handleStartGame = async (config: GameConfig) => {
    // Set an initial background based on the chosen genre before AI generates one
    const selectedGenreInfo = GENRES.find(g => g.id === config.genre);
    if (selectedGenreInfo) {
      setCurrentImage(selectedGenreInfo.img);
    }

    setGameConfig(config);
    setGameState('playing');
  };

  const handleNewImageLoaded = () => {
    if (nextImage) {
      setCurrentImage(nextImage);
      setNextImage(null);
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    
    playFillerLine();
    setIsProcessing(true);
    
    const actionText = inputText;
    setInputText('');
    
    try {
      const response = await fetch('/api/director/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAction: actionText,
          previousContext: `Setting: ${gameConfig?.genre} / ${gameConfig?.style}. ${narrative}`,
          gameConfig
        })
      });
      
      const data = await response.json();
      handleDirectorResponse(data);
    } catch (error) {
      console.error("API Error", error);
      setIsProcessing(false);
    }
  };

  if (gameState === 'setup') {
    return <Dashboard onStartGame={handleStartGame} />;
  }

  return (
    <GameLayout>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        
        {/* --- VISUAL LAYER --- */}
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

        {nextImage && (
          <img
            src={nextImage}
            alt="Preloading..."
            className="absolute opacity-0 pointer-events-none w-1 h-1"
            onLoad={handleNewImageLoaded}
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none z-10" />

        <div className="absolute bottom-10 left-0 right-0 px-6 flex flex-col items-center justify-end z-40 pointer-events-none">
          {/* Narrative Interface */}
          <DialogueBox 
            speaker={speaker}
            text={narrative} 
            isStreaming={!isProcessing} 
          />

          {/* Unified Input Row */}
          <div className="w-full max-w-2xl mx-auto flex items-center gap-4 pointer-events-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              disabled={isProcessing || isRecording}
              placeholder="Type your action..."
              className="flex-1 bg-black/60 border border-emerald-500/30 text-white placeholder:text-emerald-500/50 rounded-full px-6 py-4 backdrop-blur-md outline-none focus:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={startRecording}
              disabled={isRecording || isProcessing}
              className={`group relative flex items-center justify-center p-4 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-red-600/80 text-white shadow-[0_0_30px_rgba(220,38,38,0.8)] scale-105 animate-pulse' 
                  : isProcessing
                  ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                  : 'bg-black/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 backdrop-blur-md hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]'
              }`}
            >
              <Mic className={`w-6 h-6 ${isRecording ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overlays */}
        {/* Intentionally left blank for future overlays */}

      </div>
    </GameLayout>
  );
}

