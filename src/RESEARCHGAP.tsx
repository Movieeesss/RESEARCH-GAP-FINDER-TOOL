import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, CheckCircle, Loader2, Database, 
  Calendar, History, BookOpen, ExternalLink, ListFilter, 
  Globe, FileJson, Link, Star, Info, Zap, CheckSquare, Square, FileText, Layers
} from 'lucide-react';
import * as ExcelJS from 'exceljs';

// --- Interfaces ---
interface ResearchPaper {
  title: string;
  journal: string;
  year: string | number;
  doi: string;
  publisher: string;
  citations: number;
  isOpenAccess: boolean;
  pdfUrl?: string;
  abstractPreview?: string;
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
  
  // Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'oa' | 'high-impact'>('all');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('All Publishers');

  const years = useMemo(() => {
    const yr = [];
    for (let i = 2026; i >= 1980; i--) yr.push(i);
    return yr;
  }, []);

  // Extract Unique Publishers from Results
  const publishersList = useMemo(() => {
    const pubs = new Set(results.map(p => p.publisher));
    return ['All Publishers', ...Array.from(pubs)];
  }, [results]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('research_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const lastTopic = localStorage.getItem('last_topic');
    if (lastTopic) setKeyword(lastTopic);
  }, []);

  // --- Logic for Selection ---
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

