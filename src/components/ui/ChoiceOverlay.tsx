import React from 'react';
import { motion } from 'motion/react';
import { Choice } from '../../types/director';
import { Mic } from 'lucide-react';

interface ChoiceOverlayProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  isListening?: boolean;
}

export function ChoiceOverlay({ choices, onSelect, isListening }: ChoiceOverlayProps) {
  if (choices.length === 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
      <div className="flex flex-col gap-4 w-full max-w-md pointer-events-auto">
        {choices.map((choice, index) => (
          <motion.button
            key={choice.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(choice.id)}
            className="group relative bg-black/60 hover:bg-emerald-900/40 backdrop-blur-sm border border-white/20 hover:border-emerald-500/50 text-left px-6 py-4 rounded-lg transition-all duration-300"
          >
            <span className="text-emerald-400 font-mono text-xs mr-3 opacity-50 group-hover:opacity-100">
              {index + 1}
            </span>
            <span className="text-white font-sans font-medium text-lg group-hover:text-emerald-100">
              {choice.text}
            </span>
          </motion.button>
        ))}

        {/* Voice Input Indicator */}
        <div className="mt-8 flex justify-center">
          <div className={`p-4 rounded-full border ${isListening ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-black/40 border-white/10'}`}>
            <Mic className={`w-6 h-6 ${isListening ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
