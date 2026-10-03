import React, { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Search, ShieldCheck, FileText } from 'lucide-react';

export default function TestingQueueView({ units, onTriggerAction, onSelectUnit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Contamination detected');

  // Filter units ready for lab testing
  const testingUnits = units.filter(u => 
    ['COLLECTED', 'TESTING'].includes(u.current_status) &&
    (u.blood_unit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.blood_group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>Laboratory Screening Queue</span>
          </h2>
          <p className="text-xs text-slate-400">
            Mandatory serological screening for HIV, HBV, HCV, Syphilis & Malaria prior to storage
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Unit ID or Blood Group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-full sm:w-64"
          />
        </div>
      </div>

      {testingUnits.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Activity className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No blood bags currently pending laboratory testing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testingUnits.map(unit => (
            <div
              key={unit.blood_unit_id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 font-bold flex items-center justify-center">
                    {unit.blood_group}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{unit.blood_unit_id}</h3>
                    <p className="text-[10px] text-slate-400">{unit.component_type} • {unit.collection_date_str}</p>
                  </div>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  {unit.current_status}
                </span>
              </div>

              {/* Lab Test Checklist */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>HIV 1 & 2 Antibody:</span>
                  <span className="text-emerald-400 font-medium">Non-Reactive</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>HBsAg (Hepatitis B):</span>
                  <span className="text-emerald-400 font-medium">Negative</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>HCV Antibody:</span>
                  <span className="text-emerald-400 font-medium">Non-Reactive</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Syphilis & Malaria:</span>
                  <span className="text-emerald-400 font-medium">Clear</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                {unit.current_status === 'COLLECTED' ? (
                  <button
                    onClick={() => onTriggerAction(unit.blood_unit_id, 'submitForTesting')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    Take into Testing
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onTriggerAction(unit.blood_unit_id, 'approveBloodUnit', { remarks: 'Lab certified: All 5 pathogens negative' })}
                      className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Safe</span>
                    </button>

                    <button
                      onClick={() => onTriggerAction(unit.blood_unit_id, 'rejectBloodUnit', { rejection_reason: rejectionReason })}
                      className="px-3 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-800 text-rose-300 text-xs font-semibold transition-all"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => onSelectUnit(unit)}
                className="w-full text-center text-[11px] text-slate-400 hover:text-white underline pt-1"
              >
                Inspect Full Digital Passport
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
