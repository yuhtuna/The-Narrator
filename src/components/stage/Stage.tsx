import React from 'react';
import { motion } from 'motion/react';

interface StageProps {
  imageUrl?: string;
  videoUrl?: string; // For Veo cutscenes
  isTransitioning?: boolean;
}

export function Stage({ imageUrl, videoUrl, isTransitioning }: StageProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image Layer (Nano Banana) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: isTransitioning ? 1.05 : 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full"
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Scene Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
      </motion.div>

      {/* Video Overlay Layer (Veo) */}
      {videoUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10"
        >
          <video
            src={videoUrl}
            autoPlay
            muted
            loop={false} // Cutscenes play once
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Vignette / Atmosphere Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-20" />
    </div>
  );
}
