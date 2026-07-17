const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');

// GET: Fetch audit logs
router.get('/', async (req, res) => {
  try {
    const shipmentId = req.query.shipment_id || null;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const logs = await auditService.getAuditLogs(shipmentId, limit, offset);
    res.status(200).json({ data: logs, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch audit logs for specific shipment
router.get('/shipment/:shipmentId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const logs = await auditService.getAuditLogs(req.params.shipmentId, limit, offset);
    res.status(200).json({ data: logs, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
