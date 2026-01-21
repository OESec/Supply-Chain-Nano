
import React from 'react';
import { Vendor, RiskLevel, Alert } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import InfoTooltip from './InfoTooltip';

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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Risk Overview</h1>
        <p className="text-gray-500 dark:text-slate-400">Real-time supply chain health monitoring.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                Total Vendors
                <InfoTooltip text="Total number of active vendors currently tracked." />
              </div>
              <h3 className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-2">{vendors.length}</h3>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Active monitoring</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                Avg Risk Score
                <InfoTooltip text="The mean risk score (0-100) calculated across all vendors." />
              </div>
              <h3 className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-2">{avgRiskScore}/100</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Across all tiers
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                Critical/High Risk
                <InfoTooltip text="Vendors with High (75+) or Critical (90+) risk scores requiring immediate action." />
              </div>
              <h3 className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-2">{highRiskCount}</h3>
            </div>
            <div className={`p-2 rounded-lg ${highRiskCount > 0 ? 'bg-red-50 dark:bg-red-500/20' : 'bg-gray-50 dark:bg-slate-800'}`}>
              <AlertTriangle className={`w-5 h-5 ${highRiskCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`} />
            </div>
          </div>
          <div className="mt-4 text-sm text-red-600 dark:text-red-400 font-medium">
            {highRiskCount > 0 ? 'Requires attention' : 'All clear'}
          </div>
        </div>

         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                Active Alerts
                <InfoTooltip text="Unresolved disruption warnings predicted by the AI model." />
              </div>
              <h3 className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-2">{alerts.filter(a => !a.isRead).length}</h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
           <Link to="/alerts" className="mt-4 block text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
            View all alerts &rarr;
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Risk Distribution</h3>
            <InfoTooltip text="Breakdown of vendors by their calculated risk severity." />
          </div>
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
                  stroke="none"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: '#f1f5f9'
                  }} 
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Supply Chain Tiers</h3>
            <InfoTooltip text="Categorization by supply chain depth (Tier 1 = Direct Supplier)." />
          </div>
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
                  stroke="none"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: '#f1f5f9'
                  }} 
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Avg Health Factors</h3>
            <InfoTooltip text="Average scores for specific risk domains across the portfolio." />
          </div>
           <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    border: '1px solid #334155', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: '#f1f5f9'
                  }} 
                />
                <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
           <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">Score: Higher is Better</p>
        </div>
      </div>

      {/* Priority Watchlist (Top Risky Vendors) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Priority Watchlist</h3>
            </div>
            <Link to="/vendors" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-slate-400">
                <thead className="bg-gray-50 dark:bg-slate-950 text-xs uppercase font-medium text-gray-500 dark:text-slate-500">
                    <tr>
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-6 py-3">Location</th>
                        <th className="px-6 py-3">Tier</th>
                        <th className="px-6 py-3">Risk Score</th>
                        <th className="px-6 py-3">Risk Level</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {vendors
                        .filter(vendor => vendor.riskProfile.level === RiskLevel.HIGH || vendor.riskProfile.level === RiskLevel.CRITICAL)
                        .sort((a,b) => b.riskProfile.overall - a.riskProfile.overall)
                        .slice(0, 5) // Top 5 high-risk
                        .map(vendor => (
                        <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                        {vendor.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <span>{vendor.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{vendor.location}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                                    vendor.tier === 1 ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                    vendor.tier === 2 ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                                    'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}>
                                    Tier {vendor.tier}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center">
                                    <span className="font-bold mr-2 w-6 text-gray-900 dark:text-white">{vendor.riskProfile.overall}</span>
                                    <div className="w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                                     vendor.riskProfile.level === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                     vendor.riskProfile.level === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                     vendor.riskProfile.level === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                     'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                 }`}>
                                    {vendor.riskProfile.level}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {vendors.filter(v => v.riskProfile.level === RiskLevel.HIGH || v.riskProfile.level === RiskLevel.CRITICAL).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-slate-500 italic">
                          No high-risk vendors identified.
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
