import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT
});

export const CustomerAPI = {
  getByDealId: (dealId) => apiClient.get(`/customers/${dealId}`),
  getAll: (limit = 50, offset = 0) => apiClient.get('/customers', { params: { limit, offset } }),
  create: (data) => apiClient.post('/customers', data),
  update: (customerId, data) => apiClient.put(`/customers/${customerId}`, data)
};

export const ValidationAPI = {
  validateAddress: (data) => apiClient.post('/validation/address', data),
  checkDuplicate: (data) => apiClient.post('/validation/duplicate', data),
  checkRestrictedCountry: (data) => apiClient.post('/validation/restricted-country', data)
};

export const ShipmentAPI = {
  create: (data) => apiClient.post('/shipments', data),
  getById: (shipmentId) => apiClient.get(`/shipments/${shipmentId}`),
  getByAWB: (awbNumber) => apiClient.get(`/shipments/awb/${awbNumber}`),
  getAll: (limit = 50, offset = 0) => apiClient.get('/shipments', { params: { limit, offset } }),
  updateStatus: (shipmentId, status) => apiClient.put(`/shipments/${shipmentId}/status`, { status }),
  getByDealId: (dealId) => apiClient.get(`/shipments/deal/${dealId}`)
};

export const TrackingAPI = {
  addUpdate: (data) => apiClient.post('/tracking', data),
  getHistory: (awbNumber) => apiClient.get(`/tracking/${awbNumber}`),
  getLatest: (awbNumber) => apiClient.get(`/tracking/${awbNumber}/latest`),
  simulate: (awbNumber) => apiClient.post(`/tracking/${awbNumber}/simulate`)
};

export const AuditAPI = {
  getLogs: (limit = 50, offset = 0, shipmentId = null) => {
    const params = { limit, offset };
    if (shipmentId) params.shipment_id = shipmentId;
    return apiClient.get('/audit', { params });
  },
  getShipmentLogs: (shipmentId, limit = 50, offset = 0) => 
    apiClient.get(`/audit/shipment/${shipmentId}`, { params: { limit, offset } })
};

export default apiClient;
