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
  gold_sentiment_score: 0.15,
  confidence: 65,
  summary: [
    "Inflation data came in slightly hotter than expected, capping upside.",
    "Geopolitical tensions in the Middle East provide a safety floor.",
    "USD strength is currently a headwind for spot prices."
  ],
  key_drivers: [
    { factor: 'Macro / Inflation', direction: 'bullish', impact: 0.4, score: 0.4, explanation: 'Sticky inflation suggests hedging demand.' },
    { factor: 'USD Strength', direction: 'bearish', impact: -0.6, score: -0.6, explanation: 'DXY rallying above 104.' },
    { factor: 'Real Rates', direction: 'neutral', impact: -0.1, score: -0.1, explanation: '10Y Yields stable at 4.2%.' },
    { factor: 'Geopolitics', direction: 'bullish', impact: 0.8, score: 0.8, explanation: 'Escalation risks remain high.' },
  ],
  top_articles: [
    {
      id: '1',
      source: 'Bloomberg',
      title: 'Fed Official Signals Higher for Longer Rates',
      url: 'https://www.google.com/search?q=Fed+Official+Signals+Higher+for+Longer+Rates',
      timestamp: '2 hours ago',
      impact_score: -0.5,
      summary: 'Hawkish commentary pushed yields higher, weighing on non-yielding assets.',
      tags: ['Fed', 'Rates']
    },
    {
      id: '2',
      source: 'Kitco',
      title: 'Central Banks Continue Record Gold Buying Spree',
      url: 'https://www.google.com/search?q=Central+Banks+Continue+Record+Gold+Buying+Spree',
      timestamp: '5 hours ago',
      impact_score: 0.7,
      summary: 'Emerging market central banks added 40 tons in the last month.',
      tags: ['Supply/Demand', 'Central Banks']
    }
  ]
};

export const LIVE_NEWS_POOL = [
  { source: "Reuters", title: "Gold dips as dollar strengthens ahead of Fed minutes", summary: "Spot gold fell 0.3% to $2,320.15 per ounce.", impact: -0.3, url: "https://www.google.com/search?q=Gold+dips+as+dollar+strengthens+ahead+of+Fed+minutes" },
  { source: "Bloomberg", title: "China's gold consumption rises 6% in Q1", summary: "Jewelry and investment demand remains strong despite high prices.", impact: 0.5, url: "https://www.google.com/search?q=China+gold+consumption+rises" },
  { source: "Kitco", title: "Silver breakout could pull gold higher", summary: "Technical analysis suggests silver leading the complex.", impact: 0.2, url: "https://www.google.com/search?q=Silver+breakout+pull+gold+higher" },
  { source: "CNBC", title: "US Treasury yields tick higher, weighing on metals", summary: "10-year yield up 3 basis points to 4.45%.", impact: -0.4, url: "https://www.google.com/search?q=US+Treasury+yields+tick+higher" },
  { source: "WSJ", title: "Central banks remain net buyers of gold in April", summary: "Emerging markets continue diversification away from USD.", impact: 0.6, url: "https://www.google.com/search?q=Central+banks+remain+net+buyers+gold" },
  { source: "Mining.com", title: "Newmont reports production delays at major mine", summary: "Supply constraints could support prices in medium term.", impact: 0.3, url: "https://www.google.com/search?q=Newmont+production+delays+gold" },
  { source: "Financial Times", title: "Safe-haven flows return amidst geopolitical unease", summary: "Investors flock to gold as tensions escalate.", impact: 0.7, url: "https://www.google.com/search?q=Safe+haven+flows+gold+geopolitics" },
  { source: "ForexLive", title: "DXY testing key resistance at 105.00", summary: "Stronger USD is a headwind for XAU/USD today.", impact: -0.5, url: "https://www.google.com/search?q=DXY+testing+key+resistance+105" },
];