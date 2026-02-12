
import { GoogleGenAI, Type } from "@google/genai";
import { INTELLIGENCE_MODEL, INTELLIGENCE_PROMPT } from "../constants";

let genAI: GoogleGenAI | null = null;

const getClient = () => {
  if (!genAI) {
    if (!process.env.API_KEY) {
      console.error("API_KEY not found in environment");
      throw new Error("API Key missing");
    }
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const analyzeTranscript = async (transcriptText: string) => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: INTELLIGENCE_MODEL,
      contents: `TRANSCRIPT:\n${transcriptText}`,
      config: {
        systemInstruction: INTELLIGENCE_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  owner: { type: Type.STRING }
                }
              }
            },
            decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  severity: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    return null;
  }
};

export const chatWithAgent = async (history: string, question: string) => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: INTELLIGENCE_MODEL,
      contents: `Context:\n${history}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: "You are a helpful assistant for a marketing meeting. Answer based on the provided transcript."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the intelligence engine right now.";
  }
};
