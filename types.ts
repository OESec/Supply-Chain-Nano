export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface RiskScore {
  overall: number; // 0-100
  level: RiskLevel;
  cyberScore: number;
  financialScore: number;
  geopoliticalScore: number;
  lastUpdated: string;
  summary: string;
  keyFactors: string[];
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
}

export interface AppState {
  vendors: Vendor[];
  alerts: Alert[];
  isIntegratedMode: boolean; // Toggle between manual/standalone and integrated
}