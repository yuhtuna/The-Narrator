import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: '10mb' }));

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 2. Stable Director + Banana 2 Image Generation
  app.post("/api/director/process", async (req, res) => {
    try {
      const { userAction, previousContext, gameConfig } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });

      const style = gameConfig?.style || 'Anime';
      const genre = gameConfig?.genre || 'High Fantasy';

      // DETERMINISTIC PLOT PROMPT
      const systemInstruction = `You are the Director of a ${genre} visual novel in a highly stylized ${style} art style. Address the user as "You". 
      Global plot twists are deterministic and controlled by YOU. 
      You MUST output a 'scenes' array. For a single turn, generate a sequence of 2-3 cinematic scenes. 
      Only the very last scene in that array should ever have requires_user_action: true. 
      All previous scenes in that batch must be false.
      
      CRITICAL ART RULE: Every visual_prompt you output MUST explicitly mention "in a pure ${style} art style" of a ${genre} setting. If the style is 'Realistic', you must enforce "cinematic photography, ultra-realistic, photorealistic, 8k resolution".
      
      CRITICAL PACING RULE: The entire game is a micro-short story. It MUST conclude after exactly 2 user interactions (which equals about 6 to 7 scenes TOTAL). 
      Escalate the plot immediately toward a climax. On the final turn, conclude the story with a definitive ending. When the story ends, set requires_user_action to false for ALL scenes to permanently lock the game and end the experience.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // STABLE (NO 429s)
        contents: [{ parts: [{ text: `Context: ${previousContext}\nAction: ${userAction}` }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    visual_prompt: { type: Type.STRING },
                    narration_script: { type: Type.STRING },
                    speaker_name: { type: Type.STRING },
                    requires_user_action: { type: Type.BOOLEAN } // NEW PLOT MECHANIC
                  },
                  required: ["visual_prompt", "narration_script", "speaker_name", "requires_user_action"]
                }
              }
            },
            required: ["scenes"],
          },
        },
      });

      const jsonResponse = JSON.parse(response.text);

      // IMAGE GENERATION (Only generated the first frame initially to prevent blocking the UI)
      if (jsonResponse.scenes && Array.isArray(jsonResponse.scenes) && jsonResponse.scenes.length > 0) {
        const firstScene = jsonResponse.scenes[0];
        if (firstScene.visual_prompt) {
          let firstPrompt = firstScene.visual_prompt;
          const lowerStyle = style.toLowerCase();
          if (lowerStyle === 'realistic') {
              firstPrompt += `, cinematic photography, ultra-realistic, highly detailed, photorealistic, 8k resolution, realistic textures, volumetric lighting.`;
          } else if (lowerStyle === 'pixel') {
              firstPrompt += `, strict 16-bit pixel art, retro video game style, pixelated, low resolution, 2D flat, absolutely NO photorealism, NO 3D.`;
          } else {
              firstPrompt += `, entirely in a pure 2D ${style} art style, flat colors, 2D illustration, absolutely NO photorealism, NO 3D.`;
          }

          try {
            const imageRes = await ai.models.generateContent({
              model: "gemini-3.1-flash-image-preview",
              contents: firstPrompt,
              config: { responseModalities: ["IMAGE"] }
            });
            const base64 = imageRes.candidates[0].content.parts[0].inlineData.data;
            firstScene.imageUrl = `data:image/jpeg;base64,${base64}`;
          } catch (e) {
            firstScene.imageUrl = undefined; // Prevents UI freeze
          }
        }
      }
      res.json(jsonResponse);
    } catch (error) {
      res.status(500).json({ error: "Director Failed" });
    }
  });

  // Dedicated Route for Generating Iterative Frame Images
  app.post("/api/director/image", async (req, res) => {
    try {
      const { visual_prompt, gameConfig } = req.body;
      if (!visual_prompt) return res.status(400).json({ error: "No prompt provided" });

      const style = gameConfig?.style || 'Anime';

      // Enforce the style strongly at the image generation boundary if AI forgets
      let finalPrompt = visual_prompt;
      const lowerStyle = style.toLowerCase();
      if (lowerStyle === 'realistic') {
          finalPrompt += `, cinematic photography, ultra-realistic, highly detailed, photorealistic, 8k resolution, realistic textures, volumetric lighting.`;
      } else if (lowerStyle === 'pixel') {
          finalPrompt += `, strict 16-bit pixel art, retro video game style, pixelated, low resolution, 2D flat, absolutely NO photorealism, NO 3D.`;
      } else {
          finalPrompt += `, entirely in a pure 2D ${style} art style, flat colors, 2D illustration, absolutely NO photorealism, NO 3D.`;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
      const imageRes = await ai.models.generateContent({
         model: "gemini-3.1-flash-image-preview",
         contents: finalPrompt,
         config: { responseModalities: ["IMAGE"] }
      });
      const base64 = imageRes.candidates[0].content.parts[0].inlineData.data;
      res.json({ imageUrl: `data:image/jpeg;base64,${base64}` });
    } catch (error) {
      console.error("Single Image Failed:", error);
      res.json({ imageUrl: undefined });
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
