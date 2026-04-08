"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, RefreshCw, X, Check, Plus, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DEFAULT_PRODUCT_TILES, CATEGORY_COLORS, TIER_LABELS } from "@/lib/planning-data"

interface SavedScenario {
  id: string
  name: string
  description?: string
  totalRevenue?: number
  scheduledCount?: number
  version?: number
  updatedAt?: string
}

const DEFAULT_SCENARIOS: SavedScenario[] = [
  { id: "base", name: "Base Plan", description: "Current default strategy" },
]

const REGIONS = [
  { id: "all", name: "All Regions" },
  { id: "us", name: "United States" },
  { id: "europe", name: "Europe" },
  { id: "japan", name: "Japan" },
  { id: "apac", name: "Asia Pacific" },
  { id: "row", name: "Rest of World" },
]

const PRODUCT_CATEGORIES = Array.from(
  new Set(DEFAULT_PRODUCT_TILES.map(t => t.category))
).map(category => ({
  name: category === "Iron" ? "Irons" : category === "Driver" ? "Drivers" : category === "Wedge" ? "Wedges" : category === "Putter" ? "Putters" : category === "Hybrid" ? "Hybrids" : category === "Fairway" ? "Fairway Woods" : category,
  categoryKey: category,
  products: DEFAULT_PRODUCT_TILES.filter(t => t.category === category).map(t => ({
    id: t.id,
    name: t.name,
    tier: `Tier ${t.tier}`,
  })),
}))

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
  onCreateScenario?: (name: string, copyFrom?: string) => void
  onDeleteScenario?: (id: string) => void
  savedScenarios?: SavedScenario[]
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
  onCreateScenario,
  onDeleteScenario,
  savedScenarios,
}: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Drivers"])
  const [showNewScenario, setShowNewScenario] = useState(false)
  const [newScenarioName, setNewScenarioName] = useState("")

  const scenarios = savedScenarios && savedScenarios.length > 0 ? savedScenarios : DEFAULT_SCENARIOS

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

  const selectAllInCategory = (categoryKey: string) => {
    const categoryProductIds = DEFAULT_PRODUCT_TILES.filter(t => t.category === categoryKey).map(t => t.id)
    const allSelected = categoryProductIds.every(id => selectedProducts.includes(id))
    if (allSelected) {
      onProductsChange(selectedProducts.filter(p => !categoryProductIds.includes(p)))
    } else {
      const newSelection = [...selectedProducts]
      categoryProductIds.forEach(id => {
        if (!newSelection.includes(id)) newSelection.push(id)
      })
      onProductsChange(newSelection)
    }
  }

  const clearSelection = () => {
    onProductsChange([])
  }

  const handleCreateScenario = () => {
    if (newScenarioName.trim() && onCreateScenario) {
      const id = newScenarioName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
      onCreateScenario(newScenarioName.trim(), selectedScenario)
      setNewScenarioName("")
      setShowNewScenario(false)
    }
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
            <div className="space-y-2">
              {scenarios.map(scenario => (
                <div
                  key={scenario.id}
                  onClick={() => onScenarioChange(scenario.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                    selectedScenario === scenario.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{scenario.name}</span>
                    <div className="flex items-center gap-1">
                      {scenario.version && (
                        <Badge variant="outline" className="text-[10px]">v{scenario.version}</Badge>
                      )}
                      {selectedScenario === scenario.id && (
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  </div>
                  {scenario.totalRevenue !== undefined && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>${(scenario.totalRevenue / 1000000).toFixed(1)}M</span>
                      <span>{scenario.scheduledCount} launches</span>
                    </div>
                  )}
                  {scenario.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{scenario.description}</p>
                  )}
                  {scenario.id !== "base" && onDeleteScenario && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-6 text-xs text-red-500 hover:text-red-700 px-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete scenario "${scenario.name}"?`)) {
                          onDeleteScenario(scenario.id)
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {showNewScenario ? (
              <div className="mt-3 p-3 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="Scenario name..."
                  className="w-full px-2 py-1.5 text-sm border border-indigo-300 dark:border-indigo-700 rounded bg-white dark:bg-slate-800 mb-2"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateScenario()}
                />
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                  <Copy className="h-3 w-3 inline mr-1" />
                  Copies current plan from &quot;{scenarios.find(s => s.id === selectedScenario)?.name || selectedScenario}&quot;
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleCreateScenario} disabled={!newScenarioName.trim()}>
                    Create
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNewScenario(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                onClick={() => setShowNewScenario(true)}
              >
                <Plus className="h-3 w-3" /> New Scenario
              </Button>
            )}
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
              Filter products shown in timeline and charts
            </p>

            <div className="space-y-1">
              {PRODUCT_CATEGORIES.map(category => (
                <div key={category.name} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full px-3 py-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[category.categoryKey] }}
                      />
                      {category.name}
                      <Badge variant="outline" className="text-[10px]">{category.products.length}</Badge>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); selectAllInCategory(category.categoryKey); }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline px-1"
                      >
                        Toggle All
                      </button>
                      {expandedCategories.includes(category.name) ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
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
