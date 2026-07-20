# DHL Smart Shipment Automation Platform

Complete project scaffolding with local mock APIs, JSON file storage for the demo backend, and React frontend.

## Project Structure

```
DHL_proposal/
├── backend/
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── services/            # Business logic
│   │   ├── controllers/         # Controllers (future)
│   │   ├── middleware/          # Express middleware
│   │   ├── utils/               # Utilities & helpers
│   │   └── index.js             # Main app entry
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API client
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   ├── migrations/              # Database setup scripts
│   ├── seeds/                   # Sample data
│   ├── SCHEMA.md                # Database schema documentation
│   └── dhl_shipment.json        # Demo data store (auto-created)
└── docs/                        # Documentation
```

## Quick Start

### Prerequisites
- Node.js 14+ and npm
- Windows/Mac/Linux

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment
copy .env.example .env

# Initialize database
npm run migrate

# Seed sample data
npm run seed

# Start backend server
npm start
# Runs on http://localhost:3001
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
copy .env.example .env

# Start frontend dev server
npm start
# Runs on http://localhost:3000
```

## Available APIs

### Customers
- `GET /api/customers/:dealId` - Get customer by Deal ID
- `GET /api/customers` - Get all customers (paginated)
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:customerId` - Update customer

### Validation
- `POST /api/validation/address` - Validate address
- `POST /api/validation/duplicate` - Check duplicate consignee
- `POST /api/validation/restricted-country` - Check restricted country

### Shipments
- `POST /api/shipments` - Create shipment
- `GET /api/shipments/:shipmentId` - Get shipment by ID
- `GET /api/shipments/awb/:awbNumber` - Get shipment by AWB
- `GET /api/shipments` - Get all shipments (paginated)
- `PUT /api/shipments/:shipmentId/status` - Update shipment status
- `GET /api/shipments/deal/:dealId` - Get shipments by Deal ID

### Tracking
- `POST /api/tracking` - Add tracking update
- `GET /api/tracking/:awbNumber` - Get tracking history
- `GET /api/tracking/:awbNumber/latest` - Get latest tracking status
- `POST /api/tracking/:awbNumber/simulate` - Simulate tracking progression

### Audit
- `GET /api/audit` - Get audit logs (paginated)
- `GET /api/audit/shipment/:shipmentId` - Get logs for specific shipment

## Features Implemented

### Backend
✅ Express.js REST API
✅ JSON file storage with 6 logical collections
✅ Mock DHL APIs (no external integration needed)
✅ Address validation with country-specific rules
✅ Shipment creation with confidence scoring
✅ Tracking simulation (mock)
✅ Audit trail logging
✅ Error handling & middleware

### Frontend
✅ React dashboard with statistics
✅ Multi-step shipment creation wizard
✅ Address validation integration
✅ Shipment list with pagination
✅ Tracking timeline visualization
✅ Responsive design
✅ API client service layer

### Database
✅ JSON file storage (local, zero-config)
✅ 6 pre-defined logical collections
✅ Sample data (5 customers)
✅ Auto-initialization on startup
✅ Audit trail support

## Sample Workflow

1. **Start Backend**: `npm start` in `/backend`
2. **Start Frontend**: `npm start` in `/frontend`
3. **Access App**: Open http://localhost:3000
4. **Create Shipment**:
   - Enter Deal ID (e.g., DEAL-001)
   - System fetches customer from DB
   - Validates address (mock rules)
   - Creates shipment with AWB
   - Generates confidence score
5. **Track Shipment**:
   - Enter AWB number
   - View tracking history
   - Click "Simulate Progress" to advance status

## Sample Data (Pre-loaded)

| Deal ID | Customer | City | Country |
|---------|----------|------|---------|
| DEAL-001 | ABC Technologies Ltd | Berlin | DE |
| DEAL-002 | Global Supplies Inc | London | GB |
| DEAL-003 | European Distributors | Amsterdam | NL |
| DEAL-004 | Tech Solutions France | Paris | FR |
| DEAL-005 | Iberian Trading Co | Madrid | ES |

## Next Steps

1. ✅ **Phase 1 Complete**: Project scaffolding with mock APIs
2. 🔄 **Phase 2**: Excel import module
3. 🔄 **Phase 3**: Advanced risk scoring engine
4. 🔄 **Phase 4**: PDF label generation
5. 🔄 **Phase 5**: Real DHL API integration (when account ready)

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_PATH=./database/dhl_shipment.json
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your_secret_key_here
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_API_TIMEOUT=30000
```

## Troubleshooting

**Backend won't start**
- Ensure port 3001 is not in use
- Delete the old `.json` data file and reseed

**Frontend can't connect to API**
- Check backend is running on port 3001
- Verify CORS origin in backend .env

**Database errors**
- Run `npm run migrate` to reinitialize schema
- Run `npm run seed` to reload sample data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | JSON file storage |
| Frontend | React 18 |
| API Client | Axios |
| Routing | React Router v6 |
| Styling | CSS3 |

## License

Proprietary - DHL Shipment Automation Platform
