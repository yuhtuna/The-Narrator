# Frontend Scaffold (Next.js / React)

This document outlines the high-level component tree for "The Narrator".

## Component Tree

```
App (Root)
├── Layout (Global Styles, Fonts, Context Providers)
│   ├── GameProvider (Manages GameState, AudioContext)
│   └── UIProvider (Manages Modals, Settings)
│
├── Stage (Main Visual Container)
│   ├── BackgroundLayer (The generated Nano Banana image)
│   │   └── ImageTransition (Framer Motion/CSS animations)
│   │
│   ├── CharacterLayer (Overlays for sprites if needed, or integrated into BG)
│   │
│   └── EffectsLayer (Particles, Rain, Veo Video Overlay)
│
├── HUD (Heads-Up Display)
│   ├── TopBar (Chapter Title, Status Indicators)
│   └── InventoryDrawer (Slide-out panel for items)
│
├── NarrativeInterface (The "Visual Novel" UI)
│   ├── DialogueBox (Bottom-anchored text container)
│   │   ├── SpeakerName (Label)
│   │   └── TypewriterText (Streaming text effect)
│   │
│   └── ChoiceOverlay (The "Foldback" Interaction)
│       ├── ChoiceButton (Option A)
│       ├── ChoiceButton (Option B)
│       └── MicInputIndicator (Visualizer for voice input)
│
└── AudioEngine (Invisible Component)
    ├── MusicPlayer (Background loop)
    ├── FoleyPlayer (SFX triggers)
    └── VoicePlayer (Scripter Agent stream)
```

## Key Technologies

-   **State Management**: React Context + `useReducer` (for complex game state).
-   **Animations**: `framer-motion` (for UI entrances) + CSS Keyframes (for "Ken Burns" effect on images).
-   **Styling**: Tailwind CSS.
-   **Icons**: `lucide-react`.
-   **Audio**: Web Audio API (for low-latency Foley).
