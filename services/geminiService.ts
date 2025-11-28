import { GoogleGenAI } from "@google/genai";
import { TacticalDebrief } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTacticalDebrief = async (score: number, wave: number, durationSeconds: number): Promise<TacticalDebrief> => {
  try {
    const prompt = `
      You are a battle-hardened Space Force Commander giving a debrief to a pilot who just finished a simulation.
      
      Performance Data:
      - Score: ${score}
      - Wave Reached: ${wave}
      - Survival Time: ${durationSeconds} seconds.

      Generate a JSON response with the following structure:
      {
        "rank": "A cool sci-fi rank based on score (e.g., Cadet, Ace, Star-Lord)",
        "message": "A 1-2 sentence comment on their performance. Be encouraging but strict if the score is low. Be amazed if high.",
        "tips": ["Tip 1", "Tip 2"] (2 short tactical tips for a scrolling shooter game)
      }
      
      Do not include markdown code blocks. Just the JSON string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return {
      rank: data.rank || "Rookie",
      message: data.message || "Communication disrupted. Systems rebooting.",
      tips: data.tips || ["Keep moving.", "Don't stop shooting."]
    };
  } catch (error) {
    console.error("Gemini debrief failed", error);
    return {
      rank: "Pilot",
      message: "Tactical computer offline. Good effort.",
      tips: ["Dodge the red bullets.", "Aim for the core."]
    };
  }
};