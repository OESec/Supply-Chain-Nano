
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface CyberDetails {
  cveCount: number;
  recentBreach: boolean;
  sslGrade: string; // "A" | "B" | "C" | "D" | "F"
  darkWebMentions: boolean;
}

export interface FinancialDetails {
  stockTrend: string; // e.g., "Down 15% YoY" or "Private"
  creditRating: string; // e.g., "AAA"
  bankruptcyRisk: string; // "Low" | "Medium" | "High"
}

export interface GeopoliticalDetails {
  conflictZone: boolean;
  tradeSanctions: boolean;
  politicalStability: string; // "Stable" | "Unstable" | "Critical"
}

export interface RiskFactor {
  text: string;
  sourceUrl?: string;
}

export interface RiskScore {
  overall: number; // 0-100
  level: RiskLevel;
  cyberScore: number;
  financialScore: number;
  geopoliticalScore: number;
  lastUpdated: string;
  summary: string;
  keyFactors: RiskFactor[];
  cyberDetails?: CyberDetails;
  financialDetails?: FinancialDetails;
  geopoliticalDetails?: GeopoliticalDetails;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RiskHistoryPoint {
  date: string;
  score: number;
}

export interface Vendor {
  id: string;
  name: string;
  industry: string;
  location: string; // Country or City, Country
  description: string;
  website?: string;
  contactEmail?: string;
  riskProfile: RiskScore;
  integrationStatus: 'Manual' | 'Connected' | 'Error';
  tier: 1 | 2 | 3; // Supply chain tier
  notes: Note[];
  riskHistory: RiskHistoryPoint[];
}

export interface Alert {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  date: string;
  relatedVendorIds: string[];
  description: string;
  isRead: boolean;
  sources?: { title: string; url: string }[];
}

export interface AppState {
  vendors: Vendor[];
  alerts: Alert[];
  isIntegratedMode: boolean; // Toggle between manual/standalone and integrated
}