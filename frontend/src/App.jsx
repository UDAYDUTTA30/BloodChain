import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import BloodUnitPassport from './components/BloodUnitPassport';
import QRModal from './components/QRModal';
import DocumentVerifier from './components/DocumentVerifier';
import RegistrationView from './pages/RegistrationView';
import TestingQueueView from './pages/TestingQueueView';
import InventoryView from './pages/InventoryView';
import TransferWorkflowView from './pages/TransferWorkflowView';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ForecastDashboard from './pages/ForecastDashboard';
import AnomalyAuditView from './pages/AnomalyAuditView';
import DirectoryView from './pages/DirectoryView';
import { SEPOLIA_CONFIG } from './contracts/contractConfig';

export default function App() {
  const [activeTab, setActiveTab] = useState('passport');
  const [activeRole, setActiveRole] = useState('DEFAULT_ADMIN_ROLE');
  const [currentAccount, setCurrentAccount] = useState('');
  const [networkName, setNetworkName] = useState('Sepolia');

  const [units, setUnits] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrTargetUnit, setQrTargetUnit] = useState(null);

  // Fetch initial data from backend API
  const refreshUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      setUnits(data);
      if (data.length > 0 && !selectedUnit) {
        setSelectedUnit(data[0]);
      } else if (selectedUnit) {
        const updated = data.find(u => u.blood_unit_id === selectedUnit.blood_unit_id);
        if (updated) setSelectedUnit(updated);
      }
    } catch (err) {
      console.error('Error fetching blood units:', err);
    }
  };

  useEffect(() => {
    refreshUnits();

    fetch('/api/blood-banks')
      .then(res => res.json())
      .then(data => setBloodBanks(data))
      .catch(err => console.error(err));

    fetch('/api/hospitals')
      .then(res => res.json())
      .then(data => setHospitals(data))
      .catch(err => console.error(err));
  }, []);

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          const network = await provider.getNetwork();
          setNetworkName(network.name === 'sepolia' ? 'Sepolia' : (network.name || 'Localhost'));
        }
      } catch (err) {
        console.error('Wallet connection failed:', err);
      }
    } else {
      alert('MetaMask extension not found. Please install MetaMask to interact with Sepolia contracts.');
    }
  };

  // State Transition Action Trigger
  const handleTriggerAction = async (unitId, actionName, params = {}) => {
    try {
      const res = await fetch(`/api/units/${unitId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionName,
          caller_role: activeRole,
          caller_wallet: currentAccount || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          ...params
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Action Blocked by Protocol:\n${JSON.stringify(data.detail, null, 2)}`);
        return;
      }

      await refreshUnits();
    } catch (err) {
      console.error('Failed to trigger action:', err);
      alert(err.message);
    }
  };

  const handleOpenQR = (unit) => {
    setQrTargetUnit(unit);
    setQrModalOpen(true);
  };

  const handleSearchUnit = (unitId) => {
    const found = units.find(u => u.blood_unit_id.toLowerCase() === unitId.toLowerCase());
    if (found) {
      setSelectedUnit(found);
      setActiveTab('passport');
    } else {
      alert(`Unit ID '${unitId}' not found.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation Header */}
      <Navbar
        currentAccount={currentAccount}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onConnectWallet={connectWallet}
        networkName={networkName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'passport' && (
          <div className="space-y-6">
            <BloodUnitPassport
              unit={selectedUnit}
              onOpenQR={handleOpenQR}
              onTriggerAction={handleTriggerAction}
              activeRole={activeRole}
            />

            {/* Document Verifier Widget */}
            <DocumentVerifier currentUnit={selectedUnit} />
          </div>
        )}

        {activeTab === 'register' && (
          <RegistrationView
            onUnitRegistered={(newUnit) => {
              refreshUnits();
              setSelectedUnit(newUnit);
              setActiveTab('passport');
            }}
            bloodBanks={bloodBanks}
          />
        )}

        {activeTab === 'testing' && (
          <TestingQueueView
            units={units}
            onTriggerAction={handleTriggerAction}
            onSelectUnit={(u) => {
              setSelectedUnit(u);
              setActiveTab('passport');
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            units={units}
            hospitals={hospitals}
            onTriggerAction={handleTriggerAction}
            onSelectUnit={(u) => {
              setSelectedUnit(u);
              setActiveTab('passport');
            }}
            onOpenQR={handleOpenQR}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferWorkflowView
            units={units}
            onTriggerAction={handleTriggerAction}
            onSelectUnit={(u) => {
              setSelectedUnit(u);
              setActiveTab('passport');
            }}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {activeTab === 'forecast' && <ForecastDashboard />}

        {activeTab === 'anomalies' && (
          <AnomalyAuditView onTriggerAction={handleTriggerAction} />
        )}

        {activeTab === 'directory' && <DirectoryView bloodBanks={bloodBanks} />}
      </main>

      {/* QR Passport Modal */}
      <QRModal
        unit={qrTargetUnit}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onSearchUnit={handleSearchUnit}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BloodChain © 2026 • Academic Blockchain Research Prototype</span>
          <span className="font-mono text-[11px] text-slate-400">Solidity ^0.8.20 | Ethereum Sepolia | ethers.js</span>
        </div>
      </footer>
    </div>
  );
}
