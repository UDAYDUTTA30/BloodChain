import React, { useState } from 'react';
import { Truck, CheckCircle2, HeartHandshake, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { STATUS_COLORS } from '../contracts/contractConfig';

export default function TransferWorkflowView({ units, onTriggerAction, onSelectUnit }) {
  const [tab, setTab] = useState('IN_TRANSIT'); // IN_TRANSIT or AT_HOSPITAL

  const inTransitUnits = units.filter(u => u.current_status === 'TRANSFERRED');
  const atHospitalUnits = units.filter(u => ['RECEIVED', 'ISSUED', 'COMPLETED'].includes(u.current_status));

  const activeUnits = tab === 'IN_TRANSIT' ? inTransitUnits : atHospitalUnits;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <span>Custody Transfer & Hospital Workflow</span>
          </h2>
          <p className="text-xs text-slate-400">
            Multi-organization custody handoff between Blood Bank dispatch and Hospital receipt
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('IN_TRANSIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'IN_TRANSIT' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            In-Transit Dispatches ({inTransitUnits.length})
          </button>
          <button
            onClick={() => setTab('AT_HOSPITAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'AT_HOSPITAL' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hospital Ward & Transfusions ({atHospitalUnits.length})
          </button>
        </div>
      </div>

      {activeUnits.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Truck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No blood units in {tab === 'IN_TRANSIT' ? 'transit' : 'hospital care'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeUnits.map(unit => (
            <div
              key={unit.blood_unit_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-bold flex items-center justify-center">
                    {unit.blood_group}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{unit.blood_unit_id}</h3>
                    <p className="text-[10px] text-slate-400">{unit.component_type}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[unit.current_status]}`}>
                  {unit.current_status}
                </span>
              </div>

              {/* Custody status block */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-[11px] space-y-1">
                <span className="text-slate-500 block text-[10px]">Destination Institution:</span>
                <span className="text-slate-200 font-medium">{unit.pending_destination || unit.current_facility || 'Hospital Ward'}</span>
                <span className="text-slate-500 block text-[10px] mt-2">Latest Blockchain Proof:</span>
                <span className="font-mono text-[9px] text-cyan-400 block truncate">{unit.blockchain_tx?.latest_tx}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {unit.current_status === 'TRANSFERRED' && (
                  <button
                    onClick={() => onTriggerAction(unit.blood_unit_id, 'confirmReceipt', { remarks: 'Acknowledged by Hospital Blood Bank' })}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Confirm Receipt at Hospital</span>
                  </button>
                )}

                {unit.current_status === 'RECEIVED' && (
                  <button
                    onClick={() => onTriggerAction(unit.blood_unit_id, 'issueBloodUnit', { remarks: 'Crossmatch verified. Issued to OT.' })}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 mr-1" />
                    <span>Issue for Patient Transfusion</span>
                  </button>
                )}

                {unit.current_status === 'ISSUED' && (
                  <button
                    onClick={() => onTriggerAction(unit.blood_unit_id, 'completeBloodUnit', { remarks: 'Transfusion completed successfully.' })}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Complete Transfusion</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectUnit(unit)}
                  className="w-full text-center text-[11px] text-slate-400 hover:text-white underline pt-1"
                >
                  View Digital Passport
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
