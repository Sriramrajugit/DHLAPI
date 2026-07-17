# DHL Shipment Automation - Database Schema

## Tables

### customers
Stores customer information retrieved from Excel/local DB.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | UUID |
| deal_id | TEXT UNIQUE | Deal identifier |
| contract_id | TEXT | Contract identifier |
| customer_name | TEXT | Customer name |
| address_line1 | TEXT | Primary address line |
| address_line2 | TEXT | Secondary address line |
| city | TEXT | City name |
| postal_code | TEXT | Postal/ZIP code |
| country_code | TEXT | ISO country code |
| contact_email | TEXT | Email address |
| contact_phone | TEXT | Phone number |
| created_date | DATETIME | Creation timestamp |
| updated_date | DATETIME | Last update timestamp |

### shipments
Main shipment records.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Shipment ID (SHP-XXXXXXXX) |
| awb_number | TEXT UNIQUE | Airwaybill number |
| deal_id | TEXT | Reference to deal |
| customer_id | TEXT FK | Reference to customer |
| shipment_reference | TEXT | Custom shipment reference |
| weight | REAL | Package weight |
| dimensions | TEXT JSON | Package dimensions |
| piece_count | INTEGER | Number of pieces |
| status | TEXT | Shipment status |
| confidence_score | REAL | AI confidence score (0-100) |
| created_date | DATETIME | Creation timestamp |
| shipped_date | DATETIME | Shipped timestamp |

### validation_results
Stores validation check results.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | UUID |
| shipment_id | TEXT FK | Reference to shipment |
| validation_type | TEXT | Type of validation |
| validation_score | REAL | Score (0-100) |
| validation_result | TEXT | VALID/INVALID |
| details | TEXT JSON | Detailed results |
| created_date | DATETIME | Creation timestamp |

### tracking
Shipment tracking information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | UUID |
| awb_number | TEXT FK | Reference to shipment AWB |
| status | TEXT | Tracking status |
| location | TEXT | Current location |
| timestamp | DATETIME | Status timestamp |
| details | TEXT JSON | Additional details |

### audit_logs
Audit trail for all actions.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | UUID |
| shipment_id | TEXT FK | Reference to shipment |
| action | TEXT | Action performed |
| user_id | TEXT | User who performed action |
| details | TEXT JSON | Action details |
| timestamp | DATETIME | Action timestamp |

### validation_rules
Configuration for validation rules.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | UUID |
| rule_name | TEXT UNIQUE | Rule identifier |
| rule_type | TEXT | Rule category |
| rule_config | TEXT JSON | Rule configuration |
| is_active | BOOLEAN | Rule status |
| created_date | DATETIME | Creation timestamp |
