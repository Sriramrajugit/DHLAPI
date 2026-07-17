import React, { useState, useEffect } from 'react';
import { ShipmentAPI, CustomerAPI } from '../services/api';
import '../pages/Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalShipments: 0,
    totalCustomers: 0,
    averageConfidence: 0,
    shipmentsByStatus: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [shipmentsRes, customersRes] = await Promise.all([
        ShipmentAPI.getAll(1000, 0),
        CustomerAPI.getAll(1000, 0)
      ]);

      const shipments = shipmentsRes.data.data || [];
      const customers = customersRes.data.data || [];

      const totalConfidence = shipments.reduce((sum, s) => sum + (s.confidence_score || 0), 0);
      const avgConfidence = shipments.length > 0 ? totalConfidence / shipments.length : 0;

      const statusGroups = {};
      shipments.forEach(s => {
        statusGroups[s.status] = (statusGroups[s.status] || 0) + 1;
      });

      setStats({
        totalShipments: shipments.length,
        totalCustomers: customers.length,
        averageConfidence: avgConfidence.toFixed(2),
        shipmentsByStatus: statusGroups
      });
    } catch (err) {
      setError(err.message || 'Error loading dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Total Shipments</h3>
          <p className="stat-value">{stats.totalShipments}</p>
        </div>
        <div className="stat-card">
          <h3>Total Customers</h3>
          <p className="stat-value">{stats.totalCustomers}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Confidence Score</h3>
          <p className="stat-value">{stats.averageConfidence}%</p>
        </div>
      </div>

      <div className="card">
        <h2>Shipments by Status</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.shipmentsByStatus).map(([status, count]) => (
              <tr key={status}>
                <td>{status}</td>
                <td>{count}</td>
                <td>{stats.totalShipments > 0 ? ((count / stats.totalShipments) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
