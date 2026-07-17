const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');

// GET: Fetch customer by Deal ID
router.get('/:dealId', async (req, res) => {
  try {
    const customer = await customerService.getCustomerByDealId(req.params.dealId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all customers
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const customers = await customerService.getAllCustomers(limit, offset);
    res.status(200).json({ data: customers, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create new customer
router.post('/', async (req, res) => {
  try {
    const customerData = req.body;
    
    // Validate required fields
    const required = ['deal_id', 'customer_name', 'address_line1', 'city', 'postal_code', 'country_code'];
    for (const field of required) {
      if (!customerData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const customer = await customerService.createCustomer(customerData);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update customer
router.put('/:customerId', async (req, res) => {
  try {
    const updates = req.body;
    const customer = await customerService.updateCustomer(req.params.customerId, updates);
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
