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

  // REAL ESTATE CALIBRATED SCORING LOGIC
  const getFoundScore = () => {
    if (status === 'loading' || !result) return null;
    if (status === 'ai-invisible') return 0;

    // 1. NORMALIZE GOOGLE'S CONFIDENCE
    // We treat a resultScore of 600 as the 'Gold Standard' for 100% certainty.
    let baseScore = Math.min((result.resultScore / 600) * 100, 98);

    // 2. REAL ESTATE ENTITY AUDIT
    // We check if the AI sees them as a specific Real Estate professional vs a generic 'Thing'
    const isRealEstateEntity = result.types.some(t => 
      ['RealEstateAgent', 'RealEstateListing', 'HomeAndConstructionBusiness', 'Residence'].includes(t)
    );

    // 3. THE "ENTITY CLARITY" PENALTY
    // If they aren't recognized as Real Estate specifically, they are 'confused' in the graph.
    // We drop their score by 40% to reflect the "Trust Gap".
    if (!isRealEstateEntity) {
      baseScore = baseScore * 0.6;
    }

    // 4. AMBIGUITY CAP
    if (status === 'ambiguous') return Math.min(Math.round(baseScore), 45);

    return Math.round(baseScore);
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

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Cloud connection error: The server returned an invalid response.");
      }

      const data = await response.json();
      
      // LOG TO CONSOLE: This lets you verify the resultScore coming from Google
      console.log("AI Audit Data:", data);

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
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight uppercase">
              RE Estate <span className="text-emerald-neon">Entity Search</span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Does the Knowledge Graph see you as a Real Estate authority, or just a generic 'Thing'?
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 shadow-2xl">
            <form onSubmit={handleSearch} className="mb-0">
              <label htmlFor="brandName" className="block text-sm font-bold text-emerald-neon uppercase tracking-widest mb-3">
                Agency Name Audit
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  id="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Niksen Property"
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

            {/* Results Display */}
            {foundScore !== null && status !== 'loading' && (
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="text-center mb-10">
                  <p className="text-white/40 text-xs uppercase font-black tracking-[0.3em] mb-4">AI Entity Confidence</p>
                  <div className={`text-8xl font-black transition-all ${isHighScore ? 'text-emerald-neon' : isLowScore ? 'text-amber-400' : 'text-white'}`}>
                    {foundScore}%
                  </div>
                  <div className="max-w-md mx-auto h-2 bg-white/5 rounded-full mt-6 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ease-out ${isHighScore ? 'bg-emerald-neon' : isLowScore ? 'bg-amber-400' : 'bg-white/30'}`} style={{ width: `${foundScore}%` }} />
                  </div>
                </div>

                {/* Machine-Verified (High or Low Confidence) */}
                {status === 'machine-verified' && result && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <CheckCircle className={`w-10 h-10 shrink-0 ${isHighScore ? 'text-emerald-neon' : 'text-amber-400'}`} />
                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-white mb-2">{result.name}</h3>
                        <div className="mb-6">
                           <p className="text-white/40 text-[10px] font-black uppercase mb-2">Entity Classification</p>
                           <div className="flex flex-wrap gap-2">
                            {result.types.map((type, i) => (
                              <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[11px] font-bold text-white/60 lowercase">{type}</span>
                            ))}
                          </div>
                        </div>
                        {foundScore < 70 && (
                          <div className="p-4 bg-amber-400/10 border border-amber-400/30 rounded-xl">
                            <p className="text-amber-400 font-bold text-sm">Critical Gap Detected: Low Niche Specificity</p>
                            <p className="text-white/70 text-sm mt-1">The Knowledge Graph sees you, but lacks the confidence to categorize you as a 'RealEstateAgent'. This causes AI agents to bypass you for niche queries.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Invisible State */}
                {status === 'ai-invisible' && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                    <div className="flex items-start gap-6">
                      <XCircle className="w-10 h-10 text-red-500 shrink-0" />
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase">Status: AI-Invisible</h3>
                        <p className="text-white/60 leading-relaxed mb-6">No unique Machine-ID found. To AI models like ChatGPT, this brand does not exist as a verified entity.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Call to Action */}
          {status && status !== 'loading' && (
            <div className="bg-gradient-to-br from-emerald-neon to-emerald-800 rounded-3xl p-1 shadow-2xl">
              <div className="bg-black/90 rounded-[calc(1.5rem-1px)] p-10 text-center">
                <h2 className="text-3xl font-black mb-4 uppercase">Fix Your <span className="text-emerald-neon">Entity Signal</span></h2>
                <p className="text-white/60 mb-8 max-w-xl mx-auto">Get the <strong>Developer Handoff Manifest</strong>. A ready-to-use JSON-LD file for your web team that fixes your Knowledge Graph categorization.</p>
                <a href="https://go.becomefoundbyai.com/audit-results" target="_blank" rel="noopener noreferrer">
                  <button className="px-10 py-5 bg-emerald-neon text-black rounded-xl font-black text-lg hover:shadow-[0_0_30px_rgba(5,255,161,0.4)] transition-all">Download Real Estate Toolkit — £27</button>
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
