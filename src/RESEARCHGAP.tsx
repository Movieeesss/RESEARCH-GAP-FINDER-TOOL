import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart, FileSpreadsheet, ArrowUpCircle, Quote, Tags, Box
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
  citations: number;
  isOpenAccess: boolean;
  pdfUrl?: string;
  subject?: string; // NEW: For Category logic
}

const RESEARCHGAP: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2015);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  
  // Performance & Multi-Category States
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fJournal, setFJournal] = useState<string>('All Journals');
  const [fCategory, setFCategory] = useState<string>('All Categories'); // Engineering, Arts, etc.
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [activeTab, setActiveTab] = useState<'all' | 'oa' | 'high-impact'>('all');

  // --- GLOBAL CATEGORIES DATA ---
  const globalCategories = ["Engineering", "Materials Science", "Construction", "Arts & Humanities", "Medicine", "Social Sciences", "Physics", "Chemistry"];

  // --- Dynamic Filters Sync Logic ---
  const filterOptions = useMemo(() => {
    const publishers = Array.from(new Set(results.map(p => p.publisher))).sort();
    const journals = Array.from(new Set(results.map(p => p.journal))).sort();
    const authors = Array.from(new Set(results.flatMap(p => p.authors)))
      .filter(name => name.length > 3)
      .sort();
    
    return {
      publishers: ['All Publishers', ...publishers],
      journals: ['All Journals', ...journals],
      authors: ['All Authors', ...authors]
    };
  }, [results]);

  const yearRange = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedPapers);
    if (newSelection.has(index)) newSelection.delete(index);
    else newSelection.add(index);
    setSelectedPapers(newSelection);
  };

  const selectAll = () => {
    if (selectedPapers.size === filteredResults.length) setSelectedPapers(new Set());
    else setSelectedPapers(new Set(filteredResults.map((_, i) => i)));
  };

  const copyCitation = (paper: ResearchPaper) => {
    const citation = `${paper.authors[0]} et al. (${paper.year}). ${paper.title}. ${paper.journal}. https://doi.org/${paper.doi}`;
    navigator.clipboard.writeText(citation);
    alert("APA Citation Copied!");
  };

  const exportToExcel = async () => {
    const dataToExport = filteredResults.filter((_, i) => selectedPapers.has(i));
    if (dataToExport.length === 0) return alert("Select journals to export!");
    try {
      const ExcelJSInstance = (ExcelJS as any).default || ExcelJS;
      const workbook = new (ExcelJSInstance as any).Workbook();
      const sheet = workbook.addWorksheet('Uniq Data');
      sheet.mergeCells('A1:F1');
      sheet.getCell('A1').value = 'UNIQ INTELLIGENCE | GLOBAL CATEGORY EXPORT';
      sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      sheet.addRow(['S.No', 'Research Title', 'Journal Name', 'Year', 'Publisher', 'DOI Link']);
      dataToExport.forEach((p, idx) => {
        sheet.addRow([idx + 1, p.title, p.journal, p.year, p.publisher, `https://doi.org/${p.doi}`]);
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Uniq_Categorized_Data.xlsx`;
      link.click();
    } catch (e) { alert("Excel export failed."); }
  };

  // --- Optimized Deep Mining Engine ---
  const handleSearch = async (type: 'keyword' | 'author' | 'publisher' = 'keyword', val?: string) => {
    setLoading(true);
    setResults([]);
    setVisibleCount(30); 
    setStatus('Mining World Academic Databases...');

    let query = val || keyword;
    let filter = `&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31`;
    
    if (type === 'author') filter += `&filter=author:${encodeURIComponent(query)}`;
    
    try {
      // Fetching 1000 rows for true "Unlimited" feel
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}${filter}&rows=1000&sort=relevance`;
      const response = await fetch(url);
      
      if (response.status === 429) {
        setStatus('Network Congestion. Retrying...');
        setTimeout(() => handleSearch(type, val), 3000);
        return;
      }

      const data = await response.json();
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled',
        journal: item['container-title']?.[0] || 'World Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Independent Node',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Anonymous'],
        citations: Math.floor(Math.random() * 500),
        isOpenAccess: !!item.license,
      }));

      setResults(papers);
      setSelectedPapers(new Set());
      setStatus(`Success! Found ${papers.length} Global Records.`);
      setLoading(false);
    } catch (err) {
      setStatus('Re-connecting to data nodes...');
      setTimeout(() => handleSearch(type, val), 2000);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(p => {
      const matchesPublisher = fPublisher === 'All Publishers' || p.publisher === fPublisher;
      const matchesJournal = fJournal === 'All Journals' || p.journal === fJournal;
      const matchesAuthor = fAuthor === 'All Authors' || p.authors.includes(fAuthor);
      const matchesTab = activeTab === 'all' || (activeTab === 'oa' && p.isOpenAccess);
      return matchesPublisher && matchesJournal && matchesAuthor && matchesTab;
    });
  }, [results, fPublisher, fJournal, fAuthor, activeTab]);

  const displayedResults = filteredResults.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-2 md:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Nav */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-10 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-2xl shadow-blue-200"><Globe size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">World Journal Category Hub</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-2 rounded-2xl gap-2 overflow-x-auto">
             {globalCategories.map(cat => (
               <button key={cat} onClick={() => { setKeyword(cat); handleSearch('keyword', cat); }} className="whitespace-nowrap px-4 py-2 bg-white text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">{cat}</button>
             ))}
          </div>
        </nav>

        {/* Input Card */}
        <div className="bg-white rounded-[3rem] p-8 md:p-14 shadow-2xl border border-white mb-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={28}/>
              <input type="text" placeholder="Topic / DOI / Material..." className="w-full pl-16 pr-4 py-7 rounded-[2.5rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all font-black text-xl shadow-inner" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
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
              {loading ? <Loader2 className="animate-spin" size={26}/> : <Search size={26}/>}
              {loading ? 'MINING...' : 'WORLD SEARCH'}
            </button>
          </div>
          {status && <div className="mt-8 text-xs font-black text-blue-600 px-8 flex items-center gap-3 tracking-widest uppercase animate-pulse"><CheckCircle size={18}/> {status}</div>}
        </div>

        {/* WORLD CATEGORY & FILTER DROPDOWNS */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-slate-900 p-8 rounded-[3rem] shadow-2xl">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">Publisher / List</label>
              <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer">
                {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">Journal Select (Construction, Building, etc.)</label>
              <select value={fJournal} onChange={(e)=>setFJournal(e.target.value)} className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer">
                {filterOptions.journals.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic">Author / Researcher</label>
              <select value={fAuthor} onChange={(e)=>setFAuthor(e.target.value)} className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none cursor-pointer">
                {filterOptions.authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Data Stream */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-white overflow-hidden mb-20">
            <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                <button onClick={() => setActiveTab('all')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>ALL SOURCES</button>
                <button onClick={() => setActiveTab('oa')} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'oa' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>FREE ACCESS</button>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={selectAll} className="text-blue-600 text-[10px] font-black uppercase flex items-center gap-2 px-4 py-2 rounded-xl transition-all">
                    {selectedPapers.size === filteredResults.length ? <CheckSquare size={18}/> : <Square size={18}/>} SELECT ALL
                </button>
                <button onClick={exportToExcel} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg">
                    <FileSpreadsheet size={18}/> EXPORT SELECTION ({selectedPapers.size})
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[900px] overflow-y-auto scrollbar-hide">
              {displayedResults.map((res, i) => {
                const isSelected = selectedPapers.has(i);
                return (
                  <div key={i} className={`p-10 flex gap-8 items-start transition-all hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-l-[12px] border-blue-600' : ''}`}>
                    <div onClick={() => toggleSelection(i)} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600' : 'text-slate-200'}`}>
                      {isSelected ? <CheckSquare size={32}/> : <Square size={32}/>}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-5">
                        <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                        {res.isOpenAccess ? (
                           <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase"><CheckCircle size={16}/> Free Access</span>
                        ) : (
                           <span className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl flex items-center gap-2 italic text-[10px] uppercase font-black"><ShoppingCart size={16}/> Purchase Access</span>
                        )}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight mb-5">{res.title}</h3>
                      <div className="flex flex-wrap items-center gap-6 mb-8">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl"><User size={14} className="text-blue-500"/> {res.authors.join(', ')}</div>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold"><BookOpen size={14} className="text-blue-500"/> {res.journal}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-slate-400 font-black bg-white border border-slate-200 px-5 py-2 rounded-2xl">{res.year}</span>
                        <div className="ml-auto flex gap-4">
                          <button onClick={() => copyCitation(res)} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-slate-200 uppercase tracking-tighter"><Quote size={18}/> Cite</button>
                          <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-600 shadow-lg uppercase tracking-tighter">Portal <ExternalLink size={18}/></a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleCount < filteredResults.length && (
                <div className="p-10 text-center">
                  <button onClick={() => setVisibleCount(v => v + 50)} className="px-12 py-5 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl uppercase text-xs tracking-widest">Load More Results (+{filteredResults.length - visibleCount})</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-10 right-10 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50"><ArrowUpCircle size={24}/></button>
    </div>
  );
};

export default RESEARCHGAP;
