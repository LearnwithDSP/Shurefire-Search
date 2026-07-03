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
  ExternalLink,
  Bell,
  User,
  Layers3,
  Clock,
  TrendingUp as TrendUpIcon,
  HelpCircle,
  FileText,
  Workflow
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

// Custom Shorefire Logo loaded from logo.png
function ShurefireLogo({ size = "lg", lightBg = true }: { size?: "sm" | "md" | "lg"; lightBg?: boolean }) {
  const isLg = size === "lg";
  const isSm = size === "sm";

  // Height based on size
  const heightClass = isSm ? "h-6 sm:h-7" : isLg ? "h-11 sm:h-12" : "h-8 sm:h-9";

  return (
    <div className="flex items-center select-none">
      <img 
        src="/logo.png" 
        alt="Shorefire Logo" 
        referrerPolicy="no-referrer"
        className={`${heightClass} w-auto object-contain`}
      />
    </div>
  );
}

// 3D-styled metallic reinforcement construction rebar (iron bars)
function Rebar({ orientation, className = "" }: { orientation: "horizontal" | "vertical"; className?: string }) {
  return (
    <div 
      className={`relative shadow-[0_10px_20px_rgba(0,0,0,0.3)] ${
        orientation === "vertical" 
          ? "w-3 h-full" 
          : "h-3 w-full"
      } ${className}`}
      style={{
        backgroundImage: orientation === "vertical"
          ? "linear-gradient(90deg, #111827 0%, #374151 25%, #4b5563 50%, #1f2937 75%, #030712 100%)"
          : "linear-gradient(180deg, #111827 0%, #374151 25%, #4b5563 50%, #1f2937 75%, #030712 100%)",
      }}
    >
      {/* Oblique metallic rib patterns */}
      <div 
        className="absolute inset-0 opacity-45 mix-blend-overlay"
        style={{
          backgroundImage: orientation === "vertical"
            ? "repeating-linear-gradient(45deg, transparent, transparent 6px, #000 6px, #000 9px, transparent 9px)"
            : "repeating-linear-gradient(45deg, transparent, transparent 6px, #000 6px, #000 9px, transparent 9px)",
          backgroundSize: "100% 100%"
        }}
      />
      {/* High-shine metallic highlight */}
      <div 
        className={`absolute opacity-40 bg-white ${
          orientation === "vertical" 
            ? "left-1 top-0 bottom-0 w-[1.5px]" 
            : "top-1 left-0 right-0 h-[1.5px]"
        }`}
      />
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"search" | "calculator" | "quote" | "terminals" | "analytics">("search");
  
  const [query, setQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<SupplyRegion | "">("");
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | "">("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const isHomepageSearch = activeTab === "search" && !hasSearched;
  
  // Real-time dynamic clock
  const [currentTime, setCurrentTime] = useState<string>("");
  
  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteSearch, setCommandPaletteSearch] = useState("");
  
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

  // Live commodity prices mock database with vector sparklines for UI
  const [tickerPrices, setTickerPrices] = useState([
    { name: "Dangote Cement", code: "CEM-DAN", price: 7950, unit: "bag", change: 2.15, trend: "up", spark: [7500, 7650, 7700, 7600, 7850, 7950] },
    { name: "BUA Cement 42.5", code: "CEM-BUA", price: 7800, unit: "bag", change: -1.05, trend: "down", spark: [8000, 7950, 7900, 7850, 7800, 7800] },
    { name: "Steel Rebars 16mm", code: "STL-16M", price: 13800, unit: "length", change: 4.80, trend: "up", spark: [12800, 13000, 13100, 13400, 13600, 13800] },
    { name: "Sharp Sand tipper", code: "SND-20T", price: 135000, unit: "20t load", change: 0.00, trend: "stable", spark: [135000, 135000, 135000, 135000, 135000, 135000] },
    { name: "Granite (3/4 inch)", code: "GRN-20T", price: 275000, unit: "20t load", change: 1.25, trend: "up", spark: [268000, 270000, 272000, 271000, 273000, 275000] },
    { name: "Parallel USD Rate", code: "FX-USD", price: 1510, unit: "Naira", change: 0.85, trend: "up", spark: [1485, 1490, 1500, 1495, 1505, 1510] }
  ]);

  // Sourcing session statistics counter
  const [sourcingQuoteLogs, setSourcingQuoteLogs] = useState(2);

  // Keyboard shortcut listener for Command Palette (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === "Escape") {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update real-time clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Initial load
  useEffect(() => {
    // Load suppliers list
    fetch("/api/suppliers")
      .then(res => res.json())
      .then(data => setAllSuppliers(data))
      .catch(err => console.error("Error loading suppliers list", err));

    // Warm up search cache
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
      setActiveTab("search");
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
    triggerSearch(false, term, selectedRegion, preCategory || selectedCategory);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === "search") {
      setHasSearched(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Predefined searches inside command palette
  const COMMAND_SHORTCUTS = [
    { title: "Dangote cement 50kg bag wholesale price", query: "Dangote cement 50kg bag price", category: MaterialCategory.CEMENT_BINDERS },
    { title: "BUA Cement 3X bag rates Lagos Mainland", query: "BUA Cement price", category: MaterialCategory.CEMENT_BINDERS },
    { title: "12mm High-Yield Iron Rods per ton Abuja", query: "12mm Rebar rods price", category: MaterialCategory.STEEL_REBARS },
    { title: "Sharp sand 20-ton tipper delivery costs", query: "20 tons sharp sand cost", category: MaterialCategory.BLOCKS_AGGREGATES },
    { title: "3/4 inch Granite tipper wholesale rate", query: "granite 20 tons delivery cost", category: MaterialCategory.BLOCKS_AGGREGATES }
  ];

  // Filtering suppliers directory
  const filteredSuppliers = allSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                          supplier.marketName.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                          supplier.city.toLowerCase().includes(supplierSearchQuery.toLowerCase());
    const matchesRegion = supplierRegionFilter ? supplier.state.toLowerCase() === supplierRegionFilter.toLowerCase() : true;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="min-h-screen text-slate-900 selection:bg-[#B91C1C]/10 selection:text-[#B91C1C]">
      
      {/* 1. TOP STATUS BAR (Exactly matching the image style and text) */}
      <div className="bg-[#050505] text-[#A3A3A3] text-[11px] font-mono select-none border-b border-white/5 py-2.5 px-4 flex items-center justify-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wide text-[#E5E5E5] text-center">
            Sovereign Price Database Active • Synced across 9 Structural Depots & Importers • Live Nigeria Index
          </span>
        </div>
      </div>

      {/* 2. FLOATING GLASS NAVIGATION BAR (Height: 72px) */}
      <header className="sticky top-0 z-40 max-w-7xl mx-auto px-4 sm:px-6 pt-4 select-none">
        <div className="glass-panel-heavy h-[72px] rounded-2xl px-6 flex items-center justify-between shadow-md shadow-slate-100 border-slate-200/80">
          
          {/* Left: Brand logo */}
          <div className="cursor-pointer" onClick={() => handleTabChange("search")}>
            <ShurefireLogo size="md" lightBg={true} />
          </div>

          {/* Center: Main Navigation Tabs (Pill style matching the image) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => handleTabChange("search")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "search" 
                  ? "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30 shadow-xs" 
                  : "bg-transparent text-slate-500 border-transparent hover:text-slate-900"
              }`}
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span>AI Search Engine</span>
            </button>
            <button
              onClick={() => handleTabChange("calculator")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "calculator" 
                  ? "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30 shadow-xs" 
                  : "bg-transparent text-slate-500 border-transparent hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Seyi Alao Estimator</span>
            </button>
            <button
              onClick={() => handleTabChange("quote")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "quote" 
                  ? "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30 shadow-xs" 
                  : "bg-transparent text-slate-500 border-transparent hover:text-slate-900"
              }`}
            >
              <Send className="h-3.5 w-3.5 shrink-0" />
              <span>Match Wholesale Quotes</span>
            </button>
            <button
              onClick={() => handleTabChange("terminals")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeTab === "terminals" 
                  ? "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/30 shadow-xs" 
                  : "bg-transparent text-slate-500 border-transparent hover:text-slate-900"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Merchant Directory</span>
            </button>
          </nav>

          {/* Right: Terminal Synchronized badge with red glowing dot */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#B91C1C]/5 border border-[#B91C1C]/20 text-[#B91C1C] text-[10px] font-mono font-bold tracking-wider rounded-full shadow-[0_0_15px_rgba(185,28,28,0.06)] relative overflow-hidden">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="relative z-10">TERMINAL SYNCHRONIZED</span>
              {/* Blur backdrop glow effect */}
              <div className="absolute left-1 top-1.5 w-4 h-4 bg-red-500/35 rounded-full blur-xs pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Small screen mobile navigation selector */}
        <div className="lg:hidden flex justify-between gap-1.5 mt-2 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto select-none">
          {[
            { id: "search", label: "AI Search", icon: Cpu },
            { id: "calculator", label: "Surveyor", icon: Calculator },
            { id: "quote", label: "RFQ", icon: Workflow },
            { id: "terminals", label: "Merchants", icon: Building2 },
            { id: "analytics", label: "Analytics", icon: Activity }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id as any)}
                className={`flex-1 py-2 px-3 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeTab === item.id 
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <main className={isHomepageSearch ? "w-full space-y-0" : "max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6"}>
        
        {/* PERSONALIZED GREETINGS WITH TICKING CLOCK */}
        {!isHomepageSearch && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 text-lg">
                👋
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Good Morning</span>
                <h2 className="text-[15px] sm:text-[17px] font-extrabold text-slate-900 leading-none mt-1">
                  Welcome back, Ramon Bisola <span className="text-slate-400 font-normal text-xs sm:text-sm italic">| Senior Project Manager</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Active Site Ledger</span>
                <span className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5 mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {sourcingQuoteLogs} Wholesale Dispatches Dispatched
                </span>
              </div>
              
              <div className="text-left border-l border-slate-200 pl-6 hidden sm:block">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Live Clock</span>
                <span className="text-sm font-mono font-bold text-slate-800 mt-1 block flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#B91C1C]" />
                  {currentTime || "00:00:00"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: CORE SEARCH SYSTEM TAB */}
        {activeTab === "search" && (
          isHomepageSearch ? (
            /* MINIMALISTIC & CENTRALIZED INDUSTRIAL HOMEPAGE */
            <div className="w-full relative bg-slate-50 min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-16 px-4 overflow-hidden select-none animate-fade-in">
              
              {/* 1. STEEL REBARS WIREFRAME BACKING (Extremely clean, modern & subtle) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07] hidden md:block">
                {/* Vertical Rebars spanning across the width */}
                <Rebar orientation="vertical" className="absolute left-[8%] top-0 bottom-0" />
                <Rebar orientation="vertical" className="absolute left-[22%] top-0 bottom-0" />
                <Rebar orientation="vertical" className="absolute left-[36%] top-0 bottom-0" />
                <Rebar orientation="vertical" className="absolute left-[50%] top-0 bottom-0" />
                <Rebar orientation="vertical" className="absolute left-[64%] top-0 bottom-0" />
                <Rebar orientation="vertical" className="absolute left-[78%] top-0 bottom-0" />
                <Rebar orientation="vertical" className="absolute left-[92%] top-0 bottom-0" />
                
                {/* Horizontal Rebars spanning down the height */}
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[12%]" />
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[26%]" />
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[40%]" />
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[54%]" />
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[68%]" />
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[82%]" />
                <Rebar orientation="horizontal" className="absolute left-0 right-0 top-[96%]" />
              </div>

              {/* 2. CENTRAL PANEL ASSEMBLY */}
              <div className="relative z-10 max-w-xl w-full mx-auto text-center space-y-8 flex flex-col justify-center items-center py-4">
                
                {/* Center logo brand assembly */}
                <div className="flex flex-col items-center select-none">
                  <img 
                    src="/logo.png" 
                    alt="Shorefire Logo" 
                    referrerPolicy="no-referrer"
                    className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm"
                  />
                </div>

                {/* Headings */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200/60 rounded-full w-fit mx-auto">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">BETA TERMINAL v2.5</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase font-sans">
                    INSTANT MATERIAL INTELLIGENCE
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Direct access to cement spot prices, steel rebar specs, framing indexes, and sandbox estimators across West Africa.
                  </p>
                </div>

                {/* Minimalist Search Console */}
                <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-100/50 space-y-4">
                  <form onSubmit={handleSearchSubmit} className="space-y-4 text-left">
                    
                    {/* Search input field */}
                    <div className="relative flex items-center">
                      <Search className="absolute left-4.5 text-slate-400 h-5 w-5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Search structural materials (e.g. Dangote cement in Lagos)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-1 focus:ring-[#B91C1C] focus:border-[#B91C1C] transition-all placeholder:text-slate-400"
                      />
                      <div className="absolute right-4 flex items-center">
                        <Sparkles className="h-4 w-4 text-[#B91C1C]/40" />
                      </div>
                    </div>

                    {/* Dropdowns filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl">
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value as SupplyRegion)}
                          className="w-full pl-4 pr-10 py-3 bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none"
                        >
                          <option value="">Select Region (State)</option>
                          {REGIONS.map(reg => (
                            <option key={reg} value={reg}>{reg} State</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>

                      <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory)}
                          className="w-full pl-4 pr-10 py-3 bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none"
                        >
                          <option value="">All Material Categories</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Search Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
                    >
                      <span>Search Database</span>
                    </button>
                  </form>
                </div>

                {/* Launch Cost Estimator button */}
                <button
                  onClick={() => handleTabChange("calculator")}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full flex items-center gap-2 shadow-xs transition-all cursor-pointer select-none"
                >
                  <FileText className="h-4 w-4 text-[#B91C1C]" />
                  <span>Launch Cost Estimator</span>
                </button>

              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
            
            {/* HERO HEADING - MINIMALIST PREMIUM DESIGN */}
            <div className="text-center py-6 max-w-2xl mx-auto space-y-3 select-none">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-none text-slate-900">
                Bloomberg Terminal for <span className="text-[#B91C1C]">Construction Materials</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans font-medium">
                Verify real-time structural commodity prices, compute cement/rebar sand quantities, and dispatch bids to certified Nigerian wholesalers instantly.
              </p>
            </div>

            {/* LIVE MARKET COMMODITY TICKERS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 select-none" id="commodity-tickers-grid">
              {tickerPrices.map((ticker, idx) => {
                const isUp = ticker.trend === "up";
                const isDown = ticker.trend === "down";
                
                // SVG Sparkline drawing helper
                const minVal = Math.min(...ticker.spark);
                const maxVal = Math.max(...ticker.spark);
                const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;
                const points = ticker.spark.map((v, i) => {
                  const x = (i / (ticker.spark.length - 1)) * 50;
                  const y = 20 - ((v - minVal) / valRange) * 16;
                  return `${x},${y}`;
                }).join(" ");

                return (
                  <div 
                    key={idx} 
                    onClick={() => handlePillClick(ticker.name + " price")}
                    className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-left cursor-pointer transition-all hover:border-[#B91C1C]/40 hover:shadow-md hover:shadow-slate-100 group select-none"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider leading-none">{ticker.code}</span>
                      <div className="flex items-center gap-1 font-mono text-[9px] font-bold shrink-0">
                        {isUp ? (
                          <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none">▲ +{ticker.change}%</span>
                        ) : isDown ? (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded leading-none">▼ {ticker.change}%</span>
                        ) : (
                          <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded leading-none">Stable</span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-none mt-2 group-hover:text-[#B91C1C] transition-colors">{ticker.name}</h4>
                    
                    <div className="flex items-end justify-between mt-3.5 pt-2 border-t border-slate-100 border-dashed">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-slate-900 leading-tight">{formatNaira(ticker.price)}</span>
                        <span className="text-[9px] text-slate-400 font-normal mt-0.5 leading-none">per {ticker.unit}</span>
                      </div>

                      {/* Sparkline Visual */}
                      <div className="w-12 h-6 overflow-hidden">
                        <svg viewBox="0 0 50 20" className="w-full h-full">
                          <polyline
                            fill="none"
                            stroke={isUp ? "#16A34A" : isDown ? "#DC2626" : "#94A3B8"}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* THE CENTRAL AI SEARCH CONTROL STATION CARD */}
            <div className="relative" id="central_search_console">
              {/* Subtle animated gradient glow behind the AI search card */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#B91C1C]/10 via-red-950/5 to-[#B91C1C]/10 rounded-[28px] blur-xl opacity-80 group-hover:opacity-100 transition-opacity animate-pulse-subtle"></div>
              
              <div className="relative bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-lg text-left">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  
                  <div className="flex flex-col md:flex-row items-stretch gap-3">
                    
                    {/* Main input wrapper with icon */}
                    <div className="flex-1 relative flex items-center">
                      <Search className="absolute left-4.5 text-slate-400 h-5 w-5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Type structural inquiry (e.g. Dangote cement price index in Lekki or aggregates tipper Abuja)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-900 font-medium text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/25 focus:border-[#B91C1C] transition-all placeholder:text-slate-400 shadow-inner"
                      />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-stretch gap-2">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value as SupplyRegion)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C] transition-all cursor-pointer"
                      >
                        <option value="">🗺️ Sourcing State</option>
                        {REGIONS.map(reg => (
                          <option key={reg} value={reg}>{reg} State Hub</option>
                        ))}
                      </select>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/20 focus:border-[#B91C1C] transition-all cursor-pointer"
                      >
                        <option value="">⚙️ Category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      {/* Trigger query button */}
                      <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold px-6 py-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md shadow-red-900/10 cursor-pointer disabled:opacity-50 select-none shrink-0"
                      >
                        <span>Query</span>
                        <ArrowRight className="h-4 w-4 text-white" />
                      </button>
                    </div>

                  </div>

                  {/* PROMPT SUGGESTION PILLS Under search bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 select-none">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 font-mono mr-1.5 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-[#B91C1C]" /> Recommended Queries:
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePillClick("Dangote Cement 50kg bag price", MaterialCategory.CEMENT_BINDERS)}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      "Dangote Cement Bag Price"
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePillClick("16mm high yield Steel rods rate per ton", MaterialCategory.STEEL_REBARS)}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      "16mm Steel Rod Price"
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePillClick("20 tons tipper of crushed Granite gravel", MaterialCategory.BLOCKS_AGGREGATES)}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      "Granite gravel load delivery"
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePillClick("9-inch hollow vibrated sandcrete blocks", MaterialCategory.BLOCKS_AGGREGATES)}
                      className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      "9-inch hollow block rates"
                    </button>
                  </div>

                </form>
              </div>
            </div>

            {/* SKELETON LOADING STATE (Rendered when searching) */}
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 select-none">
                {/* Simulated AI Answer column skeleton */}
                <div className="col-span-1 lg:col-span-8 space-y-4 animate-pulse">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-36 bg-slate-200 rounded"></div>
                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 pt-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-11/12"></div>
                    <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                    <div className="h-40 bg-slate-50 rounded-2xl w-full mt-4"></div>
                  </div>
                </div>

                {/* Sidebar catalog lists skeleton */}
                <div className="col-span-1 lg:col-span-4 space-y-4 animate-pulse">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="space-y-3">
                      <div className="h-20 bg-slate-50 rounded-xl"></div>
                      <div className="h-20 bg-slate-50 rounded-xl"></div>
                      <div className="h-20 bg-slate-50 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RENDER DYNAMIC SEARCH RESULTS OR EMPTY DASHBOARD OVERVIEW */}
            {!isLoading && (
              <div className="transition-all duration-300">
                {!hasSearched ? (
                  /* ZERO STATE - RENDER SMART EMPTY STATE BOARD WITH ACTIONS */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none" id="zero_state_dashboard">
                    
                    {/* LEFT PANEL: Platform value card */}
                    <div className="col-span-1 lg:col-span-7 bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 text-left space-y-6 flex flex-col justify-between shadow-xs">
                      <div className="space-y-4">
                        <div className="p-3 bg-[#B91C1C]/10 rounded-2xl text-[#B91C1C] border border-[#B91C1C]/15 w-fit">
                          <Cpu className="h-6 w-6 text-[#B91C1C]" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Platform Sourcing Engine</h3>
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
                            Enter construction materials in our AI query search to pull live, audited cash rates directly from physical dealers in Lagos, Abuja, Port Harcourt, and Ibadan yards.
                          </p>
                        </div>

                        {/* Visual checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                          {[
                            "Audited live Dangote & BUA prices",
                            "Iron steel rods rebar grade check",
                            "Seyi Alao, COREN quantity auditor",
                            "WhatsApp matched RFQ delivery"
                          ].map((check, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 font-sans">
                              <CheckCircle2 className="h-4.5 w-4.5 text-[#B91C1C] shrink-0" />
                              <span>{check}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Outbound promo action banner */}
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4.5 flex items-center justify-between gap-4 flex-wrap mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⚡</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">Direct Sourcing Gateway</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">Bypass retail markups. Save 15% on direct bulk dispatch.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleTabChange("quote")}
                          className="bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold px-3.5 py-2 text-[10px] rounded-lg uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Submit RFQ Match
                        </button>
                      </div>
                    </div>

                    {/* RIGHT PANEL: Quick sandbox tool launchers */}
                    <div className="col-span-1 lg:col-span-5 space-y-6">
                      
                      {/* Quantity Surveyor Launcher */}
                      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 text-left space-y-4 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-widest font-mono uppercase">Surveyor Tool</span>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">Quantity Surveyor Sandbox</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-sans">Compute exact bags, granite yards, blocks, and rebar tonnage budgets under COREN auditing.</p>
                          </div>
                          
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                            <Calculator className="h-5 w-5" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleTabChange("calculator")}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>Launch Sandbox Calculator</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                        </button>
                      </div>

                      {/* Sourcing desk terminals summary */}
                      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 text-left space-y-4 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-widest font-mono uppercase">Merchant Registry</span>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-1">Certified Structural Desks</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-sans">Dial validated wholesalers representing primary yards in Nigeria.</p>
                          </div>
                          
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                            <Building2 className="h-5 w-5" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleTabChange("terminals")}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                        >
                          <span>View Wholesaler Catalog</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      </div>

                    </div>

                  </div>
                ) : (
                  /* SEARCH RESULTS POPULATED DISPLAY - TWO COLUMN LAYOUT */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: MAIN COGNITIVE SUMMARY RESULT */}
                    <div className="col-span-1 lg:col-span-8 space-y-6 text-left">
                      
                      {/* AI Search Report Card */}
                      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-[#B91C1C]/10 rounded-xl text-[#B91C1C] border border-[#B91C1C]/15">
                              <Cpu className="h-5 w-5 text-[#B91C1C]" />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 px-2 py-0.5 rounded tracking-widest font-mono uppercase">SHUREFIRE AI Synthesis</span>
                              <h3 className="text-base font-bold text-slate-900 mt-1 leading-none">Audited Sourcing Report</h3>
                            </div>
                          </div>

                          {/* Cache indicator info */}
                          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold text-slate-500">
                            {isCached ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                                <Database className="h-3.5 w-3.5 shrink-0" />
                                <span>CACHED RECORD</span>
                              </span>
                            ) : (
                              <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded flex items-center gap-1">
                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                <span>LIVE RETRIEVAL</span>
                              </span>
                            )}
                            {cachedAt && <span className="opacity-75">({new Date(cachedAt).toLocaleDateString()})</span>}
                          </div>
                        </div>

                        {/* Audited Central Narrative Answer */}
                        <div className="prose max-w-none prose-slate">
                          <Markdown>{featuredAnswer}</Markdown>
                        </div>

                        {/* Force refresh indicator if cached */}
                        {isCached && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500 font-semibold select-none">
                            <div className="flex items-center gap-1.5">
                              <Info className="h-4 w-4 text-slate-400" />
                              <span>This data was matched from Firestore registers. Force a direct Google crawlers lookup?</span>
                            </div>
                            <button
                              onClick={() => triggerSearch(true)}
                              disabled={isRefreshing}
                              className="text-[#B91C1C] font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-55"
                            >
                              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                              {isRefreshing ? "Syncing..." : "Sync Live Database"}
                            </button>
                          </div>
                        )}

                      </div>

                      {/* GOOGLE CRAWLER SEARCH INDEX BINDINGS */}
                      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                          <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Indexed Crawler Reference Feeds ({searchResults.length})</h4>
                          <p className="text-[10px] text-slate-500 mt-1 leading-none">Corroborated sources extracted via search grounding engine</p>
                        </div>

                        <div className="space-y-4 divide-y divide-slate-100">
                          {searchResults.length > 0 ? (
                            <div className="space-y-4 pt-1">
                              {searchResults.map((result, idx) => {
                                const isShurefireLink = result.url.includes("shurefire") || result.url.includes("wa.me");
                                const isExpanded = !!expandedResults[result.id];

                                return (
                                  <div 
                                    key={result.id || idx} 
                                    className={`pb-5 pt-4 first:pt-0 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 p-2.5 rounded-xl transition-all ${
                                      isShurefireLink ? "bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl shadow-xs" : ""
                                    }`}
                                  >
                                    {/* Web Domain Breadcrumb */}
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                      <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                                        isShurefireLink ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                      } font-bold shrink-0`}>
                                        {isShurefireLink ? "💬" : "🌐"}
                                      </div>
                                      <div className="flex items-center gap-1 flex-wrap font-semibold">
                                        <span className="text-slate-800">{result.siteName}</span>
                                        <span className="text-slate-400 font-normal">›</span>
                                        <span className="text-slate-500 font-mono text-[10px] truncate max-w-[150px] sm:max-w-xs">{result.url}</span>
                                      </div>
                                    </div>

                                    {/* Google Result Title */}
                                    <div 
                                      onClick={() => setExpandedResults(prev => ({ ...prev, [result.id]: !prev[result.id] }))}
                                      className="group cursor-pointer block leading-snug font-sans select-none"
                                    >
                                      <h3 className={`text-[15px] sm:text-[17px] ${
                                        isShurefireLink ? "text-emerald-700 font-bold" : "text-[#B91C1C] group-hover:underline font-bold"
                                      } leading-normal transition-all flex items-center gap-1.5`}>
                                        <span>{result.title}</span>
                                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform text-slate-400 ${
                                          isExpanded ? "rotate-180 text-[#B91C1C]" : ""
                                        }`} />
                                      </h3>
                                    </div>

                                    {/* Snippet summary Paragraph */}
                                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                                      {result.snippet}
                                    </p>

                                    {/* Expandable detailed content section */}
                                    {isExpanded && (
                                      <div className="mt-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-slate-700 text-xs sm:text-sm leading-relaxed shadow-inner space-y-3 animate-fadeIn">
                                        <div className="prose max-w-none text-slate-600 font-sans">
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
                                            <span className="text-[11px] text-slate-400 font-semibold italic">Broker-free pricing matched instantly</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-sm text-slate-400">
                              No additional indexed pages matching query. Enter terms above to expand.
                            </div>
                          )}
                        </div>

                        {groundingSources.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 space-y-2 select-none">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audited Reference Citations:</h4>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {groundingSources.map((source, idx) => (
                                <a
                                  key={idx}
                                  href={source.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition-all"
                                >
                                  <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span>{source.title.substring(0, 24)}...</span>
                                  <ChevronRight className="h-3 w-3 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* RIGHT COLUMN: SIDEBAR METADATA & FORMS */}
                    <div className="col-span-1 lg:col-span-4 space-y-6">
                      
                      {/* Live Depot Pricing items lists */}
                      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-5 text-left">
                        <div className="border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-[#B91C1C]" />
                            <h3 className="font-display font-extrabold text-slate-800 text-xs uppercase tracking-widest">Yard Price Registers</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">Audited wholesale rates across active Nigerian merchant depots</p>
                        </div>

                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {localMaterials.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs">
                              No matching materials in standard database registers. Please enter query filters.
                            </div>
                          ) : (
                            localMaterials.map((mat, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-150 transition-all space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="text-[8px] font-extrabold text-[#B91C1C] bg-[#B91C1C]/10 border border-[#B91C1C]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">{mat.category}</span>
                                    <h4 className="text-xs font-bold text-slate-900 leading-snug mt-1.5">{mat.name}</h4>
                                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                                      <MapPin className="h-3 w-3 text-slate-450" />
                                      {mat.supplierName} ({mat.supplierCity})
                                    </p>
                                  </div>
                                  
                                  <div>
                                    {mat.priceTrend === "up" ? (
                                      <span className="text-[8px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                                        ▲ Bullish
                                      </span>
                                    ) : mat.priceTrend === "down" ? (
                                      <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide">
                                        ▼ Stable
                                      </span>
                                    ) : (
                                      <span className="text-[8px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase tracking-wide border border-slate-250">
                                        Stable
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
                                  <div>
                                    <span className="text-xs text-slate-900 font-mono font-bold leading-none">
                                      {formatNaira(mat.price)} <span className="text-[9px] text-slate-400 font-normal">/{mat.unit}</span>
                                    </span>
                                  </div>
                                  
                                  <span className="text-[10px] font-bold text-slate-500 font-mono">Stock: {mat.stockLevel} units</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Integrated Lead RFQ Capture Widget */}
                      <LeadCaptureForm 
                        initialMaterials={query ? `Materials search specifications for query: "${query}"` : ""}
                        initialCategory={selectedCategory || ""}
                        initialRegion={selectedRegion || ""}
                        sourceContext={`Result side widget context query="${query}" region="${selectedRegion}"`}
                      />

                      {/* Verified active State Desks inside sidebar */}
                      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 text-left">
                        
                        <div className="border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[#B91C1C]" />
                            <h3 className="font-display font-extrabold text-slate-800 text-xs uppercase tracking-widest">Audited Supplier Desks</h3>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">Verified terminals synchronized with SHUREFIRE central authority</p>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                          {allSuppliers.slice(0, 3).map((supplier, idx) => (
                            <div key={idx} className="flex flex-col gap-2 pb-3.5 border-b border-slate-100 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <h4 className="text-xs font-bold text-slate-900 leading-none">{supplier.name}</h4>
                                {supplier.isVerified && (
                                  <span className="shrink-0 text-[8px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded">
                                    ✓ VERIFIED
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-[10px] text-slate-500 leading-none">Desk: {supplier.marketName}</p>
                              
                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-slate-500 font-bold font-sans text-[10px]">📍 {supplier.city}, {supplier.state}</span>
                                <a
                                  href={`tel:${supplier.contactPhone}`}
                                  className="text-[#B91C1C] font-bold flex items-center gap-0.5 font-mono hover:underline"
                                >
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  {supplier.contactPhone}
                                </a>
                              </div>
                            </div>
                          ))}
                          
                          <button 
                            onClick={() => handleTabChange("terminals")}
                            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-center text-xs font-bold rounded-xl cursor-pointer transition-all"
                          >
                            View Merchant Registry ({allSuppliers.length})
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>
                )}
              </div>
            )}

            </div>
          )
        )}

        {/* TAB 2: QUANTITY ESTIMATES CALCULATOR */}
        {activeTab === "calculator" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 border border-[#B91C1C]/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">SHUREFIRE Core Utilities</span>
                <h1 className="text-xl font-display font-black text-slate-900 mt-2 uppercase">Quantity Surveyor Sandbox</h1>
                <p className="text-xs text-slate-500">Compute precise concrete volume ratios, block amounts, rebar weights and estimated cost matrices under Seyi Alao (COREN) guidance.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                ← Search Hub
              </button>
            </div>

            <QuantityCalculator />

          </div>
        )}

        {/* TAB 3: FACTORY RFQ DISPATCH */}
        {activeTab === "quote" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
            
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 border border-[#B91C1C]/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">Sovereign Wholesalers Link</span>
                <h1 className="text-xl font-display font-black text-slate-900 mt-2 uppercase">Direct Factory RFQ Match</h1>
                <p className="text-xs text-slate-500">Bypass middleman distribution. Post your specs directly to registered wholesale merchant terminals in Nigeria.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                ← Back to Search
              </button>
            </div>

            <div className="bg-white p-2 rounded-3xl border border-slate-200/80 shadow-xs">
              <LeadCaptureForm 
                initialMaterials=""
                initialCategory=""
                initialRegion=""
                sourceContext="Dedicated Quote Matching Page"
              />
            </div>

          </div>
        )}

        {/* TAB 4: MERCHANT REGISTRY DIRECTORY */}
        {activeTab === "terminals" && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
            
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/85 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 border border-[#B91C1C]/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">Terminal Directory</span>
                <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 mt-2 uppercase">Certified Structural Merchants</h1>
                <p className="text-xs text-slate-500">Call block-making yards, quarry desks, and steel warehouses audited and registered in our central network.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                ← Back to Search
              </button>
            </div>

            {/* Filters Row */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-xs">
              
              <div className="flex-1 relative flex items-center w-full">
                <Search className="absolute left-3 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search merchant name, market location (e.g. Dei-Dei, Orile)..."
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#B91C1C] focus:border-[#B91C1C] transition-all"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={supplierRegionFilter}
                  onChange={(e) => setSupplierRegionFilter(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="">🗺️ Filter State (All)</option>
                  <option value="Lagos">Lagos State</option>
                  <option value="Abuja">Abuja FCT</option>
                  <option value="Rivers">Rivers State</option>
                  <option value="Kano">Kano State</option>
                  <option value="Kaduna">Kaduna State</option>
                  <option value="Enugu">Enugu State</option>
                  <option value="Oyo">Oyo State</option>
                </select>

                <button
                  onClick={() => { setSupplierSearchQuery(""); setSupplierRegionFilter(""); }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold select-none cursor-pointer"
                >
                  Reset
                </button>
              </div>

            </div>

            {/* Directory Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier, idx) => (
                  <div 
                    key={supplier.id || idx} 
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4 hover:border-[#B91C1C]/40 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 border border-[#B91C1C]/20 px-1.5 py-0.5 rounded tracking-wide font-mono uppercase">
                            Active Wholesaler
                          </span>
                          {supplier.isVerified && (
                            <span className="text-[8px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded uppercase">
                              ✓ Verified Desk
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-tight pt-1.5">{supplier.name}</h3>
                        <p className="text-[11px] text-slate-500 font-semibold">Terminal: {supplier.marketName}</p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[#B91C1C]">
                        <Building2 className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-600">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{supplier.marketName} market, {supplier.city}, {supplier.state} State</span>
                      </p>
                      
                      <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${supplier.contactPhone}`} className="text-slate-800 hover:text-[#B91C1C] hover:underline">
                          {supplier.contactPhone}
                        </a>
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                      <a 
                        href={`tel:${supplier.contactPhone}`}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg text-xs font-bold text-center transition-all select-none"
                      >
                        Dial Desk
                      </a>
                      <a 
                        href={`https://wa.me/${supplier.contactPhone.replace(/[^0-9]/g, "")}?text=Hello,%20I%20saw%20your%20listing%20on%20SHUREFIRE.%20I%20want%20to%20get%20wholesale%20delivery%20quotes.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 select-none"
                      >
                        <span>WhatsApp Match</span>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-white p-12 text-center border border-slate-200 rounded-2xl text-slate-400 text-sm">
                  No registered merchants match your search filters. Reset criteria to view full directory database.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: MARKET TREND ANALYTICS (The Construction Bloomberg terminal page) */}
        {activeTab === "analytics" && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
            
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/85 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left select-none">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#B91C1C] bg-[#B91C1C]/10 border border-[#B91C1C]/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">Audited Index feeds</span>
                <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 mt-2 uppercase">Sovereign Market Analytics</h1>
                <p className="text-xs text-slate-500">Analyse historical raw cement rates, rebar metal price indices, and parallel market USD fluctuations in Nigeria.</p>
              </div>

              <button
                onClick={() => handleTabChange("search")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                ← Back to Search
              </button>
            </div>

            {/* Dual Chart Column layouts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
              
              {/* Core Commodity Historic Curves Chart (8 cols) */}
              <div className="col-span-1 lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 text-left space-y-6 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Cement vs Steel Rebars 12-Month Index</h3>
                    <p className="text-[11px] text-slate-500">Historical wholesale pricing curves represented in Naira (₦)</p>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#B91C1C]"></span> Cement</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-900"></span> Steel 16mm</span>
                  </div>
                </div>

                {/* SVG Graph Drawing */}
                <div className="relative w-full h-[240px] border-b border-l border-slate-200 pt-4 pl-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 border-t border-slate-100 h-0 w-full"></div>
                  <div className="absolute inset-x-0 top-1/4 border-t border-slate-100 h-0 w-full"></div>
                  <div className="absolute inset-x-0 top-2/4 border-t border-slate-100 h-0 w-full"></div>
                  <div className="absolute inset-x-0 top-3/4 border-t border-slate-100 h-0 w-full"></div>

                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    {/* Area under curves */}
                    <polygon points="0,50 15,44 30,40 45,34 60,26 75,18 90,14 100,12 100,50 0,50" fill="rgba(185, 28, 28, 0.04)" />
                    <polygon points="0,50 15,35 30,34 45,28 60,25 75,20 90,15 100,10 100,50 0,50" fill="rgba(17, 24, 39, 0.02)" />

                    {/* Curve 1: Cement (Red Line) */}
                    <polyline
                      fill="none"
                      stroke="#B91C1C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      points="0,44 15,40 30,34 45,26 60,18 75,14 90,12 100,10"
                    />

                    {/* Curve 2: Steel Rebars (Dark Line) */}
                    <polyline
                      fill="none"
                      stroke="#111827"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeDasharray="1.5"
                      points="0,35 15,34 30,28 45,25 60,20 75,15 90,10 100,8"
                    />

                    {/* Highlight Dots */}
                    <circle cx="60" cy="18" r="1.5" fill="#B91C1C" />
                    <circle cx="60" cy="20" r="1.5" fill="#111827" />
                  </svg>

                  {/* Absolute coordinates hover tool */}
                  <div className="absolute top-10 left-[62%] bg-slate-900 text-white p-2.5 rounded-lg text-[9px] font-mono leading-relaxed shadow-md border border-slate-800 z-10">
                    <span className="font-bold text-[#B91C1C]">Jun 2026 Index:</span>
                    <p className="mt-0.5">CEM-DAN: ₦7,950 /bag</p>
                    <p>STL-16M: ₦13,800 /rod</p>
                  </div>
                </div>

                {/* X Axis Months */}
                <div className="flex justify-between text-[9px] font-bold text-slate-400 font-mono pt-1">
                  <span>Jul '25</span>
                  <span>Sep '25</span>
                  <span>Nov '25</span>
                  <span>Jan '26</span>
                  <span>Mar '26</span>
                  <span>May '26</span>
                  <span>Jul '26 (Live)</span>
                </div>

              </div>

              {/* Economic Correlation Desk (4 cols) */}
              <div className="col-span-1 lg:col-span-4 bg-[#111111] text-white rounded-3xl p-6 text-left space-y-5 flex flex-col justify-between border border-white/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4.5 w-4.5 text-[#B91C1C]" />
                    <h3 className="text-xs font-extrabold text-[#B91C1C] uppercase tracking-widest font-mono">FX Correlation Desk</h3>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Construction raw materials in Nigeria carry a heavy import coefficient (clinker fuel, alloy scrap processing). 
                    When the parallel market USD/NGN exchange rate fluctuates, cement and steel yards adjust their cash rates within 48 hours to preserve replacement margins.
                  </p>

                  <div className="space-y-2 pt-2 text-xs font-mono">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">FX Elasticity:</span>
                      <span className="font-bold text-emerald-400">+0.82 (High)</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">Rebar Imports Ratio:</span>
                      <span className="font-bold text-slate-300">68%</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4.5">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Sovereign Analyst Tip:</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans italic mt-1.5">
                    "Raw steel billet imports are currently surging at the Lagos port. Anticipate a 3% rebar adjustment in Lagos Mainland next month. Pre-order lock-ins recommended."
                  </p>
                </div>
              </div>

            </div>

            {/* Regional Pricing Discrepancy Heatmap Table */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 text-left space-y-4 shadow-xs select-none">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Regional Price Discrepancies Index</h3>
                <p className="text-[11px] text-slate-500">Audited average cash prices of core structural elements across active State Depots</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-700 font-medium">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono border-b border-slate-200">
                      <th className="py-3 px-4 text-left">Depot Location</th>
                      <th className="py-3 px-4 text-center">Dangote Cement (bag)</th>
                      <th className="py-3 px-4 text-center">BUA Cement (bag)</th>
                      <th className="py-3 px-4 text-center">Steel Rebar 16mm (length)</th>
                      <th className="py-3 px-4 text-center">Sharp Sand (20t tipper)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {[
                      { region: "Lagos Hub", cementDan: 7950, cementBua: 7800, steel16: 13800, sand: 135000 },
                      { region: "Abuja dei-Dei", cementDan: 8100, cementBua: 7950, steel16: 14200, sand: 128000 },
                      { region: "Port Harcourt", cementDan: 8200, cementBua: 8050, steel16: 14500, sand: 140000 },
                      { region: "Kano Sabon Gari", cementDan: 8400, cementBua: 8200, steel16: 14800, sand: 110000 },
                      { region: "Enugu Depot", cementDan: 8300, cementBua: 8150, steel16: 14600, sand: 125000 },
                      { region: "Ibadan Logistics", cementDan: 7850, cementBua: 7750, steel16: 13900, sand: 115000 }
                    ].map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-left">{row.region}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 bg-emerald-50/20">{formatNaira(row.cementDan)}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{formatNaira(row.cementBua)}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 bg-rose-50/10">{formatNaira(row.steel16)}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">{formatNaira(row.sand)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* 4. FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-left border-t border-slate-200 select-none">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-slate-500 text-xs">
          <div className="col-span-1 md:col-span-4 space-y-4">
            <ShurefireLogo size="sm" lightBg={true} />
            <p className="leading-relaxed text-slate-450 font-sans mt-2">
              SHUREFIRE is the definitive AI-powered market intelligence terminal for construction aggregates, structural metals, and building binders in Nigeria. Synthesizing real-time price crawl data for primary enterprise sourcing.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest font-mono text-[10px]">Depot Terminals</h4>
            <ul className="space-y-1.5 font-semibold">
              <li>📍 Lagos Main Harbor (Orile Desk)</li>
              <li>📍 Abuja Construction Depot (Dei-Dei Hub)</li>
              <li>📍 Port Harcourt Harbor Yard</li>
              <li>📍 Kano Commodity Terminal</li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest font-mono text-[10px]">Analytic Utilities</h4>
            <ul className="space-y-1.5 font-semibold">
              <li><button onClick={() => handleTabChange("search")} className="hover:text-slate-900 hover:underline cursor-pointer">AI Price Query Station</button></li>
              <li><button onClick={() => handleTabChange("calculator")} className="hover:text-slate-900 hover:underline cursor-pointer">Seyi Alao Surveyor Sandbox</button></li>
              <li><button onClick={() => handleTabChange("quote")} className="hover:text-slate-900 hover:underline cursor-pointer">Direct Sourcing RFQs Matching</button></li>
              <li><button onClick={() => handleTabChange("analytics")} className="hover:text-slate-900 hover:underline cursor-pointer">Historical Commodity Indexing</button></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-widest font-mono text-[10px]">Security & Status</h4>
            <ul className="space-y-1.5 font-semibold">
              <li className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>All Desks Operational</span>
              </li>
              <li>Sovereign DB: v2.4.15</li>
              <li>Audit: COREN Certified</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <span>&copy; {new Date().getFullYear()} SHUREFIRE Sourcing Network Nigeria. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="http://shurefire.com.ng" target="_blank" rel="noreferrer" className="hover:text-slate-600 hover:underline">SHUREFIRE Central Gateway</a>
            <span>•</span>
            <span className="text-[#B91C1C]">Premium Construction Intelligence</span>
          </div>
        </div>
      </footer>

      {/* 5. FLOATING COMMAND PALETTE MODAL (Ctrl/Cmd + K) */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
          
          {/* Backdrop closer click */}
          <div className="fixed inset-0" onClick={() => setIsCommandPaletteOpen(false)}></div>

          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col">
            
            {/* Search Input bar */}
            <div className="p-4 border-b border-slate-200/80 flex items-center gap-3">
              <Search className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Type command or search query (e.g. go to estimator)..."
                value={commandPaletteSearch}
                onChange={(e) => setCommandPaletteSearch(e.target.value)}
                className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none"
              />
              <button 
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-[10px] font-mono bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results listing */}
            <div className="p-2 max-h-80 overflow-y-auto text-left">
              
              {/* Category 1: Navigation Routing shortcuts */}
              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Routing Commands</span>
                <div className="space-y-1 mt-1.5">
                  {[
                    { label: "Go to AI Search Hub (Prices Crawl)", tab: "search", icon: Cpu },
                    { label: "Go to Quantity Surveyor Sandbox (Estimator)", tab: "calculator", icon: Calculator },
                    { label: "Go to Direct Sourcing RFQs Match", tab: "quote", icon: Workflow },
                    { label: "Go to Certified Wholesalers Directory", tab: "terminals", icon: Building2 },
                    { label: "Go to Market Historical Analytics", tab: "analytics", icon: Activity }
                  ].filter(item => item.label.toLowerCase().includes(commandPaletteSearch.toLowerCase()))
                   .map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => { handleTabChange(item.tab as any); setIsCommandPaletteOpen(false); }}
                        className="w-full p-2.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors text-left"
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-[#B91C1C]" />
                          {item.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">⏎ Route</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Popular predefined sourcing inquiries */}
              <div className="p-2 border-t border-slate-100 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Audited Commodity Queries</span>
                <div className="space-y-1 mt-1.5">
                  {COMMAND_SHORTCUTS.filter(item => item.title.toLowerCase().includes(commandPaletteSearch.toLowerCase()))
                    .map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => { 
                          handlePillClick(item.query, item.category); 
                          setIsCommandPaletteOpen(false); 
                        }}
                        className="w-full p-2.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 transition-colors text-left font-medium"
                      >
                        <span className="flex items-center gap-2 truncate max-w-[340px]">
                          <span>🔎</span>
                          <span className="truncate">{item.title}</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Run Query</span>
                      </button>
                    ))}
                </div>
              </div>

            </div>

            {/* Hint footer */}
            <div className="bg-slate-50 p-3 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-150 select-none">
              <span>↑↓ to navigate, ⏎ to confirm</span>
              <span>SHUREFIRE Terminal Search</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
