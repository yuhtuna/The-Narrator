<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Narrator 🎙️✨

An immersive, AI-driven visual novel that dynamically generates story, art, and voice lines in real-time based on your vocal or text commands. Choose your genre, pick your art style, and step into a world built entirely around your choices.

## 🌟 Features

* **Real-time Scene Generation:** A 7-frame micro-story tightly paced and structured around user interactions (Frames 2 and 5).
* **Dynamic Art Styles:** Select between **Anime**, **Pixel Art**, or **Realistic** modes. The engine enforces aggressive prompt-engineering so 16-bit looks like 16-bit, and Realistic looks like cinematic photography.
* **Audio Interactivity:** Native browser Text-to-Speech narration paired with microphone input capabilities to "speak" your action directly to the AI.
* **Background Pre-fetching:** Smart asynchronous image queueing so the visuals load instantly the moment you click "Continue".
* **Immersive UI:** A beautiful dark-fantasy inspired frontend powered by React, Tailwind CSS, and Framer Motion.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Tailwind CSS, Vite
* **Backend:** Node.js, Express
* **AI Models (Google Gemini):**
  * `gemini-2.5-flash` - The "Director" generating the JSON narrative batching.
  * `gemini-3.1-flash-image-preview` - The "Artist" generating on-demand 2D and 3D visual frames.
* **Audio:** Web Speech Synthesis API

## 🚀 Run Locally

**Prerequisites:**  Node.js (v18+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Play!**
   Open `http://localhost:3000` in your browser. Select your style and genre, and let the Narrator begin.

## 🧪 Reproducible Testing

To verify the strict 7-frame narrative architecture and pre-fetch engine:

1. **Start a New Game:** Select any Genre and Art Style from the dashboard.
2. **First Turn (Frames 1-2):** Observe the initial scene. Click "Continue...". You should immediately hit Frame 2 and be prompted for your first user input.
3. **First Action:** Type or speak an action (e.g., *"I draw my sword and enter the cave"*). 
4. **Second Turn (Frames 3-5):** Click "Continue..." through Frames 3 and 4. Notice the zero-latency image loads due to the background pre-fetching. Frame 5 will prompt you for your final input.
5. **Final Action:** Provide a climactic action (e.g., *"I attack the dragon!"*).
6. **Final Turn (Frames 6-7):** Click through the climax (Frame 6) to the definitive resolution (Frame 7).
7. **The End:** Click "Continue..." one last time. The "THE END" overlay should trigger, permanently locking the game state. Click anywhere on the black screen to reset to the dashboard.

---
*Created as part of an exploration into Google GenAI integration and zero-latency batch processing architectures.*
