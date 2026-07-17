const db = require('../utils/database');
const { generateUUID, formatDate } = require('../utils/helpers');

const getCustomerByDealId = async (dealId) => {
  try {
    const customer = await db.get(
      'SELECT * FROM customers WHERE deal_id = ?',
      [dealId]
    );
    return customer;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
};

const createCustomer = async (customerData) => {
  try {
    const id = generateUUID();
    const now = formatDate(new Date());

    await db.run(
      `INSERT INTO customers 
       (id, deal_id, contract_id, customer_name, address_line1, address_line2, 
        city, postal_code, country_code, contact_email, contact_phone, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        customerData.deal_id,
        customerData.contract_id,
        customerData.customer_name,
        customerData.address_line1,
        customerData.address_line2 || null,
        customerData.city,
        customerData.postal_code,
        customerData.country_code,
        customerData.contact_email || null,
        customerData.contact_phone || null,
        now,
        now
      ]
    );

    return { id, ...customerData, created_date: now };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

const getAllCustomers = async (limit = 50, offset = 0) => {
  try {
    const customers = await db.all(
      'SELECT * FROM customers ORDER BY created_date DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

const updateCustomer = async (customerId, updates) => {
  try {
    const now = formatDate(new Date());
    const fields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);
    
    await db.run(
      `UPDATE customers SET ${fields}, updated_date = ? WHERE id = ?`,
      [...values, now, customerId]
    );

    return { id: customerId, ...updates, updated_date: now };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

module.exports = {
  getCustomerByDealId,
  createCustomer,
  getAllCustomers,
  updateCustomer
};
