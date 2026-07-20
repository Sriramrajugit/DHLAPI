const db = require('../utils/database');
const { generateUUID, formatDate } = require('../utils/helpers');

const parseTrackingDetails = (details) => {
  if (!details) {
    return null;
  }

  if (typeof details !== 'string') {
    return details;
  }

  try {
    return JSON.parse(details);
  } catch (error) {
    return details;
  }
};

// Mock tracking statuses progression
const TRACKING_STATUSES = [
  'SHIPMENT_CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

const addTrackingUpdate = async (awbNumber, status, location = '', details = '') => {
  try {
    const id = generateUUID();
    const now = formatDate(new Date());

    await db.run(
      `INSERT INTO tracking (id, awb_number, status, location, timestamp, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, awbNumber, status, location, now, JSON.stringify(details)]
    );

    return { id, awb_number: awbNumber, status, location, timestamp: now };
  } catch (error) {
    console.error('Error adding tracking update:', error);
    throw error;
  }
};

const getTrackingHistory = async (awbNumber) => {
  try {
    const history = await db.all(
      `SELECT * FROM tracking WHERE awb_number = ? ORDER BY timestamp ASC`,
      [awbNumber]
    );

    return history.map(h => ({
      ...h,
      details: parseTrackingDetails(h.details)
    }));
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    throw error;
  }
};

const getLatestTrackingStatus = async (awbNumber) => {
  try {
    const latest = await db.get(
      `SELECT * FROM tracking WHERE awb_number = ? ORDER BY timestamp DESC LIMIT 1`,
      [awbNumber]
    );

    if (latest) {
      latest.details = parseTrackingDetails(latest.details);
    }

    return latest;
  } catch (error) {
    console.error('Error fetching latest tracking status:', error);
    throw error;
  }
};

// Simulate tracking progression (mock)
const simulateTracking = async (awbNumber) => {
  try {
    const updates = [
      { status: 'SHIPMENT_CREATED', location: 'Origin Facility', details: 'Shipment created and ready for pickup' },
      { status: 'PICKED_UP', location: 'Origin Facility', details: 'Package picked up' },
      { status: 'IN_TRANSIT', location: 'Distribution Hub', details: 'In transit to destination' },
      { status: 'OUT_FOR_DELIVERY', location: 'Delivery Station', details: 'Out for delivery today' },
      { status: 'DELIVERED', location: 'Destination', details: 'Delivered to recipient' }
    ];

    const results = [];
    for (let i = 0; i < updates.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between updates
      const update = updates[i];
      const result = await addTrackingUpdate(
        awbNumber,
        update.status,
        update.location,
        update.details
      );
      results.push(result);
    }

    return results;
  } catch (error) {
    console.error('Error simulating tracking:', error);
    throw error;
  }
};

module.exports = {
  addTrackingUpdate,
  getTrackingHistory,
  getLatestTrackingStatus,
  simulateTracking,
  TRACKING_STATUSES
};
