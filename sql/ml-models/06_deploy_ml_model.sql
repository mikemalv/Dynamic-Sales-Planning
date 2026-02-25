-- ========================================================================
-- DEPLOY ML FORECAST MODEL FOR PRODUCT LAUNCHES
-- ========================================================================

USE DATABASE CALLAWAY_DYN_SALES;
USE SCHEMA PLANNING_SCHEMA;

-- ========================================================================
-- STEP 1: CREATE TRAINING PROCEDURE
-- ========================================================================

CREATE OR REPLACE PROCEDURE TRAIN_PRODUCT_LAUNCH_MODEL()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-ml-python', 'scikit-learn', 'pandas', 'numpy')
HANDLER = 'train_model'
COMMENT = 'Trains and registers a product launch revenue prediction model'
AS
$$
def train_model(session):
    from snowflake.ml.registry import Registry
    from snowflake.ml.modeling.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    import numpy as np
    import json
    
    # Fetch training data from launch plans (simplified - no subqueries)
    query = """
    SELECT
        pm.tier_key::FLOAT AS tier_key,
        pm.category_key::FLOAT AS category_key,
        pm.segment_key::FLOAT AS segment_key,
        plp.region_key::FLOAT AS region_key,
        pm.has_new_technology::INT::FLOAT AS has_new_tech,
        pm.suggested_retail_price::FLOAT AS suggested_retail_price,
        pcd.market_size_millions::FLOAT AS category_market_size,
        pcd.growth_rate_pct::FLOAT AS category_growth_rate,
        psd.market_size_millions::FLOAT AS segment_market_size,
        CASE rd.market_maturity 
            WHEN 'Mature' THEN 3.0
            WHEN 'Growing' THEN 2.0
            ELSE 1.0
        END AS market_maturity_score,
        0.0 AS months_since_launch,
        CASE 
            WHEN plp.launch_month IN (1,2) THEN 1.85
            WHEN plp.launch_month IN (3,4,5) THEN 1.45
            WHEN plp.launch_month IN (6,7,8) THEN 1.15
            WHEN plp.launch_month IN (9,10,11) THEN 0.95
            ELSE 1.25
        END AS seasonality_index,
        2.0::FLOAT AS competitive_launches_nearby,
        70.0::FLOAT AS market_sentiment_index,
        2.5::FLOAT AS economic_indicator,
        65.0::FLOAT AS consumer_confidence_index,
        2.5::FLOAT AS golf_participation_trend_pct,
        plp.projected_revenue_mid::FLOAT AS actual_revenue
    FROM product_launch_plan plp
    JOIN product_master pm ON plp.product_key = pm.product_key
    JOIN product_category_dim pcd ON pm.category_key = pcd.category_key
    JOIN player_segment_dim psd ON pm.segment_key = psd.segment_key
    JOIN region_dim rd ON plp.region_key = rd.region_key
    WHERE plp.projected_revenue_mid IS NOT NULL
      AND plp.is_active_scenario = TRUE
    """
    
    # Load training data
    training_df = session.sql(query).to_pandas()
    
    if len(training_df) < 10:
        return json.dumps({
            "status": "error",
            "message": f"Insufficient training data. Found {len(training_df)} rows, need at least 10."
        })
    
    # Prepare features and target
    feature_cols = [
        'TIER_KEY', 'CATEGORY_KEY', 'SEGMENT_KEY', 'REGION_KEY', 
        'HAS_NEW_TECH', 'SUGGESTED_RETAIL_PRICE', 'CATEGORY_MARKET_SIZE',
        'CATEGORY_GROWTH_RATE', 'SEGMENT_MARKET_SIZE', 'MARKET_MATURITY_SCORE',
        'MONTHS_SINCE_LAUNCH', 'SEASONALITY_INDEX', 'COMPETITIVE_LAUNCHES_NEARBY',
        'MARKET_SENTIMENT_INDEX', 'ECONOMIC_INDICATOR', 'CONSUMER_CONFIDENCE_INDEX',
        'GOLF_PARTICIPATION_TREND_PCT'
    ]
    
    # Fill NaN values
    training_df[feature_cols] = training_df[feature_cols].fillna(0)
    
    # Split data
    train_df, test_df = train_test_split(training_df, test_size=0.2, random_state=42)
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        input_cols=feature_cols,
        label_cols=['ACTUAL_REVENUE'],
        output_cols=['PREDICTED_REVENUE']
    )
    
    model.fit(train_df)
    
    # Evaluate on test set
    predictions = model.predict(test_df)
    
    y_test = test_df['ACTUAL_REVENUE'].values
    y_pred = predictions['PREDICTED_REVENUE'].values
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    # Register model in registry
    reg = Registry(session=session)
    
    model_ref = reg.log_model(
        model=model,
        model_name="PRODUCT_LAUNCH_REVENUE_PREDICTOR",
        comment="Predicts product launch revenue based on product attributes, market conditions, and timing",
        metrics={
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        }
    )
    
    version_name = model_ref.version_name
    
    return json.dumps({
        "status": "success",
        "model_name": "PRODUCT_LAUNCH_REVENUE_PREDICTOR",
        "version": version_name,
        "training_samples": len(train_df),
        "test_samples": len(test_df),
        "metrics": {
            "MAE": round(float(mae), 2),
            "RMSE": round(float(rmse), 2),
            "R2": round(float(r2), 4)
        }
    })
