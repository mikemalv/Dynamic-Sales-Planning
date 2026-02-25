import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface SalesSummary {
  INV_MONTH: number;
  INV_CATEGORY: string;
  INV_STRATEGIC_ACCOUNT: string;
  TOTAL_QTY: number;
  TOTAL_REVENUE: number;
}

export async function GET() {
  try {
    const results = await query<SalesSummary>(`
      SELECT 
        INV_MONTH,
        INV_CATEGORY,
        INV_STRATEGIC_ACCOUNT,
        SUM(INV_QTY_EACHES) as TOTAL_QTY,
        ROUND(SUM(INV_QTY_EACHES * CASE 
          WHEN INV_PRODUCT_TYPE = 'Driver' THEN 550
          WHEN INV_PRODUCT_TYPE = 'Iron Set' THEN 900
          WHEN INV_PRODUCT_TYPE = 'Golf Ball' THEN 50
          WHEN INV_PRODUCT_TYPE = 'Wedge' THEN 150
          WHEN INV_PRODUCT_TYPE = 'Putter' THEN 300
          WHEN INV_PRODUCT_TYPE = 'Fairway' THEN 350
          WHEN INV_PRODUCT_TYPE = 'Hybrid' THEN 320
          ELSE 200
        END), 2) as TOTAL_REVENUE
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SALES_INVOICE
      GROUP BY INV_MONTH, INV_CATEGORY, INV_STRATEGIC_ACCOUNT
      ORDER BY INV_MONTH, INV_CATEGORY
    `);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Sales API Error:", error);
    return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
  }
}
