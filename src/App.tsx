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
    if (!result || result.resultScore === undefined) {
      if (status === 'machine-verified') return 70;
      if (status === 'ambiguous') return 30;
      return null;
    }
    // Converts decimal (e.g. 0.05) to percentage (5%)
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
        // FORCE the location to 'Edinburgh' if the API doesn't find a specific city
        setResult({
          ...data.result,
          location: data.result.location || 'Edinburgh'
        });
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
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans">
      {showScanLine && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="w-full h-1 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan" />
        </div>
      )}

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center mb-4">
              <Radar className="w-12 h-12 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h1 className="text-6xl font-bold mb-4 tracking-tight">
              The Entity ID <span className="text-emerald-400 shadow-emerald-400">Searcher</span>
            </h1>
            <p className="text-xl text-gray-400">
              Audit how AI perceives your real estate brand
            </p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8 backdrop-blur-xl">
            <form onSubmit={handleSearch} className="mb-8">
              <label htmlFor="brandName" className="block text-sm font-medium text-gray-300 mb-3">
                Agency Name
              </label>
              <div className="flex gap-3">
                <input
                  id="brandName"
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Truscott Property..."
                  className="flex-1 px-4 py-3 bg-black/40 border border-emerald-500/30 rounded-lg focus:border-emerald-500 outline-none transition-all"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  disabled={isSearching || !brandName.trim()}
                  className="px-6 py-3 bg-emerald-500 text-black rounded-lg font-bold hover:bg-emerald-400 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? 'Scanning...' : 'Audit'}
                </button>
              </div>
            </form>

            {status === 'loading' && (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-2 border-emerald-500/30 border-t-emerald-500"></div>
                <p className="mt-6 text-gray-400 text-lg">Querying Knowledge Graph...</p>
              </div>
            )}

            {foundScore !== null && status !== 'loading' && (
              <div className="mb-8 text-center">
                <p className="text-gray-500 text-sm uppercase tracking-widest mb-3">AI Visibility Score</p>
                <div className={`text-7xl font-bold transition-all ${isHighScore ? 'text-emerald-400' : isLowScore ? 'text-red-500' : 'text-white'}`}>
                  {foundScore}%
                </div>
                <div className="h-2 bg-gray-800 rounded-full mt-6 max-w-md mx-auto overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${isHighScore ? 'bg-emerald-500' : isLowScore ? 'bg-red-500' : 'bg-gray-600'}`}
                    style={{ width: `${foundScore}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'machine-verified' && result && (
              <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-emerald-400 mb-2">{result.name}</h3>
                    <p className="text-gray-400 mb-4">{result.description || 'Verified Entity found in Google Knowledge Graph.'}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.types.map((type, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full border border-emerald-500/20">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {status === 'ai-invisible' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <XCircle className="w-8 h-8 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Status: AI-Invisible</h3>
                    <p className="text-gray-400">No machine-readable record found for "{brandName}".</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-500">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>{errorMessage}</p>
              </div>
            )}
          </div>

          {status && status !== 'loading' && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              {isLowScore && (
                <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                  <p className="text-red-500 font-bold flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    Critical Trust Gap Identified
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Your data signals are too weak for AI models to confidently categorize you as a Real Estate Agency. 
                    You are currently invisible to "Agents in <span className="text-emerald-400 font-bold">{result?.location || 'Edinburgh'}</span>" queries.
                  </p>
                </div>
              )}
              
              <h2 className="text-3xl font-bold mb-4">
                Establish Your <span className="text-emerald-400">AI Authority</span>
              </h2>
              <p className="text-gray-400 mb-8">
                Join the local agencies dominating the Knowledge Graph. Use our Toolkit to fix your Entity ID today.
              </p>
              <button className="px-12 py-4 bg-emerald-500 text-black rounded-lg font-bold hover:bg-emerald-400 transition-all text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
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