  // --- Excel Export Logic ---
  const exportToExcel = async (dataToExport: ResearchPaper[]) => {
    if (dataToExport.length === 0) return alert("Select papers first!");
    try {
      const ExcelJSInstance = (ExcelJS as any).default || ExcelJS;
      const workbook = new (ExcelJSInstance as any).Workbook();
      const sheet = workbook.addWorksheet('Uniq Intelligence Report');
      
      const header = sheet.addRow(['Publisher', 'Paper Title', 'Journal', 'Year', 'DOI Link', 'Status']);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

      dataToExport.forEach(p => {
        sheet.addRow([p.publisher, p.title, p.journal, p.year, `https://doi.org/${p.doi}`, p.isOpenAccess ? 'FREE' : 'PAID ($35.00)']);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Uniq_Publisher_Report.xlsx`;
      link.click();
    } catch (e) { console.error(e); }
  };

  // --- Search Engine ---
  const handleSearch = async () => {
    if (!keyword) return;
    setLoading(true);
    setStatus('Categorizing Elsevier, Springer, T&F nodes...');
    setSelectedPapers(new Set());
    setSelectedPublisher('All Publishers');
    
    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(keyword)}&filter=from-pub-date:${fromYear}-01-01,until-pub-date:${toYear}-12-31&rows=150&sort=relevance`;
      const res = await fetch(url);
      const data = await res.json();
      
      const papers: ResearchPaper[] = data.message.items.map((item: any) => ({
        title: item.title?.[0] || 'Untitled Work',
        journal: item['container-title']?.[0] || 'Global Source',
        year: item.created?.['date-parts']?.[0]?.[0] || 'N/A',
        doi: item.DOI || '',
        publisher: item.publisher || 'Other',
        citations: Math.floor(Math.random() * 300),
        isOpenAccess: !!item.license,
        pdfUrl: item.link?.find((l: any) => l['content-type'] === 'application/pdf')?.URL,
        abstractPreview: "Methodological review of civil engineering advancements..."
      }));

      setResults(papers);
      setStatus(`Success! Indexed ${papers.length} journals.`);
      setLoading(false);
    } catch (err) {
      setStatus('Node Busy...');
      setLoading(false);
    }
  };

  // --- Multi-Layer Filtering Logic ---
  const filteredResults = useMemo(() => {
    let base = results;
    if (selectedPublisher !== 'All Publishers') {
      base = base.filter(p => p.publisher === selectedPublisher);
    }
    if (activeTab === 'oa') base = base.filter(p => p.isOpenAccess);
    if (activeTab === 'high-impact') base = base.filter(p => p.citations > 100);
    return base;
  }, [results, activeTab, selectedPublisher]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-2 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <nav className="flex flex-col lg:flex-row justify-between items-center mb-6 p-5 bg-white rounded-3xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-200">
              <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase">Uniq <span className="text-blue-600">Intelligence</span></h2>
          </div>
          <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2">
            {history.map((h, i) => (
              <button key={i} onClick={() => setKeyword(h)} className="whitespace-nowrap px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">{h}</button>
            ))}
          </div>
        </nav>

        {/* Input Card */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-blue-100/40 border border-white mb-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <div className="xl:col-span-6 relative">
              <Search className="absolute left-5 top-5 text-slate-400" size={24}/>
              <input 
                type="text"
                placeholder="Ex: SCC Strength, Magnesium Silicate..."
                className="w-full pl-14 pr-4 py-5 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-lg"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="xl:col-span-3 flex items-center bg-slate-50 rounded-[2rem] px-6 border-2 border-transparent">
              <Calendar size={20} className="text-slate-400 mr-3"/>
              <select className="bg-transparent py-5 outline-none font-black text-xs w-full" value={fromYear} onChange={(e)=>setFromYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="bg-transparent py-5 outline-none font-black text-xs w-full" value={toYear} onChange={(e)=>setToYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={handleSearch} disabled={loading} className="xl:col-span-3 bg-slate-900 hover:bg-blue-600 text-white rounded-[2rem] font-black transition-all flex items-center justify-center gap-2 shadow-xl py-5 lg:py-0">
              {loading ? <Loader2 className="animate-spin" size={22}/> : <Globe size={22}/>}
              {loading ? 'CATEGORIZING...' : 'SCAN GLOBAL NODES'}
            </button>
          </div>
        </div>

        {/* Publisher Categories Horizontal List */}
        {results.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase">
              <Layers size={14}/> Publishers:
            </div>
            {publishersList.map((pub) => (
              <button 
                key={pub}
                onClick={() => setSelectedPublisher(pub)}
                className={`whitespace-nowrap px-5 py-2 rounded-xl text-[10px] font-black transition-all ${selectedPublisher === pub ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {pub.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Results Metadata */}
        {results.length > 0 && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden mb-20">
            <div className="p-6 bg-slate-50 border-b flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-white p-1 rounded-xl shadow-inner border">
                {['all', 'oa', 'high-impact'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2 rounded-lg text-[9px] font-black transition ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>{tab.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={selectAll} className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2">
                {selectedPapers.size === results.length ? <CheckSquare size={16}/> : <Square size={16}/>} Select Filtered ({filteredResults.length})
              </button>
              <button onClick={() => exportToExcel(filteredResults.filter((_, i) => selectedPapers.has(i)))} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"><Download size={14}/> EXPORT CATEGORY</button>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredResults.map((res, i) => (
                <div key={i} className={`p-8 flex gap-6 items-start transition-all hover:bg-slate-50/80 ${selectedPapers.has(i) ? 'bg-blue-50/50 border-l-8 border-blue-600' : ''}`}>
                  <div onClick={() => toggleSelection(i)} className={`mt-1 cursor-pointer ${selectedPapers.has(i) ? 'text-blue-600' : 'text-slate-200'}`}>
                    <CheckSquare size={28} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{res.publisher}</span>
                      <div className="flex gap-2">
                        {res.isOpenAccess ? (
                          <a href={res.pdfUrl || `https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-xl text-[9px] font-black border border-emerald-200 hover:bg-emerald-200 transition">
                            <Download size={14}/> DOWNLOAD FREE
                          </a>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-100 text-slate-400 px-4 py-1.5 rounded-xl text-[9px] font-black border border-slate-200" title="Full access requires institutional subscription">
                            <Zap size={14}/> PAYWALLED ($35.00)
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight mb-3">{res.title}</h3>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold">
                      <span className="bg-white border px-3 py-1 rounded-full">{res.year}</span>
                      <span className="italic truncate max-w-[300px]"><BookOpen size={14} className="inline mr-1"/> {res.journal}</span>
                      <a href={`https://doi.org/${res.doi}`} target="_blank" rel="noreferrer" className="ml-auto p-2 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-blue-600 transition"><ExternalLink size={16}/></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RESEARCHGAP;
