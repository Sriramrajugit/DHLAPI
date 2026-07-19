const express = require('express');
const router = express.Router();
const shipmentService = require('../services/shipmentService');
const auditService = require('../services/auditService');

// POST: Create new shipment (DHL Express API compliant)
router.post('/', async (req, res) => {
  try {
    const shipmentData = req.body;

    // Validate DHL required headers (from request)
    const messageReference = req.headers['messagereference'] || req.headers['messageReferenceHeader'];
    const messageReferenceDate = req.headers['messagereference-date'] || req.headers['messageReferenceDateHeader'];
    const xVersion = req.headers['x-version'] || req.headers['xVersionHeader'] || '1.0';

    // Query parameters (optional validation flags)
    const shpStrictValidation = req.query.shpStrictValidation === 'true';
    const validateDataOnly = req.query.validateDataOnly === 'true';

    // Validate minimum required fields for DHL API
    const required = ['deal_id', 'customer_id'];
    for (const field of required) {
      if (!shipmentData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // If strict validation is enabled, require more fields
    if (shpStrictValidation) {
      if (!shipmentData.shipper || !shipmentData.shipper.address) {
        return res.status(400).json({ error: 'Shipper and address required in strict mode' });
      }
      if (!shipmentData.receiver || !shipmentData.receiver.address) {
        return res.status(400).json({ error: 'Receiver and address required in strict mode' });
      }
      if (!shipmentData.pieces || shipmentData.pieces.length === 0) {
        return res.status(400).json({ error: 'Pieces information required in strict mode' });
      }
    }

    // If validateDataOnly flag is set, only validate and return result
    if (validateDataOnly) {
      return res.status(200).json({
        validation_result: 'OK',
        message: 'Data validation successful. Ready to create shipment.',
        data: shipmentData
      });
    }

    // Create shipment with DHL parameters
    const shipment = await shipmentService.createShipment(shipmentData);

    // Add header information to response
    res.set('Message-Reference', messageReference || 'N/A');
    res.set('Message-Reference-Date', messageReferenceDate || new Date().toISOString());
    res.set('API-Version', xVersion);
    res.set('Location', `/api/shipments/${shipment.shipment_id}`);

    res.status(201).json(shipment);
  } catch (error) {
    if (error.message.includes('Validation failed')) {
      return res.status(422).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all shipments (must come before /:shipmentId route)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const shipments = await shipmentService.getAllShipments(limit, offset);
    res.status(200).json({ data: shipments, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch shipments by AWB number (specific route before generic :id)
router.get('/awb/:awbNumber', async (req, res) => {
  try {
    const shipment = await shipmentService.getShipmentByAWB(req.params.awbNumber);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.status(200).json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch shipments by Deal ID (specific route before generic :id)
router.get('/deal/:dealId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const shipments = await shipmentService.getShipmentsByDealId(req.params.dealId, limit, offset);
    res.status(200).json({ data: shipments, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch shipments by Customer ID (specific route before generic :id)
router.get('/customer/:customerId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const shipments = await shipmentService.getShipmentsByCustomerId(req.params.customerId, limit, offset);
    res.status(200).json({ data: shipments, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch shipment by ID (generic route after specific routes)
router.get('/:shipmentId', async (req, res) => {
  try {
    const shipment = await shipmentService.getShipment(req.params.shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.status(200).json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update shipment status
router.put('/:shipmentId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await shipmentService.updateShipmentStatus(req.params.shipmentId, status);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
