import React, { useState } from 'react';
import { CustomerAPI, ValidationAPI, ShipmentAPI } from '../services/api';
import '../pages/CreateShipment.css';

function CreateShipment() {
  const [formData, setFormData] = useState({
    deal_id: '',
    weight: '',
    dimensions: '',
    piece_count: 1
  });
  
  const [customer, setCustomer] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [step, setStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editableAddress, setEditableAddress] = useState({
    address_line1: '',
    city: '',
    postal_code: '',
    country_code: ''
  });

  const handleDealLookup = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await CustomerAPI.getByDealId(formData.deal_id);
      setCustomer(res.data);
      setEditableAddress({
        address_line1: res.data.address_line1,
        city: res.data.city,
        postal_code: res.data.postal_code,
        country_code: res.data.country_code
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Customer not found');
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ValidationAPI.validateAddress({
        postal_code: editableAddress.postal_code,
        country_code: editableAddress.country_code,
        city: editableAddress.city
      });
      setValidation(res.data);
      
      if (res.data.validation_result === 'VALID') {
        setStep(3);
      } else {
        setError('Address validation failed: ' + JSON.stringify(res.data.details.errors));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = () => {
    setEditMode(true);
    setValidation(null);
    setError(null);
    setStep(2);
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
      setLoading(true);
      setError(null);
      const res = await ValidationAPI.validateAddress({
        postal_code: editableAddress.postal_code,
        country_code: editableAddress.country_code,
        city: editableAddress.city
      });
      setValidation(res.data);
      setEditMode(false);
      
      if (res.data.validation_result === 'VALID') {
        setStep(3);
      } else {
        setError('Address validation failed: ' + JSON.stringify(res.data.details.errors));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation error');
    } finally {
      setLoading(false);
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
        validation_scores: [validation?.validation_score || 100]
      };

      const res = await ShipmentAPI.create(shipmentData);
      setSuccess(`Shipment created successfully! AWB: ${res.data.awb_number}`);
      
      // Reset form
      setTimeout(() => {
        setFormData({ deal_id: '', weight: '', dimensions: '', piece_count: 1 });
        setCustomer(null);
        setValidation(null);
        setStep(1);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Create Shipment</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="create-shipment-container">
        {/* Step 1: Deal Lookup */}
        <div className={`form-card ${step >= 1 ? 'active' : 'inactive'}`}>
          <div className="step-header">
            <span className="step-number">1</span>
            <h2>Customer Lookup</h2>
          </div>
          
          {step === 1 && (
            <div>
              <div className="form-group">
                <label>Deal ID *</label>
                <input
                  type="text"
                  placeholder="e.g., DEAL-001"
                  value={formData.deal_id}
                  onChange={(e) => setFormData({...formData, deal_id: e.target.value})}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleDealLookup}
                disabled={loading || !formData.deal_id}
              >
                {loading ? 'Loading...' : 'Lookup Customer'}
              </button>
            </div>
          )}
          
          {customer && step > 1 && (
            <div className="customer-info">
              <p><strong>Customer:</strong> {customer.customer_name}</p>
              <p><strong>Address:</strong> {customer.address_line1}, {customer.city}, {customer.postal_code}</p>
              <p><strong>Country:</strong> {customer.country_code}</p>
            </div>
          )}
        </div>

        {/* Step 2: Address Validation */}
        {customer && (
          <div className={`form-card ${step >= 2 ? 'active' : 'inactive'}`}>
            <div className="step-header">
              <span className="step-number">2</span>
              <h2>Address Validation</h2>
            </div>
            
            {step === 2 && !editMode && (
              <div>
                <div className="address-preview">
                  <p><strong>Address:</strong> {editableAddress.address_line1}</p>
                  <p><strong>City:</strong> {editableAddress.city}</p>
                  <p><strong>Postal Code:</strong> {editableAddress.postal_code}</p>
                  <p><strong>Country:</strong> {editableAddress.country_code}</p>
                </div>

                {validation ? (
                  <div>
                    <div className={`validation-result ${validation.validation_result.toLowerCase()}`}>
                      <p><strong>Validation Result:</strong> {validation.validation_result}</p>
                      <p><strong>Confidence Score:</strong> {validation.validation_score}%</p>
                    </div>
                    <div className="button-group">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => setStep(3)}
                        disabled={loading}
                      >
                        Proceed to Shipment
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={handleEditAddress}
                        disabled={loading}
                      >
                        ✎ Edit Address
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="button-group">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleValidation}
                      disabled={loading}
                    >
                      {loading ? 'Validating...' : 'Validate Address'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleEditAddress}
                      disabled={loading}
                    >
                      ✎ Edit Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && editMode && (
              <div className="edit-address-form">
                <h3>Edit Address</h3>
                <div className="form-group">
                  <label>Address Line 1 *</label>
                  <input
                    type="text"
                    value={editableAddress.address_line1}
                    onChange={(e) => handleUpdateAddress('address_line1', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={editableAddress.city}
                    onChange={(e) => handleUpdateAddress('city', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Postal Code *</label>
                    <input
                      type="text"
                      value={editableAddress.postal_code}
                      onChange={(e) => handleUpdateAddress('postal_code', e.target.value)}
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
                    />
                  </div>
                </div>
                <div className="button-group">
                  <button 
                    className="btn btn-success" 
                    onClick={handleSaveAddress}
                    disabled={loading || !editableAddress.city || !editableAddress.postal_code || !editableAddress.country_code}
                  >
                    {loading ? 'Validating...' : 'Save & Validate'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {validation && step > 2 && (
              <div className="validation-info">
                <div className="address-display">
                  <p><strong>✓ Validated Address</strong></p>
                  <p className="detail"><strong>Address:</strong> {editableAddress.address_line1}</p>
                  <p className="detail"><strong>City:</strong> {editableAddress.city}</p>
                  <p className="detail"><strong>Postal Code:</strong> {editableAddress.postal_code}</p>
                  <p className="detail"><strong>Country:</strong> {editableAddress.country_code}</p>
                </div>
                <p><strong>Confidence Score:</strong> {validation.validation_score}%</p>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleEditAddress}
                  disabled={loading}
                >
                  ✎ Edit Address
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Shipment Details */}
        {customer && validation && (
          <div className={`form-card ${step >= 3 ? 'active' : 'inactive'}`}>
            <div className="step-header">
              <span className="step-number">3</span>
              <h2>Shipment Details</h2>
            </div>
            
            {step === 3 && (
              <div>
                <div className="form-group">
                  <label>Shipment Reference</label>
                  <input
                    type="text"
                    placeholder="Optional reference number"
                    value={formData.shipment_reference || ''}
                    onChange={(e) => setFormData({...formData, shipment_reference: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Piece Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.piece_count}
                    onChange={(e) => setFormData({...formData, piece_count: e.target.value})}
                  />
                </div>

                <button 
                  className="btn btn-success" 
                  onClick={handleCreateShipment}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Shipment'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateShipment;
