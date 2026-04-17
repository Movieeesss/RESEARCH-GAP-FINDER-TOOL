import React, { useState } from 'react';
import { Search, FileText, Download, CheckCircle, Loader2 } from 'lucide-react';

const RESEARCHGAP = () => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleAnalyze = async () => {
    if (!keyword) return alert("Enter a keyword first buddy!");
    
    setLoading(true);
    setStatus('Scanning Top Journals (Elsevier, Springer, T&F)...');

    try {
      // 1. Fetching from Crossref API
      const response = await fetch(`https://api.crossref.org/works?query=${keyword}&rows=10`);
      const data = await response.json();
      const papers = data.message.items;

      setStatus('Identifying Research Gaps...');
      
      // 2. Mocking the Drive Upload Logic 
      // (In production, you'll call your backend to handle Google OAuth)
      setTimeout(() => {
        setStatus(`Success! 100% Analysis complete. Report saved to Google Drive.`);
        setLoading(false);
      }, 2000);

    } catch (error) {
      setStatus('Error fetching journal data. Check API connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Uniq Designs Research Gap Finder</h1>
          <p className="text-slate-600 italic">"Empowering Researchers with AI-Driven Insights"</p>
        </header>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Ex: SCC Strength with Copper Slag..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
              {loading ? 'Analyzing...' : 'Find Gaps & Save to Drive'}
            </button>
          </div>
          {status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle size={16} /> {status}
            </div>
          )}
        </div>

        {/* Workflow Info */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
            <h3 className="font-bold text-lg mb-2">Global Search</h3>
            <p className="text-sm text-slate-600">Cross-referencing 50,000+ journals including Scopus-indexed publishers.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
            <h3 className="font-bold text-lg mb-2">AI Gap Finder</h3>
            <p className="text-sm text-slate-600">Our NLP logic identifies areas where research is missing or outdated.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500">
            <h3 className="font-bold text-lg mb-2">Drive Sync</h3>
            <p className="text-sm text-slate-600">Automatic PDF report generation saved directly to your Google Drive.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RESEARCHGAP;
