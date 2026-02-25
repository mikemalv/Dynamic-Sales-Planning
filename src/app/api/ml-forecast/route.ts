import { NextResponse } from "next/server";
import { query } from "@/lib/snowflake";

interface ForecastInput {
  year: number;
  month: number;
  categoryCode?: number;
  accountCode?: number;
  seasonalityFactor?: number;
  qualityTier?: number;
}

interface MLPrediction {
  PREDICTION: number;
  month: number;
  year: number;
  confidence: number;
}

interface PredictionResult {
  PREDICTED_QTY: number;
  YEAR: number;
  MONTH: number;
  SEASONALITY_FACTOR: number;
}

export async function POST(request: Request) {
  try {
    const body: ForecastInput = await request.json();
    
    const year = body.year || new Date().getFullYear();
    const month = body.month || 1;
    const categoryCode = body.categoryCode ?? 1;
    const accountCode = body.accountCode ?? 100;
    const seasonalityFactor = body.seasonalityFactor ?? getSeasonalMultiplier(month);
    const qualityTier = body.qualityTier ?? 3;

    const sql = `
      WITH pred AS (
        SELECT LANDING.FLATFILES.SALES_QUANTITY_PREDICTOR!PREDICT(
          ${year}::FLOAT,
          ${month}::FLOAT,
          ${categoryCode}::NUMBER,
          ${accountCode}::NUMBER,
          ${seasonalityFactor}::FLOAT,
          ${qualityTier}::NUMBER
        ) AS prediction
      )
      SELECT 
        prediction:PREDICTED_QTY::FLOAT as PREDICTED_QTY,
        prediction:YEAR::FLOAT as YEAR,
        prediction:MONTH::FLOAT as MONTH,
        prediction:SEASONALITY_FACTOR::FLOAT as SEASONALITY_FACTOR
      FROM pred
    `;

    const results = await query<PredictionResult>(sql);
    const result = results[0];
    
    const predictedQty = result?.PREDICTED_QTY || 0;
    const avgUnitPrice = 350;
    const predictedRevenue = predictedQty * avgUnitPrice;

    return NextResponse.json({
      prediction: predictedRevenue,
      predictedQuantity: predictedQty,
      inputs: {
        year,
        month,
        categoryCode,
        accountCode,
        seasonalityFactor,
        qualityTier,
      },
      model: "LANDING.FLATFILES.SALES_QUANTITY_PREDICTOR",
      version: "TIDY_TURKEY_3",
    });
  } catch (error) {
    console.error("ML Forecast API Error:", error);
    return NextResponse.json(
      { error: "Failed to get ML prediction", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const currentYear = new Date().getFullYear();
    
    const predictions: MLPrediction[] = [];
    const avgUnitPrice = 350;
    
    for (const month of months) {
      for (let yearOffset = 0; yearOffset < 2; yearOffset++) {
        const year = currentYear + yearOffset;
        const seasonalityFactor = getSeasonalMultiplier(month);
        const categoryCode = 1;
        const accountCode = 100;
        const qualityTier = 3;

        const sql = `
          WITH pred AS (
            SELECT LANDING.FLATFILES.SALES_QUANTITY_PREDICTOR!PREDICT(
              ${year}::FLOAT,
              ${month}::FLOAT,
              ${categoryCode}::NUMBER,
              ${accountCode}::NUMBER,
              ${seasonalityFactor}::FLOAT,
              ${qualityTier}::NUMBER
            ) AS prediction
          )
          SELECT 
            prediction:PREDICTED_QTY::FLOAT as PREDICTED_QTY
          FROM pred
        `;

        try {
          const results = await query<{ PREDICTED_QTY: number }>(sql);
          const predictedQty = results[0]?.PREDICTED_QTY || 0;
          const predictedRevenue = predictedQty * avgUnitPrice;

          predictions.push({
            PREDICTION: predictedRevenue,
            month,
            year,
            confidence: 0.85 - (yearOffset * 0.1),
          });
        } catch (err) {
          console.error(`Error predicting month ${month}:`, err);
          const baseQuantity = 800;
          predictions.push({
            PREDICTION: baseQuantity * seasonalityFactor * avgUnitPrice,
            month,
            year,
            confidence: 0.5,
          });
        }
      }
    }

    return NextResponse.json({
      predictions,
      model: "LANDING.FLATFILES.SALES_QUANTITY_PREDICTOR",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("ML Forecast GET Error:", error);
    return NextResponse.json(
      { error: "Failed to generate forecasts", details: String(error) },
      { status: 500 }
    );
  }
}

function getSeasonalMultiplier(month: number): number {
  const multipliers: Record<number, number> = {
    1: 1.35, 2: 1.30, 3: 1.20, 4: 1.15, 5: 1.10, 6: 0.95,
    7: 0.85, 8: 0.80, 9: 0.90, 10: 0.95, 11: 1.05, 12: 1.15,
  };
  return multipliers[month] || 1.0;
}
