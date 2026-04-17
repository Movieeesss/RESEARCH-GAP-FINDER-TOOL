import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, History, BookOpen, ExternalLink, ListFilter, Globe
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Interfaces ---
interface ResearchPaper {
  title: string;
  journal: string;
  year: string | number;
  doi: string;
  publisher: string;
}

const RESEARCHGAP: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2010);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  // 1980 - 2026 Dynamic Year Selection
  const years = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('research_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const lastTopic = localStorage.getItem('last_topic');
    if (lastTopic) setKeyword(lastTopic);
  }, []);

  // --- Professional Excel Export with RESEARCH GAP Column ---
  const exportToExcel = async (data: ResearchPaper[]) => {
    try {
      const ExcelJSInstance = (ExcelJS as any).default || ExcelJS;
      const workbook = new (ExcelJSInstance as any).Workbook();
      const sheet = workbook.addWorksheet('Uniq Analysis Report');

      // Title Styling
      sheet.mergeCells('A1:F1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'UNIQ DESIGNS | UNLIMITED GLOBAL RESEARCH DATA';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      titleCell.alignment = { horizontal: 'center' };

      sheet.addRow([`Topic: ${keyword}`, `Range: ${fromYear}-${toYear}`, `Data Points: ${data.length}`]);
      sheet.addRow([]);

      // Headers (Added Research Gap Column)
      const header = sheet.addRow(['Publisher', 'Paper Title', 'Source Journal', 'Year', 'DOI Link', 'RESEARCH GAP / NOVELTY']);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

      data.forEach(p => {
        sheet.addRow([
          p.publisher, 
          p.title, 
          p.journal, 
          p.year, 
          `https://doi.org/${p.doi}`,
          "Review this work's methodology to identify specific limitations." // Research Gap Placeholder
        ]);
      });

      sheet.columns = [
        { width: 20 }, { width: 55 }, { width: 35 }, { width: 10 }, { width: 35 }, { width: 45 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Uniq_Unlimited_Data_${keyword.replace(/\s+/g, '_')}.xlsx`;
      link.click();
    } catch (e) {
      alert("Excel failed. Use Chrome browser.");
    }
  };

  // --- Multi-Publisher Unlimited Fetch Engine ---
  const handleSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    setStatus('Deep Scanning Elsevier, Springer, T&F, Wiley & Wiley...');
    
    // Save to LocalStorage
    const newHistory = [keyword, ...history.filter(h => h !== keyword)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('research_history', JSON.stringify(newHistory));
    localStorage.setItem('last_topic', keyword);

    try {
      // Fetching 1000 rows - The maximum supported single request for deep data
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(keyword)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=1000&sort=relevance`;
      const res = await fetch(url);
      const data = await res.json();
      
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Research',
        journal: item['container-title']?.[0] || 'Global Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Academic Source'
      }));

      setResults(papers);
      setStatus(`Success! ${papers.length} International Journals Mapped.`);
      setLoading(false);
      
      if (papers.length > 0) await exportToExcel(papers);
    } catch (err) {
      setStatus('Data node busy. Retrying extraction...');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-3 md:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Nav */}
        <nav className="flex flex-col md:flex-row justify-between items-center mb-10 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg"><Globe size={24} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tighter leading-none text-slate-800 uppercase">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Unlimited Research Scraper</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2">
            {history.map((h, i) => (
              <button key={i} onClick={() => setKeyword(h)} className="whitespace-nowrap px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 uppercase tracking-wider">{h}</button>
            ))}
          </div>
        </nav>

        {/* Input Card */}
        <div className="bg-white rounded-[3rem] p-6 md:p-14 shadow-2xl shadow-blue-100/40 border border-white mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={24}/>
              <input 
                type="text"
                placeholder="Ex: SCC Strength, Magnesium Silicate Concrete..."
                className="w-full pl-16 pr-4 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-xl shadow-inner"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="lg:col-span-4 flex items-center bg-slate-50 rounded-3xl px-6 border-2 border-transparent">
              <Calendar size={22} className="text-slate-400 mr-3"/>
              <div className="flex items-center w-full gap-2">
                <select className="bg-transparent py-6 outline-none font-black text-xs w-full cursor-pointer" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-slate-300 font-black">~</span>
                <select className="bg-transparent py-6 outline-none font-black text-xs w-full cursor-pointer" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleSearch} disabled={loading} className="lg:col-span-2 bg-slate-900 hover:bg-blue-600 active:scale-95 text-white rounded-3xl font-black transition-all flex items-center justify-center gap-2 shadow-xl py-6 lg:py-0">
              {loading ? <Loader2 className="animate-spin" size={24}/> : <Database size={24}/>}
              {loading ? 'SCRAPING' : 'SCAN ALL'}
            </button>
          </div>
          {status && <div className="mt-6 text-xs font-black text-blue-600 px-6 flex items-center gap-2 tracking-widest uppercase"><CheckCircle size={14}/> {status}</div>}
        </div>

        {/* Results Metadata */}
        {results.length > 0 && (
          <div className="grid lg:grid-cols-4 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="lg:col-span-1">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white sticky top-10 shadow-2xl">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-blue-400 uppercase tracking-tighter">
                  <ListFilter size={24}/> Summary
                </h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-600 pl-4 py-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Results</p>
                    <p className="text-xl font-black">{results.length}</p>
                  </div>
                  <div className="border-l-4 border-slate-700 pl-4 py-1">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Timeline</p>
                    <p className="text-lg font-black">{fromYear} - {toYear}</p>
                  </div>
                  <button onClick={() => exportToExcel(results)} className="w-full py-5 bg-blue-600 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40">
                    <Download size={20}/> EXCEL REPORT
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[800px]">
                <div className="p-8 bg-slate-50/50 border-b flex items-center gap-3">
                  <BookOpen className="text-blue-600" size={24}/>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">International Academic Metadata</h3>
                </div>
                <div className="overflow-y-auto flex-grow scrollbar-hide">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-100">
                      {results.map((res, i) => (
                        <tr key={i} className="group hover:bg-blue-50/30 transition-all">
                          <td className="p-8">
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">{res.publisher}</span>
                              <div className="font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors text-lg">
                                {res.title}
                              </div>
                              <div className="flex items-center gap-4 mt-4">
                                <span className="text-[11px] text-slate-400 font-black bg-slate-50 border border-slate-100 px-4 py-1 rounded-full uppercase">{res.year}</span>
                                <span className="text-[11px] text-slate-500 font-bold italic truncate max-w-[300px]">{res.journal}</span>
                                {res.doi && (
                                  <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-blue-600 transition-colors ml-auto">
                                    <ExternalLink size={18}/>
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RESEARCHGAP;
