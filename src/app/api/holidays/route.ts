import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await query(`
      SELECT ID, HOLIDAY_NAME, HOLIDAY_MONTH, HOLIDAY_DAY, HOLIDAY_YEAR,
             REVENUE_IMPACT_FACTOR, CATEGORY, NOTES, IS_RECURRING
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_HOLIDAYS
      ORDER BY HOLIDAY_MONTH, HOLIDAY_DAY
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Holidays API error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
