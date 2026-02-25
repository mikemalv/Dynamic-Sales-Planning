"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, BookOpen, Calculator, Brain, Trophy, Globe, 
  TrendingUp, AlertTriangle, Calendar, Target, Zap, CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const SEASONALITY_DATA = [
  { season: "🔥 Peak", months: "Jan-Feb", index: "1.85x", impact: "+85%", reason: "PGA Show, New Year buying, pre-season prep" },
  { season: "🌸 Spring", months: "Mar-May", index: "1.45x", impact: "+45%", reason: "Season starts, high golf activity" },
  { season: "🎄 Holiday", months: "Dec", index: "1.25x", impact: "+25%", reason: "Gift buying season" },
  { season: "☀️ Summer", months: "Jun-Aug", index: "1.15x", impact: "+15%", reason: "Moderate activity, vacation season" },
  { season: "🍂 Fall", months: "Sep-Nov", index: "0.95x", impact: "-5%", reason: "End of season, lower demand" },
];

const FEATURES = [
  {
    title: "Visual Timeline Planning",
    icon: Calendar,
    items: [
      "Gantt Chart: See all launches on a timeline",
      "24-48 Month Horizon: Plan multiple years ahead",
      "Product Tiles: Select products from sidebar",
      "Drag & Drop: Move launch dates visually"
    ]
  },
  {
    title: "Scenario Modeling",
    icon: Target,
    items: [
      "4 Scenarios: Base Plan, Aggressive Growth, Conservative, Competitive Response",
      "Compare Strategies: Test different launch approaches",
      "Copy Products: Duplicate plans across scenarios",
      "What-If Analysis: See impact of timing changes"
    ]
  },
  {
    title: "ML-Powered Forecasting",
    icon: Brain,
    items: [
      "Random Forest Model: 84% accuracy (R² = 0.84)",
      "17 Input Features: Tier, category, timing, market, competition",
      "Confidence Intervals: Low/Mid/High estimates",
      "Real-time Predictions: Instant ML forecasts"
    ]
  },
  {
    title: "Competitive Intelligence",
    icon: AlertTriangle,
    items: [
      "15+ Competitor Launches: Titleist, TaylorMade, Ping",
      "Threat Assessment: High/Medium/Low ratings",
      "Market Share Impact: Estimated percentage impact",
      "Timing Analysis: Avoid crowded launch windows"
    ]
  },
];

