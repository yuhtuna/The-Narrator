import React from 'react';
import { motion } from 'motion/react';
import { InventoryItem } from '../../types/director';
import { Backpack, X } from 'lucide-react';

interface InventoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export function InventoryDrawer({ isOpen, onClose, items }: InventoryDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        />
      )}

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-white/10 shadow-2xl z-50 p-6"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-white font-mono text-xl uppercase tracking-widest flex items-center gap-2">
            <Backpack className="w-5 h-5 text-emerald-500" />
            Inventory
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-gray-500 font-mono text-sm text-center mt-20">
            No items collected yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-black/40 border border-white/5 p-4 rounded-lg flex items-center gap-4 hover:border-emerald-500/30 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center text-2xl">
                  {/* Placeholder for icon */}
                  📦
                </div>
                <div>
                  <h4 className="text-white font-medium">{item.name}</h4>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
