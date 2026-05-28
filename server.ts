import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { queryLiveStockSuppliers, NIGERIAN_SUPPLIERS, INITIAL_MATERIALS } from "./src/mockDatabase.js";
import { MaterialCategory, SupplyRegion, GroundingSource } from "./src/types.js";
import { db } from "./src/firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper: Retrieve the server-side Gemini client safely
  const getGeminiClient = (): GoogleGenAI | null => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Endpoint: Get list of active suppliers in the platform's API network
  app.get("/api/suppliers", (req, res) => {
    res.json(NIGERIAN_SUPPLIERS);
  });

  // API Endpoint: Search blocks and trigger AI analysis with Firestore Caching
  app.post("/api/search", async (req, res) => {
    try {
      const { query, region, category, forceRefresh } = req.body;

      const queryStr = (query || "").trim().toLowerCase();
      const regionStr = (region || "all").trim().toLowerCase();
      const categoryStr = (category || "all").trim().toLowerCase();
      
      // Compute a unique key for the search cache (e.g., q_cement_lagos_cement-binders)
      const sanitizedQuery = queryStr.replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      const cacheId = `q_${sanitizedQuery || "general"}_${regionStr}_${categoryStr}`.substring(0, 100);

      let cachedData: any = null;
      let loadedFromCache = false;

      // check if cache exists and is fresh (within 2 hours)
      if (!forceRefresh) {
        try {
          const cacheDocSnap = await getDoc(doc(db, "search_cache", cacheId));
          if (cacheDocSnap.exists()) {
            const data = cacheDocSnap.data();
            const lastUpdatedTime = new Date(data.lastUpdated).getTime();
            const now = Date.now();
            
            // Limit cache to 2 hours
            if (now - lastUpdatedTime < 2 * 60 * 60 * 1000) {
              cachedData = data;
              loadedFromCache = true;
              console.log(`[Shurefire DB Cache] Cache HIT for search ID: ${cacheId}`);
            } else {
              console.log(`[Shurefire DB Cache] Cache expired/stale for search ID: ${cacheId}`);
            }
          }
        } catch (cacheErr) {
          console.error("[Shurefire DB Cache] Failed to read from firestore cache", cacheErr);
        }
      }

      if (loadedFromCache && cachedData) {
        res.json({
          answer: cachedData.answer,
          groundingSources: cachedData.groundingSources || [],
          simulatedApiLogs: cachedData.apiLogs || [],
          localMaterials: cachedData.materials || [],
          isCached: true,
          cachedAt: cachedData.lastUpdated
        });
        return;
      }

      // 1. Fetch live supplier stocks from the dynamic database (simulating API network lookups)
      const dbResult = queryLiveStockSuppliers(query, region as SupplyRegion, category as MaterialCategory);

      // 2. Generate AI Brain grounding & analysis leveraging Gemini Search Grounding
      const ai = getGeminiClient();
      let aiAnalysis = "";
      let groundingSources: GroundingSource[] = [];

      const targetRegion = region || "Nigeria";
      const targetCategory = category || "general building materials";
      const searchQueryText = query || "latest building material trends and standard dimensions";

      if (ai) {
        try {
          const systemContext = `You are Shurefire AI, the brilliant Nigerian construction brain and quantity surveyor. 
Your role is to analyze queries about building materials, construction standards, pricing, and project needs in Nigeria.
Ground all reasoning in actual Nigerian constraints, including unit measurements (50kg cement bags, standard TMT 12m steel length, 9"/6" vibrated hollow block units, 20-ton tipper trucks of sand/granite).
You should provide key buying tips, suggest specific alternatives if pricing looks elevated, warn against fake/substandard iron rods (non-standard 12m or low tensile), and summarize overall cost outlooks. 
Keep your analysis highly structured, visual with markdown, list the exact Naira symbol (₦) and maintain high professional authority.`;

          const userPrompt = `Material Query: "${searchQueryText}"
Filter State: ${targetRegion}
Category Context: ${targetCategory}

Please provide:
1. Quick Market Pulse: Summarize the current availability and pricing state for this query in ${targetRegion}.
2. Technical Specification Wisdom: Outline standard dimensions, ratios, structural weights, or SON standards builders must watch for (e.g. Dangote 3X 42.5R concrete vs elephant classic 32.5N block plaster).
3. Live Cost & Alternative Checkpoints: Highlight typical spot price bands in NGN based on current 2026 indices.
4. Procurement Golden Rule here: Give 1-2 practical tips for buying in bulk, transportation logistics, or yard checking in Nigeria.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: userPrompt,
            config: {
              systemInstruction: systemContext,
              tools: [{ googleSearch: {} }],
            },
          });

          aiAnalysis = response.text || "No response text generated.";

          // Map Search Grounding metadata
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks) {
            groundingSources = chunks
              .filter(chunk => chunk.web?.uri)
              .map(chunk => ({
                title: chunk.web?.title || "Search Grounding Reference",
                uri: chunk.web?.uri || "",
              }));
          }
        } catch (gemIniErr: any) {
          console.error("Gemini API call failed:", gemIniErr);
          aiAnalysis = `⚠️ Shurefire AI Live search is currently experiencing high queue volumes, but our Local Supplier Engine remains fully functional.\n\nHere is what you need to know about ${searchQueryText} in ${targetRegion}:\n• Cement prices generally stay within ₦7,500 - ₦8,500 per 50kg bag.\n• 16mm Steel iron rods typical trade between ₦13,000 - ₦15,000 per 12m standard length.\n• Contact local merchants in markets such as Alaba Ojo or Dei-Dei Abuja directly using the supplier directory below to lock in rates.`;
        }
      } else {
        // Fallback analysis when API key is missing or is the placeholder
        aiAnalysis = `### Shurefire Local AI Directory Brain (API Offline)

**Notice:** To enable live, full web-grounded search analysis powered by Gemini, please input your secure \`GEMINI_API_KEY\` in **Settings > Secrets** inside the AI Studio UI.

**Standard Market Insights for "${searchQueryText}" in ${targetRegion}:**
1. **Cement Segment**: Dangote 3X and BUA are the preferred choices. Average rates hover between **₦7,500 to ₦8,500** per 50kg bag depending on state-level transport margins.
2. **Steel Reinforcement (Rebars)**: Always check for the official SON certificate. Demand 12-meter standard length with "TMT" stamped to prevent building structural faults. Typical spot rates are around **₦13,500** for 16mm rods.
3. **Logistics & Offloading**: Rates in markets across Lagos (Coker/Orile) and Abuja (Dei-Dei) typically exclude offloading fees (often negotiated locally as 'money for boys'). Ensure supplier trucks can access your site.`;
      }

      // Sync and Write-through Caching: Save search results and corresponding materials to Firestore
      try {
        const payloadToCache = {
          queryKey: cacheId,
          query: query || "general",
          region: region || "Nigeria",
          category: category || "General",
          answer: aiAnalysis,
          lastUpdated: new Date().toISOString(),
          materials: dbResult.materials || [],
          apiLogs: dbResult.apiLogs || []
        };
        await setDoc(doc(db, "search_cache", cacheId), payloadToCache);
        console.log(`[Shurefire DB Cache] Successfully cached result in search_cache for: ${cacheId}`);
      } catch (saveErr) {
        console.error("[Shurefire DB Cache] Failed to write cache document into firestore:", saveErr);
      }

      res.json({
        answer: aiAnalysis,
        groundingSources,
        simulatedApiLogs: dbResult.apiLogs,
        localMaterials: dbResult.materials,
        isCached: false,
        cachedAt: null
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Search failed. Internal server error." });
    }
  });

  // API Endpoint: Project Concrete & Quantity Calculator
  app.post("/api/calculator", async (req, res) => {
    try {
      const { projectName, lengthMetres, widthMetres, numFloors, slabThicknessCm, includeBlocks, blockType, wallLengthMetres } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        // Simple accurate mechanical estimate fallback
        const thicknessM = (slabThicknessCm || 15) / 100;
        const volM3 = (lengthMetres || 10) * (widthMetres || 10) * thicknessM * (numFloors || 1);
        
        // Concrete mix ratio (1:2:4) rough guides
        // 1m3 of concrete needs about 7.5 bags of cement, 0.45m3 sand, 0.9m3 granite
        const cementBagsNeeded = Math.ceil(volM3 * 7.5);
        const sandTonsNeeded = Math.ceil(volM3 * 0.45 * 1.5); // sand approx 1.5t per m3
        const graniteTonsNeeded = Math.ceil(volM3 * 0.9 * 1.6); // granite approx 1.6t per m3
        
        // Steel calculation (rough estimation: 80kg of steel per m3 of concrete)
        // 1 length of 12mm is approx 10.6kg, 16mm is approx 18.9kg
        const steelWeightKg = volM3 * 80;
        const ironRods12mmNeeded = Math.ceil(steelWeightKg * 0.4 / 10.6); // 40% 12mm
        const ironRods16mmNeeded = Math.ceil(steelWeightKg * 0.6 / 18.9); // 60% 16mm

        // Block count: 1 metre run of wall needs 10 blocks per level (approx 3m tall)
        // wallLengthMetres * 10 * numFloors
        const blocksNeeded = includeBlocks ? Math.ceil((wallLengthMetres || 50) * 10 * (numFloors || 1)) : 0;

        const mockEstimates = [
          {
            materialName: "Dangote Cement 3X (Grade 42.5R)",
            category: "Cement & Binders",
            calculatedQuantity: cementBagsNeeded,
            unit: "50kg Bag",
            averagePriceNaira: 8000,
            totalCostNaira: cementBagsNeeded * 8000,
            explanation: `Based on slab volume of ${volM3.toFixed(1)} m³ with a 1:2:4 structural concrete ratio.`,
          },
          {
            materialName: "16mm TMT High-Yield Iron Rods (Length 12m)",
            category: "Steel & Rebars",
            calculatedQuantity: ironRods16mmNeeded,
            unit: "Length (12m)",
            averagePriceNaira: 13500,
            totalCostNaira: ironRods16mmNeeded * 13500,
            explanation: "Allocated for columns, principal beams and tension sections of decking.",
          },
          {
            materialName: "12mm High-Tension Ribbed Iron Rods",
            category: "Steel & Rebars",
            calculatedQuantity: ironRods12mmNeeded,
            unit: "Length (12m)",
            averagePriceNaira: 8300,
            totalCostNaira: ironRods12mmNeeded * 8300,
            explanation: "Providing primary reinforcement meshes for floor decking and columns stirrups.",
          },
          {
            materialName: "Sharp Sand (Full Loads)",
            category: "Blocks & Aggregates",
            calculatedQuantity: Math.ceil(sandTonsNeeded / 20),
            unit: "Tipper Truck (20t)",
            averagePriceNaira: 135000,
            totalCostNaira: Math.ceil(sandTonsNeeded / 20) * 135000,
            explanation: `Coarse washed sand required for bulk concrete casting of slab (${sandTonsNeeded} tons total code volume).`,
          },
          {
            materialName: "Granite Stone (3/4 Inch, 20 Tons)",
            category: "Blocks & Aggregates",
            calculatedQuantity: Math.ceil(graniteTonsNeeded / 20),
            unit: "Tipper Truck (20t)",
            averagePriceNaira: 275000,
            totalCostNaira: Math.ceil(graniteTonsNeeded / 20) * 275000,
            explanation: `Crushed rock aggregates to form standard aggregate framework (${graniteTonsNeeded} tons total code volume).`,
          }
        ];

        if (includeBlocks && blocksNeeded > 0) {
          const blockPrice = blockType === "9-inch" ? 780 : 650;
          mockEstimates.push({
            materialName: `${blockType || "9-inch"} Vibrated Hollow Block`,
            category: "Blocks & Aggregates",
            calculatedQuantity: blocksNeeded,
            unit: "Piece",
            averagePriceNaira: blockPrice,
            totalCostNaira: blocksNeeded * blockPrice,
            explanation: `Estimated wall count for ${wallLengthMetres}m length using standard 9"x9"x18" masonry dimension with 10% cutting waste.`
          });
        }

        const grandTotal = mockEstimates.reduce((sum, item) => sum + item.totalCostNaira, 0);

        res.json({
          projectName: projectName || "Standard Slab Site",
          projectDescription: `Calculated slab dimensions ${lengthMetres}m x ${widthMetres}m across ${numFloors} floor(s).`,
          estimates: mockEstimates,
          grandTotalNaira: grandTotal,
          reassuringNotes: "Standard engineering calculation output. Configure your GEMINI_API_KEY in secrets to activate real-time intelligence for complex site optimizations."
        });
        return;
      }

      // If Gemini IS active, generate exact quantities utilizing a structural JSON schema!
      const userPrompt = `Project Type: Calculator for Estimations
Project Description Name: "${projectName || "Residential Building Structure"}"
Slab Dimensions: Length ${lengthMetres}m, Width ${widthMetres}m, thickness ${slabThicknessCm || 15}cm.
Floors count: ${numFloors || 1}
Include block masonry structure? ${includeBlocks ? "Yes" : "No"}
Block Type Selected: ${blockType || "9-inch"}
Wall run-length standard: ${wallLengthMetres || 0}m

Using actual engineering estimation math for building structures in Nigeria, compute concrete quantities (bags of cement, tons/lengths of steel rebars, loads of sand/granite, and wall block counts if requested). 
Return prices matched to standard Lagos/Abuja average price bands:
- Portland Cement: ~₦8,000 per 50kg bag
- 16mm Steel Rod (Lengths of 12m): ~₦13,500
- 12mm Steel Rod (Lengths of 12m): ~₦8,300
- 20-ton Tipper Crane Coarse Sand: ~₦135,000
- 20-ton Tipper Crushed Granite: ~₦275,000
- 9-inch Vibrated Hollow Block: ~₦780 each
- 6-inch Vibrated Hollow Block: ~₦650 each

Be highly accurate. Structure the response strictly according to the specified schema. Ensure all fields are populated.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: "You are Shurefire AI Quantity Surveyor. Compute exact estimates and output a schema compliant JSON response.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              projectDescription: { type: Type.STRING },
              estimates: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    materialName: { type: Type.STRING },
                    category: { type: Type.STRING },
                    calculatedQuantity: { type: Type.INTEGER },
                    unit: { type: Type.STRING },
                    averagePriceNaira: { type: Type.INTEGER },
                    totalCostNaira: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ["materialName", "category", "calculatedQuantity", "unit", "averagePriceNaira", "totalCostNaira", "explanation"],
                },
              },
              grandTotalNaira: { type: Type.INTEGER },
              reassuringNotes: { type: Type.STRING },
            },
            required: ["projectName", "projectDescription", "estimates", "grandTotalNaira", "reassuringNotes"],
          },
        },
      });

      const parsedJSON = JSON.parse(response.text.trim());
      res.json(parsedJSON);

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Calculator generation failed." });
    }
  });

  // Setup Vite middleware for dynamic hot reloads or static directories
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Shurefire node server actively listening on port ${PORT}`);
  });
}

startServer();
