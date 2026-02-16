import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Radar } from 'lucide-react';

interface EntityResult {
  name: string;
  entityId?: string;
  types: string[];
  description?: string;
  url?: string;
  resultScore?: number;
  location?: string;
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
    if (status === 'ai-invisible') return 0;
    if (!result || !result.resultScore) {
      if (status === 'machine-verified') return 70;
      if (status === 'ambiguous') return 30;
      return null;
    }
    // Converts decimal (0.59) to percentage (59%)
    return Math.min(Math.round(result.resultScore * 100), 100);
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search');
      }

      if (data.status === 'machine-verified' || data.status === 'ambiguous') {
        setStatus(data.status);
        setResult(data.result);
      } else {
        setStatus('ai-invisible');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSearching(false);
      setShowScanLine(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-black overflow-hidden">
      {showScanLine && (
        <div className="scan-overlay">
          <div className="scan-line" />
        </div>
      )}

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-4">
              <Radar className="w-12 h-12 emerald-glow animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-6xl font-bold mb-4">
              The Entity ID <span className="emerald-glow">Searcher</span>
            </h1>
            <p className="text-xl text-white/70">
              Audit how AI perceives your brand in the knowledge graph
            </p>
          </div>

          <div className="glassmorphism glow-border rounded-2xl p-8 mb-8">
            <form onSubmit={handleSearch} className="mb-8">
              <label htmlFor="brandName" className="block text-sm font-medium text-white/90 mb-3">
                Brand Name
              </label>
              <div className="flex gap-3">
                <input
                  id="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter brand name..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-emerald-neon/30 rounded-lg focus:border-emerald-neon focus:ring-2 focus:ring-emerald-neon/50 outline-none text-white placeholder-white/40 transition-all"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !brandName.trim()}
                  className="px-6 py-3 bg-emerald-neon text-space-black rounded-lg font-bold hover:bg-emerald-neon/90 disabled:bg-white/20 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-emerald-neon/30"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? 'Intercepting Signals...' : 'Audit'}
                </button>
              </div>
            </form>

            {status === 'loading' && (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-2 border-emerald-neon/30 border-t-emerald-neon"></div>
                <p className="mt-6 text-white/70 text-lg">Scanning knowledge graph...</p>
              </div>
            )}

            {foundScore !== null && status !== 'loading' && (
              <div className="mb-8">
                <div className="text-center mb-6">
                  <p className="text-white/60 text-sm uppercase tracking-widest mb-3">AI Visibility Score</p>
                  <div className={`text-7xl font-bold transition-all ${isHighScore ? 'emerald-glow' : isLowScore ? 'text-amber-400' : 'text-white'}`}>
                    {foundScore}%
                  </div>
                  <div className="h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isHighScore ? 'bg-emerald-neon' : isLowScore ? 'bg-amber-400' : 'bg-white/30'}`}
                      style={{ width: `${foundScore}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {status === 'machine-verified' && result && (
              <div className="glassmorphism border-emerald-neon/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 emerald-glow flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-3xl font-bold text-emerald-neon">{result.name}</h3>
                      <span className="px-3 py-1 bg-emerald-neon/20 text-emerald-neon text-sm font-bold rounded-full border border-emerald-neon/50">
                        MACHINE-VERIFIED
                      </span>
                    </div>
                    {result.entityId && (
                      <div className="mb-4">
                        <p className="text-white/60 text-sm font-medium mb-2">Entity ID</p>
                        <p className="text-lg font-mono text-emerald-neon bg-white/5 px-4 py-3 rounded border border-emerald-neon/30 break-all">
                          {result.entityId}
                        </p>
                      </div>
                    )}
                    {result.description && <p className="text-white/70 mb-4">{result.description}</p>}
                    {result.types.length > 0 && (
                      <div>
                        <p className="text-white/60 text-sm font-medium mb-3">Entity Types</p>
                        <div className="flex flex-wrap gap-2">
                          {result.types.map((type, index) => (
                            <span key={index} className="px-3 py-1 bg-emerald-neon/10 text-emerald-neon text-sm rounded-full border border-emerald-neon/30">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {status === 'ambiguous' && (
              <div className="glassmorphism border-amber-400/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-amber-400 mb-3">Status: Ambiguous</h3>
                    <p className="text-lg text-amber-300 font-medium mb-3">AI sees you as a topic, not a brand.</p>
                    {result && (
                      <p className="text-white/70 mb-4">Found: <span className="font-semibold text-white">{result.name}</span></p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {status === 'ai-invisible' && (
              <div className="glassmorphism border-white/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-8 h-8 text-white/60 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">Status: AI-Invisible</h3>
                    <p className="text-lg text-white/70">No entity found in the knowledge graph for "{brandName}".</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="glassmorphism border-red-500/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-500 mb-2">Error</h3>
                    <p className="text-red-400">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {status && status !== 'loading' && (
            <div className="glassmorphism glow-border rounded-2xl p-8 text-center">
              {foundScore !== null && foundScore < 50 && (
                <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-left">
                  <p className="text-red-400 font-bold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    Critical Trust Gap Identified
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Your data signals are too weak for AI models to confidently categorize you as a Real Estate Agency. 
                    You are currently invisible to "Agents in <span className="text-emerald-neon font-bold">{result?.location || 'your area'}</span>" queries.
                  </p>
                </div>
              )}
              
              <h2 className="text-3xl font-bold mb-3">
                Secure your Entity Clarity with the <span className="emerald-glow">Found By AI</span> Toolkit
              </h2>
              <p className="text-white/70 mb-8">
                Get the intelligence you need to establish and maintain your brand's presence in AI knowledge graphs.
              </p>
              <button className="px-12 py-4 bg-emerald-neon text-space-black rounded-lg font-bold hover:bg-emerald-neon/90 transition-all shadow-lg shadow-emerald-neon/30 text-lg">
                Claim the £27 Toolkit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
