import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, FileText, Download, Share2, LogIn, LogOut, 
  CheckCircle, Loader2, MessageCircle, Database, TrendingUp, ShieldCheck, BrainCircuit, Calendar
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Interfaces ---
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
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2015);
  const [toYear, setToYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(null);

  const GROQ_API_KEY = "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";

  useEffect(() => {
    const savedUser = localStorage.getItem('researcher_session');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = () => {
    const userData = { name: "Prakash M", email: "prakash@uniqdesigns.com" };
    localStorage.setItem('researcher_session', JSON.stringify(userData));
    setUser(userData);
  };

  const getAiInsights = async (papers: ResearchPaper[]) => {
    setStatus('AI is analyzing research gaps...');
    const paperSummary = papers.map(p => `- ${p.title} (${p.year})`).join('\n');
    
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a professional research consultant. Analyze titles and identify 3 specific research gaps." },
            { role: "user", content: `Based on these papers about "${keyword}":\n${paperSummary}\nIdentify gaps.` }
          ]
        })
      });
      const aiData = await response.json();
      setAiAnalysis(aiData.choices[0].message.content);
    } catch (err) {
      setAiAnalysis("AI analysis unavailable, but data is ready.");
    }
  };

  const exportToExcel = async (data: ResearchPaper[], aiInsight: string) => {
    try {
      // FIX: Accessing ExcelJS through a safe type cast for build
      const ExcelJSInstance = (ExcelJS as any).default || ExcelJS;
      const workbook = new (ExcelJSInstance as any).Workbook();
      const sheet = workbook.addWorksheet('Research Analysis');

      sheet.addRow(['AI Research Gap Analysis Report']).font = { bold: true, size: 14 };
      sheet.addRow([`Keyword: ${keyword} | Range: ${fromYear}-${toYear}`]);
      sheet.addRow([]);
      
      aiInsight.split('\n').forEach(line => sheet.addRow([line]));
      sheet.addRow([]);

      const headerRow = sheet.addRow(['Title', 'Journal', 'Year', 'DOI']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

      data.forEach(p => sheet.addRow([p.title, p.journal, p.year, p.doi]));

      sheet.columns = [{ width: 50 }, { width: 30 }, { width: 10 }, { width: 30 }];

      // THE CRITICAL FIX: Direct xlsx access
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Uniq_Research_${keyword.replace(/\s+/g, '_')}.xlsx`;
      link.click();
    } catch (e) {
      console.error("Export Error", e);
    }
  };

  const runAnalysis = async () => {
    if (!keyword) return;
    setLoading(true);
    setResults([]);
    setAiAnalysis('');
    setStatus('Scanning Databases...');

    try {
      const response = await fetch(`https://api.crossref.org/works?query=${keyword}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=40&sort=published&order=desc`);
      const data = await response.json();
      
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'N/A',
        journal: item['container-title']?.[0] || 'N/A',
        year: item.created?.['date-parts']?.[0]?.[0] || fromYear,
        doi: item.DOI || 'N/A'
      }));

      setResults(papers);
      await getAiInsights(papers);
      setStatus('Success! AI Analysis & Excel Ready.');
      setLoading(false);
    } catch (error) {
      setStatus('Search Error. Try later.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex justify-between items-center mb-8 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 font-black text-xl">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Database size={22} /></div>
            UNIQ <span className="text-blue-600">DESIGNS</span>
          </div>
          {user ? (
            <button onClick={() => setUser(null)} className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl">Logout</button>
          ) : (
            <button onClick={handleLogin} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Researcher Login</button>
          )}
        </nav>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4">AI Research <span className="text-blue-600">Gap Finder</span></h1>
          <p className="text-slate-500 font-medium italic">Universal AI Problem Solver v2.0</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 mb-10 border border-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-4 text-slate-400" size={20}/>
              <input 
                type="text"
                placeholder="Ex: Magnesium Silicate in Concrete..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            
            <div className="flex items-center bg-slate-50 rounded-2xl px-4 border-2 border-slate-100">
              <Calendar size={18} className="text-slate-400 mr-2"/>
              <select className="bg-transparent py-4 outline-none text-xs font-bold" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                {[2010, 2015, 2020, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="mx-2 text-slate-300">to</span>
              <select className="bg-transparent py-4 outline-none text-xs font-bold" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <button onClick={runAnalysis} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin"/> : <BrainCircuit/>}
              {loading ? 'Analyzing...' : 'AI Analysis'}
            </button>
          </div>

          {status && (
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-700 font-bold flex items-center justify-between">
              <div className="text-sm flex items-center gap-2"><CheckCircle size={18}/> {status}</div>
              {results.length > 0 && <button onClick={() => exportToExcel(results, aiAnalysis)} className="bg-white px-4 py-2 rounded-xl text-xs shadow-sm hover:bg-slate-50"><Download size={14} className="inline mr-1"/> Download Excel</button>}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-blue-400"><BrainCircuit/> AI Gaps</h3>
            <div className="text-sm leading-relaxed text-slate-400 whitespace-pre-line">
              {aiAnalysis || "Enter topic to see AI insights..."}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl overflow-hidden border">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center font-black">
              Academic Sources ({results.length})
              <TrendingUp size={20} className="text-blue-500"/>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-[10px] uppercase font-black text-slate-400">
                    <th className="p-5">Title</th>
                    <th className="p-5">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {results.map((res, i) => (
                    <tr key={i} className="hover:bg-blue-50/50">
                      <td className="p-5 font-bold text-slate-700">{res.title}</td>
                      <td className="p-5 text-blue-600 font-black">{res.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RESEARCHGAP;
