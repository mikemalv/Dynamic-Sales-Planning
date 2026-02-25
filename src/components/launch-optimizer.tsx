"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ProductTile } from "@/types/planning"
import { SEASONALITY_DATA, COMPETITOR_LAUNCHES, TIER_LABELS } from "@/lib/planning-data"
import { Sparkles, TrendingUp, AlertTriangle, Calendar, Target, Zap, ChevronDown, ChevronUp, Brain, Loader2 } from "lucide-react"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface LaunchOptimizerProps {
  product: ProductTile | null
  onSelectMonth: (month: number, year: number) => void
  startYear: number
}

interface MonthScore {
  month: number
  year: number
  label: string
  overallScore: number
  seasonalityScore: number
  competitorScore: number
  revenueProjection: number
  marketShareProjection: number
  confidence: number
  recommendation: "optimal" | "good" | "fair" | "avoid"
  factors: string[]
  mlPrediction?: number
}

interface MLPrediction {
  PREDICTION: number
  month: number
  year: number
  confidence: number
}

export function LaunchOptimizer({ product, onSelectMonth, startYear }: LaunchOptimizerProps) {
  const [seasonalityWeight, setSeasonalityWeight] = useState(40)
  const [competitorWeight, setCompetitorWeight] = useState(25)
  const [marketShareWeight, setMarketShareWeight] = useState(15)
  const [mlWeight, setMlWeight] = useState(20)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [planningMonths, setPlanningMonths] = useState(24)
  const [mlPredictions, setMlPredictions] = useState<MLPrediction[]>([])
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState<string | null>(null)
  const [useMLModel, setUseMLModel] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMLPredictions() {
      if (!useMLModel) return
      
      setMlLoading(true)
      setMlError(null)
      
      try {
        const response = await fetch('/api/ml-forecast')
        if (!response.ok) throw new Error('Failed to fetch ML predictions')
        
        const data = await response.json()
        setMlPredictions(data.predictions || [])
      } catch (err) {
        console.error('ML Prediction error:', err)
        setMlError('Could not load ML model predictions')
        setUseMLModel(false)
      } finally {
        setMlLoading(false)
      }
    }
    
    fetchMLPredictions()
  }, [useMLModel])

  const monthScores = useMemo(() => {
    if (!product) return []

    const scores: MonthScore[] = []
    const maxMLPrediction = Math.max(...mlPredictions.map(p => p.PREDICTION), 1)
    
    for (let i = 0; i < planningMonths; i++) {
      const month = (i % 12) + 1
      const year = startYear + Math.floor(i / 12)
      
      const seasonData = SEASONALITY_DATA.find(s => s.month === month)!
      const seasonalityScore = seasonData.seasonalFactor * 100
      
      const nearbyCompetitors = COMPETITOR_LAUNCHES.filter(c => {
        const compMonthIndex = (c.year - startYear) * 12 + c.month - 1
        const thisMonthIndex = i
        return c.category === product.category && 
               Math.abs(compMonthIndex - thisMonthIndex) <= 2
      })
      
      let competitorScore = 100
      nearbyCompetitors.forEach(c => {
        if (c.estimatedImpact === "High") competitorScore -= 35
        else if (c.estimatedImpact === "Medium") competitorScore -= 20
        else competitorScore -= 10
      })
      competitorScore = Math.max(0, competitorScore)
      
      const tierBonus = product.tier === 1 ? 1.2 : product.tier === 2 ? 1.1 : 1.0
      const techBonus = product.hasNewTech ? 1.15 : 1.0
      const marketShareScore = (product.projectedShare.mid / 25) * 100 * tierBonus * techBonus
      
      const mlPrediction = mlPredictions.find(p => p.month === month && p.year === year)
      const mlScore = mlPrediction 
        ? (mlPrediction.PREDICTION / maxMLPrediction) * 100 * tierBonus
        : seasonalityScore
      
      const totalWeight = seasonalityWeight + competitorWeight + marketShareWeight + (useMLModel ? mlWeight : 0)
      const overallScore = useMLModel
        ? (
            (seasonalityScore * seasonalityWeight) +
            (competitorScore * competitorWeight) +
            (marketShareScore * marketShareWeight) +
            (mlScore * mlWeight)
          ) / totalWeight
        : (
            (seasonalityScore * seasonalityWeight) +
            (competitorScore * competitorWeight) +
            (marketShareScore * marketShareWeight)
          ) / (seasonalityWeight + competitorWeight + marketShareWeight)
      
      const baseRevenue = mlPrediction?.PREDICTION 
        ? mlPrediction.PREDICTION * tierBonus * techBonus
        : product.projectedRevenue.mid * seasonData.seasonalFactor
      
      const revenueProjection = baseRevenue * (competitorScore / 100)
      
      const marketShareProjection = product.projectedShare.mid * 
        (competitorScore / 100) * 
        (seasonData.optimalForLaunch ? 1.1 : 0.95)
      
      const baseConfidence = mlPrediction?.confidence ?? 0.75
      const confidence = baseConfidence - (i * 0.008)
      
      const factors: string[] = []
      if (mlPrediction && useMLModel) factors.push("ML model prediction")
      if (seasonData.optimalForLaunch) factors.push("Peak launch window")
      if (seasonData.seasonalFactor > 1.2) factors.push("Strong seasonal demand")
      if (seasonData.seasonalFactor < 0.9) factors.push("Low season - reduced demand")
      if (nearbyCompetitors.length > 0) {
        factors.push(`${nearbyCompetitors.length} competitor launch${nearbyCompetitors.length > 1 ? 'es' : ''} nearby`)
      }
      if (competitorScore === 100) factors.push("Clear competitive window")
      if (product.tier === 1 && month <= 3) factors.push("Flagship timing optimal")
      
      let recommendation: "optimal" | "good" | "fair" | "avoid"
      if (overallScore >= 110) recommendation = "optimal"
      else if (overallScore >= 90) recommendation = "good"
      else if (overallScore >= 70) recommendation = "fair"
      else recommendation = "avoid"
      
      scores.push({
        month,
        year,
        label: `${MONTHS[month - 1]} ${year}`,
        overallScore,
        seasonalityScore,
        competitorScore,
        revenueProjection,
        marketShareProjection,
        confidence: Math.max(0.5, confidence),
        recommendation,
        factors,
        mlPrediction: mlPrediction?.PREDICTION,
      })
    }
    
    return scores.sort((a, b) => b.overallScore - a.overallScore)
  }, [product, seasonalityWeight, competitorWeight, marketShareWeight, mlWeight, planningMonths, startYear, mlPredictions, useMLModel])

  const topRecommendations = monthScores.slice(0, 5)
  const optimalMonth = monthScores[0]

  if (!product) {
    return (
      <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
          <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Snowflake ML Launch Optimizer
          </CardTitle>
          <CardDescription className="text-indigo-700 dark:text-indigo-300">
            Powered by SALES_QUANTITY_PREDICTOR model from Snowflake Model Registry
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
            <Target className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              Select a product to get ML-powered launch timing recommendations
            </p>
            {mlLoading && (
              <div className="mt-4 flex items-center gap-2 text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading ML model...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-indigo-200 dark:border-indigo-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Snowflake ML Optimizer
            </CardTitle>
            <CardDescription className="text-indigo-700 dark:text-indigo-300">
              {product.name} • Model: SALES_QUANTITY_PREDICTOR
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {mlLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
            {useMLModel && !mlLoading && !mlError && (
              <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs">
                <Brain className="h-3 w-3 mr-1" />
                ML Active
              </Badge>
            )}
            <Badge 
              className="text-xs"
              style={{ backgroundColor: `${product.color}20`, color: product.color, borderColor: product.color }}
            >
              {TIER_LABELS[product.tier]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {mlError && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {mlError} - Using rule-based predictions
          </div>
        )}

        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimal Launch Window
            </span>
            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              {Math.round(optimalMonth?.confidence * 100)}% confidence
            </Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {optimalMonth?.label}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-emerald-600 dark:text-emerald-400">Projected Revenue:</span>
              <span className="ml-2 font-semibold text-emerald-900 dark:text-emerald-100">
                ${(optimalMonth?.revenueProjection / 1000000).toFixed(1)}M
              </span>
            </div>
            <div>
              <span className="text-emerald-600 dark:text-emerald-400">Market Share:</span>
              <span className="ml-2 font-semibold text-emerald-900 dark:text-emerald-100">
                {optimalMonth?.marketShareProjection.toFixed(1)}%
              </span>
            </div>
          </div>
          {optimalMonth?.mlPrediction && (
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Brain className="h-3 w-3" />
              ML Revenue Prediction: ${(optimalMonth.mlPrediction / 1000000).toFixed(2)}M
            </div>
          )}
          <Button
            onClick={() => optimalMonth && onSelectMonth(optimalMonth.month, optimalMonth.year)}
            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule for {optimalMonth?.label}
          </Button>
        </div>

        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Adjust Model Weights
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Use Snowflake ML Model</span>
                <button
                  onClick={() => setUseMLModel(!useMLModel)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    useMLModel ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    useMLModel ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {useMLModel && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      ML Model Weight
                    </span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">{mlWeight}%</span>
                  </div>
                  <Slider
                    value={[mlWeight]}
                    onValueChange={([v]) => setMlWeight(v)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Seasonality Impact</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{seasonalityWeight}%</span>
                </div>
                <Slider
                  value={[seasonalityWeight]}
                  onValueChange={([v]) => setSeasonalityWeight(v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Competitor Avoidance</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{competitorWeight}%</span>
                </div>
                <Slider
                  value={[competitorWeight]}
                  onValueChange={([v]) => setCompetitorWeight(v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Market Share Priority</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{marketShareWeight}%</span>
                </div>
                <Slider
                  value={[marketShareWeight]}
                  onValueChange={([v]) => setMarketShareWeight(v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Planning Horizon</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{planningMonths} months</span>
                </div>
                <Slider
                  value={[planningMonths]}
                  onValueChange={([v]) => setPlanningMonths(v)}
                  min={12}
                  max={48}
                  step={6}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Launch Window Recommendations
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Click any card for detailed analysis
          </p>
          <div className="space-y-2">
            {topRecommendations.map((rec, idx) => {
              const cardKey = `${rec.month}-${rec.year}`
              const isExpanded = expandedCard === cardKey
              
              const getRecommendationExplanation = () => {
                const explanations: string[] = []
                const positives: string[] = []
                const negatives: string[] = []
                const neutrals: string[] = []
                
                if (rec.seasonalityScore > 120) {
                  positives.push(`Strong seasonal demand (${rec.seasonalityScore.toFixed(0)}% of average) - Golf equipment sales peak during this period as golfers prepare for the season.`)
                } else if (rec.seasonalityScore > 100) {
                  positives.push(`Above-average seasonal demand (${rec.seasonalityScore.toFixed(0)}%) - Moderate consumer interest in golf equipment.`)
                } else if (rec.seasonalityScore < 85) {
                  negatives.push(`Low seasonal demand (${rec.seasonalityScore.toFixed(0)}% of average) - Off-season with reduced consumer spending on golf equipment.`)
                } else {
                  neutrals.push(`Average seasonal demand (${rec.seasonalityScore.toFixed(0)}%) - Typical consumer interest level.`)
                }
                
                if (rec.competitorScore === 100) {
                  positives.push("Clear competitive window - No major competitor launches within 2 months, maximizing market attention for your product.")
                } else if (rec.competitorScore >= 80) {
                  neutrals.push(`Moderate competition (${rec.competitorScore.toFixed(0)}% clear) - Some competitor activity nearby but manageable.`)
                } else if (rec.competitorScore >= 60) {
                  negatives.push(`Crowded market window (${rec.competitorScore.toFixed(0)}% clear) - Multiple competitor launches may dilute consumer attention.`)
                } else {
                  negatives.push(`Highly competitive period (${rec.competitorScore.toFixed(0)}% clear) - Major competitor launches will likely overshadow new entries.`)
                }
                
                if (rec.mlPrediction && useMLModel) {
                  const mlRevenue = rec.mlPrediction / 1000000
                  if (mlRevenue > 50) {
                    positives.push(`ML model predicts strong revenue potential (${mlRevenue.toFixed(1)}M) based on historical patterns and market conditions.`)
                  } else if (mlRevenue > 30) {
                    neutrals.push(`ML model predicts moderate revenue (${mlRevenue.toFixed(1)}M) - Solid performance expected.`)
                  } else {
                    negatives.push(`ML model predicts lower revenue potential (${mlRevenue.toFixed(1)}M) - Consider timing optimization.`)
                  }
                }
                
                if (rec.month >= 1 && rec.month <= 3) {
                  positives.push("Q1 Launch Advantage - Early year launches capture pre-season buyers and build momentum before peak golf season.")
                } else if (rec.month >= 4 && rec.month <= 5) {
                  positives.push("Peak Season Timing - Launches during April-May align with golf season start in most markets.")
                } else if (rec.month >= 6 && rec.month <= 8) {
                  negatives.push("Mid-Season Entry - Launching mid-season means competing with established products and missing early-season demand.")
                } else if (rec.month >= 9 && rec.month <= 10) {
                  neutrals.push("End-of-Season Window - Good for building awareness before next year, but immediate sales may be limited.")
                } else {
                  negatives.push("Off-Season Launch - Holiday period sees reduced golf equipment focus; consider Q1 for better impact.")
                }
                
                if (rec.confidence > 0.7) {
                  positives.push(`High prediction confidence (${Math.round(rec.confidence * 100)}%) - Strong historical data supports this forecast.`)
                } else if (rec.confidence < 0.55) {
                  neutrals.push(`Lower confidence (${Math.round(rec.confidence * 100)}%) - Further out predictions have more uncertainty.`)
                }
                
                return { positives, negatives, neutrals }
              }
              
              const { positives, negatives, neutrals } = getRecommendationExplanation()
              
              return (
                <div
                  key={cardKey}
                  className={`rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    rec.recommendation === "optimal" 
                      ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800" 
                      : rec.recommendation === "good"
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      : rec.recommendation === "fair"
                      ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
                      : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div 
                    className="p-3"
                    onClick={() => setExpandedCard(isExpanded ? null : cardKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            {rec.label}
                            {rec.mlPrediction && useMLModel && (
                              <Brain className="h-3 w-3 text-indigo-500" />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Score: {rec.overallScore.toFixed(0)} | Rev: ${(rec.revenueProjection / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${
                          rec.recommendation === "optimal" 
                            ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200" 
                            : rec.recommendation === "good"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : rec.recommendation === "fair"
                            ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                            : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        }`}>
                          {rec.recommendation}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>
                    {!isExpanded && rec.factors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.factors.slice(0, 3).map((factor, i) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded ${
                            factor.includes("ML") 
                              ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300" 
                              : "bg-white/50 dark:bg-black/20 text-slate-600 dark:text-slate-400"
                          }`}>
                            {factor}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="pt-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-white/50 dark:bg-black/20">
                            <div className="text-slate-500 dark:text-slate-400">Seasonality</div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{rec.seasonalityScore.toFixed(0)}%</div>
                          </div>
                          <div className="p-2 rounded bg-white/50 dark:bg-black/20">
                            <div className="text-slate-500 dark:text-slate-400">Competition</div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{rec.competitorScore.toFixed(0)}%</div>
                          </div>
                          <div className="p-2 rounded bg-white/50 dark:bg-black/20">
                            <div className="text-slate-500 dark:text-slate-400">Confidence</div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{Math.round(rec.confidence * 100)}%</div>
                          </div>
                        </div>
                        
                        {positives.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                              <TrendingUp className="h-3 w-3" />
                              Why this is a good choice:
                            </div>
                            <ul className="space-y-1">
                              {positives.map((p, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-emerald-500">
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {negatives.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                              <AlertTriangle className="h-3 w-3" />
                              Considerations:
                            </div>
                            <ul className="space-y-1">
                              {negatives.map((n, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-red-500">
                                  {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {neutrals.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              <Target className="h-3 w-3" />
                              Additional factors:
                            </div>
                            <ul className="space-y-1">
                              {neutrals.map((n, i) => (
                                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-slate-400">
                                  {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectMonth(rec.month, rec.year)
                          }}
                          size="sm"
                          className={`w-full mt-2 ${
                            rec.recommendation === "optimal" 
                              ? "bg-emerald-600 hover:bg-emerald-700" 
                              : rec.recommendation === "good"
                              ? "bg-blue-600 hover:bg-blue-700"
                              : rec.recommendation === "fair"
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule for {rec.label}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
          <div className="flex items-start gap-2">
            <Brain className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Powered by Snowflake ML:</strong> Using SALES_QUANTITY_PREDICTOR model from 
              LANDING.FLATFILES registered in Snowflake Model Registry. 
              Predictions combine ML forecasts with seasonality, competitor analysis, and market data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
