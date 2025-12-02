import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TerminalSquare, Radio, Database, X } from 'lucide-react';
import SignalBadge from './components/SignalBadge';
import FactorCard from './components/FactorCard';
import HistoryChart from './components/HistoryChart';
import SimulationPanel from './components/SimulationPanel';
import LiveNewsFeed from './components/LiveNewsFeed';
import { GoldSignal } from './types';
import { INITIAL_SIGNAL, MOCK_HISTORY } from './constants';
import { generateScenarioReport } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [signalData, setSignalData] = useState<GoldSignal>(INITIAL_SIGNAL);
  const [apiKey, setApiKey] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      setApiKey(process.env.API_KEY);
    }
  }, []);

  // Updated handler for the Scenario Generator (Now takes string array of shocks)
  const handleScenarioRun = async (shocks: string[]) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await generateScenarioReport(shocks, apiKey);
      setSignalData(result.signal);
      // Automatically switch to dashboard to see results
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Simulation failed. Ensure API Key is set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-terminal-black flex flex-col font-sans overflow-hidden text-sm">
      
      {/* 1. TOP BAR: Global Status & Ticker */}
      <header className="h-10 border-b border-terminal-border bg-terminal-dark flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-signal-hold flex items-center justify-center rounded-sm">
              <span className="text-[10px] font-bold text-black font-mono">Au</span>
            </div>
            <span className="font-bold text-terminal-highlight tracking-tight">AuQUANT <span className="text-terminal-text font-normal opacity-50">TERMINAL v3.0</span></span>
          </div>
          <div className="h-4 w-[1px] bg-terminal-border"></div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <TickerItem symbol="XAU/USD" price="2,342.50" change="+0.45" />
            <TickerItem symbol="DXY" price="104.20" change="-0.15" />
            <TickerItem symbol="US10Y" price="4.42" change="+0.05" />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-xs font-mono">
             <span className={apiKey ? "text-signal-buy" : "text-signal-sell"}>●</span>
             <span>API: {apiKey ? 'CONNECTED' : 'DISCONNECTED'}</span>
           </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: Utility & Nav */}
        <aside className="w-12 border-r border-terminal-border bg-terminal-panel flex flex-col items-center py-4 gap-1 shrink-0 z-20">
           <NavIcon icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Overview" />
           <NavIcon icon={TerminalSquare} active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} tooltip="Stress Test Lab" />
           <NavIcon icon={Radio} active={activeTab === 'news'} onClick={() => setActiveTab('news')} tooltip="News Stream" />
           <div className="mt-auto flex flex-col gap-2">
             <div className="w-8 h-8 flex items-center justify-center text-terminal-text opacity-50"><Database size={16}/></div>
           </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-hidden bg-terminal-black relative">
           
           {/* ERROR TOAST */}
           {error && (
             <div className="absolute top-0 w-full bg-signal-sell/10 border-b border-signal-sell/20 text-signal-sell px-4 py-2 flex justify-between items-center z-50">
               <span className="font-mono text-xs">ERR: {error}</span>
               <button onClick={() => setError(null)}><X size={14}/></button>
             </div>
           )}

           {activeTab === 'dashboard' && (
             <div className="grid grid-cols-12 grid-rows-12 h-full w-full gap-[1px] bg-terminal-border p-[1px]">
                
                {/* A. SIGNAL GAUGE (Top Left) */}
                <div className="col-span-12 md:col-span-4 row-span-4 bg-terminal-dark relative">
                   <SignalBadge signal={signalData.signal} confidence={signalData.confidence} />
                </div>

                {/* B. CHART (Top Right) */}
                <div className="col-span-12 md:col-span-8 row-span-4 bg-terminal-dark p-1 flex flex-col">
                   <div className="flex justify-between items-center px-3 py-1 border-b border-terminal-border/50 mb-1">
                      <span className="text-xs font-mono text-terminal-text">XAU/USD v SENTIMENT CORRELATION (1H)</span>
                      <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-signal-hold">PRICE</span>
                        <span className="text-blue-400">SENTIMENT</span>
                      </div>
                   </div>
                   <div className="flex-1">
                      <HistoryChart data={MOCK_HISTORY} />
                   </div>
                </div>

                {/* C. KEY DRIVERS (Middle Strip) */}
                <div className="col-span-12 row-span-3 bg-terminal-black grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-terminal-border">
                   {signalData.key_drivers.map((driver, idx) => (
                      <div key={idx} className="bg-terminal-dark">
                         <FactorCard factor={driver} />
                      </div>
                   ))}
                </div>

                {/* D. NEWS & SUMMARY (Bottom) */}
                <div className="col-span-12 md:col-span-8 row-span-5 bg-terminal-dark flex flex-col">
                   <div className="px-3 py-2 border-b border-terminal-border bg-terminal-panel/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-terminal-highlight">INTELLIGENCE FEED</span>
                      <span className="text-[10px] font-mono text-terminal-text">LIVE</span>
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <LiveNewsFeed apiKey={apiKey} />
                   </div>
                </div>

                <div className="col-span-12 md:col-span-4 row-span-5 bg-terminal-panel flex flex-col p-4 border-l border-terminal-border">
                   <h3 className="text-xs font-mono text-terminal-text mb-4 uppercase">System Summary</h3>
                   <div className="space-y-4 font-mono text-xs">
                      {signalData.summary.map((point, idx) => (
                        <div key={idx} className="flex gap-2">
                           <span className="text-terminal-text opacity-50">{idx+1}.</span>
                           <p className="text-terminal-highlight leading-relaxed">{point}</p>
                        </div>
                      ))}
                   </div>
                   <div className="mt-auto pt-4 border-t border-terminal-border">
                      <div className="flex justify-between text-xs font-mono text-terminal-text opacity-70">
                        <span>MODEL</span>
                        <span>GEMINI-PRO-QUANT-v1</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono text-terminal-text opacity-70 mt-1">
                        <span>LATENCY</span>
                        <span>24ms</span>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'engine' && (
              <div className="h-full w-full bg-terminal-black flex flex-col">
                 <div className="h-8 bg-terminal-panel border-b border-terminal-border flex items-center px-4">
                     <span className="text-xs font-mono text-terminal-text">~/strategy_lab/stress_test.mod</span>
                 </div>
                 <div className="flex-1 overflow-auto">
                    <SimulationPanel 
                      onRunScenario={handleScenarioRun} 
                      isLoading={isAnalyzing} 
                      onApiKeyChange={setApiKey}
                      hasKey={!!apiKey}
                    />
                 </div>
              </div>
           )}

           {activeTab === 'news' && (
             <div className="h-full w-full bg-terminal-dark flex flex-col">
                <div className="h-10 border-b border-terminal-border flex items-center px-4 bg-terminal-panel">
                  <span className="font-mono text-xs font-bold text-terminal-highlight">FULL SPECTRUM NEWS WIRE</span>
                </div>
                <LiveNewsFeed apiKey={apiKey} />
             </div>
           )}

        </main>
      </div>
    </div>
  );
};

const NavIcon = ({ icon: Icon, active, onClick, tooltip }: any) => (
  <button 
    onClick={onClick}
    title={tooltip}
    className={`w-10 h-10 flex items-center justify-center rounded-sm transition-all duration-200 
      ${active ? 'bg-terminal-border text-terminal-highlight border-l-2 border-signal-hold' : 'text-terminal-text hover:bg-terminal-border/50'}
    `}
  >
    <Icon size={18} strokeWidth={1.5} />
  </button>
);

const TickerItem = ({ symbol, price, change }: any) => {
  const isPos = change.startsWith('+');
  return (
    <div className="flex gap-2">
      <span className="text-terminal-text">{symbol}</span>
      <span className="text-terminal-highlight">{price}</span>
      <span className={isPos ? 'text-signal-buy' : 'text-signal-sell'}>{change}%</span>
    </div>
  );
}

export default App;