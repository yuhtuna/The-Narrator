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

      const systemInstruction = `You are the elite Director of a real-time ${genre} visual novel in a ${style} art style. The User is the Main Character. Address them strictly as "You". NEVER use the name "Alex" or invent a name for them. >    Starting Anchor: If this is the very first turn of the game, ALWAYS start the scene with the user finishing a drink at a local establishment (e.g., a fantasy tavern, a cyberpunk noodle bar, or a modern cafe depending on the ${genre}) and stepping outside to discover something unexpected.
Keep the narration_script punchy and atmospheric (2-4 sentences max). Determine who is speaking and output their name in speaker_name. Output a highly descriptive visual_prompt for the background art.`;

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
      console.log("🎨 Attempting to generate image with Gemini 3.1 Flash Image...");
      try {
        // MUST use generateContent for Gemini models, NOT generateImages
        const imageResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: jsonResponse.visual_prompt,
          config: {
            responseModalities: ["IMAGE"]
          }
        });
        
        console.log("✅ Image generation SUCCESS!");
        const base64EncodeString = imageResponse.candidates[0].content.parts[0].inlineData.data;
        jsonResponse.imageUrl = `data:image/jpeg;base64,${base64EncodeString}`;
        
      } catch (imageError) {
        console.error("🚨 IMAGE GEN ERROR 🚨:", imageError);
        jsonResponse.imageUrl = undefined; // Prevents the frontend from freezing
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
