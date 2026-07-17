const { v4: uuidv4 } = require('uuid');

const generateUUID = () => uuidv4();

const generateAWB = () => {
  // Format: 1234567890 (10 digits)
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

const generateShipmentID = () => {
  return `SHP-${uuidv4().substring(0, 8).toUpperCase()}`;
};

const calculateConfidenceScore = (validationScores) => {
  if (!validationScores || validationScores.length === 0) return 0;
  const sum = validationScores.reduce((a, b) => a + b, 0);
  return Math.round((sum / validationScores.length) * 100) / 100;
};

const formatDate = (date) => {
  return new Date(date).toISOString();
};

const validatePostalCode = (postalCode, countryCode) => {
  // Simple postal code validation rules
  const rules = {
    'US': /^\d{5}(-\d{4})?$/,
    'DE': /^\d{5}$/,
    'GB': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    'FR': /^\d{5}$/,
    'IT': /^\d{5}$/,
    'ES': /^\d{5}$/,
    'NL': /^\d{4}\s?[A-Z]{2}$/i,
    'BE': /^\d{4}$/,
    'AT': /^\d{4}$/,
    'CH': /^\d{4}$/,
    'SE': /^\d{5}$/,
    'NO': /^\d{4}$/,
    'DK': /^\d{4}$/,
    'FI': /^\d{5}$/,
    'AU': /^\d{4}$/,
    'NZ': /^\d{4}$/,
    'SG': /^\d{6}$/,
    'JP': /^\d{3}-\d{4}$/,
    'CN': /^\d{6}$/,
    'IN': /^\d{6}$/,
    'BR': /^\d{5}-\d{3}$/,
    'MX': /^\d{5}$/
  };

  if (rules[countryCode]) {
    return rules[countryCode].test(postalCode);
  }
  
  // Default: at least 3 characters
  return postalCode && postalCode.length >= 3;
};

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePhone = (phone) => {
  const regex = /^[\d\s\-\+\(\)]{7,}$/;
  return regex.test(phone);
};

module.exports = {
  generateUUID,
  generateAWB,
  generateShipmentID,
  calculateConfidenceScore,
  formatDate,
  validatePostalCode,
  validateEmail,
  validatePhone
};
