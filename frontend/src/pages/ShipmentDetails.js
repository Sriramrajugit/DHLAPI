import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShipmentAPI, CustomerAPI } from '../services/api';
import './ShipmentDetails.css';

function ShipmentDetails() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  
  const [shipment, setShipment] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadShipmentDetails();
  }, [shipmentId]);

  const loadShipmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const shipmentRes = await ShipmentAPI.getById(shipmentId);
      setShipment(shipmentRes.data);
      
      // Try to load customer details if we have customer_id
      if (shipmentRes.data.customer_id) {
        try {
          const customerRes = await CustomerAPI.getByDealId(shipmentRes.data.deal_id);
          setCustomer(customerRes.data);
        } catch (err) {
          console.log('Could not load customer details:', err);
        }
      }
    } catch (err) {
      setError(err.message || 'Error loading shipment details');
    } finally {
      setLoading(false);
    }
  };

  const downloadLabel = () => {
    if (shipment && shipment.label && shipment.label.data) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${shipment.label.data}`;
      link.download = `label-${shipment.awb_number}.pdf`;
      link.click();
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'CREATED': return '#007bff';
      case 'PICKED_UP': return '#17a2b8';
      case 'IN_TRANSIT': return '#ffc107';
      case 'DELIVERED': return '#28a745';
      case 'FAILED': return '#dc3545';
      case 'CANCELLED': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading shipment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/shipments')}>
          ← Back to Shipments
        </button>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="container">
        <div className="alert alert-warning">Shipment not found</div>
        <button className="btn btn-secondary" onClick={() => navigate('/shipments')}>
          ← Back to Shipments
        </button>
      </div>
    );
  }

  return (
    <div className="container shipment-details-container">
      {/* Header */}
      <div className="details-header">
        <div className="header-top">
          <button className="btn btn-link" onClick={() => navigate('/shipments')}>
            ← Back to Shipments
          </button>
        </div>
        
        <div className="header-main">
          <div className="awb-section">
            <h1>Shipment #{shipment.awb_number}</h1>
            <span 
              className="status-badge-large"
              style={{ backgroundColor: getStatusColor(shipment.status) }}
            >
              {shipment.status}
            </span>
          </div>
          
          <div className="header-actions">
            {shipment.label && shipment.label.data && (
              <button className="btn btn-primary" onClick={downloadLabel}>
                📥 Download Label
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="details-tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General Info
        </button>
        <button 
          className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          Customer & Addresses
        </button>
        <button 
          className={`tab ${activeTab === 'pieces' ? 'active' : ''}`}
          onClick={() => setActiveTab('pieces')}
        >
          Pieces & Dimensions
        </button>
        <button 
          className={`tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Services & Customs
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* General Info Tab */}
        {activeTab === 'general' && (
          <div className="content-panel">
            <div className="section">
              <h3>Shipment Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Shipment ID</label>
                  <p className="info-value">{shipment.id}</p>
                </div>
                <div className="info-item">
                  <label>AWB Number</label>
                  <p className="info-value">{shipment.awb_number}</p>
                </div>
                <div className="info-item">
                  <label>Deal ID</label>
                  <p className="info-value">{shipment.deal_id}</p>
                </div>
                <div className="info-item">
                  <label>Customer ID</label>
                  <p className="info-value">{shipment.customer_id}</p>
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Shipment Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Product Code</label>
                  <p className="info-value">{shipment.product_code || 'P (Standard)'}</p>
                </div>
                <div className="info-item">
                  <label>Content Type</label>
                  <p className="info-value">{shipment.content_type || 'NON_DOC'}</p>
                </div>
                <div className="info-item">
                  <label>Shipment Reference</label>
                  <p className="info-value">{shipment.shipment_reference || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <p className="info-value">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(shipment.status) }}
                    >
                      {shipment.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Quality & Scoring</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Confidence Score</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${shipment.confidence_score}%` }}
                    ></div>
                  </div>
                  <p className="info-value">{shipment.confidence_score?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Timeline</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Created Date</label>
                  <p className="info-value">
                    {new Date(shipment.created_date).toLocaleString()}
                  </p>
                </div>
                {shipment.updated_date && (
                  <div className="info-item">
                    <label>Updated Date</label>
                    <p className="info-value">
                      {new Date(shipment.updated_date).toLocaleString()}
                    </p>
                  </div>
                )}
                {shipment.shipped_date && (
                  <div className="info-item">
                    <label>Shipped Date</label>
                    <p className="info-value">
                      {new Date(shipment.shipped_date).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer & Addresses Tab */}
        {activeTab === 'customer' && (
          <div className="content-panel">
            {customer ? (
              <>
                <div className="section">
                  <h3>Customer Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Customer Name</label>
                      <p className="info-value">{customer.customer_name}</p>
                    </div>
                    <div className="info-item">
                      <label>Customer ID</label>
                      <p className="info-value">{customer.id}</p>
                    </div>
                    <div className="info-item">
                      <label>Contact Email</label>
                      <p className="info-value">{customer.contact_email || 'N/A'}</p>
                    </div>
                    <div className="info-item">
                      <label>Contact Phone</label>
                      <p className="info-value">{customer.contact_phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="section">
                  <h3>Customer Address</h3>
                  <div className="address-box">
                    <p className="address-line">{customer.address_line1}</p>
                    {customer.address_line2 && <p className="address-line">{customer.address_line2}</p>}
                    <p className="address-line">{customer.postal_code} {customer.city}</p>
                    <p className="address-line">{customer.country_code}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="alert alert-info">Customer details not available</div>
            )}

            {/* Shipper Address */}
            {shipment.shipper_address && (
              <div className="section">
                <h3>📤 Shipper (Pickup) Address</h3>
                <div className="address-box highlight-green">
                  <p className="address-title"><strong>{shipment.shipper_name}</strong></p>
                  <p className="address-line">{shipment.shipper_address.address_line1}</p>
                  {shipment.shipper_address.address_line2 && (
                    <p className="address-line">{shipment.shipper_address.address_line2}</p>
                  )}
                  <p className="address-line">
                    {shipment.shipper_address.postal_code} {shipment.shipper_address.city}
                  </p>
                  <p className="address-line">{shipment.shipper_address.country_code}</p>
                </div>
              </div>
            )}

            {/* Receiver Address */}
            {shipment.receiver_address && (
              <div className="section">
                <h3>📥 Receiver (Delivery) Address</h3>
                <div className="address-box highlight-blue">
                  <p className="address-title"><strong>{shipment.receiver_name}</strong></p>
                  <p className="address-line">{shipment.receiver_address.address_line1}</p>
                  {shipment.receiver_address.address_line2 && (
                    <p className="address-line">{shipment.receiver_address.address_line2}</p>
                  )}
                  <p className="address-line">
                    {shipment.receiver_address.postal_code} {shipment.receiver_address.city}
                  </p>
                  <p className="address-line">{shipment.receiver_address.country_code}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pieces & Dimensions Tab */}
        {activeTab === 'pieces' && (
          <div className="content-panel">
            <div className="section">
              <h3>Shipment Composition</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Total Pieces</label>
                  <p className="info-value">{shipment.piece_count || 1}</p>
                </div>
                <div className="info-item">
                  <label>Total Weight</label>
                  <p className="info-value">
                    {shipment.details?.total_weight || shipment.weight || 'N/A'} {shipment.details?.weight_uom || 'KG'}
                  </p>
                </div>
              </div>
            </div>

            {shipment.dimensions && (
              <div className="section">
                <h3>Dimensions</h3>
                {Array.isArray(shipment.dimensions) ? (
                  <div className="pieces-list">
                    {shipment.dimensions.map((piece, idx) => (
                      <div key={idx} className="piece-card">
                        <div className="piece-header">
                          <h4>Piece {idx + 1}</h4>
                        </div>
                        <div className="piece-info">
                          <div className="info-row">
                            <span className="label">Weight:</span>
                            <span className="value">{piece.weight || 'N/A'} {piece.weightUom || 'KG'}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Dimensions:</span>
                            <span className="value">
                              L: {piece.length} × W: {piece.width} × H: {piece.height} {piece.unitOfMeasure || 'CM'}
                            </span>
                          </div>
                          {piece.description && (
                            <div className="info-row">
                              <span className="label">Description:</span>
                              <span className="value">{piece.description}</span>
                            </div>
                          )}
                          {piece.sku && (
                            <div className="info-row">
                              <span className="label">SKU:</span>
                              <span className="value">{piece.sku}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Dimensions Info</label>
                      <pre className="json-display">{JSON.stringify(shipment.dimensions, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Services & Customs Tab */}
        {activeTab === 'services' && (
          <div className="content-panel">
            {shipment.special_services && shipment.special_services.length > 0 ? (
              <div className="section">
                <h3>Special Services</h3>
                <div className="services-list">
                  {shipment.special_services.map((service, idx) => (
                    <div key={idx} className="service-card">
                      <span className="service-code">{service.service_code}</span>
                      {service.value && <span className="service-value">${service.value}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="section">
                <div className="alert alert-info">No special services selected</div>
              </div>
            )}

            {shipment.invoice_data && (
              <div className="section">
                <h3>Invoice & Customs Declaration</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Invoice Number</label>
                    <p className="info-value">{shipment.invoice_data.invoice_number || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Invoice Date</label>
                    <p className="info-value">{shipment.invoice_data.invoice_date || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Currency</label>
                    <p className="info-value">{shipment.invoice_data.currency_code || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Amount</label>
                    <p className="info-value">{shipment.invoice_data.amount || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Terms of Trade</label>
                    <p className="info-value">{shipment.invoice_data.terms_of_trade || 'N/A'}</p>
                  </div>
                  <div className="info-item">
                    <label>Payment Method</label>
                    <p className="info-value">{shipment.invoice_data.payment_method || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="details-footer">
        <button className="btn btn-secondary" onClick={() => navigate('/shipments')}>
          ← Back to Shipments
        </button>
        {shipment.label && shipment.label.data && (
          <button className="btn btn-primary" onClick={downloadLabel}>
            📥 Download Label
          </button>
        )}
      </div>
    </div>
  );
}

export default ShipmentDetails;
