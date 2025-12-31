import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RiskLevel, RiskScore } from "../types";

// Initialize Gemini Client
// NOTE: In a production environment, this should be proxied through a backend to protect the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeVendorRisk = async (
  name: string,
  industry: string,
  location: string,
  description: string
): Promise<RiskScore> => {
  try {
    const prompt = `
      Analyse the supply chain risk for the following vendor:
      Name: ${name}
      Industry: ${industry}
      Location: ${location}
      Description: ${description}

      Consider:
      1. Geopolitical stability of the location.
      2. Search for a timeline of major cyberattacks, ransomware incidents, and CVE vulnerabilities associated with ${name} over the last 10 years.
      3. General financial volatility for this sector.
      
      Provide a realistic risk assessment based on search results and general public knowledge about this sector and region.

      Output the result as a raw JSON object (no markdown formatting) matching this structure:
      {
        "overall": number (0-100),
        "level": "Low" | "Medium" | "High" | "Critical",
        "cyberScore": number (0-100),
        "financialScore": number (0-100),
        "geopoliticalScore": number (0-100),
        "summary": "A concise 2-sentence summary of the vendor's risk profile",
        "keyFactors": ["List of 3-5 key risk factors identified"]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema are not supported with tools
        temperature: 0.3, 
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean up markdown code blocks if present
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const data = JSON.parse(text);

    return {
      ...data,
      lastUpdated: new Date().toISOString(),
      // Ensure enum matching
      level: data.level as RiskLevel
    };

  } catch (error) {
    console.error("AI Risk Analysis Failed:", error);
    // Fallback if AI fails or key is missing
    return {
      overall: 50,
      level: RiskLevel.MEDIUM,
      cyberScore: 50,
      financialScore: 50,
      geopoliticalScore: 50,
      lastUpdated: new Date().toISOString(),
      summary: "AI analysis unavailable. Defaulting to medium risk.",
      keyFactors: ["Manual review required", "AI service unreachable"]
    };
  }
};

export const predictDisruptions = async (vendors: {name: string, location: string}[]) => {
    // This function would typically stream disruption alerts based on news
    // For this demo, we'll generate a single hypothetical alert based on the vendor mix
    try {
        const vendorContext = vendors.map(v => `${v.name} (${v.location})`).join(', ');
        const prompt = `
            Given these vendors in a supply chain: ${vendorContext}.
            Identify ONE potential hypothetical supply chain disruption (weather, political, or logistic) 
            that could affect one or more of them. 
            Return JSON with title, severity (info, warning, critical), and description.
        `;

        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ["info", "warning", "critical"] },
                description: { type: Type.STRING },
                affectedVendorNames: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error(e);
        return null;
    }
}