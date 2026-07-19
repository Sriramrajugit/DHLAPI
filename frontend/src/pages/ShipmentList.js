import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShipmentAPI } from '../services/api';
import '../pages/ShipmentList.css';

function ShipmentList() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadShipments();
  }, [page]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ShipmentAPI.getAll(pageSize, page * pageSize);
      setShipments(res.data.data || []);
    } catch (err) {
      setError(err.message || 'Error loading shipments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'CREATED': return '#007bff';
      case 'SHIPPED': return '#28a745';
      case 'IN_TRANSIT': return '#ffc107';
      case 'DELIVERED': return '#20c997';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="container">
      <h1>Shipments</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {shipments.length === 0 ? (
        <div className="card">
          <p>No shipments found</p>
        </div>
      ) : (
        <div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>AWB Number</th>
                  <th>Deal ID</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <button
                        className="awb-link"
                        onClick={() => navigate(`/shipments/${shipment.id}`)}
                        title="Click to view details"
                      >
                        {shipment.awb_number}
                      </button>
                    </td>
                    <td>{shipment.deal_id}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusBadgeColor(shipment.status) }}
                      >
                        {shipment.status}
                      </span>
                    </td>
                    <td>{shipment.confidence_score}%</td>
                    <td>{new Date(shipment.created_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button 
              className="btn btn-secondary"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button 
              className="btn btn-secondary"
              onClick={() => setPage(page + 1)}
              disabled={shipments.length < pageSize}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentList;
