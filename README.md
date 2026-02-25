# Callaway Dynamic Sales Planning

A modern, AI-powered sales planning and forecasting dashboard built for Callaway Golf. This application combines real-time Snowflake data visualization with Cortex AI capabilities to provide intelligent insights and natural language data querying.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![Snowflake](https://img.shields.io/badge/Snowflake-Cortex%20AI-29B5E8)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

## Features

### Dashboard
- **Sales Overview**: Real-time sales metrics with trend analysis
- **Inventory Tracking**: Current inventory levels across warehouses
- **Retailer Performance**: Distribution and sales volume by retailer tier
- **Market Share Analysis**: Iron club market share data with competitor comparison
- **Interactive Charts**: Recharts-powered visualizations with tooltips

### Planning & Forecasting
- **Scenario Planning**: Adjust parameters to see projected outcomes
- **ML-Powered Predictions**: Snowflake Model Registry integration for sales quantity predictions
- **Regional Analysis**: Forecasts broken down by geographic region
- **Product Category Insights**: Category-level planning tools

### CallawAI Assistant
- **Natural Language Queries**: Ask questions about your data in plain English
- **Two Modes**:
  - **Data Q&A**: Converts questions to SQL and returns actual data results
  - **AI Chat**: General conversation powered by Cortex REST API
- **Multiple LLM Options**: Claude Sonnet 4.5, Claude 3.5 Sonnet, Llama 3.1, Mistral Large 2
- **Smart Table Display**: Query results displayed in formatted tables

### ML Optimizer
- **Snowflake Model Registry**: Integrated with `SALES_QUANTITY_PREDICTOR` model
- **Seasonal Forecasting**: 12-month predictions with seasonality factors
- **Confidence Scoring**: Visual confidence indicators for predictions

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts
- **Backend**: Snowflake (SQL, Cortex AI, Model Registry)
- **AI/ML**:
  - Cortex REST API (`/api/v2/cortex/inference:complete`)
  - `AI_COMPLETE()` SQL function
  - Snowflake Model Registry

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard  │  Planning  │  CallawAI  │  ML Optimizer           │
└──────┬──────┴─────┬──────┴─────┬──────┴──────┬──────────────────┘
       │            │            │             │
       ▼            ▼            ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
├──────────────┬──────────────┬───────────────┬───────────────────┤
│ /api/sales   │ /api/forecast│/api/cortex-   │ /api/ml-forecast  │
│ /api/inventory│/api/retailer│    chat       │                   │
│ /api/iron-share│            │/api/nlq-to-sql│                   │
└──────┬───────┴──────┬───────┴───────┬───────┴─────────┬─────────┘
       │              │               │                 │
       ▼              ▼               ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Snowflake                                │
├─────────────────────────────────────────────────────────────────┤
│  LANDING_CO.FLATFILES              │  Cortex AI                  │
│  ├── DYNAMIC_PLANNING_SALES_FORECAST│  ├── REST API (claude-4.5) │
│  ├── DYNAMIC_PLANNING_INVENTORY    │  └── AI_COMPLETE() SQL     │
│  ├── DYNAMIC_PLANNING_RETAILER     │                             │
│  ├── DYNAMIC_PLANNING_SALES_INVOICE│  Model Registry             │
│  └── DYNAMIC_PLANNING_IRON_SHARE_GTD│ └── SALES_QUANTITY_PREDICTOR│
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Snowflake account with Cortex AI enabled
- Programmatic Access Token (PAT) for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mikemalv/Dynamic-Sales-Planning.git
cd Dynamic-Sales-Planning
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure your Snowflake credentials in `.env.local`:
```env
SNOWFLAKE_ACCOUNT=your-account-identifier
SNOWFLAKE_PAT=your-programmatic-access-token
SNOWFLAKE_WAREHOUSE=your-warehouse
SNOWFLAKE_DATABASE=LANDING_CO
SNOWFLAKE_SCHEMA=FLATFILES
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SNOWFLAKE_ACCOUNT` | Snowflake account identifier (e.g., `SFSENORTHAMERICA-DEMO_MMALVEIRA`) | Yes |
| `SNOWFLAKE_PAT` | Programmatic Access Token for authentication | Yes |
| `SNOWFLAKE_WAREHOUSE` | Warehouse to use for queries | Yes |
| `SNOWFLAKE_DATABASE` | Default database | Yes |
| `SNOWFLAKE_SCHEMA` | Default schema | Yes |
| `SNOWFLAKE_USER` | Username (fallback if PAT not used) | No |
| `SNOWFLAKE_PASSWORD` | Password (fallback if PAT not used) | No |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sales` | GET | Fetch sales invoice data |
| `/api/forecast` | GET | Get sales forecasts |
| `/api/inventory` | GET | Current inventory levels |
| `/api/retailer` | GET | Retailer performance data |
| `/api/iron-share` | GET | Iron market share data |
| `/api/cortex-chat` | POST | AI chat via Cortex REST API |
| `/api/nlq-to-sql` | POST | Natural language to SQL conversion |
| `/api/ml-forecast` | GET/POST | ML model predictions |

## Database Schema

### Tables in LANDING_CO.FLATFILES

- **DYNAMIC_PLANNING_SALES_FORECAST**: Product forecasts by region and time
- **DYNAMIC_PLANNING_INVENTORY**: Stock levels by warehouse
- **DYNAMIC_PLANNING_RETAILER**: Retailer info with sales volume and tier
- **DYNAMIC_PLANNING_SALES_INVOICE**: Historical invoice records
- **DYNAMIC_PLANNING_IRON_SHARE_GTD**: Market share with monthly trends

### ML Models in LANDING.FLATFILES

- **SALES_QUANTITY_PREDICTOR**: Predicts sales quantities based on year, month, category, account, seasonality, and quality tier

## Usage Examples

### CallawAI - Data Q&A Mode
Ask questions like:
- "Show me the top 5 products by market share"
- "What is our inventory for Apex Pro irons?"
- "Which retailers have the highest sales volume?"

### CallawAI - AI Chat Mode
General questions:
- "How is golf scored?"
- "What features does the Paradym Ai Smoke driver have?"
- "Explain market share trends in the iron category"

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software developed for Callaway Golf.

## Acknowledgments

- Built with [Snowflake Cortex AI](https://docs.snowflake.com/en/user-guide/snowflake-cortex)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
