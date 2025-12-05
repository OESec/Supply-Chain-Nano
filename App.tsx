import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VendorList from './components/VendorList';
import SupplyChainMap from './components/SupplyChainMap';
import Alerts from './components/Alerts';
import Settings from './components/Settings';
import { MOCK_VENDORS, MOCK_ALERTS } from './constants';
import { Vendor, Alert } from './types';

const App: React.FC = () => {
  // Global State with LocalStorage Persistence
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const savedVendors = localStorage.getItem('riskguard_vendors');
      return savedVendors ? JSON.parse(savedVendors) : MOCK_VENDORS;
    } catch (e) {
      console.error("Failed to load vendors from local storage", e);
      return MOCK_VENDORS;
    }
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const savedAlerts = localStorage.getItem('riskguard_alerts');
      return savedAlerts ? JSON.parse(savedAlerts) : MOCK_ALERTS;
    } catch (e) {
      console.error("Failed to load alerts from local storage", e);
      return MOCK_ALERTS;
    }
  });

  // Persist vendors whenever they change
  useEffect(() => {
    localStorage.setItem('riskguard_vendors', JSON.stringify(vendors));
  }, [vendors]);

  // Persist alerts whenever they change
  useEffect(() => {
    localStorage.setItem('riskguard_alerts', JSON.stringify(alerts));
  }, [alerts]);

  return (
    <Router>
      <Layout alertCount={alerts.filter(a => !a.isRead).length}>
        <Routes>
          <Route path="/" element={<Dashboard vendors={vendors} alerts={alerts} />} />
          <Route path="/vendors" element={<VendorList vendors={vendors} setVendors={setVendors} />} />
          <Route path="/map" element={<SupplyChainMap vendors={vendors} />} />
          <Route path="/alerts" element={<Alerts alerts={alerts} vendors={vendors} setAlerts={setAlerts} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;