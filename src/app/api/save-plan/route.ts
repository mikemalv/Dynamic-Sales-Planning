import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scenarioId, scenarioName, planData, totalRevenue, totalMarketShare, scheduledCount, userName, changeRationale } = body;

    const planJson = JSON.stringify(planData);
    const safeJson = planJson.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const safeName = (scenarioName || "").replace(/'/g, "''");
    const safeUser = (userName || "MMALVEIRA").replace(/'/g, "''");
    const safeRationale = (changeRationale || "").replace(/'/g, "''");

    const versionRows = await query(`
      SELECT COALESCE(MAX(VERSION_NUMBER), 0) AS MAX_VER
      FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIOS
      WHERE ID = '${scenarioId}'
    `);
    const nextVersion = ((versionRows as Array<{ MAX_VER: number }>)[0]?.MAX_VER || 0) + 1;

    const mergeSql = `
      MERGE INTO LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIOS t
      USING (SELECT
        '${scenarioId}' AS ID,
        '${safeName}' AS SCENARIO_NAME,
        PARSE_JSON('${safeJson}') AS PLAN_DATA,
        ${totalRevenue || 0} AS TOTAL_REVENUE,
        ${totalMarketShare || 0} AS TOTAL_MARKET_SHARE,
        ${scheduledCount || 0} AS SCHEDULED_COUNT,
        '${safeUser}' AS USER_NAME,
        ${nextVersion} AS VERSION_NUMBER,
        ${safeRationale ? `'${safeRationale}'` : "NULL"} AS CHANGE_RATIONALE
      ) s ON t.ID = s.ID
      WHEN MATCHED THEN UPDATE SET
        SCENARIO_NAME = s.SCENARIO_NAME,
        PLAN_DATA = s.PLAN_DATA,
        TOTAL_REVENUE = s.TOTAL_REVENUE,
        TOTAL_MARKET_SHARE = s.TOTAL_MARKET_SHARE,
        SCHEDULED_COUNT = s.SCHEDULED_COUNT,
        USER_NAME = s.USER_NAME,
        VERSION_NUMBER = s.VERSION_NUMBER,
        CHANGE_RATIONALE = s.CHANGE_RATIONALE,
        IS_ACTIVE = TRUE,
        UPDATED_AT = CURRENT_TIMESTAMP()
      WHEN NOT MATCHED THEN INSERT
        (ID, SCENARIO_NAME, PLAN_DATA, TOTAL_REVENUE, TOTAL_MARKET_SHARE, SCHEDULED_COUNT, USER_NAME, VERSION_NUMBER, CHANGE_RATIONALE, IS_ACTIVE)
      VALUES (
        s.ID,
        s.SCENARIO_NAME,
        s.PLAN_DATA,
        s.TOTAL_REVENUE,
        s.TOTAL_MARKET_SHARE,
        s.SCHEDULED_COUNT,
        s.USER_NAME,
        s.VERSION_NUMBER,
        s.CHANGE_RATIONALE,
        TRUE
      )
    `;

    await query(mergeSql);

    if (changeRationale) {
      const versionSql = `
        INSERT INTO LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIO_VERSIONS
          (SCENARIO_ID, VERSION_NUMBER, SCENARIO_NAME, PLAN_DATA, TOTAL_REVENUE, TOTAL_MARKET_SHARE, SCHEDULED_COUNT, CHANGE_RATIONALE, USER_NAME)
        SELECT
          '${scenarioId}',
          ${nextVersion},
          '${safeName}',
          PARSE_JSON('${safeJson}'),
          ${totalRevenue || 0},
          ${totalMarketShare || 0},
          ${scheduledCount || 0},
          '${safeRationale}',
          '${safeUser}'
      `;
      await query(versionSql);
    }

    const auditSql = `
      INSERT INTO LANDING_CO.FLATFILES.DYNAMIC_PLANNING_AUDIT_LOG
        (ACTION, ENTITY_TYPE, ENTITY_ID, ENTITY_NAME, DETAILS, USER_NAME)
      SELECT
        'SAVE_PLAN',
        'SCENARIO',
        '${scenarioId}',
        '${safeName}',
        PARSE_JSON('{"scheduledCount": ${scheduledCount || 0}, "totalRevenue": ${totalRevenue || 0}, "version": ${nextVersion}}'),
        '${safeUser}'
    `;

    await query(auditSql);

    return NextResponse.json({ success: true, version: nextVersion });
  } catch (err) {
    console.error("Save plan error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("id");
    const listAll = searchParams.get("list");
    const versions = searchParams.get("versions");

    if (versions) {
      const sql = `
        SELECT ID, SCENARIO_ID, VERSION_NUMBER, SCENARIO_NAME, TOTAL_REVENUE, TOTAL_MARKET_SHARE,
               SCHEDULED_COUNT, CHANGE_RATIONALE, USER_NAME, CREATED_AT
        FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIO_VERSIONS
        WHERE SCENARIO_ID = '${versions}'
        ORDER BY VERSION_NUMBER DESC
        LIMIT 20
      `;
      const rows = await query(sql);
      return NextResponse.json(rows);
    }

    if (listAll === "true") {
      const sql = `
        SELECT ID, SCENARIO_NAME, TOTAL_REVENUE, TOTAL_MARKET_SHARE,
               SCHEDULED_COUNT, USER_NAME, VERSION_NUMBER, CHANGE_RATIONALE, UPDATED_AT
        FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIOS
        WHERE IS_ACTIVE = TRUE
        ORDER BY UPDATED_AT DESC
      `;
      const rows = await query(sql);
      return NextResponse.json(rows);
    }

    let sql: string;
    if (scenarioId) {
      sql = `
        SELECT ID, SCENARIO_NAME, PLAN_DATA, TOTAL_REVENUE, TOTAL_MARKET_SHARE,
               SCHEDULED_COUNT, USER_NAME, VERSION_NUMBER, CHANGE_RATIONALE, UPDATED_AT
        FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIOS
        WHERE ID = '${scenarioId}' AND IS_ACTIVE = TRUE
      `;
    } else {
      sql = `
        SELECT ID, SCENARIO_NAME, TOTAL_REVENUE, TOTAL_MARKET_SHARE,
               SCHEDULED_COUNT, USER_NAME, VERSION_NUMBER, CHANGE_RATIONALE, UPDATED_AT
        FROM LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIOS
        WHERE IS_ACTIVE = TRUE
        ORDER BY UPDATED_AT DESC
      `;
    }

    const rows = await query(sql);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Load plan error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("id");
    if (!scenarioId || scenarioId === "base") {
      return NextResponse.json({ error: "Cannot delete base scenario" }, { status: 400 });
    }
    await query(`
      UPDATE LANDING_CO.FLATFILES.DYNAMIC_PLANNING_SCENARIOS
      SET IS_ACTIVE = FALSE, UPDATED_AT = CURRENT_TIMESTAMP()
      WHERE ID = '${scenarioId}'
    `);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete scenario error:", (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
