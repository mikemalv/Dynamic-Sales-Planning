# Snowflake SQL Scripts

This directory contains all the SQL scripts needed to set up the Snowflake backend for the Callaway Dynamic Sales Planning application.

## Directory Structure

```
sql/
├── DYNAMIC_PLANNING_INVENTORY.sql      # Inventory table DDL
├── DYNAMIC_PLANNING_RETAILER.sql       # Retailer table DDL
├── DYNAMIC_PLANNING_SALES_FORECAST.sql # Sales forecast table DDL
├── DYNAMIC_PLANNING_SALES_INVOICE.sql  # Sales invoice table DDL
├── TEST_QUERIES.sql                    # Test queries for validation
└── ml-models/
    ├── 03_create_ml_models.sql         # Creates ML models for LANDING.FLATFILES
    └── 06_deploy_ml_model.sql          # Deploys product launch revenue predictor
```

## Setup Order

1. **Create Tables**: Run the DDL scripts in any order to create the base tables
2. **Load Data**: Use Snowflake's COPY INTO command to load CSV data into tables
3. **Train ML Models**: Run the ML model scripts to create prediction capabilities

## ML Models

### Sales Quantity Predictor (`SALES_QUANTITY_PREDICTOR`)
- **Database**: LANDING.FLATFILES
- **Purpose**: Predicts sales quantities based on historical invoice data
- **Features**: Year, Month, Category, Account, Seasonality, Quality Tier
- **Algorithm**: Random Forest Regressor

### Inventory Optimization Predictor (`INVENTORY_OPTIMIZATION_PREDICTOR`)
- **Database**: LANDING.FLATFILES
- **Purpose**: Predicts optimal inventory levels
- **Features**: Year, Month, Product Family, Week, Current Stock, Seasonality
- **Algorithm**: Random Forest Regressor

### Product Launch Revenue Predictor (`PRODUCT_LAUNCH_REVENUE_PREDICTOR`)
- **Database**: CALLAWAY_DYN_SALES.PLANNING_SCHEMA
- **Purpose**: Predicts revenue for new product launches
- **Features**: Product attributes, market conditions, timing factors
- **Algorithm**: Random Forest Regressor

## Usage Examples

### Get Sales Prediction
```sql
CALL LANDING.FLATFILES.GET_SALES_PREDICTION(
    2026,                       -- Year
    4,                          -- Month
    'Woods',                    -- Category
    'Dick''s Sporting Goods'    -- Account
);
```

### Get Inventory Prediction
```sql
CALL LANDING.FLATFILES.GET_INVENTORY_PREDICTION(
    2026,       -- Year
    4,          -- Month
    'Drivers',  -- Product Family
    15,         -- Week Number
    2500.0      -- Current Stock
);
```

### Get Launch Forecast
```sql
SELECT CALLAWAY_DYN_SALES.PLANNING_SCHEMA.GET_LAUNCH_FORECAST(
    5,              -- Product Key
    1,              -- Region Key
    '2026-01-15'    -- Launch Date
) AS forecast;
```

## Required Permissions

To train and use these ML models, your Snowflake role needs:
- `CREATE PROCEDURE` privilege on the schema
- `USAGE` on the ML Model Registry
- `SELECT` on the source tables
- `USAGE` on a warehouse with appropriate compute
