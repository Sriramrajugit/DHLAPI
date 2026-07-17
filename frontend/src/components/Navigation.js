import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="nav-logo">📦</span>
          DHL Shipment Automation
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link to="/create" className="nav-link">Create Shipment</Link>
          </li>
          <li className="nav-item">
            <Link to="/shipments" className="nav-link">View Shipments</Link>
          </li>
          <li className="nav-item">
            <Link to="/tracking" className="nav-link">Track</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
