/**
 * The Director's Notebook
 * This schema defines the state managed by the Director Agent (Gemini Flash)
 * and the payload sent to the frontend.
 */

export interface GameState {
  // The core story spine position
  chapter: number;
  sceneId: string;
  
  // Foldback narrative tracking
  plotFlags: Record<string, boolean>;
  variables: Record<string, string | number>;
  
  // Inventory system
  inventory: InventoryItem[];
  
  // Character relationships/status
  characters: Record<string, CharacterState>;
  
  // History for context window management
  history: ActionHistory[];
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon?: string; // URL or lucide icon name
}

export interface CharacterState {
  name: string;
  affinity: number; // 0-100
  status: 'active' | 'missing' | 'deceased' | 'unknown';
  location: string;
}

export interface ActionHistory {
  timestamp: number;
  action: string; // User input or system event
  result: string; // Narrative outcome
}

/**
 * The Payload returned to the Frontend (Next.js/React)
 * This drives the UI, Media, and Scripter agents.
 */
export interface DirectorResponse {
  // Narrative Content
  narrative: {
    text: string; // The main story text (streamed or static)
    speaker?: string; // 'Narrator' or Character Name
    voiceId?: string; // For TTS
  };

  // Visuals (Filmmaker Agent)
  visuals: {
    prompt: string; // The prompt sent to Nano Banana
    imageUrl?: string; // The generated image URL (if pre-generated)
    animation?: 'pan' | 'zoom' | 'shake' | 'static'; // CSS transition
    cutscene?: string; // URL to Veo video (rare)
  };

  // Audio (Foley/Music)
  audio: {
    backgroundTrack?: string; // 'tension', 'calm', etc.
    sfx?: string[]; // ['door_slam', 'rain']
  };

  // Interaction (Foldback Choices)
  choices: Choice[];

  // State Updates (for UI sync)
  gameStateUpdate?: Partial<GameState>;
}

export interface Choice {
  id: string;
  text: string;
  type: 'dialogue' | 'action' | 'investigate';
  requiredFlag?: string; // Only show if flag is true
}
