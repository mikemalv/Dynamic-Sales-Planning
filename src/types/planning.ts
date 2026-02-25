export interface ProductTile {
  id: string;
  name: string;
  category: "Driver" | "Iron" | "Wedge" | "Putter" | "Hybrid" | "Fairway";
  tier: 1 | 2 | 3 | 4 | 5;
  playerType: "Better Player" | "Game Improvement" | "Max Game Improvement";
  marketSize: number;
  projectedRevenue: { low: number; mid: number; high: number };
  projectedShare: { low: number; mid: number; high: number };
  hasNewTech: boolean;
  color: string;
  launchMonth?: number;
  launchYear?: number;
  launchDay?: number;
  notes?: string;
}

export interface CompetitorLaunch {
  id: string;
  competitor: string;
  product: string;
  category: string;
  month: number;
  year: number;
  estimatedImpact: "High" | "Medium" | "Low";
}

export interface SeasonalityData {
  month: number;
  monthName: string;
  seasonalFactor: number;
  historicalRevenue: number;
  optimalForLaunch: boolean;
}

export interface MLForecast {
  month: number;
  year: number;
  predictedRevenue: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  factors: string[];
}

export interface PlanningScenario {
  id: string;
  name: string;
  tiles: ProductTile[];
  totalRevenue: number;
  totalMarketShare: number;
  alerts: BusinessAlert[];
  createdAt: Date;
}

export interface BusinessAlert {
  type: "warning" | "error" | "info";
  message: string;
  productIds: string[];
}

export interface TimelineMonth {
  month: number;
  year: number;
  label: string;
  products: ProductTile[];
  competitorLaunches: CompetitorLaunch[];
  seasonalFactor: number;
  projectedRevenue: number;
}
