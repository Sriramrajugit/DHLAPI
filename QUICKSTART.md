# DHL Shipment Platform - Quick Start Guide

## 5-Minute Setup

### What You'll Have
✅ Backend API on localhost:3001
✅ Frontend on localhost:3000
✅ SQLite database with sample data
✅ Mock DHL APIs (no account needed)

### Step 1: Terminal A (Backend)
```bash
cd backend
npm install
npm run migrate
npm run seed
npm start
```
**Expected Output:**
```
DHL Shipment API running on http://localhost:3001
✓ Database initialized successfully
✓ Tables created: customers, shipments, validation_results, tracking, audit_logs, validation_rules
```

### Step 2: Terminal B (Frontend)
```bash
cd frontend
npm install
npm start
```
**Expected Output:**
```
Compiled successfully!
On Your Network: http://192.168.x.x:3000
```
Then browser opens to http://localhost:3000

## Testing the System

### Test 1: Dashboard
1. Navigate to Dashboard
2. Should show stats like "5 Total Customers"

### Test 2: Create Shipment (End-to-End)
1. Click **Create Shipment**
2. Enter Deal ID: `DEAL-001`
3. Click **Lookup Customer**
4. System retrieves: ABC Technologies Ltd, Berlin, Germany
5. Click **Validate Address**
6. System validates postal code + country combo
7. Enter piece count, weight (optional)
8. Click **Create Shipment**
9. ✅ Success! AWB number generated

### Test 3: Track Shipment
1. Copy AWB number from success message
2. Go to **Track** page
3. Paste AWB number, click Search
4. View tracking timeline
5. Click **Simulate Progress** to advance status

### Test 4: View All Shipments
1. Go to **View Shipments**
2. See shipments in table
3. Pagination working

## API Endpoints (Quick Test)

### Using cURL

**Create Customer:**
```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "deal_id": "DEAL-999",
    "customer_name": "Test Co",
    "address_line1": "123 Test St",
    "city": "TestCity",
    "postal_code": "12345",
    "country_code": "US"
  }'
```

**Validate Address:**
```bash
curl -X POST http://localhost:3001/api/validation/address \
  -H "Content-Type: application/json" \
  -d '{
    "postal_code": "10115",
    "country_code": "DE",
    "city": "Berlin"
  }'
```

**Create Shipment:**
```bash
curl -X POST http://localhost:3001/api/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "deal_id": "DEAL-001",
    "customer_id": "<customer-id>",
    "weight": 2.5,
    "piece_count": 3
  }'
```

## Database Info

**Location:** `database/dhl_shipment.db`

**Sample Customers Loaded:**
- DEAL-001: ABC Technologies Ltd (Berlin, DE)
- DEAL-002: Global Supplies Inc (London, GB)
- DEAL-003: European Distributors (Amsterdam, NL)
- DEAL-004: Tech Solutions France (Paris, FR)
- DEAL-005: Iberian Trading Co (Madrid, ES)

**To Reset Database:**
```bash
# Delete old database
rm database/dhl_shipment.db

# Backend terminal: Reinitialize
npm run migrate
npm run seed
```

## Stopping Services

**Backend:** Press `Ctrl+C` in Terminal A
**Frontend:** Press `Ctrl+C` in Terminal B

## Next Phase

Ready to add:
- ✅ Excel import module
- ✅ Advanced risk scoring
- ✅ PDF label generation
- ✅ Real DHL API integration

## Common Issues

| Issue | Solution |
|-------|----------|
| Port 3001 in use | Change PORT in backend/.env |
| Module not found | Run `npm install` again |
| CORS error | Verify backend .env CORS_ORIGIN |
| Empty dashboard | Run `npm run seed` in backend |
| Database locked | Restart backend, delete .db-shm/.db-wal |

## Architecture Diagram

```
┌─────────────┐
│   React     │
│  Frontend   │ (port 3000)
│ Dashboard   │
└──────┬──────┘
       │ HTTP/REST
       │ (Axios)
       ▼
┌─────────────────────────────┐
│   Express.js Backend        │ (port 3001)
│  ┌──────────────────────┐   │
│  │ Route Handlers       │   │
│  │ ├─ customers         │   │
│  │ ├─ validation        │   │
│  │ ├─ shipments         │   │
│  │ ├─ tracking          │   │
│  │ └─ audit             │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ Services             │   │
│  │ ├─ customerService   │   │
│  │ ├─ validationService │   │
│  │ ├─ shipmentService   │   │
│  │ ├─ trackingService   │   │
│  │ └─ auditService      │   │
│  └──────────────────────┘   │
└──────────┬──────────────────┘
           │ SQL
           ▼
┌─────────────────────┐
│  SQLite Database    │
│  dhl_shipment.db    │
│  ├─ customers       │
│  ├─ shipments       │
│  ├─ validation_*    │
│  ├─ tracking        │
│  └─ audit_logs      │
└─────────────────────┘
```

## What's Ready

✅ **Backend** - Full REST API with services
✅ **Frontend** - React dashboard with all pages
✅ **Database** - SQLite with schema & sample data
✅ **Mock APIs** - No external dependencies
✅ **Authentication** - Placeholder (use your integration)
✅ **Error Handling** - Comprehensive
✅ **Audit Trail** - All actions logged

## What's Next

After confirming this works:
1. Excel/CSV import → `backend/src/services/excelService.js`
2. Risk scoring → Enhanced `validationService.js`
3. PDF generation → `backend/src/utils/pdfGenerator.js`
4. Real DHL APIs → Swap mock endpoints in services

Enjoy! 🚀
