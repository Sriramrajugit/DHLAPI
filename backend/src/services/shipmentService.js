const db = require('../utils/database');
const { generateUUID, generateAWB, generateShipmentID, calculateConfidenceScore, formatDate } = require('../utils/helpers');
const auditService = require('./auditService');

const createShipment = async (shipmentData) => {
  try {
    const shipmentId = generateShipmentID();
    const awbNumber = generateAWB();
    const now = formatDate(new Date());

    const validationScores = shipmentData.validation_scores || [];
    const confidenceScore = calculateConfidenceScore(validationScores);

    await db.run(
      `INSERT INTO shipments 
       (id, awb_number, deal_id, customer_id, shipment_reference, weight, 
        dimensions, piece_count, status, confidence_score, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shipmentId,
        awbNumber,
        shipmentData.deal_id,
        shipmentData.customer_id,
        shipmentData.shipment_reference || null,
        shipmentData.weight || null,
        shipmentData.dimensions ? JSON.stringify(shipmentData.dimensions) : null,
        shipmentData.piece_count || 1,
        'CREATED',
        confidenceScore,
        now
      ]
    );

    // Log action
    await auditService.logAction(shipmentId, 'SHIPMENT_CREATED', 'SYSTEM', {
      confidence_score: confidenceScore,
      deal_id: shipmentData.deal_id
    });

    return {
      shipment_id: shipmentId,
      awb_number: awbNumber,
      status: 'CREATED',
      confidence_score: confidenceScore,
      created_date: now
    };
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
};

const getShipment = async (shipmentId) => {
  try {
    const shipment = await db.get(
      'SELECT * FROM shipments WHERE id = ?',
      [shipmentId]
    );

    if (shipment && shipment.dimensions) {
      shipment.dimensions = JSON.parse(shipment.dimensions);
    }

    return shipment;
  } catch (error) {
    console.error('Error fetching shipment:', error);
    throw error;
  }
};

const getShipmentByAWB = async (awbNumber) => {
  try {
    const shipment = await db.get(
      'SELECT * FROM shipments WHERE awb_number = ?',
      [awbNumber]
    );

    if (shipment && shipment.dimensions) {
      shipment.dimensions = JSON.parse(shipment.dimensions);
    }

    return shipment;
  } catch (error) {
    console.error('Error fetching shipment by AWB:', error);
    throw error;
  }
};

const getAllShipments = async (limit = 50, offset = 0) => {
  try {
    const shipments = await db.all(
      'SELECT * FROM shipments ORDER BY created_date DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return shipments.map(s => {
      if (s.dimensions) {
        s.dimensions = JSON.parse(s.dimensions);
      }
      return s;
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    throw error;
  }
};

const updateShipmentStatus = async (shipmentId, status) => {
  try {
    const now = formatDate(new Date());

    await db.run(
      'UPDATE shipments SET status = ?, shipped_date = ? WHERE id = ?',
      [status, status === 'SHIPPED' ? now : null, shipmentId]
    );

    // Log action
    await auditService.logAction(shipmentId, `STATUS_CHANGED_TO_${status}`, 'SYSTEM');

    return { shipment_id: shipmentId, status, updated_date: now };
  } catch (error) {
    console.error('Error updating shipment status:', error);
    throw error;
  }
};

const getShipmentsByDealId = async (dealId) => {
  try {
    const shipments = await db.all(
      'SELECT * FROM shipments WHERE deal_id = ? ORDER BY created_date DESC',
      [dealId]
    );

    return shipments.map(s => {
      if (s.dimensions) {
        s.dimensions = JSON.parse(s.dimensions);
      }
      return s;
    });
  } catch (error) {
    console.error('Error fetching shipments by deal ID:', error);
    throw error;
  }
};

module.exports = {
  createShipment,
  getShipment,
  getShipmentByAWB,
  getAllShipments,
  updateShipmentStatus,
  getShipmentsByDealId
};
