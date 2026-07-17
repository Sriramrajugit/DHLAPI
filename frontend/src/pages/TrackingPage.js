import React, { useState } from 'react';
import { TrackingAPI } from '../services/api';
import '../pages/TrackingPage.css';

function TrackingPage() {
  const [awbNumber, setAwbNumber] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await TrackingAPI.getHistory(awbNumber);
      setTracking(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Tracking information not found');
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setError(null);
      await TrackingAPI.simulate(awbNumber);
      setError(null);
      // Reload tracking after simulation
      setTimeout(handleSearch, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error simulating tracking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'SHIPMENT_CREATED': return '📦';
      case 'PICKED_UP': return '🚚';
      case 'IN_TRANSIT': return '✈️';
      case 'OUT_FOR_DELIVERY': return '🚐';
      case 'DELIVERED': return '✓';
      default: return '📍';
    }
  };

  return (
    <div className="container">
      <h1>Track Shipment</h1>

      <div className="card">
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter AWB Number"
            value={awbNumber}
            onChange={(e) => setAwbNumber(e.target.value)}
            className="search-input"
          />
          <button 
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={loading || !awbNumber}
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
          {tracking && (
            <button 
              className="btn btn-secondary"
              onClick={handleSimulate}
              disabled={loading}
            >
              {loading ? 'Simulating...' : 'Simulate Progress'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tracking && tracking.length > 0 && (
        <div className="card">
          <h2>Tracking History</h2>
          <div className="timeline">
            {tracking.map((event, index) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-marker">
                  <span className="timeline-icon">{getStatusIcon(event.status)}</span>
                  <div className="timeline-line"></div>
                </div>
                <div className="timeline-content">
                  <h3>{event.status}</h3>
                  <p className="timeline-location">{event.location}</p>
                  <p className="timeline-details">{event.details}</p>
                  <p className="timeline-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackingPage;
