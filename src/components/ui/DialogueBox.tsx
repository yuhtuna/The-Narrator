import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface DialogueBoxProps {
  speaker?: string;
  text: string;
  isStreaming?: boolean;
}

export function DialogueBox({ speaker, text, isStreaming }: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');

  // Simple typewriter effect simulation
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 30); // Speed of typing

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative w-full max-w-4xl mx-auto z-30 mb-6"
    >
      <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
        {speaker && (
          <h3 className="text-emerald-400 font-mono text-sm uppercase tracking-widest mb-2">
            {speaker}
          </h3>
        )}
        <p className="text-white font-sans text-lg leading-relaxed min-h-[4rem]">
          {displayedText}
          <span className="animate-pulse text-emerald-500">_</span>
        </p>
      </div>
    </motion.div>
  );
}
