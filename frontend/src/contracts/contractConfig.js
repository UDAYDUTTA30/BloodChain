import BloodChainABI from './BloodChainABI.json';

// Default Sepolia Testnet config (replaceable by user in UI or .env)
export const SEPOLIA_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

export const CONTRACT_ADDRESS = "0xef04570cEf6d9ea4e7a9AfD42b32Bdc2399ED7A5"; // Deployed Sepolia contract

export const ROLES = {
  ADMIN: 'DEFAULT_ADMIN_ROLE',
  COLLECTION: 'COLLECTION_ROLE',
  LAB: 'LAB_ROLE',
  BLOOD_BANK: 'BLOOD_BANK_ROLE',
  HOSPITAL: 'HOSPITAL_ROLE',
  AUDITOR: 'AUDITOR_ROLE'
};

export const STATUS_LABELS = {
  0: 'CREATED',
  1: 'COLLECTED',
  2: 'TESTING',
  3: 'APPROVED',
  4: 'REJECTED',
  5: 'STORED',
  6: 'TRANSFERRED',
  7: 'RECEIVED',
  8: 'ISSUED',
  9: 'COMPLETED',
  10: 'EXPIRED'
};

export const STATUS_COLORS = {
  CREATED: 'bg-slate-800 text-slate-300 border-slate-700',
  COLLECTED: 'bg-blue-950 text-blue-300 border-blue-800',
  TESTING: 'bg-purple-950 text-purple-300 border-purple-800',
  APPROVED: 'bg-teal-950 text-teal-300 border-teal-800',
  REJECTED: 'bg-red-950 text-red-400 border-red-800',
  STORED: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  TRANSFERRED: 'bg-amber-950 text-amber-300 border-amber-800',
  RECEIVED: 'bg-cyan-950 text-cyan-300 border-cyan-800',
  ISSUED: 'bg-indigo-950 text-indigo-300 border-indigo-800',
  COMPLETED: 'bg-slate-900 text-slate-400 border-slate-700',
  EXPIRED: 'bg-rose-950 text-rose-400 border-rose-900'
};

export { BloodChainABI };
