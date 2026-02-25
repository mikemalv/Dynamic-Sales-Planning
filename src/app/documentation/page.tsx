"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, BarChart3, Target, Zap, TrendingUp, Package, Home } from "lucide-react";

export default function Documentation() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Dynamic Sales Planning Documentation</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">Understanding how the system works and why it was built this way</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="gap-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="data">Data Model</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Target className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  The Dynamic Sales Planning solution for Top Golf Callaway Brands is a strategic tool designed to enable 
                  multi-year product launch planning. It provides a visual and interactive platform for modeling product launch 
                  scenarios spanning 24+ months, allowing teams to analyze financial and market share impact in real-time.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Problem Solved</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Replaces ad-hoc Excel-based planning with a centralized, data-driven system that moves beyond 
                      single-year planning to enable long-range strategic decisions.
                    </p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Key Users</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Product Strategy and Sales teams, in partnership with Finance, R&D, and Sales leadership for 
                      portfolio-wide strategic planning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                  <Zap className="h-5 w-5" />
                  Why This Approach?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800">1</Badge>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Snowflake-Native Architecture</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Built on Snowflake to leverage existing data infrastructure, AI capabilities, and eliminate data silos.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800">2</Badge>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Real-Time Analytics</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Instant feedback on planning decisions using pre-aggregated views and optimized queries.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800">3</Badge>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Integration-Ready</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Connects to PAT (seasonality), FAT (sell-through), and Golf Data Tech (market intelligence).
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-6">
            <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
                <CardTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-100">
                  <Database className="h-5 w-5" />
                  System Architecture
                </CardTitle>
                <CardDescription className="text-violet-600 dark:text-violet-400">
                  Three-tier architecture leveraging Snowflake, Next.js, and React
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="border-l-4 border-violet-400 pl-4">
                    <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Layer 1: Data Foundation (Snowflake)</h4>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <li>• <strong>Database:</strong> LANDING_CO.FLATFILES</li>
                      <li>• <strong>Tables:</strong> Sales Invoice, Retailer, Forecast, Inventory</li>
                      <li>• <strong>Processing:</strong> Server-side aggregation and calculations</li>
                      <li>• <strong>Security:</strong> OAuth token-based authentication for SPCS deployments</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-indigo-400 pl-4">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Layer 2: API Layer (Next.js)</h4>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <li>• <strong>Technology:</strong> Next.js 16 App Router with TypeScript</li>
                      <li>• <strong>Endpoints:</strong> /api/sales, /api/forecast, /api/inventory, /api/retailer</li>
                      <li>• <strong>Connection:</strong> snowflake-sdk with connection pooling and retry logic</li>
                      <li>• <strong>Deployment:</strong> Standalone build optimized for SPCS</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-400 pl-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Layer 3: Presentation (React)</h4>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <li>• <strong>Framework:</strong> React 19 with client-side rendering</li>
                      <li>• <strong>Components:</strong> shadcn/ui with Tailwind CSS v4</li>
                      <li>• <strong>Visualization:</strong> Recharts 2.15 for interactive charts</li>
                      <li>• <strong>State:</strong> React hooks for data management</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-violet-50 dark:bg-violet-950 p-4 rounded-lg border border-violet-200 dark:border-violet-800 mt-6">
                  <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">Data Flow</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 flex-wrap">
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded border dark:border-slate-700">Snowflake Tables</span>
                    <span>→</span>
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded border dark:border-slate-700">SQL Aggregation</span>
                    <span>→</span>
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded border dark:border-slate-700">API Routes</span>
                    <span>→</span>
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded border dark:border-slate-700">JSON Response</span>
                    <span>→</span>
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded border dark:border-slate-700">React State</span>
                    <span>→</span>
                    <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded border dark:border-slate-700">Visual Dashboard</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="border-amber-200 dark:border-amber-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <Package className="h-5 w-5" />
                  Data Model & Tables
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Sales Invoice</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2"><code>DYNAMIC_PLANNING_SALES_INVOICE</code></p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Invoice tracking by brand, category, family</li>
                      <li>• Strategic account breakdowns</li>
                      <li>• Quantity (eaches and dozens)</li>
                      <li>• Time series: INV_MONTH, INV_YEAR</li>
                    </ul>
                  </div>

                  <div className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Retailer Performance</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2"><code>DYNAMIC_PLANNING_RETAILER</code></p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• On-hand inventory levels</li>
                      <li>• Sell-through forecasts</li>
                      <li>• Budget comparisons</li>
                      <li>• Stock receipts tracking</li>
                    </ul>
                  </div>

                  <div className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Sales Forecast</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2"><code>DYNAMIC_PLANNING_SALES_FORECAST</code></p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Forward-looking projections</li>
                      <li>• Product model forecasts</li>
                      <li>• Revenue and quantity targets</li>
                      <li>• Account-level planning</li>
                    </ul>
                  </div>

                  <div className="border dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">Inventory Status</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2"><code>DYNAMIC_PLANNING_INVENTORY</code></p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Weekly snapshots</li>
                      <li>• Week-over-week comparisons</li>
                      <li>• Stock status indicators</li>
                      <li>• Product family groupings</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Data Integration Points</h4>
                  <div className="grid sm:grid-cols-3 gap-3 mt-3">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">PAT</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Seasonality models from historical launches</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">FAT</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Sell-through data from major retailers</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">Golf Data Tech</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Market share and competitive intelligence</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <Card className="border-rose-200 dark:border-rose-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950">
                <CardTitle className="flex items-center gap-2 text-rose-900 dark:text-rose-100">
                  <TrendingUp className="h-5 w-5" />
                  Core Features & Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-rose-900 dark:text-rose-100 mb-3">Current Phase (v1.0)</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">✓</Badge>
                        <span>Real-time sales vs forecast tracking by category and account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">✓</Badge>
                        <span>Interactive monthly revenue trends with year-over-year comparisons</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">✓</Badge>
                        <span>Retailer performance analysis with budget variance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">✓</Badge>
                        <span>Inventory health monitoring with week-over-week delta</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs">✓</Badge>
                        <span>Dynamic pricing calculations by product type</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Roadmap (Future Phases)</h4>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs bg-purple-50">Next</Badge>
                        <span><strong>Visual Timeline:</strong> Drag-and-drop product launch planning interface</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs bg-purple-50">Next</Badge>
                        <span><strong>Product Tiles:</strong> Rich metadata cards with tier, segment, and tech attributes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs bg-purple-50">Next</Badge>
                        <span><strong>Scenario Modeling:</strong> What-if analysis for launch date shifts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs bg-purple-50">Next</Badge>
                        <span><strong>Market Share Correlation:</strong> Automatic validation against realistic share targets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 text-xs bg-purple-50">Next</Badge>
                        <span><strong>Competitive Intel:</strong> Integration with Golf Data Tech for launch timing insights</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-lg border border-rose-200 dark:border-rose-800 mt-6">
                  <h4 className="font-semibold text-rose-900 dark:text-rose-100 mb-2">Business Rules Engine (Planned)</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    The system will enforce strategic planning guardrails:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• Prevent multiple Tier 1 launches in same category within launch window</li>
                    <li>• Alert on unrealistic revenue/share combinations</li>
                    <li>• Suggest optimal launch timing based on seasonality models</li>
                    <li>• Flag competitive launch conflicts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 rounded-lg border border-blue-300 dark:border-blue-700 shadow-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Next Steps</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            This documentation represents the foundation phase of the Dynamic Sales Planning solution. The current implementation 
            provides essential reporting and analytics. Future phases will introduce the interactive visual timeline, product tile 
            management, and scenario planning capabilities outlined in the original scope of work.
          </p>
        </div>
      </div>
    </div>
  );
}
