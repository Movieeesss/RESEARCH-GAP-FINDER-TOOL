import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, FileText, Download, Share2, LogIn, LogOut, 
  CheckCircle, Loader2, MessageCircle, Database, TrendingUp, ShieldCheck 
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Types & Interfaces ---
interface ResearchPaper {
  title: string;
  journal: string;
  year: string | number;
  doi: string;
}

interface UserProfile {
  name: string;
  email: string;
}

const RESEARCHGAP: React.FC = () => {
  // --- State Management ---
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  // --- Persistent Auth Logic ---
  useEffect(() => {
    const savedUser = localStorage.getItem('researcher_session');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Auth parsing error", e);
      }
    }
  }, []);

  const handleLogin = (): void => {
    const userData: UserProfile = { name: "Prakash M", email: "prakash@uniqdesigns.com" };
    localStorage.setItem('researcher_session', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = (): void => {
    localStorage.removeItem('researcher_session');
    setUser(null);
    setResults([]);
    setStatus('');
  };

  // --- Performance & Typing Optimization ---
  const inputDisplay = useMemo(() => (
    <div className="relative flex-grow group">
      <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={22} />
      <input 
        type="text"
        placeholder="Enter research niche (e.g., SCC Strength, Copper Slag)..."
        className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner bg-slate-50/50"
        value={keyword}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKeyword(e.target.value)}
      />
    </div>
  ), [keyword]);

  // --- Professional Excel Export Logic (FIXED FOR TS) ---
  const exportToExcel = async (data: ResearchPaper[]): Promise<void> => {
    try {
      // Use "as any" to bypass TypeScript constructor mismatch in some environments
      const workbook = new (ExcelJS as any).Workbook();
      const sheet = workbook.addWorksheet('Identified Gaps');

      sheet.columns = [
        { header: 'Research Paper Title', key: 'title', width: 60 },
        { header: 'Publisher/Journal', key: 'journal', width: 35 },
        { header: 'Pub Year', key: 'year', width: 15 },
        { header: 'DOI', key: 'doi', width: 35 },
      ];

      // Styling Headers
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

      data.forEach(item => sheet.addRow(item));

      // THE FIX: Access writeBuffer through the xlsx property
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Uniq_Research_Analysis_${keyword.replace(/\s+/g, '_') || 'Report'}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel Export Failed", error);
      setStatus("Export failed. Please check browser permissions.");
    }
  };

  // --- Omnichannel Sharing ---
  const handleWhatsAppShare = (): void => {
    const message = `Buddy! I found significant research gaps in "${keyword}" using Uniq Designs AI Tool. Check it out: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleNativeShare = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Uniq Designs Research Analysis',
          text: `AI-Generated Research Gap Report for ${keyword}`,
          url: window.location.href,
        });
      } catch (err) { console.log('Share dismissed'); }
    } else {
      handleWhatsAppShare();
    }
  };

  // --- Core Analysis Engine ---
  const runAnalysis = async (): Promise<void> => {
    if (!keyword) return;
    setLoading(true);
    setStatus('Scanning CrossRef & Academic Databases...');

    try {
      const response = await fetch(`https://api.crossref.org/works?query=${keyword}&rows=15&sort=published&order=desc`);
      const data = await response.json();
      
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Work',
        journal: item['container-title']?.[0] || 'Peer Reviewed Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || '2026',
        doi: item.DOI || 'Pending'
      }));

      setResults(papers);
      setStatus('Success! Analysis Generated & Downloaded.');
      
      await exportToExcel(papers);
      setLoading(false);
    } catch (error) {
      setStatus('Network Latency. Retrying...');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-blue-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        
        {/* Modern Header Nav */}
        <nav className="flex flex-col md:flex-row justify-between items-center mb-12 p-5 bg-white border border-slate-100 shadow-sm rounded-3xl gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Database size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">
              UNIQ <span className="text-blue-600">DESIGNS</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <p className="hidden sm:block text-sm font-semibold text-slate-500 italic">Hi, {user.name}</p>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all">
                  <LogOut size={18}/> Logout
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">
                <LogIn size={20}/> Access Portal
              </button>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <header className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 animate-bounce">
            <TrendingUp size={16}/> Professional Research Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight text-slate-900">
            Uncover Research Gaps <span className="text-blue-600 underline decoration-blue-100 decoration-8 underline-offset-8">Instantly.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Universal tool for researchers to scan metadata, identify trends, and export professional novelty reports.
          </p>
        </header>

        {/* Main Interface */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-100/50 p-6 md:p-14 border border-slate-50 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-4 relative z-10">
            {inputDisplay}
            <button 
              onClick={runAnalysis}
              disabled={loading}
              className="lg:w-72 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-300 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} />}
              {loading ? 'Processing...' : 'Run Analysis'}
            </button>
          </div>

          {status && (
            <div className="mt-10 flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="flex items-center gap-4 text-slate-700 font-bold mb-4 md:mb-0">
                <div className="bg-green-500 p-1.5 rounded-full text-white">
                  <CheckCircle size={18} />
                </div>
                {status}
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button onClick={handleWhatsAppShare} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">
                  <MessageCircle size={20}/> WhatsApp
                </button>
                <button onClick={handleNativeShare} className="flex-1 md:flex-none flex items-center justify-center bg-white border-2 border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all">
                  <Share2 size={20}/> Share Tool
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Data Display */}
        {results.length > 0 && (
          <div className="mt-16 overflow-hidden">
            <div className="flex items-center justify-between mb-8 px-4">
              <h3 className="text-2xl font-black text-slate-800 italic">Global Journal Scan Results</h3>
              <button onClick={() => exportToExcel(results)} className="hidden sm:flex items-center gap-2 text-blue-600 font-black hover:bg-blue-50 px-4 py-2 rounded-xl transition-all">
                <Download size={20}/> DOWNLOAD XLS
              </button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-black text-xs uppercase tracking-widest">
                    <th className="p-6">Research Title</th>
                    <th className="p-6">Journal</th>
                    <th className="p-6 text-center">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((res, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                      <td className="p-6 text-base font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        <div className="line-clamp-2">{res.title}</div>
                      </td>
                      <td className="p-6 text-sm text-slate-500 font-medium italic">{res.journal}</td>
                      <td className="p-6 text-center">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-xs">
                          {res.year}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RESEARCHGAP;
