import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Director Agent Endpoint
  app.post("/api/director/process", async (req, res) => {
    try {
      const { userAction, previousContext } = req.body;

      if (!userAction) {
        res.status(400).json({ error: "userAction is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not set" });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
You are the Director of "The Narrator", a real-time interactive visual novel.
Theme: 90s Anime Cyberpunk.
Protagonist: Max, a gritty detective with a glowing cybernetic eye.
Setting: Neo-Veridia, a rain-slicked dystopian megacity.

Your task:
1. Analyze the User's Action and the Previous Context.
2. Determine the immediate narrative consequence.
3. Generate a highly detailed visual prompt for an image generation model (Nano Banana) that captures the new scene.
4. Generate a punchy, 1-2 sentence narration script for the voice actor.

Constraints:
- Visual Prompt: Detailed, cinematic lighting, 90s anime style, high contrast.
- Narration: Noir style, second-person ("You..."), gritty.
- Output: Strict JSON.
`;

      const prompt = `
Previous Context: ${previousContext || "The story begins."}
User Action: ${userAction}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visual_prompt: { type: Type.STRING },
              narration_script: { type: Type.STRING },
            },
            required: ["visual_prompt", "narration_script"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text from Gemini");
      }

      const jsonResponse = JSON.parse(responseText);
      res.json(jsonResponse);

    } catch (error) {
      console.error("Director Agent Error:", error);
      res.status(500).json({ error: "Failed to process director request" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
