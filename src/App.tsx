import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Radar, Zap } from 'lucide-react';

interface EntityResult {
  name: string;
  entityId?: string;
  types: string[];
  description?: string;
  url?: string;
  resultScore?: number;
}

type Status = 'machine-verified' | 'ambiguous' | 'ai-invisible' | 'loading' | 'error' | null;

function App() {
  const [brandName, setBrandName] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [result, setResult] = useState<EntityResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // CALCULATE DYNAMIC FOUND SCORE
  const calculateFoundScore = () => {
    if (status === 'ai-invisible' || !result) return 0;
    
    // Google KG resultScore is often between 1 and 20,000+
    // We use a log scale to make the score feel 'earned'
    const rawScore = result.resultScore || 0;
    const logSignal = rawScore > 0 ? Math.log10(rawScore) * 15 : 0;
    
    let base = status === 'machine-verified' ? 75 : 30;
    let finalScore = Math.floor(base + logSignal);
    
    // Constraints to keep it within brand logic
    if (status === 'machine-verified') return Math.min(finalScore, 99);
    if (status === 'ambiguous') return Math.min(finalScore, 65);
    return 0;
  };

  const foundScore = calculateFoundScore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    setIsSearching(true);
    setStatus('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph-search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: brandName }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to search');

      if (data.status === 'machine-verified' || data.status === 'ambiguous') {
        setStatus(data.status);
        setResult(data.result);
      } else {
        setStatus('ai-invisible');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 rounded-full bg-emerald-500/10 mb-6 border border-emerald-500/20">
            <Radar className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            The <span className="text-emerald-400">Found Score</span> Auditor
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Does the machine-facing web know you exist? Audit your <span className="text-white font-semibold">Entity Clarity</span> across the AI Knowledge Graph.
          </p>
        </div>

        {/* SEARCH BOX */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter Brand or Domain Name..."
              className="flex-1 bg-black/50 border border-emerald-500/30 rounded-xl px-6 py-4 outline-none focus:border-emerald-400 transition-all text-lg"
              disabled={isSearching}
            />
            <button
              disabled={isSearching || !brandName}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? 'Intercepting Signals...' : 'Audit Visibility'}
            </button>
          </form>
        </div>

        {/* RESULTS AREA */}
        {status === 'loading' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-emerald-400 font-mono tracking-widest">SCANNING MACHINE TRUST LAYERS...</p>
          </div>
        )}

        {status && status !== 'loading' && status !== 'error' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* SCORE GAUGE */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-10 text-center mb-8 relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-2">Machine Confidence Level</p>
                  <div className={`text-8xl font-black mb-4 ${foundScore > 70 ? 'text-emerald-400' : foundScore > 30 ? 'text-amber-400' : 'text-red-500'}`}>
                    {foundScore}%
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full max-w-md mx-auto overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${foundScore > 70 ? 'bg-emerald-500' : foundScore > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${foundScore}%` }}
                    />
                  </div>
                  <p className="mt-6 text-gray-400 italic">
                    {foundScore > 70 ? 'Status: High Entity Clarity' : foundScore > 30 ? 'Status: Discovery Gap Detected' : 'Status: AI Invisibility'}
                  </p>
               </div>
            </div>

            {/* ENTITY DETAILS */}
            <div className={`rounded-2xl p-8 border ${status === 'machine-verified' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex items-start gap-6">
                {status === 'machine-verified' ? <CheckCircle className="text-emerald-400 w-10 h-10" /> : <AlertCircle className="text-amber-400 w-10 h-10" />}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{result?.name}</h3>
                  <p className="text-gray-400 mb-6">{result?.description || "No machine-readable description found. This entity lacks a verified trust layer."}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Entity ID</span>
                      <code className="text-emerald-400 text-sm break-all">{result?.entityId || 'N/A'}</code>
                    </div>
                    <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Classification</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result?.types.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300">{t}</span>
                        )) || 'Unstructured'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CALL TO ACTION */}
        {status && status !== 'loading' && (
          <div className="mt-12 bg-emerald-500 p-8 rounded-2xl text-black text-center shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]">
            <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">
              <Zap className="fill-current" /> CLOSE THE DISCOVERY GAP
            </h2>
            <p className="font-bold text-lg mb-6 opacity-80">Your Brand is currently {100 - foundScore}% Invisible to AI Agents.</p>
            <a 
              href="https://becomefoundbyai.com" 
              className="inline-block bg-black text-white px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Claim the AI Visibility Toolkit (£27)
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
