import React, { useState } from "react";
import { ProjectQuantityCalculatorResult, QuantityEstimate } from "../types.js";
import { Calculator, Construction, ArrowRight, CornerDownRight, CheckCircle2, Coins } from "lucide-react";
import { LeadCaptureForm } from "./LeadCaptureForm.js";

export function QuantityCalculator() {
  const [projectName, setProjectName] = useState("");
  const [lengthMs, setLengthMs] = useState<number>(12);
  const [widthMs, setWidthMs] = useState<number>(10);
  const [numFloors, setNumFloors] = useState<number>(1);
  const [thicknessCm, setThicknessCm] = useState<number>(15);
  const [includeBlocks, setIncludeBlocks] = useState<boolean>(true);
  const [blockType, setBlockType] = useState<"9-inch" | "6-inch">("9-inch");
  const [wallLength, setWallLength] = useState<number>(45);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProjectQuantityCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateEstimates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          lengthMetres: Number(lengthMs),
          widthMetres: Number(widthMs),
          numFloors: Number(numFloors),
          slabThicknessCm: Number(thicknessCm),
          includeBlocks,
          blockType,
          wallLengthMetres: includeBlocks ? Number(wallLength) : 0,
        }),
      });
      if (!resp.ok) {
        throw new Error("Failed to calculate quantities");
      }
      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong during calculation.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatNaira = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace("NGN", "₦");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden" id="quantity_calculator_widget">
      <div className="bg-gradient-to-r from-[#ae2424] to-stone-900 p-6 text-white flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-xl">
          <Calculator className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-display font-semibold">Shorefire Quantity & Cost Estimator</h2>
          <p className="text-xs text-slate-300">Compute sandcrete, concrete slab elements & masonry weights based on average local prices</p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={calculateEstimates} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project Name */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Project/Site Label</label>
              <input
                type="text"
                placeholder="e.g. 3-Bedroom Flat Decking (Lekki Phase 1)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
              />
            </div>

            {/* Slab Dimensions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Slab Length (m)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={lengthMs}
                onChange={(e) => setLengthMs(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Slab Width (m)</label>
              <input
                type="number"
                min="1"
                max="500"
                value={widthMs}
                onChange={(e) => setWidthMs(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                required
              />
            </div>

            {/* Thickness and Floors */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Slab Thickness (cm)</label>
              <input
                type="number"
                min="5"
                max="40"
                value={thicknessCm}
                onChange={(e) => setThicknessCm(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Number of Floors</label>
              <select
                value={numFloors}
                onChange={(e) => setNumFloors(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm bg-white"
              >
                {[1, 2, 3, 4, 5].map(v => (
                  <option key={v} value={v}>{v} {v === 1 ? "Slab (Ground)" : `Slabs (${v} Stories)`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Block Masonry Sub-form */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeBlocks"
                  checked={includeBlocks}
                  onChange={(e) => setIncludeBlocks(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="includeBlocks" className="text-sm font-medium text-slate-800 cursor-pointer select-none">
                  Include Block Masonry Wall Estimation
                </label>
              </div>
            </div>

            {includeBlocks && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-fade-in pl-6 border-l-2 border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Total Wall Run (metres)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={wallLength}
                    onChange={(e) => setWallLength(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs"
                    required={includeBlocks}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Block Standard Size</label>
                  <select
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-xs bg-white"
                  >
                    <option value="9-inch">9-Inch Hollow Block (₦780)</option>
                    <option value="6-inch">6-Inch Hollow Block (₦650)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Trigger */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary hover:bg-brand-primary shadow-lg shadow-brand-primary/15 font-display font-medium text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Computing Live Estimate Volumes...</span>
              </>
            ) : (
              <>
                <Construction className="h-5 w-5" />
                <span>Calculate My Project Materials & Pricing</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm leading-relaxed">
            {error}
          </div>
        )}

        {/* Results Render */}
        {result && (
          <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-dashed border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Estimate Ready</span>
                <h3 className="text-lg font-display font-bold text-slate-800 mt-1">{result.projectName || "Slab Estimation Output"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{result.projectDescription}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Grand Total Material Capital</p>
                <p className="text-2xl font-mono font-bold text-slate-900">{formatNaira(result.grandTotalNaira)}</p>
              </div>
            </div>

            {/* List items */}
            <div className="space-y-4">
              {result.estimates?.map((est, i) => {
                const fraction = est.totalCostNaira / result.grandTotalNaira;
                return (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <h4 className="font-display font-semibold text-slate-800 text-sm">{est.materialName}</h4>
                      </div>
                      <p className="text-xs text-slate-500 pl-6">{est.explanation}</p>
                      
                      {/* Bar indicator */}
                      <div className="pl-6 pt-1">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-600 h-full rounded-full" 
                            style={{ width: `${Math.round(fraction * 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                          <span>Sub-Cost Allocation</span>
                          <span>{Math.round(fraction * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left md:text-right shrink-0 md:pl-4 space-y-1">
                      <p className="text-xs text-slate-400">
                        <span className="font-mono font-semibold text-slate-700">{est.calculatedQuantity}</span> {est.unit}
                      </p>
                      <p className="text-xs text-slate-400">
                        @ {formatNaira(est.averagePriceNaira)}
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-800">
                        {formatNaira(est.totalCostNaira)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Reassuring Notes */}
            {result.reassuringNotes && (
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100/50 flex gap-3 text-xs leading-relaxed text-amber-900">
                <Coins className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800 mb-0.5">Shorefire Site Optimizations</p>
                  <p className="text-slate-600 font-medium">{result.reassuringNotes}</p>
                </div>
              </div>
            )}

            {/* Price-Match lead capture form */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="text-center max-w-md mx-auto">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">💸 Get Cheap Wholesale Rates</h4>
                <p className="text-xs text-slate-500 mt-1">Submit your calculated estimate list directly to the Shorefire dealer network to lock in off-market supplier quotes.</p>
              </div>
              <LeadCaptureForm 
                initialMaterials={`Calculated Sourcing List for "${result.projectName || "Slab Construction"}" (${lengthMs}m x ${widthMs}m, ${numFloors} stories):\n` +
                  result.estimates?.map(est => `- ${est.calculatedQuantity} x ${est.materialName} (${est.unit})`).join("\n") +
                  `\n\nTotal Budgeted Capital: ${formatNaira(result.grandTotalNaira)}`
                }
                initialCategory={result.estimates?.[0]?.category || ""}
                initialRegion=""
                sourceContext={`Cost Calculator: ${result.projectName || "Standard Decking"}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
