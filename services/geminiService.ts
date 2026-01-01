import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction for the recipe generator
const RECIPE_SYSTEM_INSTRUCTION = `
Du er en ekspertkokk. Din jobb er å lage deilige, enkle oppskrifter basert på brukerens forespørsel på Norsk.
Returner alltid svaret i strukturert JSON-format.
Inkluder en kort, fristende beskrivelse, en liste over ingredienser med mengder, og steg-for-steg instruksjoner.
`;

export const generateRecipeData = async (prompt: string): Promise<Omit<Recipe, 'id' | 'imageUrl'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Lag en oppskrift basert på følgende: ${prompt}`,
      config: {
        systemInstruction: RECIPE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Navnet på retten" },
            description: { type: Type.STRING, description: "En kort, fristende beskrivelse (max 30 ord)" },
            prepTime: { type: Type.STRING, description: "Total tid (f.eks. '30 minutter')" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING, description: "Navn på ingrediens" },
                  amount: { type: Type.STRING, description: "Mengde (f.eks. '200g', '1 stk')" }
                },
                required: ["item", "amount"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Steg for steg instruksjoner"
            }
          },
          required: ["title", "description", "prepTime", "ingredients", "instructions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Ingen data mottatt fra AI.");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Feil ved generering av oppskrift:", error);
    throw error;
  }
};

export const generateRecipeImage = async (recipeTitle: string, description: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Professional food photography of ${recipeTitle}. ${description}. High resolution, appetizing, studio lighting, top down view or 45 degree angle.`
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9", 
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (error) {
    console.error("Feil ved generering av bilde:", error);
    // Vi returnerer undefined slik at UI kan vise en placeholder eller feilmelding uten å crashe hele flyten
    return undefined;
  }
};
