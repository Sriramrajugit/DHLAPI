const express = require('express');
const router = express.Router();
const shipmentService = require('../services/shipmentService');
const auditService = require('../services/auditService');

// POST: Create new shipment
router.post('/', async (req, res) => {
  try {
    const shipmentData = req.body;

    // Validate required fields
    const required = ['deal_id', 'customer_id'];
    for (const field of required) {
      if (!shipmentData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const shipment = await shipmentService.createShipment(shipmentData);
    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch shipment by ID
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

// GET: Fetch shipment by AWB number
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

// GET: Fetch all shipments
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

// GET: Fetch shipments by Deal ID
router.get('/deal/:dealId', async (req, res) => {
  try {
    const shipments = await shipmentService.getShipmentsByDealId(req.params.dealId);
    res.status(200).json({ data: shipments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
