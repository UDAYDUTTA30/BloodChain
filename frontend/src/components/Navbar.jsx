import React from 'react';
import { Droplet, Shield, Wallet, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Navbar({
  currentAccount,
  activeRole,
  setActiveRole,
  onConnectWallet,
  networkName,
  activeTab,
  setActiveTab
}) {
  const roles = [
    { id: 'DEFAULT_ADMIN_ROLE', label: 'Admin', color: 'border-amber-500/50 text-amber-300' },
    { id: 'COLLECTION_ROLE', label: 'Collection Center', color: 'border-blue-500/50 text-blue-300' },
    { id: 'LAB_ROLE', label: 'Laboratory', color: 'border-purple-500/50 text-purple-300' },
    { id: 'BLOOD_BANK_ROLE', label: 'Blood Bank', color: 'border-emerald-500/50 text-emerald-300' },
    { id: 'HOSPITAL_ROLE', label: 'Hospital', color: 'border-cyan-500/50 text-cyan-300' },
    { id: 'AUDITOR_ROLE', label: 'Auditor', color: 'border-rose-500/50 text-rose-300' }
  ];

  const navLinks = [
    { id: 'passport', label: 'Blood Passport' },
    { id: 'register', label: 'Register Unit' },
    { id: 'testing', label: 'Lab Queue' },
    { id: 'inventory', label: 'Cold Inventory' },
    { id: 'transfer', label: 'Transfer Workflow' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'forecast', label: 'Demand Forecast' },
    { id: 'anomalies', label: 'Anomaly Audit' },
    { id: 'directory', label: 'Indian Directory' }
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('passport')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-900/40">
              <Droplet className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">Blood<span className="text-red-500">Chain</span></span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Blockchain Blood Supply Chain & Digital Passport</p>
            </div>
          </div>

          {/* Role Switcher & MetaMask Connect */}
          <div className="flex items-center space-x-3">
            {/* Role Selector dropdown */}
            <div className="hidden lg:flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
              <span className="text-xs text-slate-500 px-2 font-medium">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Network Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>{networkName || 'Sepolia'}</span>
            </div>

            {/* Wallet Connect Button */}
            <button
              onClick={onConnectWallet}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-medium shadow-md shadow-red-950/50 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>
                {currentAccount
                  ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`
                  : 'Connect MetaMask'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Bar Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {navLinks.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
