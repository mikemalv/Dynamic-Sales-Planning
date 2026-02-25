import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface IronShareData {
  MANUFACTURER: string;
  MODEL: string;
  SHAFT: string;
  UNIT_SALES: number;
  UNIT_SHARE: string;
  PREV_PD_UNIT_SHARE: string;
  SAME_PD_YAG_UNIT_SHARE: string;
  UNIT_PRICE: string;
  DOLLAR_SHARE: string;
  PREV_PD_DOLLAR_SHARE: string;
  INVENTORY_ON_HAND: number;
  INVENTORY_SHARE: string;
  MONTH_GTD: number;
  YEAR_GTD: number;
  RETAIL_DOLLARS: string;
  FAMILY: string;
}

export async function GET() {
  try {
    const results = await query<IronShareData>(`
      SELECT 
        MANUFACTURER,
        MODEL,
        SHAFT,
        UNIT_SALES,
        UNIT_SHARE,
        PREV_PD_UNIT_SHARE,
        SAME_PD_YAG_UNIT_SHARE,
        UNIT_PRICE,
        DOLLAR_SHARE,
        PREV_PD_DOLLAR_SHARE,
        INVENTORY_ON_HAND,
        INVENTORY_SHARE,
        MONTH_GTD,
        YEAR_GTD,
        RETAIL_DOLLARS,
        FAMILY
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_IRON_SHARE_GTD
      ORDER BY YEAR_GTD, MONTH_GTD, UNIT_SALES DESC
    `);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching iron share data:", error);
    return NextResponse.json({ error: "Failed to fetch iron share data" }, { status: 500 });
  }
}
