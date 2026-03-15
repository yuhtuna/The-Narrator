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

  // Director Agent Endpoint
  app.post("/api/director/process", async (req, res) => {
    try {
      const { userAction, previousContext, imageBase64, audioBase64, gameConfig } = req.body;

      if (!userAction) {
        res.status(400).json({ error: "userAction is required" });
        return;
      }

      const style = gameConfig?.style || 'Anime';
      const genre = gameConfig?.genre || 'High Fantasy';
      const customName = gameConfig?.customName;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not set" });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
You are the Director of "The Narrator", a real-time interactive visual novel.
Theme: High Fantasy Anime.
Protagonist Constraints: If an image is provided, YOU MUST ANALYZE IT. The primary subject of that image is the Main Character. Their name is ${customName || "a fitting fantasy name"}. Describe them adapting to the requested Visual Style (${style}). If NO image is provided, the Main Character is Alex, a 20-year-old adventurer.
Visual Style: ${style}.
Narrative Tone: ${genre}.

Your task:
1. Analyze the User's Action and the Previous Context.
2. Determine the immediate narrative consequence.
3. Generate a highly detailed visual prompt for an image generation model (Nano Banana) that captures the new scene.
4. Generate a punchy, 1-2 sentence narration script for the voice actor.
5. If an image is provided, identify the object and transform it into a magical relic or companion fitting the genre. End every narrative beat with 2-3 choices for the player's next move.
6. If audio is provided, carefully transcribe the user's spoken intent and use it as their action for the current turn.

Constraints:
- Visual Prompt: Detailed, cinematic lighting, ${style} style, high contrast. Every visual_prompt MUST feature this protagonist prominently, rendered strictly in the ${style} art style.
- Narration: Second-person ("You..."), directly addressing the user as this protagonist, fitting the ${genre} tone.
- Output: Strict JSON.
`;

      const promptText = `
Previous Context: ${previousContext || "The story begins."}
User Action: ${userAction}
`;

      const parts: any[] = [{ text: promptText }];
      if (imageBase64) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        });
      }
      if (audioBase64) {
        parts.push({
          inlineData: {
            data: audioBase64,
            mimeType: "audio/webm",
          },
        });
      }

      const requiredFields = ["visual_prompt", "narration_script", "choices"];
      if (imageBase64) {
        requiredFields.push("item_name", "item_description");
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visual_prompt: { type: Type.STRING },
              narration_script: { type: Type.STRING },
              choices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              item_name: { type: Type.STRING },
              item_description: { type: Type.STRING },
            },
            required: requiredFields,
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text from Gemini");
      }

      const jsonResponse = JSON.parse(responseText);

      if (jsonResponse.visual_prompt) {
        try {
          const imageResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
              parts: [
                {
                  text: jsonResponse.visual_prompt,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "16:9",
                imageSize: "1K"
              }
            }
          });

          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64EncodeString = part.inlineData.data;
              jsonResponse.imageUrl = `data:image/jpeg;base64,${base64EncodeString}`;
              break;
            }
          }
        } catch (imageError) {
          console.error("Image generation error:", imageError);
          // Fallback if image generation fails
          jsonResponse.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(jsonResponse.visual_prompt)}/1920/1080`;
        }
      }

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
