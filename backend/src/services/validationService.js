const db = require('../utils/database');
const { generateUUID, validatePostalCode, formatDate } = require('../utils/helpers');

const validateAddress = async (addressData) => {
  try {
    const validationId = generateUUID();
    const results = {
      postal_code_valid: false,
      country_code_valid: false,
      city_valid: false,
      overall_valid: false,
      score: 0,
      errors: [],
      details: {}
    };

    // Validate postal code
    if (validatePostalCode(addressData.postal_code, addressData.country_code)) {
      results.postal_code_valid = true;
      results.score += 33;
      results.details.postal_code = 'Valid postal code format';
    } else {
      results.errors.push('Invalid postal code format for ' + addressData.country_code);
      results.details.postal_code = 'Invalid postal code format';
    }

    // Validate country code
    const validCountries = await getValidCountries();
    if (validCountries.includes(addressData.country_code)) {
      results.country_code_valid = true;
      results.score += 33;
      results.details.country = 'Valid country code';
    } else {
      results.errors.push('Invalid country code: ' + addressData.country_code);
      results.details.country = 'Invalid country code';
    }

    // Validate city
    if (addressData.city && addressData.city.length > 0) {
      results.city_valid = true;
      results.score += 34;
      results.details.city = 'Valid city name';
    } else {
      results.errors.push('City is required');
      results.details.city = 'Missing city';
    }

    results.overall_valid = results.errors.length === 0;
    results.score = Math.min(100, results.score);

    return {
      validation_id: validationId,
      validation_result: results.overall_valid ? 'VALID' : 'INVALID',
      validation_score: results.score,
      details: results
    };
  } catch (error) {
    console.error('Error validating address:', error);
    throw error;
  }
};

const getValidCountries = async () => {
  // Return list of supported countries
  return [
    'US', 'DE', 'GB', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH',
    'SE', 'NO', 'DK', 'FI', 'AU', 'NZ', 'SG', 'JP', 'CN', 'IN',
    'BR', 'MX', 'CA', 'IE', 'ZA','MY','SG'
  ];
};

const validateDuplicateConsignee = async (customerName, city, postalCode) => {
  try {
    const existing = await db.get(
      `SELECT id FROM customers 
       WHERE customer_name = ? AND city = ? AND postal_code = ?`,
      [customerName, city, postalCode]
    );

    return {
      is_duplicate: !!existing,
      duplicate_id: existing?.id || null,
      similarity_score: existing ? 100 : 0
    };
  } catch (error) {
    console.error('Error checking duplicates:', error);
    throw error;
  }
};

const validateRestrictedCountry = async (countryCode) => {
  try {
    // Define restricted countries (can be expanded)
    const restrictedCountries = [];

    return {
      is_restricted: restrictedCountries.includes(countryCode),
      country_code: countryCode
    };
  } catch (error) {
    console.error('Error validating restricted country:', error);
    throw error;
  }
};

const saveValidationResult = async (shipmentId, validationType, score, result, details) => {
  try {
    const id = generateUUID();
    const now = formatDate(new Date());

    await db.run(
      `INSERT INTO validation_results 
       (id, shipment_id, validation_type, validation_score, validation_result, details, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, shipmentId, validationType, score, result, JSON.stringify(details), now]
    );

    return { id, shipment_id: shipmentId, validation_type: validationType, validation_score: score };
  } catch (error) {
    console.error('Error saving validation result:', error);
    throw error;
  }
};

module.exports = {
  validateAddress,
  getValidCountries,
  validateDuplicateConsignee,
  validateRestrictedCountry,
  saveValidationResult
};
