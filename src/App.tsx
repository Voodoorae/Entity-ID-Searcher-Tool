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

function App() {
  const [brandName, setBrandName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<EntityResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // NUCLEAR FIX: We are strictly multiplying the raw score by 100. 
  // If Google says 0.05, it MUST show 5. No defaults allowed.
  const rawScore = result?.resultScore ? Math.round(result.resultScore * 100) : (status === 'ai-invisible' ? 0 : null);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    setIsSearching(true);
    setStatus('loading');
    setResult(null);

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
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Radar className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-4xl font-bold">Entity ID <span className="text-emerald-400">Searcher</span></h1>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Agency Name..."
              className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg outline-none"
            />
            <button type="submit" className="px-6 py-3 bg-emerald-500 text-black rounded-lg font-bold">Audit</button>
          </form>

          {status === 'loading' && <p className="text-center text-emerald-400">Scanning...</p>}

          {rawScore !== null && status !== 'loading' && (
            <div className="text-center mb-8">
              <p className="text-gray-500 text-xs uppercase mb-2">Confidence Score</p>
              <div className={`text-7xl font-bold ${rawScore < 50 ? 'text-red-500' : 'text-emerald-400'}`}>
                {rawScore}%
              </div>
            </div>
          )}
        </div>

        {status && status !== 'loading' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
             <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 font-bold mb-1">Critical Trust Gap</p>
                <p className="text-white text-sm mb-2 uppercase font-mono">
                  Location: <span className="text-red-500">{result?.location || 'UNKNOWN / NOT INDEXED'}</span>
                </p>
                <p className="text-gray-400 text-sm italic">
                  "Invisible to 'Agents in {result?.location || 'Edinburgh'}' AI queries."
                </p>
              </div>
            <button className="w-full py-4 bg-emerald-500 text-black rounded-lg font-bold">Claim Toolkit</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
