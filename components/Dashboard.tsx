import React from 'react';
import { Vendor, RiskLevel, Alert } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  vendors: Vendor[];
  alerts: Alert[];
}

const Dashboard: React.FC<DashboardProps> = ({ vendors, alerts }) => {
  const highRiskCount = vendors.filter(v => v.riskProfile.level === RiskLevel.HIGH || v.riskProfile.level === RiskLevel.CRITICAL).length;
  const avgRiskScore = Math.round(vendors.reduce((acc, v) => acc + v.riskProfile.overall, 0) / vendors.length) || 0;

  // Data for Risk Distribution Pie Chart
  const riskDistribution = [
    { name: 'Low', value: vendors.filter(v => v.riskProfile.level === RiskLevel.LOW).length, color: '#22c55e' },
    { name: 'Medium', value: vendors.filter(v => v.riskProfile.level === RiskLevel.MEDIUM).length, color: '#eab308' },
    { name: 'High', value: vendors.filter(v => v.riskProfile.level === RiskLevel.HIGH).length, color: '#f97316' },
    { name: 'Critical', value: vendors.filter(v => v.riskProfile.level === RiskLevel.CRITICAL).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Data for Tier Distribution Pie Chart
  const tierDistribution = [
    { name: 'Tier 1', value: vendors.filter(v => v.tier === 1).length, color: '#3b82f6' }, // Blue
    { name: 'Tier 2', value: vendors.filter(v => v.tier === 2).length, color: '#8b5cf6' }, // Violet
    { name: 'Tier 3', value: vendors.filter(v => v.tier === 3).length, color: '#64748b' }, // Slate
  ].filter(d => d.value > 0);

  // Data for Bar Chart (Risk Factors Average)
  const factorData = [
    {
      name: 'Cyber',
      score: Math.round(vendors.reduce((acc, v) => acc + v.riskProfile.cyberScore, 0) / vendors.length) || 0,
    },
    {
      name: 'Financial',
      score: Math.round(vendors.reduce((acc, v) => acc + v.riskProfile.financialScore, 0) / vendors.length) || 0,
    },
    {
      name: 'Geopolitical',
      score: Math.round(vendors.reduce((acc, v) => acc + v.riskProfile.geopoliticalScore, 0) / vendors.length) || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Risk Overview</h1>
        <p className="text-gray-500">Real-time supply chain health monitoring.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Vendors</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{vendors.length}</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Active monitoring</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Risk Score</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{avgRiskScore}/100</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Across all tiers
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Critical/High Risk</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{highRiskCount}</h3>
            </div>
            <div className={`p-2 rounded-lg ${highRiskCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <AlertTriangle className={`w-5 h-5 ${highRiskCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="mt-4 text-sm text-red-600 font-medium">
            {highRiskCount > 0 ? 'Requires attention' : 'All clear'}
          </div>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Alerts</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{alerts.filter(a => !a.isRead).length}</h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
           <Link to="/alerts" className="mt-4 block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all alerts &rarr;
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="40%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain Tiers</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="40%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Health Factors</h3>
           <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
           <p className="text-xs text-gray-400 mt-2 text-center">Score: Higher is Better</p>
        </div>
      </div>

      {/* Priority Watchlist (Top Risky Vendors) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Priority Watchlist</h3>
            </div>
            <Link to="/vendors" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                    <tr>
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-6 py-3">Location</th>
                        <th className="px-6 py-3">Tier</th>
                        <th className="px-6 py-3">Risk Score</th>
                        <th className="px-6 py-3">Risk Level</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {vendors
                        .sort((a,b) => b.riskProfile.overall - a.riskProfile.overall)
                        .slice(0, 5) // Top 5 risky
                        .map(vendor => (
                        <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                        {vendor.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <span>{vendor.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{vendor.location}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                    vendor.tier === 1 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    vendor.tier === 2 ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                    Tier {vendor.tier}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <span className="font-bold mr-2 w-6">{vendor.riskProfile.overall}</span>
                                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                vendor.riskProfile.overall > 75 ? 'bg-red-500' :
                                                vendor.riskProfile.overall > 50 ? 'bg-orange-500' :
                                                vendor.riskProfile.overall > 25 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} 
                                            style={{ width: `${vendor.riskProfile.overall}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                 <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                     vendor.riskProfile.level === 'Critical' ? 'bg-red-100 text-red-800' :
                                     vendor.riskProfile.level === 'High' ? 'bg-orange-100 text-orange-800' :
                                     vendor.riskProfile.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                     'bg-green-100 text-green-800'
                                 }`}>
                                    {vendor.riskProfile.level}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;