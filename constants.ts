import { Vendor, RiskLevel, Alert } from "./types";

export const MOCK_VENDORS: Vendor[] = [
  {
    id: "1",
    name: "Acme Chipworks",
    industry: "Semiconductors",
    location: "Taipei, Taiwan",
    website: "https://example.com/acme",
    description: "Primary supplier of logic controllers for our smart devices.",
    riskProfile: {
      overall: 65,
      level: RiskLevel.MEDIUM,
      cyberScore: 70,
      financialScore: 80,
      geopoliticalScore: 45,
      lastUpdated: "2023-10-25T10:00:00Z",
      summary: "High operational efficiency but significant geopolitical exposure due to regional tensions.",
      keyFactors: ["Regional geopolitical tension", "High dependency tier", "Robust cyber defences"]
    },
    integrationStatus: "Connected",
    tier: 1,
    notes: [
      { id: "n1", content: "Discussed buffer stock strategy with account manager.", createdAt: "2023-09-15T10:00:00Z" }
    ],
    riskHistory: [
      { date: "2023-06-01", score: 55 },
      { date: "2023-07-01", score: 58 },
      { date: "2023-08-01", score: 60 },
      { date: "2023-09-01", score: 62 },
      { date: "2023-10-01", score: 65 }
    ]
  },
  {
    id: "2",
    name: "GreenLeaf Logistics",
    industry: "Logistics & Shipping",
    location: "Hamburg, Germany",
    website: "https://example.com/greenleaf",
    description: "Regional distribution partner for European markets.",
    riskProfile: {
      overall: 20,
      level: RiskLevel.LOW,
      cyberScore: 90,
      financialScore: 85,
      geopoliticalScore: 95,
      lastUpdated: "2023-10-24T14:30:00Z",
      summary: "Stable partner with strong EU compliance adherence and financial health.",
      keyFactors: ["Strong regulatory compliance", "Stable region", "Diversified fleet"]
    },
    integrationStatus: "Connected",
    tier: 1,
    notes: [],
    riskHistory: [
      { date: "2023-06-01", score: 25 },
      { date: "2023-07-01", score: 22 },
      { date: "2023-08-01", score: 20 },
      { date: "2023-09-01", score: 21 },
      { date: "2023-10-01", score: 20 }
    ]
  },
  {
    id: "3",
    name: "RareEarth Mining Co.",
    industry: "Raw Materials",
    location: "Kinshasa, DRC",
    website: "https://example.com/rareearth",
    description: "Supplier of raw cobalt and lithium.",
    riskProfile: {
      overall: 88,
      level: RiskLevel.HIGH,
      cyberScore: 40,
      financialScore: 60,
      geopoliticalScore: 20,
      lastUpdated: "2023-10-20T09:15:00Z",
      summary: "Critical risk due to political instability and potential labour compliance issues.",
      keyFactors: ["Political instability", "Supply chain opacity", "Infrastructure challenges"]
    },
    integrationStatus: "Manual",
    tier: 2,
    notes: [
      { id: "n2", content: "Monitoring election news closely.", createdAt: "2023-10-01T09:00:00Z" },
      { id: "n3", content: "Need to find alternative lithium source by Q2 2024.", createdAt: "2023-10-15T14:00:00Z" }
    ],
    riskHistory: [
      { date: "2023-06-01", score: 75 },
      { date: "2023-07-01", score: 78 },
      { date: "2023-08-01", score: 82 },
      { date: "2023-09-01", score: 85 },
      { date: "2023-10-01", score: 88 }
    ]
  },
  {
    id: "4",
    name: "SoftServe Cloud",
    industry: "Software Services",
    location: "Austin, USA",
    website: "https://example.com/softserve",
    description: "Hosting provider for inventory management system.",
    riskProfile: {
      overall: 15,
      level: RiskLevel.LOW,
      cyberScore: 95,
      financialScore: 90,
      geopoliticalScore: 98,
      lastUpdated: "2023-10-26T11:00:00Z",
      summary: "Very low risk profile with industry-leading security certifications.",
      keyFactors: ["SOC2 Compliant", "US Jurisdiction", "High availability"]
    },
    integrationStatus: "Connected",
    tier: 3,
    notes: [],
    riskHistory: [
      { date: "2023-06-01", score: 18 },
      { date: "2023-07-01", score: 16 },
      { date: "2023-08-01", score: 15 },
      { date: "2023-09-01", score: 15 },
      { date: "2023-10-01", score: 15 }
    ]
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "a1",
    title: "Typhoon Warning: East Asia",
    severity: "warning",
    date: "2023-10-27T08:00:00Z",
    relatedVendorIds: ["1"],
    description: "Approaching typhoon may delay shipments from Taiwan for 48-72 hours.",
    isRead: false
  },
  {
    id: "a2",
    title: "Labour Strike in DRC Mining Sector",
    severity: "critical",
    date: "2023-10-26T16:00:00Z",
    relatedVendorIds: ["3"],
    description: "Indefinite strike declared at major cobalt mines. Expect raw material shortages.",
    isRead: false
  }
];