import { useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, Radar, Globe, Fingerprint, FileText } from 'lucide-react';

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

  // STABLE MATH: Cap at 100, show raw 12% correctly
  const displayScore = result?.resultScore 
    ? Math.min(Math.round(result.resultScore < 1 ? result.resultScore * 100 : result.resultScore), 100) 
    : (status === 'ai-invisible' ? 0 : null);
  
  const isLowScore = displayScore !== null && displayScore < 50;

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
    <div className="min-h-screen bg-black text-white px-4 py-16 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Radar className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-5xl font-bold mb-2">Entity ID <span className="text-emerald-400">Searcher</span></h1>
          <p className="text-gray-400">AI Knowledge Graph Audit for Real Estate Agencies</p>
        </div>

        {/* Search Box */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8 shadow-2xl">
          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Truscott Property..."
              className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg outline-none focus:border-emerald-500"
            />
            <button type="submit" className="px-8 py-3 bg-emerald-500 text-black rounded-lg font-bold">Audit</button>
          </form>

          {status === 'loading' && <p className="text-center text-emerald-400">Intercepting AI Signals...</p>}

          {/* Visibility Score */}
          {displayScore !== null && status !== 'loading' && (
            <div className="text-center mb-12">
              <p className="text-gray-500 uppercase text-xs tracking-widest mb-2">Machine Confidence Score</p>
              <div className={`text-8xl font-bold ${isLowScore ? 'text-red-500' : 'text-emerald-400'}`}>
                {displayScore}%
              </div>
            </div>
          )}

          {/* The Checklist of Failure */}
          {status === 'machine-verified' && result && (
            <div className="space-y-4">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Entity Signal Analysis</h3>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Signal: Entity ID */}
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Unique Machine ID (MID)</span>
                  </div>
                  <span className={result.entityId ? "text-emerald-500 font-bold text-xs" : "text-red-500 font-bold text-xs"}>
                    {result.entityId ? "VERIFIED" : "UNASSIGNED"}
                  </span>
                </div>

                {/* Signal: Knowledge Description */}
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Categorical Description</span>
                  </div>
                  <span className={result.description ? "text-emerald-500 font-bold text-xs" : "text-red-500 font-bold text-xs"}>
                    {result.description ? "INDEXED" : "MISSING"}
                  </span>
                </div>

                {/* Signal: Official Website Link */}
                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-gray-800">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Official Website Association</span>
                  </div>
                  <span className={result.url ? "text-emerald-500 font-bold text-xs" : "text-red-500 font-bold text-xs"}>
                    {result.url ? "LINKED" : "UNLINKED"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* The Warning & Call to Action */}
        {status && status !== 'loading' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            {isLowScore && (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-left">
                <p className="text-red-500 font-bold flex items-center gap-2 mb-2 uppercase text-xs tracking-tighter">
                  <AlertCircle className="w-4 h-4" /> Critical Visibility Gap
                </p>
                <div className="space-y-2">
                  <p className="text-white text-sm">
                    Verified Location: <span className="text-red-500 font-mono font-bold">{result?.location || 'NOT INDEXED'}</span>
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Google identifies you as a topic, but lacks the structured data to verify you as a local business. 
                    This makes you invisible to "Real Estate Agents in <span className="italic underline">{result?.location || 'Edinburgh'}</span>" AI-driven searches.
                  </p>
                </div>
              </div>
            )}
            
            <h2 className="text-2xl font-bold mb-4">Fix Your Machine Identity</h2>
            <p className="text-gray-400 mb-8 text-sm max-w-md mx-auto">Your agency is missing core structured signals. Download the £27 Toolkit to generate the Schema DNA Google needs.</p>
            <button className="w-full py-4 bg-emerald-500 text-black rounded-lg font-bold text-lg hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              Claim the £27 Toolkit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
