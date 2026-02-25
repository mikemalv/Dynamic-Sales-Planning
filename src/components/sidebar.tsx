"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, RefreshCw, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const SCENARIOS = [
  { id: "base", name: "Base Plan", description: "Current default strategy" },
  { id: "aggressive", name: "Aggressive Growth", description: "Earlier launches, higher risk" },
  { id: "conservative", name: "Conservative", description: "Later launches, lower risk" },
  { id: "competitive", name: "Competitive Response", description: "Reactive to competitors" },
]

const REGIONS = [
  { id: "all", name: "All Regions" },
  { id: "us", name: "United States" },
  { id: "europe", name: "Europe" },
  { id: "japan", name: "Japan" },
  { id: "apac", name: "Asia Pacific" },
  { id: "row", name: "Rest of World" },
]

const PRODUCT_CATEGORIES = [
  {
    name: "Drivers",
    products: [
      { id: "paradym-ai", name: "Paradym Ai Smoke", tier: "Tier 1" },
      { id: "mavrik-2026", name: "Mavrik 2026", tier: "Tier 1" },
      { id: "rogue-st-max", name: "Rogue ST Max", tier: "Tier 2" },
    ]
  },
  {
    name: "Irons",
    products: [
      { id: "apex-pro", name: "Apex Pro 2026", tier: "Tier 1" },
      { id: "paradym-irons", name: "Paradym Irons", tier: "Tier 2" },
      { id: "big-bertha", name: "Big Bertha Irons", tier: "Tier 3" },
    ]
  },
  {
    name: "Wedges",
    products: [
      { id: "jaws-raw", name: "Jaws Raw", tier: "Tier 1" },
      { id: "jaws-full-toe", name: "Jaws Full Toe", tier: "Tier 2" },
      { id: "mack-daddy", name: "Mack Daddy CB", tier: "Tier 3" },
    ]
  },
  {
    name: "Putters",
    products: [
      { id: "odyssey-ai", name: "Odyssey Ai-One", tier: "Tier 1" },
      { id: "triple-track", name: "Triple Track Ten", tier: "Tier 2" },
      { id: "white-hot", name: "White Hot OG", tier: "Tier 2" },
    ]
  },
  {
    name: "Golf Balls",
    products: [
      { id: "chrome-soft", name: "Chrome Soft X", tier: "Tier 1" },
      { id: "chrome-tour", name: "Chrome Tour", tier: "Tier 1" },
      { id: "supersoft", name: "Supersoft", tier: "Tier 3" },
    ]
  },
  {
    name: "Fairway Woods",
    products: [
      { id: "paradym-fw", name: "Paradym Fairway", tier: "Tier 1" },
      { id: "rogue-fw", name: "Rogue ST Fairway", tier: "Tier 2" },
    ]
  },
  {
    name: "Hybrids",
    products: [
      { id: "paradym-hybrid", name: "Paradym Hybrid", tier: "Tier 1" },
      { id: "apex-hybrid", name: "Apex Hybrid", tier: "Tier 2" },
    ]
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedScenario: string
  onScenarioChange: (scenario: string) => void
  selectedRegion: string
  onRegionChange: (region: string) => void
  selectedProducts: string[]
  onProductsChange: (products: string[]) => void
  onRefresh: () => void
}

export function Sidebar({
  isOpen,
  onClose,
  selectedScenario,
  onScenarioChange,
  selectedRegion,
  onRegionChange,
  selectedProducts,
  onProductsChange,
  onRefresh,
}: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Drivers"])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleProduct = (productId: string) => {
    onProductsChange(
      selectedProducts.includes(productId)
        ? selectedProducts.filter(p => p !== productId)
        : [...selectedProducts, productId]
    )
  }

  const clearSelection = () => {
    onProductsChange([])
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <aside
        className="fixed top-0 left-0 z-50 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto animate-in slide-in-from-left duration-300"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Planning Controls</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              Scenario Management
            </h3>
            <select
              value={selectedScenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              {SCENARIOS.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {SCENARIOS.find(s => s.id === selectedScenario)?.description}
            </p>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              Region Filter
            </h3>
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
            >
              {REGIONS.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              Product Selection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select products to view in timeline
            </p>

            <div className="space-y-1">
              {PRODUCT_CATEGORIES.map(category => (
                <div key={category.name} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full px-3 py-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      {category.name}
                    </span>
                    {expandedCategories.includes(category.name) ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                  {expandedCategories.includes(category.name) && (
                    <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
                      {category.products.map(product => (
                        <label
                          key={product.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              selectedProducts.includes(product.id)
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-slate-300 dark:border-slate-600"
                            )}
                            onClick={() => toggleProduct(product.id)}
                          >
                            {selectedProducts.includes(product.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                            {product.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              product.tier === "Tier 1" && "border-yellow-400 text-yellow-700 dark:text-yellow-400",
                              product.tier === "Tier 2" && "border-slate-400 text-slate-600 dark:text-slate-400",
                              product.tier === "Tier 3" && "border-amber-600 text-amber-700 dark:text-amber-500"
                            )}
                          >
                            {product.tier}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="mt-2 w-full text-xs"
              >
                Clear Selection
              </Button>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <Button
              variant="outline"
              onClick={onRefresh}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
