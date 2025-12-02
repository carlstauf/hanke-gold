import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Newspaper, Activity, Settings, Database, BrainCircuit, AlertTriangle } from 'lucide-react';
import SignalBadge from './components/SignalBadge';
import FactorCard from './components/FactorCard';
import HistoryChart from './components/HistoryChart';
import SimulationPanel from './components/SimulationPanel';
import LiveNewsFeed from './components/LiveNewsFeed';
import { GoldSignal, HistoricalPoint } from './types';
import { INITIAL_SIGNAL, MOCK_HISTORY } from './constants';
import { analyzeHeadlinesWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signalData, setSignalData] = useState<GoldSignal>(INITIAL_SIGNAL);
  const [apiKey, setApiKey] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for env key
  useEffect(() => {
    if (process.env.API_KEY) {
      setApiKey(process.env.API_KEY);
    }
  }, []);

  const handleAnalysis = async (headlines: string[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const newSignal = await analyzeHeadlinesWithGemini(headlines, apiKey);
      setSignalData(newSignal);
    } catch (err: any) {
      setError(err.message || "Failed to analyze headlines.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sentimentColor = signalData.gold_sentiment_score > 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-slate-800 bg-slate-950 p-6 flex flex-col z-10 sticky top-0 h-auto md:h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-gold-500 rounded flex items-center justify-center">
            <span className="font-bold text-slate-950 text-xl">Au</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">AuQuant</h1>
            <p className="text-xs text-slate-500 font-mono">ALPHA V1.0</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavButton icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={BrainCircuit} label="Sentiment Engine" active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} />
          <NavButton icon={Newspaper} label="News Feed" active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
          <NavButton icon={Activity} label="Performance" active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <div className="flex items-center gap-2 text-slate-500 text-xs">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             System Operational
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 relative">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {activeTab === 'dashboard' && 'Daily Overview'}
              {activeTab === 'engine' && 'Sentiment Simulation'}
              {activeTab === 'news' && 'Source Analysis'}
              {activeTab === 'performance' && 'Strategy Backtest'}
            </h2>
            <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString()} • 08:30 AM EST</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">XAU/USD</span>
                <span className="text-gold-400 font-mono font-bold">$2,342.50</span>
                <span className="text-green-500 text-xs font-mono">+0.4%</span>
             </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Main Signal Column */}
            <div className="lg:col-span-1 space-y-6">
              <SignalBadge signal={signalData.signal} confidence={signalData.confidence} className="h-64" />
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-slate-400 text-sm font-bold mb-4 uppercase tracking-wider">Overall Sentiment</h3>
                <div className="flex items-center justify-center py-4">
                  <div className="text-5xl font-bold font-mono tracking-tighter text-white">
                    {signalData.gold_sentiment_score > 0 ? '+' : ''}{signalData.gold_sentiment_score.toFixed(2)}
                  </div>
                </div>
                <div className="text-center text-xs text-slate-500 font-mono mb-4">RANGE: -1.0 TO 1.0</div>
                <p className={`text-center text-sm ${sentimentColor}`}>
                   {signalData.gold_sentiment_score > 0.5 ? "Strongly Bullish" : signalData.gold_sentiment_score < -0.5 ? "Strongly Bearish" : "Neutral / Mixed"}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <h3 className="text-slate-400 text-sm font-bold mb-4 uppercase tracking-wider">Executive Summary</h3>
                 <ul className="space-y-3">
                   {signalData.summary.map((point, idx) => (
                     <li key={idx} className="text-sm text-slate-300 leading-relaxed flex gap-3">
                       <span className="text-gold-500 mt-1.5">•</span>
                       {point}
                     </li>
                   ))}
                 </ul>
              </div>
            </div>

            {/* Charts & Drivers Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {signalData.key_drivers.map((driver, idx) => (
                  <FactorCard key={idx} factor={driver} />
                ))}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-slate-200 font-bold">Sentiment vs Price Correlation</h3>
                    <div className="flex gap-2">
                       <span className="text-xs text-slate-500 font-mono flex items-center gap-1"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> PRICE</span>
                       <span className="text-xs text-slate-500 font-mono flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> SENTIMENT</span>
                    </div>
                 </div>
                 <HistoryChart data={MOCK_HISTORY} />
              </div>
            </div>
          </div>
        )}

        {/* ENGINE TAB */}
        {activeTab === 'engine' && (
          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-white">Live Strategy Lab</h2>
              <p className="text-slate-400">Feed the engine real-time headlines to test how the AuQuant algorithm interprets new data.</p>
            </div>
            
            <SimulationPanel 
              onAnalyze={handleAnalysis} 
              isLoading={isAnalyzing} 
              onApiKeyChange={setApiKey}
              hasKey={!!apiKey}
            />

            {signalData.signal && (
               <div className="border-t border-slate-800 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h3 className="text-slate-400 font-mono text-sm mb-4">GENERATED SIGNAL OUTPUT</h3>
                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start">
                       <div>
                          <div className="text-4xl font-bold text-white mb-2">{signalData.signal}</div>
                          <div className="text-gold-500 font-mono">SCORE: {signalData.gold_sentiment_score}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-sm text-slate-400">Confidence</div>
                          <div className="text-2xl font-bold text-white">{signalData.confidence}%</div>
                       </div>
                    </div>
                    <div className="mt-6 grid gap-2">
                      {signalData.summary.map((s, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-slate-300">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            )}
          </div>
        )}

        {/* NEWS TAB (Simplified View) */}
        {activeTab === 'news' && (
           <div className="grid gap-4 max-w-4xl mx-auto relative z-10">
              <LiveNewsFeed />
              
              <h3 className="text-slate-400 font-mono mb-2">TOP INFLUENCING ARTICLES (24H)</h3>
              {signalData.top_articles.map((article, i) => (
                <div key={i} className="bg-slate-900 p-5 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors flex gap-4">
                   <div className={`flex flex-col items-center justify-center w-16 h-16 rounded bg-slate-950 border ${
                     article.impact_score > 0 ? 'border-green-900 text-green-500' : 'border-red-900 text-red-500'
                   }`}>
                      <span className="text-lg font-bold">{article.impact_score > 0 ? '+' : ''}{article.impact_score}</span>
                      <span className="text-[10px] uppercase font-bold opacity-60">Impact</span>
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-gold-500 font-mono uppercase tracking-wide">{article.source}</span>
                        <span className="text-xs text-slate-500">{article.timestamp}</span>
                      </div>
                      <h4 className="text-lg font-medium text-slate-200 mb-2">{article.title}</h4>
                      <p className="text-sm text-slate-400 mb-3">{article.summary}</p>
                      <div className="flex gap-2">
                        {article.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
           <div className="max-w-4xl mx-auto relative z-10 space-y-6">
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                 <h3 className="text-slate-200 font-bold mb-6">Historical Backtest Metrics</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricBox label="Sharpe Ratio" value="1.82" />
                    <MetricBox label="Win Rate" value="64%" />
                    <MetricBox label="Max Drawdown" value="-12.5%" />
                    <MetricBox label="Total Return (YTD)" value="+18.4%" color="text-green-400" />
                 </div>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-96 flex items-center justify-center">
                 <div className="text-center text-slate-500">
                    <Activity size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Detailed equity curve visualization would render here.</p>
                    <p className="text-xs mt-2">Based on daily signal aggregation vs Spot Gold (XAU/USD).</p>
                 </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' 
        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const MetricBox = ({ label, value, color = "text-white" }: any) => (
  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
    <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
);

export default App;