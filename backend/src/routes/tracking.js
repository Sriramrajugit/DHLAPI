const express = require('express');
const router = express.Router();
const trackingService = require('../services/trackingService');

// POST: Add tracking update
router.post('/', async (req, res) => {
  try {
    const { awb_number, status, location, details } = req.body;

    if (!awb_number || !status) {
      return res.status(400).json({ error: 'Missing required fields: awb_number, status' });
    }

    const update = await trackingService.addTrackingUpdate(awb_number, status, location, details);
    res.status(201).json(update);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch tracking history for AWB
router.get('/:awbNumber', async (req, res) => {
  try {
    const history = await trackingService.getTrackingHistory(req.params.awbNumber);
    if (history.length === 0) {
      return res.status(404).json({ error: 'No tracking information found' });
    }
    res.status(200).json({ data: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch latest tracking status
router.get('/:awbNumber/latest', async (req, res) => {
  try {
    const latest = await trackingService.getLatestTrackingStatus(req.params.awbNumber);
    if (!latest) {
      return res.status(404).json({ error: 'No tracking information found' });
    }
    res.status(200).json(latest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Simulate tracking progression (mock)
router.post('/:awbNumber/simulate', async (req, res) => {
  try {
    const updates = await trackingService.simulateTracking(req.params.awbNumber);
    res.status(201).json({ message: 'Tracking simulation started', updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
