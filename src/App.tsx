import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Radar, ChevronRight, Info } from 'lucide-react';

interface EntityResult {
  name: string;
  entityId?: string;
  types: string[];
  description?: string;
  url?: string;
  resultScore: number;
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
  if (status === 'loading' || !result) return null;
  if (status === 'ai-invisible') return 0;

  // 1. Normalize Google's resultScore (Confidence)
  // Most local businesses sit between 10 and 500. 
  // We'll treat 600 as the "Gold Standard" for 100% confidence.
  let baseScore = Math.min((result.resultScore / 600) * 100, 98);

  // 2. Real Estate Specific Audit
  // We check if the AI recognizes them as a RealEstateAgent or ProfessionalService
  const isRealEstateEntity = result.types.some(t => 
    ['RealEstateAgent', 'RealEstateListing', 'HomeAndConstructionBusiness'].includes(t)
  );

  // 3. The "Legacy Tech" Penalty
  // If the machine only sees them as a generic "Organization" or "Thing", 
  // they are invisible to "Agents near me" queries.
  if (!isRealEstateEntity) {
    baseScore = baseScore * 0.6; // 40% reduction for lack of niche clarity
  }

  // 4. Cap the results for the "Trust Gap"
  // Even a well-known agent without proper Schema shouldn't exceed 65%
  return Math.round(baseScore);
};

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Cloud connection error: The server returned an invalid response.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete the audit.');
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
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(msg);
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
                  placeholder="e.g. L'alba D'oro"
                  className="flex-1 px-6 py-4 bg-black/40 border border-white/10 rounded-xl focus:border-emerald-neon focus:ring-1 focus:ring-emerald-neon outline-none text-white placeholder-white/20 transition-all text-lg"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !brandName.trim()}
                  className="px-8 py-4 bg-emerald-neon text-black rounded-xl font-black hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(5,255,161,0.3)]"
                >
                  {isSearching ? <>Scanning...</> : <><Search className="w-5 h-5" /> Run Audit</>}
                </button>
              </div>
            </form>

            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center py-20">
                <div className="w-20 h-20 border-4 border-emerald-neon/20 border-t-emerald-neon rounded-full animate-spin inline-block"></div>
                <p className="mt-8 text-emerald-neon font-mono tracking-tighter animate-pulse uppercase">Intercepting signals from knowledge vault...</p>
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
                    <div className={`h-full transition-all duration-1000 ease-out ${isHighScore ? 'bg-emerald-neon' : isLowScore ? 'bg-amber-400' : 'bg-white/30'}`} style={{ width: `${foundScore}%` }} />
                  </div>
                </div>

                {/* Ambiguous State - FIXED VISIBILITY */}
                {status === 'ambiguous' && (
                  <div className="bg-amber-400/5 border border-amber-400/30 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <AlertCircle className="w-10 h-10 text-amber-400 shrink-0" />
                      <div>
                        <h3 className="text-2xl font-black text-amber-400 mb-2 uppercase tracking-tight">Machine Confusion Detected</h3>
                        <p className="text-white/80 mb-6 leading-relaxed">
                          The Knowledge Graph recognizes your name, but it is confused about your <strong>Entity Type</strong>. It sees you as a general topic or "Thing" rather than a verified business.
                        </p>
                        
                        {result && (
                          <div className="mb-6 p-6 bg-black/60 border border-amber-400/30 rounded-xl shadow-inner">
                            <p className="text-white/40 text-[10px] font-black uppercase mb-3 tracking-widest">Machine Classification</p>
                            <p className="text-xl text-white font-bold mb-4 italic">
                              Found as: <span className="text-amber-400">"{result.types.join(', ')}"</span>
                            </p>
                            
                            {/* ENHANCED READABILITY FOR THE WARNING LINE */}
                            <div className="flex items-start gap-2 pt-4 border-t border-white/10">
                              <Info className="w-5 h-5 text-emerald-neon shrink-0 mt-0.5" />
                              <p className="text-sm md:text-base text-white font-medium leading-snug">
                                <span className="text-emerald-neon font-bold">Action Required:</span> AI agents require a <span className="underline decoration-emerald-neon/50">'LocalBusiness'</span> or <span className="underline decoration-emerald-neon/50">'Organization'</span> type to confidently recommend you.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <a 
                          href="https://go.becomefoundbyai.com/audit-results" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-amber-400 text-sm font-black flex items-center gap-2 hover:underline group"
                        >
                          Run a Disambiguation Audit to claim your 'Business' status
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verified State */}
                {status === 'machine-verified' && result && (
                  <div className="bg-emerald-neon/5 border border-emerald-neon/30 rounded-2xl p-8 shadow-lg shadow-emerald-neon/5">
                    <div className="flex items-start gap-6">
                      <CheckCircle className="w-10 h-10 text-emerald-neon shrink-0" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <h3 className="text-3xl font-black text-white">{result.name}</h3>
                          <span className="px-3 py-1 bg-emerald-neon text-black text-[10px] font-black rounded-md tracking-tighter uppercase">Machine-Verified</span>
                        </div>
                        {result.entityId && (
                          <div className="mb-6 group">
                            <p className="text-white/40 text-[10px] font-black uppercase mb-2">Knowledge Graph ID</p>
                            <code className="block bg-black/60 p-4 rounded-lg border border-white/10 text-emerald-neon font-mono text-sm break-all group-hover:border-emerald-neon/50 transition-colors">
                              {result.entityId}
                            </code>
                          </div>
                        )}
                        {result.description && <p className="text-white/70 leading-relaxed mb-6 italic border-l-2 border-emerald-neon pl-4">"{result.description}"</p>}
                        <div className="flex flex-wrap gap-2">
                          {result.types.map((type, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-bold text-white/60 lowercase">{type}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invisible State */}
                {status === 'ai-invisible' && (
                  <div className="bg-white/5 border border-white/20 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <XCircle className="w-10 h-10 text-white/40 shrink-0" />
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase">Status: AI-Invisible</h3>
                        <p className="text-white/60 leading-relaxed mb-6">
                          No unique Knowledge Graph ID found for "{brandName}". Despite physical history or SEO rankings, this brand has not been translated into a machine-readable entity.
                        </p>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 inline-block">
                          <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Impact</p>
                          <p className="text-sm text-emerald-neon font-bold leading-tight">ChatGPT and Gemini cannot confidently cite this brand as a factual entity.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
              <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start gap-4 shadow-xl">
                <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-500 mb-1 uppercase tracking-wider">Audit Interrupted</h4>
                  <p className="text-red-200/70 text-sm leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Call to Action */}
          {status && status !== 'loading' && (
            <div className="relative group overflow-hidden bg-gradient-to-br from-emerald-neon to-emerald-800 rounded-3xl p-1 shadow-2xl transition-transform hover:scale-[1.01]">
              <div className="bg-black/90 rounded-[calc(1.5rem-1px)] p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-neon/50 to-transparent"></div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 italic uppercase tracking-tighter">Fix the <span className="text-emerald-neon underline decoration-2 underline-offset-8">Trust Gap</span></h2>
                <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto leading-relaxed">Turn your website into a verified Knowledge Source. Get the <strong>Found By AI Toolkit</strong> and claim your Entity ID today.</p>
                <a href="https://go.becomefoundbyai.com/audit-results" target="_blank" rel="noopener noreferrer" className="inline-block">
                  <button className="px-10 py-5 bg-emerald-neon text-black rounded-xl font-black text-lg hover:shadow-[0_0_30px_rgba(5,255,161,0.4)] transition-all uppercase tracking-widest">Get The Visibility Toolkit — £27</button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
