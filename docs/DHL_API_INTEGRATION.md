# DHL Express API Integration Guide

## Create Shipment Endpoint (POST /shipments)

### Overview
Creates a DHL Express shipment with AWB (Air Waybill) number generation and label creation.

---

## Required Headers

| Header | Type | Description |
|--------|------|-------------|
| `Content-Type` | string | `application/json` |
| `messageReferenceHeader` | string | Unique message reference ID |
| `messageReferenceDateHeader` | string | ISO 8601 date (YYYY-MM-DDTHH:MM:SSZ) |
| `xVersionHeader` | string | API version (e.g., `1.0`) |

### Optional Headers
- `3PVpluginNameHeader` - 3rd party plugin name
- `3PVpluginVersionHeader` - Plugin version
- `3PVshippingSystemPlatformNameHeader` - Shipping system platform
- `3PVshippingSystemPlatformVersionHeader` - Platform version

---

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `shpStrictValidation` | boolean | false | Enable strict validation |
| `bypassPLTError` | boolean | false | Bypass Paperless Trade errors |
| `validateDataOnly` | boolean | false | Validate without creating shipment |
| `bypassLabelfreeError` | boolean | false | Bypass label-free errors |

---

## Request Body Schema

### Root Level

```json
{
  "deal_id": "string (required)",
  "customer_id": "string (required)",
  "shipment_reference": "string (optional)",
  "product_code": "string (enum: P, E, N, X, Y)",
  "content_type": "string (enum: NON_DOC, DOC)",
  "validation_scores": [number],
  
  "shipper": {
    "name": "string (required)",
    "address": {
      "address_line1": "string (required)",
      "address_line2": "string (optional)",
      "city": "string (required)",
      "postal_code": "string (required)",
      "state_code": "string (optional)",
      "country_code": "string (required, ISO 3166-1 Alpha-2)"
    },
    "email": "string (optional)",
    "phone": "string (optional)",
    "account_number": "string (optional)"
  },
  
  "receiver": {
    "name": "string (required)",
    "address": {
      "address_line1": "string (required)",
      "address_line2": "string (optional)",
      "city": "string (required)",
      "postal_code": "string (required)",
      "state_code": "string (optional)",
      "country_code": "string (required, ISO 3166-1 Alpha-2)"
    },
    "email": "string (optional)",
    "phone": "string (optional)"
  },
  
  "pieces": [
    {
      "piece_number": "number (auto-generated)",
      "weight": "number (required)",
      "weightUom": "string (enum: KG, LB, default: KG)",
      "length": "number (required)",
      "width": "number (required)",
      "height": "number (required)",
      "unitOfMeasure": "string (enum: CM, IN, default: CM)",
      "description": "string (optional)",
      "sku": "string (optional)"
    }
  ],
  
  "special_services": [
    {
      "service_code": "string",
      "value": "number (optional)"
    }
  ],
  
  "invoice": {
    "invoice_number": "string (optional)",
    "invoice_date": "string (YYYY-MM-DD, optional)",
    "currency_code": "string (ISO 4217, optional)",
    "terms_of_trade": "string (optional)",
    "amount": "number (optional)",
    "payment_method": "string (optional)"
  }
}
```

---

## DHL Product Codes

| Code | Description |
|------|-------------|
| `P` | DHL Express Worldwide (Default) |
| `E` | DHL Express 9:00 |
| `N` | DHL Express 10:30 |
| `X` | DHL Express 10:30 Saturday |
| `Y` | DHL Express 12:00 |

---

## Content Types

| Type | Description |
|------|-------------|
| `NON_DOC` | Non-document shipments |
| `DOC` | Document-only shipments |

---

## Response (201 Created)

```json
{
  "shipment_id": "SHP-12A4B5C6",
  "awb_number": "891234",
  "status": "CREATED",
  "confidence_score": 95.5,
  "created_date": "2026-07-19T10:30:00Z",
  
  "label": {
    "type": "application/pdf",
    "data": "base64-encoded-pdf-data",
    "format": "base64"
  },
  
  "details": {
    "piece_count": 1,
    "total_weight": 2.5,
    "weight_uom": "KG",
    "shipper": "John Doe",
    "receiver": "Jane Smith",
    "product": "P"
  }
}
```

---

## Example Request

```json
{
  "deal_id": "DEAL-001",
  "customer_id": "CUST-001",
  "shipment_reference": "REF-2026-001",
  "product_code": "P",
  "content_type": "NON_DOC",
  "validation_scores": [95],
  
  "shipper": {
    "name": "Sender Company",
    "address": {
      "address_line1": "123 Main Street",
      "city": "Berlin",
      "postal_code": "10115",
      "country_code": "DE"
    }
  },
  
  "receiver": {
    "name": "Recipient Company",
    "address": {
      "address_line1": "456 Oak Avenue",
      "city": "Paris",
      "postal_code": "75001",
      "country_code": "FR"
    }
  },
  
  "pieces": [
    {
      "weight": 2.5,
      "weightUom": "KG",
      "length": 20,
      "width": 15,
      "height": 10,
      "unitOfMeasure": "CM",
      "description": "Sample Product"
    }
  ],
  
  "special_services": [
    {
      "service_code": "SIG",
      "value": 0
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed: deal_id is required, receiver address is required"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Invalid product_code. Must be one of: P, E, N, X, Y"
}
```

### 500 Internal Server Error
```json
{
  "error": "Process error occurred while creating shipment"
}
```

---

## Database Schema Extension

The following fields have been added to support DHL API:

```sql
ALTER TABLE shipments ADD COLUMN shipper_name VARCHAR(255);
ALTER TABLE shipments ADD COLUMN shipper_address JSON;
ALTER TABLE shipments ADD COLUMN receiver_name VARCHAR(255);
ALTER TABLE shipments ADD COLUMN receiver_address JSON;
ALTER TABLE shipments ADD COLUMN product_code VARCHAR(10);
ALTER TABLE shipments ADD COLUMN content_type VARCHAR(50);
ALTER TABLE shipments ADD COLUMN special_services JSON;
ALTER TABLE shipments ADD COLUMN invoice_data JSON;
```

---

## Validation Rules

✅ **Required Fields:**
- deal_id
- customer_id  
- shipper.name & shipper.address
- receiver.name & receiver.address
- pieces[].weight, pieces[].length, pieces[].width, pieces[].height

✅ **Product Codes:** Must be one of P, E, N, X, Y

✅ **Content Type:** Must be NON_DOC or DOC

✅ **Country Code:** ISO 3166-1 Alpha-2 format (e.g., DE, FR, US)

✅ **Weight UOM:** KG or LB

✅ **Dimension UOM:** CM or IN

---

## Integration Notes

1. **Address Validation**: Addresses are validated using the address validation service before shipment creation.

2. **Confidence Score**: Calculated from validation scores array. Range: 0-100%

3. **AWB Generation**: Auto-generated in format: `XXXXXX` (6 digits)

4. **Label Generation**: Currently returns mock base64-encoded PDF. Will integrate with actual DHL API for production labels.

5. **Special Services**: Optional services like signature required (SIG), insurance, etc.

6. **Multi-piece**: Supports multiple pieces in a single shipment with individual dimensions and weights.

---

## Test Case

**Deal ID:** `DEAL-001` (pre-loaded in database)
**Customer:** John Smith, Berlin
**Recipient:** Jane Doe, Paris
**Weight:** 2.5 KG
**Pieces:** 1
**Product:** P (DHL Express Worldwide)

