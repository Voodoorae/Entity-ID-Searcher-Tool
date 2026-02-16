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

  // REAL ESTATE CALIBRATED SCORING (Direct from Knowledge Graph)
  const getFoundScore = () => {
    if (status === 'loading' || !result) return null;
    if (status === 'ai-invisible') return 0;

    // 1. DIRECT KG SCORE NORMALIZATION
    // We treat a resultScore of 600 as a 'Perfect' 100% Signal.
    // Outdated sites usually return scores under 100, resulting in <15% visibility.
    let baseScore = Math.min((result.resultScore / 600) * 100, 98);

    // 2. REAL ESTATE NICHE AUDIT
    const isRealEstateEntity = result.types.some(t => 
      ['RealEstateAgent', 'RealEstateListing', 'HomeAndConstructionBusiness', 'Residence'].includes(t)
    );

    // 3. THE "ENTITY CLARITY" PENALTY
    // If Google sees them but doesn't know they are a Real Estate agency, 
    // we slash the score by 40% to reveal the "Trust Gap".
    if (!isRealEstateEntity) {
      baseScore = baseScore * 0.6;
    }

    if (status === 'ambiguous') return Math.min(Math.round(baseScore), 45);

    return Math.max(Math.round(baseScore), 5); // Minimum 5% if found
  };

  const foundScore = getFoundScore();
  const isHighScore = foundScore !== null && foundScore > 75;
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
      console.log("Raw Knowledge Graph Data:", data); // Debugging

      if (!response.ok) throw new Error(data.error || 'Audit Failed');

      if (data.status === 'machine-verified' || data.status === 'ambiguous') {
        setStatus(data.status);
        setResult(data.result);
      } else {
        setStatus('ai-invisible');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection Error');
    } finally {
      setIsSearching(false);
      setShowScanLine(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans">
      {showScanLine && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="w-full h-1 bg-emerald-400/20 shadow-[0_0_15px_rgba(5,255,161,0.5)] animate-scan" />
        </div>
      )}

      <div className="container mx-auto px-4 py-20 relative">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Radar className={`w-16 h-16 text-emerald-400 mx-auto mb-6 ${isSearching ? 'animate-spin' : ''}`} />
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4">
              Real Estate <span className="text-emerald-400">Entity Audit</span>
            </h1>
            <p className="text-gray-400 text-lg">Knowledge Graph Visibility for Property Professionals</p>
          </div>

          {/* Search */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-2 mb-10">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter Agency Name..."
                className="flex-1 px-8 py-5 bg-transparent outline-none text-xl border-none focus:ring-0 placeholder-white/20"
              />
              <button
                disabled={isSearching || !brandName.trim()}
                className="px-10 py-5 bg-emerald-400 text-black rounded-2xl font-black text-lg hover:bg-emerald-300 transition-all uppercase"
              >
                {isSearching ? 'Scanning...' : 'Audit Agency'}
              </button>
            </form>
          </div>

          {/* Results Area */}
          {status && status !== 'loading' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-12">
                <span className="text-[10px] font-bold tracking-[0.4em] text-gray-500 uppercase">AI Visibility Score</span>
                <div className={`text-9xl font-black mt-2 ${isHighScore ? 'text-emerald-400' : isLowScore ? 'text-amber-400' : 'text-red-500'}`}>
                  {foundScore}%
                </div>
              </div>

              {result && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <CheckCircle className="text-emerald-400 w-8 h-8" />
                    <h2 className="text-2xl font-bold">{result.name}</h2>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Knowledge Graph ID</p>
                      <code className="block bg-black p-4 rounded-xl border border-white/5 text-emerald-400 text-sm break-all">
                        {result.entityId || 'No machine-readable ID assigned'}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Machine Classification</p>
                      <div className="flex flex-wrap gap-2">
                        {result.types.map((t) => (
                          <span key={t} className="px-3 py-1 bg-white/10 rounded-md text-[10px] font-bold text-gray-300">{t}</span>
                        ))}
                      </div>
                    </div>

                    {isLowScore && (
                      <div className="flex gap-4 p-5 bg-amber-400/10 border border-amber-400/20 rounded-2xl">
                        <AlertCircle className="text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-100/80">
                          <strong className="text-amber-400">Critical Trust Gap:</strong> Your data signals are too weak for AI models to confidently categorize you as a Real Estate Agency. You are currently invisible to "Agents in [Your Area]" queries.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="bg-emerald-400 text-black rounded-3xl p-10 text-center">
                <h3 className="text-3xl font-black uppercase mb-4">Fix the Developer Gap</h3>
                <p className="font-bold mb-8 opacity-80">Download the Real Estate Entity Manifest: A technical JSON-LD file to hand directly to your web developers.</p>
                <a 
                  href="https://go.becomefoundbyai.com/audit-results" 
                  className="inline-block bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Get the Toolkit — £27
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
