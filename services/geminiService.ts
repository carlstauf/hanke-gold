
import { GoogleGenAI, Type } from "@google/genai";
import { GoldSignal, NewsArticle, HistoricalPoint } from "../types";

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

export const generateDailySignalFromLiveNews = async (apiKey: string): Promise<GoldSignal> => {
  try {
    // 1. Fetch Real News first
    const articles = await fetchLiveGoldNews(apiKey);
    
    if (articles.length === 0) {
        throw new Error("No live news found");
    }

    // 2. Prepare headlines for analysis
    const headlines = articles.map(a => `${a.title} (Source: ${a.source}) - ${a.summary}`);
    
    // 3. Analyze using the core engine
    const signal = await analyzeHeadlinesWithGemini(headlines, apiKey);
    
    // 4. Merge the REAL fetched articles (with valid URLs) into the signal object
    // replacing the hallucinated/aggregated ones from the prompt
    return {
        ...signal,
        top_articles: articles.slice(0, 8)
    };
  } catch (error) {
    console.error("Pipeline Failed:", error);
    throw error;
  }
};

export const generateScenarioReport = async (
  activeShocks: string[],
  apiKey: string
): Promise<{ headlines: string[], signal: GoldSignal }> => {
  if (!apiKey) throw new Error("API Key Required for Simulation");

  const ai = new GoogleGenAI({ apiKey });

  const scenarioDescription = activeShocks.length > 0 
    ? `The market is experiencing the following simultaneous events: ${activeShocks.join(', ')}.`
    : `The market is currently quiet with no major shock events. Business as usual.`;

  const prompt = `
    Act as a financial news simulator / market maker.
    
    SCENARIO CONTEXT:
    ${scenarioDescription}

    Task 1: Generate 5 realistic, professional financial news headlines that would appear on Bloomberg/Reuters in this specific scenario. Ensure they reflect the interactions between these events (e.g. if Oil is up and Fed cuts rates, what happens to inflation expectation?).
    Task 2: Generate a full GoldSignal object (JSON) analyzing these headlines, predicting the Gold (XAU) reaction.

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

export const fetchGoldPriceHistory = async (apiKey: string): Promise<HistoricalPoint[]> => {
    if (!apiKey) return [];
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Search for the daily closing price of Gold (XAU/USD) for the last 14 days.
      
      OUTPUT FORMAT:
      You must return a JSON array inside a code block.
      Example:
      \`\`\`json
      [
        {"date": "2023-10-01", "price": 1850.50},
        ...
      ]
      \`\`\`
      
      Ensure the data is accurate real-world data found via search.
      Order by date ascending.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // NOTE: responseMimeType and responseSchema CANNOT be used with tools in this API version
            }
        });
        
        const text = response.text || "[]";
        
        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || [null, text];
        let jsonStr = jsonMatch[1] || text;
        
        // clean up potentially messy string
        jsonStr = jsonStr.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace('```json', '').replace('```', '');
        
        let data = [];
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            console.warn("Failed to parse history JSON directly, trying to find array pattern");
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                data = JSON.parse(arrayMatch[0]);
            }
        }

        if (!Array.isArray(data)) return [];

        return data.map((d: any) => ({
            date: d.date,
            price: d.price,
            sentiment: 0 
        }));
    } catch (e) {
        console.error("History Fetch Failed", e);
        return [];
    }
}
