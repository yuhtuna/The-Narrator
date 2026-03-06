import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, DirectorResponse } from '../../types/director';

// Initial State
const initialState: GameState = {
  chapter: 1,
  sceneId: 'intro',
  plotFlags: {},
  variables: {},
  inventory: [],
  characters: {},
  history: [],
};

// Actions
type Action =
  | { type: 'UPDATE_STATE'; payload: Partial<GameState> }
  | { type: 'ADD_INVENTORY'; payload: any } // Replace 'any' with InventoryItem
  | { type: 'SET_SCENE'; payload: string };

// Reducer
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    case 'ADD_INVENTORY':
      return { ...state, inventory: [...state.inventory, action.payload] };
    case 'SET_SCENE':
      return { ...state, sceneId: action.payload };
    default:
      return state;
  }
}

// Context
const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
