import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart, FileSpreadsheet, ArrowUpCircle, Quote, Tags, Layers, Sparkles
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
}

const RESEARCHGAP: React.FC = () => {
  // --- States ---
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2024);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set()); // Fixed: Using DOI as key
  
  // Performance States
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const observerTarget = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  // Filter States
  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fJournal, setFJournal] = useState<string>('All Journals');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [fCategory, setFCategory] = useState<string>('All Categories');
  const [activeTab, setActiveTab] = useState<'all' | 'oa'>('all');

  const globalAcademicCategories = [
    "All Categories", "Engineering & Tech", "Structural Materials", "Machine Learning & AI",
    "Medical & Health", "Sustainable Energy", "Physics & Space", "Chemistry"
  ];

  // --- Infinite Scroll Logic ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && results.length > visibleCount) {
          setVisibleCount(prev => prev + 20);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loading, results.length, visibleCount]);

  // --- Dynamic Filters ---
  const dynamicFilters = useMemo(() => {
    const pubs = Array.from(new Set(results.map(p => p.publisher))).sort();
    const jns = Array.from(new Set(results.map(p => p.journal))).sort();
    const auths = Array.from(new Set(results.flatMap(p => p.authors)))
      .filter(n => n.length > 3 && n !== "Anonymous").sort();
    
    return {
      publishers: ['All Publishers', ...pubs],
      journals: ['All Journals', ...jns],
      authors: ['All Authors', ...auths]
    };
  }, [results]);

  const yearOptions = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  // --- Selection Logic ---
  const toggleSelection = useCallback((doi: string) => {
    setSelectedPapers(prev => {
      const next = new Set(prev);
      if (next.has(doi)) next.delete(doi);
      else next.add(doi);
      return next;
    });
  }, []);

  // --- API Search with Exponential Backoff ---
  const handleSearch = async (overrideKeyword?: string) => {
    const activeTerm = overrideKeyword || keyword;
    if (!activeTerm) return;

    setLoading(true);
    setStatus(`Scanning Global Repositories...`);

    try {
      const categoryQuery = fCategory !== 'All Categories' ? ` ${fCategory}` : '';
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(activeTerm + categoryQuery)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=1000&sort=relevance`;
      
      const res = await fetch(url);
      
      if (res.status === 429) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        setStatus(`Rate limit hit. Retrying in ${waitTime/1000}s...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => handleSearch(overrideKeyword), waitTime);
        return;
      }

      const data = await res.json();
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Research',
        journal: item['container-title']?.[0] || 'International Journal',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || Math.random().toString(),
        publisher: item.publisher || 'Global Academic Node',
        authors: item.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || ['Anonymous'],
        isOpenAccess: !!item.license,
      }));

      setResults(papers);
      setRetryCount(0);
      setSelectedPapers(new Set());
      setVisibleCount(20);
      setStatus(`Success! Found ${papers.length} Academic Papers.`);
    } catch (err) {
      setStatus('Network sync issue. Retrying...');
      setTimeout(() => handleSearch(overrideKeyword), 3000);
    } finally {
      setLoading(false);
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

  // --- Skeleton Component ---
  const SkeletonCard = () => (
    <div className="p-10 flex gap-8 animate-pulse">
      <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
      <div className="flex-grow space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans p-2 md:p-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Nav Bar */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-6 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100"><Globe size={24} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Research Gap Scraper v15.0</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-1.5 rounded-xl gap-2 overflow-x-auto">
             {globalAcademicCategories.slice(1).map(cat => (
               <button key={cat} onClick={() => { setFCategory(cat); handleSearch(cat); }} className="whitespace-nowrap px-3 py-1.5 bg-white text-[9px] font-black uppercase rounded-lg border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">{cat}</button>
             ))}
          </div>
        </nav>

        {/* Search Engine Interface */}
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-white mb-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7 relative">
              <Search className="absolute left-5 top-5 text-slate-400" size={22}/>
              <input type="text" placeholder="Engineering Gaps, Material DOI..." className="w-full pl-14 pr-4 py-4.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-lg" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            
            <div className="xl:col-span-3 flex items-center bg-slate-50 rounded-2xl px-5 border-2 border-transparent">
              <Calendar size={20} className="text-slate-400 mr-3"/>
              <div className="flex items-center w-full gap-2 font-black text-xs">
                <select className="bg-transparent py-4 outline-none w-full" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span>-</span>
                <select className="bg-transparent py-4 outline-none w-full" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => handleSearch()} disabled={loading} className="xl:col-span-2 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 py-4">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20}/>}
              {loading ? 'MINING' : 'SEARCH'}
            </button>
          </div>
          {status && <div className="mt-4 text-[10px] font-black text-blue-600 flex items-center gap-2 uppercase animate-pulse tracking-widest"><CheckCircle size={14}/> {status}</div>}
        </div>

        {/* Dashboard Tools */}
        {results.length > 0 && (
          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl mb-6 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[9px] font-black text-blue-400 uppercase block mb-2 ml-1">Publisher Filter</label>
              <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border-none text-xs font-bold outline-none">
                {dynamicFilters.publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[9px] font-black text-blue-400 uppercase block mb-2 ml-1">Journal Origin</label>
              <select value={fJournal} onChange={(e)=>setFJournal(e.target.value)} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border-none text-xs font-bold outline-none">
                {dynamicFilters.journals.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <button className="bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] flex items-center gap-2 hover:bg-blue-500 transition-all uppercase">
              <Sparkles size={16}/> AI Gap Insight
            </button>
          </div>
        )}

        {/* Data List */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-10">
          <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
            <div className="flex bg-white p-1 rounded-lg border">
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-md text-[9px] font-black ${activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>ALL PAPERS</button>
              <button onClick={() => setActiveTab('oa')} className={`px-4 py-2 rounded-md text-[9px] font-black ${activeTab === 'oa' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>OPEN ACCESS</button>
            </div>
            <div className="flex gap-2">
              <button className="bg-white text-slate-900 border px-4 py-2 rounded-lg text-[10px] font-black flex items-center gap-2 hover:bg-slate-50">
                <FileSpreadsheet size={16}/> EXPORT ({selectedPapers.size})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
            
            {!loading && filteredResults.slice(0, visibleCount).map((res) => {
              const isSelected = selectedPapers.has(res.doi);
              return (
                <div key={res.doi} className={`p-6 md:p-8 flex gap-6 items-start transition-all ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}>
                  <div onClick={() => toggleSelection(res.doi)} className={`mt-1 cursor-pointer ${isSelected ? 'text-blue-600' : 'text-slate-200 hover:text-blue-400'}`}>
                    {isSelected ? <CheckSquare size={28} /> : <Square size={28}/>}
                  </div>
                  <div className="flex-grow">
                    <div className="flex gap-2 mb-2">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">{res.publisher}</span>
                      {res.isOpenAccess && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase">OA</span>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">{res.title}</h3>
                    <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 font-medium mb-4">
                      <div className="flex items-center gap-1"><User size={12}/> {res.authors[0]} {res.authors.length > 1 && 'et al.'}</div>
                      <div className="flex items-center gap-1"><BookOpen size={12}/> {res.journal}</div>
                      <div className="bg-slate-100 px-2 py-0.5 rounded font-bold">{res.year}</div>
                    </div>
                    <div className="flex gap-3 justify-end">
                       <button className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Quote size={18}/></button>
                       <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-all"><ExternalLink size={18}/></a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Scroll Target */}
          <div ref={observerTarget} className="h-10 w-full flex justify-center items-center">
            {loading && results.length > 0 && <Loader2 className="animate-spin text-blue-600" />}
          </div>
        </div>
      </div>
      
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all z-50"><ArrowUpCircle size={24}/></button>
    </div>
  );
};

export default RESEARCHGAP;
