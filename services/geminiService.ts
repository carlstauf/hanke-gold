import { GoogleGenAI, Type } from "@google/genai";
import { GoldSignal } from "../types";

// This prompts the LLM to act as the "Sentiment Engine" described in the python prompt.
const ANALYSIS_SYSTEM_INSTRUCTION = `
You are an expert quantitative researcher and commodities strategist specializing in Gold (XAU).
Your task is to analyze a list of financial news headlines and produce a daily trading signal object.

You must output JSON only.
Analyze the provided headlines to determine:
1. A Sentiment Score (-1.0 to 1.0) where -1 is extremely bearish for Gold, 1 is extremely bullish.
2. A Signal (BUY, SELL, or HOLD).
3. A Confidence score (0-100).
4. Factor scores for: Macro/Inflation, USD, Real Rates, Supply/Demand/Risk.
5. A brief summary.

The logic:
- High inflation, geopolitical risk, weak USD, low real rates -> BULLISH (BUY)
- Low inflation, strong economy, strong USD, high real rates -> BEARISH (SELL)
- Mixed signals -> NEUTRAL (HOLD)
`;

export const analyzeHeadlinesWithGemini = async (headlines: string[], apiKey: string): Promise<GoldSignal> => {
  if (!apiKey) {
    throw new Error("API Key is required");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze the following headlines as a collective dataset for today's trading session:
    ${headlines.map(h => `- ${h}`).join('\n')}
    
    Return a structured JSON response conforming to the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            signal: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
            gold_sentiment_score: { type: Type.NUMBER, description: "Float between -1 and 1" },
            confidence: { type: Type.INTEGER, description: "0 to 100" },
            summary: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3-5 bullet points explaining the signal"
            },
            key_drivers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  factor: { type: Type.STRING },
                  direction: { type: Type.STRING, enum: ["bullish", "bearish", "neutral"] },
                  impact: { type: Type.NUMBER, description: "-1 to 1" },
                  score: { type: Type.NUMBER, description: "-1 to 1" },
                  explanation: { type: Type.STRING }
                },
                required: ["factor", "direction", "impact", "score", "explanation"]
              }
            },
            top_articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING, description: "Infer source or use 'Aggregated'" },
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  timestamp: { type: Type.STRING },
                  impact_score: { type: Type.NUMBER },
                  summary: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          },
          required: ["date", "signal", "gold_sentiment_score", "confidence", "summary", "key_drivers"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text);
    return data as GoldSignal;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
