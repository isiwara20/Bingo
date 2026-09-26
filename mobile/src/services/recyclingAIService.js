/**
 * BinGo – Gemini AI Service (Member 3 – Feature 4)
 * API keys stored in src/config/keys.js (gitignored)
 * Implements automatic fallback when one key hits rate limits
 */

import { GEMINI_API_KEYS } from "../config/keys";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent";

// Track current key index and rate-limited keys
let currentKeyIndex = 0;
const rateLimitedKeys = new Map(); // Use Map to store key -> timestamp
const rateLimitCooldown = 60000; // 1 minute cooldown for rate-limited keys

/**
 * Get the next available API key that isn't rate-limited
 */
const getNextAvailableKey = () => {
  // Check if any rate-limited keys can be restored
  const now = Date.now();
  rateLimitedKeys.forEach((timestamp, key) => {
    if (now - timestamp > rateLimitCooldown) {
      rateLimitedKeys.delete(key);
    }
  });

  // Find next available key
  let attempts = 0;
  while (attempts < GEMINI_API_KEYS.length) {
    const key = GEMINI_API_KEYS[currentKeyIndex];
    
    if (!rateLimitedKeys.has(key)) {
      return key;
    }
    
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
    attempts++;
  }
  
  // All keys rate-limited, return the first one anyway
  return GEMINI_API_KEYS[0];
};

/**
 * Mark a key as rate-limited
 */
const markKeyRateLimited = (key) => {
  rateLimitedKeys.set(key, Date.now());
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
};

/**
 * Check if error is a rate limit error
 */
const isRateLimitError = (error) => {
  const errorMsg = error?.message?.toLowerCase() || '';
  return errorMsg.includes('quota') || 
         errorMsg.includes('rate limit') || 
         errorMsg.includes('429') ||
         errorMsg.includes('resource exhausted');
};

/**
 * Make API call with automatic key fallback
 */
const callGeminiAPI = async (body) => {
  let lastError;
  
  for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
    const apiKey = getNextAvailableKey();
    
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    };
    
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        const error = new Error(err?.error?.message || "Gemini API error");
        
        // If rate limit error, mark this key and try next
        if (isRateLimitError(error) || response.status === 429) {
          markKeyRateLimited(apiKey);
          lastError = error;
          continue;
        }
        
        throw error;
      }

      return await response.json();
      
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) {
        markKeyRateLimited(apiKey);
        continue;
      }
      throw error;
    }
  }
  
  throw lastError || new Error("All API keys are rate-limited or failed");
};

/**
 * Analyse a waste item from a base64 image.
 * Returns structured result with category, bin, confidence, disposal steps.
 */
export const analyseWasteImage = async (base64Image, mimeType = "image/jpeg") => {
  const prompt = `You are an expert waste classification and environmental education assistant. Look at this image and identify what waste item it shows.

You MUST respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after the JSON.

Required JSON format:
{
  "itemName":"name of item",
  "category":"Plastic",
  "binColour":"Blue",
  "binLabel":"Blue Recycling Bin",
  "confidence":"High",
  "isRecyclable":true,
  "disposalSteps":["Rinse clean","Remove cap","Place in blue bin"],
  "tips":"Rinse before recycling",
  "warning":"",
  "environmentalImpact":"Detailed explanation of environmental impact if not recycled properly",
  "decompositionTime":"How long it takes to decompose in landfill",
  "materialComposition":"What materials the item is made of",
  "recyclingProcess":"Brief explanation of how this item is recycled",
  "commonMistakes":["Common disposal mistakes to avoid"],
  "alternativeDisposal":["Alternative eco-friendly disposal methods"],
  "upcyclingIdeas":["Creative ways to reuse or upcycle this item"],
  "relatedItems":["Similar items that should be disposed the same way"],
  "localGuidelines":"General local recycling guidelines for this item type",
  "whyThisBin":"Detailed explanation of why this item goes in this specific bin"
}

Categories to use: Plastic, Glass, Paper, Metal, Organic, E-Waste, Hazardous, General Waste
Bin colours: Blue (recycling), Green (organic), Grey (general), Red (hazardous), Special (e-waste)
Confidence: High, Medium, or Low

Provide comprehensive, educational information to help users understand proper waste management.

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
      maxOutputTokens: 2048,
    },
  };

  const data = await callGeminiAPI(body);
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
  const prompt = `You are an expert waste classification and environmental education assistant. The user has this item: "${itemDescription}"

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
  "warning": "any special warning, or empty string",
  "environmentalImpact":"Detailed explanation of environmental impact if not recycled properly",
  "decompositionTime":"How long it takes to decompose in landfill",
  "materialComposition":"What materials the item is made of",
  "recyclingProcess":"Brief explanation of how this item is recycled",
  "commonMistakes":["Common disposal mistakes to avoid"],
  "alternativeDisposal":["Alternative eco-friendly disposal methods"],
  "upcyclingIdeas":["Creative ways to reuse or upcycle this item"],
  "relatedItems":["Similar items that should be disposed the same way"],
  "localGuidelines":"General local recycling guidelines for this item type",
  "whyThisBin":"Detailed explanation of why this item goes in this specific bin"
}

Provide comprehensive, educational information to help users understand proper waste management.`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
  };

  const data = await callGeminiAPI(body);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from AI");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response");
  return JSON.parse(jsonMatch[0]);
};
