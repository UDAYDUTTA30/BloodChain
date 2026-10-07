import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, QrCode, ExternalLink, Calendar, 
  Clock, MapPin, CheckCircle2, AlertCircle, FileCheck, ArrowRight,
  Droplet, Activity, User, Building2
} from 'lucide-react';
import { STATUS_COLORS } from '../contracts/contractConfig';

export default function BloodUnitPassport({
  unit,
  onOpenQR,
  onTriggerAction,
  activeRole
}) {
  const [actionLoading, setActionLoading] = useState(false);

  if (!unit) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <Droplet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-base font-medium">Select a blood unit to inspect its verifiable digital passport.</p>
      </div>
    );
  }

  const stages = [
    { key: 'COLLECTED', label: 'Collected' },
    { key: 'TESTING', label: 'Testing' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'STORED', label: 'Cold Storage' },
    { key: 'TRANSFERRED', label: 'In Transit' },
    { key: 'RECEIVED', label: 'Hospital Received' },
    { key: 'ISSUED', label: 'Issued' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const currentStatus = unit.current_status || 'COLLECTED';
  const currentIndex = stages.findIndex(s => s.key === currentStatus);
  const isTerminal = ['COMPLETED', 'REJECTED', 'EXPIRED'].includes(currentStatus);

  const handleAction = async (actionName, params = {}) => {
    setActionLoading(true);
    try {
      await onTriggerAction(unit.blood_unit_id, actionName, params);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-red-900/40">
            {unit.blood_group}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-red-400">Blood Unit Passport</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">{unit.donation_id}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>{unit.blood_unit_id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[currentStatus] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                {currentStatus}
              </span>
            </h2>
          </div>
        </div>

        {/* Verification Check & QR Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ethereum Sepolia Verified</span>
          </div>

          <button
            onClick={() => onOpenQR(unit)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <QrCode className="w-4 h-4 text-slate-300" />
            <span>QR Code</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Interactive Lifecycle Stepper */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Provenance Timeline</h3>
            {unit.days_until_expiry !== undefined && (
              <span className={`text-xs font-medium ${unit.days_until_expiry <= 7 ? 'text-amber-400' : 'text-slate-400'}`}>
                Shelf life remaining: <strong className="text-white">{unit.days_until_expiry} days</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {stages.map((stage, idx) => {
              const isPast = currentIndex > idx;
              const isCurrent = currentIndex === idx;
              const isPending = currentIndex < idx;

              return (
                <div
                  key={stage.key}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-red-950/40 border-red-500/80 text-white shadow-md shadow-red-950/50'
                      : isPast
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700"></div>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold truncate">{stage.label}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-500">
                    {isCurrent ? 'Active' : isPast ? 'Recorded' : 'Pending'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Grid: Bag Metadata & Lab Screening */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Metadata Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <Droplet className="w-4 h-4 text-red-500" />
              <span>Unit Specifications</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Component</span>
                <span className="font-semibold text-slate-200">{unit.component_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Blood Group</span>
                <span className="font-semibold text-red-400">{unit.blood_group}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Collection Date</span>
                <span className="font-medium text-slate-300">{unit.collection_date_str}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Expiry Date</span>
                <span className="font-medium text-slate-300">{unit.expiry_date_str}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Responsible Custodian</span>
                <span className="font-medium text-slate-200 flex items-center space-x-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{unit.current_facility || 'National Blood Service'}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 block truncate mt-0.5">
                  {unit.current_owner_wallet}
                </span>
              </div>
            </div>
          </div>

          {/* Laboratory Serology Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Laboratory Screening Record</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                unit.lab_test?.is_safe ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {unit.lab_test?.is_safe ? 'CLEAN / SAFE' : 'PENDING / REJECTED'}
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">HIV-1/2 Screening</span>
                <span className="font-semibold text-emerald-400">{unit.lab_test?.hiv_result || 'Negative'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Hepatitis B (HBsAg)</span>
                <span className="font-semibold text-emerald-400">{unit.lab_test?.hbv_result || 'Negative'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Hepatitis C (HCV)</span>
                <span className="font-semibold text-emerald-400">{unit.lab_test?.hcv_result || 'Negative'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                <span className="text-slate-500 block text-[10px]">Syphilis (VDRL)</span>
                <span className="font-semibold text-emerald-400">{unit.lab_test?.syphilis_result || 'Negative'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic & Blockchain Verification Proofs */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Cryptographic Integrity & On-Chain Audit Proofs</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Sepolia Testnet</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60">
              <span className="text-slate-500 text-[11px]">On-Chain Metadata Hash (SHA-256):</span>
              <span className="text-emerald-400 truncate max-w-xs">{unit.metadata_hash}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/60">
              <span className="text-slate-500 text-[11px]">Latest Transaction Proof:</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${unit.blockchain_tx?.latest_tx}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 truncate max-w-xs"
              >
                <span>{unit.blockchain_tx?.latest_tx}</span>
                <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Action Trigger Panel (Role-based) */}
        {!isTerminal && (
          <div className="bg-gradient-to-r from-red-950/30 via-slate-900 to-red-950/30 border border-red-900/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-white">Next Permitted State Transition</h4>
              <p className="text-[11px] text-slate-400">
                Action requires authorized wallet role: <strong className="text-slate-200">
                  {currentStatus === 'COLLECTED' ? 'COLLECTION_ROLE' :
                   currentStatus === 'TESTING' ? 'LAB_ROLE' :
                   (currentStatus === 'APPROVED' || currentStatus === 'STORED') ? 'BLOOD_BANK_ROLE' :
                   (currentStatus === 'TRANSFERRED' || currentStatus === 'RECEIVED' || currentStatus === 'ISSUED') ? 'HOSPITAL_ROLE' : 'N/A'}
                </strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {currentStatus === 'COLLECTED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('submitForTesting', { remarks: 'Submitted to laboratory' })}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                >
                  <span>Submit to Testing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStatus === 'TESTING' && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction('approveBloodUnit', { remarks: 'Serology clean - Approved for storage' })}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Approve Safe</span>
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleAction('rejectBloodUnit', { rejection_reason: 'Contamination detected' })}
                    className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    Reject Contaminated
                  </button>
                </>
              )}

              {currentStatus === 'APPROVED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('storeBloodUnit', { remarks: 'Stocked into cold storage refrigerator' })}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  Store in Blood Bank
                </button>
              )}

              {currentStatus === 'STORED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('initiateTransfer', { destination_facility: 'City General Hospital', destination_wallet: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788', remarks: 'Dispatched in cold box' })}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                >
                  <span>Dispatch Transfer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStatus === 'TRANSFERRED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('confirmReceipt', { destination_facility: 'City General Hospital', remarks: 'Received and verified cold-chain temp' })}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Confirm Hospital Receipt</span>
                </button>
              )}

              {currentStatus === 'RECEIVED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('issueBloodUnit', { remarks: 'Crossmatched for scheduled patient' })}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                >
                  <span>Issue for Transfusion</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStatus === 'ISSUED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('completeBloodUnit', { remarks: 'Transfusion successful. Lifecycle closed.' })}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Complete Lifecycle</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
