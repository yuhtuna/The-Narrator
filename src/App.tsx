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
  const [awaitingInput, setAwaitingInput] = useState(true);
  const [sceneQueue, setSceneQueue] = useState<any[]>([]);

  // State buffer to hold narrative values until image loads
  const [pendingUpdate, setPendingUpdate] = useState<{
    script: string;
    speaker: string;
    requires_user_action: boolean;
  } | null>(null);

  const applyPendingUpdate = (update: any) => {
    setNarrative(update.script);
    setSpeaker(update.speaker);
    playNarration(update.script, update.speaker);
    setAwaitingInput(update.requires_user_action);
    setPendingUpdate(null);
    setIsProcessing(false);
  };

  const playNextScene = () => {
    if (sceneQueue.length === 0) return;
    
    // Set to processing immediately so the current image grayscales and input blocks whilst fetching/syncing
    setIsProcessing(true);

    const sceneToPlay = sceneQueue[0];
    setSceneQueue(prevQueue => prevQueue.slice(1));
    
    let script = sceneToPlay.narration_script || "";
    const tagMatch = script.match(/\[ALEX_TAG:(\w+)\]/);
    if (tagMatch) {
      script = script.replace(/\[ALEX_TAG:\w+\]/, '').trim();
    }

    const currentSpeaker = sceneToPlay.speaker_name || 'Narrator';
    
    // Hold these values in state until image loads to prevent race conditions
    if (sceneToPlay.imageUrl) {
        // IMAGE WAS ALREADY PREFETCHED! No need to hit the API, just render immediately.
        setPendingUpdate({
          script,
          speaker: currentSpeaker,
          requires_user_action: sceneToPlay.requires_user_action
        });
        setNextImage(sceneToPlay.imageUrl);
    } else if (sceneToPlay.visual_prompt) {
        // Fallback: If player clicked so fast the prefetch didn't finish, block & fetch manually
        setPendingUpdate({
          script,
          speaker: currentSpeaker,
          requires_user_action: sceneToPlay.requires_user_action
        });

        fetch('/api/director/image', { 
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ visual_prompt: sceneToPlay.visual_prompt, gameConfig })
        })
        .then(res => res.json())
        .then(data => {
            if (data.imageUrl) {
               // Next image will trigger handleNewImageLoaded
               setNextImage(data.imageUrl); 
            } else {
               // Apply update immediately if image fetch failed to avoid soft lock
               applyPendingUpdate({script, speaker: currentSpeaker, requires_user_action: sceneToPlay.requires_user_action});
            }
        })
        .catch(() => {
             // Fallback apply
             applyPendingUpdate({script, speaker: currentSpeaker, requires_user_action: sceneToPlay.requires_user_action});
        });
    } else {
       // Apply immediately if no image prompt exists
       applyPendingUpdate({script, speaker: currentSpeaker, requires_user_action: sceneToPlay.requires_user_action});
    }
  };

  // Audio Sync Hook
  const { isRecording, startRecording, playNarration, playFillerLine } = useAudioSync({
    onRecordingComplete: async (audioBlob) => {
      // State 2: Processing (Time Freeze)
      setIsProcessing(true);
      playFillerLine();
      
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
    // Determine if backend returned the old flat object format vs the new scenes array
    let allScenes = [];
    if (data.scenes && Array.isArray(data.scenes) && data.scenes.length > 0) {
      allScenes = data.scenes;
    } else if (data.narration_script) {
      // Fallback: wrap flat single response into a scene format for backward compatibility
      allScenes = [data]; 
    }

    if (allScenes.length > 0) {
      // Assign unique temp IDs to safely update them in background
      allScenes = allScenes.map((s: any, idx: number) => ({ ...s, _tempId: Math.random().toString(36) + idx }));

      const firstScene = allScenes[0];
      
      if (allScenes.length > 1) {
        const queuedScenes = allScenes.slice(1);
        setSceneQueue(queuedScenes);

        // --- BACKGROUND PRE-FETCHING ---
        // Secretly generate the images for the queued frames in the background
        // so they are instantly ready when the user clicks 'Continue'
        queuedScenes.forEach((queuedScene: any) => {
          if (queuedScene.visual_prompt) {
            fetch('/api/director/image', { 
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ visual_prompt: queuedScene.visual_prompt, gameConfig })
            })
            .then(res => res.json())
            .then(imgData => {
                if (imgData.imageUrl) {
                   // Inject the pre-rendered image URL directly into the queue
                   setSceneQueue(currentQueue => 
                      currentQueue.map(s => 
                         s._tempId === queuedScene._tempId 
                           ? { ...s, imageUrl: imgData.imageUrl } 
                           : s
                      )
                   );
                }
            })
            .catch(err => console.error("Prefetch failed:", err));
          }
        });
      } else {
        setSceneQueue([]);
      }
      
      let script = firstScene.narration_script || "";
      const tagMatch = script.match(/\[ALEX_TAG:(\w+)\]/);
      if (tagMatch) {
        script = script.replace(/\[ALEX_TAG:\w+\]/, '').trim();
      }

      const currentSpeaker = firstScene.speaker_name || 'Narrator';

      // Only generate the FIRST image immediately if it didn't come packed. 
      // Synchronize text update waiting for image explicitly
      if (firstScene.imageUrl) {
        setPendingUpdate({
           script, 
           speaker: currentSpeaker, 
           requires_user_action: firstScene.requires_user_action
        });
        setNextImage(firstScene.imageUrl);
      } else {
        applyPendingUpdate({script, speaker: currentSpeaker, requires_user_action: firstScene.requires_user_action});
      }
    } else {
      console.error("No scenes array returned:", data);
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
      
      // Sync the narrative update when image naturally finishes rendering
      if (pendingUpdate) {
         applyPendingUpdate(pendingUpdate);
      } else {
         setIsProcessing(false);
      }
    }
  };

  const handleTextSubmitOverride = async (overrideText: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/director/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAction: overrideText,
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
              disabled={isProcessing || isRecording || sceneQueue.length > 0 || !awaitingInput}
              placeholder="Type your action..."
              className="flex-1 bg-black/60 border border-emerald-500/30 text-white placeholder:text-emerald-500/50 rounded-full px-6 py-4 backdrop-blur-md outline-none focus:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={startRecording}
              disabled={isRecording || isProcessing || sceneQueue.length > 0 || !awaitingInput}
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

          {!awaitingInput && !isProcessing && sceneQueue.length > 0 && (
            <button 
              onClick={playNextScene}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-400 text-white rounded-full font-bold animate-pulse z-50 pointer-events-auto mt-4"
            >
              Continue...
            </button>
          )}

          {!awaitingInput && !isProcessing && sceneQueue.length === 0 && (
            <button 
              onClick={() => handleTextSubmitOverride("[The story continues...]")}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-400 text-white rounded-full font-bold animate-pulse z-50 pointer-events-auto mt-4"
            >
              Continue...
            </button>
          )}

        </div>

        {/* Overlays */}
        {/* Intentionally left blank for future overlays */}

      </div>
    </GameLayout>
  );
}

