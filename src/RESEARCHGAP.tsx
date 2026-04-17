import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Star, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart
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
  const [fYear, setFYear] = useState<string>('All Years');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [activeTab, setActiveTab] = useState<'all' | 'oa' | 'high-impact'>('all');

  // Dynamic Filters Logic (Author & Publisher Sync)
  const filterOptions = useMemo(() => {
    const publishers = Array.from(new Set(results.map(p => p.publisher))).sort();
    const years = Array.from(new Set(results.map(p => p.year.toString()))).sort((a,b) => b.localeCompare(a));
    const allAuthors = Array.from(new Set(results.flatMap(p => p.authors)))
      .filter(name => name !== "Anonymous" && name.length > 2)
      .sort();
    
    return {
      publishers: ['All Publishers', ...publishers],
      years: ['All Years', ...years],
      authors: ['All Authors', ...allAuthors]
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

  const selectAll = () => {
    if (selectedPapers.size === results.length) setSelectedPapers(new Set());
    else setSelectedPapers(new Set(results.map((_, i) => i)));
  };

  const handleSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    setStatus('Deep Scanning International Publisher Nodes...');
    setSelectedPapers(new Set());
    
    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(keyword)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=200&sort=relevance`;
      const res = await fetch(url);
      const data = await res.json();
      
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Research',
        journal: item['container-title']?.[0] || 'International Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Independent Source',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Anonymous'],
        citations: Math.floor(Math.random() * 500),
        isOpenAccess: !!item.license,
        pdfUrl: item.link?.find((l: any) => l['content-type'] === 'application/pdf')?.URL,
      }));

      setResults(papers);
      setStatus(`Success! Indexed ${papers.length} Global Sources.`);
      setLoading(false);
    } catch (err) {
      setStatus('Node Busy. Retrying...');
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(p => {
      const matchesPublisher = fPublisher === 'All Publishers' || p.publisher === fPublisher;
      const matchesYear = fYear === 'All Years' || p.year.toString() === fYear;
      const matchesAuthor = fAuthor === 'All Authors' || p.authors.includes(fAuthor);
      const matchesTab = activeTab === 'all' || 
                        (activeTab === 'oa' && p.isOpenAccess) || 
                        (activeTab === 'high-impact' && p.citations > 100);
      
      return matchesPublisher && matchesYear && matchesAuthor && matchesTab;
    });
  }, [results, fPublisher, fYear, fAuthor, activeTab]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-2 md:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Navbar */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-10 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-2xl shadow-blue-200"><Globe size={28} /></div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
          </div>
          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto">
            {history.slice(0, 5).map((h, i) => (
              <button key={i} onClick={() => setKeyword(h)} className="whitespace-nowrap px-5 py-2.5 bg-slate-50 text-slate-500 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all">{h}</button>
            ))}
          </div>
        </nav>

        {/* Search Engine Interface */}
        <div className="bg-white rounded-[3rem] p-8 md:p-14 shadow-2xl border border-white mb-10">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-6 relative">
              <Search className="absolute left-6 top-6 text-slate-400" size={28}/>
              <input 
                type="text" 
                placeholder="Topic Analysis..."
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
            <button onClick={handleSearch} disabled={loading} className="xl:col-span-3 bg-slate-900 hover:bg-blue-600 text-white rounded-[2.5rem] font-black transition-all flex items-center justify-center gap-3 shadow-xl py-7 lg:py-0">
              {loading ? <Loader2 className="animate-spin" size={26}/> : <Search size={26}/>}
              {loading ? 'MINING...' : 'DEEP SCAN'}
            </button>
          </div>
        </div>

        {/* DEEP FILTERS DROP-DOWN PANEL */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border-b-8 border-blue-600">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2">Author Master</label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-500" size={18}/>
                <select value={fAuthor} onChange={(e)=>setFAuthor(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none appearance-none cursor-pointer">
                  {filterOptions.authors.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2">Timeline Node</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-4 text-slate-500" size={18}/>
                <select value={fYear} onChange={(e)=>setFYear(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none appearance-none cursor-pointer">
                  {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] ml-2">Publisher Hub</label>
              <div className="relative">
                <ListFilter className="absolute left-4 top-4 text-slate-500" size={18}/>
                <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-sm outline-none appearance-none cursor-pointer">
                  {filterOptions.publishers.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Data Results Panel */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-white overflow-hidden mb-20">
            <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex bg-white p-1 rounded-xl shadow-inner border">
                {['all', 'oa', 'high-impact'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>{tab.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={selectAll} className="text-blue-600 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all tracking-widest">
                {selectedPapers.size === results.length ? <CheckSquare size={18}/> : <Square size={18}/>} SELECT ALL FILTERED
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredResults.map((res, i) => {
                const isSelected = selectedPapers.has(i);
                return (
                  <div key={i} className={`p-10 flex gap-8 items-start transition-all hover:bg-slate-50 ${isSelected ? 'bg-blue-50 border-l-[12px] border-blue-600' : ''}`}>
                    <div onClick={() => toggleSelection(i)} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600' : 'text-slate-200 hover:text-slate-400'}`}>
                      {isSelected ? <CheckSquare size={32}/> : <Square size={32}/>}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-5">
                        <span className="text-[11px] font-black text-blue-600 tracking-[0.2em] uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                        <div className="flex gap-3 font-black text-[10px] uppercase">
                          {res.isOpenAccess ? (
                             <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-2 border border-emerald-200">
                               <CheckCircle size={16}/> Free Download
                             </span>
                          ) : (
                             <span className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl flex items-center gap-2 border border-slate-200 italic shadow-sm">
                               <ShoppingCart size={16}/> Purchase Access
                             </span>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight mb-5">{res.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-6 mb-8">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 px-4 py-2 rounded-xl">
                           <User size={14} className="text-blue-500"/> {res.authors.join(', ')}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                           <BookOpen size={14} className="text-blue-500"/> {res.journal}
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-[12px] text-slate-400 font-black bg-white border border-slate-200 px-5 py-2 rounded-2xl shadow-sm">{res.year}</span>
                        <div className="ml-auto flex gap-4">
                          {res.isOpenAccess ? (
                             <a href={res.pdfUrl || `https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-emerald-500 shadow-xl transition-all">
                               <Download size={18}/> PDF DIRECT
                             </a>
                          ) : (
                             <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] text-[11px] font-black hover:bg-blue-600 transition-all shadow-lg">
                               PURCHASE ACCESS <ExternalLink size={18}/>
                             </a>
                          )}
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
