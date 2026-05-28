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

// Custom SVG Shorefire Logo mirroring the attached graphic
function ShorefireLogo({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const isLg = size === "lg";
  const isMd = size === "md";

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2 select-none">
        {/* Shield Icon */}
        <svg className="w-6.5 h-6.5 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 15 H85 V46 C85 70 50 90 50 90 C50 90 15 70 15 46 V15Z" fill="#ae2424" />
          <path d="M30 48 L46 64 L70 32" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xl font-display font-extrabold text-[#ae2424] tracking-tight flex items-center">
          Sh
          <span className="relative inline-flex items-center justify-center mx-px">
            <svg className="w-4 h-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 15 H85 V46 C85 70 50 90 50 90 C50 90 15 70 15 46 V15Z" fill="#ae2424" />
              <path d="M30 48 L46 64 L70 32" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          refire
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none text-center">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Core Shield-Tick Icon */}
        <svg 
          className={`${isLg ? "w-16 h-16 md:w-20 md:h-20" : "w-12 h-12"} shrink-0 drop-shadow-sm`} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M15 15 H85 V46 C85 70 50 90 50 90 C50 90 15 70 15 46 V15Z" fill="#ae2424" />
          <path d="M30 48 L46 64 L70 32" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        
        {/* Sleek, Wordmark matching screenshot */}
        <span className={`${isLg ? "text-5xl md:text-6xl" : "text-4xl"} font-display font-black text-[#ae2424] tracking-tight flex items-center`}>
          Sh
          {/* Nested mini-shield inside the 'o' */}
          <span className="relative inline-flex items-center justify-center mx-0.5">
            <svg 
              className={`${isLg ? "w-10 h-10 mt-1 md:w-12 md:h-12" : "w-8 h-8 mt-0.5"} shrink-0`} 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M15 15 H85 V46 C85 70 50 90 50 90 C50 90 15 70 15 46 V15Z" fill="#ae2424" />
              <path d="M30 48 L46 64 L70 32" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          refire
        </span>
      </div>
      
      {/* Target subtext aligned directly beneath wordmark */}
      <div className="w-full flex justify-center md:justify-end pl-0 md:pl-28 mt-2">
        <p className={`${isLg ? "text-sm tracking-[0.25em]" : "text-[11px] tracking-widest"} text-[#ae2424]/80 font-medium font-sans`}>
          ....Built for you
        </p>
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
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans flex flex-col justify-between">
      
      {/* High-Accuracy Centralized Sync Status Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-[#ae2424] to-zinc-900 py-2 px-4 text-center text-[11px] text-stone-100 flex items-center justify-center gap-2 border-b border-rose-900 font-medium font-sans">
        <Database className="h-3.5 w-3.5 text-rose-400 animate-pulse shrink-0" />
        <span>Sovereign Price-Sync Hub Active: Synced with 9 Nigerian Trading Ports and Structural Depots</span>
      </div>

      {/* Modern SaaS Transparent Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/60 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Subtle Logo Left */}
          <div className="cursor-pointer" onClick={handleResetSearch}>
            <ShorefireLogo size="sm" />
          </div>

          {/* Clean Segmented Tab Navigation Switcher - Chances to do other things instantly */}
          <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60 shadow-inner">
            <button 
              onClick={() => handleTabChange("search")}
              className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "search" ? "bg-white text-[#ae2424] shadow" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>AI Search</span>
            </button>
            <button 
              onClick={() => handleTabChange("calculator")}
              className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "calculator" ? "bg-white text-[#ae2424] shadow" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Cost Estimator</span>
            </button>
            <button 
              onClick={() => handleTabChange("quote")}
              className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "quote" ? "bg-white text-[#ae2424] shadow" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Request Quote</span>
            </button>
            <button 
              onClick={() => handleTabChange("terminals")}
              className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === "terminals" ? "bg-white text-[#ae2424] shadow" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Verifications</span>
            </button>
          </nav>

          {/* Quick Active Badge Right */}
          <div className="hidden md:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-1 rounded border border-stone-200">Terminal Live</span>
          </div>

        </div>
      </header>

      {/* Core Dynamic Screen Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* TAB 1: SEARCH INTERACTION ENGINE */}
        {activeTab === "search" && (
          <div className="space-y-10">
            
            {/* GOOGLE INTERFACE LIKE HOME VIEW */}
            {!hasSearched ? (
              <div className="flex flex-col items-center justify-center pt-16 pb-12 max-w-4xl mx-auto space-y-8 animate-fade-in">
                
                {/* Clean, Centered Logo Assembly */}
                <ShorefireLogo size="lg" />

                <div className="text-center space-y-2 max-w-xl">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800 tracking-tight leading-none">
                    Instant Building Intelligence Network
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto font-normal leading-relaxed">
                    Query cement standards, rebar sizes, current timber indexes, or sandbox estimates instantly with Nigeria's sovereign merchant terminals.
                  </p>
                </div>

                {/* Highly-designed crisp Google-like Search Bar container */}
                <div className="w-full max-w-2xl bg-white p-2.5 rounded-3xl border border-stone-200/80 shadow-lg shadow-stone-100 focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                  <form onSubmit={handleSearchSubmit} className="space-y-3">
                    
                    {/* Primary TextInput Segment */}
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 h-5 w-5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Material selection guide, current steel rates, timber weight parameters..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 bg-transparent rounded-full focus:outline-none text-sm font-medium text-slate-800"
                      />
                      <div className="absolute right-4 p-1 rounded-lg bg-red-50">
                        <Sparkle className="h-4 w-4 text-[#ae2424] animate-pulse" />
                      </div>
                    </div>

                    {/* Integrated SaaS Pills select for fast filtering right inside/under input */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-stone-100">
                      
                      <div className="relative">
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value as SupplyRegion)}
                          className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-100 text-[11px] font-bold text-stone-600 cursor-pointer focus:outline-none hover:bg-stone-100"
                        >
                          <option value="">🇳🇬 Map Hub: All states</option>
                          {REGIONS.map(reg => (
                            <option key={reg} value={reg}>{reg} Region</option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory)}
                          className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-100 text-[11px] font-bold text-stone-600 cursor-pointer focus:outline-none hover:bg-stone-100"
                        >
                          <option value="">🧱 Code: All Materials</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Google Action Buttons Style */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-2.5 bg-brand-primary hover:bg-[#831818] text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/10 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        {isLoading ? "Consulting Shorefire AI..." : "Search with Shorefire AI"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange("calculator")}
                        className="w-full sm:w-auto px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Calculator className="h-3.5 w-3.5 text-stone-500" />
                        <span>Check Estimates</span>
                      </button>
                    </div>

                  </form>
                </div>

                {/* Classic Google-inspired suggestion pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl text-center">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mr-1">Suggestions:</span>
                  <button 
                    onClick={() => handlePillClick("Standard Portland Cement", MaterialCategory.CEMENT_BINDERS)}
                    className="text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200 transition-all cursor-pointer"
                  >
                    🧱 Cement Brand Prices
                  </button>
                  <button 
                    onClick={() => handlePillClick("16mm iron rods", MaterialCategory.STEEL_REBARS)}
                    className="text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200 transition-all cursor-pointer"
                  >
                    🏗️ Steel Rebar Grade Rates
                  </button>
                  <button 
                    onClick={() => handlePillClick("9-inch hollow concrete block", MaterialCategory.BLOCKS_AGGREGATES)}
                    className="text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200 transition-all cursor-pointer"
                  >
                    🏢 Hollow Blocks Cost
                  </button>
                </div>

                {/* "Chances to do any other thing from Homepage" Integrated Options */}
                <div className="w-full pt-12">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-bold text-[#ae2424] bg-red-50 border border-red-100 px-3 py-1 rounded-full uppercase tracking-widest">Sovereign Direct Execution Links</span>
                    <h2 className="text-sm font-semibold text-slate-400 mt-2">What would you like to build today?</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* Option 1 */}
                    <div 
                      onClick={() => handleTabChange("calculator")}
                      className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm hover:border-[#ae2424]/40 hover:shadow-md transition-all cursor-pointer group space-y-3"
                    >
                      <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Calculator className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#ae2424] transition-colors">Quantity Calculator</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Compute custom estimations for concrete, sandcrete block walls, and general structural building budgets.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#ae2424] pt-2">
                        <span>Launch Estimator</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Option 2 */}
                    <div 
                      onClick={() => handleTabChange("quote")}
                      className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm hover:border-[#ae2424]/40 hover:shadow-md transition-all cursor-pointer group space-y-3"
                    >
                      <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-[#ae2424]">
                        <Send className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#ae2424] transition-colors">Factory-Direct Quote Matching</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Submit a detailed request directly into our registered wholesalers network to bypass market broker markups.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#ae2424] pt-2">
                        <span>Initiate RFP Process</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Option 3 */}
                    <div 
                      onClick={() => handleTabChange("terminals")}
                      className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm hover:border-[#ae2424]/40 hover:shadow-md transition-all cursor-pointer group space-y-3"
                    >
                      <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                        <ShieldCheck className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#ae2424] transition-colors">Registered Depots & Terminals</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Dial authenticated block casting yards, reinforced steel depots, and importers near you safely of-record.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#ae2424] pt-2">
                        <span>Browse Verified Direct</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
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
                <div className="bg-stone-50 rounded-2xl border border-stone-200/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white border border-stone-100 rounded-xl shadow-sm text-[#ae2424]">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-stone-800">Decentralized Inventory Ledger</h3>
                        {isCached ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            ✓ Firestore Cache Match
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full animate-pulse">
                            ● Broad Live API Index
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[11px] text-stone-500 mt-1 max-w-xl">
                        {isCached 
                          ? `This result set was served from instant Firestore query caches. Real-time updates push automatically to this cache upon structural price shifts.`
                          : `Live structural ledger compiled successfully. Decoupled terminals returned instant stock counters and checked merchant queues.`
                        }
                      </p>
                      
                      {cachedAt && (
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono mt-0.5">
                          <Calendar className="h-3 w-3" /> Validated on: {new Date(cachedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => triggerSearch(true)}
                      disabled={isRefreshing || isLoading}
                      className="w-full sm:w-auto px-3.5 py-2 bg-white border border-stone-200 hover:border-stone-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm text-stone-700"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-[#ae2424]" : ""}`} />
                      <span>{isRefreshing ? "Repolling Wholesalers..." : "Force Realtime Stock Query"}</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC TWO-COLUMN SAAS RESULTS LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* LEFT COLUMN: SOURCE OF WISDOM AND CHIPS */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Primary expert AI Response */}
                    <div className="bg-white rounded-3xl border border-stone-200/60 shadow-md p-6 sm:p-8 space-y-5">
                      
                      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-brand-primary">
                            <Cpu className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">Shurefire Structural Live Summary</h2>
                            <p className="text-[10px] text-stone-400 tracking-wider uppercase font-semibold mt-0.5">Sovereign Direct Wholesalers Intelligence</p>
                          </div>
                        </div>
                        
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
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
                          <div className="bg-white border-2 border-slate-100 shadow-sm p-5 sm:p-6 rounded-2xl space-y-4 font-sans relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-stone-200 to-emerald-500" />
                            <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold tracking-wider uppercase mb-1">
                              <span>Google Featured Snippet Reference</span>
                              <span className="text-red-600 bg-red-50 border border-red-100/50 px-2 py-0.5 rounded">High Authority Answer</span>
                            </div>

                            {/* Un-hyperlinked Result Title matching prompt */}
                            <h3 className="text-lg sm:text-xl font-bold text-slate-800 leading-snug font-sans pb-2 border-b border-stone-100">
                              {query ? `Optimized structural advice & guidelines on: "${query}"` : "Shorefire Sourcing Hub Knowledge Panel"}
                            </h3>

                            {/* Featured snippet summary prose */}
                            <div className="text-stone-800 text-sm leading-relaxed prose prose-stone max-w-none pt-1">
                              <Markdown>{featuredAnswer || aiAnswer}</Markdown>
                            </div>

                            <div className="text-[10px] text-stone-400 italic pt-2 border-t border-stone-50/60 flex items-center justify-between">
                              <span>Source: Shorefire Real-World Sourcing Index & Technical Advisory Panel</span>
                              <span className="font-semibold text-emerald-600">✓ Grounded with Google Search</span>
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
                    <div className="bg-white rounded-3xl border border-stone-200/60 p-5 shadow-sm space-y-4">
                      <div className="border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-brand-primary" />
                          <h3 className="font-display font-extrabold text-slate-800 text-xs uppercase tracking-wide">Live Material Rates</h3>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">Reflected current depot estimates across active Nigerian market boards</p>
                      </div>

                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {localMaterials.length === 0 ? (
                          <div className="text-center py-8 text-stone-400 text-xs">
                            No materials matched this query in database registers. Please type alternative terms.
                          </div>
                        ) : (
                          localMaterials.map((mat, idx) => (
                            <div key={idx} className="p-3 bg-stone-50/50 rounded-2xl border border-stone-200/50 hover:bg-stone-50 transition-all space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[8px] font-extrabold text-stone-400 uppercase tracking-widest">{mat.category}</span>
                                  <h4 className="text-xs font-bold text-slate-900 leading-tight mt-0.5">{mat.name}</h4>
                                  <p className="text-[9px] text-stone-500 mt-0.5 flex items-center gap-0.5 font-medium">
                                    <MapPin className="h-2.5 w-2.5 text-stone-400" />
                                    {mat.supplierName} ({mat.supplierCity})
                                  </p>
                                </div>
                                
                                <div>
                                  {mat.priceTrend === "up" ? (
                                    <span className="text-[8px] font-bold text-red-700 bg-red-50 border border-red-100/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                                      <TrendingUp className="h-2 w-2" /> Bullish
                                    </span>
                                  ) : mat.priceTrend === "down" ? (
                                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/40 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wide">
                                      <TrendingDown className="h-2 w-2" /> Bearish
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-bold text-stone-600 bg-stone-100/80 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Minus className="h-2.5 w-2.5" /> Stable
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-dashed border-stone-200/70">
                                <div>
                                  <span className="text-[10px] text-stone-500 font-mono font-bold leading-tight">
                                    {formatNaira(mat.price)} <span className="text-[9px] text-stone-400 font-normal">/{mat.unit}</span>
                                  </span>
                                </div>
                                
                                <span className="text-[9px] font-semibold text-stone-500 font-mono">Stock: {mat.stockLevel}</span>
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
                    <div className="bg-white rounded-3xl border border-stone-200/60 p-5 shadow-sm space-y-4">
                      
                      <div className="border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-brand-primary" />
                          <h3 className="font-display font-extrabold text-slate-800 text-xs uppercase tracking-wide">Registered Hubs nearby</h3>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">Verified terminals synchronized with Shorefire central authority</p>
                      </div>

                      <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                        {allSuppliers.slice(0, 4).map((supplier, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-stone-800 leading-none">{supplier.name}</h4>
                              
                              {supplier.isVerified && (
                                <span className="shrink-0 text-[8px] font-extrabold text-brand-primary bg-ref-50 border border-red-100/50 px-1.5 py-0.5 rounded-full">
                                  ✓ CERTIFIED
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[9px] text-stone-400 leading-none">📍 Region Desk: {supplier.marketName}</p>
                            
                            <div className="flex items-center justify-between text-[10px] pt-1">
                              <span className="text-stone-500 font-bold">📍 {supplier.city}, {supplier.state}</span>
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
                          className="w-full py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-center text-xs font-bold rounded-xl cursor-pointer"
                        >
                          View Full Merchant Registry ({allSuppliers.length})
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
