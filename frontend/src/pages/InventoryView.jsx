import React, { useState } from 'react';
import { Package, Search, Filter, AlertTriangle, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { STATUS_COLORS } from '../contracts/contractConfig';

export default function InventoryView({
  units,
  hospitals,
  onTriggerAction,
  onSelectUnit,
  onOpenQR
}) {
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('STORED');
  const [searchTerm, setSearchTerm] = useState('');
  const [transferTargetHosp, setTransferTargetHosp] = useState(hospitals?.[0]?.name || 'Safdarjung Hospital');

  const bloodGroups = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statusOptions = ['ALL', 'APPROVED', 'STORED', 'TRANSFERRED', 'RECEIVED', 'EXPIRED'];

  const filteredUnits = units.filter(u => {
    const matchesGroup = filterGroup === 'ALL' || u.blood_group === filterGroup;
    const matchesStatus = filterStatus === 'ALL' || u.current_status === filterStatus;
    const matchesSearch = u.blood_unit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.donation_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Blood Bank Cold-Chain Inventory</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time cold storage stock tracking, shelf-life monitoring & transfer dispatch
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Blood Group Filter */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
          >
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg === 'ALL' ? 'All Blood Groups' : bg}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
          >
            {statusOptions.map(st => (
              <option key={st} value={st}>{st === 'ALL' ? 'All Statuses' : st}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search Bag ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-36"
          />
        </div>
      </div>

      {/* Blood Bags Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Unit ID & QR</th>
                <th className="px-4 py-3">Group & Type</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No blood units found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUnits.map(unit => {
                  const nowTs = Math.floor(Date.now() / 1000);
                  const isExp = unit.expiry_timestamp <= nowTs || unit.current_status === 'EXPIRED';
                  const daysLeft = Math.round((unit.expiry_timestamp - nowTs) / 86400);

                  return (
                    <tr key={unit.blood_unit_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onOpenQR(unit)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="View QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <span
                            onClick={() => onSelectUnit(unit)}
                            className="font-mono font-bold text-white hover:text-red-400 cursor-pointer"
                          >
                            {unit.blood_unit_id}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-red-400 text-sm">{unit.blood_group}</span>
                        <span className="text-slate-500 text-[11px] block">{unit.component_type}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[unit.current_status] || 'bg-slate-800 text-slate-300'}`}>
                          {unit.current_status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300 text-[11px] truncate max-w-xs">
                        {unit.current_facility || 'Blood Bank'}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-1.5">
                          {isExp ? (
                            <span className="text-rose-400 font-semibold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Expired</span>
                            </span>
                          ) : daysLeft <= 7 ? (
                            <span className="text-amber-400 font-medium">
                              Expiring in {daysLeft}d
                            </span>
                          ) : (
                            <span className="text-slate-300">{unit.expiry_date_str}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        {unit.current_status === 'APPROVED' && (
                          <button
                            onClick={() => onTriggerAction(unit.blood_unit_id, 'storeBloodUnit')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                          >
                            Store in Cold Bank
                          </button>
                        )}

                        {unit.current_status === 'STORED' && !isExp && (
                          <button
                            onClick={() => onTriggerAction(unit.blood_unit_id, 'initiateTransfer', {
                              destination_facility: transferTargetHosp,
                              destination_wallet: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
                              remarks: `Dispatched to ${transferTargetHosp}`
                            })}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold inline-flex items-center space-x-1"
                          >
                            <span>Transfer</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => onSelectUnit(unit)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                        >
                          Passport
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
