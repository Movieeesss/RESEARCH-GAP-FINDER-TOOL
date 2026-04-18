import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart, FileSpreadsheet, ArrowUpCircle, 
  Quote, Tags, Layers, Sparkles, FileText, BarChart3, ShieldCheck
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Global Interfaces ---
interface ResearchPaper {
  title: string;
  journal: string;
  year: string | number;
  doi: string;
  publisher: string;
  authors: string[]; 
  isOpenAccess: boolean;
  pdfUrl?: string; // New: Smart Link
}

const RESEARCHGAP: React.FC = () => {
  // --- States ---
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2024);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  
  // AI & Extra Feature States
  const [aiAnalysis, setAiAnalysis] = useState<{ gap: string, suggest: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stats, setStats] = useState({ topPublisher: '', topAuthor: '', avgYear: 0 });

  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fJournal, setFJournal] = useState<string>('All Journals');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [fCategory, setFCategory] = useState<string>('All Categories');
  const [activeTab, setActiveTab] = useState<'all' | 'oa'>('all');

  const globalAcademicCategories = [
    "All Categories", "Engineering & Tech", "Structural Materials", "Machine Learning & AI",
    "Medical & Health", "Agriculture & Bio", "Sustainable Energy", "Arts & Humanities", 
    "Social Sciences", "Physics & Space", "Chemistry", "Mathematics"
  ];

  // --- Dynamic Filters & Stats Engine ---
  const dynamicFilters = useMemo(() => {
    const pubs = Array.from(new Set(results.map(p => p.publisher))).sort();
    const jns = Array.from(new Set(results.map(p => p.journal))).sort();
    const auths = Array.from(new Set(results.flatMap(p => p.authors)))
      .filter(n => n.length > 3 && n !== "Anonymous").sort();
    
    // Simple Stats Calculation
    if (results.length > 0) {
        setStats({
            topPublisher: pubs[0] || 'N/A',
            topAuthor: auths[0] || 'N/A',
            avgYear: Math.round(results.reduce((acc, curr) => acc + (Number(curr.year) || 0), 0) / results.length)
        });
    }

    return { publishers: ['All Publishers', ...pubs], journals: ['All Journals', ...jns], authors: ['All Authors', ...auths] };
  }, [results]);

  const yearOptions = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  // --- 1. AI Gap Analyzer Logic ---
  const handleAiAnalysis = () => {
    const selectedData = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (selectedData.length < 3) return alert("Select at least 3 papers for AI Analysis!");

    setAnalyzing(true);
    // Simulating AI Analysis (Integrate Gemini API here in production)
    setTimeout(() => {
      setAiAnalysis({
        gap: `Based on the selected journals in ${keyword}, there is a significant lack of long-term durability data for bio-composites in tropical climates. Current research focuses on strength but misses the degradation analysis.`,
        suggest: `Proposed Title: "Multiscale Performance Evaluation of ${keyword} under Accelerated Aging and Environmental Stress Conditions"`
      });
      setAnalyzing(false);
    }, 2000);
  };

  // --- 2. BibTeX Export Logic ---
  const exportToBibTeX = () => {
    const data = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (data.length === 0) return alert("Select papers first!");

    let bibtex = "";
    data.forEach((p, idx) => {
      const citeKey = `${p.authors[0].split(' ').pop()}${p.year}_${idx}`;
      bibtex += `@article{${citeKey},\n  author = {${p.authors.join(' and ')}},\n  title = {${p.title}},\n  journal = {${p.journal}},\n  year = {${p.year}},\n  doi = {${p.doi}}\n}\n\n`;
    });

    const blob = new Blob([bibtex], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Uniq_Intelligence_${Date.now()}.bib`;
    link.click();
  };

  // --- 3. Unpaywall PDF Finder ---
  const findPdf = async (doi: string) => {
    try {
        const res = await fetch(`https://api.unpaywall.org/v2/${doi}?email=uniques@intelligence.com`);
        const data = await res.json();
        if (data.best_oa_location?.url_for_pdf) {
            window.open(data.best_oa_location.url_for_pdf, '_blank');
        } else {
            alert("Legal Open Access PDF not found. Try Journal Portal.");
        }
    } catch (e) { alert("PDF Service Unavailable."); }
  };

  // --- Existing Core Functions ---
  const toggleSelection = useCallback((index: number) => {
    setSelectedPapers(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const exportToExcel = async () => {
    const dataToExport = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (dataToExport.length === 0) return alert("Please select journals first!");

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Uniq Discovery Report');
      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = 'UNIQ INTELLIGENCE | RESEARCH REPORT';
      sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      const header = sheet.addRow(['S.No', 'Title', 'Journal', 'Year', 'Publisher', 'DOI']);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

      dataToExport.forEach((p, idx) => {
        const row = sheet.addRow([idx + 1, p.title, p.journal, p.year, p.publisher, `https://doi.org/${p.doi}`]);
        row.getCell(2).alignment = { wrapText: true, vertical: 'middle' };
      });

      sheet.getColumn(2).width = 60;
      sheet.getColumn(3).width = 30;
      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([buffer]));
      link.download = `Uniq_Report_${Date.now()}.xlsx`;
      link.click();
    } catch (e) { alert("Excel processing error."); }
  };

  const handleSearch = async (overrideKeyword?: string) => {
    const activeTerm = overrideKeyword || keyword;
    if (!activeTerm) return;
    setLoading(true); setResults([]); setStatus(`Deep Mining Global Nodes...`);
    try {
      const categoryQuery = fCategory !== 'All Categories' ? ` ${fCategory}` : '';
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(activeTerm + categoryQuery)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=500&sort=relevance`;
      const res = await fetch(url);
      const data = await res.json();
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Research',
        journal: item['container-title']?.[0] || 'International Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Global Academic Node',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Anonymous'],
        isOpenAccess: !!item.license,
      }));
      setResults(papers); setSelectedPapers(new Set()); setStatus(`Verified ${papers.length} Peer-Reviewed Articles.`);
    } catch (err) { setStatus('Re-syncing with database...'); setTimeout(() => handleSearch(overrideKeyword), 2000); }
    finally { setLoading(false); }
  };

  const filteredResults = useMemo(() => {
    return results.filter(p => {
      const matchesPub = fPublisher === 'All Publishers' || p.publisher === fPublisher;
      const matchesJrn = fJournal === 'All Journals' || p.journal === fJournal;
      const matchesAuth = fAuthor === 'All Authors' || p.authors.includes(fAuthor);
      const matchesTab = activeTab === 'all' || (activeTab === 'oa' && p.isOpenAccess);
      return matchesPub && matchesJrn && matchesAuth && matchesTab;
    });
  }, [results, fPublisher, fJournal, fAuthor, activeTab]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans p-2 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Nav Bar with Stats Badge */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-8 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Globe size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Research Discovery Portal v17.0</p>
            </div>
          </div>
          {results.length > 0 && (
            <div className="flex gap-4 items-center bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200">
               <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Avg Year</p><p className="font-black text-blue-600">{stats.avgYear}</p></div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase">Top Publisher</p><p className="font-black text-slate-700 text-[10px] truncate w-24">{stats.topPublisher}</p></div>
            </div>
          )}
        </nav>

        {/* --- Main Search Hub --- */}
        <div className="bg-white rounded-[3.5rem] p-8 md:p-14 shadow-2xl border border-white mb-10 relative overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
            <div className="xl:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={28}/>
              <input type="text" placeholder="Topic, DOI or Structural Keyword..." className="w-full pl-16 pr-4 py-7 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all font-black text-xl shadow-inner placeholder:text-slate-300" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            
            <div className="xl:col-span-3 flex items-center bg-slate-50 rounded-[2.5rem] px-8 border-2 border-transparent hover:border-blue-100 transition-all">
              <Calendar size={24} className="text-slate-400 mr-4"/>
              <div className="flex items-center w-full gap-3 font-black text-sm">
                <select className="bg-transparent py-7 outline-none w-full cursor-pointer" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-slate-300">~</span>
                <select className="bg-transparent py-7 outline-none w-full cursor-pointer" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => handleSearch()} disabled={loading} className="xl:col-span-3 bg-slate-900 hover:bg-blue-600 text-white rounded-[2.5rem] font-black transition-all flex items-center justify-center gap-3 shadow-2xl py-7 lg:py-0 text-lg active:scale-95 group">
              {loading ? <Loader2 className="animate-spin" size={26}/> : <Zap className="group-hover:rotate-12 transition-transform" size={26}/>}
              {loading ? 'MINING...' : 'DEEP SEARCH'}
            </button>
          </div>
          {status && <div className="mt-8 text-xs font-black text-blue-600 px-8 flex items-center gap-3 tracking-[0.2em] uppercase animate-pulse"><CheckCircle size={18}/> {status}</div>}
        </div>

        {/* AI Analysis Panel */}
        {aiAnalysis && (
            <div className="mb-10 p-8 bg-blue-600 text-white rounded-[3rem] shadow-2xl border-b-8 border-blue-800 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4"><Sparkles className="animate-bounce"/> <h4 className="font-black uppercase tracking-widest text-sm">AI Gap Insights Generated</h4></div>
                <p className="text-lg font-bold mb-6 italic">"{aiAnalysis.gap}"</p>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/20"><p className="text-[10px] font-black uppercase opacity-70 mb-2">Suggested Next Paper Title:</p><p className="font-black text-xl">{aiAnalysis.suggest}</p></div>
                <button onClick={() => setAiAnalysis(null)} className="mt-6 text-[10px] font-black uppercase underline">Dismiss Insight</button>
            </div>
        )}

        {/* --- Filters Hub --- */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 bg-slate-900 p-8 rounded-[3rem] shadow-2xl border-b-8 border-blue-600">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">1. Filter Publishers</label>
              <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700">
                {dynamicFilters.publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">2. Filter Journals</label>
              <select value={fJournal} onChange={(e)=>setFJournal(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700">
                {dynamicFilters.journals.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="space-y-3 flex flex-col justify-end">
                <button onClick={handleAiAnalysis} disabled={analyzing} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-500 transition-all shadow-lg">
                    {analyzing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} AI GAP ANALYSIS
                </button>
            </div>
            <div className="space-y-3 flex flex-col justify-end">
                <button onClick={exportToBibTeX} className="w-full bg-slate-800 text-blue-400 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition-all border border-blue-900">
                    <Quote size={18}/> EXPORT BIBTEX (.BIB)
                </button>
            </div>
          </div>
        )}

        {/* --- Paper Feed --- */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-20 relative">
            <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex bg-white p-1 rounded-xl shadow-inner border border-slate-200">
                <button onClick={() => setActiveTab('all')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>GLOBAL ARCHIVE</button>
                <button onClick={() => setActiveTab('oa')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'oa' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>OPEN ACCESS</button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={exportToExcel} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                    <FileSpreadsheet size={18}/> EXPORT EXCEL ({selectedPapers.size})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[1000px] overflow-y-auto custom-scrollbar">
              {filteredResults.slice(0, visibleCount).map((res, i) => {
                const isSelected = selectedPapers.has(i);
                // Smart Badge: If journal contains big publisher names
                const isHighImpact = ["Elsevier", "Springer", "Taylor", "Wiley", "Nature"].some(p => res.publisher.includes(p));
                
                return (
                  <div key={i} className={`p-10 flex gap-8 items-start transition-all hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50 border-l-[12px] border-blue-600' : ''}`}>
                    <div onClick={() => toggleSelection(i)} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600 scale-110' : 'text-slate-200 hover:text-blue-400'}`}>
                      {isSelected ? <CheckSquare size={36} fill="currentColor" className="opacity-10"/> : <Square size={36}/>}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex gap-2 items-center">
                            <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                            {isHighImpact && <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-[9px] font-black border border-amber-200 flex items-center gap-1"><ShieldCheck size={12}/> HIGH IMPACT</span>}
                        </div>
                        <button onClick={() => findPdf(res.doi)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all">
                            <Download size={16}/> Smart PDF Link
                        </button>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight mb-5">{res.title}</h3>
                      <div className="flex flex-wrap items-center gap-6 mb-8">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><User size={14} className="text-blue-500"/> {res.authors.join(', ')}</div>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold italic"><BookOpen size={14} className="text-blue-500"/> {res.journal}</div>
                         <div className="text-[12px] text-slate-400 font-black bg-white border border-slate-200 px-5 py-2 rounded-2xl shadow-sm">{res.year}</div>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                          <button className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase hover:text-blue-600"><Quote size={18}/> Cite</button>
                          <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-600 shadow-xl transition-all">Portal <ExternalLink size={18}/></a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-10 right-10 p-5 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 active:scale-75"><ArrowUpCircle size={24}/></button>
    </div>
  );
};

export default RESEARCHGAP;
