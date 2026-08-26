import dotenv from "dotenv";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

// Load the root .env file
dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Check the root .env file.",
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

const MODEL = "gemini-2.5-flash";

export async function askGemini(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 1500,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      console.error("Gemini returned no text:", response);
      throw new Error("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}