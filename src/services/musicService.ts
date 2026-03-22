import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface MusicComposition {
  bpm: number;
  scale: string;
  mood: string;
  instruments: string[];
  sequence: {
    time: string;
    note: string;
    duration: string;
    velocity: number;
  }[];
  description: string;
}

export async function generateMusicComposition(prompt: string): Promise<MusicComposition> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a short musical composition (4 bars) based on this idea: "${prompt}". 
    Return a JSON object with BPM, scale, mood, instruments (choose from: synth, piano, bass, pad), 
    and a sequence of notes for a lead synth. 
    Notes should be in scientific pitch notation (e.g., C4, E4, G4). 
    Time should be in bars:beats:sixteenths format (e.g., 0:0:0, 0:1:0).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bpm: { type: Type.NUMBER },
          scale: { type: Type.STRING },
          mood: { type: Type.STRING },
          instruments: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          sequence: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                note: { type: Type.STRING },
                duration: { type: Type.STRING },
                velocity: { type: Type.NUMBER }
              },
              required: ["time", "note", "duration"]
            }
          },
          description: { type: Type.STRING }
        },
        required: ["bpm", "scale", "mood", "instruments", "sequence", "description"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as MusicComposition;
  } catch (e) {
    console.error("Failed to parse music composition", e);
    throw new Error("Failed to generate musical structure.");
  }
}
