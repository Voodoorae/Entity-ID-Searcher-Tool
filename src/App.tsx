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

  const calculateFoundScore = () => {
    if (status === 'ai-invisible' || !result) return 0;
    
    // Fallback to 0 to prevent NaN if resultScore is missing/zero
    const rawScore = result.resultScore || 0;
    
    // STINGY MATH: Prevents local businesses from looking "Safe"
    // Log10 of 1000 is 3. Sqrt of 3 is 1.7. 1.7 * 5 = 8.5 points.
    const signalBonus = rawScore > 1 ? Math.sqrt(Math.log10(rawScore)) * 5 : 0;
    
    // Forced Bases: 
    // Ambiguous (found as topic/word) = 20% Base
    // Verified (found as business) = 45% Base
    let base = status === 'machine-verified' ? 45 : 20;
    let finalScore = Math.floor(base + signalBonus);
    
    // Hard Caps to protect the Lead Magnet urgency
    if (status === 'machine-verified') return Math.min(finalScore, 89); 
    if (status === 'ambiguous') return Math.min(finalScore, 48); 
    
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
      if (!response.ok) throw new Error(data.error || 'Connection failed');

      if (data.status === 'machine-verified' || data.status === 'ambiguous') {
        setStatus(data.status);
        setResult(data.result);
      } else {
        setStatus('ai-invisible');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'System intercept failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        
        <div className="text-center mb-12">
          <div className="inline-block p-3 rounded-full bg-emerald-500/10 mb-6 border border-emerald-500/20">
            <Radar className="w-10 h-10 text-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight">
            The <span className="text-emerald-400">Found Score</span> Auditor
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Audit your <span className="text-white font-semibold">Entity Clarity</span> across the global AI Knowledge Graph.
          </p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter Brand Name..."
              className="flex-1 bg-black border border-emerald-500/30 rounded-xl px-6 py-4 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all text-lg"
              disabled={isSearching}
            />
            <button
              disabled={isSearching || !brandName}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {isSearching ? 'Intercepting...' : 'Audit Visibility'}
            </button>
          </form>
        </div>

        {status === 'loading' && (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-emerald-400 font-mono tracking-widest text-sm">SCANNING TRUST LAYERS...</p>
          </div>
        )}

        {status && status !== 'loading' && status !== 'error' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="bg-[#111] border border-white/10 rounded-2xl p-10 text-center mb-8">
               <p className="text-xs uppercase tracking-[0.4em] text-gray-500 mb-4 font-bold">Machine Confidence Signal</p>
               <div className={`text-9xl font-black mb-4 tracking-tighter ${foundScore > 75 ? 'text-emerald-400' : foundScore > 35 ? 'text-amber-400' : 'text-red-500'}`}>
                 {foundScore}%
               </div>
               
               <div className="w-full bg-white/5 h-4 rounded-full max-w-md mx-auto overflow-hidden border border-white/5">
                 <div 
                   className={`h-full transition-all duration-1000 ease-out ${foundScore > 75 ? 'bg-emerald-500' : foundScore > 35 ? 'bg-amber-500' : 'bg-red-500'}`}
                   style={{ width: `${foundScore}%` }}
                 />
               </div>
               
               <p className={`mt-8 text-xl font-bold uppercase tracking-widest ${foundScore > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                 {foundScore > 75 ? 'Status: High Entity Clarity' : 'Status: Discovery Gap Detected'}
               </p>
            </div>

            <div className={`rounded-2xl p-8 border ${status === 'machine-verified' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-2 tracking-tight">{result?.name}</h3>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                    {result?.description || "This entity lacks structured identity signals. AI models see 'Unstructured Noise' instead of a verified business fact."}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/60 p-5 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-2 font-bold">Machine Identity (MID)</span>
                      <code className="text-emerald-400 text-sm font-mono break-all">{result?.entityId || 'NONE_DETECTED'}</code>
                    </div>
                    <div className="bg-black/60 p-5 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 block mb-2 font-bold">Schema Classification</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result?.types && result.types.length > 0 ? (
                          result.types.slice(0, 2).map(t => (
                            <span key={t} className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-emerald-400 uppercase font-bold">{t}</span>
                          ))
                        ) : (
                          <span className="text-[10px] bg-red-500/10 border border-red-500/20 px-2 py-1 rounded text-red-400 uppercase font-bold">Unstructured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 bg-emerald-500 p-10 rounded-3xl text-black text-center shadow-[0_20px_50px_-15px_rgba(16,185,129,0.4)]">
                <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
                  <Zap className="fill-current w-10 h-10" /> CLOSE THE DISCOVERY GAP
                </h2>
                <p className="font-bold text-xl mb-8 opacity-90 max-w-xl mx-auto">
                  Your business is currently {(100 - foundScore).toFixed(0)}% Invisible to Answer Engines.
                </p>
                <a 
                  href="https://becomefoundbyai.com" 
                  className="inline-block bg-black text-white px-12 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-2xl uppercase tracking-widest"
                >
                  Get The AI Visibility Toolkit (£27)
                </a>
            </div>
          </div>
        )}

        {status === 'ai-invisible' && (
          <div className="text-center py-20 bg-[#111] border border-red-500/20 rounded-3xl">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6 opacity-50" />
            <h2 className="text-4xl font-black mb-4 uppercase">Entity: Invisible</h2>
            <p className="text-gray-400 text-xl max-w-md mx-auto mb-10">
              Zero record found for <span className="text-white font-bold">"{brandName}"</span>. You are 100% invisible to the machine-facing web.
            </p>
            <a href="https://becomefoundbyai.com" className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-wider">Initialize AI Presence</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
