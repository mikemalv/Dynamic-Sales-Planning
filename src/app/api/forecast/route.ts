import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface ForecastData {
  FCST_MONTH: number;
  FCST_CATEGORY: string;
  FCST_STRATEGIC_ACCOUNT: string;
  TOTAL_FORECAST_QTY: number;
  TOTAL_FORECAST_REVENUE: number;
}

export async function GET() {
  try {
    const results = await query<ForecastData>(`
      SELECT 
        FCST_MONTH,
        FCST_CATEGORY,
        FCST_STRATEGIC_ACCOUNT,
        SUM(FCST_QTY) as TOTAL_FORECAST_QTY,
        SUM(FCST_REVENUE) as TOTAL_FORECAST_REVENUE
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SALES_FORECAST
      GROUP BY FCST_MONTH, FCST_CATEGORY, FCST_STRATEGIC_ACCOUNT
      ORDER BY FCST_MONTH, FCST_CATEGORY
    `);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Forecast API Error:", error);
    return NextResponse.json({ error: "Failed to fetch forecast data" }, { status: 500 });
  }
}
