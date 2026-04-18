import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart, FileSpreadsheet, ArrowUpCircle, Quote, Tags, Layers
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
}

const RESEARCHGAP: React.FC = () => {
  // --- States (Session-Based for Multi-User) ---
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2024);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  
  // Performance & Multi-Filter States
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fJournal, setFJournal] = useState<string>('All Journals');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [fCategory, setFCategory] = useState<string>('All Categories');
  const [activeTab, setActiveTab] = useState<'all' | 'oa'>('all');

  // --- 1. World-Class Categories Master List ---
  const globalAcademicCategories = [
    "All Categories", "Engineering & Tech", "Structural Materials", "Machine Learning & AI",
    "Medical & Health", "Agriculture & Bio", "Sustainable Energy", "Arts & Humanities", 
    "Social Sciences", "Physics & Space", "Chemistry", "Mathematics"
  ];

  // --- 2. Dynamic Data Extraction Logic (Publishers, Journals, Authors) ---
  const dynamicFilters = useMemo(() => {
    const pubs = Array.from(new Set(results.map(p => p.publisher))).sort();
    const jns = Array.from(new Set(results.map(p => p.journal))).sort();
    const auths = Array.from(new Set(results.flatMap(p => p.authors)))
      .filter(n => n.length > 3 && n !== "Anonymous")
      .sort();
    
    return {
      publishers: ['All Publishers', ...pubs],
      journals: ['All Journals', ...jns],
      authors: ['All Authors', ...auths]
    };
  }, [results]);

  // --- 3. 2-Year Selection Logic: 1980 to 2026 ---
  const yearOptions = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  // Selection Logic (Optimized for High Performance)
  const toggleSelection = useCallback((index: number) => {
    setSelectedPapers(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAllFiltered = () => {
    if (selectedPapers.size === filteredResults.length) setSelectedPapers(new Set());
    else setSelectedPapers(new Set(filteredResults.map((_, i) => i)));
  };

  const copyCitation = (paper: ResearchPaper) => {
    const authorText = paper.authors.length > 1 ? `${paper.authors[0]} et al.` : paper.authors[0];
    const text = `${authorText} (${paper.year}). ${paper.title}. ${paper.journal}. https://doi.org/${paper.doi}`;
    navigator.clipboard.writeText(text);
    alert("APA Citation Copied!");
  };

  // --- Excel Export (Professional image_671ce5 Structure) ---
  const exportToExcel = async () => {
    const dataToExport = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (dataToExport.length === 0) return alert("Please select journals first!");

    try {
      const ExcelJSInstance = (ExcelJS as any).default || ExcelJS;
      const workbook = new ExcelJSInstance.Workbook();
      const sheet = workbook.addWorksheet('Uniq Intelligence Export');

      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = 'UNIQ INTELLIGENCE | ACADEMIC DISCOVERY REPORT';
      sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      sheet.getCell('A1').alignment = { horizontal: 'center' };

      const header = sheet.addRow(['S.No', 'Research Paper Title', 'Journal Name', 'Year', 'Publisher', 'DOI Link']);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

      dataToExport.forEach((p, idx) => {
        sheet.addRow([idx + 1, p.title, p.journal, p.year, p.publisher, `https://doi.org/${p.doi}`]);
      });

      sheet.getColumn(1).width = 8;
      sheet.getColumn(2).width = 65;
      sheet.getColumn(3).width = 40;
      sheet.getColumn(4).width = 10;
      sheet.getColumn(5).width = 25;
      sheet.getColumn(6).width = 45;

      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([buffer]));
      link.download = `Uniq_Selection_${Date.now()}.xlsx`;
      link.click();
    } catch (e) { alert("Excel processing error."); }
  };

  // --- Truly Unlimited Deep Mining (Author & Category Integrated) ---
  const handleSearch = async (overrideKeyword?: string) => {
    const activeTerm = overrideKeyword || keyword;
    if (!activeTerm) return;

    setLoading(true);
    setResults([]);
    setVisibleCount(30); 
    setStatus(`Scanning Global Repositories for ${activeTerm}...`);

    try {
      // Logic for Multi-Category Search
      const categoryQuery = fCategory !== 'All Categories' ? ` ${fCategory}` : '';
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(activeTerm + categoryQuery)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=1000&sort=relevance`;
      
      const res = await fetch(url);
      if (res.status === 429) {
        setStatus('Traffic detected. Waiting 3s for safe node access...');
        setTimeout(() => handleSearch(overrideKeyword), 3000);
        return;
      }

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

      setResults(papers);
      setSelectedPapers(new Set());
      setStatus(`Success! Verified ${papers.length} International Journals.`);
      setLoading(false);
    } catch (err) {
      setStatus('Re-syncing with database...');
      setTimeout(() => handleSearch(overrideKeyword), 2000);
    }
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
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans p-2 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Nav Bar */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-8 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Globe size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Universal Multi-User Scraper v14.0</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-2 rounded-2xl gap-2 overflow-x-auto max-w-full">
             {globalAcademicCategories.slice(1, 8).map(cat => (
               <button key={cat} onClick={() => { setFCategory(cat); handleSearch(cat); }} className="whitespace-nowrap px-4 py-2 bg-white text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm">{cat}</button>
             ))}
          </div>
        </nav>

        {/* --- 4. Main Multi-Filter Interface (Inputs & Year Selection) --- */}
        <div className="bg-white rounded-[3.5rem] p-8 md:p-14 shadow-2xl border border-white mb-10 relative overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
            <div className="xl:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={28}/>
              <input type="text" placeholder="Topic, DOI or Keyword Analysis..." className="w-full pl-16 pr-4 py-7 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all font-black text-xl shadow-inner placeholder:text-slate-300" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
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

        {/* --- 5. CATEGORY DROPDOWN HUB (The Core Requirement) --- */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 bg-slate-900 p-8 rounded-[3rem] shadow-2xl border-b-8 border-blue-600">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">1. Global Publishers</label>
              <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700">
                {dynamicFilters.publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">2. World Journals</label>
              <select value={fJournal} onChange={(e)=>setFJournal(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700">
                {dynamicFilters.journals.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">3. Authors Record</label>
              <select value={fAuthor} onChange={(e)=>setFAuthor(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700">
                {dynamicFilters.authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">4. Discipline Categories</label>
              <select value={fCategory} onChange={(e)=>{setFCategory(e.target.value); handleSearch(keyword);}} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700">
                {globalAcademicCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Data Stream & Selective Management */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-20 relative">
            <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex bg-white p-1 rounded-xl shadow-inner border border-slate-200">
                <button onClick={() => setActiveTab('all')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>GLOBAL ARCHIVE</button>
                <button onClick={() => setActiveTab('oa')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'oa' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>OPEN ACCESS</button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={selectAllFiltered} className="text-blue-600 text-[10px] font-black uppercase flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-blue-100 hover:bg-blue-50 transition-all">
                    {selectedPapers.size === filteredResults.length ? <CheckSquare size={18}/> : <Square size={18}/>} Toggle All ({filteredResults.length})
                </button>
                <button onClick={exportToExcel} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                    <FileSpreadsheet size={18}/> EXPORT SELECTION ({selectedPapers.size})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[850px] overflow-y-auto custom-scrollbar">
              {filteredResults.slice(0, visibleCount).map((res, i) => {
                const isSelected = selectedPapers.has(i);
                return (
                  <div key={i} className={`p-10 flex gap-8 items-start transition-all hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50 border-l-[12px] border-blue-600' : ''}`}>
                    <div onClick={() => toggleSelection(i)} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600 scale-110' : 'text-slate-200 hover:text-blue-400'}`}>
                      {isSelected ? <CheckSquare size={36} fill="currentColor" className="opacity-10"/> : <Square size={36}/>}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-5">
                        <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                        {res.isOpenAccess ? (
                           <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase border border-emerald-100"><CheckCircle size={16}/> Direct Access</span>
                        ) : (
                           <span className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl flex items-center gap-2 italic text-[10px] uppercase font-black border border-slate-200"><ShoppingCart size={16}/> Purchase Portal</span>
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight mb-5">{res.title}</h3>
                      <div className="flex flex-wrap items-center gap-6 mb-8">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><User size={14} className="text-blue-500"/> {res.authors.join(', ')}</div>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold italic"><BookOpen size={14} className="text-blue-500"/> {res.journal}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-slate-400 font-black bg-white border border-slate-200 px-5 py-2 rounded-2xl shadow-sm">{res.year}</span>
                        <div className="ml-auto flex gap-4">
                          <button onClick={() => copyCitation(res)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-slate-200 uppercase tracking-tighter transition-all"><Quote size={18}/> Cite</button>
                          <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-600 shadow-xl uppercase tracking-widest transition-all">Portal <ExternalLink size={18}/></a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleCount < filteredResults.length && (
                <div className="p-12 text-center bg-slate-50/30">
                  <button onClick={() => setVisibleCount(v => v + 50)} className="px-14 py-5 bg-blue-600 text-white font-black rounded-[2.5rem] hover:bg-blue-700 transition-all shadow-2xl uppercase text-xs tracking-[0.2em] active:scale-95">Load More Data Archive (+{filteredResults.length - visibleCount})</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-10 right-10 p-5 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 active:scale-75"><ArrowUpCircle size={24}/></button>
    </div>
  );
};

export default RESEARCHGAP;