$$;

-- ========================================================================
-- STEP 2: TRAIN THE MODEL
-- ========================================================================

CALL TRAIN_PRODUCT_LAUNCH_MODEL();

-- ========================================================================
-- STEP 3: VERIFY MODEL WAS CREATED
-- ========================================================================

SHOW MODELS LIKE 'PRODUCT_LAUNCH_REVENUE_PREDICTOR';

-- ========================================================================
-- STEP 4: UPDATE THE FORECAST FUNCTION TO USE THE MODEL
-- ========================================================================

CREATE OR REPLACE FUNCTION GET_LAUNCH_FORECAST(
    PRODUCT_KEY_INPUT INT,
    REGION_KEY_INPUT INT,
    LAUNCH_DATE_INPUT DATE
)
RETURNS OBJECT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-ml-python', 'scikit-learn', 'pandas', 'numpy')
HANDLER = 'get_forecast'
AS
$$
def get_forecast(session, product_key_input, region_key_input, launch_date_input):
    from snowflake.ml.registry import Registry
    import json
    import pandas as pd
    
    try:
        # Get model from registry
        reg = Registry(session)
        model_ref = reg.get_model("PRODUCT_LAUNCH_REVENUE_PREDICTOR")
        model = model_ref.default
        
        # Build input features (no subqueries)
        query = f"""
        SELECT
            pm.tier_key::FLOAT AS tier_key,
            pm.category_key::FLOAT AS category_key,
            pm.segment_key::FLOAT AS segment_key,
            {region_key_input}::FLOAT AS region_key,
            pm.has_new_technology::INT::FLOAT AS has_new_tech,
            pm.suggested_retail_price::FLOAT AS suggested_retail_price,
            pcd.market_size_millions::FLOAT AS category_market_size,
            pcd.growth_rate_pct::FLOAT AS category_growth_rate,
            psd.market_size_millions::FLOAT AS segment_market_size,
            CASE rd.market_maturity 
                WHEN 'Mature' THEN 3.0
                WHEN 'Growing' THEN 2.0
                ELSE 1.0
            END AS market_maturity_score,
            0.0 AS months_since_launch,
            CASE 
                WHEN MONTH('{launch_date_input}'::DATE) IN (1,2) THEN 1.85
                WHEN MONTH('{launch_date_input}'::DATE) IN (3,4,5) THEN 1.45
                WHEN MONTH('{launch_date_input}'::DATE) IN (6,7,8) THEN 1.15
                WHEN MONTH('{launch_date_input}'::DATE) IN (9,10,11) THEN 0.95
                ELSE 1.25
            END AS seasonality_index,
            2.0::FLOAT AS competitive_launches_nearby,
            70.0::FLOAT AS market_sentiment_index,
            2.5::FLOAT AS economic_indicator,
            65.0::FLOAT AS consumer_confidence_index,
            2.5::FLOAT AS golf_participation_trend_pct,
            pm.product_name,
            pcd.category_name,
            rd.region_name
        FROM product_master pm
        JOIN product_category_dim pcd ON pm.category_key = pcd.category_key
        JOIN player_segment_dim psd ON pm.segment_key = psd.segment_key
        JOIN region_dim rd ON rd.region_key = {region_key_input}
        WHERE pm.product_key = {product_key_input}
        """
        
        input_df = session.sql(query)
        
        # Get prediction
        predictions = model.run(input_df, function_name="predict")
        result_rows = predictions.collect()
        
        if len(result_rows) == 0:
            return {
                "error": "No data found for this product/region combination"
            }
        
        result = result_rows[0]
        
        # Calculate confidence intervals
        predicted_revenue = float(result['PREDICTED_REVENUE'])
        low_estimate = predicted_revenue * 0.85
        high_estimate = predicted_revenue * 1.15
        
        return {
            "status": "success",
            "product_key": product_key_input,
            "product_name": result['PRODUCT_NAME'],
            "category": result['CATEGORY_NAME'],
            "region_key": region_key_input,
            "region_name": result['REGION_NAME'],
            "launch_date": str(launch_date_input),
            "forecast": {
                "predicted_revenue": round(predicted_revenue, 2),
                "low_estimate": round(low_estimate, 2),
                "high_estimate": round(high_estimate, 2),
                "formatted": {
                    "predicted": f"${predicted_revenue/1000000:.1f}M",
                    "low": f"${low_estimate/1000000:.1f}M",
                    "high": f"${high_estimate/1000000:.1f}M"
                }
            },
            "factors": {
                "seasonality_index": float(result['SEASONALITY_INDEX']),
                "competitive_launches_nearby": 2,
                "market_maturity": result['REGION_NAME']
            },
            "model_info": "Random Forest Regressor trained on launch plan data"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error_type": str(type(e).__name__),
            "error_message": str(e),
            "product_key": product_key_input,
            "region_key": region_key_input,
            "launch_date": str(launch_date_input)
        }
$$;

-- ========================================================================
-- STEP 5: TEST THE UPDATED FUNCTION
-- ========================================================================

-- Test with Mavrik 2026 Driver in US
SELECT GET_LAUNCH_FORECAST(5, 1, '2026-01-15'::DATE) AS forecast;

SELECT 'ML Model deployed successfully! Forecast function is now live.' AS status;

