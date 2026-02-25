"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductTile, CompetitorLaunch } from "@/types/planning"
import { CATEGORY_COLORS, TIER_LABELS, COMPETITOR_LAUNCHES, SEASONALITY_DATA } from "@/lib/planning-data"
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Zap } from "lucide-react"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarViewProps {
  scheduledTiles: ProductTile[]
  onSelectProduct: (product: ProductTile) => void
  onDropProduct: (month: number, year: number) => void
  startYear: number
}

export function CalendarView({ scheduledTiles, onSelectProduct, onDropProduct, startYear }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(1)
  const [currentYear, setCurrentYear] = useState(startYear)

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay()
  }

  const monthProducts = scheduledTiles.filter(
    t => t.launchMonth === currentMonth && t.launchYear === currentYear
  )

  const monthCompetitors = COMPETITOR_LAUNCHES.filter(
    c => c.month === currentMonth && c.year === currentYear
  )

  const seasonData = SEASONALITY_DATA.find(s => s.month === currentMonth)

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const renderCalendarDays = () => {
    const days = []
    
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" />
      )
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayProducts = monthProducts.filter(p => {
        const launchDay = p.launchDay || 15
        return launchDay === day
      })
      
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() + 1 === currentMonth && 
                      new Date().getFullYear() === currentYear
      
      days.push(
        <div
          key={day}
          className={`h-24 p-1 border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors ${
            isToday ? "bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDropProduct(currentMonth, currentYear)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400"}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayProducts.slice(0, 2).map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="text-xs p-1 rounded cursor-pointer truncate"
                style={{ 
                  backgroundColor: `${CATEGORY_COLORS[product.category]}20`,
                  borderLeft: `3px solid ${CATEGORY_COLORS[product.category]}`
                }}
              >
                {product.name}
              </div>
            ))}
            {dayProducts.length > 2 && (
              <div className="text-xs text-slate-500">+{dayProducts.length - 2} more</div>
            )}
          </div>
        </div>
      )
    }
    
    return days
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {MONTHS[currentMonth - 1]} {currentYear}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-px">
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className={`border-2 ${seasonData?.optimalForLaunch ? "border-emerald-300 dark:border-emerald-700" : "border-slate-200 dark:border-slate-700"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`h-4 w-4 ${seasonData?.optimalForLaunch ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="text-sm font-medium">Seasonal Factor</span>
            </div>
            <div className="text-2xl font-bold">{seasonData?.seasonalFactor.toFixed(2)}x</div>
            {seasonData?.optimalForLaunch && (
              <Badge className="mt-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                Peak Launch Window
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">Scheduled Launches</span>
            </div>
            <div className="text-2xl font-bold">{monthProducts.length}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {monthProducts.slice(0, 3).map(p => (
                <Badge 
                  key={p.id} 
                  variant="outline"
                  className="text-xs cursor-pointer"
                  style={{ borderColor: CATEGORY_COLORS[p.category] }}
                  onClick={() => onSelectProduct(p)}
                >
                  {p.name.split(' ')[0]}
                </Badge>
              ))}
              {monthProducts.length > 3 && (
                <Badge variant="outline" className="text-xs">+{monthProducts.length - 3}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${monthCompetitors.length > 0 ? "border-amber-300 dark:border-amber-700" : "border-slate-200 dark:border-slate-700"}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${monthCompetitors.length > 0 ? "text-amber-600" : "text-slate-400"}`} />
              <span className="text-sm font-medium">Competitor Launches</span>
            </div>
            <div className="text-2xl font-bold">{monthCompetitors.length}</div>
            <div className="mt-2 space-y-1">
              {monthCompetitors.slice(0, 2).map((c, i) => (
                <div key={i} className="text-xs text-amber-700 dark:text-amber-300">
                  {c.competitor}: {c.product}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Products This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {monthProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No products scheduled for {MONTHS[currentMonth - 1]} {currentYear}</p>
              <p className="text-xs mt-1">Drag products here from the palette</p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderLeftWidth: 4, borderLeftColor: CATEGORY_COLORS[product.category] }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        <span>{TIER_LABELS[product.tier]}</span>
                        <span>•</span>
                        <span>${(product.projectedRevenue.mid / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                    {product.hasNewTech && (
                      <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">
                        New Tech
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
