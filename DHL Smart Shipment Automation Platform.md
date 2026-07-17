# DHL Smart Shipment Automation Platform

## Problem Statement

Operations teams currently retrieve customer information from Excel/local databases and manually create DHL shipments.

The process is vulnerable to:

* Wrong consignee selection
* Incorrect destination address
* Manual data-entry mistakes
* Shipment delays
* Confidential document exposure
* Increased operational risk

The proposed solution introduces a zero-touch shipment creation platform using local mock DHL APIs with intelligent validation controls.

## MVP Scope (Phase 1)

**Development Approach:**
* **Data Source:** Excel or SQLite local database (no Mainframe access)
* **DHL Integration:** Mock/Local API endpoints (no live DHL account required)
* **Authentication:** Integrate with existing authentication (no separate login screen)
* **Timeline:** Ready for immediate development

---

# Solution Overview

The solution automates the complete DHL shipment lifecycle.

## Step 1 – Deal Retrieval

User enters:

* Deal ID
* Contract ID
* Reference Number

System retrieves:

* Customer Name
* Address
* Country
* Postal Code
* Contact Details

from local database (Excel or SQLite).

**Local Implementation:**
* Excel upload via UI or pre-loaded SQLite DB
* Lookup by Deal ID → returns customer details
* Fallback: Manual entry form if not found

---

## Step 2 – Address Validation (Local Mock)

Invoke Local Mock Address Validation API.

Endpoint:

GET /api/v1/validate-address

Validation Parameters:

* countryCode
* postalCode
* cityName
* addressLine1

Purpose:

* Validate delivery capability
* Validate postal code format
* Validate city-country combination
* Prevent invalid shipments

**Local Implementation:**
* Mock API responds with validation rules (regex, lookup tables)
* Rules database: country codes, valid postal code formats
* No external API call required

Decision:

IF Mock Validation = SUCCESS

Continue

ELSE

Stop shipment creation

Display validation errors

---

## Step 3 – Consignee Risk Engine

A custom AI/Rules engine evaluates shipment risk.

### Validation Rules

#### Rule 1

Customer Name Match

Expected:

ABC Technologies Ltd

Entered:

ABC Technology Ltd

Risk Score = Medium

---

#### Rule 2

Postal Code Verification

Compare:

Mainframe Postal Code

vs

DHL Validated Postal Code

---

#### Rule 3

Country Consistency

Ensure:

Customer Country

equals

Shipment Country

---

#### Rule 4

Duplicate Consignee Detection

Detect:

* Similar names
* Similar addresses
* Existing DHL recipients

---

#### Rule 5

Restricted Country Validation

Prevent shipment creation to restricted destinations.

---

## Step 4 – Shipment Creation (Local Mock)

Invoke Local Mock Shipment Creation API.

Shipment payload contains:

### Shipper

Configured DHL Account (hardcoded/config)

### Consignee

Retrieved from local database

### Product

DHL Express Product code (mock)

### Package

* Weight
* Dimensions
* Piece Count

### References

* Deal ID
* Customer ID
* Shipment Reference

**Local Implementation:**
* Mock API generates Shipment ID (UUID)
* Mock API generates AWB Number (sequential or random)
* No live DHL integration

Result:

Shipment ID generated

Airwaybill generated

---

## Step 5 – Label Generation

DHL returns:

* AWB Number
* Shipping Label

Store PDF in repository.

Allow:

* Download
* Email
* Print

---

## Step 6 – Shipment Tracking (Local Mock)

Invoke Local Mock Tracking API.

Endpoint:

GET /api/v1/shipments/{awbNumber}/tracking

Track statuses:

* Shipment Created
* Picked Up
* In Transit
* Customs Clearance
* Delivered
* Exception

**Local Implementation:**
* Mock API returns canned/simulated tracking data
* Can simulate status progression or static states
* No live DHL integration

Dashboard updates automatically.

---

# End-to-End Flow

Mainframe
↓
Customer Retrieval
↓
DHL Address Validation
↓
Risk Engine
↓
Shipment Creation
↓
AWB Generation
↓
Label Storage
↓
Tracking Dashboard

---

# Microservice Architecture (MVP - Monolithic or Modular)

## shipment-service

Responsibilities:

* Create shipment (local mock)
* Generate AWB (mock)
* Generate shipping label PDF
* Store in local file system

---

## validation-service

Responsibilities:

* Local address validation (mock)
* Postal code regex/lookup verification
* Country code verification
* No external API calls

---

## risk-engine-service

Responsibilities:

* Duplicate detection (local DB query)
* Consignee scoring
* Fraud prevention rules

---

## data-service

Responsibilities:

* Excel file import/upload
* SQLite local DB queries
* Customer data retrieval

---

## audit-service

Responsibilities:

* API logs
* User actions (from existing auth)
* Shipment history (local DB)

---

# Database Tables

## shipment

* shipment_id
* awb_number
* deal_id
* customer_name
* country
* status
* created_date

---

## consignee_validation

* validation_id
* shipment_id
* validation_score
* validation_result

---

## shipment_audit

* audit_id
* shipment_id
* action
* user_id
* timestamp

---

# Hackathon Innovation

## AI Consignee Confidence Score

Generate score:

0 – 100

Example:

Customer Name Match = 100%

Address Match = 95%

Postal Match = 100%

Country Match = 100%

Final Confidence = 98%

If score < 85

Require Supervisor Approval.

---

# Expected Benefits (MVP)

## Operational

AWB creation reduced from 5 minutes to less than 30 seconds.

## Quality

Near-zero incorrect consignee selection.

## Compliance

Reduced confidential document leakage risk.

## Business

Improved customer satisfaction and faster shipment processing.

## Strategic

Reusable framework for FedEx, UPS and other logistics providers.

---

# Tech Stack (MVP Implementation)

## Backend
* **Runtime:** Node.js / Python FastAPI / Java Spring Boot
* **Database:** SQLite (local) or PostgreSQL (optional)
* **Mock APIs:** Express/FastAPI endpoints returning JSON
* **Label Generation:** PDFKit or ReportLab

## Frontend
* **UI Framework:** React / Vue / Angular
* **Authentication:** Integrate with existing system (OAuth/JWT)
* **Dashboard:** Real-time shipment status view
* **File Upload:** Excel import module

## Local Services
* **Mock DHL APIs:** Running locally on :3001 / :8000
* **Data Store:** SQLite or JSON files
* **Audit Logs:** Local file or DB table

---

# Implementation Roadmap (Phase 1)

**Week 1:**
- [x] Define local API contracts (Swagger/OpenAPI)
- [x] Setup mock DHL endpoints
- [x] Create SQLite schema for customers & shipments
- [x] Build Excel import module

**Week 2:**
- [ ] Implement validation-service (local rules)
- [ ] Implement shipment-service (mock)
- [ ] Label PDF generation
- [ ] Risk scoring engine

**Week 3:**
- [ ] Frontend dashboard
- [ ] Integration testing
- [ ] End-to-end flow validation
- [ ] Documentation

**Ready to Start:** Yes - No external dependencies required
