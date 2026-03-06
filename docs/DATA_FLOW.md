# Data Flow Sequence Diagram

This sequence diagram illustrates the real-time loop of "The Narrator".

## Actors
- **User**: The player (Voice/Text input).
- **Frontend**: Next.js/React UI (State, Audio, Transitions).
- **Orchestrator**: Cloud Run/Express Server.
- **Director**: Gemini Flash (Logic/State).
- **Scripter**: Gemini Live (Voice/Text Generation).
- **Filmmaker**: Nano Banana (Image Generation).
- **Effects**: Veo (Video Generation - Rare).

## Sequence

1.  **User Input**
    - User speaks into microphone.
    - Frontend captures audio blob.
    - Frontend sends audio/text to Orchestrator (`POST /api/director/process`).

2.  **Orchestration & Logic (Director)**
    - Orchestrator receives input.
    - Orchestrator calls **Director Agent** (Gemini Flash) with current `GameState` + User Input.
    - Director analyzes intent, updates `Director's Notebook` (State), and determines next narrative beat.
    - Director returns `DirectorResponse` payload (Narrative, Visual Prompts, Audio Cues).

3.  **Parallel Generation (Scripter & Filmmaker)**
    - Orchestrator parses `DirectorResponse`.
    - **Parallel Task A (Visuals)**:
        - Orchestrator calls **Filmmaker Agent** (Nano Banana) with `visuals.prompt`.
        - Filmmaker generates 512px image.
        - Returns Image URL.
    - **Parallel Task B (Audio/Text)**:
        - Orchestrator calls **Scripter Agent** (Gemini Live/TTS) with `narrative.text`.
        - Scripter generates audio stream/buffer.
        - Returns Audio URL/Buffer.

4.  **Frontend Update**
    - Orchestrator aggregates results (Image URL, Audio URL, Updated State).
    - Orchestrator sends JSON response to Frontend.

5.  **Client-Side Rendering**
    - Frontend receives response.
    - **Visuals**: Preloads image, applies CSS transition (e.g., cross-fade, pan).
    - **Audio**: Plays Scripter's voice track + Local Foley MP3s (based on `audio.sfx`).
    - **UI**: Updates Inventory/Status HUD.
    - **Text**: Streams text to `DialogueOverlay`.

6.  **Loop**
    - System waits for next User Input.
