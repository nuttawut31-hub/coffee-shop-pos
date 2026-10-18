import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CashierView from './components/cashier/CashierView';
import BaristaView from './components/barista/BaristaView';
import OwnerView from './components/owner/OwnerView';
import { fetchQueue, fetchBranches } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('cashier'); // 'cashier' | 'barista' | 'owner'
  const [queueCount, setQueueCount] = useState(0);
  const [branches, setBranches] = useState([
    { id: 1, name: "สาขา 1: หน้า ม.บูรพา (Main Campus)", address: "ถนนลงหาดบางแสน ชลบุรี" },
    { id: 2, name: "สาขา 2: ห้างแหลมทอง (Mall Branch)", address: "ชั้น 1 ศูนย์การค้าแหลมทอง บางแสน" },
    { id: 3, name: "สาขา 3: ชายหาดวอนนภา (Beachfront)", address: "ถนนเลียบหาดวอนนภา ชลบุรี" },
  ]);
  const [selectedBranch, setSelectedBranch] = useState(1);

  // Load branches from backend
  useEffect(() => {
    async function loadBranches() {
      try {
        const data = await fetchBranches();
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
        }
      } catch (err) {
        console.warn('Using default branches:', err);
      }
    }
    loadBranches();
  }, []);

  // Keep queue badge updated in navbar for selected branch
  const refreshQueueCount = async () => {
    try {
      const data = await fetchQueue(selectedBranch);
      const list = Array.isArray(data) ? data : data.value || [];
      setQueueCount(list.length);
    } catch (err) {
      // Silently catch background badge error
    }
  };

  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 5000);
    return () => clearInterval(interval);
  }, [selectedBranch]);

  return (
    <div className="app-container">
      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={queueCount}
        branches={branches}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
      />

      {/* Main Views */}
      {activeTab === 'cashier' && (
        <CashierView
          selectedBranch={selectedBranch}
          branches={branches}
          onOrderPlaced={refreshQueueCount}
          onSwitchToBarista={() => setActiveTab('barista')}
        />
      )}
      {activeTab === 'barista' && (
        <BaristaView
          selectedBranch={selectedBranch}
          branches={branches}
        />
      )}
      {activeTab === 'owner' && (
        <OwnerView
          selectedBranch={selectedBranch}
          branches={branches}
          onSelectBranch={setSelectedBranch}
        />
      )}
    </div>
  );
}
