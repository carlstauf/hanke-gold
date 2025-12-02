import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TerminalSquare, Radio, Database, X, RotateCcw } from 'lucide-react';
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
  
  // State for Live Data (Source of Truth) vs Display Data (What is shown)
  const [liveSignalData, setLiveSignalData] = useState<GoldSignal>(INITIAL_SIGNAL);
  const [displaySignalData, setDisplaySignalData] = useState<GoldSignal>(INITIAL_SIGNAL);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

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
      
      // Update Display Data ONLY, keep Live Data safe
      setDisplaySignalData(result.signal);
      setIsSimulationMode(true);
      
      // Automatically switch to dashboard to see results
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Simulation failed. Ensure API Key is set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExitSimulation = () => {
    setDisplaySignalData(liveSignalData);
    setIsSimulationMode(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="h-screen w-screen bg-terminal-black flex flex-col font-sans overflow-hidden text-sm">
      
      {/* 1. TOP BAR: Global Status & Ticker */}
      <header className={`h-10 border-b flex items-center justify-between px-3 shrink-0 transition-colors duration-300 ${isSimulationMode ? 'bg-[#1e1b2e] border-indigo-900' : 'bg-terminal-dark border-terminal-border'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 flex items-center justify-center rounded-sm ${isSimulationMode ? 'bg-indigo-500' : 'bg-signal-hold'}`}>
              <span className="text-[10px] font-bold text-black font-mono">Au</span>
            </div>
            <span className="font-bold text-terminal-highlight tracking-tight">
               AuQUANT 
               <span className="text-terminal-text font-normal opacity-50 ml-2">TERMINAL v3.0</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-terminal-border"></div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <TickerItem symbol="XAU/USD" price="2,342.50" change="+0.45" />
            <TickerItem symbol="DXY" price="104.20" change="-0.15" />
          </div>
        </div>

        <div className="flex items-center gap-4">
           {isSimulationMode && (
              <button 
                onClick={handleExitSimulation}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold tracking-wider rounded-sm animate-pulse"
              >
                 <RotateCcw size={12} />
                 EXIT SIMULATION - RETURN TO LIVE
              </button>
           )}
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

           {/* SIMULATION WARNING OVERLAY */}
           {isSimulationMode && activeTab === 'dashboard' && (
              <div className="absolute top-0 left-0 right-0 bg-indigo-900/90 text-white text-center text-[10px] font-mono py-1 z-40 border-b border-indigo-500 tracking-widest">
                 ⚠ SYNTHETIC SCENARIO ACTIVE - DATA IS HALLUCINATED ⚠
              </div>
           )}

           {activeTab === 'dashboard' && (
             <div className="grid grid-cols-12 grid-rows-12 h-full w-full gap-[1px] bg-terminal-border p-[1px]">
                
                {/* A. SIGNAL GAUGE (Top Left) */}
                <div className="col-span-12 md:col-span-4 row-span-4 bg-terminal-dark relative">
                   <SignalBadge signal={displaySignalData.signal} confidence={displaySignalData.confidence} isSimulation={isSimulationMode} />
                </div>

                {/* B. CHART (Top Right) */}
                <div className="col-span-12 md:col-span-8 row-span-4 bg-terminal-dark p-1 flex flex-col">
                   <div className="flex justify-between items-center px-3 py-1 border-b border-terminal-border/50 mb-1">
                      <span className="text-xs font-mono text-terminal-text">XAU/USD INTRADAY PRICE ACTION</span>
                      <div className="flex gap-2 text-[10px] font-mono">
                        <span className="text-signal-hold">SPOT PRICE</span>
                      </div>
                   </div>
                   <div className="flex-1">
                      <HistoryChart data={MOCK_HISTORY} />
                   </div>
                </div>

                {/* C. KEY DRIVERS (Middle Strip) */}
                <div className="col-span-12 row-span-3 bg-terminal-black grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-terminal-border">
                   {displaySignalData.key_drivers.map((driver, idx) => (
                      <div key={idx} className="bg-terminal-dark">
                         <FactorCard factor={driver} />
                      </div>
                   ))}
                </div>

                {/* D. NEWS & SUMMARY (Bottom) */}
                <div className="col-span-12 md:col-span-8 row-span-5 bg-terminal-dark flex flex-col">
                   <div className="px-3 py-2 border-b border-terminal-border bg-terminal-panel/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-terminal-highlight">
                         {isSimulationMode ? 'SYNTHETIC NEWS GENERATION' : 'INTELLIGENCE FEED'}
                      </span>
                      <span className="text-[10px] font-mono text-terminal-text">
                         {isSimulationMode ? 'OFFLINE SIM' : 'LIVE'}
                      </span>
                   </div>
                   <div className="flex-1 overflow-hidden">
                       {isSimulationMode ? (
                          <div className="p-4 space-y-2 overflow-auto h-full">
                             {displaySignalData.top_articles.map((art, i) => (
                                <div key={i} className="border-b border-terminal-border pb-2 mb-2">
                                   <div className="flex justify-between text-[10px] text-indigo-400 font-mono mb-1">
                                      <span>{art.source}</span>
                                      <span>{art.timestamp}</span>
                                   </div>
                                   <div className="text-sm text-terminal-highlight font-bold mb-1">{art.title}</div>
                                   <div className="text-xs text-terminal-text opacity-70">{art.summary}</div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <LiveNewsFeed apiKey={apiKey} />
                       )}
                   </div>
                </div>

                <div className="col-span-12 md:col-span-4 row-span-5 bg-terminal-panel flex flex-col p-4 border-l border-terminal-border">
                   <h3 className="text-xs font-mono text-terminal-text mb-4 uppercase">System Summary</h3>
                   <div className="space-y-4 font-mono text-xs">
                      {displaySignalData.summary.map((point, idx) => (
                        <div key={idx} className="flex gap-2">
                           <span className="text-terminal-text opacity-50">{idx+1}.</span>
                           <p className="text-terminal-highlight leading-relaxed">{point}</p>
                        </div>
                      ))}
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