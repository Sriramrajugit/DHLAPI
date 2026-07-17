import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import CreateShipment from './pages/CreateShipment';
import ShipmentList from './pages/ShipmentList';
import TrackingPage from './pages/TrackingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateShipment />} />
          <Route path="/shipments" element={<ShipmentList />} />
          <Route path="/tracking" element={<TrackingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
