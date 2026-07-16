import React, { useState, useEffect } from "react";
import { 
  Search, 
  Mic, 
  Camera, 
  Globe, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Printer, 
  Download, 
  Check, 
  Loader2, 
  Info, 
  AlertTriangle,
  Calculator,
  RefreshCw
} from "lucide-react";

// Helper for Naira currency format
const formatNaira = (value: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace("NGN", "₦");
};

// Types for structural material estimates
interface EstimateItem {
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  subtotal: number;
  note: string;
}

interface StructuredEstimate {
  projectTitle: string;
  isDuplex: boolean;
  isSwampy: boolean;
  isPremium: boolean;
  isBasic: boolean;
  substructure: EstimateItem[];
  wallingRoofing: EstimateItem[];
  finishes: EstimateItem[];
  substructureTotal: number;
  wallingRoofingTotal: number;
  finishesTotal: number;
  grandTotal: number;
  deliveryLogistics: number;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [currentView, setCurrentView] = useState<"landing" | "results">("landing");
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ resultsCount: 0, duration: 0 });
  const [activeTab, setActiveTab] = useState<"all" | "pricing" | "depots" | "guides">("all");
  const [estimate, setEstimate] = useState<StructuredEstimate | null>(null);
  
  // Interactive Modal state
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showConverterModal, setShowConverterModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Material unit states (Standard defaults)
  const [steelUnit, setSteelUnit] = useState<"Length" | "KG" | "Tons">("Length");
  const [sandUnit, setSandUnit] = useState<"Tipper" | "Tons" | "Bags">("Tipper");
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  // Parse queries and dynamically compute highly detailed material quantities & prices
  const calculateEstimate = (searchQuery: string): StructuredEstimate => {
    const qLower = searchQuery.toLowerCase();
    
    // 1. Parse Project Type
    let projectTitle = "Standard Residential Build";
    let sizeMultiplier = 1.0;
    let isDuplex = false;
    
    if (qLower.includes("duplex") || qLower.includes("storey") || qLower.includes("story") || qLower.includes("two-floor")) {
      projectTitle = "Multi-Storey Duplex Project";
      sizeMultiplier = 1.85;
      isDuplex = true;
    } else if (qLower.includes("bungalow") || qLower.includes("3-bedroom") || qLower.includes("3 bedroom") || qLower.includes("4-bedroom")) {
      projectTitle = "3-Bedroom Residential Bungalow";
      sizeMultiplier = 1.15;
    } else if (qLower.includes("boys quarters") || qLower.includes("bq") || qLower.includes("boys-quarters") || qLower.includes("small flat")) {
      projectTitle = "Boys Quarters (BQ) Annex";
      sizeMultiplier = 0.50;
    } else if (qLower.includes("commercial") || qLower.includes("plaza") || qLower.includes("complex")) {
      projectTitle = "Commercial Block / Plaza";
      sizeMultiplier = 3.10;
    } else if (qLower.includes("cement") || qLower.includes("price") || qLower.includes("rate")) {
      projectTitle = "Material Spot Pricing Query";
      sizeMultiplier = 1.0;
    } else {
      projectTitle = "Custom Residential Sourcing";
      sizeMultiplier = 1.0;
    }

    // 2. Parse Swampy Soil conditions (Lekki, Victoria Island, etc. require severe foundation surcharges)
    const isSwampy = qLower.includes("lekki") || qLower.includes("swamp") || qLower.includes("marsh") || qLower.includes("water") || qLower.includes("island") || qLower.includes("flooded") || qLower.includes("badagry");

    // 3. Parse Finishing Quality Standards
    const isPremium = qLower.includes("premium") || qLower.includes("luxury") || qLower.includes("high-end") || qLower.includes("first-class");
    const isBasic = qLower.includes("basic") || qLower.includes("cheap") || qLower.includes("low-cost") || qLower.includes("budget");

    // Base rates in Nigerian Naira (Sovereign Marketplace Index 2026)
    const cementRate = 7950; // Dangote 50kg
    const cementBuaRate = 7800; // BUA 50kg for masonry/plaster
    const steel16mmRate = 13800; // per length (12m)
    const steel12mmRate = 8300; // per length (12m)
    const sharpSandRate = 135000; // per 20-ton tipper
    const graniteRate = 275000; // per 20-ton tipper
    const blocksRate = 780; // 9-inch vibrated hollow
    const roofingRate = 4500; // per SQM Premium Aluminum
    const timberRate = 1800; // per 2x4 length
    
    // Rates influenced by finishing quality
    const tilesRate = isPremium ? 14500 : isBasic ? 5800 : 9500; // SQM
    const paintRate = isPremium ? 48000 : isBasic ? 14000 : 32000; // 20L Drum
    const popRate = 6500; // per bag
    const doorRate = isPremium ? 145000 : isBasic ? 38000 : 85000; // Solid wooden doors

    // --- SECTION A: SUBSTRUCTURE ITEMS ---
    const subCementQty = Math.ceil(130 * sizeMultiplier + (isSwampy ? 65 : 0));
    const subSteel16Qty = Math.ceil(70 * sizeMultiplier + (isSwampy ? 50 : 0));
    const subSteel12Qty = Math.ceil(85 * sizeMultiplier + (isSwampy ? 40 : 0));
    const subSandQty = Math.ceil(3 * sizeMultiplier + (isSwampy ? 2 : 0));
    const subGraniteQty = Math.ceil(4 * sizeMultiplier + (isSwampy ? 2 : 0));

    // Dynamic conversions for Steel and Sand
    const weight16mm = 18.96; // kg per 12m length
    const weight12mm = 10.67; // kg per 12m length

    let dispSteel16Qty = subSteel16Qty;
    let dispSteel16Unit = "Length (12m)";
    let dispSteel16Rate = steel16mmRate;
    let dispSteel16Subtotal = subSteel16Qty * steel16mmRate;

    if (steelUnit === "KG") {
      dispSteel16Qty = Math.ceil(subSteel16Qty * weight16mm);
      dispSteel16Unit = "KG";
      dispSteel16Rate = Math.round(steel16mmRate / weight16mm);
      dispSteel16Subtotal = Math.round(dispSteel16Qty * dispSteel16Rate);
    } else if (steelUnit === "Tons") {
      dispSteel16Qty = Number(((subSteel16Qty * weight16mm) / 1000).toFixed(3));
      dispSteel16Unit = "Ton";
      dispSteel16Rate = Math.round((steel16mmRate / weight16mm) * 1000);
      dispSteel16Subtotal = Math.round(dispSteel16Qty * dispSteel16Rate);
    }

    let dispSteel12Qty = subSteel12Qty;
    let dispSteel12Unit = "Length (12m)";
    let dispSteel12Rate = steel12mmRate;
    let dispSteel12Subtotal = subSteel12Qty * steel12mmRate;

    if (steelUnit === "KG") {
      dispSteel12Qty = Math.ceil(subSteel12Qty * weight12mm);
      dispSteel12Unit = "KG";
      dispSteel12Rate = Math.round(steel12mmRate / weight12mm);
      dispSteel12Subtotal = Math.round(dispSteel12Qty * dispSteel12Rate);
    } else if (steelUnit === "Tons") {
      dispSteel12Qty = Number(((subSteel12Qty * weight12mm) / 1000).toFixed(3));
      dispSteel12Unit = "Ton";
      dispSteel12Rate = Math.round((steel12mmRate / weight12mm) * 1000);
      dispSteel12Subtotal = Math.round(dispSteel12Qty * dispSteel12Rate);
    }

    let dispSubSandQty = subSandQty;
    let dispSubSandUnit = "20-Ton Tipper";
    let dispSubSandRate = sharpSandRate;
    let dispSubSandSubtotal = subSandQty * sharpSandRate;

    if (sandUnit === "Tons") {
      dispSubSandQty = subSandQty * 20;
      dispSubSandUnit = "Ton";
      dispSubSandRate = Math.round(sharpSandRate / 20); // 6750
      dispSubSandSubtotal = Math.round(dispSubSandQty * dispSubSandRate);
    } else if (sandUnit === "Bags") {
      dispSubSandQty = subSandQty * 400; // 400 bags of 50kg
      dispSubSandUnit = "50kg Bag";
      dispSubSandRate = Math.round(sharpSandRate / 400); // 338
      dispSubSandSubtotal = Math.round(dispSubSandQty * dispSubSandRate);
    }

    const substructureItems: EstimateItem[] = [
      {
        name: "Dangote Cement 3X (Grade 42.5R)",
        quantity: subCementQty,
        unit: "50kg Bag",
        rate: cementRate,
        subtotal: subCementQty * cementRate,
        note: isSwampy ? "Enhanced mix design for deep raft foundation columns." : "Foundation footing and ground slab concrete casting."
      },
      {
        name: "16mm TMT High-Yield Steel Rebars (12m)",
        quantity: dispSteel16Qty,
        unit: dispSteel16Unit,
        rate: dispSteel16Rate,
        subtotal: dispSteel16Subtotal,
        note: isSwampy ? "Raft foundation beams and pile caps reinforcement." : "Column structural cores and tension beams."
      },
      {
        name: "12mm High-Tension Ribbed Steel Rebars (12m)",
        quantity: dispSteel12Qty,
        unit: dispSteel12Unit,
        rate: dispSteel12Rate,
        subtotal: dispSteel12Subtotal,
        note: "Stirrup binding and slab mesh reinforcement distribution."
      },
      {
        name: "Sharp Clean Sand (Washed)",
        quantity: dispSubSandQty,
        unit: dispSubSandUnit,
        rate: dispSubSandRate,
        subtotal: dispSubSandSubtotal,
        note: "Washed coarse aggregates for durable foundation concrete casting."
      },
      {
        name: "Crushed Granite Stones (3/4 Inch)",
        quantity: subGraniteQty,
        unit: "20-Ton Tipper",
        rate: graniteRate,
        subtotal: subGraniteQty * graniteRate,
        note: "Rigid aggregate framework for high-compressive structural load support."
      }
    ];

    // Add Raft Waterproofing Membrane if terrain is swampy (Lekki specialty)
    if (isSwampy) {
      substructureItems.push({
        name: "Raft Slab Anti-Moisture Nylon Membrane",
        quantity: 8,
        unit: "Roll (50m)",
        rate: 45000,
        subtotal: 8 * 45000,
        note: "Prevents swampy water rising through concrete capillary pores."
      });
    }

    // --- SECTION B: WALLING & ROOFING ITEMS ---
    const wallBlocksQty = Math.ceil(2400 * sizeMultiplier);
    const wallCementQty = Math.ceil(95 * sizeMultiplier);
    const wallSandQty = Math.ceil(2 * sizeMultiplier);
    const wallRoofQty = Math.ceil(160 * sizeMultiplier * (isDuplex ? 0.75 : 1.0)); // duplex has smaller roof relative to total area
    const wallTimberQty = Math.ceil(190 * sizeMultiplier * (isDuplex ? 0.75 : 1.0));

    let dispWallSandQty = wallSandQty;
    let dispWallSandUnit = "20-Ton Tipper";
    let dispWallSandRate = sharpSandRate;
    let dispWallSandSubtotal = wallSandQty * sharpSandRate;

    if (sandUnit === "Tons") {
      dispWallSandQty = wallSandQty * 20;
      dispWallSandUnit = "Ton";
      dispWallSandRate = Math.round(sharpSandRate / 20); // 6750
      dispWallSandSubtotal = Math.round(dispWallSandQty * dispWallSandRate);
    } else if (sandUnit === "Bags") {
      dispWallSandQty = wallSandQty * 400;
      dispWallSandUnit = "50kg Bag";
      dispWallSandRate = Math.round(sharpSandRate / 400); // 338
      dispWallSandSubtotal = Math.round(dispWallSandQty * dispWallSandRate);
    }

    const wallingRoofingItems: EstimateItem[] = [
      {
        name: "9-Inch Vibrated Hollow Masonry Blocks",
        quantity: wallBlocksQty,
        unit: "Piece",
        rate: blocksRate,
        subtotal: wallBlocksQty * blocksRate,
        note: "High-compressive load-bearing bricks for external envelope."
      },
      {
        name: "BUA Supreme Cement (Grade 32.5N)",
        quantity: wallCementQty,
        unit: "50kg Bag",
        rate: cementBuaRate,
        subtotal: wallCementQty * cementBuaRate,
        note: "Ideal strength grade for plastering and mortar joints."
      },
      {
        name: "Finely Screened Plastering Sand",
        quantity: dispWallSandQty,
        unit: dispWallSandUnit,
        rate: dispWallSandRate,
        subtotal: dispWallSandSubtotal,
        note: "Clay-free sand for pristine internal/external plaster finishing."
      },
      {
        name: "Premium Aluminum Roofing Sheets (0.55mm)",
        quantity: wallRoofQty,
        unit: "SQM",
        rate: roofingRate,
        subtotal: wallRoofQty * roofingRate,
        note: "Long-span rust-resistant thermal roofing sheets."
      },
      {
        name: "Hardwood Structural Timber Rafters (2x4)",
        quantity: wallTimberQty,
        unit: "Length",
        rate: timberRate,
        subtotal: wallTimberQty * timberRate,
        note: "Treated anti-termite roof frame timber support trusses."
      }
    ];

    // --- SECTION C: INTERIOR FINISHES ITEMS ---
    const tilesQty = Math.ceil(170 * sizeMultiplier);
    const paintQty = Math.ceil(14 * sizeMultiplier);
    const popQty = Math.ceil(55 * sizeMultiplier);
    const doorsQty = Math.ceil(8 * sizeMultiplier);

    const finishesItems: EstimateItem[] = [
      {
        name: `Vitrified Floor Tiles (60x60cm) - ${isPremium ? "Premium Polished" : isBasic ? "Standard Matte" : "Elite Glazed"}`,
        quantity: tilesQty,
        unit: "Box",
        rate: tilesRate,
        subtotal: tilesQty * tilesRate,
        note: "Premium dust-resistant scratch-proof indoor flooring."
      },
      {
        name: `Premium Acrylic Emulsion Wall Paint - ${isPremium ? "Luxury Silk Finish" : isBasic ? "Basic Matte" : "Satin Textures"}`,
        quantity: paintQty,
        unit: "20L Drum",
        rate: paintRate,
        subtotal: paintQty * paintRate,
        note: "Ultra-washable interior and exterior premium colored paint layers."
      },
      {
        name: "Plaster of Paris (P.O.P) High-Grade Powder",
        quantity: popQty,
        unit: "40kg Bag",
        rate: popRate,
        subtotal: popQty * popRate,
        note: "Refined gypsum material for suspended ceiling molding works."
      },
      {
        name: `Luxury Solid Hardwood Internal Doors - ${isPremium ? "Royal Walnut" : isBasic ? "HDF Flush" : "Veneer Finish"}`,
        quantity: doorsQty,
        unit: "Set",
        rate: doorRate,
        subtotal: doorsQty * doorRate,
        note: "Equipped with brass hinges and modern security lockset plates."
      },
      {
        name: "Complete Plumbing Sanitary & Piping Kit",
        quantity: 1,
        unit: "Lot",
        rate: 450000,
        subtotal: 450000,
        note: "Sewer pipes, washbasins, water closets, and water piping fixtures."
      }
    ];

    // Compute Subtotals
    const substructureTotal = substructureItems.reduce((sum, i) => sum + i.subtotal, 0);
    const wallingRoofingTotal = wallingRoofingItems.reduce((sum, i) => sum + i.subtotal, 0);
    const finishesTotal = finishesItems.reduce((sum, i) => sum + i.subtotal, 0);
    
    // Delivery logistics (Lekki/Swampy area delivery surcharges apply)
    const deliveryLogistics = isSwampy ? 220000 : 130000;
    const grandTotal = substructureTotal + wallingRoofingTotal + finishesTotal + deliveryLogistics;

    return {
      projectTitle,
      isDuplex,
      isSwampy,
      isPremium,
      isBasic,
      substructure: substructureItems,
      wallingRoofing: wallingRoofingItems,
      finishes: finishesItems,
      substructureTotal,
      wallingRoofingTotal,
      finishesTotal,
      grandTotal,
      deliveryLogistics
    };
  };

  // Trigger search logic mimicking Google's transition
  const handleSearch = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = customQuery !== undefined ? customQuery : query;
    if (!activeQuery.trim()) return;

    setIsLoading(true);
    
    // Simulate natural search latency (150ms - 400ms) for professional realism
    const randomLatency = Math.floor(Math.random() * 250) + 150;
    
    setTimeout(() => {
      const computed = calculateEstimate(activeQuery);
      setEstimate(computed);
      setLastSearchedQuery(activeQuery);
      setSearchStats({
        resultsCount: Math.floor(Math.random() * 210000) + 14000,
        duration: randomLatency / 1000
      });
      setIsLoading(false);
      setCurrentView("results");
    }, randomLatency);
  };

  // Automatically update estimate calculations in real-time when unit switches occur
  useEffect(() => {
    if (lastSearchedQuery) {
      const computed = calculateEstimate(lastSearchedQuery);
      setEstimate(computed);
    }
  }, [steelUnit, sandUnit, lastSearchedQuery]);

  // Reset to homepage
  const handleResetToHomepage = () => {
    setQuery("");
    setEstimate(null);
    setCurrentView("landing");
  };

  // Mock Sourcing submission
  const triggerProcureBundle = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccess(true);
    }, 1500);
  };

  // Trigger browser print screen configured to capture results cleanly
  const triggerPrintPDF = () => {
    window.print();
  };

  // Quick audit pills click
  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    handleSearch(undefined, text);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans flex flex-col relative select-text antialiased">
      
      {/* ----------------- VIEW 1: THE SEARCH LANDING PAGE (ENTRY SCREEN) ----------------- */}
      {currentView === "landing" && (
        <div className="flex-1 flex flex-col justify-between py-4 animate-fade-in">
          
          {/* Top Bar Navigation */}
          <header className="w-full max-w-7xl mx-auto px-6 flex justify-end items-center gap-4.5 select-none h-16">
            <span className="text-[13px] font-medium text-neutral-700 hover:underline cursor-pointer">Sovereign Rates Index</span>
            <span className="text-[13px] font-medium text-neutral-700 hover:underline cursor-pointer font-mono">v2.6 Live</span>
            
            {/* Google-like Apps Grid Icon */}
            <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 shrink-0" title="Shurefire Services">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
              </svg>
            </button>
            
            {/* Professional Construction Manager avatar */}
            <div className="h-[34px] w-[34px] rounded-full bg-[#ae2424] text-white flex items-center justify-center font-bold text-xs shadow-inner cursor-pointer border border-[#ae2424]/30" title="Ramon Bisola (Project Manager)">
              RB
            </div>
          </header>

          {/* Center Search Console Column */}
          <main className="w-full max-w-3xl mx-auto px-4 flex flex-col items-center justify-center space-y-7.5 my-auto">
            
            {/* Center Logo displays bold typography using '#ae2424' */}
            <div className="flex flex-col items-center cursor-default select-none animate-fade-in pb-2">
              <span className="text-7xl sm:text-8xl md:text-[96px] font-black tracking-tighter text-[#ae2424] font-sans drop-shadow-3xs">
                Shurefire
              </span>
            </div>

            {/* The Pill Search Bar Assembly */}
            <form onSubmit={handleSearch} className="w-full max-w-[584px] space-y-6">
              
              <div className="relative flex items-center bg-white border-2 border-neutral-300 hover:border-neutral-400/90 focus-within:border-[#ae2424] focus-within:ring-2 focus-within:ring-[#ae2424]/10 rounded-full hover:shadow-md focus-within:shadow-md transition-all duration-150 px-5 py-3.5 z-10">
                {/* Left: Custom Hard-hat icon colored in #ae2424 */}
                <div className="flex items-center justify-center pl-1 pr-3.5 shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-[21px] w-[21px] text-[#ae2424]">
                    <path d="M2 18h20" />
                    <path d="M12 3a9 9 0 0 1 9 9v5H3v-5a9 9 0 0 1 9-9z" fill="#ae2424" fillOpacity="0.12" />
                    <path d="M12 3v5" strokeWidth="3" />
                    <circle cx="8" cy="11" r="1" fill="currentColor" />
                    <circle cx="16" cy="11" r="1" fill="currentColor" />
                  </svg>
                </div>

                {/* Input Text Field */}
                <input
                  type="text"
                  required
                  placeholder="Estimate your project: E.g., '3-bedroom bungalow in Lekki, standard finishes'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-neutral-900 font-sans text-base focus:outline-none placeholder:text-neutral-400 placeholder:font-light"
                />

                {/* Right Icons: Microphone and Camera Lens */}
                <div className="flex items-center gap-3 pr-1 shrink-0 text-neutral-400 select-none">
                  <button type="button" className="hover:text-neutral-700 transition-colors" title="Voice Estimate (Powered by AI)">
                    <Mic className="h-[18px] w-[18px]" />
                  </button>
                  <button type="button" className="hover:text-neutral-700 transition-colors" title="Scan Structural Blueprints">
                    <Camera className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>

              {/* Action Buttons Centered Below Search Bar */}
              <div className="flex items-center justify-center gap-3.5 pt-1.5 select-none">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-neutral-50 hover:bg-neutral-100/90 hover:border-neutral-350 text-neutral-800 text-[14px] font-semibold rounded-lg border border-neutral-200/80 hover:border-neutral-300 transition-all cursor-pointer min-w-[135px] shadow-3xs"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#ae2424]" />
                      Estimating...
                    </span>
                  ) : (
                    "ShureEstimate"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSuggestionClick("Dangote cement 50kg bag wholesale price Lagos")}
                  className="px-5 py-2.5 bg-neutral-50 hover:bg-neutral-100/90 hover:border-neutral-350 text-neutral-800 text-[14px] font-semibold rounded-lg border border-neutral-200/80 hover:border-neutral-300 transition-all cursor-pointer min-w-[135px] shadow-3xs"
                >
                  Procure with Shurefire
                </button>
              </div>

            </form>

            {/* Subtext Disclaimer */}
            <div className="text-center max-w-md select-none">
              <span className="text-[12px] text-neutral-400 tracking-wide">
                Calculations powered by Gemini AI. Real-time pricing sourced from Shurefire Sovereign Marketplace.
              </span>
            </div>

            {/* Suggested Shortcuts for Quick Inquiries */}
            <div className="pt-4 flex flex-col items-center space-y-2 select-none">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Suggested Audit Templates:</span>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                <button 
                  onClick={() => handleSuggestionClick("3-bedroom bungalow in Lekki, standard finishes")}
                  className="px-3.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 rounded-full text-[12px] text-neutral-600 font-medium transition-colors cursor-pointer"
                >
                  3-bed Bungalow (Lekki swampy terrain)
                </button>
                <button 
                  onClick={() => handleSuggestionClick("4-bedroom duplex in Ikeja, premium finishes")}
                  className="px-3.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 rounded-full text-[12px] text-neutral-600 font-medium transition-colors cursor-pointer"
                >
                  4-bed Duplex (Premium finishing)
                </button>
                <button 
                  onClick={() => handleSuggestionClick("Boys quarters in Abuja Dei-Dei")}
                  className="px-3.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 rounded-full text-[12px] text-neutral-600 font-medium transition-colors cursor-pointer"
                >
                  BQ Annex (Standard)
                </button>
              </div>
            </div>

          </main>

          {/* Footer - Dual-layered minimalist bottom bar */}
          <footer className="w-full bg-neutral-100 border-t border-neutral-200 text-neutral-500 text-[13px] select-none">
            {/* Layer 1: Location indicator */}
            <div className="max-w-7xl mx-auto px-6 py-3 border-b border-neutral-200/70 font-medium">
              <span>Region: Lagos, Nigeria</span>
            </div>
            {/* Layer 2: Business & Legal Links */}
            <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-col sm:flex-row justify-between gap-3 font-normal text-neutral-500">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 justify-center sm:justify-start">
                <span className="hover:underline cursor-pointer">About Shurefire</span>
                <span className="hover:underline cursor-pointer">Advertising</span>
                <span className="hover:underline cursor-pointer">Business Solutions</span>
                <span className="hover:underline cursor-pointer">How Pricing works</span>
              </div>
              <div className="flex items-center gap-5 justify-center sm:justify-end">
                <span className="hover:underline cursor-pointer">Privacy</span>
                <span className="hover:underline cursor-pointer">Terms</span>
                <span className="hover:underline cursor-pointer">Settings</span>
              </div>
            </div>
          </footer>

        </div>
      )}

      {/* ----------------- VIEW 2: THE GOOGLE-STYLE RESULTS PAGE (OUTPUT SCREEN) ----------------- */}
      {currentView === "results" && estimate && (
        <div className="flex-1 flex flex-col bg-white">
          
          {/* Top Bar Navigation (Logo left, search input inline) */}
          <header className="sticky top-0 bg-white border-b border-neutral-200/80 z-20 select-none print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="flex flex-1 items-center gap-6">
                {/* Logo top-left - clickable back to homepage */}
                <div 
                  onClick={handleResetToHomepage}
                  className="flex items-center gap-1.5 cursor-pointer text-2xl font-black tracking-tight text-[#ae2424] shrink-0"
                >
                  <span>Shurefire</span>
                </div>

                {/* Inline search bar (Vast negative space) */}
                <form onSubmit={handleSearch} className="flex-1 max-w-[630px]">
                  <div className="relative flex items-center bg-white border border-neutral-200/90 rounded-full shadow-2xs hover:shadow-sm focus-within:shadow-sm transition-shadow px-3.5 py-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4.5 w-4.5 text-[#ae2424] mr-2 shrink-0">
                      <path d="M2 18h20" />
                      <path d="M12 3a9 9 0 0 1 9 9v5H3v-5a9 9 0 0 1 9-9z" fill="#ae2424" fillOpacity="0.12" />
                    </svg>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-transparent text-neutral-800 font-sans text-xs focus:outline-none placeholder:text-neutral-400"
                    />
                    <div className="flex items-center gap-2 text-neutral-400 pr-1 shrink-0">
                      <button type="submit" className="text-[#ae2424] hover:opacity-85 transition-opacity" title="Re-calculate Estimate">
                        <Search className="h-4 w-4" />
                      </button>
                      <button type="button" className="hover:text-neutral-700" title="Voice input">
                        <Mic className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Menu & Account profile */}
              <div className="flex items-center gap-4 self-end md:self-auto">
                <button className="p-2 hover:bg-neutral-100 rounded-full text-neutral-600" title="Configuration Panel">
                  <Settings className="w-[18px] h-[18px]" />
                </button>
                <button className="p-2 hover:bg-neutral-100 rounded-full text-neutral-600">
                  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                  </svg>
                </button>
                <div className="h-8 w-8 rounded-full bg-[#ae2424] text-white flex items-center justify-center font-bold text-[11px] border border-[#ae2424]/20 shadow-xs">
                  RB
                </div>
              </div>

            </div>

            {/* Google Search Style Navigation Tabs (Under Bar) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center border-t border-neutral-100/40 text-neutral-500 text-xs font-medium">
              <div className="flex items-center gap-6 pt-2.5 pb-2">
                <button 
                  onClick={() => setActiveTab("all")}
                  className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
                    activeTab === "all" ? "border-[#ae2424] text-[#ae2424] font-semibold" : "border-transparent hover:text-neutral-800"
                  }`}
                >
                  All Estimates
                </button>
                <button 
                  onClick={() => setActiveTab("pricing")}
                  className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
                    activeTab === "pricing" ? "border-[#ae2424] text-[#ae2424] font-semibold" : "border-transparent hover:text-neutral-800"
                  }`}
                >
                  Sovereign Spot Pricing
                </button>
                <button 
                  onClick={() => setActiveTab("depots")}
                  className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
                    activeTab === "depots" ? "border-[#ae2424] text-[#ae2424] font-semibold" : "border-transparent hover:text-neutral-800"
                  }`}
                >
                  Active Sourcing Depots
                </button>
                <button 
                  onClick={() => setActiveTab("guides")}
                  className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
                    activeTab === "guides" ? "border-[#ae2424] text-[#ae2424] font-semibold" : "border-transparent hover:text-neutral-800"
                  }`}
                >
                  Structural Standards (SON)
                </button>
              </div>
            </div>
          </header>

          {/* Main Layout Grid - Split Columns */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5.5 flex flex-col lg:flex-row gap-7 animate-fade-in print:py-0 print:gap-0">
            
            {/* LEFT COLUMN: Organic Google Style results + Structured Tables (~65% width) */}
            <section className="flex-1 lg:w-[65%] space-y-6">
              
              {/* Search Stats (mimics Google) */}
              <div className="text-[13px] text-neutral-500 font-sans select-none print:hidden">
                <span>About {searchStats.resultsCount.toLocaleString()} sovereign indexes loaded in {searchStats.duration} seconds</span>
              </div>

              {/* [SIMULATED ORGANIC GOOGLE SEARCH SNIPPET] */}
              <div className="bg-white rounded-xl border border-neutral-100 p-4.5 space-y-1.5 select-text shadow-3xs hover:border-neutral-200/80 transition-colors">
                <div className="flex items-center gap-2 text-[12px] text-neutral-600">
                  <span className="font-semibold text-[#ae2424]">https://shurefire.com</span>
                  <span>› index › estimates</span>
                </div>
                <h3 className="text-[19px] text-[#ae2424] font-semibold hover:underline cursor-pointer leading-tight">
                  Estimated Sourcing Schedule for {estimate.projectTitle} (Lagos Sovereign Ledger)
                </h3>
                <p className="text-[13.5px] text-neutral-600 leading-relaxed">
                  Real-time bill of quantities computed dynamically for <span className="font-semibold text-neutral-800">"{query}"</span>. 
                  Pricing utilizes direct terminal indexes from Lagos depots. Includes substructure excavation, load-bearing blockwork, 
                  long-span metal roofing structures, and localized dry-finishing guidelines.
                </p>
              </div>

              {/* [AI SMART RESPONSE / SUMMARIZED ESTIMATE CARD] */}
              <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-xl p-5 space-y-3.5">
                <div className="flex items-center gap-1.5 select-none">
                  <svg className="w-4 h-4 text-[#ae2424] animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.096.813Z" />
                  </svg>
                  <span className="text-[11px] font-bold text-[#ae2424] tracking-widest font-mono uppercase">Gemini AI Sourcing Evaluation</span>
                </div>
                
                <p className="text-[14px] text-neutral-700 leading-relaxed">
                  The computed estimate focuses on a <span className="font-bold text-neutral-800">{estimate.projectTitle}</span> layout. 
                  {estimate.isSwampy ? (
                    <span className="text-neutral-700 block mt-2">
                      ⚠️ <strong className="text-neutral-800">Swampy Terrain Warning:</strong> Sourcing is adjusted for Lekki peninsula soils. Substructure concrete and reinforcement demands have been scaled upward by **35%** to support a rigid raft foundation beam configuration, adding waterproof membranes and extra Grade 42.5R cement.
                    </span>
                  ) : (
                    " Quantities assume standard dry-soil excavation footing depth of 1.2 meters."
                  )}
                  {estimate.isPremium ? (
                    <span className="block mt-2">
                      ⭐ <strong className="text-neutral-800">Premium Finishes:</strong> Cost calculations utilize elite glazed floor tiles and royal hardwood doors, optimizing long-term visual luxury and resistance to sea-air salinity.
                    </span>
                  ) : estimate.isBasic ? (
                    <span className="block mt-2">
                      📉 <strong className="text-neutral-800">Budget Finishes:</strong> Interior finishes are optimized for rapid cost-saving, utilizing highly durable standard matte tiles and HDF Flush doors.
                    </span>
                  ) : (
                    " Finishing items are scaled according to standard professional tenant specs."
                  )}
                </p>
              </div>

              {/* [STRUCTURED ESTIMATE TABLES BY SECTIONS] */}
              <div className="space-y-7.5">
                
                {/* 1. SUBSTRUCTURE SECTION */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                    <h2 className="text-[16px] font-extrabold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#ae2424]"></span>
                      Section 1: Substructure & Foundation Footings
                    </h2>
                    <span className="text-xs font-bold text-neutral-500 font-mono">
                      Subtotal: {formatNaira(estimate.substructureTotal)}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                          <th className="py-2.5 px-3">Structural Component</th>
                          <th className="py-2.5 px-3">Est. Qty</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">Market Rate</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {estimate.substructure.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-3 px-3 font-medium text-neutral-950">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-neutral-400 font-light mt-0.5">{item.note}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold font-mono">{item.quantity.toLocaleString()}</td>
                            <td className="py-3 px-3 text-neutral-500">{item.unit}</td>
                            <td className="py-3 px-3 text-right font-mono text-neutral-600">{formatNaira(item.rate)}</td>
                            <td className="py-3 px-3 text-right font-bold font-mono text-neutral-900">{formatNaira(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. WALLING & ROOFING SECTION */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                    <h2 className="text-[16px] font-extrabold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#ae2424]"></span>
                      Section 2: Walling & Roofing Structures
                    </h2>
                    <span className="text-xs font-bold text-neutral-500 font-mono">
                      Subtotal: {formatNaira(estimate.wallingRoofingTotal)}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                          <th className="py-2.5 px-3">Structural Component</th>
                          <th className="py-2.5 px-3">Est. Qty</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">Market Rate</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {estimate.wallingRoofing.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-3 px-3 font-medium text-neutral-950">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-neutral-400 font-light mt-0.5">{item.note}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold font-mono">{item.quantity.toLocaleString()}</td>
                            <td className="py-3 px-3 text-neutral-500">{item.unit}</td>
                            <td className="py-3 px-3 text-right font-mono text-neutral-600">{formatNaira(item.rate)}</td>
                            <td className="py-3 px-3 text-right font-bold font-mono text-neutral-900">{formatNaira(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. INTERIOR FINISHES SECTION */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                    <h2 className="text-[16px] font-extrabold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#ae2424]"></span>
                      Section 3: Dry Finishes & Sanitary Installations
                    </h2>
                    <span className="text-xs font-bold text-neutral-500 font-mono">
                      Subtotal: {formatNaira(estimate.finishesTotal)}
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                          <th className="py-2.5 px-3">Structural Component</th>
                          <th className="py-2.5 px-3">Est. Qty</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3 text-right">Market Rate</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-neutral-700">
                        {estimate.finishes.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="py-3 px-3 font-medium text-neutral-950">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-neutral-400 font-light mt-0.5">{item.note}</div>
                            </td>
                            <td className="py-3 px-3 font-semibold font-mono">{item.quantity.toLocaleString()}</td>
                            <td className="py-3 px-3 text-neutral-500">{item.unit}</td>
                            <td className="py-3 px-3 text-right font-mono text-neutral-600">{formatNaira(item.rate)}</td>
                            <td className="py-3 px-3 text-right font-bold font-mono text-neutral-900">{formatNaira(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Back to top or New Estimate buttons at bottom of results */}
              <div className="pt-6 border-t border-neutral-100 flex items-center justify-center gap-3.5 select-none print:hidden">
                <button
                  onClick={handleResetToHomepage}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Return to Sourcing Homepage
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-5 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Back to Top
                </button>
              </div>

            </section>

            {/* RIGHT COLUMN: Dedicated Knowledge Panel widget with soft #ae2424 border (~35% width) */}
            <aside className="w-full lg:w-[35%] space-y-5 print:mt-8 print:w-full">
              
              {/* Shurefire Guarantee Procurement Box */}
              <div className="bg-white border-2 border-[#ae2424]/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                
                {/* Glowing subtle top banner */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#ae2424]" />
                
                {/* Header info */}
                <div className="flex justify-between items-start pt-1.5 pb-4 border-b border-neutral-100 select-none">
                  <div>
                    <span className="text-[10px] font-bold text-[#ae2424] uppercase tracking-wider block font-mono">Verified Sovereign Rates</span>
                    <h3 className="text-lg font-black text-neutral-950 mt-0.5">Shurefire Guarantee</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-[#ae2424]/5 text-[#ae2424] text-[9px] font-bold rounded-full font-mono uppercase border border-[#ae2424]/10 shrink-0">
                    Active Bundle
                  </span>
                </div>

                {/* Subtitle guaranteed information */}
                <p className="text-[12px] text-neutral-500 leading-relaxed py-3.5 select-none">
                  These prices are direct wholesale aggregates secured from first-tier partner mills and terminals in Lagos state. No retail markups, no agent broker commissions.
                </p>

                {/* Pricing summary lists */}
                <div className="space-y-2.5 py-4 border-t border-neutral-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">Substructure Sourcing:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatNaira(estimate.substructureTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">Walling & Roofing Sourcing:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatNaira(estimate.wallingRoofingTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">Finishes Sanitary Sourcing:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatNaira(estimate.finishesTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">Flatbed Heavy Haulage Delivery:</span>
                    <span className="font-mono font-semibold text-neutral-900">{formatNaira(estimate.deliveryLogistics)}</span>
                  </div>
                  
                  {/* Grand total large label */}
                  <div className="pt-4.5 border-t border-neutral-200 flex flex-col gap-1">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Estimated Bundle Cost:</span>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded font-mono">Locked in 2h</span>
                    </div>
                    <span className="text-3xl font-black text-neutral-950 tracking-tight font-sans mt-1">
                      {formatNaira(estimate.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Call-to-action Button: Procure entire material bundle */}
                <div className="space-y-2 pt-2.5 print:hidden">
                  <button
                    onClick={setShowProcureModal.bind(null, true)}
                    className="w-full bg-[#ae2424] hover:bg-[#8f1d1d] text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all duration-150 cursor-pointer text-center flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Procure Full Material Bundle</span>
                  </button>
                  
                  {/* Option to export output as clean PDF document */}
                  <button
                    onClick={triggerPrintPDF}
                    className="w-full bg-white hover:bg-neutral-50 text-neutral-700 font-bold py-2.5 rounded-xl text-xs border border-neutral-200 transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-3xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Export Pricing Ledger (PDF)</span>
                  </button>

                  {/* Material Unit Converter Button */}
                  <button
                    onClick={() => setShowConverterModal(true)}
                    className="w-full bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-bold py-2.5 rounded-xl text-xs border border-neutral-200/80 transition-all cursor-pointer text-center flex items-center justify-center gap-2 shadow-3xs"
                  >
                    <Calculator className="h-3.5 w-3.5 text-[#ae2424]" />
                    <span>Material Unit Converter</span>
                  </button>
                </div>

                {/* Bottom details of weights and certifications */}
                <div className="mt-5.5 pt-3.5 border-t border-neutral-100 space-y-2 select-none">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>100% Weight Certified via digital weighbridges</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Direct supply logistics coordinate tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Standard Organisation of Nigeria stamp guaranteed</span>
                  </div>
                </div>

              </div>

              {/* Sub-card: Sovereign Market Index update info */}
              <div className="bg-neutral-50 border border-neutral-200/55 rounded-2xl p-4.5 space-y-2 select-none print:hidden">
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-neutral-500" />
                  <h4 className="text-[12.5px] font-extrabold text-neutral-800 uppercase tracking-wider">Market Index Notes</h4>
                </div>
                <p className="text-[11.5px] text-neutral-500 leading-relaxed">
                  Terminal pricing rates are updated hourly. Supply is sourced from Dangote Ibese depot and Ojo Steel docks. Estimated delivery guarantees standard physical offloading to curb coordinates at your site layout.
                </p>
              </div>

            </aside>

          </main>

        </div>
      )}

      {/* ----------------- INTERACTIVE PROCUREMENT ORDER DISPATCH MODAL ----------------- */}
      {showProcureModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 max-w-md w-full shadow-2xl relative space-y-4">
            
            {/* Close button */}
            <button 
              onClick={() => {
                setShowProcureModal(false);
                setDispatchSuccess(false);
              }}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!dispatchSuccess ? (
              <div className="space-y-4 text-center">
                <div className="h-13 w-13 rounded-full bg-[#ae2424]/5 border border-[#ae2424]/10 text-[#ae2424] flex items-center justify-center mx-auto text-xl">
                  🚚
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-neutral-950">Lock Sourcing Rates</h3>
                  <p className="text-xs text-neutral-500">
                    You are about to lock in pricing and request wholesale fulfillment dispatch for <span className="font-bold text-neutral-800">"{query}"</span>.
                  </p>
                </div>

                {/* Estimate specifications summary */}
                <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-3 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Project:</span>
                    <span className="font-semibold text-neutral-800">{estimate?.projectTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Total Materials Value:</span>
                    <span className="font-mono font-bold text-neutral-950">{formatNaira(estimate?.grandTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Target Delivery Zone:</span>
                    <span className="font-semibold text-neutral-800">Lagos, Nigeria</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={triggerProcureBundle}
                    disabled={isDispatching}
                    className="w-full bg-[#ae2424] hover:bg-[#8f1d1d] text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isDispatching ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Discharging Request...
                      </>
                    ) : (
                      "Lock Pricing & Dispatch"
                    )}
                  </button>
                  <button
                    onClick={() => setShowProcureModal(false)}
                    className="w-full bg-white hover:bg-neutral-50 text-neutral-500 font-bold py-2.5 rounded-xl text-xs border border-transparent transition-all cursor-pointer"
                  >
                    Cancel Sourcing
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="h-13 w-13 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-neutral-950">Procurement Dispatched!</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    A Shurefire trade officer has locked in these materials at direct terminal sovereign rates. 
                  </p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center text-xs space-y-1">
                  <span className="text-neutral-400 block font-mono">Dispatch Notification Coordinates:</span>
                  <strong className="text-neutral-800 block mt-1">ramonbisola1@gmail.com</strong>
                  <span className="text-neutral-500 block text-[10px] mt-0.5">Callback Line: +234 902 308 9987</span>
                </div>

                <button
                  onClick={() => {
                    setShowProcureModal(false);
                    setDispatchSuccess(false);
                  }}
                  className="w-full bg-[#ae2424] hover:bg-[#8f1d1d] text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ----------------- MATERIAL CONVERTER MODAL ----------------- */}
      {showConverterModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 max-w-lg w-full shadow-2xl relative space-y-5">
            
            {/* Close button */}
            <button 
              onClick={() => setShowConverterModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#ae2424]/10 text-[#ae2424] flex items-center justify-center text-sm font-bold">
                  ⚖️
                </div>
                <h3 className="text-xl font-black text-neutral-950">Material Unit Converter</h3>
              </div>
              <p className="text-xs text-neutral-500">
                Dynamically switch weight and length units for steel and sand. Totals recalculate in real-time.
              </p>
            </div>

            {/* Converter selectors */}
            <div className="space-y-4">
              
              {/* Steel unit selector */}
              <div className="space-y-2 border border-neutral-100 p-3.5 rounded-2xl bg-neutral-50/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-sans">
                    Steel Rebars Unit Standard
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono font-bold">
                    Ref: 16mm = 18.96kg | 12mm = 10.67kg
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "Length", label: "Length (12m)" },
                    { value: "KG", label: "Kilograms (KG)" },
                    { value: "Tons", label: "Tons (t)" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSteelUnit(opt.value as any)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        steelUnit === opt.value
                          ? "bg-[#ae2424] border-[#ae2424] text-white shadow-xs"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sand unit selector */}
              <div className="space-y-2 border border-neutral-100 p-3.5 rounded-2xl bg-neutral-50/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider font-sans">
                    Sand Aggregates Unit Standard
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono font-bold">
                    Ref: 1 Tipper = 20 Tons = 400 Bags
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "Tipper", label: "20-Ton Tipper" },
                    { value: "Tons", label: "Metric Tons" },
                    { value: "Bags", label: "50kg Bags" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSandUnit(opt.value as any)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        sandUnit === opt.value
                          ? "bg-[#ae2424] border-[#ae2424] text-white shadow-xs"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Real-time calculated preview panel */}
            {estimate && (
              <div className="border border-neutral-200 bg-neutral-50 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                  <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Recalculation Preview
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 font-mono">
                    Lagos Sovereign Sourcing Ledger
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Steel items preview */}
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 font-medium">16mm High-Yield Steel Rebars:</span>
                    <span className="font-mono font-bold text-neutral-950">
                      {estimate.substructure.find(i => i.name.includes("16mm"))?.quantity.toLocaleString()}{" "}
                      <span className="text-neutral-500 font-sans font-normal text-[11px]">
                        {estimate.substructure.find(i => i.name.includes("16mm"))?.unit}
                      </span>
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 font-medium">12mm Ribbed Steel Rebars:</span>
                    <span className="font-mono font-bold text-neutral-950">
                      {estimate.substructure.find(i => i.name.includes("12mm"))?.quantity.toLocaleString()}{" "}
                      <span className="text-neutral-500 font-sans font-normal text-[11px]">
                        {estimate.substructure.find(i => i.name.includes("12mm"))?.unit}
                      </span>
                    </span>
                  </div>

                  {/* Sand items preview */}
                  <div className="flex justify-between items-center border-t border-neutral-200/50 pt-2">
                    <span className="text-neutral-600 font-medium">Sharp Clean Sand (Foundation):</span>
                    <span className="font-mono font-bold text-neutral-950">
                      {estimate.substructure.find(i => i.name.includes("Sharp Clean Sand"))?.quantity.toLocaleString()}{" "}
                      <span className="text-neutral-500 font-sans font-normal text-[11px]">
                        {estimate.substructure.find(i => i.name.includes("Sharp Clean Sand"))?.unit}
                      </span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600 font-medium">Plastering Sand (Walling):</span>
                    <span className="font-mono font-bold text-neutral-950">
                      {estimate.wallingRoofing.find(i => i.name.includes("Plastering Sand"))?.quantity.toLocaleString()}{" "}
                      <span className="text-neutral-500 font-sans font-normal text-[11px]">
                        {estimate.wallingRoofing.find(i => i.name.includes("Plastering Sand"))?.unit}
                      </span>
                    </span>
                  </div>

                  {/* Pricing feedback */}
                  <div className="flex justify-between items-end border-t border-neutral-200 pt-3">
                    <span className="text-xs font-bold text-[#ae2424] uppercase tracking-wider font-sans">
                      New Estimated Grand Total:
                    </span>
                    <span className="font-sans font-black text-lg text-neutral-950 leading-none">
                      {formatNaira(estimate.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Apply & Close button */}
            <div className="pt-2">
              <button
                onClick={() => setShowConverterModal(false)}
                className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Apply & Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