export default function HowItWorks() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-900 to-teal-900 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  How It Works
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Complete guide to Dynamic Sales Planning</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
            <CardTitle className="text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Purpose
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700 dark:text-slate-300">
              This Dynamic Sales Planning tool helps the <strong>Product Strategy team</strong> plan product launches 
              24-48 months ahead with data-driven insights. It replaces ad-hoc Excel planning with systematic, 
              strategic analysis powered by ML forecasting and competitive intelligence.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardTitle className="text-blue-900 dark:text-blue-300 flex items-center gap-2 text-lg">
                  <feature.icon className="h-5 w-5" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="seasonality" className="space-y-4">
          <TabsList className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-1">
            <TabsTrigger value="seasonality" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
              📊 Seasonality
            </TabsTrigger>
            <TabsTrigger value="scoring" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              🎯 Timing Score
            </TabsTrigger>
            <TabsTrigger value="ml" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              🤖 ML Model
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white">
              📋 Business Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seasonality">
            <Card className="border-amber-200 dark:border-amber-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
                <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Seasonality Index (Revenue Multiplier)
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-400">
                  How much more (or less) revenue you'll generate launching in a specific month vs. average
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-amber-50 dark:bg-amber-900/30">
                        <th className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-left text-amber-900 dark:text-amber-300">Season</th>
                        <th className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-left text-amber-900 dark:text-amber-300">Months</th>
                        <th className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-left text-amber-900 dark:text-amber-300">Index</th>
                        <th className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-left text-amber-900 dark:text-amber-300">Impact</th>
                        <th className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-left text-amber-900 dark:text-amber-300">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SEASONALITY_DATA.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-amber-50/50 dark:bg-amber-900/10"}>
                          <td className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-slate-700 dark:text-slate-300">{row.season}</td>
                          <td className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-slate-700 dark:text-slate-300">{row.months}</td>
                          <td className="border border-amber-200 dark:border-amber-700 px-4 py-2 font-bold text-amber-700 dark:text-amber-400">{row.index}</td>
                          <td className="border border-amber-200 dark:border-amber-700 px-4 py-2 font-bold text-slate-900 dark:text-slate-100">{row.impact}</td>
                          <td className="border border-amber-200 dark:border-amber-700 px-4 py-2 text-slate-600 dark:text-slate-400 text-sm">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <p className="text-amber-900 dark:text-amber-300">
                    <strong>Example:</strong> A $10M product launched in January generates <strong>$18.5M</strong> (1.85x). 
                    The same product in September generates only <strong>$9.5M</strong> (0.95x). That's a <strong>$9M difference!</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scoring">
            <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                <CardTitle className="text-violet-900 dark:text-violet-300 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Optimal Timing Score
                </CardTitle>
                <CardDescription className="text-violet-700 dark:text-violet-400">
                  Formula: (Seasonality × 100) - (Competition × 10)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                    <h4 className="font-semibold text-violet-900 dark:text-violet-300 mb-2">Seasonality × 100</h4>
                    <p className="text-sm text-violet-700 dark:text-violet-400">Base score from timing (max 185 for Jan-Feb)</p>
                  </div>
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                    <h4 className="font-semibold text-violet-900 dark:text-violet-300 mb-2">Competition × 10</h4>
                    <p className="text-sm text-violet-700 dark:text-violet-400">Penalty for each competitor launch nearby</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Examples:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded">
                      <Badge className="bg-emerald-500">185/200</Badge>
                      <span className="text-slate-700 dark:text-slate-300">February, 0 competition: (1.85 × 100) - (0 × 10) = 🏆 Perfect!</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                      <Badge className="bg-blue-500">155/200</Badge>
                      <span className="text-slate-700 dark:text-slate-300">January, 3 competitors: (1.85 × 100) - (3 × 10) = ✅ Good but crowded</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded">
                      <Badge className="bg-amber-500">95/200</Badge>
                      <span className="text-slate-700 dark:text-slate-300">September, 0 competition: (0.95 × 100) - (0 × 10) = ⚠️ Poor timing</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Score Interpretation:</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600">180-200</Badge>
                      <span className="text-slate-700 dark:text-slate-300">🏆 Excellent - Launch here for maximum revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600">150-179</Badge>
                      <span className="text-slate-700 dark:text-slate-300">✅ Very Good - Peak season with some competition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-600">130-149</Badge>
                      <span className="text-slate-700 dark:text-slate-300">✅ Good - Solid choice, spring season</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600">110-129</Badge>
                      <span className="text-slate-700 dark:text-slate-300">⚪ Acceptable - Summer/Holiday, use if needed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600">&lt;110</Badge>
                      <span className="text-slate-700 dark:text-slate-300">⚠️ Avoid - Fall season or too crowded</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ml">
            <Card className="border-blue-200 dark:border-blue-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardTitle className="text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ML Revenue Forecast Model
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-400">
                  Random Forest Regressor with 100 decision trees • R² = 0.84 (84% accuracy)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">17 Input Features:</h4>
                    <ol className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
                      <li>Product Tier (1-5)</li>
                      <li>Category</li>
                      <li>Player Segment</li>
                      <li>Region</li>
                      <li>New Technology</li>
                      <li>Price Point</li>
                      <li>Category Market Size</li>
                      <li>Category Growth Rate</li>
                      <li>Segment Market Size</li>
                      <li>Market Maturity</li>
                      <li>Months Since Launch</li>
                      <li>Seasonality Index</li>
                      <li>Competitive Launches</li>
                      <li>Market Sentiment</li>
                      <li>Economic Indicator</li>
                      <li>Consumer Confidence</li>
                      <li>Golf Participation Trend</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Prediction Output:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Target className="h-4 w-4 text-blue-600" />
                        <strong>Predicted Revenue:</strong> Most likely outcome
                      </li>
                      <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <strong>Low Estimate:</strong> Conservative scenario (-15%)
                      </li>
                      <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <strong>High Estimate:</strong> Optimistic scenario (+15%)
                      </li>
                    </ul>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Example: Mavrik 2026 Driver</h5>
                      <p className="text-sm text-blue-800 dark:text-blue-400">
                        US Market, January 2026<br />
                        Predicted: <strong>$19.1M</strong><br />
                        Low: $16.3M | High: $22.0M
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
                <CardTitle className="text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Business Rules & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border-l-4 border-amber-500">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">🏆 Tier 1 Flagship Spacing Rule</h4>
                  <p className="text-sm text-amber-800 dark:text-amber-400 mb-2">
                    <strong>Rule:</strong> Do not launch two Tier 1 products in the same category within the same quarter.
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    <strong>Why:</strong> Prevents market confusion and revenue cannibalization.<br />
                    <strong>Exception:</strong> Multiple Tier 1 launches in different categories are allowed.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📅 Optimal Launch Window Strategy</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li><strong>Best:</strong> January-February (1.85x multiplier, PGA Merchandise Show timing)</li>
                    <li><strong>Good:</strong> March-May (1.45x multiplier, spring season start)</li>
                    <li><strong>Avoid:</strong> September-November (0.95x multiplier, end of season)</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">⚔️ Competitive Avoidance Strategy</h4>
                  <p className="text-sm text-red-800 dark:text-red-400 mb-2">
                    <strong>Rule:</strong> Avoid launching within 30-60 days of major competitor flagship launches.
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-500">
                    <strong>Example:</strong> TaylorMade launches Qi20 on Jan 20 → Launch Callaway product in February instead.<br />
                    <strong>Impact:</strong> Each nearby competitor launch reduces your market share by ~2-4%.
                  </p>
                </div>

                <div className="p-4 bg-violet-50 dark:bg-violet-900/30 rounded-lg border-l-4 border-violet-500">
                  <h4 className="font-semibold text-violet-900 dark:text-violet-300 mb-2">🌍 Regional Customization</h4>
                  <div className="grid gap-2 text-sm text-violet-800 dark:text-violet-400">
                    <p><strong>US Market:</strong> Largest market, highest revenue potential, most competitive</p>
                    <p><strong>Japan Market:</strong> Strong technology appreciation, premium pricing accepted</p>
                    <p><strong>Europe Market:</strong> Mature market, brand loyalty important</p>
                    <p><strong>APAC Market:</strong> Growing market, price-sensitive, high growth potential</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
            <CardTitle className="text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { step: 1, title: "Select Scenario", desc: "Choose from Base Plan, Aggressive Growth, Conservative, or Competitive Response" },
                { step: 2, title: "Filter by Region", desc: "View all regions or focus on US, Europe, Japan, APAC, or ROW" },
                { step: 3, title: "Select Products", desc: "Expand categories and check products to analyze" },
                { step: 4, title: "Review Dashboard", desc: "See total revenue, launch count, and market share projections" },
                { step: 5, title: "Analyze Timeline", desc: "View Gantt chart, get ML forecasts, check competitor activity" },
                { step: 6, title: "Optimize Timing", desc: "Use seasonality data and scoring to find best launch windows" },
              ].map((item) => (
                <div key={item.step} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button 
            onClick={() => router.push('/')}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
