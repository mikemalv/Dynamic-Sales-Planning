-- ========================================================================
-- CREATE ML MODELS FOR LANDING.FLATFILES DATA
-- ========================================================================
-- This script creates ML models for sales forecasting and inventory optimization
-- based on the flat file data structure
-- ========================================================================

USE DATABASE LANDING;
USE SCHEMA FLATFILES;

-- ========================================================================
-- MODEL 1: SALES FORECAST PREDICTOR
-- ========================================================================
-- Predicts future sales based on historical invoice and forecast data
-- ========================================================================

CREATE OR REPLACE PROCEDURE TRAIN_SALES_FORECAST_MODEL()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-ml-python', 'scikit-learn', 'pandas', 'numpy')
HANDLER = 'train_model'
COMMENT = 'Trains a model to predict sales quantities based on historical patterns'
AS
$$
def train_model(session):
    from snowflake.ml.registry import Registry
    from snowflake.ml.modeling.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    import numpy as np
    import json
    
    # Fetch training data combining invoice actuals with forecasts
    query = """
    SELECT
        inv.inv_year AS year,
        inv.inv_month AS month,
        CASE inv.inv_category
            WHEN 'Woods' THEN 1
            WHEN 'Irons' THEN 2
            WHEN 'Wedges' THEN 3
            WHEN 'Putters' THEN 4
            WHEN 'Balls' THEN 5
            WHEN 'Apparel' THEN 6
            ELSE 0
        END AS category_code,
        CASE inv.inv_strategic_account
            WHEN 'Dick''s Sporting Goods' THEN 1
            WHEN 'Golf Galaxy' THEN 2
            WHEN 'PGA Tour Superstore' THEN 3
            WHEN 'Online Direct' THEN 4
            ELSE 5
        END AS account_code,
        CASE 
            WHEN inv.inv_month IN (3, 4, 5) THEN 1.5
            WHEN inv.inv_month IN (6, 7, 8) THEN 1.3
            WHEN inv.inv_month IN (11, 12) THEN 1.4
            ELSE 1.0
        END AS seasonality_factor,
        CASE inv.inv_material_class
            WHEN 'Premium' THEN 3
            WHEN 'Standard' THEN 2
            ELSE 1
        END AS quality_tier,
        inv.inv_qty_eaches::FLOAT AS actual_qty
    FROM DYNAMIC_PLANNING_SALES_INVOICE inv
    WHERE inv.inv_qty_eaches IS NOT NULL
        AND inv.inv_qty_eaches > 0
    """
    
    # Load training data
    training_df = session.sql(query).to_pandas()
    
    if len(training_df) < 100:
        return json.dumps({
            "status": "error",
            "message": f"Insufficient training data. Found {len(training_df)} rows, need at least 100."
        })
    
    # Prepare features and target
    feature_cols = [
        'YEAR', 'MONTH', 'CATEGORY_CODE', 'ACCOUNT_CODE', 
        'SEASONALITY_FACTOR', 'QUALITY_TIER'
    ]
    
    # Fill NaN values
    training_df[feature_cols] = training_df[feature_cols].fillna(0)
    
    # Split data
    train_df, test_df = train_test_split(training_df, test_size=0.2, random_state=42)
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        input_cols=feature_cols,
        label_cols=['ACTUAL_QTY'],
        output_cols=['PREDICTED_QTY']
    )
    
    model.fit(train_df)
    
    # Evaluate on test set
    predictions = model.predict(test_df)
    
    y_test = test_df['ACTUAL_QTY'].values
    y_pred = predictions['PREDICTED_QTY'].values
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    # Register model in registry
    reg = Registry(session=session)
    
    model_ref = reg.log_model(
        model=model,
        model_name="SALES_QUANTITY_PREDICTOR",
        comment="Predicts sales quantities based on product category, account, and seasonality",
        metrics={
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        }
    )
    
    version_name = model_ref.version_name
    
    return json.dumps({
        "status": "success",
        "model_name": "SALES_QUANTITY_PREDICTOR",
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

-- Train the sales forecast model
CALL TRAIN_SALES_FORECAST_MODEL();

-- ========================================================================
-- MODEL 2: INVENTORY OPTIMIZATION MODEL
-- ========================================================================
-- Predicts optimal inventory levels based on sales patterns
-- ========================================================================

CREATE OR REPLACE PROCEDURE TRAIN_INVENTORY_OPTIMIZATION_MODEL()
RETURNS STRING
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-ml-python', 'scikit-learn', 'pandas', 'numpy')
HANDLER = 'train_model'
COMMENT = 'Trains a model to predict optimal inventory levels'
AS
$$
def train_model(session):
    from snowflake.ml.registry import Registry
    from snowflake.ml.modeling.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    import numpy as np
    import json
    
    # Fetch training data from inventory table
    query = """
    SELECT
        invt.invt_year AS year,
        invt.invt_month_num AS month,
        CASE invt.invt_cat_family
            WHEN 'Drivers' THEN 1
            WHEN 'Fairway Woods' THEN 2
            WHEN 'Hybrids' THEN 3
            WHEN 'Irons' THEN 4
            WHEN 'Wedges' THEN 5
            WHEN 'Putters' THEN 6
            WHEN 'Golf Balls' THEN 7
            WHEN 'Apparel' THEN 8
            ELSE 9
        END AS family_code,
        invt.inv_week AS week_num,
        CASE 
            WHEN invt.invt_month_num IN (3, 4, 5) THEN 1.5
            WHEN invt.invt_month_num IN (6, 7, 8) THEN 1.3
            WHEN invt.invt_month_num IN (11, 12) THEN 1.4
            ELSE 1.0
        END AS seasonality_factor,
        TRY_CAST(invt.invt_last_week AS FLOAT) AS last_week_inventory,
        TRY_CAST(invt.invt_stock AS FLOAT) AS current_stock,
        TRY_CAST(invt.invt_oh AS FLOAT) AS optimal_inventory
    FROM DYNAMIC_PLANNING_INVENTORY invt
    WHERE TRY_CAST(invt.invt_oh AS FLOAT) IS NOT NULL
        AND TRY_CAST(invt.invt_oh AS FLOAT) > 0
        AND TRY_CAST(invt.invt_stock AS FLOAT) IS NOT NULL
    """
    
    # Load training data
    training_df = session.sql(query).to_pandas()
    
    if len(training_df) < 100:
        return json.dumps({
            "status": "error",
            "message": f"Insufficient training data. Found {len(training_df)} rows, need at least 100."
        })
    
    # Prepare features and target
    feature_cols = [
        'YEAR', 'MONTH', 'FAMILY_CODE', 'WEEK_NUM', 
        'SEASONALITY_FACTOR', 'LAST_WEEK_INVENTORY', 'CURRENT_STOCK'
    ]
    
    # Fill NaN values
    training_df[feature_cols] = training_df[feature_cols].fillna(0)
    
    # Split data
    train_df, test_df = train_test_split(training_df, test_size=0.2, random_state=42)
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        input_cols=feature_cols,
        label_cols=['OPTIMAL_INVENTORY'],
        output_cols=['PREDICTED_OPTIMAL_INVENTORY']
    )
    
    model.fit(train_df)
    
    # Evaluate on test set
    predictions = model.predict(test_df)
    
    y_test = test_df['OPTIMAL_INVENTORY'].values
    y_pred = predictions['PREDICTED_OPTIMAL_INVENTORY'].values
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    # Register model in registry
    reg = Registry(session=session)
    
    model_ref = reg.log_model(
        model=model,
        model_name="INVENTORY_OPTIMIZATION_PREDICTOR",
        comment="Predicts optimal inventory levels based on historical patterns and seasonality",
        metrics={
            "MAE": mae,
            "RMSE": rmse,
            "R2": r2
        }
    )
    
    version_name = model_ref.version_name
    
    return json.dumps({
        "status": "success",
        "model_name": "INVENTORY_OPTIMIZATION_PREDICTOR",
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

-- Train the inventory optimization model
CALL TRAIN_INVENTORY_OPTIMIZATION_MODEL();

-- ========================================================================
-- PREDICTION FUNCTIONS
-- ========================================================================

-- Note: Prediction functions using ML Registry require stored procedures
-- Create a stored procedure for sales prediction instead
CREATE OR REPLACE PROCEDURE GET_SALES_PREDICTION(
    YEAR_INPUT INT,
    MONTH_INPUT INT,
    CATEGORY_INPUT VARCHAR,
    ACCOUNT_INPUT VARCHAR
)
RETURNS OBJECT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-ml-python', 'scikit-learn', 'pandas', 'numpy')
HANDLER = 'predict_sales'
AS
$$
def predict_sales(session, year_input, month_input, category_input, account_input):
    from snowflake.ml.registry import Registry
    import json
    import pandas as pd
    
    try:
        # Get model from registry
        reg = Registry(session)
        model_ref = reg.get_model("SALES_QUANTITY_PREDICTOR")
        model = model_ref.default
        
        # Map inputs to codes
        category_map = {
            'Woods': 1.0, 'Irons': 2.0, 'Wedges': 3.0,
            'Putters': 4.0, 'Balls': 5.0, 'Apparel': 6.0
        }
        account_map = {
            "Dick's Sporting Goods": 1.0, 'Golf Galaxy': 2.0,
            'PGA Tour Superstore': 3.0, 'Online Direct': 4.0
        }
        
        category_code = category_map.get(category_input, 0.0)
        account_code = account_map.get(account_input, 5.0)
        
        # Calculate seasonality
        if month_input in [3, 4, 5]:
            seasonality = 1.5
        elif month_input in [6, 7, 8]:
            seasonality = 1.3
        elif month_input in [11, 12]:
            seasonality = 1.4
        else:
            seasonality = 1.0
        
        # Create input dataframe with proper types
        input_data = pd.DataFrame([{
            'YEAR': int(year_input),
            'MONTH': int(month_input),
            'CATEGORY_CODE': int(category_code),
            'ACCOUNT_CODE': int(account_code),
            'SEASONALITY_FACTOR': float(seasonality),
            'QUALITY_TIER': float(2.0)  # Default to standard
        }])
        
        # Get prediction using run method
        from snowflake.snowpark import Row
        snowpark_df = session.create_dataframe(input_data)
        predictions = model.run(snowpark_df, function_name="predict")
        result = predictions.collect()[0]
        predicted_qty = float(result['PREDICTED_QTY'])
        
        return {
            "status": "success",
            "year": year_input,
            "month": month_input,
            "category": category_input,
            "account": account_input,
            "predicted_quantity": round(predicted_qty, 0),
            "low_estimate": round(predicted_qty * 0.85, 0),
            "high_estimate": round(predicted_qty * 1.15, 0),
            "seasonality_factor": seasonality
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error_type": str(type(e).__name__),
            "error_message": str(e)
        }
$$;

-- Create a stored procedure for inventory prediction
CREATE OR REPLACE PROCEDURE GET_INVENTORY_PREDICTION(
    YEAR_INPUT INT,
    MONTH_INPUT INT,
    FAMILY_INPUT VARCHAR,
    WEEK_INPUT INT,
    CURRENT_STOCK_INPUT FLOAT
)
RETURNS OBJECT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-ml-python', 'scikit-learn', 'pandas', 'numpy')
HANDLER = 'predict_inventory'
AS
$$
def predict_inventory(session, year_input, month_input, family_input, week_input, current_stock_input):
    from snowflake.ml.registry import Registry
    import json
    import pandas as pd
    
    try:
        # Get model from registry
        reg = Registry(session)
        model_ref = reg.get_model("INVENTORY_OPTIMIZATION_PREDICTOR")
        model = model_ref.default
        
        # Map family to code
        family_map = {
            'Drivers': 1.0, 'Fairway Woods': 2.0, 'Hybrids': 3.0,
            'Irons': 4.0, 'Wedges': 5.0, 'Putters': 6.0,
            'Golf Balls': 7.0, 'Apparel': 8.0, 'Accessories': 9.0
        }
        
        family_code = family_map.get(family_input, 0.0)
        
        # Calculate seasonality
        if month_input in [3, 4, 5]:
            seasonality = 1.5
        elif month_input in [6, 7, 8]:
            seasonality = 1.3
        elif month_input in [11, 12]:
            seasonality = 1.4
        else:
            seasonality = 1.0
        
        # Create input dataframe with proper types
        input_data = pd.DataFrame([{
            'YEAR': int(year_input),
            'MONTH': int(month_input),
            'FAMILY_CODE': int(family_code),
            'WEEK_NUM': int(week_input),
            'SEASONALITY_FACTOR': float(seasonality),
            'LAST_WEEK_INVENTORY': float(current_stock_input * 0.95),  # Estimate
            'CURRENT_STOCK': float(current_stock_input)
        }])
        
        # Get prediction using run method
        from snowflake.snowpark import Row
        snowpark_df = session.create_dataframe(input_data)
        predictions = model.run(snowpark_df, function_name="predict")
        result = predictions.collect()[0]
        predicted_inventory = float(result['PREDICTED_OPTIMAL_INVENTORY'])
        
        # Calculate recommendation
        difference = predicted_inventory - current_stock_input
        if difference > 100:
            recommendation = "Increase inventory"
        elif difference < -100:
            recommendation = "Reduce inventory"
        else:
            recommendation = "Maintain current levels"
        
        return {
            "status": "success",
            "year": year_input,
            "month": month_input,
            "family": family_input,
            "week": week_input,
            "current_stock": round(current_stock_input, 0),
            "optimal_inventory": round(predicted_inventory, 0),
            "difference": round(difference, 0),
            "recommendation": recommendation,
            "seasonality_factor": seasonality
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error_type": str(type(e).__name__),
            "error_message": str(e)
        }
$$;

-- ========================================================================
-- VERIFY MODELS CREATED
-- ========================================================================

SHOW MODELS IN LANDING.FLATFILES;

-- Test the prediction procedures
CALL GET_SALES_PREDICTION(2026, 4, 'Woods', 'Dick''s Sporting Goods');

CALL GET_INVENTORY_PREDICTION(2026, 4, 'Drivers', 15, 2500.0);

SELECT 'ML models created and deployed successfully!' AS status;
