import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, AlertTriangle, ShieldCheck, Droplet, RefreshCw } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/inventory');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" />
        <p className="text-xs">Loading real-time inventory metrics...</p>
      </div>
    );
  }

  const groupChartData = Object.entries(data.by_blood_group).map(([group, count]) => ({
    group,
    count
  }));

  const pieData = [
    { name: 'Safe (>7 days)', value: data.shelf_life_distribution.safe, color: '#10b981' },
    { name: 'Expiring Soon (≤7d)', value: data.shelf_life_distribution.expiring_soon_7d, color: '#f59e0b' },
    { name: 'Expired / Wasted', value: data.shelf_life_distribution.expired, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-500" />
            <span>Supply Chain & Inventory Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Adapted from SQL Server BI reporting schema (stock availability, shelf-life alerts & wastage)
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-slate-400 block mb-1">Total Monitored Units</span>
          <div className="text-2xl font-bold text-white">{data.total_units}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active on Sepolia Ledger</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-emerald-400 block mb-1">Safe Ready Stock</span>
          <div className="text-2xl font-bold text-emerald-400">{data.shelf_life_distribution.safe}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Passed all 5 serology tests</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-amber-400 block mb-1">Expiring Soon (≤ 7 Days)</span>
          <div className="text-2xl font-bold text-amber-400">{data.shelf_life_distribution.expiring_soon_7d}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Priority allocation needed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-rose-400 block mb-1">Expired / Wastage Blocked</span>
          <div className="text-2xl font-bold text-rose-400">{data.shelf_life_distribution.expired}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Contract prevents issuance</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Group Availability Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Stock Availability by Blood Group</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupChartData}>
                <XAxis dataKey="group" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelf Life Distribution Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4">Shelf-Life Risk Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-xs mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-slate-400">{item.name}: <strong className="text-white">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
