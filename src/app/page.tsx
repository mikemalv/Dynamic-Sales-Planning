"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Package, ShoppingCart, BarChart3, AlertTriangle, FileText, Calendar, BookOpen, Menu, PieChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";

interface SalesData {
  INV_MONTH: number;
  INV_CATEGORY: string;
  INV_STRATEGIC_ACCOUNT: string;
  TOTAL_QTY: number;
  TOTAL_REVENUE: number;
}

interface ForecastData {
  FCST_MONTH: number;
  FCST_CATEGORY: string;
  FCST_STRATEGIC_ACCOUNT: string;
  TOTAL_FORECAST_QTY: number;
  TOTAL_FORECAST_REVENUE: number;
}

interface InventoryData {
  INVT_CAT_FAMILY: string;
  INVT_PRODUCT_MODEL: string;
  INVT_STOCK: string;
  CURRENT_OH: number;
  LAST_WEEK_OH: number;
  LATEST_DATE: string;
}

interface RetailerData {
  RETAILER: string;
  PRODUCT_MODEL: string;
  AVG_OH_INVENTORY: number;
  TOTAL_RECEIPTS: number;
  AVG_SELL_THRU: number;
  BUDGET_VARIANCE: number;
}

interface IronShareData {
  MANUFACTURER: string;
  MODEL: string;
  SHAFT: string;
  UNIT_SALES: number;
  UNIT_SHARE: string;
  PREV_PD_UNIT_SHARE: string;
  SAME_PD_YAG_UNIT_SHARE: string;
  UNIT_PRICE: string;
  DOLLAR_SHARE: string;
  PREV_PD_DOLLAR_SHARE: string;
  INVENTORY_ON_HAND: number;
  INVENTORY_SHARE: string;
  MONTH_GTD: number;
  YEAR_GTD: number;
  RETAIL_DOLLARS: string;
  FAMILY: string;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const router = useRouter();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [retailerData, setRetailerData] = useState<RetailerData[]>([]);
  const [ironShareData, setIronShareData] = useState<IronShareData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("base");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    sales: true,
    forecast: true,
    inventory: true,
    retailer: true,
    ironShare: true,
  });
  const [errors, setErrors] = useState<{
    sales: string | null;
    forecast: string | null;
    inventory: string | null;
    retailer: string | null;
    ironShare: string | null;
  }>({
    sales: null,
    forecast: null,
    inventory: null,
    retailer: null,
    ironShare: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    async function fetchEndpoint<T>(
      endpoint: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      key: keyof typeof loadingStates
    ) {
      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setter(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error(`Error fetching ${endpoint}:`, err);
          setErrors(prev => ({ ...prev, [key]: (err as Error).message }));
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
      }
    }

    fetchEndpoint("/api/sales", setSalesData, "sales");
    fetchEndpoint("/api/forecast", setForecastData, "forecast");
    fetchEndpoint("/api/inventory", setInventoryData, "inventory");
    fetchEndpoint("/api/retailer", setRetailerData, "retailer");
    fetchEndpoint("/api/iron-share", setIronShareData, "ironShare");

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const loading = loadingStates.sales || loadingStates.forecast || loadingStates.inventory || loadingStates.retailer || loadingStates.ironShare;
  const hasAnyData = salesData.length > 0 || forecastData.length > 0 || inventoryData.length > 0 || retailerData.length > 0 || ironShareData.length > 0;
  const allErrors = Object.values(errors).filter(Boolean).join("; ");
  const hasAllErrors = errors.sales && errors.forecast && errors.inventory && errors.retailer && errors.ironShare;

  const monthlySalesRevenue = salesData.reduce((acc, item) => {
    const existing = acc.find((x) => x.month === item.INV_MONTH);
    if (existing) {
      existing.revenue += item.TOTAL_REVENUE;
      existing.qty += item.TOTAL_QTY;
    } else {
      acc.push({ month: item.INV_MONTH, revenue: item.TOTAL_REVENUE, qty: item.TOTAL_QTY });
    }
    return acc;
  }, [] as { month: number; revenue: number; qty: number }[]).sort((a, b) => a.month - b.month);

  const monthlyForecastRevenue = forecastData.reduce((acc, item) => {
    const existing = acc.find((x) => x.month === item.FCST_MONTH);
    if (existing) {
      existing.revenue += item.TOTAL_FORECAST_REVENUE;
    } else {
      acc.push({ month: item.FCST_MONTH, revenue: item.TOTAL_FORECAST_REVENUE });
    }
    return acc;
  }, [] as { month: number; revenue: number }[]).sort((a, b) => a.month - b.month);

  const combinedMonthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const salesItem = monthlySalesRevenue.find((s) => s.month === monthNum);
    const forecastItem = monthlyForecastRevenue.find((f) => f.month === monthNum);
    return {
      month: monthNames[i],
      actual: salesItem ? Math.round(salesItem.revenue / 1000) : null,
      forecast: forecastItem ? Math.round(forecastItem.revenue / 1000) : null,
    };
  });

  const categorySales = salesData.reduce((acc, item) => {
    const existing = acc.find((x) => x.category === item.INV_CATEGORY);
    if (existing) {
      existing.revenue += item.TOTAL_REVENUE;
    } else {
      acc.push({ category: item.INV_CATEGORY, revenue: item.TOTAL_REVENUE });
    }
    return acc;
  }, [] as { category: string; revenue: number }[])
    .sort((a, b) => b.revenue - a.revenue)
    .map((item) => ({ ...item, revenue: Math.round(item.revenue / 1000) }));

  const totalSalesRevenue = monthlySalesRevenue.reduce((sum, item) => sum + item.revenue, 0);
  const totalSalesQty = monthlySalesRevenue.reduce((sum, item) => sum + item.qty, 0);
  const lowStockItems = inventoryData.filter((item) => item.INVT_STOCK === "Low Stock");

  const chartConfig = {
    actual: {
      label: "Actual Sales",
      color: "#3b82f6",
    },
    forecast: {
      label: "Forecast",
      color: "#8b5cf6",
    },
  };

  if (loading && !hasAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="container mx-auto px-6 py-5">
            <div className="flex items-center gap-3">
              <Link href="/" className="cursor-pointer">
                <Image
                  src="/callaway-logo.svg"
                  alt="Callaway Golf"
                  width={120}
                  height={69}
                  className="h-10 w-auto dark:invert"
                  priority
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                  Dynamic Sales Planning
                </h1>
                <p className="text-sm text-slate-600">Loading data...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-blue-200">
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasAllErrors && !hasAnyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Data Loading Error
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700 mb-4">{allErrors}</p>
            <p className="text-sm text-slate-600 mb-4">
              This usually happens when the Snowflake connection requires authentication. Please ensure your Snowflake 
              credentials are properly configured.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Image
                src="/callaway-logo.svg"
                alt="Callaway Golf"
                width={120}
                height={69}
                className="h-10 w-auto dark:invert"
                priority
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Dynamic Sales Planning
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Strategic forecasting & portfolio management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="hidden sm:flex bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700 px-4 py-2 font-semibold shadow-sm">
                Jan 2024 - Jan 2026
              </Badge>
              <Button 
                variant="default" 
                onClick={() => router.push('/planning')}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Strategic Planning</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/how-it-works')}
                className="gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">How It Works</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/documentation')}
                className="gap-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Docs</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Revenue</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">${(totalSalesRevenue / 1000000).toFixed(2)}M</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                Year to date performance
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Units Sold</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalSalesQty.toLocaleString()}</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Total units shipped</p>
            </CardContent>
          </Card>

          <Card className="border-violet-200 dark:border-violet-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-violet-50 dark:from-slate-900 dark:to-violet-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Retail Partners</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {new Set(salesData.map((s) => s.INV_STRATEGIC_ACCOUNT)).size}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Active strategic accounts</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-amber-50 dark:from-slate-900 dark:to-amber-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Stock Alerts</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{lowStockItems.length}</div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Items requiring attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 shadow-sm border border-blue-200 dark:border-slate-700 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="retailers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Retailers
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="forecast" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              Forecast
            </TabsTrigger>
            <TabsTrigger value="market-share" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              Market Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <CardTitle className="text-blue-900 dark:text-blue-100">Sales vs Forecast</CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">Monthly revenue comparison ($K)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={chartConfig} className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedMonthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey="month" className="fill-slate-500 dark:fill-slate-400" fontSize={12} />
                        <YAxis className="fill-slate-500 dark:fill-slate-400" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} name="Actual Sales" />
                        <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: "#8b5cf6", r: 4 }} name="Forecast" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                  <CardTitle className="text-emerald-900 dark:text-emerald-100">Revenue by Category</CardTitle>
                  <CardDescription className="text-emerald-700 dark:text-emerald-300">Performance breakdown ($K)</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={{}} className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categorySales}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey="category" className="fill-slate-500 dark:fill-slate-400" fontSize={11} angle={-45} textAnchor="end" height={80} />
                        <YAxis className="fill-slate-500 dark:fill-slate-400" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle className="text-violet-900 dark:text-violet-100">Top Performing Accounts</CardTitle>
                <CardDescription className="text-violet-700 dark:text-violet-300">Strategic retail partner performance</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-violet-50 dark:bg-violet-950">
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100">Account</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Category</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Revenue</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Units</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData
                      .sort((a, b) => b.TOTAL_REVENUE - a.TOTAL_REVENUE)
                      .slice(0, 8)
                      .map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-violet-50 dark:hover:bg-violet-950">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{item.INV_STRATEGIC_ACCOUNT}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="bg-violet-50 dark:bg-violet-900 text-violet-900 dark:text-violet-100 border-violet-300 dark:border-violet-700">
                              {item.INV_CATEGORY}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                            ${(item.TOTAL_REVENUE / 1000).toFixed(1)}K
                          </TableCell>
                          <TableCell className="text-right text-slate-700 dark:text-slate-300">{item.TOTAL_QTY.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retailers" className="space-y-6">
            <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle className="text-violet-900 dark:text-violet-100">Retailer Performance Dashboard</CardTitle>
                <CardDescription className="text-violet-700 dark:text-violet-300">Inventory, receipts, and budget analysis</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-violet-50 dark:bg-violet-950">
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100">Retailer</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100">Model</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Avg Inventory</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Total Receipts</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Sell-Through</TableHead>
                      <TableHead className="font-semibold text-violet-900 dark:text-violet-100 text-right">Budget Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retailerData.slice(0, 10).map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-violet-50 dark:hover:bg-violet-950">
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">{item.RETAILER}</TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{item.PRODUCT_MODEL}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300">{Math.round(item.AVG_OH_INVENTORY)}</TableCell>
                        <TableCell className="text-right text-slate-700 dark:text-slate-300">{Math.round(item.TOTAL_RECEIPTS)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`${
                            item.AVG_SELL_THRU > 75 ? "bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700" :
                            item.AVG_SELL_THRU > 50 ? "bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700" :
                            "bg-amber-50 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700"
                          }`}>
                            {item.AVG_SELL_THRU.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.BUDGET_VARIANCE >= 0 ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {item.BUDGET_VARIANCE.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-red-700 dark:text-red-400 font-semibold flex items-center justify-end gap-1">
                              <TrendingDown className="h-3 w-3" />
                              {Math.abs(item.BUDGET_VARIANCE).toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <CardTitle className="text-emerald-900 dark:text-emerald-100">Inventory Health Monitor</CardTitle>
                <CardDescription className="text-emerald-700 dark:text-emerald-300">Current stock levels and week-over-week changes</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-emerald-50 dark:bg-emerald-950">
                      <TableHead className="font-semibold text-emerald-900 dark:text-emerald-100">Product Family</TableHead>
                      <TableHead className="font-semibold text-emerald-900 dark:text-emerald-100">Model</TableHead>
                      <TableHead className="font-semibold text-emerald-900 dark:text-emerald-100 text-right">Current OH</TableHead>
                      <TableHead className="font-semibold text-emerald-900 dark:text-emerald-100 text-right">Last Week</TableHead>
                      <TableHead className="font-semibold text-emerald-900 dark:text-emerald-100 text-right">Change</TableHead>
                      <TableHead className="font-semibold text-emerald-900 dark:text-emerald-100">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.slice(0, 12).map((item, idx) => {
                      const change = item.CURRENT_OH - item.LAST_WEEK_OH;
                      const changePercent = item.LAST_WEEK_OH !== 0 ? (change / item.LAST_WEEK_OH) * 100 : 0;
                      return (
                        <TableRow key={idx} className="hover:bg-emerald-50 dark:hover:bg-emerald-950">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{item.INVT_CAT_FAMILY}</TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 text-sm">{item.INVT_PRODUCT_MODEL}</TableCell>
                          <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">{item.CURRENT_OH}</TableCell>
                          <TableCell className="text-right text-slate-600 dark:text-slate-400">{item.LAST_WEEK_OH}</TableCell>
                          <TableCell className="text-right">
                            {change >= 0 ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +{change} ({changePercent.toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="text-red-700 dark:text-red-400 font-semibold flex items-center justify-end gap-1">
                                <TrendingDown className="h-3 w-3" />
                                {change} ({changePercent.toFixed(1)}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${
                              item.INVT_STOCK === "In Stock" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700" :
                              item.INVT_STOCK === "Low Stock" ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700" :
                              "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"
                            }`}>
                              {item.INVT_STOCK}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <Card className="border-amber-200 dark:border-amber-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                <CardTitle className="text-amber-900 dark:text-amber-100">Forward-Looking Projections</CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">Strategic planning and demand forecasting</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-amber-50 dark:bg-amber-950">
                      <TableHead className="font-semibold text-amber-900 dark:text-amber-100">Month</TableHead>
                      <TableHead className="font-semibold text-amber-900 dark:text-amber-100">Category</TableHead>
                      <TableHead className="font-semibold text-amber-900 dark:text-amber-100">Account</TableHead>
                      <TableHead className="font-semibold text-amber-900 dark:text-amber-100 text-right">Forecast Qty</TableHead>
                      <TableHead className="font-semibold text-amber-900 dark:text-amber-100 text-right">Forecast Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecastData
                      .sort((a, b) => a.FCST_MONTH - b.FCST_MONTH || b.TOTAL_FORECAST_REVENUE - a.TOTAL_FORECAST_REVENUE)
                      .slice(0, 10)
                      .map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-amber-50 dark:hover:bg-amber-950">
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{monthNames[item.FCST_MONTH - 1]}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700">
                              {item.FCST_CATEGORY}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">{item.FCST_STRATEGIC_ACCOUNT}</TableCell>
                          <TableCell className="text-right text-slate-700 dark:text-slate-300">{item.TOTAL_FORECAST_QTY.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                            ${(item.TOTAL_FORECAST_REVENUE / 1000).toFixed(1)}K
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market-share" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-rose-200 dark:border-rose-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-rose-50 dark:from-slate-900 dark:to-rose-950">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Callaway Unit Share</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {ironShareData.filter(d => d.MANUFACTURER === 'Callaway').slice(-1)[0]?.UNIT_SHARE || 'N/A'}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    Combined Callaway brands
                  </p>
                </CardContent>
              </Card>

              <Card className="border-pink-200 dark:border-pink-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-pink-50 dark:from-slate-900 dark:to-pink-950">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Iron Units</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {ironShareData.reduce((sum, d) => sum + (d.UNIT_SALES || 0), 0).toLocaleString()}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">All manufacturers GTD</p>
                </CardContent>
              </Card>

              <Card className="border-fuchsia-200 dark:border-fuchsia-800 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-fuchsia-50 dark:from-slate-900 dark:to-fuchsia-950">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Market Leaders</CardTitle>
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {new Set(ironShareData.map(d => d.MANUFACTURER)).size}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Competing manufacturers</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-rose-200 dark:border-rose-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
                <CardTitle className="text-rose-900 dark:text-rose-100">Iron Market Share Analysis</CardTitle>
                <CardDescription className="text-rose-700 dark:text-rose-300">Competitive landscape by manufacturer and model</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-rose-50 dark:bg-rose-950">
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100">Manufacturer</TableHead>
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100">Model</TableHead>
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100 text-right">Unit Sales</TableHead>
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100 text-right">Unit Share</TableHead>
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100 text-right">vs Prev Period</TableHead>
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100 text-right">Dollar Share</TableHead>
                      <TableHead className="font-semibold text-rose-900 dark:text-rose-100 text-right">Inventory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ironShareData
                      .sort((a, b) => b.UNIT_SALES - a.UNIT_SALES)
                      .slice(0, 12)
                      .map((item, idx) => {
                        const currentShare = parseFloat(item.UNIT_SHARE?.replace('%', '') || '0');
                        const prevShare = parseFloat(item.PREV_PD_UNIT_SHARE?.replace('%', '') || '0');
                        const shareDiff = currentShare - prevShare;
                        return (
                          <TableRow key={idx} className="hover:bg-rose-50 dark:hover:bg-rose-950">
                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                              <Badge className={`${
                                item.MANUFACTURER === 'Callaway' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                              }`}>
                                {item.MANUFACTURER}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{item.MODEL}</TableCell>
                            <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">{item.UNIT_SALES?.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="bg-rose-50 dark:bg-rose-900 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700">
                                {item.UNIT_SHARE}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {shareDiff >= 0 ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  +{shareDiff.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-red-700 dark:text-red-400 font-semibold flex items-center justify-end gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  {shareDiff.toFixed(1)}%
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">{item.DOLLAR_SHARE}</TableCell>
                            <TableCell className="text-right text-slate-700 dark:text-slate-300">{item.INVENTORY_ON_HAND?.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-pink-200 dark:border-pink-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-950 dark:to-fuchsia-950">
                  <CardTitle className="text-pink-900 dark:text-pink-100">Unit Share by Manufacturer</CardTitle>
                  <CardDescription className="text-pink-700 dark:text-pink-300">Latest period market distribution</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={{}} className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={
                        Object.entries(
                          ironShareData.reduce((acc, item) => {
                            if (!acc[item.MANUFACTURER]) acc[item.MANUFACTURER] = 0;
                            acc[item.MANUFACTURER] += item.UNIT_SALES || 0;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([name, value]) => ({ name, units: value }))
                        .sort((a, b) => b.units - a.units)
                      }>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey="name" className="fill-slate-500 dark:fill-slate-400" fontSize={11} />
                        <YAxis className="fill-slate-500 dark:fill-slate-400" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="units" fill="url(#roseGradient)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#ec4899" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-fuchsia-200 dark:border-fuchsia-800 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-fuchsia-50 to-purple-50 dark:from-fuchsia-950 dark:to-purple-950">
                  <CardTitle className="text-fuchsia-900 dark:text-fuchsia-100">Monthly Trend</CardTitle>
                  <CardDescription className="text-fuchsia-700 dark:text-fuchsia-300">Callaway vs competition over time</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChartContainer config={{}} className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={
                        Array.from(new Set(ironShareData.map(d => d.MONTH_GTD))).sort((a, b) => a - b).map(month => {
                          const monthData = ironShareData.filter(d => d.MONTH_GTD === month);
                          const callaway = monthData.filter(d => d.MANUFACTURER === 'Callaway').reduce((sum, d) => sum + (d.UNIT_SALES || 0), 0);
                          const others = monthData.filter(d => d.MANUFACTURER !== 'Callaway').reduce((sum, d) => sum + (d.UNIT_SALES || 0), 0);
                          return { month: monthNames[month - 1], callaway, others };
                        })
                      }>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                        <XAxis dataKey="month" className="fill-slate-500 dark:fill-slate-400" fontSize={12} />
                        <YAxis className="fill-slate-500 dark:fill-slate-400" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="callaway" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} name="Callaway" />
                        <Line type="monotone" dataKey="others" stroke="#f43f5e" strokeWidth={3} dot={{ fill: "#f43f5e", r: 4 }} name="Competitors" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
