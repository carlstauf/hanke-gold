
import { GoldSignal, HistoricalPoint, ShockEvent } from './types';

export const MOCK_HISTORY: HistoricalPoint[] = [];

export const SHOCK_EVENTS: ShockEvent[] = [
  { id: 'fed_pivot', label: 'FED EMERGENCY CUT', category: 'MACRO', impact_bias: 0.8 },
  { id: 'hyperinflation', label: 'CPI PRINTS > 8%', category: 'MACRO', impact_bias: 0.9 },
  { id: 'strong_usd', label: 'DXY BREAKS 110', category: 'MACRO', impact_bias: -0.8 },
  { id: 'oil_shock', label: 'OIL HITS $150/bbl', category: 'COMMODITY', impact_bias: 0.6 },
  { id: 'war_escalation', label: 'GLOBAL CONFLICT', category: 'GEOPOL', impact_bias: 1.0 },
  { id: 'peace_deal', label: 'MAJOR PEACE TREATY', category: 'GEOPOL', impact_bias: -0.5 },
  { id: 'liquidity_crisis', label: 'BANKING CRISIS', category: 'MARKET', impact_bias: 0.7 },
  { id: 'tech_crash', label: 'AI BUBBLE BURST', category: 'MARKET', impact_bias: 0.4 },
  { id: 'crypto_run', label: 'BTC TO $200K', category: 'MARKET', impact_bias: -0.2 },
  { id: 'cb_buying', label: 'CHINA BUYS RECORD', category: 'COMMODITY', impact_bias: 0.5 },
  { id: 'rate_hike', label: 'SURPRISE RATE HIKE', category: 'MACRO', impact_bias: -0.9 },
  { id: 'deflation', label: 'GLOBAL DEFLATION', category: 'MACRO', impact_bias: -0.4 },
];

export const INITIAL_SIGNAL: GoldSignal = {
  date: new Date().toISOString().split('T')[0],
  signal: 'HOLD',
  gold_sentiment_score: 0,
  confidence: 0,
  summary: [
    "ANALYZING REAL-TIME DATA STREAMS...",
    "CALCULATING SENTIMENT VECTORS..."
  ],
  key_drivers: [],
  top_articles: []
};
