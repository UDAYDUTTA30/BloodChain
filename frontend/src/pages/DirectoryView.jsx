import React, { useState } from 'react';
import { Building2, Search, MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

export default function DirectoryView({ bloodBanks }) {
  const [selectedState, setSelectedState] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const states = ['ALL', ...new Set(bloodBanks?.map(b => b.state) || [])];

  const filteredBanks = bloodBanks?.filter(b => {
    const matchesState = selectedState === 'ALL' || b.state === selectedState;
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.district.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesState && matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>Indian Blood Bank Directory Reference</span>
          </h2>
          <p className="text-xs text-slate-400">
            National Health Portal reference layer of accredited blood centers and hospitals
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
          >
            {states.map(s => (
              <option key={s} value={s}>{s === 'ALL' ? 'All States' : s}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search facility or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-44"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBanks.map(bank => (
          <div
            key={bank.bank_id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-3 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-400 font-mono">{bank.bank_id}</span>
                <h3 className="text-base font-bold text-white">{bank.name}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span>{bank.address}, {bank.city}, {bank.state} - {bank.pincode}</span>
                </p>
              </div>

              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {bank.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{bank.contact}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{bank.service_time}</span>
              </div>
              <div className="col-span-2 flex items-center space-x-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{bank.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
              <span className="text-slate-500">Authorized Wallet:</span>
              <span className="font-mono text-cyan-400 truncate max-w-xs">{bank.wallet_address}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
