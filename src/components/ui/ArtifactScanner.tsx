/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, X, Loader2 } from 'lucide-react';
import { processImageForAPI } from '../../utils/imageUtils';

interface ArtifactScannerProps {
  onScan: (base64: string) => void;
  onClose: () => void;
}

/**
 * ArtifactScanner Component
 * Acts as a 'Magical Lens' for the player to scan real-world objects.
 * Features a cinematic, high-fantasy anime aesthetic with glowing emerald accents.
 */
export const ArtifactScanner: React.FC<ArtifactScannerProps> = ({ onScan, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Process the image: resize, compress, and convert to raw Base64
      const base64 = await processImageForAPI(file);
      onScan(base64);
    } catch (error) {
      console.error('Magical Lens Error: Failed to analyze artifact essence.', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerScan = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-2 text-emerald-400/50 hover:text-emerald-400 transition-all duration-300 hover:rotate-90"
        aria-label="Close Magical Lens"
      >
        <X className="w-10 h-10" />
      </button>

      {/* Magical Viewfinder Container */}
      <div className="relative">
        {/* Decorative Corner Ornaments */}
        <div className="absolute -top-6 -left-6 w-16 h-16 border-t-4 border-l-4 border-emerald-400 rounded-tl-3xl drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        <div className="absolute -top-6 -right-6 w-16 h-16 border-t-4 border-r-4 border-emerald-400 rounded-tr-3xl drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        <div className="absolute -bottom-6 -left-6 w-16 h-16 border-b-4 border-l-4 border-emerald-400 rounded-bl-3xl drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        <div className="absolute -bottom-6 -right-6 w-16 h-16 border-b-4 border-r-4 border-emerald-400 rounded-br-3xl drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" />

        {/* Pulsing Viewfinder Frame */}
        <motion.div
          animate={{
            scale: [1, 1.01, 1],
            borderColor: ['rgba(52,211,153,0.3)', 'rgba(52,211,153,0.7)', 'rgba(52,211,153,0.3)'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-80 h-80 md:w-[450px] md:h-[450px] border-2 border-emerald-400/30 rounded-[40px] flex items-center justify-center overflow-hidden relative bg-emerald-950/10 backdrop-blur-sm drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]"
        >
          {/* Scanning Beam Animation */}
          <motion.div
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,1)] z-10"
          />

          {/* Central Status Indicator */}
          <div className="flex flex-col items-center gap-6 text-emerald-400/80">
            {isProcessing ? (
              <div className="relative">
                <Loader2 className="w-20 h-20 animate-spin text-emerald-400" />
                <motion.div 
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 blur-xl bg-emerald-400/30 rounded-full"
                />
              </div>
            ) : (
              <Camera className="w-20 h-20 opacity-30" />
            )}
            <div className="text-center">
              <p className="text-sm tracking-[0.3em] uppercase font-bold mb-1">
                {isProcessing ? 'Deciphering Runes' : 'Artifact Alignment'}
              </p>
              <p className="text-[10px] text-emerald-400/40 tracking-[0.1em] uppercase">
                {isProcessing ? 'Extracting visual essence...' : 'Position object within the lens'}
              </p>
            </div>
          </div>

          {/* HUD Elements */}
          <div className="absolute top-6 left-6 text-[10px] text-emerald-400/30 font-mono">
            LENS_ACTIVE: TRUE<br />
            SCAN_MODE: ARTIFACT
          </div>
          <div className="absolute bottom-6 right-6 text-[10px] text-emerald-400/30 font-mono text-right">
            COORD_X: 42.19<br />
            COORD_Y: 88.04
          </div>
        </motion.div>
      </div>

      {/* Main Action Button */}
      <div className="mt-16 flex flex-col items-center gap-8">
        <button
          onClick={triggerScan}
          disabled={isProcessing}
          className="group relative px-12 py-5 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/40 rounded-2xl transition-all duration-500 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
        >
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-emerald-400/10 group-hover:bg-emerald-400/20 transition-colors" />
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          />
          
          <div className="relative flex items-center gap-4 text-emerald-400 group-hover:text-emerald-300">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-black tracking-[0.2em] uppercase">Scan Object</span>
          </div>
        </button>

        <div className="flex items-center gap-4 opacity-30">
          <div className="h-[1px] w-12 bg-emerald-400" />
          <p className="text-[10px] text-emerald-400 uppercase tracking-[0.4em] font-bold">
            Magical Lens v1.0.4
          </p>
          <div className="h-[1px] w-12 bg-emerald-400" />
        </div>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </motion.div>
  );
};
