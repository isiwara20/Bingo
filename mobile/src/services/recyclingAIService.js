/**
 * BinGo – Gemini AI Service (Member 3 – Feature 4)
 * API key stored in src/config/keys.js (gitignored)
 */

import { GEMINI_API_KEY } from "../config/keys";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent";

const geminiHeaders = {
  "Content-Type": "application/json",
  "x-goog-api-key": GEMINI_API_KEY,
};

/**
 * Analyse a waste item from a base64 image.
 * Returns structured result with category, bin, confidence, disposal steps.
 */
export const analyseWasteImage = async (base64Image, mimeType = "image/jpeg") => {
  const prompt = `You are a waste classification assistant. Look at this image and identify what waste item it shows.

You MUST respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after the JSON.

Required JSON format:
{"itemName":"name of item","category":"Plastic","binColour":"Blue","binLabel":"Blue Recycling Bin","confidence":"High","isRecyclable":true,"disposalSteps":["Rinse clean","Remove cap","Place in blue bin"],"tips":"Rinse before recycling","warning":""}

Categories to use: Plastic, Glass, Paper, Metal, Organic, E-Waste, Hazardous, General Waste
Bin colours: Blue (recycling), Green (organic), Grey (general), Red (hazardous), Special (e-waste)
Confidence: High, Medium, or Low

Respond with JSON only:`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: geminiHeaders,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from AI");

  // Parse JSON from response — extract object even if surrounded by text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback — Gemini returned plain text, create a generic response
    return {
      itemName: "Unknown Item",
      category: "General Waste",
      binColour: "Grey",
      binLabel: "Grey General Waste Bin",
      confidence: "Low",
      isRecyclable: false,
      disposalSteps: ["Place in your general waste bin"],
      tips: "When in doubt, check your local council guidelines.",
      warning: "Could not identify item clearly. Please try a clearer photo or use text search.",
    };
  }
  return JSON.parse(jsonMatch[0]);
};

/**
 * Analyse a waste item by text description (no image needed).
 */
export const analyseWasteText = async (itemDescription) => {
  const prompt = `You are a waste sorting assistant. The user has this item: "${itemDescription}"

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "itemName": "${itemDescription}",
  "category": "one of: Plastic, Glass, Paper, Metal, Organic, E-Waste, Hazardous, General Waste",
  "binColour": "Blue, Green, Grey, Red, or Special",
  "binLabel": "e.g. Blue Recycling Bin",
  "confidence": "High, Medium, or Low",
  "isRecyclable": true or false,
  "disposalSteps": ["step 1", "step 2", "step 3"],
  "tips": "one useful tip about this item",
  "warning": "any special warning, or empty string"
}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
  };

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: geminiHeaders,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Gemini API error");
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from AI");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");
  return JSON.parse(jsonMatch[0]);
};
