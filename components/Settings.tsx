
import React from 'react';
import { ToggleLeft, ToggleRight, Database, Server, Lock, Trash2, RotateCcw } from 'lucide-react';

const Settings: React.FC = () => {
  const [erpConnected, setErpConnected] = React.useState(false);

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data to default? This will clear all manually added vendors and alerts.")) {
      localStorage.removeItem('riskguard_vendors');
      localStorage.removeItem('riskguard_alerts');
      window.location.reload();
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-slate-400">Manage your workspace and integrations.</p>
      </div>

      {/* Integration Mode */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Database className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Data Integrations
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Connect your ERP or Procurement systems for automated vendor updates.
            </p>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">ERP Connector (SAP/Oracle)</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Automatically sync vendor master data.</p>
                </div>
                <button onClick={() => setErpConnected(!erpConnected)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                    {erpConnected ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-slate-600" />}
                </button>
            </div>

            <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Financial API (Bloomberg/D&B)</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Real-time credit scoring. (Enterprise Plan only)</p>
                </div>
                <Lock className="w-5 h-5 text-gray-400 dark:text-slate-500" />
            </div>
        </div>
      </section>

      {/* AI Configuration */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Server className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                AI Configuration
            </h2>
        </div>
        <div className="p-6">
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Google Gemini API Key</label>
                <div className="flex space-x-2">
                    <input type="password" value="************************" disabled className="flex-1 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400" />
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white">Update</button>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                    Used for risk scoring and disruption prediction models.
                </p>
            </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden">
        <div className="p-6 border-b border-red-50 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Data Management
            </h2>
        </div>
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Reset Demo Data</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Clear local storage and restore original mock data.</p>
                </div>
                <button 
                  onClick={handleResetData}
                  className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Data
                </button>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
