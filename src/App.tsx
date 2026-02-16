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

  // BRUTAL MATH: No defaults. Only shows what the API actually sends.
  const foundScore = result?.resultScore ? Math.min(Math.round(result.resultScore * 100), 100) : (status === 'ai-invisible' ? 0 : null);
  const isLowScore = foundScore !== null && foundScore < 50;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    setIsSearching(true);
    setStatus('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: brandName }),
      });
      const data = await response.json();
      
      if (data.status === 'machine-verified' || data.status === 'ambiguous') {
        setStatus(data.status);
        setResult(data.result);
      } else {
        setStatus('ai-invisible');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Audit failed.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Radar className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-5xl font-bold mb-2">Entity ID <span className="text-emerald-400">Searcher</span></h1>
          <p className="text-gray-400">Audit how AI perceives your real estate authority</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Agency Name..."
              className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-8 py-3 bg-emerald-500 text-black rounded-lg font-bold">Audit</button>
          </form>

          {status === 'loading' && <p className="text-center text-emerald-400">Querying Knowledge Graph...</p>}

          {foundScore !== null && status !== 'loading' && (
            <div className="text-center mb-8">
              <p className="text-gray-500 uppercase text-xs tracking-widest mb-2">AI Visibility Score</p>
              <div className={`text-7xl font-bold ${isLowScore ? 'text-red-500' : 'text-emerald-400'}`}>
                {foundScore}%
              </div>
            </div>
          )}

          {status === 'machine-verified' && result && (
            <div className="border border-emerald-500/30 bg-emerald-500/5 p-6 rounded-xl">
              <h3 className="text-2xl font-bold text-emerald-400 mb-2">{result.name}</h3>
              <p className="text-gray-400 text-sm italic">{result.description || 'Record found in Knowledge Graph.'}</p>
            </div>
          )}
        </div>

        {status && status !== 'loading' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            {isLowScore && (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-left">
                <p className="text-red-500 font-bold flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" /> Critical Trust Gap
                </p>
                <div className="space-y-2">
                  <p className="text-white text-sm">
                    Verified Location: <span className="text-red-500 font-mono font-bold uppercase">{result?.location || 'UNKNOWN / NOT INDEXED'}</span>
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    AI models cannot confidently pinpoint your service area. You are currently invisible to "Agents in <span className="italic underline">{result?.location || 'Your City'}</span>" queries.
                  </p>
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-4">Secure Your AI Authority</h2>
            <button className="w-full py-4 bg-emerald-500 text-black rounded-lg font-bold text-lg">
              Claim the £27 Toolkit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
