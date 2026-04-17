import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Zap, CheckSquare, Square, 
  User, LayoutGrid, FileSpreadsheet, History
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Interfaces ---
interface ResearchPaper {
  title: string;
  journal: string;
  year: string | number;
  doi: string;
  publisher: string;
  authors: string[];
  isOpenAccess: boolean;
  pdfUrl?: string;
}

const RESEARCHGAP: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2015);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<string[]>([]);
  
  // Advanced Filter States
  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');

  // --- Dynamic Filters Logic ---
  const filterOptions = useMemo(() => {
    const publishers = Array.from(new Set(results.map(p => p.publisher))).sort();
    const authors = Array.from(new Set(results.flatMap(p => p.authors)))
      .filter(name => name.length > 3)
      .sort();
    
    return {
      publishers: ['All Publishers', ...publishers],
      authors: ['All Authors', ...authors]
    };
  }, [results]);

  const yearRange = useMemo(() => {
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

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedPapers);
    if (newSelection.has(index)) newSelection.delete(index);
    else newSelection.add(index);
    setSelectedPapers(newSelection);
  };

  // --- Selective Export Logic ---
  const exportToExcel = async () => {
    const dataToExport = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (dataToExport.length === 0) return alert("Select journals buddy!");

    try {
      const ExcelJSInstance = (ExcelJS as any).default || ExcelJS;
      const workbook = new (ExcelJSInstance as any).Workbook();
      const sheet = workbook.addWorksheet('Uniq Intelligence Export');

      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = 'UNIQ INTELLIGENCE | AUTHOR-WISE DATA REPORT';
      sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      const header = sheet.addRow(['Publisher', 'Author(s)', 'Paper Title', 'Source Journal', 'Year', 'DOI Link']);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

      dataToExport.forEach(p => {
        sheet.addRow([p.publisher, p.authors.join(', '), p.title, p.journal, p.year, `https://doi.org/${p.doi}`]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Uniq_Author_Report_${new Date().getTime()}.xlsx`;
      link.click();
    } catch (e) { alert("Export Error."); }
  };

  // --- TRULY UNLIMITED FETCH + AUTHOR INTEL ---
  const handleSearch = async (authorMode: string = 'All Authors') => {
    setLoading(true);
    setResults([]);
    setSelectedPapers(new Set());
    
    // If searching by specific author
    const queryTerm = authorMode !== 'All Authors' ? authorMode : keyword;
    const authorFilter = authorMode !== 'All Authors' ? `&filter=author:${encodeURIComponent(authorMode)}` : '';
    
    setStatus(authorMode !== 'All Authors' ? `Fetching full record for ${authorMode}...` : 'Scanning International Journals...');

    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(queryTerm)}${authorFilter}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=1000&sort=relevance`;
      const res = await fetch(url);
      const data = await res.json();
      
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'No Title',
        journal: item['container-title']?.[0] || 'Global Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Academic Node',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['N/A'],
        isOpenAccess: !!item.license,
        pdfUrl: item.link?.find((l: any) => l['content-type'] === 'application/pdf')?.URL,
      }));

      setResults(papers);
      setStatus(`Successfully Extracted ${papers.length} Works.`);
      setLoading(false);

      if (authorMode === 'All Authors') {
        const newHistory = [keyword, ...history.filter(h => h !== keyword)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('research_history', JSON.stringify(newHistory));
      }
    } catch (err) {
      setStatus('Node overloaded. Retry search.');
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(p => {
      const matchesPublisher = fPublisher === 'All Publishers' || p.publisher === fPublisher;
      return matchesPublisher;
    });
  }, [results, fPublisher]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-2 md:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Nav */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-10 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-2xl"><Globe size={28} /></div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
          </div>
          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto">
            {history.map((h, i) => (
              <button key={i} onClick={() => {setKeyword(h); handleSearch();}} className="whitespace-nowrap px-5 py-2.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all shadow-sm">{h}</button>
            ))}
          </div>
        </nav>

        {/* Input UI */}
        <div className="bg-white rounded-[3rem] p-8 md:p-14 shadow-2xl border border-white mb-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={28}/>
              <input 
                type="text" 
                placeholder="Topic Analysis (Truly Unlimited Scrape)..."
                className="w-full pl-16 pr-4 py-7 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all font-black text-xl shadow-inner"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="xl:col-span-3 flex items-center bg-slate-50 rounded-[2.5rem] px-8 border-2 border-transparent">
              <Calendar size={24} className="text-slate-400 mr-4"/>
              <div className="flex items-center w-full gap-3 font-black text-sm">
                <select className="bg-transparent py-7 outline-none w-full" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                  {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span>~</span>
                <select className="bg-transparent py-7 outline-none w-full" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                  {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => handleSearch()} disabled={loading} className="xl:col-span-3 bg-slate-900 hover:bg-blue-600 text-white rounded-[2.5rem] font-black transition-all flex items-center justify-center gap-3 shadow-xl py-7 lg:py-0 text-lg">
              {loading ? <Loader2 className="animate-spin" size={26}/> : <Database size={26}/>}
              {loading ? 'SCRAPING...' : 'DEEP SEARCH ALL'}
            </button>
          </div>
          {status && <div className="mt-8 text-xs font-black text-blue-600 px-8 flex items-center gap-3 tracking-[0.2em] uppercase animate-pulse"><CheckCircle size={18}/> {status}</div>}
        </div>

        {/* AUTHOR INTEL PANEL */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={16}/> Author Intelligence Dropdown
              </label>
              <select 
                value={fAuthor} 
                onChange={(e) => {
                  setFAuthor(e.target.value);
                  handleSearch(e.target.value); // Fetch full record of this specific author
                }} 
                className="w-full py-4 bg-slate-800 text-white rounded-2xl px-4 font-bold text-sm outline-none border-l-4 border-blue-600 cursor-pointer"
              >
                {filterOptions.authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <p className="text-[9px] text-slate-500 mt-4 italic font-medium">* Selecting an author will scan for their full international publication history.</p>
            </div>
            
            <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-xl text-white flex justify-between items-center">
               <div>
                  <h4 className="font-black text-2xl uppercase tracking-tighter">Selective Data Export</h4>
                  <p className="text-xs font-bold opacity-80 mt-1">Export {selectedPapers.size} selected items to professional Excel.</p>
               </div>
               <button onClick={exportToExcel} className="p-5 bg-white text-blue-600 rounded-3xl shadow-2xl active:scale-90 transition-transform">
                  <FileSpreadsheet size={32}/>
               </button>
            </div>
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-20 relative">
            <div className="px-10 py-6 bg-slate-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                  <LayoutGrid size={16}/> Live Scrape: {results.length} Journals Found
                </div>
                <button onClick={() => setSelectedPapers(new Set(results.map((_, i) => i)))} className="text-blue-600 text-[10px] font-black uppercase hover:underline">Select All</button>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredResults.map((res, i) => {
                const isSelected = selectedPapers.has(i);
                return (
                  <div key={i} className={`p-10 flex gap-8 items-start transition-all hover:bg-blue-50 ${isSelected ? 'bg-blue-50 border-l-[12px] border-blue-600' : ''}`}>
                    <div onClick={() => toggleSelection(i)} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600' : 'text-slate-200'}`}>
                      {isSelected ? <CheckSquare size={32}/> : <Square size={32}/>}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-5">
                        <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                        {res.isOpenAccess ? (
                           <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-2 border border-emerald-200 font-black text-[10px] uppercase shadow-sm">
                             <CheckCircle size={16}/> Open Access
                           </span>
                        ) : (
                           <span className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase shadow-sm border border-slate-200 italic">
                             <Zap size={16}/> Purchase Access
                           </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight mb-5">{res.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-6 mb-8">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                           <User size={14} className="text-blue-500"/> {res.authors.join(', ')}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold italic truncate max-w-[300px]">
                           <BookOpen size={14} className="text-blue-500"/> {res.journal}
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-slate-400 font-black bg-white border border-slate-200 px-5 py-2 rounded-2xl shadow-sm">{res.year}</span>
                        <div className="ml-auto flex gap-4">
                          <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-600 transition-all shadow-lg uppercase">
                             Access Portal <ExternalLink size={18}/>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RESEARCHGAP;
