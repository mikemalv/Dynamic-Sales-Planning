import { ProductTile, CompetitorLaunch, SeasonalityData, MLForecast, HolidayDate } from "@/types/planning";

export const CATEGORY_COLORS: Record<string, string> = {
  Driver: "#3b82f6",
  Iron: "#10b981",
  Wedge: "#f59e0b",
  Putter: "#8b5cf6",
  Hybrid: "#ec4899",
  Fairway: "#06b6d4",
};

export const TIER_LABELS: Record<number, string> = {
  1: "Flagship",
  2: "Premium",
  3: "Performance",
  4: "Value",
  5: "Entry",
};

export const DEFAULT_PRODUCT_TILES: ProductTile[] = [
  {
    id: "paradym-ai-driver",
    name: "Paradym AI Driver",
    category: "Driver",
    tier: 1,
    playerType: "Better Player",
    marketSize: 85000000,
    projectedRevenue: { low: 45000000, mid: 55000000, high: 65000000 },
    projectedShare: { low: 12, mid: 18, high: 24 },
    hasNewTech: true,
    color: CATEGORY_COLORS.Driver,
    launchMonth: 1,
    launchYear: 2026,
  },
  {
    id: "apex-pro-irons",
    name: "Apex Pro Irons",
    category: "Iron",
    tier: 1,
    playerType: "Better Player",
    marketSize: 120000000,
    projectedRevenue: { low: 35000000, mid: 45000000, high: 55000000 },
    projectedShare: { low: 8, mid: 12, high: 16 },
    hasNewTech: true,
    color: CATEGORY_COLORS.Iron,
    launchMonth: 2,
    launchYear: 2026,
  },
  {
    id: "jaws-raw-wedges",
    name: "Jaws Raw Wedges",
    category: "Wedge",
    tier: 1,
    playerType: "Better Player",
    marketSize: 45000000,
    projectedRevenue: { low: 18000000, mid: 24000000, high: 30000000 },
    projectedShare: { low: 15, mid: 22, high: 28 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Wedge,
    launchMonth: 3,
    launchYear: 2026,
  },
  {
    id: "odyssey-ai-putter",
    name: "Odyssey AI Putter",
    category: "Putter",
    tier: 1,
    playerType: "Game Improvement",
    marketSize: 65000000,
    projectedRevenue: { low: 25000000, mid: 32000000, high: 40000000 },
    projectedShare: { low: 10, mid: 15, high: 20 },
    hasNewTech: true,
    color: CATEGORY_COLORS.Putter,
    launchMonth: 6,
    launchYear: 2026,
  },
  {
    id: "big-bertha-driver",
    name: "Big Bertha Driver",
    category: "Driver",
    tier: 2,
    playerType: "Game Improvement",
    marketSize: 75000000,
    projectedRevenue: { low: 28000000, mid: 35000000, high: 42000000 },
    projectedShare: { low: 8, mid: 12, high: 16 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Driver,
  },
  {
    id: "apex-dcb-irons",
    name: "Apex DCB Irons",
    category: "Iron",
    tier: 2,
    playerType: "Game Improvement",
    marketSize: 100000000,
    projectedRevenue: { low: 22000000, mid: 30000000, high: 38000000 },
    projectedShare: { low: 6, mid: 10, high: 14 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Iron,
  },
  {
    id: "rogue-hybrid",
    name: "Rogue ST Hybrid",
    category: "Hybrid",
    tier: 2,
    playerType: "Game Improvement",
    marketSize: 40000000,
    projectedRevenue: { low: 15000000, mid: 20000000, high: 26000000 },
    projectedShare: { low: 12, mid: 18, high: 24 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Hybrid,
  },
  {
    id: "paradym-fairway",
    name: "Paradym Fairway",
    category: "Fairway",
    tier: 1,
    playerType: "Better Player",
    marketSize: 35000000,
    projectedRevenue: { low: 12000000, mid: 18000000, high: 24000000 },
    projectedShare: { low: 10, mid: 16, high: 22 },
    hasNewTech: true,
    color: CATEGORY_COLORS.Fairway,
  },
  {
    id: "x-forged-irons",
    name: "X Forged Irons",
    category: "Iron",
    tier: 3,
    playerType: "Better Player",
    marketSize: 50000000,
    projectedRevenue: { low: 10000000, mid: 15000000, high: 20000000 },
    projectedShare: { low: 5, mid: 8, high: 12 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Iron,
  },
  {
    id: "opus-putter",
    name: "Opus Putter",
    category: "Putter",
    tier: 2,
    playerType: "Better Player",
    marketSize: 55000000,
    projectedRevenue: { low: 18000000, mid: 24000000, high: 30000000 },
    projectedShare: { low: 8, mid: 12, high: 16 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Putter,
  },
  {
    id: "mavrik-2026-driver",
    name: "Mavrik 2026 Driver",
    category: "Driver",
    tier: 1,
    playerType: "Game Improvement",
    marketSize: 80000000,
    projectedRevenue: { low: 40000000, mid: 50000000, high: 60000000 },
    projectedShare: { low: 10, mid: 15, high: 20 },
    hasNewTech: true,
    color: CATEGORY_COLORS.Driver,
  },
  {
    id: "chrome-soft-x-ball",
    name: "Chrome Soft X",
    category: "Iron",
    tier: 1,
    playerType: "Better Player",
    marketSize: 90000000,
    projectedRevenue: { low: 30000000, mid: 40000000, high: 50000000 },
    projectedShare: { low: 14, mid: 20, high: 26 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Iron,
  },
  {
    id: "jaws-full-toe-wedge",
    name: "Jaws Full Toe Wedge",
    category: "Wedge",
    tier: 2,
    playerType: "Better Player",
    marketSize: 40000000,
    projectedRevenue: { low: 12000000, mid: 18000000, high: 24000000 },
    projectedShare: { low: 8, mid: 14, high: 20 },
    hasNewTech: false,
    color: CATEGORY_COLORS.Wedge,
  },
];

export const COMPETITOR_LAUNCHES: CompetitorLaunch[] = [
  { id: "tit-vokey-2025", competitor: "Titleist", product: "Vokey SM10 Wedges", category: "Wedge", month: 1, year: 2025, estimatedImpact: "High" },
  { id: "tit-vokey-2027", competitor: "Titleist", product: "Vokey SM11 Wedges", category: "Wedge", month: 1, year: 2027, estimatedImpact: "High" },
  { id: "tm-stealth-2025", competitor: "TaylorMade", product: "Stealth 3 Driver", category: "Driver", month: 2, year: 2025, estimatedImpact: "High" },
  { id: "tm-p-irons-2025", competitor: "TaylorMade", product: "P790 Irons", category: "Iron", month: 3, year: 2025, estimatedImpact: "Medium" },
  { id: "ping-g-driver-2025", competitor: "Ping", product: "G440 Driver", category: "Driver", month: 1, year: 2025, estimatedImpact: "Medium" },
  { id: "cobra-lt-2025", competitor: "Cobra", product: "LTDx Driver", category: "Driver", month: 2, year: 2025, estimatedImpact: "Low" },
  { id: "miz-pro-2025", competitor: "Mizuno", product: "Pro 245 Irons", category: "Iron", month: 4, year: 2025, estimatedImpact: "Medium" },
  { id: "tit-gt-2026", competitor: "Titleist", product: "GT5 Driver", category: "Driver", month: 1, year: 2026, estimatedImpact: "High" },
  { id: "tm-qi-2026", competitor: "TaylorMade", product: "Qi20 Driver", category: "Driver", month: 2, year: 2026, estimatedImpact: "High" },
  { id: "ping-i-irons-2026", competitor: "Ping", product: "i530 Irons", category: "Iron", month: 3, year: 2026, estimatedImpact: "Medium" },
  { id: "scotty-2026", competitor: "Titleist", product: "Scotty Cameron Phantom", category: "Putter", month: 6, year: 2026, estimatedImpact: "Medium" },
  { id: "tm-tp-wedge-2026", competitor: "TaylorMade", product: "MG4 Wedges", category: "Wedge", month: 9, year: 2026, estimatedImpact: "Medium" },
  { id: "tit-t-series-2026", competitor: "Titleist", product: "T150 Irons", category: "Iron", month: 10, year: 2026, estimatedImpact: "High" },
  { id: "ping-hybrid-2027", competitor: "Ping", product: "G450 Hybrid", category: "Hybrid", month: 1, year: 2027, estimatedImpact: "Medium" },
  { id: "tm-stealth-4-2027", competitor: "TaylorMade", product: "Stealth 4 Driver", category: "Driver", month: 2, year: 2027, estimatedImpact: "High" },
  { id: "cobra-ai-2027", competitor: "Cobra", product: "Aerojet LS Driver", category: "Driver", month: 3, year: 2027, estimatedImpact: "Medium" },
  { id: "miz-jzx-2027", competitor: "Mizuno", product: "JPX 945 Irons", category: "Iron", month: 4, year: 2027, estimatedImpact: "Medium" },
  { id: "tit-gt-2027", competitor: "Titleist", product: "GT6 Driver", category: "Driver", month: 6, year: 2027, estimatedImpact: "High" },
  { id: "ping-blueprint-2027", competitor: "Ping", product: "Blueprint S Irons", category: "Iron", month: 8, year: 2027, estimatedImpact: "Medium" },
  { id: "tm-putter-2027", competitor: "TaylorMade", product: "Spider GTX Putter", category: "Putter", month: 9, year: 2027, estimatedImpact: "Medium" },
  { id: "tit-vokey-2028", competitor: "Titleist", product: "Vokey SM12 Wedges", category: "Wedge", month: 1, year: 2028, estimatedImpact: "High" },
  { id: "tm-qi-30-2028", competitor: "TaylorMade", product: "Qi30 Driver", category: "Driver", month: 2, year: 2028, estimatedImpact: "High" },
  { id: "ping-g-2028", competitor: "Ping", product: "G460 Driver", category: "Driver", month: 1, year: 2028, estimatedImpact: "Medium" },
];

export const SEASONALITY_DATA: SeasonalityData[] = [
  { month: 1, monthName: "January", seasonalFactor: 1.35, historicalRevenue: 45000000, optimalForLaunch: true },
  { month: 2, monthName: "February", seasonalFactor: 1.30, historicalRevenue: 42000000, optimalForLaunch: true },
  { month: 3, monthName: "March", seasonalFactor: 1.20, historicalRevenue: 38000000, optimalForLaunch: true },
  { month: 4, monthName: "April", seasonalFactor: 1.15, historicalRevenue: 35000000, optimalForLaunch: false },
  { month: 5, monthName: "May", seasonalFactor: 1.10, historicalRevenue: 32000000, optimalForLaunch: false },
  { month: 6, monthName: "June", seasonalFactor: 1.15, historicalRevenue: 36000000, optimalForLaunch: true },
  { month: 7, monthName: "July", seasonalFactor: 0.85, historicalRevenue: 25000000, optimalForLaunch: false },
  { month: 8, monthName: "August", seasonalFactor: 0.80, historicalRevenue: 24000000, optimalForLaunch: false },
  { month: 9, monthName: "September", seasonalFactor: 0.90, historicalRevenue: 27000000, optimalForLaunch: false },
  { month: 10, monthName: "October", seasonalFactor: 0.95, historicalRevenue: 29000000, optimalForLaunch: false },
  { month: 11, monthName: "November", seasonalFactor: 1.05, historicalRevenue: 33000000, optimalForLaunch: false },
  { month: 12, monthName: "December", seasonalFactor: 1.15, historicalRevenue: 36000000, optimalForLaunch: false },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function generateMLForecasts(startYear: number, months: number): MLForecast[] {
  const forecasts: MLForecast[] = [];
  const baseRevenue = 30000000;
  
  for (let i = 0; i < months; i++) {
    const month = ((i % 12) + 1);
    const year = startYear + Math.floor(i / 12);
    const seasonality = SEASONALITY_DATA.find(s => s.month === month)?.seasonalFactor || 1;
    const yearGrowth = 1 + (year - startYear) * 0.05;
    const deterministicVariation = 0.92 + seededRandom(year * 100 + month) * 0.16;
    
    const predictedRevenue = baseRevenue * seasonality * yearGrowth * deterministicVariation;
    const confidence = Math.max(0.5, Math.min(0.95, 0.85 - (i * 0.005)));
    
    const prevMonth = i > 0 ? forecasts[i - 1]?.predictedRevenue : baseRevenue;
    const trend = predictedRevenue > prevMonth * 1.02 ? "up" : predictedRevenue < prevMonth * 0.98 ? "down" : "stable";
    
    const factors: string[] = [];
    if (month >= 1 && month <= 3) factors.push("Peak golf season start");
    if (month === 6) factors.push("Father's Day sales boost (+85%)");
    if (month >= 7 && month <= 8) factors.push("Summer slowdown");
    if (month === 11) factors.push("Black Friday volume boost");
    if (month === 12) factors.push("Holiday gifting season");
    if (year > startYear) factors.push("Year-over-year growth");
    if (seasonality > 1.1) factors.push("Strong seasonal demand");
    
    forecasts.push({
      month,
      year,
      predictedRevenue: Math.round(predictedRevenue),
      confidence,
      trend,
      factors,
    });
  }
  
  return forecasts;
}

export function getSeasonalityWithHolidays(holidays: HolidayDate[]): SeasonalityData[] {
  return SEASONALITY_DATA.map(s => {
    const monthHolidays = holidays.filter(h => h.month === s.month);
    let adjustedFactor = s.seasonalFactor;
    monthHolidays.forEach(h => {
      adjustedFactor = Math.max(adjustedFactor, s.seasonalFactor * (h.revenueImpactFactor * 0.7 + 0.3));
    });
    return {
      ...s,
      seasonalFactor: Math.round(adjustedFactor * 100) / 100,
      holidays: monthHolidays,
    };
  });
}

export function calculateProductImpact(
  tile: ProductTile,
  launchMonth: number,
  launchYear: number,
  competitorLaunches: CompetitorLaunch[]
): { adjustedRevenue: number; marketShareImpact: number; alerts: string[] } {
  const seasonality = SEASONALITY_DATA.find(s => s.month === launchMonth)?.seasonalFactor || 1;
  const baseRevenue = tile.projectedRevenue.mid;
  
  const nearbyCompetitors = competitorLaunches.filter(c => 
    c.category === tile.category &&
    Math.abs((c.year * 12 + c.month) - (launchYear * 12 + launchMonth)) <= 2
  );
  
  let competitorImpact = 1;
  const alerts: string[] = [];
  
  nearbyCompetitors.forEach(comp => {
    if (comp.estimatedImpact === "High") {
      competitorImpact *= 0.85;
      alerts.push(`${comp.competitor} ${comp.product} launches nearby - expect 15% revenue impact`);
    } else if (comp.estimatedImpact === "Medium") {
      competitorImpact *= 0.92;
      alerts.push(`${comp.competitor} ${comp.product} may affect market share`);
    }
  });
  
  const adjustedRevenue = Math.round(baseRevenue * seasonality * competitorImpact);
  const marketShareImpact = tile.projectedShare.mid * competitorImpact;
  
  if (seasonality < 0.9) {
    alerts.push("Sub-optimal launch window - consider Q1 or June (Father's Day) for better results");
  }
  
  return { adjustedRevenue, marketShareImpact, alerts };
}

export function checkBusinessRules(
  tiles: ProductTile[],
  month: number,
  year: number
): { type: "warning" | "error" | "info"; message: string }[] {
  const alerts: { type: "warning" | "error" | "info"; message: string }[] = [];
  
  const monthTiles = tiles.filter(t => t.launchMonth === month && t.launchYear === year);
  
  const tier1ByCategory = monthTiles.filter(t => t.tier === 1).reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(tier1ByCategory).forEach(([category, count]) => {
    if (count > 1) {
      alerts.push({
        type: "error",
        message: `Multiple Tier 1 ${category} launches in same period - risk of cannibalization`,
      });
    }
  });
  
  const totalTier1 = monthTiles.filter(t => t.tier === 1).length;
  if (totalTier1 > 3) {
    alerts.push({
      type: "warning",
      message: "Too many flagship launches in one period - may dilute marketing impact",
    });
  }
  
  const categoryCount = monthTiles.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count > 2) {
      alerts.push({
        type: "warning",
        message: `${count} ${category} products launching together may confuse market positioning`,
      });
    }
  });
  
  return alerts;
}
