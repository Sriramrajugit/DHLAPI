import React, { useState } from 'react';
import { CustomerAPI, ValidationAPI, ShipmentAPI } from '../services/api';
import '../pages/CreateShipment.css';

const COMPANY_PICKUP_ADDRESS = {
  address_line1: 'Level 25 & 26, Equatorial Plaza, Jalan Sultan Ismail',
  city: 'Kuala Lumpur',
  postal_code: '50250',
  country_code: 'MY'
};

function CreateShipment() {
  const [formData, setFormData] = useState({
    deal_id: '',
    weight: '',
    dimensions: '',
    piece_count: 1,
    shipment_reference: '',
    product_code: 'P'
  });
  
  const [customer, setCustomer] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editableAddress, setEditableAddress] = useState({
    address_line1: '',
    city: '',
    postal_code: '',
    country_code: ''
  });
  const [pickupLocation, setPickupLocation] = useState(COMPANY_PICKUP_ADDRESS);
  const [editPickupMode, setEditPickupMode] = useState(false);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [addressValidationLoading, setAddressValidationLoading] = useState(false);
  const [showCreateNewDialog, setShowCreateNewDialog] = useState(false);

  const handleDealLookup = async () => {
    try {
      setCustomerLookupLoading(true);
      setError(null);

      const normalizedDealId = formData.deal_id
        .trim()
        .replace(/\s*-\s*/g, '-')
        .replace(/\s+/g, ' ')
        .toUpperCase();

      if (!normalizedDealId) {
        setError('Deal ID is required');
        return;
      }
      
      // Simulate 3-second fetch from IMEX System
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const res = await CustomerAPI.getByDealId(normalizedDealId);
      setFormData({ ...formData, deal_id: normalizedDealId });
      setCustomer(res.data);
      setEditableAddress({
        address_line1: res.data.address_line1,
        city: res.data.city,
        postal_code: res.data.postal_code,
        country_code: res.data.country_code
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Customer not found');
    } finally {
      setCustomerLookupLoading(false);
    }
  };

  const handleValidation = async () => {
    try {
      setAddressValidationLoading(true);
      setError(null);
      
      // Simulate 5-second fetch and validation from DHL
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const res = await ValidationAPI.validateAddress({
        postal_code: editableAddress.postal_code,
        country_code: editableAddress.country_code,
        city: editableAddress.city
      });
      setValidation(res.data);

      if (res.data.validation_result !== 'VALID') {
        // Address validation failed - show create new dialog
        setShowCreateNewDialog(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation error');
    } finally {
      setAddressValidationLoading(false);
    }
  };

  const handleCreateNewAddress = () => {
    // Copy IMEX address to edit form
    if (customer) {
      setEditableAddress({
        address_line1: customer.address_line1,
        city: customer.city,
        postal_code: customer.postal_code,
        country_code: customer.country_code
      });
      setEditMode(true);
      setShowCreateNewDialog(false);
      setError(null);
    }
  };

  const handleSkipValidation = () => {
    // Skip validation and proceed with editing
    setEditableAddress({
      address_line1: customer.address_line1,
      city: customer.city,
      postal_code: customer.postal_code,
      country_code: customer.country_code
    });
    setEditMode(true);
    setShowCreateNewDialog(false);
    setValidation({
      validation_result: 'MANUAL',
      validation_score: 100,
      details: { note: 'Manually created address' }
    });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditableAddress({
      address_line1: customer.address_line1,
      city: customer.city,
      postal_code: customer.postal_code,
      country_code: customer.country_code
    });
  };

  const handleUpdateAddress = (field, value) => {
    setEditableAddress({...editableAddress, [field]: value});
  };

  const handleSaveAddress = async () => {
    try {
      setAddressValidationLoading(true);
      setError(null);
      
      // Simulate 5-second fetch and validation from DHL
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const res = await ValidationAPI.validateAddress({
        postal_code: editableAddress.postal_code,
        country_code: editableAddress.country_code,
        city: editableAddress.city
      });
      setValidation(res.data);
      setEditMode(false);

      if (res.data.validation_result !== 'VALID') {
        setError('Address validation failed: ' + JSON.stringify(res.data.details.errors));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation error');
    } finally {
      setAddressValidationLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const shipmentData = {
        deal_id: formData.deal_id,
        customer_id: customer.id,
        shipment_reference: formData.shipment_reference || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions || null,
        piece_count: parseInt(formData.piece_count) || 1,
        product_code: formData.product_code,
        shipper: {
          name: customer.customer_name || 'Shipper',
          address: {
            address_line1: pickupLocation.address_line1,
            city: pickupLocation.city,
            postal_code: pickupLocation.postal_code,
            country_code: pickupLocation.country_code
          },
          email: customer.contact_email || null,
          phone: customer.contact_phone || null
        },
        receiver: {
          name: customer.customer_name || 'Receiver',
          address: {
            address_line1: editableAddress.address_line1,
            city: editableAddress.city,
            postal_code: editableAddress.postal_code,
            country_code: editableAddress.country_code
          },
          email: customer.contact_email || null,
          phone: customer.contact_phone || null
        },
        validation_scores: [validation?.validation_score || 100]
      };

      const res = await ShipmentAPI.create(shipmentData);
      setSuccess(`✓ Shipment created successfully! AWB: ${res.data.awb_number}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({ deal_id: '', weight: '', dimensions: '', piece_count: 1, shipment_reference: '', product_code: 'P' });
        setCustomer(null);
        setValidation(null);
        setEditableAddress({ address_line1: '', city: '', postal_code: '', country_code: '' });
        setPickupLocation(COMPANY_PICKUP_ADDRESS);
        setError(null);
      }, 2000);

      // Keep success message visible long enough for users to notice it
      setTimeout(() => {
        setSuccess(null);
      }, 8000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-shipment-page">
      <div className="create-shipment-header">
        <h1>Create Shipment</h1>
        <p className="subtitle">Two-step process: Lookup Customer → Validate Address → Enter Shipment Details</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create New Address Dialog */}
      {showCreateNewDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>⚠️ Address Not Found in DHL System</h2>
            </div>
            <div className="modal-body">
              <p>The address could not be validated against the DHL database.</p>
              <p><strong>Would you like to create a new address?</strong></p>
              <p className="modal-note">We'll pre-fill it with your IMEX data that you can edit.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-success" 
                onClick={handleCreateNewAddress}
              >
                ✓ Yes, Create New Address
              </button>
              <button 
                className="btn btn-warning" 
                onClick={handleSkipValidation}
              >
                ✎ Edit Manually
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateNewDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="create-shipment-container">
        {/* LEFT COLUMN: Customer Lookup & Address Validation */}
        <div className="shipment-left-column">
          {/* Step 1: Deal Lookup */}
          <div className="card customer-lookup-card">
            <div className="card-header">
              <span className="step-badge">1</span>
              <h2>Lookup Customer</h2>
            </div>
            
            <div className="card-body">
              <div className="form-group">
                <label>Deal ID *</label>
                <input
                  type="text"
                  placeholder="e.g., DEAL-001"
                  value={formData.deal_id}
                  onChange={(e) => setFormData({...formData, deal_id: e.target.value})}
                  disabled={customerLookupLoading}
                  className="form-control"
                />
              </div>
              
              {customerLookupLoading ? (
                <div className="loading-container">
                  <div className="loading-animation">
                    <div className="spinner"></div>
                    <div className="loading-text">
                      <p className="system-name">🔄 IMEX System</p>
                      <p className="loading-message">Fetching Customer Data...</p>
                      <p className="loading-timer"><span className="timer-dot"></span> Max 3 seconds</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn btn-primary btn-block" 
                  onClick={handleDealLookup}
                  disabled={!formData.deal_id}
                >
                  Lookup Customer
                </button>
              )}
            </div>

            {customer && (
              <div className="card-section customer-details">
                <h4>✓ Customer Found</h4>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{customer.customer_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">
                    {customer.address_line1}, {customer.city}, {customer.postal_code}, {customer.country_code}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{customer.contact_email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{customer.contact_phone || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Address Validation */}
          {customer && (
            <div className="card address-validation-card">
              <div className="card-header">
                <span className="step-badge">2</span>
                <h2>Validate Address</h2>
              </div>

              <div className="card-body">
                {!editMode && (
                  <>
                    <div className="address-preview-box">
                      <p><strong>📍 Current Address</strong></p>
                      <div className="address-text">
                        <p>{editableAddress.address_line1}</p>
                        <p>{editableAddress.city}, {editableAddress.postal_code}</p>
                        <p>{editableAddress.country_code}</p>
                      </div>
                    </div>

                    {!validation && (
                      <div className="button-group">
                        <button 
                          className="btn btn-primary btn-block" 
                          onClick={handleValidation}
                          disabled={addressValidationLoading}
                        >
                          {addressValidationLoading ? 'Validating...' : 'Validate Address'}
                        </button>
                        <button 
                          className="btn btn-secondary btn-block" 
                          onClick={() => setEditMode(true)}
                          disabled={addressValidationLoading}
                        >
                          ✎ Edit Address
                        </button>
                      </div>
                    )}

                    {addressValidationLoading && (
                      <div className="loading-container">
                        <div className="loading-animation">
                          <div className="spinner"></div>
                          <div className="loading-text">
                            <p className="system-name">📦 DHL System</p>
                            <p className="loading-message">Validating Address...</p>
                            <p className="loading-timer"><span className="timer-dot"></span> Max 5 seconds</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {editMode && (
                  <div className="edit-address-form">
                    <h4>Edit Address</h4>
                    <div className="form-group">
                      <label>Address Line 1 *</label>
                      <input
                        type="text"
                        value={editableAddress.address_line1}
                        onChange={(e) => handleUpdateAddress('address_line1', e.target.value)}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        value={editableAddress.city}
                        onChange={(e) => handleUpdateAddress('city', e.target.value)}
                        className="form-control"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Postal Code *</label>
                        <input
                          type="text"
                          value={editableAddress.postal_code}
                          onChange={(e) => handleUpdateAddress('postal_code', e.target.value)}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Country Code *</label>
                        <input
                          type="text"
                          maxLength="2"
                          placeholder="e.g., DE"
                          value={editableAddress.country_code}
                          onChange={(e) => handleUpdateAddress('country_code', e.target.value.toUpperCase())}
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="button-group">
                      <button 
                        className="btn btn-success btn-block" 
                        onClick={handleSaveAddress}
                        disabled={addressValidationLoading}
                      >
                        {addressValidationLoading ? 'Validating...' : 'Save & Validate'}
                      </button>
                      <button 
                        className="btn btn-secondary btn-block" 
                        onClick={handleCancelEdit}
                        disabled={addressValidationLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {validation && !editMode && (
                  <div className="validation-result-box">
                    <div className={`validation-badge ${validation.validation_result.toLowerCase()}`}>
                      {validation.validation_result === 'VALID' ? '✓ VALID' : '✗ INVALID'}
                    </div>
                    <p className="validation-score">Confidence: {validation.validation_score}%</p>
                    <div className="button-group">
                      <button 
                        className="btn btn-secondary btn-block" 
                        onClick={() => setEditMode(true)}
                      >
                        ✎ Edit Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Shipment Details & Pickup Location (appears after validation) */}
        {validation && (
          <div className="shipment-right-column">
            {/* Shipment Details Card */}
            <div className="card shipment-details-card">
              <div className="card-header">
                <span className="step-badge">3</span>
                <h2>Shipment Details</h2>
              </div>

              <div className="card-body">
                <div className="form-group">
                  <label>Shipment Reference</label>
                  <input
                    type="text"
                    placeholder="Optional reference"
                    value={formData.shipment_reference || ''}
                    onChange={(e) => setFormData({...formData, shipment_reference: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Product Code *</label>
                  <select
                    value={formData.product_code}
                    onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                    className="form-control"
                  >
                    <option value="P">P - DHL Express Worldwide</option>
                    <option value="E">E - DHL Express 9:00</option>
                    <option value="N">N - DHL Express 10:30</option>
                    <option value="X">X - DHL Express 10:30 Saturday</option>
                    <option value="Y">Y - DHL Express 12:00</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.5"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Piece Count</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.piece_count}
                      onChange={(e) => setFormData({...formData, piece_count: e.target.value})}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g., 30x20x15 cm"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* Pickup Location Card */}
            <div className="card pickup-location-card">
              <div className="card-header">
                <h2>📍 Pickup Location</h2>
                <p className="card-subtitle">Default: Company pickup address</p>
              </div>

              <div className="card-body">
                {!editPickupMode && (
                  <>
                    <div className="pickup-preview-box">
                      <div className="detail-row">
                        <span className="detail-label">Address:</span>
                        <span className="detail-value">{pickupLocation.address_line1}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">City:</span>
                        <span className="detail-value">{pickupLocation.city}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Postal Code:</span>
                        <span className="detail-value">{pickupLocation.postal_code}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Country:</span>
                        <span className="detail-value">{pickupLocation.country_code}</span>
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary btn-block" 
                      onClick={() => setEditPickupMode(true)}
                    >
                      ✎ Edit Pickup Location
                    </button>
                  </>
                )}

                {editPickupMode && (
                  <>
                    <div className="form-group">
                      <label>Address Line 1 *</label>
                      <input
                        type="text"
                        value={pickupLocation.address_line1}
                        onChange={(e) => setPickupLocation({...pickupLocation, address_line1: e.target.value})}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        value={pickupLocation.city}
                        onChange={(e) => setPickupLocation({...pickupLocation, city: e.target.value})}
                        className="form-control"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Postal Code *</label>
                        <input
                          type="text"
                          value={pickupLocation.postal_code}
                          onChange={(e) => setPickupLocation({...pickupLocation, postal_code: e.target.value})}
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Country Code *</label>
                        <input
                          type="text"
                          maxLength="2"
                          placeholder="e.g., DE"
                          value={pickupLocation.country_code}
                          onChange={(e) => setPickupLocation({...pickupLocation, country_code: e.target.value.toUpperCase()})}
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="button-group">
                      <button 
                        className="btn btn-success btn-block" 
                        onClick={() => setEditPickupMode(false)}
                      >
                        ✓ Save
                      </button>
                      <button 
                        className="btn btn-secondary btn-block" 
                        onClick={() => {
                          setPickupLocation(COMPANY_PICKUP_ADDRESS);
                          setEditPickupMode(false);
                        }}
                      >
                        Reset to Company Address
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Create Shipment Button */}
            <button 
              className="btn btn-success btn-lg btn-block" 
              onClick={handleCreateShipment}
              disabled={loading}
            >
              {loading ? '⏳ Creating Shipment...' : '✓ Create Shipment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateShipment;
