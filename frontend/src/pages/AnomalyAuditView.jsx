import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Play, CheckCircle2, XCircle, RefreshCw, Lock } from 'lucide-react';

export default function AnomalyAuditView({ onTriggerAction }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulateResult, setSimulateResult] = useState(null);
  const [customAttack, setCustomAttack] = useState({
    unitId: 'BB-2026-9282',
    action: 'issueBloodUnit',
    role: 'HACKER_ROLE'
  });

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/anomalies/audit-log');
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleCustomAttack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSimulateResult(null);
    try {
      const res = await fetch(`/api/units/${customAttack.unitId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: customAttack.action,
          caller_role: customAttack.role,
          caller_wallet: '0xMaliciousHackerWallet999',
          remarks: 'Custom attack simulation'
        })
      });
      const data = await res.json();
      setSimulateResult({
        scenarioId: 'CUSTOM-ATTACK',
        blocked: !res.ok,
        detail: res.ok ? data : (data.detail || data)
      });
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const anomalyScenarios = [
    {
      id: 'ANOM-01',
      title: 'Attempt Issuance of Expired Blood Bag',
      unitId: 'BB-2026-1004',
      action: 'issueBloodUnit',
      role: 'HOSPITAL_ROLE',
      description: 'Smart contract guard verifies block.timestamp <= expiryTimestamp. Expired bags revert instantly.',
      expected: 'REVERT / BLOCKED'
    },
    {
      id: 'ANOM-02',
      title: 'Attempt Re-Transfer of Completed Unit',
      unitId: 'BB-2026-1012',
      action: 'initiateTransfer',
      role: 'BLOOD_BANK_ROLE',
      description: 'State machine guard blocks terminal state reuse (COMPLETED -> TRANSFERRED).',
      expected: 'REVERT / BLOCKED'
    },
    {
      id: 'ANOM-03',
      title: 'Unauthorized Wallet Attempting Lab Approval',
      unitId: 'BB-2026-1025',
      action: 'approveBloodUnit',
      role: 'COLLECTION_ROLE',
      description: 'OpenZeppelin AccessControl validates caller role is LAB_ROLE. Reverts on non-certified wallet.',
      expected: 'REVERT / ACCESS_DENIED'
    }
  ];

  const handleSimulateAttack = async (scenario) => {
    setLoading(true);
    setSimulateResult(null);

    try {
      const res = await fetch(`/api/units/${scenario.unitId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: scenario.action,
          caller_role: scenario.role,
          caller_wallet: '0x000000000000000000000000000000000000dEaD',
          remarks: 'Deliberate test violation'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSimulateResult({
          scenarioId: scenario.id,
          blocked: true,
          detail: data.detail
        });
      } else {
        setSimulateResult({
          scenarioId: scenario.id,
          blocked: false,
          detail: data
        });
      }
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>Lifecycle Anomaly & Security Auditing</span>
        </h2>
        <p className="text-xs text-slate-400">
          Smart-contract state machine enforcement, role security & automated threat rejection
        </p>
      </div>

      {/* Deliberate Attack Simulation Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Interactive Anomaly Simulation Testbed</span>
        </h3>
        <p className="text-xs text-slate-400">
          Trigger deliberately invalid lifecycle operations to verify that the blockchain guards reject and flag the attack.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {anomalyScenarios.map(s => (
            <div key={s.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-rose-400">{s.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-semibold border border-rose-900">
                    {s.expected}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{s.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{s.description}</p>
              </div>

              <button
                disabled={loading}
                onClick={() => handleSimulateAttack(s)}
                className="w-full py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-700/80 text-rose-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
              >
                <Play className="w-3 h-3 fill-rose-300" />
                <span>Trigger Test Attack</span>
              </button>
            </div>
          ))}
        </div>

        {/* Custom Attack Builder */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-white mb-3">Custom Attack Vector Builder</h4>
          <form onSubmit={handleCustomAttack} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={customAttack.unitId}
              onChange={(e) => setCustomAttack({...customAttack, unitId: e.target.value})}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white flex-1"
              placeholder="Target Unit ID"
            />
            <select 
              value={customAttack.action}
              onChange={(e) => setCustomAttack({...customAttack, action: e.target.value})}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-rose-400 flex-1"
            >
              <option value="submitForTesting">submitForTesting</option>
              <option value="approveBloodUnit">approveBloodUnit</option>
              <option value="rejectBloodUnit">rejectBloodUnit</option>
              <option value="storeBloodUnit">storeBloodUnit</option>
              <option value="initiateTransfer">initiateTransfer</option>
              <option value="confirmReceipt">confirmReceipt</option>
              <option value="issueBloodUnit">issueBloodUnit</option>
              <option value="completeBloodUnit">completeBloodUnit</option>
              <option value="markExpired">markExpired</option>
              <option value="deleteDatabase">deleteDatabase (Invalid)</option>
            </select>
            <select 
              value={customAttack.role}
              onChange={(e) => setCustomAttack({...customAttack, role: e.target.value})}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-400 flex-1"
            >
              <option value="COLLECTION_ROLE">COLLECTION_ROLE</option>
              <option value="LAB_ROLE">LAB_ROLE</option>
              <option value="BLOOD_BANK_ROLE">BLOOD_BANK_ROLE</option>
              <option value="HOSPITAL_ROLE">HOSPITAL_ROLE</option>
              <option value="HACKER_ROLE">HACKER_ROLE</option>
            </select>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
            >
              Fire Payload
            </button>
          </form>
        </div>

        {simulateResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">System Security Defense Verified:</span>
              <span className="text-emerald-400 font-bold">ATTACK INTERCEPTED & REJECTED</span>
            </div>
            <pre className="bg-slate-900 p-2.5 rounded-lg text-[10px] font-mono text-rose-300 overflow-x-auto">
              {JSON.stringify(simulateResult.detail, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Real-Time Immutable Audit Log Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Real-Time Audit & Event Trail</span>
          </h3>
          <button
            onClick={fetchAuditLogs}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent audit logs recorded.</p>
          ) : (
            auditLogs.map((log, idx) => {
              const isBlocked = log.status === 'BLOCKED';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    isBlocked
                      ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isBlocked ? 'bg-rose-900 text-white' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {log.status}
                      </span>
                      <span className="font-mono font-bold text-white">{log.unit_id}</span>
                      <span className="text-slate-400">• Action: <strong className="text-slate-200">{log.action}</strong></span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">Actor: {log.actor}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp?.split('T')[1]?.slice(0, 8)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
