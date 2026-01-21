
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiskLevel, RiskScore } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// SECURITY: Basic sanitization to prevent prompt injection and break-out attempts
const sanitize = (str: string): string => {
  if (!str) return '';
  // Remove backticks, braces, and XML-like tags to prevent confusing the parser
  return str.replace(/[`<>{}]/g, '').trim();
};

const fetchAlphaVantageData = async (symbol: string) => {
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.API_KEY}`);
    const data = await response.json();
    const quote = data['Global Quote'];
    if (quote && quote['05. price']) {
      return quote['05. price'];
    }
    return null;
  } catch (e) {
    console.error("Alpha Vantage fetch failed", e);
    return null;
  }
};

export const lookupVendorDetails = async (companyName: string) => {
  try {
    const prompt = `
      Search for the company "${sanitize(companyName)}".
      Return their official website URL, headquarter city & country, primary industry, and a 1-sentence description.
      
      Output strictly as a JSON object with keys: "website", "industry", "location", "description".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      }
    });

    let text = response.text || "";
    // Sanitize markdown code blocks if present
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(text);
  } catch (error) {
    console.error("Autofill failed:", error);
    return null;
  }
};

export const analyzeVendorRisk = async (
  name: string,
  industry: string,
  location: string,
  description: string
): Promise<RiskScore> => {
  try {
    // SECURITY: Use clear delimiters (XML-style) to separate data from instructions.
    // This makes it harder for malicious input to be interpreted as an instruction.
    const prompt = `
      Analyse the supply chain risk for the following vendor.
      
      <vendor_data>
      Name: ${sanitize(name)}
      Industry: ${sanitize(industry)}
      Location: ${sanitize(location)}
      Description: ${sanitize(description)}
      </vendor_data>

      SYSTEM INSTRUCTIONS:
      You MUST use Google Search to find real-time/current information for the following specific details about the vendor listed in <vendor_data>.
      Identify and return the stock ticker symbol if public.
      
      1. **Cyber Security**: Search for "CVE vulnerabilities ${sanitize(name)}", "data breaches ${sanitize(name)} last 12 months", and "${sanitize(name)} ransomware news". Estimate the CVE count based on search results.
      2. **Financial Health**: Search for "${sanitize(name)} stock price trend", "${sanitize(name)} credit rating", or "${sanitize(name)} financial earnings report ${new Date().getFullYear()}". Use real recent news to determine stock trend and bankruptcy risk.
      3. **Geopolitical**: Check the current political stability and active conflict status for ${sanitize(location)}.

      Output the result as a raw JSON object (no markdown formatting) matching this structure:
      {
        "overall": number (0-100),
        "level": "Low" | "Medium" | "High" | "Critical",
        "cyberScore": number (0-100),
        "financialScore": number (0-100),
        "geopoliticalScore": number (0-100),
        "summary": "A concise 2-sentence summary of the vendor's risk profile based on the search results",
        "keyFactors": [
            {
                "text": "Description of the risk factor (e.g. 'Recent data breach detected')",
                "sourceUrl": "The URL of the news source or website where you found this information"
            }
        ],
        "cyberDetails": { 
            "cveCount": number (Estimated count found in search, default 0 if clean), 
            "recentBreach": boolean (true if news found in last 12mo), 
            "sslGrade": "A"|"B"|"C"|"D"|"F" (Estimate based on cyber hygiene news, default 'A' if no bad news), 
            "darkWebMentions": boolean 
        },
        "financialDetails": { 
            "stockTrend": string (e.g. "Up 5% YoY", "Stable", "Private", "Declining"), 
            "creditRating": string (e.g. "AAA", "BBB", "N/A"), 
            "bankruptcyRisk": "Low"|"Medium"|"High",
            "tickerSymbol": "STRING or null"
        },
        "geopoliticalDetails": { 
            "conflictZone": boolean, 
            "tradeSanctions": boolean, 
            "politicalStability": "Stable"|"Unstable"|"Critical" 
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Lower temperature for more factual extraction
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    const data = JSON.parse(text);

    if (data.financialDetails?.tickerSymbol) {
      const livePrice = await fetchAlphaVantageData(data.financialDetails.tickerSymbol);
      if (livePrice) {
        data.financialDetails.currentPrice = livePrice;
      }
    }

    return {
      ...data,
      lastUpdated: new Date().toISOString(),
      level: data.level as RiskLevel
    };

  } catch (error) {
    console.error("AI Risk Analysis Failed:", error);
    return {
      overall: 50,
      level: RiskLevel.MEDIUM,
      cyberScore: 50,
      financialScore: 50,
      geopoliticalScore: 50,
      lastUpdated: new Date().toISOString(),
      summary: "AI analysis unavailable. Defaulting to medium risk.",
      keyFactors: [
          { text: "Manual review required", sourceUrl: "" },
          { text: "AI service unreachable", sourceUrl: "" }
      ],
      cyberDetails: { cveCount: 0, recentBreach: false, sslGrade: "N/A", darkWebMentions: false },
      financialDetails: { stockTrend: "N/A", creditRating: "N/A", bankruptcyRisk: "Unknown" },
      geopoliticalDetails: { conflictZone: false, tradeSanctions: false, politicalStability: "Unknown" }
    };
  }
};

export const predictDisruptions = async (vendors: {id: string, name: string, location: string}[]) => {
    try {
        const vendorContext = vendors.map(v => `${sanitize(v.name)} (${sanitize(v.location)})`).join(', ');
        const prompt = `
            Act as a supply chain risk intelligence system.
            Given these vendors: ${vendorContext}.
            Identify ONE RECENT, REAL-WORLD supply chain disruption, news story, environmental event, or geopolitical risk from the last 7 days that specifically impacts these locations or industries.
            
            IMPORTANT: Identify which of the provided vendors are impacted. Return their exact names in a comma-separated list after a label 'IMPACTED_VENDORS:'.
            Search efficiently. If a specific exact news story is not found within 15 seconds of searching, provide a realistic risk scenario based on known high-probability regional threats or current weather patterns for these areas instead of continuing to search.
            
            Provide your response in this EXACT format (do not include any other text):
            TITLE: [A concise headline for the event]
            SEVERITY: [info, warning, or critical]
            DESCRIPTION: [A summary of the event and its impact on these vendors]
            IMPACTED_VENDORS: [Comma-separated list of exact vendor names from the provided list]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.2,
            }
        });
        
        const text = response.text || "";
        const titleMatch = text.match(/TITLE:\s*(.*)/i);
        const severityMatch = text.match(/SEVERITY:\s*(info|warning|critical)/i);
        const descriptionMatch = text.match(/DESCRIPTION:\s*(.*?)IMPACTED_VENDORS:/is) || text.match(/DESCRIPTION:\s*(.*)/is);
        const impactedMatch = text.match(/IMPACTED_VENDORS:\s*(.*)/i);

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = chunks
            .filter(c => c.web)
            .map(c => ({ title: c.web.title, url: c.web.uri }))
            .slice(0, 5);

        const impactedVendorNames = impactedMatch ? impactedMatch[1].split(',').map(s => s.trim().toLowerCase()) : [];
        const relatedVendorIds = vendors
            .filter(v => impactedVendorNames.includes(v.name.toLowerCase()))
            .map(v => v.id);

        return {
            title: titleMatch ? titleMatch[1].trim() : "Recent Market Intelligence",
            severity: severityMatch ? severityMatch[1].trim().toLowerCase() : "info",
            description: descriptionMatch ? descriptionMatch[1].trim() : text,
            relatedVendorIds: relatedVendorIds,
            sources: sources
        };
    } catch (e) {
        console.error("Prediction failed:", e);
        return null;
    }
}
