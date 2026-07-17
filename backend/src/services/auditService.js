const db = require('../utils/database');
const { generateUUID, formatDate } = require('../utils/helpers');

const logAction = async (shipmentId, action, userId = 'SYSTEM', details = null) => {
  try {
    const id = generateUUID();
    const timestamp = formatDate(new Date());
    
    await db.run(
      `INSERT INTO audit_logs (id, shipment_id, action, user_id, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, shipmentId, action, userId, details ? JSON.stringify(details) : null, timestamp]
    );

    return { id, timestamp };
  } catch (error) {
    console.error('Error logging action:', error);
    throw error;
  }
};

const getAuditLogs = async (shipmentId = null, limit = 50, offset = 0) => {
  try {
    let sql = 'SELECT * FROM audit_logs';
    const params = [];

    if (shipmentId) {
      sql += ' WHERE shipment_id = ?';
      params.push(shipmentId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await db.all(sql, params);
    return logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

module.exports = {
  logAction,
  getAuditLogs
};
