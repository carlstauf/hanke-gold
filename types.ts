export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface FactorScore {
  factor: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  impact: number; // -1 to 1
  score: number; // -1 to 1
  explanation: string;
}

export interface NewsArticle {
  id: string;
  source: string;
  title: string;
  url: string;
  timestamp: string;
  impact_score: number; // -1 to 1 (negative is bearish for gold, positive is bullish)
  summary: string;
  tags: string[];
}

export interface GoldSignal {
  date: string;
  signal: SignalType;
  gold_sentiment_score: number; // -1 to 1
  confidence: number; // 0 to 100
  key_drivers: FactorScore[];
  top_articles: NewsArticle[];
  summary: string[]; // Bullet points
}

export interface HistoricalPoint {
  date: string;
  price: number;
  sentiment: number;
  signal?: SignalType;
}
