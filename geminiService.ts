
import { GoogleGenAI } from "@google/genai";

// Always use the process.env.API_KEY directly in the constructor.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRaceDebrief = async (score: number, distance: number, carName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Emerald Age Racing Announcer. Briefly (under 50 words) provide a high-octane, neon-drenched summary of a race where the driver using '${carName}' scored ${score} points over ${Math.floor(distance)} meters. Use words like 'hyper-drive', 'crystalline', and 'emerald-glow'.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Debrief failed:", error);
    return "The neon fades, but the legend of your drive remains etched in the asphalt.";
  }
};
