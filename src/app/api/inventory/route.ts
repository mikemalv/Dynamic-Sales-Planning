import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface InventoryData {
  INVT_CAT_FAMILY: string;
  INVT_PRODUCT_MODEL: string;
  INVT_STOCK: string;
  CURRENT_OH: number;
  LAST_WEEK_OH: number;
  LATEST_DATE: string;
}

export async function GET() {
  try {
    const results = await query<InventoryData>(`
      WITH LatestInventory AS (
        SELECT 
          INVT_CAT_FAMILY,
          INVT_PRODUCT_MODEL,
          INVT_STOCK,
          CAST(INVT_OH AS INTEGER) as CURRENT_OH,
          CAST(INVT_LAST_WEEK AS INTEGER) as LAST_WEEK_OH,
          INVT_WEEKEND_DATE::VARCHAR as LATEST_DATE,
          ROW_NUMBER() OVER (PARTITION BY INVT_PRODUCT_MODEL ORDER BY INVT_WEEKEND_DATE DESC) as rn
        FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_INVENTORY
      )
      SELECT 
        INVT_CAT_FAMILY,
        INVT_PRODUCT_MODEL,
        INVT_STOCK,
        CURRENT_OH,
        LAST_WEEK_OH,
        LATEST_DATE
      FROM LatestInventory
      WHERE rn = 1
      ORDER BY INVT_CAT_FAMILY, INVT_PRODUCT_MODEL
    `);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Inventory API Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory data" }, { status: 500 });
  }
}
