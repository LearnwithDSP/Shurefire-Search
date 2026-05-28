import React, { useState } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { 
  CheckCircle2, 
  Send, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  TrendingDown, 
  ChevronRight, 
  ShieldCheck, 
  NotebookPen,
  Clock,
  ExternalLink
} from "lucide-react";

interface LeadCaptureFormProps {
  initialMaterials?: string;
  initialCategory?: string;
  initialRegion?: string;
  sourceContext?: string;
}

export function LeadCaptureForm({ 
  initialMaterials = "", 
  initialCategory = "", 
  initialRegion = "", 
  sourceContext = "Core Search Section" 
}: LeadCaptureFormProps) {
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState(initialRegion || "Lagos");
  const [category, setCategory] = useState(initialCategory || "Cement & Binders");
  const [materialsNeeded, setMaterialsNeeded] = useState(initialMaterials || "");
  const [projectStage, setProjectStage] = useState("planning");
  const [timeline, setTimeline] = useState("immediate");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg("Please provide your Name and WhatsApp phone number.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Validate a safe alphanumeric alphanumeric ID that strictly matches firestore constraints
    const cleanTime = Date.now();
    const cleanRand = Math.random().toString(36).substring(2, 9);
    const leadId = `ld_${cleanTime}_${cleanRand}`;

    // Strictly match the 12 fields and validators defined in firestore.rules
    const payload = {
      id: leadId,
      name: name.trim().substring(0, 150),
      phone: phone.trim().substring(0, 50),
      email: email.trim() ? email.trim().substring(0, 150) : "no-email@shurefire.com",
      category: category || "General Sourcing",
      region: region || "Lagos",
      materialsNeeded: (materialsNeeded.trim() || `Sourcing query: ${category}`).substring(0, 3000),
      projectStage: projectStage || "planning",
      timeline: timeline || "immediate",
      source: sourceContext.substring(0, 400),
      status: "new",
      createdAt: new Date().toISOString()
    };

    try {
      // Direct, safe write to secure firestore path /leads/{leadId}
      await setDoc(doc(db, "leads", leadId), payload);
      setIsSuccess(true);
      
      // Auto-populate custom logging
      console.log(`[Shurefire Network Sourcing Engine] Successfully logged Lead: ${leadId}`);
    } catch (err) {
      console.error("[Shurefire Network Sourcing Engine] Failed to dispatch sourcing document: ", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `leads/${leadId}`);
      } catch (formattedErr: any) {
        setErrorMsg("Sourcing server timed out. Please retry or click direct partner link below.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-xl shadow-rose-50/50 overflow-hidden" id="verified_sourcing_widget">
      
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-slate-900 via-stone-900 to-brand-primary p-5 text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-red-350 uppercase tracking-widest block font-mono">Nigeria Wholesalers Initiative</span>
            <h3 className="text-base font-display font-semibold">Direct Factory-Price Match Network</h3>
          </div>
        </div>
        
        <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-primary border border-red-700 text-red-100 px-2 py-1 rounded">
          🔥 Save up to 22%
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Subtle Branding explaining partnership */}
        <p className="text-xs text-slate-500 leading-relaxed font-normal">
          This system is integrated with the sovereign <strong>Shorefire Wholesale Directory</strong> representing certified block makers, steel yards, and importers in Nigeria. By submitting your specification list below, you bypass standard high retail retail margins and get matched with merchants for direct delivery.
        </p>

        {isSuccess ? (
          <div className="space-y-5 py-4 text-center animate-fade-in">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-display font-bold text-slate-900">RFQ Logged in Supplier Network!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your materials requirement has been loaded directly into the Shorefire Wholesaler network. A registered merchant matching your selection in <strong>{region}</strong> will contact you via <strong>WhatsApp ({phone})</strong> to deliver off-market wholesale cash pricing.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-xs text-left max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Verify Wholesaler Directory Direct:</span>
              </div>
              <p className="leading-normal">
                Don't want to wait? You can immediately search validated merchant rosters, dial wholesale desks, or get instant assistance on the Shorefire central terminal.
              </p>
              
              <a 
                href="http://shurefire.com.ng" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-accent mt-1 hover:underline group"
              >
                <span>Visit Shorefire Sourcing Gateway</span>
                <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <button
              onClick={() => setIsSuccess(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 underline cursor-pointer"
            >
              Submit Another Quote Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Your Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 py-1 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolawole Alabi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary text-xs font-medium"
                  />
                </div>
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Active WhatsApp (Callback)</label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 py-1 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +234 803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary text-xs font-medium"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Email Address (Optional)</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 py-1 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. kolawole@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary text-xs font-medium"
                  />
                </div>
              </div>

              {/* Region Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Location State</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary bg-white cursor-pointer"
                >
                  <option value="Lagos">Lagos State Hub</option>
                  <option value="Abuja">Abuja (Dei-Dei Hub)</option>
                  <option value="Port Harcourt">Port Harcourt Hub</option>
                  <option value="Kano">Kano (Sabon Gari Hub)</option>
                  <option value="Kaduna">Kaduna Region</option>
                  <option value="Enugu">Enugu Mall Sourcing</option>
                  <option value="Ibadan">Ibadan Logistics Hub</option>
                </select>
              </div>

              {/* Material focus Group */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Major Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary bg-white cursor-pointer"
                >
                  <option value="Cement & Binders">Cement & Ground Binders</option>
                  <option value="Steel & Rebars">Reinforced Steel & Rebars</option>
                  <option value="Blocks & Aggregates">Sand, Granite & Hollow Blocks</option>
                  <option value="Roofing & Ceiling">Aluminium Roofing Sheet & Wood</option>
                  <option value="Tiles & Finishing">Tiling Finishing & Plaster</option>
                  <option value="Electrical & Wiring">Electrical Cables & Piping</option>
                  <option value="Plumbing & Sanitary">Plumbing Conduit & Water Systems</option>
                </select>
              </div>

              {/* Project Lifecycle State */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Project Stage</label>
                <select
                  value={projectStage}
                  onChange={(e) => setProjectStage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary bg-white cursor-pointer"
                >
                  <option value="planning">Initial Sourcing Analysis / Quantity Surveyor Planning</option>
                  <option value="foundation">Active Foundation stage (Ongoing)</option>
                  <option value="decking">Active Concrete Decking Columns (Ongoing)</option>
                  <option value="finishing">Finishing and Interior Plasterwork</option>
                </select>
              </div>

              {/* Buying Urgency */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Procurement Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary bg-white cursor-pointer"
                >
                  <option value="immediate">Immediate Buying (Within 7 days)</option>
                  <option value="twoweeks">Buying within 2 weeks</option>
                  <option value="month">Buying within 1 month</option>
                  <option value="research">Just researching standard material pricing stats</option>
                </select>
              </div>

              {/* List of materials currently needed */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">Describe items & aggregate quantity needed (or paste specification lists)</label>
                <div className="relative flex items-start">
                  <NotebookPen className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    rows={3}
                    placeholder="e.g. I need 450 bags of Dangote Cement, 12 tons of 16mm rebar delivered directly to my block in Lekki Scheme 2..."
                    value={materialsNeeded}
                    onChange={(e) => setMaterialsNeeded(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary text-xs font-medium leading-relaxed"
                  />
                </div>
              </div>

            </div>

            {errorMsg && (
              <p className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs leading-normal font-medium flex items-center gap-1.5">
                <span>⚠️</span> {errorMsg}
              </p>
            )}

            {/* Submit RFQ Trigger */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-primary hover:bg-[#6c001a] py-3 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Configuring Wholesale Match...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Request Cheap Wholesale Quotes</span>
                </>
              )}
            </button>

            {/* Direct outbound link drive to Shurefire */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
                <span>Zero spam, direct merchant lookup</span>
              </span>
              <a 
                href="http://shurefire.com.ng" 
                target="_blank" 
                rel="noreferrer"
                className="text-brand-primary hover:underline font-bold flex items-center gap-1 group"
              >
                <span>Or dial wholesalers on Shurefire.com.ng</span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
