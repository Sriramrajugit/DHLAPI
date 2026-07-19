const db = require('../utils/database');
const { generateUUID, generateAWB, generateShipmentID, calculateConfidenceScore, formatDate } = require('../utils/helpers');
const auditService = require('./auditService');

// DHL Express API Parameters Reference
const DHL_API_PARAMS = {
  products: ['P', 'E', 'N', 'X', 'Y'],
  shipmentContent: ['NON_DOC', 'DOC'],
  weightUom: ['KG', 'LB'],
  dimensionUom: ['CM', 'IN']
};

const createShipment = async (shipmentData) => {
  try {
    // Validate required DHL parameters
    const validation = validateShipmentData(shipmentData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const shipmentId = generateShipmentID();
    const awbNumber = generateAWB();
    const now = formatDate(new Date());

    const validationScores = shipmentData.validation_scores || [];
    const confidenceScore = calculateConfidenceScore(validationScores);

    // DHL API Parameters
    const shipper = shipmentData.shipper || {};
    const receiver = shipmentData.receiver || {};
    const pieces = shipmentData.pieces || [];
    const invoiceData = shipmentData.invoice || {};
    const specialServices = shipmentData.special_services || [];

    // Calculate total weight and dimensions
    let totalWeight = shipmentData.weight || 0;
    let dimensionDetails = shipmentData.dimensions || {};
    
    if (pieces.length > 0) {
      totalWeight = pieces.reduce((sum, piece) => sum + (piece.weight || 0), 0);
      dimensionDetails = {
        length: Math.max(...pieces.map(p => p.length || 0)),
        width: Math.max(...pieces.map(p => p.width || 0)),
        height: Math.max(...pieces.map(p => p.height || 0)),
        unitOfMeasure: pieces[0]?.unitOfMeasure || 'CM'
      };
    }

    await db.run(
      `INSERT INTO shipments 
       (id, awb_number, deal_id, customer_id, shipment_reference, weight, 
        dimensions, piece_count, status, confidence_score, created_date,
        shipper_name, shipper_address, receiver_name, receiver_address,
        product_code, content_type, special_services, invoice_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        shipmentId,
        awbNumber,
        shipmentData.deal_id,
        shipmentData.customer_id,
        shipmentData.shipment_reference || null,
        totalWeight,
        JSON.stringify(dimensionDetails),
        pieces.length || shipmentData.piece_count || 1,
        'CREATED',
        confidenceScore,
        now,
        shipper.name || null,
        JSON.stringify(shipper.address || {}),
        receiver.name || null,
        JSON.stringify(receiver.address || {}),
        shipmentData.product_code || 'P',
        shipmentData.content_type || 'NON_DOC',
        JSON.stringify(specialServices),
        JSON.stringify(invoiceData)
      ]
    );

    // Log action with DHL parameters
    await auditService.logAction(shipmentId, 'SHIPMENT_CREATED', 'SYSTEM', {
      confidence_score: confidenceScore,
      deal_id: shipmentData.deal_id,
      product_code: shipmentData.product_code,
      total_pieces: pieces.length || shipmentData.piece_count,
      total_weight: totalWeight
    });

    // Mock DHL Label Generation (base64 encoded)
    const mockLabel = Buffer.from(`DHL LABEL - AWB: ${awbNumber}\nShipment ID: ${shipmentId}`).toString('base64');

    return {
      shipment_id: shipmentId,
      awb_number: awbNumber,
      status: 'CREATED',
      confidence_score: confidenceScore,
      created_date: now,
      label: {
        type: 'application/pdf',
        data: mockLabel,
        format: 'base64'
      },
      details: {
        piece_count: pieces.length || shipmentData.piece_count || 1,
        total_weight: totalWeight,
        weight_uom: pieces[0]?.weightUom || 'KG',
        shipper: shipper.name || 'N/A',
        receiver: receiver.name || 'N/A',
        product: shipmentData.product_code || 'P'
      }
    };
  } catch (error) {
    console.error('Error creating shipment:', error);
    throw error;
  }
};

const validateShipmentData = (data) => {
  const errors = [];

  // Validate required fields
  if (!data.deal_id) errors.push('deal_id is required');
  if (!data.customer_id) errors.push('customer_id is required');
  if (!data.receiver || !data.receiver.address) errors.push('receiver address is required');
  if (!data.shipper || !data.shipper.address) errors.push('shipper address is required');

  // Validate DHL product code
  if (data.product_code && !DHL_API_PARAMS.products.includes(data.product_code)) {
    errors.push(`Invalid product_code. Must be one of: ${DHL_API_PARAMS.products.join(', ')}`);
  }

  // Validate content type
  if (data.content_type && !DHL_API_PARAMS.shipmentContent.includes(data.content_type)) {
    errors.push(`Invalid content_type. Must be one of: ${DHL_API_PARAMS.shipmentContent.join(', ')}`);
  }

  // Validate pieces if provided
  if (data.pieces && Array.isArray(data.pieces)) {
    data.pieces.forEach((piece, index) => {
      if (!piece.weight) errors.push(`Piece ${index + 1}: weight is required`);
      if (!piece.length || !piece.width || !piece.height) {
        errors.push(`Piece ${index + 1}: dimensions (length, width, height) are required`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const getShipment = async (shipmentId) => {
  try {
    const shipment = await db.get(
      'SELECT * FROM shipments WHERE id = ?',
      [shipmentId]
    );
    
    if (!shipment) return null;

    // Parse JSON fields
    return {
      ...shipment,
      dimensions: shipment.dimensions ? JSON.parse(shipment.dimensions) : null,
      shipper_address: shipment.shipper_address ? JSON.parse(shipment.shipper_address) : null,
      receiver_address: shipment.receiver_address ? JSON.parse(shipment.receiver_address) : null,
      special_services: shipment.special_services ? JSON.parse(shipment.special_services) : [],
      invoice_data: shipment.invoice_data ? JSON.parse(shipment.invoice_data) : null
    };
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
    
    if (!shipment) return null;

    return {
      ...shipment,
      dimensions: shipment.dimensions ? JSON.parse(shipment.dimensions) : null,
      shipper_address: shipment.shipper_address ? JSON.parse(shipment.shipper_address) : null,
      receiver_address: shipment.receiver_address ? JSON.parse(shipment.receiver_address) : null,
      special_services: shipment.special_services ? JSON.parse(shipment.special_services) : [],
      invoice_data: shipment.invoice_data ? JSON.parse(shipment.invoice_data) : null
    };
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

    return shipments.map(shipment => ({
      ...shipment,
      dimensions: shipment.dimensions ? JSON.parse(shipment.dimensions) : null,
      shipper_address: shipment.shipper_address ? JSON.parse(shipment.shipper_address) : null,
      receiver_address: shipment.receiver_address ? JSON.parse(shipment.receiver_address) : null,
      special_services: shipment.special_services ? JSON.parse(shipment.special_services) : [],
      invoice_data: shipment.invoice_data ? JSON.parse(shipment.invoice_data) : null
    }));
  } catch (error) {
    console.error('Error fetching all shipments:', error);
    throw error;
  }
};

const updateShipmentStatus = async (shipmentId, newStatus) => {
  try {
    const validStatuses = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    await db.run(
      'UPDATE shipments SET status = ?, updated_date = ? WHERE id = ?',
      [newStatus, formatDate(new Date()), shipmentId]
    );

    await auditService.logAction(shipmentId, 'STATUS_UPDATED', 'SYSTEM', {
      new_status: newStatus
    });

    return getShipment(shipmentId);
  } catch (error) {
    console.error('Error updating shipment status:', error);
    throw error;
  }
};

const getShipmentsByDealId = async (dealId, limit = 50, offset = 0) => {
  try {
    const shipments = await db.all(
      'SELECT * FROM shipments WHERE deal_id = ? ORDER BY created_date DESC LIMIT ? OFFSET ?',
      [dealId, limit, offset]
    );

    return shipments.map(shipment => ({
      ...shipment,
      dimensions: shipment.dimensions ? JSON.parse(shipment.dimensions) : null,
      shipper_address: shipment.shipper_address ? JSON.parse(shipment.shipper_address) : null,
      receiver_address: shipment.receiver_address ? JSON.parse(shipment.receiver_address) : null,
      special_services: shipment.special_services ? JSON.parse(shipment.special_services) : [],
      invoice_data: shipment.invoice_data ? JSON.parse(shipment.invoice_data) : null
    }));
  } catch (error) {
    console.error('Error fetching shipments by deal ID:', error);
    throw error;
  }
};

const getShipmentsByCustomerId = async (customerId, limit = 50, offset = 0) => {
  try {
    const shipments = await db.all(
      'SELECT * FROM shipments WHERE customer_id = ? ORDER BY created_date DESC LIMIT ? OFFSET ?',
      [customerId, limit, offset]
    );

    return shipments.map(shipment => ({
      ...shipment,
      dimensions: shipment.dimensions ? JSON.parse(shipment.dimensions) : null,
      shipper_address: shipment.shipper_address ? JSON.parse(shipment.shipper_address) : null,
      receiver_address: shipment.receiver_address ? JSON.parse(shipment.receiver_address) : null,
      special_services: shipment.special_services ? JSON.parse(shipment.special_services) : [],
      invoice_data: shipment.invoice_data ? JSON.parse(shipment.invoice_data) : null
    }));
  } catch (error) {
    console.error('Error fetching shipments by customer ID:', error);
    throw error;
  }
};

module.exports = {
  createShipment,
  getShipment,
  getShipmentByAWB,
  getAllShipments,
  updateShipmentStatus,
  getShipmentsByDealId,
  getShipmentsByCustomerId,
  validateShipmentData
};
