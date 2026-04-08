"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProductTile } from "@/types/planning"
import { TIER_LABELS, CATEGORY_COLORS, calculateProductImpact, COMPETITOR_LAUNCHES, SEASONALITY_DATA } from "@/lib/planning-data"
import { 
  Calendar, Target, TrendingUp, DollarSign, Users, Zap, 
  AlertTriangle, Edit2, Trash2, Save, X, Package, Percent, BarChart3
} from "lucide-react"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

interface ProductDetailModalProps {
  product: ProductTile | null
  isOpen: boolean
  onClose: () => void
  onSave: (product: ProductTile) => void
  onDelete: (productId: string) => void
  onReschedule: (productId: string, month: number, year: number) => void
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onReschedule,
}: ProductDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedProduct, setEditedProduct] = useState<ProductTile | null>(null)
  const [notes, setNotes] = useState("")
  const [marginPercent, setMarginPercent] = useState<number | undefined>(undefined)
  const [seasonalityOverride, setSeasonalityOverride] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product })
      setNotes(product.notes || "")
      setMarginPercent(product.marginPercent)
      setSeasonalityOverride(product.seasonalityOverride)
    }
  }, [product])

  if (!product || !editedProduct) return null

  const isScheduled = product.launchMonth && product.launchYear
  const impact = isScheduled 
    ? calculateProductImpact(product, product.launchMonth!, product.launchYear!, COMPETITOR_LAUNCHES)
    : null
  
  const seasonData = isScheduled 
    ? SEASONALITY_DATA.find(s => s.month === product.launchMonth)
    : null

  const nearbyCompetitors = isScheduled 
    ? COMPETITOR_LAUNCHES.filter(c => 
        c.category === product.category &&
        Math.abs((c.year * 12 + c.month) - (product.launchYear! * 12 + product.launchMonth!)) <= 2
      )
    : []

  const handleSave = () => {
    if (editedProduct) {
      onSave({ ...editedProduct, notes, marginPercent, seasonalityOverride })
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove ${product.name} from the schedule?`)) {
      onDelete(product.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-12 rounded"
                style={{ backgroundColor: CATEGORY_COLORS[product.category] }}
              />
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? (
                    <Input
                      value={editedProduct.name}
                      onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                      className="text-xl font-bold"
                    />
                  ) : (
                    product.name
                  )}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" style={{ borderColor: CATEGORY_COLORS[product.category] }}>
                    {product.category}
                  </Badge>
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {TIER_LABELS[product.tier]}
                  </Badge>
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {product.playerType}
                  </Badge>
                </DialogDescription>
              </div>
            </div>
            {!isEditing && (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isScheduled && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Scheduled: {MONTHS[product.launchMonth! - 1]} {product.launchYear}
                </span>
              </div>
              {seasonData && (
                <div className="text-sm text-indigo-700 dark:text-indigo-300">
                  Seasonal Factor: {seasonData.seasonalFactor.toFixed(2)}x
                  {seasonData.optimalForLaunch && (
                    <Badge className="ml-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700">
                      Peak Window
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-300">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Revenue Projections</span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12">Low:</span>
                    <Input
                      type="number"
                      value={editedProduct.projectedRevenue.low}
                      onChange={(e) => setEditedProduct({
                        ...editedProduct,
                        projectedRevenue: { ...editedProduct.projectedRevenue, low: Number(e.target.value) }
                      })}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12">Mid:</span>
                    <Input
                      type="number"
                      value={editedProduct.projectedRevenue.mid}
                      onChange={(e) => setEditedProduct({
                        ...editedProduct,
                        projectedRevenue: { ...editedProduct.projectedRevenue, mid: Number(e.target.value) }
                      })}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12">High:</span>
                    <Input
                      type="number"
                      value={editedProduct.projectedRevenue.high}
                      onChange={(e) => setEditedProduct({
                        ...editedProduct,
                        projectedRevenue: { ...editedProduct.projectedRevenue, high: Number(e.target.value) }
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    ${(product.projectedRevenue.mid / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    Range: ${(product.projectedRevenue.low / 1000000).toFixed(1)}M - ${(product.projectedRevenue.high / 1000000).toFixed(1)}M
                  </div>
                  {impact && (
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mt-2">
                      Adjusted: ${(impact.adjustedRevenue / 1000000).toFixed(1)}M
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Market Share</span>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12">Low:</span>
                    <Input
                      type="number"
                      value={editedProduct.projectedShare.low}
                      onChange={(e) => setEditedProduct({
                        ...editedProduct,
                        projectedShare: { ...editedProduct.projectedShare, low: Number(e.target.value) }
                      })}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12">Mid:</span>
                    <Input
                      type="number"
                      value={editedProduct.projectedShare.mid}
                      onChange={(e) => setEditedProduct({
                        ...editedProduct,
                        projectedShare: { ...editedProduct.projectedShare, mid: Number(e.target.value) }
                      })}
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 w-12">High:</span>
                    <Input
                      type="number"
                      value={editedProduct.projectedShare.high}
                      onChange={(e) => setEditedProduct({
                        ...editedProduct,
                        projectedShare: { ...editedProduct.projectedShare, high: Number(e.target.value) }
                      })}
                      className="h-8"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {product.projectedShare.mid}%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Range: {product.projectedShare.low}% - {product.projectedShare.high}%
                  </div>
                  {impact && (
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-2">
                      Adjusted: {impact.marketShareImpact.toFixed(1)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Product Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Market Size:</span>
                  <span className="font-medium">${(product.marketSize / 1000000).toFixed(0)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Has New Tech:</span>
                  <span className="font-medium">{product.hasNewTech ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Player Type:</span>
                  <span className="font-medium">{product.playerType}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-2 text-violet-700 dark:text-violet-300">
                <Percent className="h-4 w-4" />
                <span className="text-sm font-medium">Business Controls</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Gross Margin %</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={marginPercent ?? ""}
                      onChange={(e) => setMarginPercent(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 45"
                      className="h-8"
                      min={0}
                      max={100}
                    />
                  ) : (
                    <div className="text-lg font-bold text-violet-900 dark:text-violet-100">
                      {marginPercent !== undefined ? `${marginPercent}%` : "—"}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Seasonality Override</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={seasonalityOverride ?? ""}
                      onChange={(e) => setSeasonalityOverride(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 1.2"
                      className="h-8"
                      step="0.1"
                      min={0.1}
                      max={3.0}
                    />
                  ) : (
                    <div className="text-lg font-bold text-violet-900 dark:text-violet-100">
                      {seasonalityOverride !== undefined ? `${seasonalityOverride}x` : "Default"}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Override ML seasonality for new products without history</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {nearbyCompetitors.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Nearby Competitors</span>
                </div>
                <div className="space-y-2">
                  {nearbyCompetitors.slice(0, 3).map((c, i) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium text-amber-900 dark:text-amber-100">{c.competitor}</div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        {c.product} • {MONTHS[c.month - 1]} {c.year}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {impact && impact.alerts.length > 0 && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Alerts</span>
              </div>
              <ul className="space-y-1">
                {impact.alerts.map((alert, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-400">• {alert}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
              <Edit2 className="h-4 w-4" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this product launch..."
              className="w-full h-24 p-2 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {isScheduled && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from Schedule
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => {
                  setEditedProduct({ ...product })
                  setIsEditing(false)
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
