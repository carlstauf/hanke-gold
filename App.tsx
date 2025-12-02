
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TerminalSquare, Radio, Database, X, RotateCcw, Loader2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import SignalBadge from './components/SignalBadge';
import FactorCard from './components/FactorCard';
import SimulationPanel from './components/SimulationPanel';
import LiveNewsFeed from './components/LiveNewsFeed';
import { GoldSignal, HistoricalPoint } from './types';
import { INITIAL_SIGNAL } from './constants';
import { generateScenarioReport, generateDailySignalFromLiveNews, fetchGoldPriceHistory } from './services/geminiService';
import { getLiveGoldPrice } from './services/priceService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State for Live Data (Source of Truth) vs Display Data (What is shown)
  const [liveSignalData, setLiveSignalData] = useState<GoldSignal>(INITIAL_SIGNAL);
  const [displaySignalData, setDisplaySignalData] = useState<GoldSignal>(INITIAL_SIGNAL);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [priceHistory, setPriceHistory] = useState<HistoricalPoint[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [lastTickTime, setLastTickTime] = useState<string>("--:--:--");

  const [apiKey, setApiKey] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBooting, setIsBooting] = useState(true); // Splash screen state
  const [isSignalLoading, setIsSignalLoading] = useState(false); // Background data loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      setApiKey(process.env.API_KEY);
    }
  }, []);

  // POLLER: Fetch Live Price every 5s (High Frequency)
  useEffect(() => {
     const updatePrice = async () => {
        const price = await getLiveGoldPrice();
        if (price) {
           setLivePrice(price);
           const now = new Date();
           setLastTickTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`);
        }
     };

     // Initial call
     updatePrice();
     
     // Interval 5s
     const interval = setInterval(updatePrice, 5000);
     return () => clearInterval(interval);
  }, []);

  // BOOT SEQUENCE: Splash Screen -> Dashboard -> Background Fetch
  useEffect(() => {
    // 1. Splash Screen Timer (Fixed 2.5s for aesthetics)
    const timer = setTimeout(() => {
        setIsBooting(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // BACKGROUND DATA FETCH (Triggered once API key is ready)
  useEffect(() => {
    const fetchData = async () => {
        if (!apiKey) return;

        setIsSignalLoading(true);
        try {
            // Parallel Fetch: History + Analysis
            const [history, signal] = await Promise.all([
                fetchGoldPriceHistory(apiKey),
                generateDailySignalFromLiveNews(apiKey)
            ]);
            
            setPriceHistory(history);
            setLiveSignalData(signal);
            setDisplaySignalData(signal);
        } catch (e: any) {
            console.error("Background fetch failed:", e);
            setError(`Data Init Failed: ${e.message || "Network Error"}`);
        } finally {
            setIsSignalLoading(false);
        }
    };

    if (apiKey) {
        fetchData();
    }
  }, [apiKey]);

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

  // Calculate Price Metrics
  const priceMetrics = React.useMemo(() => {
     if (!livePrice || priceHistory.length === 0) return { change: 0, percent: 0, prev: 0 };
     
     // Logic: Find the most recent "Close" that isn't the live price itself.
     // Usually priceHistory contains last 14 days closes.
     const prevClose = priceHistory[priceHistory.length - 1].price;
     const change = livePrice - prevClose;
     const percent = (change / prevClose) * 100;
     
     return { change, percent, prev: prevClose };
  }, [livePrice, priceHistory]);


  if (isBooting) {
      return (
          <div className="h-screen w-screen bg-terminal-black flex flex-col items-center justify-center font-mono text-terminal-highlight">
              <Loader2 className="animate-spin mb-4 text-signal-hold" size={48} />
              <div className="text-xl font-bold tracking-widest mb-2">AuQUANT SYSTEM BOOT</div>
              <div className="text-xs text-terminal-text opacity-70">ESTABLISHING SECURE UPLINK TO GLOBAL EXCHANGES...</div>
              <div className="mt-4 flex flex-col gap-1 w-64">
                  <div className="flex justify-between text-[10px] text-terminal-text">
                      <span>FEED_1 (REUTERS)</span>
                      <span className="text-signal-buy">CONNECTED</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-terminal-text">
                      <span>FEED_2 (BLOOMBERG)</span>
                      <span className="text-signal-buy">CONNECTED</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-terminal-text">
                      <span>FEED_3 (KITCO)</span>
                      <span className="text-signal-buy animate-pulse">SYNCING...</span>
                  </div>
              </div>
          </div>
      );
  }

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
               <span className="text-terminal-text font-normal opacity-50 ml-2">TERMINAL v3.1</span>
            </span>
          </div>
          <div className="h-4 w-[1px] bg-terminal-border"></div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <TickerItem symbol="XAU/USD" price={livePrice?.toFixed(2) || "WAITING..."} change={lastTickTime} isTime />
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
                <div className="col-span-12 md:col-span-6 row-span-4 bg-terminal-dark relative">
                   <SignalBadge 
                     signal={displaySignalData.signal} 
                     confidence={displaySignalData.confidence} 
                     isSimulation={isSimulationMode}
                     isLoading={isSignalLoading}
                   />
                </div>

                {/* B. PRICE DISPLAY (Top Right) - REPLACED CHART WITH BIG TEXT */}
                <div className="col-span-12 md:col-span-6 row-span-4 bg-terminal-dark p-6 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                      <div>
                          <h2 className="text-xs font-mono text-terminal-text uppercase opacity-70 mb-1">Live Spot Gold</h2>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-signal-buy rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-mono text-signal-buy tracking-wider">MARKET ACTIVE</span>
                          </div>
                      </div>
                      <div className="text-right">
                          <h3 className="text-xs font-mono text-terminal-text opacity-50">24H CHANGE</h3>
                          <div className={`text-xl font-mono font-bold flex items-center justify-end gap-1 ${priceMetrics.change >= 0 ? 'text-signal-buy' : 'text-signal-sell'}`}>
                              {priceMetrics.change >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                              {priceMetrics.change >= 0 ? '+' : ''}{priceMetrics.change.toFixed(2)} ({priceMetrics.percent.toFixed(2)}%)
                          </div>
                      </div>
                   </div>

                   <div className="flex items-baseline gap-2 mt-2">
                       <span className="text-terminal-text text-4xl font-light">$</span>
                       {/* HUGE PRICE DISPLAY */}
                       <span className={`text-7xl md:text-8xl font-black tracking-tighter text-terminal-highlight tabular-nums leading-none`}>
                           {livePrice ? Math.floor(livePrice) : "----"}
                           <span className="text-4xl text-terminal-text opacity-50">.{livePrice ? (livePrice % 1).toFixed(2).substring(2) : "00"}</span>
                       </span>
                   </div>

                   <div className="flex justify-between items-end mt-4">
                       <div className="flex flex-col">
                           <span className="text-[10px] font-mono text-terminal-text opacity-50">PREVIOUS CLOSE</span>
                           <span className="text-sm font-mono text-terminal-text">${priceMetrics.prev.toFixed(2)}</span>
                       </div>
                       <div className="flex items-center gap-1 text-[10px] font-mono text-terminal-text opacity-30">
                           <Clock size={10} />
                           UPDATED: {lastTickTime}
                       </div>
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
                         {isSimulationMode ? 'SYNTHETIC NEWS GENERATION' : 'INTELLIGENCE FEED (SORTED: NEWEST)'}
                      </span>
                      <span className="text-[10px] font-mono text-terminal-text">
                         {isSimulationMode ? 'OFFLINE SIM' : 'LIVE CONNECTED'}
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
                      {isSignalLoading ? (
                        <div className="flex flex-col gap-2 opacity-50 animate-pulse">
                            <div className="h-2 bg-terminal-border w-3/4 rounded"></div>
                            <div className="h-2 bg-terminal-border w-full rounded"></div>
                            <div className="h-2 bg-terminal-border w-5/6 rounded"></div>
                        </div>
                      ) : (
                        displaySignalData.summary.map((point, idx) => (
                          <div key={idx} className="flex gap-2">
                             <span className="text-terminal-text opacity-50">{idx+1}.</span>
                             <p className="text-terminal-highlight leading-relaxed">{point}</p>
                          </div>
                        ))
                      )}
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

const TickerItem = ({ symbol, price, change, isTime }: any) => {
  const isPos = !isTime && change.startsWith('+');
  const isNeg = !isTime && change.startsWith('-');
  return (
    <div className="flex gap-2">
      <span className="text-terminal-text">{symbol}</span>
      <span className="text-terminal-highlight">{price}</span>
      <span className={isPos ? 'text-signal-buy' : isNeg ? 'text-signal-sell' : 'text-terminal-text opacity-50'}>
        {change}
      </span>
    </div>
  );
}

export default App;
