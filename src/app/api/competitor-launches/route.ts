import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET() {
  try {
    const rows = await query(`
      SELECT ID, COMPETITOR, PRODUCT, CATEGORY, LAUNCH_MONTH, LAUNCH_YEAR,
             ESTIMATED_IMPACT, DATA_SOURCE, CONFIDENCE, CREATED_AT
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_COMPETITOR_LAUNCHES
      ORDER BY LAUNCH_YEAR, LAUNCH_MONTH
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Competitor launches API error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, competitor, product, category, month, year, estimatedImpact, dataSource, confidence } = body;

    await query(`
      INSERT INTO LANDING_CO.FLATFILES.DYNAMIC_PLANNING_COMPETITOR_LAUNCHES
        (ID, COMPETITOR, PRODUCT, CATEGORY, LAUNCH_MONTH, LAUNCH_YEAR, ESTIMATED_IMPACT, DATA_SOURCE, CONFIDENCE)
      VALUES ('${id}', '${competitor}', '${product}', '${category}', ${month}, ${year}, '${estimatedImpact}', '${dataSource || "Manual Entry"}', '${confidence || "Projected"}')
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Competitor launch insert error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
