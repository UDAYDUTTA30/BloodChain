import React, { useState } from 'react';
import { Droplet, PlusCircle, CheckCircle, QrCode, Building, Calendar, User } from 'lucide-react';

export default function RegistrationView({ onUnitRegistered, bloodBanks }) {
  const [formData, setFormData] = useState({
    blood_unit_id: `BB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    donation_id: `DON-2026-${Math.floor(5000 + Math.random() * 5000)}`,
    blood_group: 'O+',
    component_type: 'PRBC',
    collection_date: new Date().toISOString().split('T')[0],
    shelf_life_days: 42,
    facility_name: 'AIIMS Main Blood Bank',
    facility_wallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    donor_notes: 'Eligible regular donor, hemoglobin 14.5 g/dL'
  });

  const [loading, setLoading] = useState(false);
  const [successUnit, setSuccessUnit] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const components = ['Whole Blood', 'PRBC', 'FFP', 'Platelets'];

  const handleFacilityChange = (e) => {
    const selectedBank = bloodBanks?.find(b => b.name === e.target.value);
    setFormData(prev => ({
      ...prev,
      facility_name: e.target.value,
      facility_wallet: selectedBank?.wallet_address || prev.facility_wallet
    }));
  };

  const handleComponentChange = (e) => {
    const comp = e.target.value;
    const shelfDays = comp === 'Platelets' ? 5 : (comp === 'FFP' ? 365 : 42);
    setFormData(prev => ({
      ...prev,
      component_type: comp,
      shelf_life_days: shelfDays
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessUnit(null);

    try {
      const res = await fetch('/api/units/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to register blood unit.');
      }
      setSuccessUnit(data.blood_unit);
      onUnitRegistered(data.blood_unit);
      
      // Auto-generate next unit ID
      setFormData(prev => ({
        ...prev,
        blood_unit_id: `BB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        donation_id: `DON-2026-${Math.floor(5000 + Math.random() * 5000)}`
      }));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-800/60 text-blue-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Blood Unit Registration (Collection Center)</h2>
            <p className="text-xs text-slate-400">
              Create on-chain verifiable digital identity for newly collected blood bag
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs mb-6">
            {errorMsg}
          </div>
        )}

        {successUnit && (
          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs mb-6 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Blood Unit Successfully Registered & Recorded on Blockchain!</span>
            </div>
            <p className="font-mono text-[11px]">Unit ID: {successUnit.blood_unit_id} | Metadata Hash: {successUnit.metadata_hash}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Blood Unit Bag ID (QR Key)</label>
              <input
                type="text"
                required
                value={formData.blood_unit_id}
                onChange={(e) => setFormData({ ...formData, blood_unit_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Linked Donation ID</label>
              <input
                type="text"
                required
                value={formData.donation_id}
                onChange={(e) => setFormData({ ...formData, donation_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Blood Group</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-red-400 focus:outline-none focus:border-red-500"
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Blood Component</label>
              <select
                value={formData.component_type}
                onChange={handleComponentChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                {components.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Collection Date</label>
              <input
                type="date"
                required
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Shelf Life (Days)</label>
              <input
                type="number"
                value={formData.shelf_life_days}
                readOnly
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Collection Facility (Indian Directory)</label>
              <select
                value={formData.facility_name}
                onChange={handleFacilityChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                {bloodBanks?.map(b => (
                  <option key={b.bank_id} value={b.name}>{b.name} ({b.city}, {b.state})</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Custodian Wallet Address</label>
              <input
                type="text"
                readOnly
                value={formData.facility_wallet}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-red-950/50 transition-all flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Minting Blood Unit Passport...' : 'Register Unit & Generate Passport QR'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
