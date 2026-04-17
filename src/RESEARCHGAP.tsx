import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart, FileSpreadsheet, ArrowUpCircle, Quote, Layers
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Global Enhanced Interfaces ---
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
  // --- Core States ---
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2023);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  
  // High-Performance States
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [activeTab, setActiveTab] = useState<'all' | 'oa'>('all');

  // --- World-Class Academic Categories (From image_71fb3f & image_71fe0f) ---
  const academicUniverses = [
    "Civil Engineering", "Structural Materials", "Medical Sciences", 
    "Artificial Intelligence", "Agriculture", "Social Humanities", 
    "Sustainable Energy", "Chemical Research", "Biotechnology", "Physics"
  ];

  // Dynamic Year List 1980 - 2026
  const yearRange = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  // Filter Extraction Logic
  const filterOptions = useMemo(() => {
    const publishers = Array.from(new Set(results.map(p => p.publisher))).sort();
    const authors = Array.from(new Set(results.flatMap(p => p.authors))).filter(n => n.length > 3).sort();
    return { publishers: ['All Publishers', ...publishers], authors: ['All Authors', ...authors] };
  }, [results]);

  // --- Search Engine (Unlimited Logic & Error Prevention) ---
  const handleSearch = async (overrideKeyword?: string) => {
    const activeQuery = overrideKeyword || keyword;
    if (!activeQuery) return;

    setLoading(true);
    setResults([]);
    setVisibleCount(20);
    setStatus(`Scanning Global Nodes for ${activeQuery}...`);

    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(activeQuery)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=1000&sort=relevance`;
      const res = await fetch(url);
      
      if (res.status === 429) {
        setStatus('Traffic High. Auto-switching server...');
        setTimeout(() => handleSearch(overrideKeyword), 3000);
        return;
      }

      const data = await res.json();
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Research',
        journal: item['container-title']?.[0] || 'International Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Independent Publisher',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Anonymous'],
        isOpenAccess: !!item.license,
      }));

      setResults(papers);
      setSelectedPapers(new Set());
      setStatus(`Verified ${papers.length} International Journals.`);
      setLoading(false);
    } catch (err) {
      setStatus('Retrying Connection...');
      setTimeout(() => handleSearch(overrideKeyword), 2000);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(p => {
      const matchesPub = fPublisher === 'All Publishers' || p.publisher === fPublisher;
      const matchesAuth = fAuthor === 'All Authors' || p.authors.includes(fAuthor);
      const matchesTab = activeTab === 'all' || (activeTab === 'oa' && p.isOpenAccess);
      return matchesPub && matchesAuth && matchesTab;
    });
  }, [results, fPublisher, fAuthor, activeTab]);

  // Selective Download (image_671ce5.png structure)
  const exportSelection = async () => {
    const data = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (data.length === 0) return alert("Select journals buddy!");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Uniq Selection');
    
    sheet.columns = [
      { header: 'S.No', key: 'sn', width: 8 },
      { header: 'Research Title', key: 'title', width: 60 },
      { header: 'Journal Name', key: 'journal', width: 35 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Publisher', key: 'publisher', width: 25 },
      { header: 'DOI Link', key: 'doi', width: 40 }
    ];

    data.forEach((p, i) => sheet.addRow({ sn: i + 1, title: p.title, journal: p.journal, year: p.year, publisher: p.publisher, doi: `https://doi.org/${p.doi}` }));
    
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([buffer]));
    link.download = `Uniq_Selection_${Date.now()}.xlsx`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-slate-900 font-sans p-2 md:p-10 selection:bg-blue-100">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Futuristic Navbar */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-8 p-6 bg-white rounded-[2.5rem] shadow-xl border border-white gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl text-white shadow-lg"><Globe size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Domain Discovery Engine</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-2 rounded-2xl gap-2 overflow-x-auto max-w-full custom-scrollbar">
             {academicUniverses.map(cat => (
               <button key={cat} onClick={() => { setKeyword(cat); handleSearch(cat); }} className="whitespace-nowrap px-5 py-2.5 bg-white text-[10px] font-black uppercase rounded-xl border border-slate-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">{cat}</button>
             ))}
          </div>
        </nav>

        {/* Dynamic Year & Keyword Search */}
        <div className="bg-white rounded-[3.5rem] p-8 md:p-14 shadow-2xl border border-white mb-10 relative overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
            <div className="xl:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={28}/>
              <input type="text" placeholder="Explore Topic, DOI or Category..." className="w-full pl-16 pr-4 py-7 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all font-black text-xl shadow-inner" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            
            {/* 2 Year Selection Logic: From & To */}
            <div className="xl:col-span-3 flex items-center bg-slate-50 rounded-[2.5rem] px-8 border-2 border-transparent hover:border-blue-100 transition-all">
              <Calendar size={24} className="text-slate-400 mr-4"/>
              <div className="flex items-center w-full gap-3 font-black text-sm">
                <select className="bg-transparent py-7 outline-none w-full cursor-pointer" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                  {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-slate-300">~</span>
                <select className="bg-transparent py-7 outline-none w-full cursor-pointer" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                  {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => handleSearch()} disabled={loading} className="xl:col-span-3 bg-slate-900 hover:bg-blue-600 text-white rounded-[2.5rem] font-black transition-all flex items-center justify-center gap-3 shadow-2xl py-7 lg:py-0 text-lg group">
              {loading ? <Loader2 className="animate-spin" size={26}/> : <Zap className="group-hover:scale-125 transition-transform" size={26}/>}
              {loading ? 'MINING...' : 'DEEP SEARCH'}
            </button>
          </div>
          {status && <div className="mt-8 text-xs font-black text-blue-600 px-8 flex items-center gap-3 tracking-[0.2em] uppercase animate-pulse"><CheckCircle size={18}/> {status}</div>}
        </div>

        {/* AUTHOR & PUBLISHER HUB */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-slate-900 p-8 rounded-[3rem] shadow-2xl">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic flex items-center gap-2"><User size={14}/> Author Discovery</label>
              <select value={fAuthor} onChange={(e)=>setFAuthor(e.target.value)} className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700 transition-all">
                {filterOptions.authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic flex items-center gap-2"><Layers size={14}/> Global Publisher Node</label>
              <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer hover:bg-slate-700 transition-all">
                {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Data Stream Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-white overflow-hidden mb-20 relative">
            <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex bg-white p-1.5 rounded-xl shadow-inner border border-slate-100">
                <button onClick={() => setActiveTab('all')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>ALL RECORDS</button>
                <button onClick={() => setActiveTab('oa')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'oa' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>OPEN ACCESS</button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedPapers(new Set(filteredResults.map((_, i) => i)))} className="text-blue-600 text-[10px] font-black uppercase flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-blue-50">
                    <CheckSquare size={18}/> SELECT ALL ({filteredResults.length})
                </button>
                <button onClick={exportSelection} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                    <FileSpreadsheet size={18}/> EXPORT SELECTION ({selectedPapers.size})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredResults.slice(0, visibleCount).map((res, i) => {
                const isSelected = selectedPapers.has(i);
                return (
                  <div key={i} className={`p-10 flex gap-8 items-start transition-all hover:bg-slate-50/80 ${isSelected ? 'bg-blue-50 border-l-[12px] border-blue-600' : ''}`}>
                    <div onClick={() => {
                        const next = new Set(selectedPapers);
                        if(next.has(i)) next.delete(i); else next.add(i);
                        setSelectedPapers(next);
                    }} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600' : 'text-slate-200'}`}>
                      {isSelected ? <CheckSquare size={32}/> : <Square size={32}/>}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-5">
                        <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                        {res.isOpenAccess ? (
                           <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase shadow-sm border border-emerald-200"><CheckCircle size={16}/> Free Access</span>
                        ) : (
                           <span className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl flex items-center gap-2 italic text-[10px] uppercase font-black border border-slate-200"><ShoppingCart size={16}/> Purchase Access</span>
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
                          <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-600 shadow-xl transition-all uppercase tracking-widest">Portal <ExternalLink size={18}/></a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {visibleCount < filteredResults.length && (
                <div className="p-10 text-center">
                  <button onClick={() => setVisibleCount(v => v + 50)} className="px-12 py-5 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl uppercase text-xs tracking-[0.2em]">Load More Journals (+{filteredResults.length - visibleCount})</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-10 right-10 p-5 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 active:scale-90"><ArrowUpCircle size={24}/></button>
    </div>
  );
};

export default RESEARCHGAP;
