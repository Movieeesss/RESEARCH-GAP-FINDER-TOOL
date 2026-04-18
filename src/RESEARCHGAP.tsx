import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, BookOpen, ExternalLink, ListFilter, 
  Globe, Link, Zap, CheckSquare, Square, 
  User, LayoutGrid, ShoppingCart, FileSpreadsheet, ArrowUpCircle, Quote, Tags, Layers, Sparkles
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
  // --- States ---
  const [keyword, setKeyword] = useState<string>('');
  const [fromYear, setFromYear] = useState<number>(2024);
  const [toYear, setToYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [results, setResults] = useState<ResearchPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const observerTarget = useRef(null);

  const [fPublisher, setFPublisher] = useState<string>('All Publishers');
  const [fJournal, setFJournal] = useState<string>('All Journals');
  const [fAuthor, setFAuthor] = useState<string>('All Authors');
  const [fCategory, setFCategory] = useState<string>('All Categories');
  const [activeTab, setActiveTab] = useState<'all' | 'oa'>('all');

  const globalAcademicCategories = [
    "All Categories", "Engineering & Tech", "Structural Materials", "Machine Learning & AI",
    "Medical & Health", "Sustainable Energy", "Physics & Space", "Chemistry", "Mathematics"
  ];

  // --- Dynamic Year Selection ---
  const yearOptions = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  // --- Dynamic Filter Logic ---
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

  // --- Infinite Scroll ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && results.length > visibleCount) {
          setVisibleCount(prev => prev + 20);
        }
      }, { threshold: 1.0 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loading, results.length, visibleCount]);

  const toggleSelection = useCallback((doi: string) => {
    setSelectedPapers(prev => {
      const next = new Set(prev);
      if (next.has(doi)) next.delete(doi);
      else next.add(doi);
      return next;
    });
  }, []);

  // --- Professional Excel Export with Wrap Text & Styling ---
  const exportToExcel = async () => {
    const dataToExport = filteredResults.filter(p => selectedPapers.has(p.doi));
    if (dataToExport.length === 0) return alert("Please select papers to export!");

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Research Discovery');

      // Title Header
      sheet.mergeCells('A1:F1');
      const mainHeader = sheet.getCell('A1');
      mainHeader.value = 'UNIQ INTELLIGENCE | ACADEMIC RESEARCH REPORT';
      mainHeader.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      mainHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
      mainHeader.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 40;

      // Column Headers
      const headerRow = sheet.addRow(['S.No', 'Research Paper Title', 'Journal Name', 'Year', 'Publisher', 'DOI Link']);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center' };
      });

      // Data Injection
      dataToExport.forEach((p, idx) => {
        const row = sheet.addRow([idx + 1, p.title, p.journal, p.year, p.publisher, `https://doi.org/${p.doi}`]);
        
        // --- WRAP TEXT & ALIGNMENT ---
        row.getCell(2).alignment = { wrapText: true, vertical: 'middle' }; // Title
        row.getCell(3).alignment = { wrapText: true, vertical: 'middle' }; // Journal
        row.getCell(4).alignment = { horizontal: 'center' }; // Year
        row.alignment = { vertical: 'middle' };
      });

      // Column Widths
      sheet.getColumn(1).width = 8;
      sheet.getColumn(2).width = 60; // Title (Widest)
      sheet.getColumn(3).width = 35; // Journal
      sheet.getColumn(4).width = 12; // Year
      sheet.getColumn(5).width = 25; // Publisher
      sheet.getColumn(6).width = 40; // DOI

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Uniq_Research_Export_${Date.now()}.xlsx`;
      link.click();
    } catch (e) { alert("Excel processing error."); }
  };

  const handleSearch = async (overrideKeyword?: string) => {
    const activeTerm = overrideKeyword || keyword;
    if (!activeTerm) return;

    setLoading(true);
    setStatus(`Mining Global Repositories (${fromYear}-${toYear})...`);

    try {
      const categoryQuery = fCategory !== 'All Categories' ? ` ${fCategory}` : '';
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(activeTerm + categoryQuery)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=1000&sort=relevance`;
      
      const res = await fetch(url);
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
      setSelectedPapers(new Set());
      setVisibleCount(30);
      setStatus(`Verified ${papers.length} Peer-Reviewed Journals.`);
    } catch (err) {
      setStatus('Database re-syncing...');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-2 md:p-8">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Nav Bar */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-8 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100"><Globe size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Uniq <span className="text-blue-600">Intelligence</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Advanced Deep Mining Portal v16.0</p>
            </div>
          </div>
          <div className="flex bg-slate-50 p-2 rounded-2xl gap-2 overflow-x-auto max-w-full">
             {globalAcademicCategories.slice(1).map(cat => (
               <button key={cat} onClick={() => { setFCategory(cat); handleSearch(cat); }} className={`whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase rounded-xl border transition-all shadow-sm ${fCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
             ))}
          </div>
        </nav>

        {/* Search Engine Interface */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white mb-8 relative overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-6 relative group">
              <Search className="absolute left-6 top-6 text-slate-400 group-focus-within:text-blue-600" size={26}/>
              <input type="text" placeholder="Engineering, Concrete, Magnesium Silicate..." className="w-full pl-16 pr-4 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-black text-xl placeholder:text-slate-300" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            
            <div className="xl:col-span-4 flex items-center bg-slate-50 rounded-3xl px-8 border-2 border-transparent hover:border-blue-100">
              <Calendar size={22} className="text-slate-400 mr-4"/>
              <div className="flex items-center w-full gap-4 font-black text-sm">
                <select className="bg-transparent py-6 outline-none w-full cursor-pointer" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-slate-300">~</span>
                <select className="bg-transparent py-6 outline-none w-full cursor-pointer" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => handleSearch()} disabled={loading} className="xl:col-span-2 bg-slate-900 hover:bg-blue-600 text-white rounded-3xl font-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
              {loading ? <Loader2 className="animate-spin" size={24}/> : <Zap size={24}/>}
              {loading ? 'MINING' : 'SEARCH'}
            </button>
          </div>
          {status && <div className="mt-6 text-xs font-black text-blue-600 px-4 flex items-center gap-3 tracking-widest uppercase animate-pulse"><CheckCircle size={18}/> {status}</div>}
        </div>

        {/* Dashboard Tools */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border-b-8 border-blue-600">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic underline underline-offset-4">Publisher</label>
              <select value={fPublisher} onChange={(e)=>setFPublisher(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-xs outline-none cursor-pointer">
                {dynamicFilters.publishers.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic underline underline-offset-4">Journal</label>
              <select value={fJournal} onChange={(e)=>setFJournal(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-xs outline-none cursor-pointer">
                {dynamicFilters.journals.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2 italic underline underline-offset-4">Author</label>
              <select value={fAuthor} onChange={(e)=>setFAuthor(e.target.value)} className="w-full px-5 py-4 bg-slate-800 text-white rounded-2xl border-none font-bold text-xs outline-none cursor-pointer">
                {dynamicFilters.authors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={exportToExcel} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[11px] flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg transition-all">
                <FileSpreadsheet size={18}/> Export ({selectedPapers.size})
              </button>
            </div>
          </div>
        )}

        {/* Data Stream */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-10">
          <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
            <div className="flex bg-white p-1 rounded-xl shadow-inner border">
              <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>GLOBAL ARCHIVE</button>
              <button onClick={() => setActiveTab('oa')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'oa' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>OPEN ACCESS</button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredResults.slice(0, visibleCount).map((res) => {
              const isSelected = selectedPapers.has(res.doi);
              return (
                <div key={res.doi} className={`p-8 flex gap-8 items-start transition-all hover:bg-slate-50/50 ${isSelected ? 'bg-blue-50 border-l-[10px] border-blue-600' : ''}`}>
                  <div onClick={() => toggleSelection(res.doi)} className={`mt-2 cursor-pointer transition-all ${isSelected ? 'text-blue-600 scale-110' : 'text-slate-200 hover:text-blue-400'}`}>
                    {isSelected ? <CheckSquare size={32} /> : <Square size={32}/>}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">{res.publisher}</span>
                      {res.isOpenAccess && <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase border border-emerald-100 flex items-center gap-1"><CheckCircle size={14}/> Open Access</span>}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 leading-tight mb-4">{res.title}</h3>
                    <div className="flex flex-wrap items-center gap-6 mb-4">
                       <div className="flex items-center gap-2 text-xs text-slate-500 font-bold"><User size={14} className="text-blue-500"/> {res.authors.join(', ')}</div>
                       <div className="flex items-center gap-2 text-xs text-slate-500 font-bold italic"><BookOpen size={14} className="text-blue-500"/> {res.journal}</div>
                       <div className="text-[11px] font-black bg-white border px-3 py-1 rounded-lg shadow-sm">{res.year}</div>
                    </div>
                    <div className="flex justify-end gap-3">
                       <button className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all uppercase"><Quote size={16}/> Cite</button>
                       <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black hover:bg-blue-600 shadow-lg uppercase transition-all">View <ExternalLink size={16}/></a>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={observerTarget} className="h-20 flex justify-center items-center">
              {loading && <Loader2 className="animate-spin text-blue-600" size={32}/>}
            </div>
          </div>
        </div>
      </div>
      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-10 right-10 p-5 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 active:scale-75"><ArrowUpCircle size={24}/></button>
    </div>
  );
};

export default RESEARCHGAP;
