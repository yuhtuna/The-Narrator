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

  // TTS Endpoint using Gemini 2.5 Flash Native Audio
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, speaker } = req.body;
      if (!text) {
        res.status(400).json({ error: "text is required" });
        return;
      }

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not set" });
        return;
      }
      
      apiKey = apiKey.replace(/^["']|["']$/g, '').trim();
      const ai = new GoogleGenAI({ apiKey });

      let voicePrompt = `Please speak the following text. You are a character named ${speaker || 'Unknown'}. Give them a distinct, clear, and expressive voice. Text to speak: "${text}"`;
      
      if (speaker?.toLowerCase() === 'narrator') {
        voicePrompt = `Please speak the following text using the voice of an old 1950s British man. The tone should be calm, authoritative, and slightly weathered. Text to speak: "${text}"`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        contents: voicePrompt,
        config: {
          responseModalities: ["AUDIO"],
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/pcm";

      if (audioBase64) {
        res.json({ audioBase64, mimeType });
      } else {
        throw new Error("No audio data returned from Gemini");
      }
    } catch (error) {
      console.error("TTS Generation Error:", error);
      res.status(500).json({ error: "Failed to generate TTS" });
    }
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

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is not set" });
        return;
      }
      
      // Remove any accidental quotes from the API key
      apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are the Director of a ${genre} visual novel. The global plot is strictly deterministic and full of massive, shocking twists that you control. The User is the Main Character ("You"), but they only control local, immediate actions. Drive the story forward aggressively. End your script by explicitly asking what the user does next AND set requires_user_action to true. IF you are just narrating a sudden plot twist and don't need input yet, set requires_user_action to false.`;

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

      const requiredFields = ["visual_prompt", "narration_script", "speaker_name", "requires_user_action"];
      if (imageBase64) {
        requiredFields.push("item_name", "item_description");
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
              requires_user_action: { type: Type.BOOLEAN },
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
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
          });
          const base64EncodeString = imageResponse.generatedImages[0].image.imageBytes;
          jsonResponse.imageUrl = `data:image/jpeg;base64,${base64EncodeString}`;
        } catch (imageError) {
          console.error("🚨 IMAGE GEN ERROR 🚨:", imageError);
          jsonResponse.imageUrl = undefined;
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
