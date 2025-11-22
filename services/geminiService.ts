import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ChatMessage } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a face in an image using Gemini Flash Lite for speed or Pro for detail.
 */
export const analyzeFace = async (base64Image: string, usePro: boolean = false): Promise<AnalysisResult> => {
  const modelId = usePro ? 'gemini-3-pro-preview' : 'gemini-2.5-flash-lite';
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      age: { type: Type.STRING, description: "Estimated age or age range" },
      gender: { type: Type.STRING, description: "Estimated gender" },
      expression: { type: Type.STRING, description: "Facial expression/emotion" },
      summary: { type: Type.STRING, description: "A brief personality or mood summary based on visual cues" }
    },
    required: ["age", "gender", "expression", "summary"]
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "Analyze the person in this image. Identify their estimated age, gender, and facial expression. Be concise." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4, // Lower temperature for more consistent classification
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from model");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Generates speech from text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("TTS failed:", error);
    throw error;
  }
};

/**
 * Chat with Thinking Mode and optional Search Grounding.
 */
export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  enableGrounding: boolean
): Promise<{ text: string; groundingUrls: string[] }> => {
  try {
    const modelId = enableGrounding ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    
    // Construct configuration based on mode
    const config: any = {};
    
    if (enableGrounding) {
       config.tools = [{ googleSearch: {} }];
    } else {
       // Thinking mode for Pro model
       config.thinkingConfig = { thinkingBudget: 32768 };
    }

    // Convert internal history to Gemini format
    // Note: We are doing a single turn generation here for simplicity in this demo context,
    // but building the context string manually or using chats.create is better for long convos.
    // For this implementation, we will use generateContent with the last message 
    // but prepending context is better. Let's use chat.sendMessage logic.
    
    const chat = ai.chats.create({
      model: modelId,
      config: config,
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const response = await chat.sendMessage({ message: newMessage });
    
    // Extract grounding URLs if present
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls: string[] = [];
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) urls.push(chunk.web.uri);
      });
    }

    return {
      text: response.text || "I couldn't generate a response.",
      groundingUrls: urls
    };

  } catch (error) {
    console.error("Chat failed:", error);
    throw error;
  }
};

/**
 * Generate Video using Veo.
 * Requires explicit API key selection in UI before calling.
 */
export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  imageBytes?: string
): Promise<string> => {
  // Re-initialize for Veo to ensure selected key is used
  const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = 'veo-3.1-fast-generate-preview';

  try {
    let operation;
    
    if (imageBytes) {
      // Image to Video
      operation = await veoAi.models.generateVideos({
        model: modelId,
        prompt: prompt || "Animate this image",
        image: {
            imageBytes: imageBytes,
            mimeType: 'image/jpeg'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p', // Fast preview supports 720p
          aspectRatio: aspectRatio
        }
      });
    } else {
      // Text to Video
      operation = await veoAi.models.generateVideos({
        model: modelId,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: aspectRatio
        }
      });
    }

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await veoAi.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");
    
    return `${videoUri}&key=${process.env.API_KEY}`;
  } catch (error) {
    console.error("Veo generation failed:", error);
    throw error;
  }
};
