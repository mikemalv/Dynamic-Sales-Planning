import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const entityType = searchParams.get("entityType");

    let sql = `
      SELECT ID, ACTION, ENTITY_TYPE, ENTITY_ID, ENTITY_NAME,
             DETAILS, COMMENT, USER_NAME, CREATED_AT
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_AUDIT_LOG
    `;
    if (entityType) {
      sql += ` WHERE ENTITY_TYPE = '${entityType}'`;
    }
    sql += ` ORDER BY CREATED_AT DESC LIMIT ${limit}`;

    const rows = await query(sql);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Audit log API error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, entityType, entityId, entityName, details, comment, userName } = body;

    const detailsJson = details ? JSON.stringify(details).replace(/'/g, "''") : "{}";

    await query(`
      INSERT INTO LANDING_CO.FLATFILES.DYNAMIC_PLANNING_AUDIT_LOG
        (ACTION, ENTITY_TYPE, ENTITY_ID, ENTITY_NAME, DETAILS, COMMENT, USER_NAME)
      SELECT
        '${action}',
        '${entityType}',
        '${entityId || ""}',
        '${(entityName || "").replace(/'/g, "''")}',
        PARSE_JSON('${detailsJson}'),
        '${(comment || "").replace(/'/g, "''")}',
        '${userName || "MMALVEIRA"}'
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Audit log insert error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
