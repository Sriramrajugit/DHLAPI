# DHL Shipment API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Currently uses placeholder authentication. Integrate with your existing auth system.

---

## Customers Endpoints

### Get Customer by Deal ID
```
GET /customers/:dealId
```
**Parameters:**
- `dealId` (path): Deal ID string

**Response:**
```json
{
  "id": "uuid",
  "deal_id": "DEAL-001",
  "contract_id": "CONTRACT-001",
  "customer_name": "ABC Technologies Ltd",
  "address_line1": "123 Tech Street",
  "address_line2": "Suite 100",
  "city": "Berlin",
  "postal_code": "10115",
  "country_code": "DE",
  "contact_email": "contact@abctech.com",
  "contact_phone": "+49-30-123-4567",
  "created_date": "2024-01-15T10:30:00Z",
  "updated_date": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `404` - Customer not found
- `500` - Server error

---

### Get All Customers
```
GET /customers?limit=50&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    { /* customer objects */ }
  ],
  "limit": 50,
  "offset": 0
}
```

---

### Create Customer
```
POST /customers
Content-Type: application/json
```

**Request Body:**
```json
{
  "deal_id": "DEAL-NEW",
  "contract_id": "CONTRACT-NEW",
  "customer_name": "New Company Ltd",
  "address_line1": "456 Commerce Road",
  "address_line2": "Building B",
  "city": "London",
  "postal_code": "SW1A 1AA",
  "country_code": "GB",
  "contact_email": "info@newcompany.com",
  "contact_phone": "+44-20-1234-5678"
}
```

**Required Fields:**
- `deal_id`, `customer_name`, `address_line1`, `city`, `postal_code`, `country_code`

**Response:**
```json
{
  "id": "uuid",
  "deal_id": "DEAL-NEW",
  "customer_name": "New Company Ltd",
  /* ... rest of customer data */
  "created_date": "2024-01-15T12:45:00Z"
}
```

**Status Codes:**
- `201` - Created
- `400` - Missing required fields
- `500` - Server error

---

### Update Customer
```
PUT /customers/:customerId
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_name": "Updated Name",
  "contact_email": "newemail@company.com"
}
```

**Response:**
```json
{
  "id": "customerId",
  "customer_name": "Updated Name",
  "contact_email": "newemail@company.com",
  "updated_date": "2024-01-15T13:00:00Z"
}
```

---

## Validation Endpoints

### Validate Address
```
POST /validation/address
Content-Type: application/json
```

**Request Body:**
```json
{
  "postal_code": "10115",
  "country_code": "DE",
  "city": "Berlin",
  "address_line1": "123 Tech Street"
}
```

**Required Fields:**
- `postal_code`, `country_code`, `city`

**Response:**
```json
{
  "validation_id": "uuid",
  "validation_result": "VALID",
  "validation_score": 100,
  "details": {
    "postal_code_valid": true,
    "country_code_valid": true,
    "city_valid": true,
    "overall_valid": true,
    "score": 100,
    "errors": [],
    "details": {
      "postal_code": "Valid postal code format",
      "country": "Valid country code",
      "city": "Valid city name"
    }
  }
}
```

**Validation Rules:**
- Postal code format validation (country-specific regex)
- Country code validation (from supported list)
- City name requirement check

---

### Check Duplicate Consignee
```
POST /validation/duplicate
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_name": "ABC Technologies Ltd",
  "city": "Berlin",
  "postal_code": "10115"
}
```

**Response:**
```json
{
  "is_duplicate": false,
  "duplicate_id": null,
  "similarity_score": 0
}
```

---

### Check Restricted Country
```
POST /validation/restricted-country
Content-Type: application/json
```

**Request Body:**
```json
{
  "country_code": "DE"
}
```

**Response:**
```json
{
  "is_restricted": false,
  "country_code": "DE"
}
```

---

## Shipments Endpoints

### Create Shipment
```
POST /shipments
Content-Type: application/json
```

**Request Body:**
```json
{
  "deal_id": "DEAL-001",
  "customer_id": "uuid",
  "shipment_reference": "REF-12345",
  "weight": 2.5,
  "dimensions": "20x15x10 cm",
  "piece_count": 2,
  "validation_scores": [95, 98, 100]
}
```

**Required Fields:**
- `deal_id`, `customer_id`

**Response:**
```json
{
  "shipment_id": "SHP-A1B2C3D4",
  "awb_number": "0123456789",
  "status": "CREATED",
  "confidence_score": 97.67,
  "created_date": "2024-01-15T14:30:00Z"
}
```

**Confidence Score Calculation:**
- Average of validation_scores array
- Range: 0-100
- If score < 85: Requires supervisor approval

---

### Get Shipment by ID
```
GET /shipments/:shipmentId
```

**Response:**
```json
{
  "id": "SHP-A1B2C3D4",
  "awb_number": "0123456789",
  "deal_id": "DEAL-001",
  "customer_id": "uuid",
  "shipment_reference": "REF-12345",
  "weight": 2.5,
  "dimensions": "20x15x10 cm",
  "piece_count": 2,
  "status": "CREATED",
  "confidence_score": 97.67,
  "created_date": "2024-01-15T14:30:00Z",
  "shipped_date": null
}
```

---

### Get Shipment by AWB
```
GET /shipments/awb/:awbNumber
```

**Response:** Same as Get Shipment by ID

---

### Get All Shipments
```
GET /shipments?limit=50&offset=0
```

**Response:**
```json
{
  "data": [ /* shipment objects */ ],
  "limit": 50,
  "offset": 0
}
```

---

### Update Shipment Status
```
PUT /shipments/:shipmentId/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Valid Statuses:**
- `CREATED`
- `SHIPPED`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELIVERED`

**Response:**
```json
{
  "shipment_id": "SHP-A1B2C3D4",
  "status": "SHIPPED",
  "updated_date": "2024-01-15T15:00:00Z"
}
```

---

### Get Shipments by Deal ID
```
GET /shipments/deal/:dealId
```

**Response:**
```json
{
  "data": [ /* shipment objects */ ]
}
```

---

## Tracking Endpoints

### Add Tracking Update
```
POST /tracking
Content-Type: application/json
```

**Request Body:**
```json
{
  "awb_number": "0123456789",
  "status": "PICKED_UP",
  "location": "Origin Facility",
  "details": "Package picked up for shipment"
}
```

**Required Fields:**
- `awb_number`, `status`

**Response:**
```json
{
  "id": "uuid",
  "awb_number": "0123456789",
  "status": "PICKED_UP",
  "location": "Origin Facility",
  "timestamp": "2024-01-15T15:30:00Z"
}
```

---

### Get Tracking History
```
GET /tracking/:awbNumber
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "awb_number": "0123456789",
      "status": "SHIPMENT_CREATED",
      "location": "Origin Facility",
      "timestamp": "2024-01-15T14:30:00Z",
      "details": "Shipment created and ready for pickup"
    },
    {
      "id": "uuid",
      "awb_number": "0123456789",
      "status": "PICKED_UP",
      "location": "Origin Facility",
      "timestamp": "2024-01-15T15:30:00Z",
      "details": "Package picked up"
    }
  ]
}
```

---

### Get Latest Tracking Status
```
GET /tracking/:awbNumber/latest
```

**Response:**
```json
{
  "id": "uuid",
  "awb_number": "0123456789",
  "status": "PICKED_UP",
  "location": "Origin Facility",
  "timestamp": "2024-01-15T15:30:00Z",
  "details": "Package picked up"
}
```

---

### Simulate Tracking (Mock)
```
POST /tracking/:awbNumber/simulate
```

**Response:**
```json
{
  "message": "Tracking simulation started",
  "updates": [
    { /* tracking update 1 */ },
    { /* tracking update 2 */ },
    { /* tracking update 3 */ }
  ]
}
```

**Simulates progression:**
1. SHIPMENT_CREATED
2. PICKED_UP
3. IN_TRANSIT
4. OUT_FOR_DELIVERY
5. DELIVERED

---

## Audit Endpoints

### Get Audit Logs
```
GET /audit?limit=50&offset=0&shipment_id=optional
```

**Query Parameters:**
- `limit` (optional): Records per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `shipment_id` (optional): Filter by shipment

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "shipment_id": "SHP-A1B2C3D4",
      "action": "SHIPMENT_CREATED",
      "user_id": "SYSTEM",
      "details": {
        "confidence_score": 97.67,
        "deal_id": "DEAL-001"
      },
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

---

### Get Audit Logs for Shipment
```
GET /audit/shipment/:shipmentId?limit=50&offset=0
```

**Response:** Same as Get Audit Logs (filtered by shipment)

---

## Supported Country Codes

```
US, DE, GB, FR, IT, ES, NL, BE, AT, CH,
SE, NO, DK, FI, AU, NZ, SG, JP, CN, IN,
BR, MX, CA, IE, ZA
```

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Missing required field: customer_name",
  "status": 400
}
```

### 404 - Not Found
```json
{
  "error": "Customer not found",
  "status": 404
}
```

### 500 - Internal Server Error
```json
{
  "error": "Internal Server Error",
  "status": 500
}
```

---

## Rate Limiting
Currently: No rate limiting (mock environment)

## CORS
- Origin: `http://localhost:3000` (configurable via .env)
- Methods: GET, POST, PUT, DELETE
- Headers: Content-Type, Authorization

## Testing

### cURL Examples

```bash
# List customers
curl http://localhost:3001/api/customers

# Get customer by Deal ID
curl http://localhost:3001/api/customers/DEAL-001

# Validate address
curl -X POST http://localhost:3001/api/validation/address \
  -H "Content-Type: application/json" \
  -d '{"postal_code":"10115","country_code":"DE","city":"Berlin"}'

# Create shipment
curl -X POST http://localhost:3001/api/shipments \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"DEAL-001","customer_id":"uuid","piece_count":2}'
```

### Postman Collection
Ready to export - import into Postman for testing all endpoints with pre-configured requests.
