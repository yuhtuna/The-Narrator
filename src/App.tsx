/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameLayout } from './components/layout/GameLayout';
import { DialogueBox } from './components/ui/DialogueBox';
import { ChoiceOverlay } from './components/ui/ChoiceOverlay';
import { InventoryDrawer } from './components/ui/InventoryDrawer';
import { Backpack } from 'lucide-react';

// Mock API function to simulate backend latency
const mockDirectorApi = async (action: string) => {
  return new Promise<{ imageUrl: string; text: string }>((resolve) => {
    setTimeout(() => {
      // Return a random image to demonstrate the transition
      const randomId = Math.floor(Math.random() * 1000);
      resolve({
        imageUrl: `https://picsum.photos/seed/${randomId}/1920/1080`,
        text: `You chose to "${action}". The scene shifts as the consequences of your action unfold. The neon lights flicker in response.`
      });
    }, 2000); // 2 second simulated delay
  });
};

export default function App() {
  // State Machine
  const [currentImage, setCurrentImage] = useState("https://picsum.photos/seed/cyberpunk/1920/1080");
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Narrative State
  const [narrative, setNarrative] = useState("The neon rain slicks the pavement. A contact is waiting in the shadows.");
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  // Mock Choices
  const choices = [
    { id: "1", text: "Approach the contact.", type: "action" as const },
    { id: "2", text: "Scan the area.", type: "investigate" as const },
    { id: "3", text: "Hack the terminal.", type: "action" as const }
  ];

  const handleAction = async (choiceId: string) => {
    if (isProcessing) return;

    // State 2: Processing (Time Freeze)
    // Instantly apply grayscale via state change
    setIsProcessing(true);
    
    // Find the text of the choice for the mock API
    const choice = choices.find(c => c.id === choiceId);
    const actionText = choice?.text || "Unknown action";

    try {
      // Call Mock API
      const response = await mockDirectorApi(actionText);
      
      // Start the "Hidden Cache" phase
      // We do NOT swap the image yet. We set nextImage to trigger the hidden <img> render.
      setNextImage(response.imageUrl);
      setNarrative(response.text);
    } catch (error) {
      console.error("API Error", error);
      setIsProcessing(false);
    }
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

        {/* HUD */}
        <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={() => setIsInventoryOpen(true)}
            className="p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full hover:bg-emerald-500/20 transition-colors"
          >
            <Backpack className="w-6 h-6 text-emerald-400" />
          </button>
        </div>

        {/* Narrative Interface */}
        <DialogueBox 
          speaker="Narrator"
          text={narrative} 
          isStreaming={!isProcessing} 
        />

        {/* Choices - Hide during processing to prevent double-clicks and enhance "Freeze" effect */}
        {!isProcessing && (
          <ChoiceOverlay 
            choices={choices} 
            onSelect={handleAction}
            isListening={false}
          />
        )}

        {/* Inventory */}
        <InventoryDrawer 
          isOpen={isInventoryOpen} 
          onClose={() => setIsInventoryOpen(false)} 
          items={[
            { id: '1', name: 'Encrypted Drive', description: 'Contains the stolen schematics.', icon: 'usb' }
          ]} 
        />

      </div>
    </GameLayout>
  );
}
