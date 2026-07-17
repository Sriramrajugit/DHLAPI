const express = require('express');
const router = express.Router();
const validationService = require('../services/validationService');

// POST: Validate address
router.post('/address', async (req, res) => {
  try {
    const addressData = req.body;

    // Validate required fields
    const required = ['postal_code', 'country_code', 'city'];
    for (const field of required) {
      if (!addressData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const validation = await validationService.validateAddress(addressData);
    res.status(200).json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Check duplicate consignee
router.post('/duplicate', async (req, res) => {
  try {
    const { customer_name, city, postal_code } = req.body;

    if (!customer_name || !city || !postal_code) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await validationService.validateDuplicateConsignee(customer_name, city, postal_code);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Check restricted country
router.post('/restricted-country', async (req, res) => {
  try {
    const { country_code } = req.body;

    if (!country_code) {
      return res.status(400).json({ error: 'Missing country_code' });
    }

    const result = await validationService.validateRestrictedCountry(country_code);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
