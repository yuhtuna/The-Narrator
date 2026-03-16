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

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not set" });
        return;
      }
      
      // Remove any accidental quotes from the API key
      apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
You are the Director of "The Narrator", a real-time interactive visual novel.
Theme: You are constructing a deep, emotionally resonant, and dynamic storyline based on the chosen genre.
Protagonist Constraints: If an image is provided, YOU MUST ANALYZE IT. The primary subject of that image is the Main Character. Their name is ${customName || "a fitting fantasy name"}. Describe them adapting to the requested Visual Style (${style}). If NO image is provided, the Main Character is Alex, a 20-year-old adventurer.
Visual Style: ${style}.
Narrative Tone: ${genre}. 

You are both the Narrator and the voice of the world's inhabitants. The protagonist is ${customName || "Alex"}. The world should feel alive, deeply immersive, and full of complex consequences, character developments, and environmental storytelling.

Your task:
1. Analyze the User's Action and the Previous Context.
2. Determine the immediate narrative consequence, ensuring it pushes the story forward in a meaningful or dramatic way based on the ${genre} tone.
3. Generate a highly detailed, breathtaking visual prompt for an image generation model. Include elements of mood, exact cinematic lighting, character expressions, intricate backgrounds, and dynamic compositions.
4. Generate a punchy, emotionally gripping narration script or character dialogue (1-3 sentences).
5. If an image is provided, identify the object and transform it into an important story artifact, companion, or obstacle fitting the genre.
6. If audio is provided, carefully transcribe the user's spoken intent and use it as their action for the current turn.
7. Determine who is speaking the script. Output their name in the speaker_name field (e.g., "Narrator", "${customName || "Alex"}", "A mysterious stranger", etc.).

Constraints:
- Visual Prompt: Detailed, masterpiece, trending on artstation, ${style} style, high contrast, vivid and immersive atmosphere. Every visual_prompt MUST prominently feature the active subjects and mood.
- Narration: Make it captivating. If speaking as the Narrator, use second-person ("You..."); if speaking as a character, use first-person speech.
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

      const requiredFields = ["visual_prompt", "narration_script", "speaker_name"];
      if (imageBase64) {
        requiredFields.push("item_name", "item_description");
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visual_prompt: { type: Type.STRING },
              narration_script: { type: Type.STRING },
              speaker_name: { type: Type.STRING },
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
          const imageResponse = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: jsonResponse.visual_prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9'
            },
          });

          if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
            const base64EncodeString = imageResponse.generatedImages[0].image.imageBytes;
            jsonResponse.imageUrl = `data:image/jpeg;base64,${base64EncodeString}`;
          } else {
            throw new Error("No image data in response");
          }
        } catch (imageError) {
          console.error("Gemini Imagen Error:", imageError);
          // Fallback if image generation fails (maybe to a public style folder image?)
          // But since we are dynamic, returning null lets the frontend keep the current image
          // or we provide a dramatic fallback from local public if needed
          jsonResponse.imageUrl = null; // Let the frontend keep the current scene
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
