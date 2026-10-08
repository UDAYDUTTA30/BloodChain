import React, { useState } from 'react';
import { FileCheck, ShieldAlert, ShieldCheck, Upload, Hash, RefreshCw } from 'lucide-react';

export default function DocumentVerifier({ currentUnit }) {
  const [docText, setDocText] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    if (!docText.trim() || !currentUnit) return;
    setVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: currentUnit.blood_unit_id,
          document_text: docText
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const loadOriginalTemplate = () => {
    if (!currentUnit) return;
    // The original metadata hash was created using the registration facility. 
    // If the unit moved, current_facility might be the hospital, so we grab the first holder.
    const originalFacility = currentUnit.custody_timeline?.[0]?.holder || currentUnit.current_facility || 'Blood Bank';
    const template = `${currentUnit.blood_unit_id}|${currentUnit.blood_group}|${currentUnit.component_type}|${currentUnit.collection_date_str}|${originalFacility}`;
    setDocText(template);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">SHA-256 Document Integrity Verifier</h3>
            <p className="text-xs text-slate-400">Verify off-chain lab certificate against on-chain metadata hash</p>
          </div>
        </div>

        {currentUnit && (
          <button
            onClick={loadOriginalTemplate}
            className="text-xs text-red-400 hover:text-red-300 underline font-medium"
          >
            Load Authentic Record Template
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Document Content / Medical Report Payload:
        </label>
        <textarea
          rows={3}
          value={docText}
          onChange={(e) => setDocText(e.target.value)}
          placeholder="Paste lab screening report text or structured certificate data..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Target Unit: <strong className="text-white font-mono">{currentUnit?.blood_unit_id || 'None selected'}</strong>
        </span>

        <button
          disabled={verifying || !docText.trim()}
          onClick={handleVerify}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
        >
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
          <span>Verify Cryptographic Hash</span>
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
          result.is_tamper_free
            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            : 'bg-rose-950/40 border-rose-800 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2 font-bold text-sm">
            {result.is_tamper_free ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>INTEGRITY CONFIRMED: MATCHES ON-CHAIN HASH</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>TAMPER DETECTED: HASH MISMATCH!</span>
              </>
            )}
          </div>

          <div className="font-mono text-[11px] space-y-1">
            <p className="truncate">Calculated SHA-256: <span className="text-white">{result.calculated_sha256}</span></p>
            <p className="truncate">On-Chain Hash: <span className="text-white">{result.on_chain_metadata_hash}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
