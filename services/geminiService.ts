import { GoogleGenAI, Type } from "@google/genai";
import { GoldSignal, NewsArticle } from "../types";

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

export const fetchLiveGoldNews = async (apiKey: string): Promise<NewsArticle[]> => {
  if (!apiKey) throw new Error("API Key required");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Find 6 very recent real-time financial news headlines (from the last 24 hours) affecting Gold (XAU).
    Prioritize these sources if available: Kitco, Mining.com, Reuters, Bloomberg, WSJ, FXStreet.
    Focus on: Spot Price moves, US Inflation/CPI/PCE, Fed Rate expectations, and Geopolitics.
    
    For each article, strictly follow this single-line format:
    TITLE ||| SOURCE ||| SUMMARY ||| IMPACT_SCORE
    
    IMPACT_SCORE is a float between -1.0 (Bearish for Gold) and 1.0 (Bullish for Gold).
    Do not use markdown formatting or bullet points. Just the raw lines separated by newlines.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const lines = text.split('\n').filter(l => l.includes('|||'));
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const articles: NewsArticle[] = lines.map((line, i) => {
      const [title, source, summary, scoreStr] = line.split('|||').map(s => s.trim());
      
      let url = chunks[i]?.web?.uri;
      
      if (!url) {
        url = `https://www.google.com/search?q=${encodeURIComponent(title + " " + source)}`;
      }

      return {
        id: `real-${Date.now()}-${i}`,
        title: title || "News Alert",
        source: source || "Market Wire",
        summary: summary || "Details currently unavailable.",
        impact_score: parseFloat(scoreStr) || 0,
        timestamp: "Today",
        url: url,
        tags: ["Live", "Real-Time"]
      };
    });

    return articles.filter(a => a.title.length > 5);
  } catch (error) {
    console.error("Live News Fetch Failed", error);
    throw error;
  }
};

export const generateScenarioReport = async (
  inputs: { inflation: number; usd: number; risk: number; rates: number },
  apiKey: string
): Promise<{ headlines: string[], signal: GoldSignal }> => {
  if (!apiKey) throw new Error("API Key Required for Simulation");

  const ai = new GoogleGenAI({ apiKey });

  // Convert numerical inputs (0-100) to qualitative descriptions
  const getLevel = (val: number) => {
    if (val < 20) return "Very Low / Dovish / Peace";
    if (val < 40) return "Low / Weak / Stable";
    if (val < 60) return "Neutral / Flat";
    if (val < 80) return "High / Strong / Tense";
    return "Extreme / Breakout / Conflict";
  };

  const scenarioDescription = `
    - Inflation/CPI Data: ${getLevel(inputs.inflation)} (${inputs.inflation}%)
    - USD Strength (DXY): ${getLevel(inputs.usd)} (${inputs.usd})
    - Geopolitical Risk: ${getLevel(inputs.risk)} (${inputs.risk})
    - Fed Interest Rates: ${getLevel(inputs.rates)} (${inputs.rates})
  `;

  const prompt = `
    Act as a financial news simulator.
    Scenario Parameters:
    ${scenarioDescription}

    Task 1: Generate 5 realistic, professional financial news headlines that would appear on Bloomberg/Reuters in this specific scenario.
    Task 2: Generate a full GoldSignal object (JSON) analyzing these headlines.

    Output Format: JSON Object with keys: "headlines" (array of strings) and "signal" (GoldSignal object).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
          signal: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              signal: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
              gold_sentiment_score: { type: Type.NUMBER },
              confidence: { type: Type.INTEGER },
              summary: { type: Type.ARRAY, items: { type: Type.STRING } },
              key_drivers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    factor: { type: Type.STRING },
                    direction: { type: Type.STRING },
                    impact: { type: Type.NUMBER },
                    score: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  }
                }
              },
              top_articles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    source: { type: Type.STRING },
                    title: { type: Type.STRING },
                    url: { type: Type.STRING },
                    timestamp: { type: Type.STRING },
                    impact_score: { type: Type.NUMBER },
                    summary: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text);
};
