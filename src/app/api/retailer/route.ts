import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface RetailerPerformance {
  RETAILER: string;
  PRODUCT_MODEL: string;
  AVG_OH_INVENTORY: number;
  TOTAL_RECEIPTS: number;
  AVG_SELL_THRU: number;
  BUDGET_VARIANCE: number;
}

export async function GET() {
  try {
    const results = await query<RetailerPerformance>(`
      SELECT 
        RETAILER,
        PRODUCT_MODEL,
        ROUND(AVG(OH_INVENTORY), 0) as AVG_OH_INVENTORY,
        SUM(STOCK_RECEIPTS) as TOTAL_RECEIPTS,
        ROUND(AVG(CAST(SELL_THRU_FC AS FLOAT)), 1) as AVG_SELL_THRU,
        ROUND(AVG(OH_INVENTORY - BUDGET_OH), 0) as BUDGET_VARIANCE
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_RETAILER
      GROUP BY RETAILER, PRODUCT_MODEL
      ORDER BY RETAILER, PRODUCT_MODEL
    `);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Retailer API Error:", error);
    return NextResponse.json({ error: "Failed to fetch retailer data" }, { status: 500 });
  }
}
