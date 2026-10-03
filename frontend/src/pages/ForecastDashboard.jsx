import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ForecastDashboard() {
  const [forecast, setForecast] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('O+');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forecast')
      .then(res => res.json())
      .then(data => setForecast(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !forecast) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-red-500 mb-2" />
        <p className="text-xs">Loading machine learning demand forecast...</p>
      </div>
    );
  }

  const { metrics, forecast_7_days, forecast_14_days } = forecast;
  const groups = Object.keys(forecast_7_days);
  const chartData = forecast_14_days[selectedGroup]?.daily_breakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Intelligent Demand Forecasting (7 & 14 Days)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Predictive decision-support trained on 180 days of historical multi-hospital request patterns
          </p>
        </div>

        {/* Blood Group Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Select Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-red-400 focus:outline-none focus:border-red-500"
          >
            {groups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Model Performance & Evaluation Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Model Evaluation Metrics ({metrics.model_type})
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">R² Score (Fit)</span>
            <span className="text-emerald-400 font-bold text-base">{metrics.R2}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Mean Absolute Error</span>
            <span className="text-slate-200 font-bold text-base">{metrics.MAE} units</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Root Mean Squared Error</span>
            <span className="text-slate-200 font-bold text-base">{metrics.RMSE} units</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Training / Test Split</span>
            <span className="text-indigo-400 font-bold text-base">{metrics.training_samples} / {metrics.testing_samples}</span>
          </div>
        </div>
      </div>

      {/* 7-Day & 14-Day Summaries Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {groups.map(bg => {
          const isSelected = bg === selectedGroup;
          return (
            <div
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-black text-sm text-red-400">{bg}</div>
              <div className="text-[10px] text-slate-500 mt-1">7d Req:</div>
              <div className="font-bold text-xs text-white">{forecast_7_days[bg]?.total_estimated_units}u</div>
              <div className="text-[10px] text-slate-500 mt-1">14d Req:</div>
              <div className="font-medium text-xs text-indigo-300">{forecast_14_days[bg]?.total_estimated_units}u</div>
            </div>
          );
        })}
      </div>

      {/* Daily Forecast Projection Curve */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">
            14-Day Predicted Daily Requirement: <span className="text-red-400 font-black">{selectedGroup}</span>
          </h3>
          <span className="text-xs text-slate-400">
            Avg: <strong className="text-white">{forecast_14_days[selectedGroup]?.daily_average} units/day</strong>
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="predicted_units"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
                name="Units Required"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
