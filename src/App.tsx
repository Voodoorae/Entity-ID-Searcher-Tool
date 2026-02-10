import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Radar, ChevronRight } from 'lucide-react';

interface EntityResult {
  name: string;
  entityId?: string;
  types: string[];
  description?: string;
  url?: string;
}

type Status = 'machine-verified' | 'ambiguous' | 'ai-invisible' | 'loading' | 'error' | null;

function App() {
  const [brandName, setBrandName] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [result, setResult] = useState<EntityResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showScanLine, setShowScanLine] = useState(false);

  const getFoundScore = () => {
    if (status === 'machine-verified') return 95;
    if (status === 'ambiguous') return 45;
    if (status === 'ai-invisible') return 0;
    return null;
  };

  const foundScore = getFoundScore();
  const isHighScore = foundScore !== null && foundScore > 70;
  const isLowScore = foundScore !== null && foundScore < 50;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    setIsSearching(true);
    setStatus('loading');
    setResult(null);
    setErrorMessage('');
    setShowScanLine(true);

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

      // Check for non-JSON responses (prevents the "Unexpected Token T" crash)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Cloud connection error: The server returned an invalid response. This usually happens if the search engine times out.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete the audit. Please try again.');
      }

      if (data.status === 'machine-verified') {
        setStatus('machine-verified');
        setResult(data.result);
      } else if (data.status === 'ambiguous') {
        setStatus('ambiguous');
        setResult(data.result);
      } else {
        setStatus('ai-invisible');
      }
    } catch (error) {
      setStatus('error');
      // Clean up the error message for the user
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(msg.includes('Unexpected token') ? 'The search engine returned an unreadable format. Try a more specific brand name.' : msg);
    } finally {
      setIsSearching(false);
      setShowScanLine(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-black text-white selection:bg-emerald-neon/30">
      {showScanLine && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="w-full h-1 bg-emerald-neon/20 shadow-[0_0_15px_rgba(5,255,161,0.5)] animate-scan" />
        </div>
      )}

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-6">
              <Radar className={`w-14 h-14 text-emerald-neon ${isSearching ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
              The Entity ID <span className="text-emerald-neon drop-shadow-[0_0_10px_rgba(5,255,161,0.4)]">Searcher</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Audit how AI perceives your brand. If you don't have a Machine-Readable ID, you don't exist in the Knowledge Graph.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 shadow-2xl">
            <form onSubmit={handleSearch} className="mb-0">
              <label htmlFor="brandName" className="block text-sm font-bold text-emerald-neon uppercase tracking-widest mb-3">
                Brand Name Audit
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  id="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Annan Property"
                  className="flex-1 px-6 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-emerald-neon focus:ring-1 focus:ring-emerald-neon outline-none text-white placeholder-white/20 transition-all text-lg"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !brandName.trim()}
                  className="px-8 py-4 bg-emerald-neon text-black rounded-xl font-black hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(5,255,161,0.3)]"
                >
                  {isSearching ? (
                    <>Scanning...</>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Run Audit
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center py-20">
                <div className="relative inline-block">
                  <div className="w-20 h-20 border-4 border-emerald-neon/20 border-t-emerald-neon rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-emerald-neon rounded-full animate-ping"></div>
                  </div>
                </div>
                <p className="mt-8 text-emerald-neon font-mono tracking-tighter animate-pulse">INTERCEPTING SIGNALS FROM KNOWLEDGE VAULT...</p>
              </div>
            )}

            {/* Results Display */}
            {foundScore !== null && status !== 'loading' && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="text-center mb-10">
                  <p className="text-white/40 text-xs uppercase font-black tracking-[0.3em] mb-4">AI Visibility Score</p>
                  <div className={`text-8xl font-black transition-all ${isHighScore ? 'text-emerald-neon drop-shadow-[0_0_20px_rgba(5,255,161,0.5)]' : isLowScore ? 'text-amber-400' : 'text-white'}`}>
                    {foundScore}%
                  </div>
                  <div className="max-w-md mx-auto h-2 bg-white/5 rounded-full mt-6 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${isHighScore ? 'bg-emerald-neon' : isLowScore ? 'bg-amber-400' : 'bg-white/30'}`}
                      style={{ width: `${foundScore}%` }}
                    />
                  </div>
                </div>

                {/* Verified State */}
                {status === 'machine-verified' && result && (
                  <div className="bg-emerald-neon/5 border border-emerald-neon/30 rounded-2xl p-6 md:p-8">
                    <div className="flex items-start gap-6">
                      <CheckCircle className="w-10 h-10 text-emerald-neon shrink-0" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <h3 className="text-3xl font-black text-white">{result.name}</h3>
                          <span className="px-3 py-1 bg-emerald-neon text-black text-[10px] font-black rounded-md tracking-tighter">MACHINE-VERIFIED</span>
                        </div>
                        {result.entityId && (
                          <div className="mb-6 group">
                            <p className="text-white/40 text-[10px] font-black uppercase mb-2">Knowledge Graph ID</p>
                            <code className="block bg-black/60 p-4 rounded-lg border border-white/10 text-emerald-neon font-mono text-sm break-all group-hover:border-emerald-neon/50 transition-colors">
                              {result.entityId}
                            </code>
                          </div>
                        )}
                        {result.description && (
                          <p className="text-white/70 leading-relaxed mb-6 italic border-l-2 border-emerald-neon pl-4">"{result.description}"</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {result.types.map((type, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-bold text-white/60">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ambiguous State */}
                {status === 'ambiguous' && (
                  <div className="bg-amber-400/5 border border-amber-400/30 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <AlertCircle className="w-10 h-10 text-amber-400 shrink-0" />
                      <div>
                        <h3 className="text-2xl font-black text-amber-400 mb-2">Entity Ambiguity Detected</h3>
                        <p className="text-white/80 mb-6">AI models find multiple references for this name. Without a unique ID, your brand authority is being diluted by similar topics or locations.</p>
                        {result && <p className="text-sm font-bold text-white mb-4">Closest Match: <span className="text-amber-400">{result.name}</span></p>}
                        <button className="text-amber-400 text-sm font-black flex items-center gap-2 hover:underline">
                          How to disambiguate your brand <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invisible State (Tailored for clients like Annan Property) */}
                {status === 'ai-invisible' && (
                  <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <XCircle className="w-10 h-10 text-white/40 shrink-0" />
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2">Status: AI-Invisible</h3>
                        <p className="text-white/60 leading-relaxed mb-6">
                          No unique Knowledge Graph ID found for "{brandName}". Despite physical history or SEO rankings, this brand has not been translated into a machine-readable entity. To an AI agent, you are "unstructured data."
                        </p>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 inline-block">
                          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Impact</p>
                          <p className="text-sm text-emerald-neon font-bold">ChatGPT and Gemini cannot confidently cite this brand as a factual entity.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
              <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-500 mb-1">Audit Interrupted</h4>
                  <p className="text-red-200/70 text-sm leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Call to Action - Only show if audit has been run */}
          {status && status !== 'loading' && (
            <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-neon to-emerald-800 rounded-3xl p-1 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="bg-black/90 rounded-[calc(1.5rem-1px)] p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-neon/50 to-transparent"></div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 italic">
                  FIX THE <span className="text-emerald-neon underline decoration-2 underline-offset-8">TRUST GAP</span>
                </h2>
                <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                  Turn your website into a verified Knowledge Source. Get the <strong>Found By AI Toolkit</strong> and claim your Entity ID today.
                </p>
                <button className="px-10 py-5 bg-emerald-neon text-black rounded-xl font-black text-lg hover:shadow-[0_0_30px_rgba(5,255,161,0.4)] transition-all">
                  Get The Visibility Toolkit — £27
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
