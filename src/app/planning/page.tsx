"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Target, TrendingUp, AlertTriangle, Zap, 
  ChevronLeft, ChevronRight, Info, BarChart3, Menu, Home, Sparkles, CalendarDays
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";
import { LaunchOptimizer } from "@/components/launch-optimizer";
import { CalendarView } from "@/components/calendar-view";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { ProductTile, TimelineMonth, CompetitorLaunch, MLForecast } from "@/types/planning";
import {
  DEFAULT_PRODUCT_TILES,
  COMPETITOR_LAUNCHES,
  SEASONALITY_DATA,
  CATEGORY_COLORS,
  TIER_LABELS,
  generateMLForecasts,
  calculateProductImpact,
  checkBusinessRules,
} from "@/lib/planning-data";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend, BarChart, Bar, LineChart, Line
} from "recharts";
import Link from "next/link";
import Image from "next/image";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StrategicPlanning() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [planningHorizon, setPlanningHorizon] = useState(24);
  const [availableTiles, setAvailableTiles] = useState<ProductTile[]>(
    () => DEFAULT_PRODUCT_TILES.filter(t => !t.launchMonth || !t.launchYear)
  );
  const [scheduledTiles, setScheduledTiles] = useState<ProductTile[]>(
    () => DEFAULT_PRODUCT_TILES.filter(t => t.launchMonth && t.launchYear)
  );
  const [draggedTile, setDraggedTile] = useState<ProductTile | null>(null);
  const [selectedTile, setSelectedTile] = useState<ProductTile | null>(null);
  const [mlForecasts] = useState<MLForecast[]>(() => generateMLForecasts(2026, 36));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("base");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<ProductTile | null>(null);

  const timelineMonths: TimelineMonth[] = [];
  for (let i = 0; i < planningHorizon; i++) {
    const month = (i % 12) + 1;
    const year = currentYear + Math.floor(i / 12);
    const seasonData = SEASONALITY_DATA.find(s => s.month === month)!;
    const monthProducts = scheduledTiles.filter(t => t.launchMonth === month && t.launchYear === year);
    const monthCompetitors = COMPETITOR_LAUNCHES.filter(c => c.month === month && c.year === year);
    
    let projectedRevenue = 0;
    monthProducts.forEach(p => {
      const impact = calculateProductImpact(p, month, year, COMPETITOR_LAUNCHES);
      projectedRevenue += impact.adjustedRevenue;
    });
    
    timelineMonths.push({
      month,
      year,
      label: `${MONTHS[month - 1]} ${year}`,
      products: monthProducts,
      competitorLaunches: monthCompetitors,
      seasonalFactor: seasonData.seasonalFactor,
      projectedRevenue,
    });
  }

  const totalProjectedRevenue = timelineMonths.reduce((sum, m) => sum + m.projectedRevenue, 0);
  const totalMarketShare = scheduledTiles.reduce((sum, t) => sum + t.projectedShare.mid, 0) / Math.max(1, scheduledTiles.length);

  const businessAlerts = scheduledTiles.length > 0 
    ? timelineMonths.flatMap(m => checkBusinessRules(scheduledTiles, m.month, m.year))
    : [];

  const handleDragStart = (tile: ProductTile) => {
    setDraggedTile(tile);
    setSelectedTile(tile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback((month: number, year: number) => {
    if (!draggedTile) return;
    
    const updatedTile = { ...draggedTile, launchMonth: month, launchYear: year };
    
    if (availableTiles.find(t => t.id === draggedTile.id)) {
      setAvailableTiles(prev => prev.filter(t => t.id !== draggedTile.id));
      setScheduledTiles(prev => [...prev, updatedTile]);
    } else {
      setScheduledTiles(prev => 
        prev.map(t => t.id === draggedTile.id ? updatedTile : t)
      );
    }
    
    setDraggedTile(null);
  }, [draggedTile, availableTiles]);

  const handleRemoveFromTimeline = (tile: ProductTile) => {
    const resetTile = { ...tile, launchMonth: undefined, launchYear: undefined };
    setScheduledTiles(prev => prev.filter(t => t.id !== tile.id));
    setAvailableTiles(prev => [...prev, resetTile]);
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
    }
  };

  const handleSelectTile = (tile: ProductTile) => {
    setSelectedTile(selectedTile?.id === tile.id ? null : tile);
  };

  const handleOpenProductDetail = (tile: ProductTile) => {
    setDetailProduct(tile);
    setDetailModalOpen(true);
  };

  const handleSaveProduct = (updatedProduct: ProductTile) => {
    if (scheduledTiles.find(t => t.id === updatedProduct.id)) {
      setScheduledTiles(prev => prev.map(t => t.id === updatedProduct.id ? updatedProduct : t));
    } else {
      setAvailableTiles(prev => prev.map(t => t.id === updatedProduct.id ? updatedProduct : t));
    }
    setDetailProduct(updatedProduct);
  };

  const handleDeleteProduct = (productId: string) => {
    const tile = scheduledTiles.find(t => t.id === productId);
    if (tile) {
      const resetTile = { ...tile, launchMonth: undefined, launchYear: undefined };
      setScheduledTiles(prev => prev.filter(t => t.id !== productId));
      setAvailableTiles(prev => [...prev, resetTile]);
    }
    setDetailModalOpen(false);
  };

  const handleRescheduleProduct = (productId: string, month: number, year: number) => {
    setScheduledTiles(prev => prev.map(t => 
      t.id === productId ? { ...t, launchMonth: month, launchYear: year } : t
    ));
  };

  const handleOptimizerSelectMonth = (month: number, year: number) => {
    if (!selectedTile) return;
    
    const isScheduled = scheduledTiles.find(t => t.id === selectedTile.id);
    const updatedTile = { ...selectedTile, launchMonth: month, launchYear: year };
    
    if (isScheduled) {
      setScheduledTiles(prev => 
        prev.map(t => t.id === selectedTile.id ? updatedTile : t)
      );
    } else {
      setAvailableTiles(prev => prev.filter(t => t.id !== selectedTile.id));
      setScheduledTiles(prev => [...prev, updatedTile]);
    }
    
    setSelectedTile(updatedTile);
  };

  const forecastChartData = mlForecasts.map(f => ({
    period: `${MONTHS[f.month - 1]} ${f.year}`,
    predicted: Math.round(f.predictedRevenue / 1000000),
    confidence: Math.round(f.confidence * 100),
    scheduled: timelineMonths.find(t => t.month === f.month && t.year === f.year)?.projectedRevenue 
      ? Math.round(timelineMonths.find(t => t.month === f.month && t.year === f.year)!.projectedRevenue / 1000000)
      : null,
  }));

  const seasonalityChartData = SEASONALITY_DATA.map(s => ({
    month: MONTHS[s.month - 1],
    factor: s.seasonalFactor,
    historical: Math.round(s.historicalRevenue / 1000000),
    optimal: s.optimalForLaunch ? 1.4 : 0,
  }));

  const categoryRevenueData = Object.keys(CATEGORY_COLORS).map(cat => {
    const catTiles = scheduledTiles.filter(t => t.category === cat);
    const revenue = catTiles.reduce((sum, t) => {
      if (t.launchMonth && t.launchYear) {
        const impact = calculateProductImpact(t, t.launchMonth, t.launchYear, COMPETITOR_LAUNCHES);
        return sum + impact.adjustedRevenue;
      }
      return sum;
    }, 0);
    return { category: cat, revenue: Math.round(revenue / 1000000), count: catTiles.length };
  }).filter(d => d.revenue > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        selectedScenario={selectedScenario}
        onScenarioChange={setSelectedScenario}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedProducts={selectedProducts}
        onProductsChange={setSelectedProducts}
        onRefresh={() => window.location.reload()}
      />
      
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="border-indigo-200 dark:border-indigo-800"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link href="/">
                <Image
                  src="/callaway-logo.svg"
                  alt="Callaway Golf"
                  width={120}
                  height={69}
                  className="h-10 w-auto dark:invert cursor-pointer"
                  priority
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-900 to-purple-900 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Strategic Product Planning
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{planningHorizon}-Month Planning Horizon</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={planningHorizon}
                onChange={(e) => setPlanningHorizon(Number(e.target.value))}
                className="px-3 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-slate-200"
              >
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
                <option value={36}>36 Months</option>
                <option value={48}>48 Months</option>
              </select>
              <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 px-4 py-2">
                {currentYear} - {currentYear + Math.floor(planningHorizon / 12)}
              </Badge>
              <Link href="/">
                <Button variant="outline" size="icon" className="border-slate-200 dark:border-slate-700">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Projected Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">${(totalProjectedRevenue / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{planningHorizon}-month outlook</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg bg-gradient-to-br from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Avg Market Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{totalMarketShare.toFixed(1)}%</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Across scheduled products</p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 dark:border-violet-800 shadow-lg bg-gradient-to-br from-white to-violet-50 dark:from-slate-900 dark:to-violet-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Scheduled Launches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">{scheduledTiles.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{availableTiles.length} products available</p>
            </CardContent>
          </Card>

          <Card className={`shadow-lg bg-gradient-to-br ${businessAlerts.filter(a => a.type === "error").length > 0 ? "border-red-200 dark:border-red-800 from-white to-red-50 dark:from-slate-900 dark:to-red-950" : businessAlerts.filter(a => a.type === "warning").length > 0 ? "border-amber-200 dark:border-amber-800 from-white to-amber-50 dark:from-slate-900 dark:to-amber-950" : "border-emerald-200 dark:border-emerald-800 from-white to-emerald-50 dark:from-slate-900 dark:to-emerald-950"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${businessAlerts.filter(a => a.type === "error").length > 0 ? "text-red-600 dark:text-red-400" : businessAlerts.filter(a => a.type === "warning").length > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                Business Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${businessAlerts.filter(a => a.type === "error").length > 0 ? "text-red-900 dark:text-red-100" : businessAlerts.filter(a => a.type === "warning").length > 0 ? "text-amber-900 dark:text-amber-100" : "text-emerald-900 dark:text-emerald-100"}`}>
                {businessAlerts.length}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {businessAlerts.filter(a => a.type === "error").length} critical, {businessAlerts.filter(a => a.type === "warning").length} warnings
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="bg-white dark:bg-slate-900 shadow-sm border border-indigo-200 dark:border-indigo-800 p-1">
            <TabsTrigger value="timeline" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" /> Timeline Planning
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white">
              <Sparkles className="h-4 w-4 mr-2" /> ML Optimizer
            </TabsTrigger>
            <TabsTrigger value="forecast" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" /> ML Forecast
            </TabsTrigger>
            <TabsTrigger value="competition" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              <Target className="h-4 w-4 mr-2" /> Competition
            </TabsTrigger>
            <TabsTrigger value="seasonality" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" /> Seasonality
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              <CalendarDays className="h-4 w-4 mr-2" /> Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="grid grid-cols-[280px_1fr] gap-4">
              <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg h-fit max-h-[600px] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 py-3">
                  <CardTitle className="text-indigo-900 dark:text-indigo-100 text-base">Product Tiles</CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300 text-sm">Click to analyze, drag to schedule</CardDescription>
                </CardHeader>
                <CardContent className="p-3 overflow-y-auto max-h-[480px]">
                  <div className="space-y-2">
                    {availableTiles.map(tile => (
                      <div
                        key={tile.id}
                        draggable
                        onDragStart={() => handleDragStart(tile)}
                        onClick={() => handleSelectTile(tile)}
                        className={`p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                          selectedTile?.id === tile.id ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900" : ""
                        }`}
                        style={{ 
                          borderColor: tile.color, 
                          backgroundColor: `${tile.color}10`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{tile.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: tile.color, color: tile.color }}
                              >
                                {tile.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                                {TIER_LABELS[tile.tier]}
                              </Badge>
                            </div>
                          </div>
                          {tile.hasNewTech && (
                            <Zap className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          <div>Revenue: ${(tile.projectedRevenue.mid / 1000000).toFixed(1)}M</div>
                          <div>Share: {tile.projectedShare.mid}%</div>
                        </div>
                      </div>
                    ))}
                    {availableTiles.length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">All products scheduled</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 py-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-indigo-900 dark:text-indigo-100 text-base">Planning Timeline</CardTitle>
                    <CardDescription className="text-indigo-700 dark:text-indigo-300 text-sm">Drop products to schedule launches</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentYear(y => y - 1)}
                      className="border-indigo-200 dark:border-indigo-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-100">{currentYear}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentYear(y => y + 1)}
                      className="border-indigo-200 dark:border-indigo-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-4">
                    {timelineMonths.slice(0, 24).map((tm, idx) => (
                      <div
                        key={idx}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(tm.month, tm.year)}
                        className={`w-[120px] min-h-[200px] rounded-lg border-2 border-dashed p-2 transition-all ${
                          draggedTile ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950" : "border-slate-200 dark:border-slate-700"
                        } ${tm.seasonalFactor > 1.1 ? "bg-emerald-50/50 dark:bg-emerald-950/30" : ""}`}
                      >
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                          <span>{tm.label}</span>
                          {tm.seasonalFactor > 1.1 && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] px-1">Peak</Badge>
                          )}
                        </div>
                        
                        {tm.competitorLaunches.length > 0 && (
                          <div className="mb-2">
                            {tm.competitorLaunches.map(cl => (
                              <div 
                                key={cl.id}
                                className={`text-[10px] p-1 rounded mb-1 ${
                                  cl.estimatedImpact === "High" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" :
                                  cl.estimatedImpact === "Medium" ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200" :
                                  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                <div className="font-semibold">{cl.competitor}</div>
                                <div className="truncate">{cl.product}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          {tm.products.map(p => (
                            <div
                              key={p.id}
                              draggable
                              onDragStart={() => handleDragStart(p)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTile(p);
                              }}
                              onDoubleClick={() => handleOpenProductDetail(p)}
                              className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                                selectedTile?.id === p.id ? "ring-2 ring-white ring-offset-1" : ""
                              }`}
                              style={{ backgroundColor: p.color, color: "white" }}
                            >
                              <div className="font-semibold truncate">{p.name}</div>
                              <div className="flex items-center justify-between mt-1">
                                <span>{TIER_LABELS[p.tier]}</span>
                                {p.hasNewTech && <Zap className="h-3 w-3" />}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {tm.projectedRevenue > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-400">
                            Rev: ${(tm.projectedRevenue / 1000000).toFixed(1)}M
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {businessAlerts.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 py-3">
                  <CardTitle className="text-amber-900 dark:text-amber-100 text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Business Rules & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {businessAlerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex items-start gap-3 ${
                          alert.type === "error" ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800" :
                          alert.type === "warning" ? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800" :
                          "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                          alert.type === "error" ? "text-red-600 dark:text-red-400" :
                          alert.type === "warning" ? "text-amber-600 dark:text-amber-400" :
                          "text-blue-600 dark:text-blue-400"
                        }`} />
                        <span className={`text-sm ${
                          alert.type === "error" ? "text-red-800 dark:text-red-200" :
                          alert.type === "warning" ? "text-amber-800 dark:text-amber-200" :
                          "text-blue-800 dark:text-blue-200"
                        }`}>{alert.message}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="optimizer" className="space-y-4">
            <div className="grid grid-cols-[300px_1fr] gap-4">
              <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg h-fit max-h-[700px] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 py-3">
                  <CardTitle className="text-indigo-900 dark:text-indigo-100 text-base">Select Product</CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300 text-sm">Choose a product to optimize</CardDescription>
                </CardHeader>
                <CardContent className="p-3 overflow-y-auto max-h-[580px]">
                  <div className="space-y-2">
                    {[...availableTiles, ...scheduledTiles].map(tile => (
                      <div
                        key={tile.id}
                        onClick={() => setSelectedTile(tile)}
                        className={`p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all ${
                          selectedTile?.id === tile.id ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900" : ""
                        }`}
                        style={{ 
                          borderColor: tile.color, 
                          backgroundColor: `${tile.color}10`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{tile.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ borderColor: tile.color, color: tile.color }}
                              >
                                {tile.category}
                              </Badge>
                              {tile.launchMonth && (
                                <Badge className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                                  {MONTHS[tile.launchMonth - 1]} {tile.launchYear}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {tile.hasNewTech && (
                            <Zap className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <LaunchOptimizer
                product={selectedTile}
                onSelectMonth={handleOptimizerSelectMonth}
                startYear={currentYear}
              />
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                  <CardTitle className="text-emerald-900 dark:text-emerald-100">ML Revenue Forecast</CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">36-month predictive forecast from Jan 2026 ($M)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastChartData}>
                        <defs>
                          <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="period" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="predicted" stroke="#10b981" fill="url(#predictedGradient)" name="ML Predicted" />
                        <Line type="monotone" dataKey="scheduled" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Scheduled Revenue" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                  <CardTitle className="text-violet-900 dark:text-violet-100">Revenue by Category</CardTitle>
                  <CardDescription className="text-violet-700 dark:text-violet-300">Scheduled product breakdown ($M)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="category" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip />
                        <Bar 
                          dataKey="revenue" 
                          fill="#8b5cf6" 
                          radius={[8, 8, 0, 0]}
                          name="Revenue ($M)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  ML Forecast Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {mlForecasts.slice(0, 6).map((f, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{MONTHS[f.month - 1]} {f.year}</span>
                        <Badge className={`${
                          f.trend === "up" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200" :
                          f.trend === "down" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" :
                          "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        }`}>
                          {f.trend === "up" ? "+" : f.trend === "down" ? "-" : "="} {(f.confidence * 100).toFixed(0)}% conf
                        </Badge>
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        ${(f.predictedRevenue / 1000000).toFixed(1)}M
                      </div>
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {f.factors.slice(0, 2).map((factor, i) => (
                          <div key={i}>* {factor}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competition" className="space-y-4">
            <Card className="border-amber-200 dark:border-amber-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                <CardTitle className="text-amber-900 dark:text-amber-100">Competitor Launch Intelligence</CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">Known and projected competitor activities</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-amber-200 dark:border-amber-800">
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Competitor</th>
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Product</th>
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Launch Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPETITOR_LAUNCHES.map(cl => (
                        <tr key={cl.id} className="border-b border-amber-100 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{cl.competitor}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{cl.product}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: CATEGORY_COLORS[cl.category as keyof typeof CATEGORY_COLORS],
                                color: CATEGORY_COLORS[cl.category as keyof typeof CATEGORY_COLORS]
                              }}
                            >
                              {cl.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{MONTHS[cl.month - 1]} {cl.year}</td>
                          <td className="py-3 px-4">
                            <Badge className={`${
                              cl.estimatedImpact === "High" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" :
                              cl.estimatedImpact === "Medium" ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200" :
                              "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                            }`}>
                              {cl.estimatedImpact}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950">
                <CardTitle className="text-red-900 dark:text-red-100">Launch Conflict Analysis</CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300">Periods with competitive pressure</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {timelineMonths.filter(tm => tm.competitorLaunches.length > 0).slice(0, 6).map((tm, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                      <div className="font-semibold text-red-900 dark:text-red-100 mb-2">{tm.label}</div>
                      {tm.competitorLaunches.map(cl => (
                        <div key={cl.id} className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            cl.estimatedImpact === "High" ? "bg-red-600" :
                            cl.estimatedImpact === "Medium" ? "bg-amber-600" :
                            "bg-emerald-600"
                          }`} />
                          {cl.competitor} - {cl.product}
                        </div>
                      ))}
                      {tm.products.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                          <div className="text-xs text-red-600 dark:text-red-400 font-semibold">Your scheduled:</div>
                          {tm.products.map(p => (
                            <div key={p.id} className="text-sm text-red-800 dark:text-red-200">{p.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seasonality" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                  <CardTitle className="text-violet-900 dark:text-violet-100">Seasonal Revenue Patterns</CardTitle>
                  <CardDescription className="text-violet-700 dark:text-violet-300">Historical monthly performance</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={seasonalityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="historical" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Historical Revenue ($M)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                  <CardTitle className="text-emerald-900 dark:text-emerald-100">Seasonality Factors</CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">Monthly demand multipliers</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={seasonalityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} domain={[0.5, 1.5]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="factor" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 5 }} name="Seasonal Factor" />
                        <Line type="monotone" dataKey="optimal" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Optimal Launch Window" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardTitle className="text-blue-900 dark:text-blue-100">Launch Window Recommendations</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">Optimal timing based on historical data</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {SEASONALITY_DATA.map(s => (
                    <div 
                      key={s.month}
                      className={`p-4 rounded-lg border ${
                        s.optimalForLaunch 
                          ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" 
                          : s.seasonalFactor < 0.9 
                            ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{s.monthName}</span>
                        {s.optimalForLaunch && (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">Optimal</Badge>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.seasonalFactor.toFixed(2)}x</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Hist. Rev: ${(s.historicalRevenue / 1000000).toFixed(1)}M
                      </div>
                      <div className={`text-xs mt-2 ${
                        s.optimalForLaunch ? "text-emerald-700 dark:text-emerald-300" : s.seasonalFactor < 0.9 ? "text-red-700 dark:text-red-300" : "text-slate-600 dark:text-slate-400"
                      }`}>
                        {s.optimalForLaunch 
                          ? "Best for flagship launches" 
                          : s.seasonalFactor < 0.9 
                            ? "Avoid major launches"
                            : "Standard period"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarView
              scheduledTiles={scheduledTiles}
              onSelectProduct={handleOpenProductDetail}
              onDropProduct={handleDrop}
              startYear={currentYear}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ProductDetailModal
        product={detailProduct}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        onReschedule={handleRescheduleProduct}
      />
    </div>
  );
}
