"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Target, TrendingUp, AlertTriangle, Zap, 
  ChevronLeft, ChevronRight, Info, BarChart3, Menu, Home, Sparkles, CalendarDays,
  Save, Download, History, Gift, Database, CheckCircle2, Clock, User, GitCompare, Layers
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";
import { LaunchOptimizer } from "@/components/launch-optimizer";
import { CalendarView } from "@/components/calendar-view";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { ProductTile, TimelineMonth, CompetitorLaunch, MLForecast, HolidayDate, AuditLogEntry } from "@/types/planning";
import {
  DEFAULT_PRODUCT_TILES,
  COMPETITOR_LAUNCHES,
  SEASONALITY_DATA,
  CATEGORY_COLORS,
  TIER_LABELS,
  generateMLForecasts,
  calculateProductImpact,
  checkBusinessRules,
  getSeasonalityWithHolidays,
} from "@/lib/planning-data";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Legend, BarChart, Bar, LineChart, Line
} from "recharts";
import Link from "next/link";
import Image from "next/image";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_USER = "MMALVEIRA";

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

  const [competitorLaunches, setCompetitorLaunches] = useState<CompetitorLaunch[]>(COMPETITOR_LAUNCHES);
  const [competitorDataSource, setCompetitorDataSource] = useState<string>("local");
  const [holidays, setHolidays] = useState<HolidayDate[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveComment, setSaveComment] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [planDirty, setPlanDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const initialLoadDone = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  interface SavedScenarioSummary {
    id: string;
    name: string;
    totalRevenue?: number;
    scheduledCount?: number;
    version?: number;
    updatedAt?: string;
  }
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioSummary[]>([]);
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null);
  const [compareScenarioData, setCompareScenarioData] = useState<{ scheduledTiles: ProductTile[]; name: string; revenue: number; share: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [compRes, holRes, auditRes, planRes, scenariosRes] = await Promise.allSettled([
          fetch("/api/competitor-launches"),
          fetch("/api/holidays"),
          fetch("/api/audit-log?limit=30"),
          fetch("/api/save-plan?id=base"),
          fetch("/api/save-plan?list=true"),
        ]);

        if (compRes.status === "fulfilled" && compRes.value.ok) {
          const compData = await compRes.value.json();
          if (Array.isArray(compData) && compData.length > 0) {
            const mapped: CompetitorLaunch[] = compData.map((r: Record<string, unknown>) => ({
              id: r.ID as string,
              competitor: r.COMPETITOR as string,
              product: r.PRODUCT as string,
              category: r.CATEGORY as string,
              month: r.LAUNCH_MONTH as number,
              year: r.LAUNCH_YEAR as number,
              estimatedImpact: r.ESTIMATED_IMPACT as "High" | "Medium" | "Low",
              dataSource: r.DATA_SOURCE as string,
              confidence: r.CONFIDENCE as string,
            }));
            setCompetitorLaunches(mapped);
            setCompetitorDataSource("snowflake");
          }
        }

        if (holRes.status === "fulfilled" && holRes.value.ok) {
          const holData = await holRes.value.json();
          if (Array.isArray(holData)) {
            const mapped: HolidayDate[] = holData.map((r: Record<string, unknown>) => ({
              id: r.ID as number,
              name: r.HOLIDAY_NAME as string,
              month: r.HOLIDAY_MONTH as number,
              day: r.HOLIDAY_DAY as number,
              year: r.HOLIDAY_YEAR as number | null,
              revenueImpactFactor: r.REVENUE_IMPACT_FACTOR as number,
              category: r.CATEGORY as string,
              notes: r.NOTES as string,
              isRecurring: r.IS_RECURRING as boolean,
            }));
            setHolidays(mapped);
          }
        }

        if (auditRes.status === "fulfilled" && auditRes.value.ok) {
          const auditData = await auditRes.value.json();
          if (Array.isArray(auditData)) {
            setAuditLog(auditData.map((r: Record<string, unknown>) => ({
              id: r.ID as number,
              action: r.ACTION as string,
              entityType: r.ENTITY_TYPE as string,
              entityId: r.ENTITY_ID as string,
              entityName: r.ENTITY_NAME as string,
              details: (r.DETAILS || {}) as Record<string, unknown>,
              comment: (r.COMMENT || "") as string,
              userName: r.USER_NAME as string,
              createdAt: r.CREATED_AT as string,
            })));
          }
        }

        if (planRes.status === "fulfilled" && planRes.value.ok) {
          const planData = await planRes.value.json();
          if (Array.isArray(planData) && planData.length > 0) {
            const plan = planData[0];
            if (plan.PLAN_DATA && plan.PLAN_DATA.scheduledTiles) {
              const savedTiles = plan.PLAN_DATA.scheduledTiles as ProductTile[];
              const savedAvailable = plan.PLAN_DATA.availableTiles as ProductTile[];
              if (savedTiles.length > 0) {
                setScheduledTiles(savedTiles);
                setAvailableTiles(savedAvailable || []);
                setLastSavedAt(plan.UPDATED_AT);
              }
            }
          }
        }

        if (scenariosRes.status === "fulfilled" && scenariosRes.value.ok) {
          const scenariosList = await scenariosRes.value.json();
          if (Array.isArray(scenariosList)) {
            setSavedScenarios(scenariosList.map((s: Record<string, unknown>) => ({
              id: s.ID as string,
              name: s.SCENARIO_NAME as string,
              totalRevenue: s.TOTAL_REVENUE as number,
              scheduledCount: s.SCHEDULED_COUNT as number,
              version: s.VERSION_NUMBER as number,
              updatedAt: s.UPDATED_AT as string,
            })));
          }
        }
      } catch (err) {
        console.error("Error loading planning data:", err);
      }
      initialLoadDone.current = true;
    }
    loadData();
  }, []);

  const seasonalityData = holidays.length > 0 ? getSeasonalityWithHolidays(holidays) : SEASONALITY_DATA;

  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (!planDirty) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const allTiles = [...scheduledTiles, ...availableTiles];
        const totalRev = scheduledTiles.reduce((sum, t) => {
          if (t.launchMonth && t.launchYear) {
            const impact = calculateProductImpact(t, t.launchMonth, t.launchYear, competitorLaunches);
            return sum + impact.adjustedRevenue;
          }
          return sum;
        }, 0);
        const avgShare = scheduledTiles.length > 0
          ? scheduledTiles.reduce((sum, t) => sum + t.projectedShare.mid, 0) / scheduledTiles.length
          : 0;
        const res = await fetch("/api/save-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: selectedScenario,
            scenarioName: selectedScenario === "base" ? "Base Plan" : selectedScenario,
            planData: { scheduledTiles, availableTiles },
            totalRevenue: totalRev,
            totalMarketShare: avgShare,
            scheduledCount: scheduledTiles.length,
            userName: CURRENT_USER,
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          setPlanDirty(false);
          setLastSavedAt(new Date().toISOString());
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }, 1000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [scheduledTiles, availableTiles, planDirty, selectedScenario, competitorLaunches]);

  const logAudit = useCallback(async (action: string, entityType: string, entityId: string, entityName: string, details?: Record<string, unknown>, comment?: string) => {
    try {
      await fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, entityType, entityId, entityName, details, comment, userName: CURRENT_USER }),
      });
    } catch (err) {
      console.error("Audit log error:", err);
    }
  }, []);

  const handleSavePlan = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/save-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: selectedScenario,
          scenarioName: selectedScenario === "base" ? "Base Plan" : savedScenarios.find(s => s.id === selectedScenario)?.name || selectedScenario,
          planData: { scheduledTiles, availableTiles },
          totalRevenue: totalProjectedRevenue,
          totalMarketShare: totalMarketShare,
          scheduledCount: scheduledTiles.length,
          userName: CURRENT_USER,
          changeRationale: saveComment || undefined,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setPlanDirty(false);
        setLastSavedAt(new Date().toISOString());
        setShowSaveDialog(false);
        if (saveComment) {
          await logAudit("SAVE_PLAN_WITH_COMMENT", "SCENARIO", selectedScenario, "Base Plan", { scheduledCount: scheduledTiles.length }, saveComment);
          setSaveComment("");
        }
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [selectedScenario, scheduledTiles, availableTiles, saveComment, logAudit]);

  const filteredScheduledTiles = selectedProducts.length > 0
    ? scheduledTiles.filter(t => selectedProducts.includes(t.id) || selectedProducts.some(p => p.toLowerCase().includes(t.category.toLowerCase())))
    : scheduledTiles;

  const filteredAvailableTiles = selectedProducts.length > 0
    ? availableTiles.filter(t => selectedProducts.includes(t.id) || selectedProducts.some(p => p.toLowerCase().includes(t.category.toLowerCase())))
    : availableTiles;

  const timelineMonths: TimelineMonth[] = [];
  for (let i = 0; i < planningHorizon; i++) {
    const month = (i % 12) + 1;
    const year = currentYear + Math.floor(i / 12);
    const seasonData = seasonalityData.find(s => s.month === month)!;
    const monthProducts = filteredScheduledTiles.filter(t => t.launchMonth === month && t.launchYear === year);
    const monthCompetitors = competitorLaunches.filter(c => c.month === month && c.year === year);
    const monthHolidays = holidays.filter(h => h.month === month && (h.isRecurring || h.year === year));
    
    let projectedRevenue = 0;
    monthProducts.forEach(p => {
      const impact = calculateProductImpact(p, month, year, competitorLaunches);
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
      holidays: monthHolidays,
    });
  }

  const totalProjectedRevenue = timelineMonths.reduce((sum, m) => sum + m.projectedRevenue, 0);
  const totalMarketShare = filteredScheduledTiles.reduce((sum, t) => sum + t.projectedShare.mid, 0) / Math.max(1, filteredScheduledTiles.length);

  const currentYearRevenue = timelineMonths.filter(m => m.year === currentYear).reduce((sum, m) => sum + m.projectedRevenue, 0);
  const futureYearRevenue = timelineMonths.filter(m => m.year > currentYear).reduce((sum, m) => sum + m.projectedRevenue, 0);

  const yearlyRevenueData = Array.from(
    timelineMonths.reduce((map, m) => {
      map.set(m.year, (map.get(m.year) || 0) + m.projectedRevenue);
      return map;
    }, new Map<number, number>())
  ).map(([year, revenue]) => ({
    year: year.toString(),
    revenue: Math.round(revenue / 1000000),
    launches: filteredScheduledTiles.filter(t => t.launchYear === year).length,
  }));

  const businessAlerts = filteredScheduledTiles.length > 0 
    ? timelineMonths.flatMap(m => checkBusinessRules(filteredScheduledTiles, m.month, m.year))
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
    
    setPlanDirty(true);
    logAudit("SCHEDULE_PRODUCT", "PRODUCT", draggedTile.id, draggedTile.name, {
      month, year, previousMonth: draggedTile.launchMonth, previousYear: draggedTile.launchYear,
    });
    setDraggedTile(null);
  }, [draggedTile, availableTiles, logAudit]);

  const handleRemoveFromTimeline = (tile: ProductTile) => {
    const resetTile = { ...tile, launchMonth: undefined, launchYear: undefined };
    setScheduledTiles(prev => prev.filter(t => t.id !== tile.id));
    setAvailableTiles(prev => prev.some(t => t.id === tile.id) ? prev : [...prev, resetTile]);
    setPlanDirty(true);
    logAudit("UNSCHEDULE_PRODUCT", "PRODUCT", tile.id, tile.name, {
      removedFromMonth: tile.launchMonth, removedFromYear: tile.launchYear,
    });
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
    setPlanDirty(true);
    logAudit("EDIT_PRODUCT", "PRODUCT", updatedProduct.id, updatedProduct.name, {
      revenue: updatedProduct.projectedRevenue, share: updatedProduct.projectedShare,
    }, updatedProduct.notes);
    setDetailProduct(updatedProduct);
  };

  const handleDeleteProduct = (productId: string) => {
    const tile = scheduledTiles.find(t => t.id === productId);
    if (tile) {
      const resetTile = { ...tile, launchMonth: undefined, launchYear: undefined };
      setScheduledTiles(prev => prev.filter(t => t.id !== productId));
      setAvailableTiles(prev => prev.some(t => t.id === resetTile.id) ? prev : [...prev, resetTile]);
      setPlanDirty(true);
      logAudit("REMOVE_PRODUCT", "PRODUCT", tile.id, tile.name, {
        removedFromMonth: tile.launchMonth, removedFromYear: tile.launchYear,
      });
    }
    setDetailModalOpen(false);
  };

  const handleRescheduleProduct = (productId: string, month: number, year: number) => {
    const tile = scheduledTiles.find(t => t.id === productId);
    setScheduledTiles(prev => prev.map(t => 
      t.id === productId ? { ...t, launchMonth: month, launchYear: year } : t
    ));
    setPlanDirty(true);
    if (tile) {
      logAudit("RESCHEDULE_PRODUCT", "PRODUCT", productId, tile.name, {
        fromMonth: tile.launchMonth, fromYear: tile.launchYear, toMonth: month, toYear: year,
      });
    }
  };

  const handleCreateScenario = useCallback(async (name: string, copyFrom?: string) => {
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const res = await fetch("/api/save-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: id,
          scenarioName: name,
          planData: { scheduledTiles, availableTiles },
          totalRevenue: totalProjectedRevenue,
          totalMarketShare: totalMarketShare,
          scheduledCount: scheduledTiles.length,
          userName: CURRENT_USER,
          changeRationale: `Created from ${copyFrom || "scratch"}`,
        }),
      });
      if (res.ok) {
        setSavedScenarios(prev => [...prev, { id, name, totalRevenue: totalProjectedRevenue, scheduledCount: scheduledTiles.length, version: 1 }]);
        setSelectedScenario(id);
        logAudit("CREATE_SCENARIO", "SCENARIO", id, name, { copiedFrom: copyFrom });
      }
    } catch (err) {
      console.error("Create scenario error:", err);
    }
  }, [scheduledTiles, availableTiles, totalProjectedRevenue, totalMarketShare, logAudit]);

  const handleDeleteScenario = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/save-plan?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedScenarios(prev => prev.filter(s => s.id !== id));
        if (selectedScenario === id) {
          setSelectedScenario("base");
        }
        logAudit("DELETE_SCENARIO", "SCENARIO", id, id, {});
      }
    } catch (err) {
      console.error("Delete scenario error:", err);
    }
  }, [selectedScenario, logAudit]);

  const handleLoadScenario = useCallback(async (scenarioId: string) => {
    try {
      const res = await fetch(`/api/save-plan?id=${scenarioId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const plan = data[0];
          if (plan.PLAN_DATA && plan.PLAN_DATA.scheduledTiles) {
            setScheduledTiles(plan.PLAN_DATA.scheduledTiles as ProductTile[]);
            setAvailableTiles(plan.PLAN_DATA.availableTiles as ProductTile[] || []);
            setLastSavedAt(plan.UPDATED_AT);
            setPlanDirty(false);
          }
        }
      }
    } catch (err) {
      console.error("Load scenario error:", err);
    }
  }, []);

  const handleScenarioChange = useCallback(async (scenarioId: string) => {
    if (planDirty) {
      const proceed = confirm("You have unsaved changes. Switch scenario anyway? (Auto-save will save current changes first)");
      if (!proceed) return;
    }
    setSelectedScenario(scenarioId);
    await handleLoadScenario(scenarioId);
  }, [planDirty, handleLoadScenario]);

  const loadCompareScenario = useCallback(async (scenarioId: string) => {
    try {
      const res = await fetch(`/api/save-plan?id=${scenarioId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const plan = data[0];
          if (plan.PLAN_DATA && plan.PLAN_DATA.scheduledTiles) {
            setCompareScenarioData({
              scheduledTiles: plan.PLAN_DATA.scheduledTiles as ProductTile[],
              name: plan.SCENARIO_NAME,
              revenue: plan.TOTAL_REVENUE,
              share: plan.TOTAL_MARKET_SHARE,
            });
          }
        }
      }
    } catch (err) {
      console.error("Load compare scenario error:", err);
    }
  }, []);

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
    
    setPlanDirty(true);
    logAudit("OPTIMIZER_SCHEDULE", "PRODUCT", selectedTile.id, selectedTile.name, { month, year });
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

  const seasonalityChartData = seasonalityData.map(s => ({
    month: MONTHS[s.month - 1],
    factor: s.seasonalFactor,
    historical: Math.round(s.historicalRevenue / 1000000),
    optimal: s.optimalForLaunch ? 1.4 : 0,
    hasHoliday: (s.holidays && s.holidays.length > 0) ? 1 : 0,
  }));

  const categoryRevenueData = Object.keys(CATEGORY_COLORS).map(cat => {
    const catTiles = filteredScheduledTiles.filter(t => t.category === cat);
    const revenue = catTiles.reduce((sum, t) => {
      if (t.launchMonth && t.launchYear) {
        const impact = calculateProductImpact(t, t.launchMonth, t.launchYear, competitorLaunches);
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
        onScenarioChange={handleScenarioChange}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedProducts={selectedProducts}
        onProductsChange={setSelectedProducts}
        onRefresh={() => window.location.reload()}
        onCreateScenario={handleCreateScenario}
        onDeleteScenario={handleDeleteScenario}
        savedScenarios={savedScenarios.map(s => ({ ...s, description: undefined }))}
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
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {planningHorizon}-Month Horizon
                  {lastSavedAt && <span className="ml-2 text-emerald-600">· Last saved {new Date(lastSavedAt).toLocaleDateString()}</span>}
                  {planDirty && <span className="ml-2 text-amber-600">· Unsaved changes</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                className={`gap-2 ${planDirty ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 animate-pulse" : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"}`}
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? <Clock className="h-4 w-4 animate-spin" /> :
                 saveStatus === "saved" ? <CheckCircle2 className="h-4 w-4" /> :
                 <Save className="h-4 w-4" />}
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Plan"}
              </Button>
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
          {showSaveDialog && (
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
              <User className="h-4 w-4 text-emerald-700 dark:text-emerald-300 flex-shrink-0" />
              <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">{CURRENT_USER}</span>
              <input
                type="text"
                value={saveComment}
                onChange={(e) => setSaveComment(e.target.value)}
                placeholder="Add a comment about this change (optional)..."
                className="flex-1 px-3 py-1.5 text-sm border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-slate-800"
              />
              <Button size="sm" onClick={handleSavePlan} disabled={saveStatus === "saving"} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-1" /> Confirm Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            </div>
          )}
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
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{currentYear}: ${(currentYearRevenue / 1000000).toFixed(1)}M</span>
                {futureYearRevenue > 0 && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{currentYear + 1}+: ${(futureYearRevenue / 1000000).toFixed(1)}M</span>
                )}
              </div>
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
              <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">{filteredScheduledTiles.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{filteredAvailableTiles.length} products available</p>
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
              <Calendar className="h-4 w-4 mr-2" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white">
              <Sparkles className="h-4 w-4 mr-2" /> ML Optimizer
            </TabsTrigger>
            <TabsTrigger value="forecast" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" /> Forecast
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
            <TabsTrigger value="audit" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-gray-600 data-[state=active]:text-white">
              <History className="h-4 w-4 mr-2" /> Audit Log
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
              <Layers className="h-4 w-4 mr-2" /> Scenarios
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
                    {filteredAvailableTiles.map(tile => (
                      <div
                        key={tile.id}
                        draggable
                        onDragStart={() => handleDragStart(tile)}
                        onClick={() => handleSelectTile(tile)}
                        onDoubleClick={() => handleOpenProductDetail(tile)}
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
                    {filteredAvailableTiles.length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        {selectedProducts.length > 0 ? "No matching products" : "All products scheduled"}
                      </p>
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
                        className={`w-[130px] min-h-[220px] rounded-lg border-2 border-dashed p-2 transition-all ${
                          draggedTile ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950" : "border-slate-200 dark:border-slate-700"
                        } ${tm.seasonalFactor > 1.1 ? "bg-emerald-50/50 dark:bg-emerald-950/30" : ""}`}
                      >
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>{tm.label}</span>
                          {tm.seasonalFactor > 1.1 && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] px-1">Peak</Badge>
                          )}
                        </div>

                        {tm.holidays && tm.holidays.length > 0 && (
                          <div className="mb-1">
                            {tm.holidays.slice(0, 2).map((h, hi) => (
                              <div key={hi} className="text-[9px] px-1 py-0.5 rounded bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 mb-0.5 flex items-center gap-1">
                                <Gift className="h-2.5 w-2.5" />
                                <span className="truncate">{h.name}</span>
                                <span className="text-pink-600 dark:text-pink-400 font-semibold">+{Math.round((h.revenueImpactFactor - 1) * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {tm.competitorLaunches.length > 0 && (
                          <div className="mb-1">
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
                    {[...filteredAvailableTiles, ...filteredScheduledTiles].map(tile => (
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
            {yearlyRevenueData.length > 1 && (
              <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                  <CardTitle className="text-indigo-900 dark:text-indigo-100">Year-over-Year Revenue Impact</CardTitle>
                  <CardDescription className="text-indigo-700 dark:text-indigo-300">Revenue and launch count by fiscal year</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-[1fr_200px] gap-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={yearlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]} name="Revenue ($M)" />
                          <Bar dataKey="launches" fill="#a78bfa" radius={[8, 8, 0, 0]} name="Launches" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {yearlyRevenueData.map(yd => (
                        <div key={yd.year} className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
                          <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{yd.year}</div>
                          <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">${yd.revenue}M</div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400">{yd.launches} launch{yd.launches !== 1 ? "es" : ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                  <CardTitle className="text-emerald-900 dark:text-emerald-100">ML Revenue Forecast</CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">
                    36-month predictive forecast ($M) · Includes holiday impact
                  </CardDescription>
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

            {holidays.length > 0 && (
              <Card className="border-pink-200 dark:border-pink-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950">
                  <CardTitle className="text-pink-900 dark:text-pink-100 flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Key Sales Dates Impact
                  </CardTitle>
                  <CardDescription className="text-pink-700 dark:text-pink-300">Holiday and event revenue multipliers factored into forecasts</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {holidays.filter(h => h.revenueImpactFactor >= 1.15).sort((a, b) => b.revenueImpactFactor - a.revenueImpactFactor).map((h, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-800">
                        <div className="font-semibold text-sm text-pink-900 dark:text-pink-100">{h.name}</div>
                        <div className="text-xs text-pink-700 dark:text-pink-300">
                          {MONTHS[h.month - 1]} {h.day}
                        </div>
                        <div className="text-lg font-bold text-pink-800 dark:text-pink-200 mt-1">
                          +{Math.round((h.revenueImpactFactor - 1) * 100)}%
                        </div>
                        <div className="text-[10px] text-pink-600 dark:text-pink-400 mt-1">{h.notes}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  Competitor Launch Intelligence
                  <Badge className={`text-xs ${competitorDataSource === "snowflake" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                    <Database className="h-3 w-3 mr-1" />
                    {competitorDataSource === "snowflake" ? "Snowflake DYNAMIC_PLANNING_COMPETITOR_LAUNCHES" : "Local Fallback"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  {competitorLaunches.length} launches tracked · Sources: Golf Datatech GTD, PGA Show Intel, Industry Analysts
                </CardDescription>
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
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Source</th>
                        <th className="text-left py-3 px-4 font-semibold text-amber-900 dark:text-amber-100">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {competitorLaunches.map(cl => (
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
                          <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{cl.dataSource || "—"}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={`text-xs ${
                              cl.confidence === "Confirmed" ? "border-emerald-400 text-emerald-700 dark:text-emerald-400" : "border-amber-400 text-amber-700 dark:text-amber-400"
                            }`}>
                              {cl.confidence || "—"}
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
                  <CardDescription className="text-violet-700 dark:text-violet-300">Historical monthly performance with holiday impact</CardDescription>
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
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">Monthly demand multipliers (holiday-adjusted)</CardDescription>
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
                <CardDescription className="text-blue-700 dark:text-blue-300">Optimal timing based on historical data and key sales dates</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {seasonalityData.map(s => {
                    const monthHolidays = holidays.filter(h => h.month === s.month && h.revenueImpactFactor >= 1.15);
                    return (
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
                        {monthHolidays.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {monthHolidays.map((h, hi) => (
                              <div key={hi} className="text-xs flex items-center gap-1 text-pink-700 dark:text-pink-300">
                                <Gift className="h-3 w-3" /> {h.name} (+{Math.round((h.revenueImpactFactor - 1) * 100)}%)
                              </div>
                            ))}
                          </div>
                        )}
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarView
              scheduledTiles={filteredScheduledTiles}
              onSelectProduct={handleOpenProductDetail}
              onDropProduct={handleDrop}
              startYear={currentYear}
            />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950 dark:to-gray-950">
                <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Change Audit Log
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-300">
                  Who made what changes and when · All actions tracked to Snowflake
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {auditLog.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                    No audit entries yet. Changes will be logged automatically when you schedule, reschedule, or save plans.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {auditLog.map((entry, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.action.includes("SAVE") ? "bg-emerald-100 dark:bg-emerald-900" :
                          entry.action.includes("SCHEDULE") ? "bg-indigo-100 dark:bg-indigo-900" :
                          entry.action.includes("REMOVE") || entry.action.includes("DELETE") ? "bg-red-100 dark:bg-red-900" :
                          "bg-blue-100 dark:bg-blue-900"
                        }`}>
                          {entry.action.includes("SAVE") ? <Save className="h-4 w-4 text-emerald-600" /> :
                           entry.action.includes("SCHEDULE") || entry.action.includes("RESCHEDULE") ? <Calendar className="h-4 w-4 text-indigo-600" /> :
                           entry.action.includes("REMOVE") ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                           <Info className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{entry.action.replace(/_/g, " ")}</span>
                            <Badge variant="outline" className="text-xs">{entry.entityType}</Badge>
                          </div>
                          <div className="text-sm text-slate-700 dark:text-slate-300">{entry.entityName || entry.entityId}</div>
                          {entry.comment && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">&quot;{entry.comment}&quot;</div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <User className="h-3 w-3" /> {entry.userName}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-teal-200 dark:border-teal-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
                  <CardTitle className="text-teal-900 dark:text-teal-100 flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Saved Scenarios
                  </CardTitle>
                  <CardDescription className="text-teal-700 dark:text-teal-300">
                    {savedScenarios.length} scenario{savedScenarios.length !== 1 ? "s" : ""} saved · Select two to compare
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {savedScenarios.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                        No saved scenarios yet. Use the sidebar to create scenarios.
                      </p>
                    ) : (
                      savedScenarios.map(scenario => (
                        <div
                          key={scenario.id}
                          className={`p-4 rounded-lg border transition-all ${
                            selectedScenario === scenario.id
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-950"
                              : compareScenarioId === scenario.id
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                                : "border-slate-200 dark:border-slate-700 hover:border-teal-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{scenario.name}</span>
                              {scenario.version && (
                                <Badge variant="outline" className="ml-2 text-xs">v{scenario.version}</Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {selectedScenario === scenario.id ? (
                                <Badge className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">Active</Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-purple-300 text-purple-600"
                                  onClick={() => {
                                    setCompareScenarioId(scenario.id);
                                    loadCompareScenario(scenario.id);
                                  }}
                                >
                                  <GitCompare className="h-3 w-3 mr-1" /> Compare
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <span>${((scenario.totalRevenue || 0) / 1000000).toFixed(1)}M revenue</span>
                            <span>{scenario.scheduledCount || 0} launches</span>
                          </div>
                          {scenario.updatedAt && (
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              Last updated: {new Date(scenario.updatedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <CardTitle className="text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <GitCompare className="h-5 w-5" />
                    Scenario Comparison
                  </CardTitle>
                  <CardDescription className="text-purple-700 dark:text-purple-300">
                    {compareScenarioData
                      ? `Comparing "${savedScenarios.find(s => s.id === selectedScenario)?.name}" vs "${compareScenarioData.name}"`
                      : "Select a scenario to compare against the active plan"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {!compareScenarioData ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                      Click &quot;Compare&quot; on a scenario to see a side-by-side analysis.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-center">
                          <div className="text-xs text-teal-600 dark:text-teal-400 mb-1">Active: {savedScenarios.find(s => s.id === selectedScenario)?.name}</div>
                          <div className="text-xl font-bold text-teal-900 dark:text-teal-100">${(totalProjectedRevenue / 1000000).toFixed(1)}M</div>
                          <div className="text-xs text-teal-700 dark:text-teal-300">{scheduledTiles.length} launches</div>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 text-center">
                          <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Compare: {compareScenarioData.name}</div>
                          <div className="text-xl font-bold text-purple-900 dark:text-purple-100">${(compareScenarioData.revenue / 1000000).toFixed(1)}M</div>
                          <div className="text-xs text-purple-700 dark:text-purple-300">{compareScenarioData.scheduledTiles.length} launches</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Revenue Difference</div>
                        <div className={`text-2xl font-bold ${
                          totalProjectedRevenue - compareScenarioData.revenue > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : totalProjectedRevenue - compareScenarioData.revenue < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-600"
                        }`}>
                          {totalProjectedRevenue - compareScenarioData.revenue > 0 ? "+" : ""}
                          ${((totalProjectedRevenue - compareScenarioData.revenue) / 1000000).toFixed(1)}M
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Timing Differences</div>
                        <div className="space-y-2">
                          {scheduledTiles.map(tile => {
                            const compareTile = compareScenarioData.scheduledTiles.find(t => t.id === tile.id);
                            if (!compareTile || (compareTile.launchMonth === tile.launchMonth && compareTile.launchYear === tile.launchYear)) return null;
                            return (
                              <div key={tile.id} className="text-sm flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{tile.name}</span>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                                    {tile.launchMonth && MONTHS[tile.launchMonth - 1]} {tile.launchYear}
                                  </Badge>
                                  <span className="text-slate-400">→</span>
                                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    {compareTile.launchMonth && MONTHS[compareTile.launchMonth - 1]} {compareTile.launchYear}
                                  </Badge>
                                </div>
                              </div>
                            );
                          }).filter(Boolean)}
                          {compareScenarioData.scheduledTiles.filter(ct => !scheduledTiles.find(t => t.id === ct.id)).map(tile => (
                            <div key={tile.id} className="text-sm flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{tile.name}</span>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge className="bg-slate-100 text-slate-500">Not scheduled</Badge>
                                <span className="text-slate-400">→</span>
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                  {tile.launchMonth && MONTHS[tile.launchMonth - 1]} {tile.launchYear}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {scheduledTiles.filter(t => !compareScenarioData.scheduledTiles.find(ct => ct.id === t.id)).map(tile => (
                            <div key={tile.id} className="text-sm flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{tile.name}</span>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                                  {tile.launchMonth && MONTHS[tile.launchMonth - 1]} {tile.launchYear}
                                </Badge>
                                <span className="text-slate-400">→</span>
                                <Badge className="bg-slate-100 text-slate-500">Not scheduled</Badge>
                              </div>
                            </div>
                          ))}
                          {scheduledTiles.every(tile => {
                            const ct = compareScenarioData.scheduledTiles.find(t => t.id === tile.id);
                            return ct && ct.launchMonth === tile.launchMonth && ct.launchYear === tile.launchYear;
                          }) && compareScenarioData.scheduledTiles.length === scheduledTiles.length && (
                            <p className="text-xs text-slate-500 text-center py-2">No timing differences found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
