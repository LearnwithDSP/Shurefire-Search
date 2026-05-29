import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  Search, 
  Sparkles, 
  Cpu, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  RefreshCw, 
  Phone, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Calendar, 
  MapPin, 
  Building2,
  ChevronRight,
  Database,
  Calculator,
  Send,
  ArrowRight,
  Sparkle,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { MaterialCategory, SupplyRegion, MaterialItem, Supplier, SearchResultItem } from "./types.js";
import { QuantityCalculator } from "./components/QuantityCalculator.js";
import { LeadCaptureForm } from "./components/LeadCaptureForm.js";

// Helper for Naira currency format
const formatNaira = (value: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace("NGN", "₦");
};

// Available regions in platform
const REGIONS: SupplyRegion[] = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Kaduna", "Enugu", "Ibadan"
];

const CATEGORIES = Object.values(MaterialCategory);

// Custom SVG Shorefire Logo mirroring the attached graphic exactly
function ShorefireLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const isLg = size === "lg";
  const isSm = size === "sm";

  return (
    <div className={`flex items-center select-none text-left font-sans ${isSm ? "gap-2" : isLg ? "gap-4" : "gap-3"}`}>
      {/* 1. Large Red Shield Logo Icon */}
      <div className={`shrink-0 ${isSm ? "h-9 w-9" : isLg ? "h-16 w-16" : "h-12 w-12"}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 4 H94 V50 C94 76, 50 96, 50 96 C50 96, 6 76, 6 50 V4 Z" fill="#a71d1d" />
          <path d="M12 36 L42 74 L88 18" stroke="white" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 2. Text Brand Assembly */}
      <div className="flex flex-col justify-center">
        {/* Sh + Small Shield representing 'o' / 'u' + refire */}
        <div className={`flex items-center font-bold font-sans text-[#a71d1d] tracking-tight leading-none ${
          isSm ? "text-[19px]" : isLg ? "text-[42px]" : "text-[26px]"
        }`}>
          <span className="font-extrabold">Sh</span>
          {/* Small checkmarked shield */}
          <div className={`shrink-0 mx-[1.5px] ${
            isSm ? "h-[14px] w-[14px] mt-[1.5px]" : isLg ? "h-[29px] w-[29px] mt-[3px]" : "h-[18px] w-[18px] mt-[2px]"
          }`}>
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 4 H94 V50 C94 76, 50 96, 50 96 C50 96, 6 76, 6 50 V4 Z" fill="#a71d1d" />
              <path d="M12 36 L42 74 L88 18" stroke="white" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-extrabold">refire</span>
        </div>
        
        {/* Tagline */}
        <span className={`text-[#8C3A3A] font-sans tracking-wide font-medium mt-0.5 whitespace-nowrap opacity-90 ${
          isSm ? "text-[7.5px]" : isLg ? "text-[12.5px]" : "text-[9.5px]"
        }`}>
          ....Built for you
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"search" | "calculator" | "quote" | "terminals">("search");
  
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<SupplyRegion | "">("");
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | "">("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Search state result
  const [aiAnswer, setAiAnswer] = useState("");
  const [featuredAnswer, setFeaturedAnswer] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([]);
  const [apiLogs, setApiLogs] = useState<{ supplierId: string; supplierName: string; status: "success" | "offline" | "slow"; latencyMs: number; stockFound: number }[]>([]);
  const [localMaterials, setLocalMaterials] = useState<MaterialItem[]>([]);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  // Supplier profiles
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierRegionFilter, setSupplierRegionFilter] = useState("");

  // Initial load
  useEffect(() => {
    // Load suppliers catalog on mount
    fetch("/api/suppliers")
      .then(res => res.json())
      .then(data => setAllSuppliers(data))
      .catch(err => console.error("Error loading suppliers list", err));

    // Warm up the database index in the background without forcing the client into hasSearched mode
    triggerSearch(false, "Dangote cement 3X price", "Lagos", MaterialCategory.CEMENT_BINDERS, true);
  }, []);

  const triggerSearch = async (
    forceRefresh: boolean = false, 
    overrideQuery?: string, 
    overrideRegion?: string, 
    overrideCategory?: string,
    preventUIStateShift = false
  ) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    if (!preventUIStateShift) {
      setHasSearched(true);
      setActiveTab("search"); // Switch to search tab on manual action
    }

    const activeQuery = overrideQuery !== undefined ? overrideQuery : query;
    const activeRegion = overrideRegion !== undefined ? overrideRegion : selectedRegion;
    const activeCategory = overrideCategory !== undefined ? overrideCategory : selectedCategory;

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: activeQuery,
          region: activeRegion,
          category: activeCategory,
          forceRefresh
        })
      });

      if (!response.ok) {
        throw new Error("Search API error");
      }

      const result = await response.json();
      setAiAnswer(result.answer || "");
      setFeaturedAnswer(result.featuredAnswer || result.answer || "");
      setSearchResults(result.searchResults || []);
      setExpandedResults({});
      setGroundingSources(result.groundingSources || []);
      setApiLogs(result.simulatedApiLogs || []);
      setLocalMaterials(result.localMaterials || []);
      setIsCached(result.isCached ?? false);
      setCachedAt(result.cachedAt || null);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    triggerSearch(false);
  };

  // Keyboard pill click trigger
  const handlePillClick = (term: string, preCategory?: MaterialCategory) => {
    setQuery(term);
    if (preCategory) {
      setSelectedCategory(preCategory);
    }
    triggerSearch(false, term, selectedRegion, preCategory);
  };

  // Switch tab with helper variables reset if necessary
  const handleTabChange = (tab: "search" | "calculator" | "quote" | "terminals") => {
    setActiveTab(tab);
  };

  const handleResetSearch = () => {
    setHasSearched(false);
    setQuery("");
    setSelectedRegion("");
    setSelectedCategory("");
  };

  // Filter out suppliers catalog locally based on search
  const filteredSuppliers = allSuppliers.filter(sup => {
    const matchesQuery = sup.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) || 
                         sup.marketName.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                         sup.city.toLowerCase().includes(supplierSearchQuery.toLowerCase());
    const matchesRegion = !supplierRegionFilter || sup.state.toLowerCase() === supplierRegionFilter.toLowerCase() || sup.city.toLowerCase() === supplierRegionFilter.toLowerCase();
    return matchesQuery && matchesRegion;
  });

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-slate-900 font-sans flex flex-col justify-between selection:bg-rose-100 selection:text-brand-primary">
      
      {/* Premium Micro Status Banner */}
      <div className="bg-slate-950 py-2.5 px-4 text-center text-[10px] sm:text-[11px] text-slate-300 flex items-center justify-center gap-2 border-b border-slate-900 font-mono tracking-wide">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-subtle shrink-0" />
        <span>Sovereign Price Database Active • Synced across 9 Structural Depots & Importers • Live Nigeria Index</span>
      </div>

      {/* Modern SaaS Transparent Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo Left */}
          <div className="cursor-pointer hover:opacity-95 transition-opacity" onClick={handleResetSearch}>
            <ShorefireLogo size="sm" />
          </div>

          {/* Clean Segmented Tab Navigation Switcher - Custom Silicon Valley Rounded Segments */}
          <nav className="flex items-center gap-0.5 bg-stone-100/80 p-1 rounded-xl border border-stone-200/50 shadow-inner">
            <button 
              onClick={() => handleTabChange("search")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${activeTab === "search" ? "bg-white text-slate-900 shadow-sm border border-stone-200/10" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>AI Search Engine</span>
            </button>
            <button 
              onClick={() => handleTabChange("calculator")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${activeTab === "calculator" ? "bg-white text-slate-900 shadow-sm border border-stone-200/10" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Calculator className="h-3.5 w-3.5 text-brand-primary" />
              <span>Seyi Alao Estimator</span>
            </button>
            <button 
              onClick={() => handleTabChange("quote")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${activeTab === "quote" ? "bg-white text-slate-900 shadow-sm border border-stone-200/10" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Match Wholesale Quotes</span>
            </button>
            <button 
              onClick={() => handleTabChange("terminals")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${activeTab === "terminals" ? "bg-white text-slate-900 shadow-sm border border-stone-200/10" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Merchant Directory</span>
            </button>
          </nav>

          {/* Quick Active Badge Right */}
          <div className="hidden lg:flex items-center gap-2 select-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#7f1616] bg-red-100/60 border border-red-200/40 px-2.5 py-1 rounded-md font-semibold">Terminal Synchronized</span>
          </div>

        </div>
      </header>

      {/* Core Dynamic Screen Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        
        {/* TAB 1: SEARCH INTERACTION ENGINE */}
        {activeTab === "search" && (
          <div className="space-y-12">
            
            {/* GOOGLE INTERFACE LIKE HOME VIEW */}
            {!hasSearched ? (
              <div className="flex flex-col items-center justify-center pt-10 pb-16 max-w-4xl mx-auto space-y-10 animate-fade-in">
                
                {/* Clean, Centered Logo Assembly */}
                <div className="transform scale-110 md:scale-120 my-4">
                  <ShorefireLogo size="lg" />
                </div>

                <div className="text-center space-y-3 max-w-2xl">
                  <h1 className="text-3xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">
                    Instant Building Material Intelligence
                  </h1>
                  <p className="text-sm md:text-base text-stone-500 max-w-lg mx-auto font-normal leading-relaxed">
                    Direct access to cement spot prices, steel rebar specs, framing indexes, and sandbox estimators across West Africa.
                  </p>
                </div>

                {/* Highly-designed crisp Silicon Valley Search container */}
                <div className="w-full max-w-2xl bg-white p-3.5 rounded-3xl border border-stone-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] focus-within:ring-4 focus-within:ring-brand-primary/5 transition-all">
                  <form onSubmit={handleSearchSubmit} className="space-y-3.5">
                    
                    {/* Primary TextInput Segment */}
                    <div className="relative flex items-center">
                      <Search className="absolute left-4.5 h-5 w-5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="e.g. Standard Dangote cement, 16mm structural rebars, hollow block prices..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12.5 pr-12.5 py-3.5 bg-transparent rounded-full focus:outline-none text-sm font-medium text-slate-800 placeholder:text-stone-400"
                      />
                      <div className="absolute right-4.5 p-1 rounded-lg bg-red-50/50">
                        <Sparkle className="h-4 w-4 text-brand-primary animate-pulse-subtle" />
                      </div>
                    </div>

                    {/* Integrated SaaS Selection Filters with custom styling */}
                    <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-stone-100">
                      
                      <div className="relative">
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value as SupplyRegion)}
                          className="w-full px-4 py-2.5 bg-stone-50/45 rounded-xl border border-stone-200/50 text-[11px] font-bold text-stone-600 cursor-pointer focus:outline-none hover:bg-stone-50"
                        >
                          <option value="">🇳🇬 All Sourcing Regions (States)</option>
                          {REGIONS.map(reg => (
                            <option key={reg} value={reg}>{reg} State Hub</option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory)}
                          className="w-full px-4 py-2.5 bg-stone-50/45 rounded-xl border border-stone-200/50 text-[11px] font-bold text-stone-600 cursor-pointer focus:outline-none hover:bg-stone-50"
                        >
                          <option value="">🧱 All Material Categories</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Google Action Buttons Style */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto px-7 py-3 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-slate-900/10 text-center"
                      >
                        {isLoading ? "Consulting Direct Ledger..." : "Search Sovereign Database"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("calculator")}
                        className="w-full sm:w-auto px-7 py-3 bg-stone-100 hover:bg-stone-200/80 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                      >
                        <Calculator className="h-3.5 w-3.5 text-stone-500" />
                        <span>Launch Cost Estimator</span>
                      </button>
                    </div>

                  </form>
                </div>

                {/* Classic Google-inspired suggestion pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl text-center select-none pt-2">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mr-2">Top Queries:</span>
                  <button 
                    onClick={() => handlePillClick("Standard Portland Cement", MaterialCategory.CEMENT_BINDERS)}
                    className="text-xs font-medium text-stone-600 bg-white hover:border-stone-300 hover:text-stone-900 px-3.5 py-2 rounded-xl border border-stone-200 transition-all cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                  >
                    Cement Prices
                  </button>
                  <button 
                    onClick={() => handlePillClick("16mm iron rods", MaterialCategory.STEEL_REBARS)}
                    className="text-xs font-medium text-stone-600 bg-white hover:border-stone-300 hover:text-stone-900 px-3.5 py-2 rounded-xl border border-stone-200 transition-all cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                  >
                    Steel Rebar 16mm
                  </button>
                  <button 
                    onClick={() => handlePillClick("9-inch hollow concrete block", MaterialCategory.BLOCKS_AGGREGATES)}
                    className="text-xs font-medium text-stone-600 bg-white hover:border-stone-300 hover:text-stone-900 px-3.5 py-2 rounded-xl border border-stone-200 transition-all cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                  >
                    Hollow Blocks 9"
                  </button>
                </div>

                {/* Sovereign Direct Execution Links (Homepage dashboard router) */}
                <div className="w-full pt-12 border-t border-stone-200/50">
                  <div className="text-center mb-8">
                    <span className="text-[9px] font-bold text-brand-primary bg-red-50 border border-rose-100 pr-3.5 pl-3.5 py-1 rounded-full uppercase tracking-widest font-mono">Direct Sourcing Routings</span>
                    <h2 className="text-lg font-display font-medium text-slate-800 mt-3">What are you coordinating today?</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Option 1 */}
                    <div 
                      onClick={() => handleTabChange("calculator")}
                      className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_1px_10px_rgba(0,0,0,0.01)] hover:border-brand-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all cursor-pointer group space-y-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                        <Calculator className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-primary transition-colors">Quantity Estimator</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          Step-by-step structural sandbox. Map cement, aggregates, and steel specs to standard field costs overseen by COREN experts.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-1">
                        <span>Launch Estimator</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Option 2 */}
                    <div 
                      onClick={() => handleTabChange("quote")}
                      className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_1px_10px_rgba(0,0,0,0.01)] hover:border-brand-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all cursor-pointer group space-y-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-red-50/50 flex items-center justify-center text-brand-primary shrink-0">
                        <Send className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-primary transition-colors">Direct Sourcing RFQ</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          Submit your bill of quantities to certified merchants and first-tier block casting yards to get real, non-agent trade prices.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-1">
                        <span>Request Trade Match</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Option 3 */}
                    <div 
                      onClick={() => handleTabChange("terminals")}
                      className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_1px_10px_rgba(0,0,0,0.01)] hover:border-brand-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all cursor-pointer group space-y-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center text-slate-700 shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-primary transition-colors">Merchant Directory</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">
                          Connect immediately with verified materials terminals, rebar merchants, and cement depots near your active site locations.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-1">
                        <span>Browse Directory</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              
              // SEARCH RESULTS UNFOLDED (COLLAPSED HEADER LIKE GOOGLE RESULTS SCREEN)
              <div className="space-y-6">
                
                {/* Collapsed Search Header Widget */}
                <div className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-2 flex-1 w-full max-w-2xl">
                    <button 
                      onClick={handleResetSearch}
                      className="p-2 hover:bg-stone-50 rounded-xl text-stone-500 hover:text-stone-800"
                      title="Back to home"
                    >
                      ←
                    </button>
                    
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                      <div className="relative flex-1 flex items-center">
                        <Search className="absolute left-3.5 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-xs font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-brand-primary hover:bg-[#831818] text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Search
                      </button>
                    </form>
                  </div>

                  {/* Tiny Active Filter status */}
                  <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto select-none pt-0.5 md:pt-0">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest shrink-0">In view:</span>
                    <span className="text-[10px] font-extrabold text-stone-600 bg-stone-100 px-2 py-1 rounded">
                      🗺️ State: {selectedRegion ? `${selectedRegion} Hub` : "Entire Nigeria"}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#ae2424] bg-red-50 border border-red-100 px-2 py-1 rounded">
                      🧱 Category: {selectedCategory || "All Categories"}
                    </span>
                  </div>

                </div>

                {/* Status & Cache Synced indicator */}
                <div className="bg-stone-50/85 rounded-2xl border border-stone-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-[0_1px_4px_rgba(0,0,0,0.012)]">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl shadow-sm text-brand-primary">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap text-left">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 font-mono">Inventory Ledger Network</h3>
                        {isCached ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                            ✓ Synchronized Cache
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-red-50 text-brand-primary border border-rose-100 px-2.5 py-0.5 rounded-full animate-pulse-subtle">
                            ● Broad Multi-Terminal Live Index
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-stone-500 mt-1 max-w-xl select-text">
                        {isCached 
                          ? `This result set was served from instant Firestore query caches. Real-time updates push automatically to this cache upon price shifts.`
                          : `Live structural ledger compiled successfully. Decoupled terminals returned instant stock counters and checked merchant queues.`
                        }
                      </p>
                      
                      {cachedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono mt-1">
                          <Calendar className="h-3 w-3" /> Ledger Updated: {new Date(cachedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => triggerSearch(true)}
                      disabled={isRefreshing || isLoading}
                      className="w-full sm:w-auto px-4 py-2.5 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs text-stone-600 font-sans"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-brand-primary" : ""}`} />
                      <span>{isRefreshing ? "Repolling Wholesalers..." : "Force Realtime Stock Query"}</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC TWO-COLUMN SAAS RESULTS LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* LEFT COLUMN: SOURCE OF WISDOM AND CHIPS */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Primary expert AI Response */}
                    <div className="bg-white rounded-3xl border border-stone-200 shadow-[0_4px_35px_rgba(0,0,0,0.015)] p-6 sm:p-8 space-y-6 text-left">
                      
                      <div className="flex items-center justify-between border-b border-stone-100 pb-4 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-red-50/50 flex items-center justify-center text-brand-primary shrink-0">
                            <Cpu className="h-5 w-5 animate-pulse-subtle" />
                          </div>
                          <div>
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">Expert Sourcing Digest</h2>
                            <p className="text-[10px] text-stone-400 tracking-wider uppercase font-semibold mt-0.5 font-sans">Sovereign Direct Wholesalers Intelligence</p>
                          </div>
                        </div>
                        
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-md text-right shrink-0 uppercase tracking-wider font-mono">
                          ✓ ACTIVE INDEX
                        </span>
                      </div>

                      {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-3">
                          <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs text-stone-400 font-medium tracking-wide">Retrieving terminal rates and compiling real-time insights...</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          
                          {/* Google Featured Snippet (Main answer) */}
                          <div className="bg-stone-50/50 border border-stone-100 shadow-[0_1px_5px_rgba(0,0,0,0.01)] p-6 sm:p-8 rounded-2xl space-y-4 font-sans relative overflow-hidden text-left shadow-xs">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-slate-400 to-emerald-600" />
                            <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold tracking-widest uppercase mb-1 font-mono">
                              <span>AUTHORITATIVE ADVISORY COMPILATION</span>
                              <span className="text-brand-primary bg-red-50 border border-red-100 px-2 py-0.5 rounded font-bold font-sans">COREN APPROVED</span>
                            </div>

                            {/* Un-hyperlinked Result Title matching prompt */}
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight leading-snug pb-2.5 border-b border-stone-100">
                              {query ? `Optimized structural advice & guidelines on: "${query}"` : "Shorefire Sourcing Hub Knowledge Panel"}
                            </h3>

                            {/* Featured snippet summary prose */}
                            <div className="text-stone-850 text-xs sm:text-sm leading-relaxed prose prose-stone max-w-none pt-1">
                              <Markdown>{featuredAnswer || aiAnswer}</Markdown>
                            </div>

                            <div className="text-[10px] text-stone-400 italic pt-3.5 border-t border-stone-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <span>Source: Shorefire Real-World Sourcing Index & Technical Advisory Panel</span>
                              <span className="font-semibold text-emerald-700 not-italic font-sans">✓ Active West Africa Spot Verification</span>
                            </div>
                          </div>

                          {/* 10 Google-style search engine results */}
                          <div className="space-y-6 pt-2">
                            <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Web Search Results</h3>
                              <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 rounded-full font-bold">10 active matches</span>
                            </div>

                            {searchResults && searchResults.length > 0 ? (
                              <div className="space-y-5">
                                {searchResults.map((result: SearchResultItem, idx: number) => {
                                  const isExpanded = !!expandedResults[result.id];
                                  const isShurefireLink = result.url?.includes("wa.me") || result.siteName?.toLowerCase().includes("shurefire");

                                  return (
                                    <div 
                                      key={result.id || idx} 
                                      className={`pb-5 border-b border-stone-100/70 last:border-0 hover:bg-stone-50/20 p-2.5 rounded-xl transition-all ${
                                        isShurefireLink ? "bg-emerald-50/30 border border-emerald-100/40 p-4 rounded-xl shadow-xs" : ""
                                      }`}
                                    >
                                      {/* Source Web Domain Breadcrumb */}
                                      <div className="flex items-center gap-2 text-xs text-[#202124] mb-1">
                                        <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                                          isShurefireLink ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                                        } font-bold shrink-0`}>
                                          {isShurefireLink ? "💬" : "🌐"}
                                        </div>
                                        <div className="flex items-center gap-1 flex-wrap font-medium">
                                          <span className="text-slate-800 font-bold">{result.siteName}</span>
                                          <span className="text-stone-400 font-normal">›</span>
                                          <span className="text-stone-500 font-mono text-[10px] truncate max-w-[200px] sm:max-w-xs">{result.url}</span>
                                        </div>
                                      </div>

                                      {/* Google Result Title: NOT hyperlinked as requested, click toggles expand */}
                                      <div 
                                        onClick={() => setExpandedResults(prev => ({ ...prev, [result.id]: !prev[result.id] }))}
                                        className="group cursor-pointer block leading-snug font-sans select-none"
                                      >
                                        <h3 className={`text-[16px] sm:text-[18px] ${
                                          isShurefireLink ? "text-emerald-800 font-bold" : "text-[#1a0dab] group-hover:underline"
                                        } leading-normal transition-all flex items-center gap-1.5`}>
                                          <span>{result.title}</span>
                                          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform text-slate-400 ${
                                            isExpanded ? "rotate-180 text-brand-primary" : ""
                                          }`} />
                                        </h3>
                                      </div>

                                      {/* Snippet summary Paragraph */}
                                      <p className="text-xs sm:text-sm text-[#4d5156] mt-1 leading-relaxed">
                                        {result.snippet}
                                      </p>

                                      {/* Expandable detailed content section */}
                                      {isExpanded && (
                                        <div className="mt-3 bg-stone-50/60 border border-stone-100 p-4 rounded-xl text-stone-800 text-xs sm:text-sm leading-relaxed shadow-inner space-y-3 animate-fadeIn">
                                          <div className="prose prose-stone max-w-none text-stone-700 font-sans">
                                            <Markdown>{result.fullContent}</Markdown>
                                          </div>
                                          
                                          {isShurefireLink && (
                                            <div className="pt-2 flex flex-wrap gap-2 items-center">
                                              <a
                                                href="https://wa.me/2349023089987"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer inline-flex"
                                              >
                                                <span>💬 Send Direct Inquiry on WhatsApp (09023089987)</span>
                                                <ExternalLink className="h-3.5 w-3.5" />
                                              </a>
                                              <span className="text-[11px] text-stone-400 font-semibold italic">Broker-free pricing matched instantly</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-6 text-center text-sm text-stone-400">
                                No additional indexed pages matching query. Enter terms above to expand.
                              </div>
                            )}
                          </div>

                          {groundingSources.length > 0 && (
                            <div className="pt-4 border-t border-stone-100 space-y-2">
                              <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Indexed Google Reference Citations:</h4>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {groundingSources.map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-bold text-brand-primary bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100/30 flex items-center gap-1 transition-all"
                                  >
                                    <Globe className="h-3.5 w-3.5 shrink-0" />
                                    <span>{source.title.substring(0, 32)}...</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                  </div>

                  {/* RIGHT COLUMN: SIDEBAR METADATA & FORMS */}
                  <div className="space-y-6">
                    
                    {/* Live Pricing items lists */}
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-[0_1px_10px_rgba(0,0,0,0.012)] space-y-5 text-left">
                      <div className="border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-brand-primary" />
                          <h3 className="font-display font-extrabold text-slate-900 text-xs uppercase tracking-widest">Depot Price Index</h3>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 leading-snug">Reflected wholesale rates across active Nigerian merchant yards</p>
                      </div>

                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {localMaterials.length === 0 ? (
                          <div className="text-center py-10 text-stone-400 text-xs">
                            No materials matched this query in database registers. Please type alternative terms.
                          </div>
                        ) : (
                          localMaterials.map((mat, idx) => (
                            <div key={idx} className="p-3.5 bg-stone-50/50 rounded-2xl border border-stone-200/30 hover:bg-stone-50 hover:border-stone-200/80 transition-all space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-[8px] font-extrabold text-[#7f1616] bg-[#a71d1d]/8 border border-[#a71d1d]/15 px-1.5 py-0.5 rounded uppercase tracking-wider">{mat.category}</span>
                                  <h4 className="text-xs font-bold text-slate-900 leading-snug mt-1.5">{mat.name}</h4>
                                  <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1 font-medium">
                                    <MapPin className="h-3 w-3 text-stone-400" />
                                    {mat.supplierName} ({mat.supplierCity})
                                  </p>
                                </div>
                                
                                <div>
                                  {mat.priceTrend === "up" ? (
                                    <span className="text-[8px] font-mono font-bold text-red-750 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                                      ▲ Bullish
                                    </span>
                                  ) : mat.priceTrend === "down" ? (
                                    <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                                      ▼ Stable
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-mono font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                                      Stable
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-dashed border-stone-200/50">
                                <div>
                                  <span className="text-xs text-slate-800 font-mono font-bold leading-tight">
                                    {formatNaira(mat.price)} <span className="text-[9px] text-stone-455 font-normal">/{mat.unit}</span>
                                  </span>
                                </div>
                                
                                <span className="text-[10px] font-semibold text-stone-400 font-mono">Stock: {mat.stockLevel} units</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Integrated Lead RFQ Capture - DIRECT BINDING */}
                    <LeadCaptureForm 
                      initialMaterials={query ? `Materials search specifications for query: "${query}"` : ""}
                      initialCategory={selectedCategory || ""}
                      initialRegion={selectedRegion || ""}
                      sourceContext={`Result side widget context query="${query}" region="${selectedRegion}"`}
                    />

                    {/* Verifications terminal logs in sidebar */}
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-[0_1px_10px_rgba(0,0,0,0.012)] space-y-5 text-left">
                      
                      <div className="border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-brand-primary" />
                          <h3 className="font-display font-extrabold text-slate-900 text-xs uppercase tracking-widest">Active State Desks</h3>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1 leading-snug">Verified terminals synchronized with central authority in Nigeria</p>
                      </div>

                      <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                        {allSuppliers.slice(0, 4).map((supplier, idx) => (
                          <div key={idx} className="flex flex-col gap-2 pb-3.5 border-b border-stone-100 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <h4 className="text-xs font-bold text-slate-900 leading-none">{supplier.name}</h4>
                              
                              {supplier.isVerified && (
                                <span className="shrink-0 text-[8px] font-extrabold text-brand-primary bg-red-50 border border-red-100/50 px-1.5 py-0.5 rounded">
                                  ✓ VERIFIED
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[10px] text-stone-400 leading-none">Desk: {supplier.marketName}</p>
                            
                            <div className="flex items-center justify-between text-xs pt-0.5">
                              <span className="text-stone-500 font-bold font-sans text-[10px]">📍 {supplier.city}, {supplier.state}</span>
                              <a
                                href={`tel:${supplier.contactPhone}`}
                                className="text-brand-primary font-bold flex items-center gap-0.5 font-mono hover:underline"
                              >
                                <Phone className="h-3 w-3 text-stone-400" />
                                {supplier.contactPhone}
                              </a>
                            </div>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => handleTabChange("terminals")}
                          className="w-full py-2.5 bg-stone-50 hover:bg-stone-100/80 border border-stone-200/65 text-slate-900 text-center text-xs font-bold rounded-xl cursor-pointer transition-all"
                        >
                          View Merchant Registry ({allSuppliers.length})
                        </button>
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: ESTIMATES CALCULATOR MODULE */}
        {activeTab === "calculator" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            
            {/* Header section detailing calculation benefits */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#ae2424] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase tracking-widest">Shorefire Core Utilities</span>
                <h1 className="text-xl font-display font-extrabold text-slate-800 mt-2">Quantity Surveyor Sandbox</h1>
                <p className="text-xs text-stone-500">Compute precise concrete volume ratios, block amounts, rebar weights and estimated cost matrices.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl"
              >
                ← Back to Search Hub
              </button>
            </div>

            {/* Render calculator directly in view */}
            <QuantityCalculator />

          </div>
        )}

        {/* TAB 3: DIRECT QUOTE SUBMISSIONS MODULE */}
        {activeTab === "quote" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
            
            <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#ae2424] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase tracking-widest">Sovereign Wholesalers Link</span>
                <h1 className="text-xl font-display font-extrabold text-slate-800 mt-2">Factory Match RFQ Dispatch</h1>
                <p className="text-xs text-stone-500">Bypass the retail chain. Put your specifications directly into Shorefire cash terminals in Nigeria.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl"
              >
                ← Back to Search
              </button>
            </div>

            {/* Direct large-format Quote Submission widget */}
            <div className="bg-white p-2 rounded-3xl border border-stone-200/50 shadow-md">
              <LeadCaptureForm 
                initialMaterials=""
                initialCategory=""
                initialRegion=""
                sourceContext="Dedicated Quote Matching Page"
              />
            </div>

          </div>
        )}

        {/* TAB 4: SUPPLIERS VERIFICATIONS MODULE */}
        {activeTab === "terminals" && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
            
            <div className="bg-white p-6 rounded-3xl border border-stone-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#ae2424] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase tracking-widest">Terminal Verification Terminal</span>
                <h1 className="text-2xl font-display font-bold text-slate-800 mt-2">Certified Structural Merchants</h1>
                <p className="text-xs text-stone-500">Search block-making casting yards, cement warehouses, and steel timber desks registered in Nigeria.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-stone-500 hover:text-stone-800 px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-xl"
              >
                ← Back to Search
              </button>
            </div>

            {/* Suppliers Registry Filter Card */}
            <div className="bg-white rounded-3xl border border-stone-200/60 p-5 shadow-sm space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Search inside terminals</label>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. Coker Market, Dei-Dei yard..."
                      value={supplierSearchQuery}
                      onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ae2424]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Filter by State State</label>
                  <select
                    value={supplierRegionFilter}
                    onChange={(e) => setSupplierRegionFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 focus:outline-none focus:ring-2 focus:ring-[#ae2424]"
                  >
                    <option value="">🗺️ All Nigerian state centers</option>
                    <option value="Lagos">Lagos State Centers</option>
                    <option value="Abuja">Abuja Capital Authority</option>
                    <option value="Rivers">Rivers State (Port Harcourt)</option>
                    <option value="Kano">Kano Center</option>
                    <option value="Kaduna">Kaduna Desk</option>
                    <option value="Enugu">Enugu Desk</option>
                    <option value="Oyo">Oyo State (Ibadan)</option>
                  </select>
                </div>

              </div>

              {/* Grid of suppliers results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {filteredSuppliers.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-stone-400 text-xs">
                    No terminals matches your query. Try alternative state names.
                  </div>
                ) : (
                  filteredSuppliers.map((supplier, idx) => (
                    <div key={idx} className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/50 space-y-3 hover:border-[#ae2424]/40 hover:bg-white transition-all">
                      
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-bold text-slate-900">{supplier.name}</h3>
                          <p className="text-xs text-stone-400">📍 Hub Desk: {supplier.marketName}</p>
                        </div>
                        
                        {supplier.isVerified && (
                          <span className="text-[8px] font-extrabold text-[#ae2424] bg-red-50 border border-red-100 pr-2 pl-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#ae2424] shrink-0" /> Synchronized
                          </span>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-stone-200/50 flex flex-wrap items-center justify-between text-xs gap-2">
                        <span className="text-stone-500 font-bold uppercase tracking-wider">State Center: {supplier.city}, {supplier.state}</span>
                        
                        <a
                          href={`tel:${supplier.contactPhone}`}
                          className="px-3.5 py-1.5 bg-white border border-stone-200 hover:border-[#ae2424]/40 hover:text-[#ae2424] font-mono text-xs font-extrabold text-stone-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <Phone className="h-3 w-3 text-stone-400" />
                          <span>{supplier.contactPhone}</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>API Status: Connected ({supplier.apiLatencyMs}ms lag interval)</span>
                      </div>

                    </div>
                  ))
                )}

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-white border-t border-stone-200/60 py-10" id="platform_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-400 font-medium">
          
          <div className="flex items-center gap-2 select-none" onClick={handleResetSearch}>
            <svg className="w-4 h-4 text-brand-primary shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 15 H85 V46 C85 70 50 90 50 90 C50 90 15 70 15 46 V15Z" fill="#ae2424" />
              <path d="M30 48 L46 64 L70 32" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display font-extrabold text-slate-800 tracking-tight">Shorefire Intellectual Terminal</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center text-center">
            <span className="hover:text-stone-600 cursor-pointer">Sovereign Registry Charter</span>
            <span>•</span>
            <span className="hover:text-stone-600 cursor-pointer">Security Auditing Rules</span>
            <span>•</span>
            <span className="hover:text-stone-600 cursor-pointer">Administrative Desk</span>
          </div>

          <div className="text-center sm:text-right text-stone-400 leading-normal">
            <span>© 2026 Shorefire. Built for certified builders, engineers and importers in Nigeria.</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
