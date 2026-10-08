import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, QrCode, Scan } from 'lucide-react';

export default function QRModal({ unit, isOpen, onClose, onSearchUnit }) {
  const [copied, setCopied] = useState(false);
  const [scanInput, setScanInput] = useState('');

  if (!isOpen || !unit) return null;

  const qrData = `🩸 BloodChain Passport
ID: ${unit.blood_unit_id}
Type: ${unit.blood_group} (${unit.component_type})
Expiry: ${unit.expiry_date_str}
Net: Ethereum Sepolia
Hash: ${unit.metadata_hash}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateScan = (e) => {
    e.preventDefault();
    if (scanInput.trim()) {
      onSearchUnit(scanInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-400 mb-3">
            <QrCode className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Physical Bag QR Passport</h3>
          <p className="text-xs text-slate-400 mt-1">
            Attaches to physical blood unit <strong className="text-red-400">{unit.blood_unit_id}</strong>
          </p>
        </div>

        {/* QR Code Canvas */}
        <div className="bg-white p-4 rounded-xl flex items-center justify-center mx-auto w-64 h-64 shadow-inner mb-5">
          <QRCodeSVG
            value={qrData}
            size={220}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* Bag Information Chips */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4">
          <div>
            <span className="text-slate-500 block">Blood Group:</span>
            <span className="font-bold text-red-400">{unit.blood_group} ({unit.component_type})</span>
          </div>
          <div>
            <span className="text-slate-500 block">Expiry Date:</span>
            <span className="font-semibold text-slate-200">{unit.expiry_date_str}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block">Metadata Integrity Hash:</span>
            <span className="font-mono text-[10px] text-emerald-400 truncate block">{unit.metadata_hash}</span>
          </div>
        </div>

        {/* Copy QR Payload Button */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all mb-4"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'QR Payload Copied to Clipboard!' : 'Copy Verification Payload'}</span>
        </button>

        {/* Quick QR Scanner Simulator Form */}
        <form onSubmit={handleSimulateScan} className="border-t border-slate-800 pt-4">
          <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center space-x-1">
            <Scan className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Scanning Another Bag QR:</span>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. BB-2026-1015"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500 flex-1 font-mono"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
            >
              Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
