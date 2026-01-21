
import React, { useState } from 'react';
import { Alert, Vendor } from '../types';
import { AlertTriangle, Info, CheckCircle, RefreshCcw, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { predictDisruptions } from '../services/geminiService';

interface AlertsProps {
  alerts: Alert[];
  vendors: Vendor[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
}

const Alerts: React.FC<AlertsProps> = ({ alerts, vendors, setAlerts }) => {
  const [analyzing, setAnalyzing] = useState(false);

  const handleScanForDisruptions = async () => {
    if (vendors.length === 0) return;
    setAnalyzing(true);
    const vendorList = vendors.map(v => ({ id: v.id, name: v.name, location: v.location }));
    
    // Safety timeout to prevent infinite UI hang
    const scanTimeout = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), 50000); 
    });
    
    try {
        const result: any = await Promise.race([
            predictDisruptions(vendorList),
            scanTimeout
        ]);

        if (result === 'timeout') {
            console.warn("Disruption scan timed out after 50s.");
        } else if (result && result.title) {
            const newAlert: Alert = {
                id: Date.now().toString(),
                title: result.title,
                severity: result.severity as any,
                date: new Date().toISOString(),
                relatedVendorIds: result.relatedVendorIds || [],
                description: result.description,
                isRead: false,
                sources: result.sources
            };
            setAlerts(prev => [newAlert, ...prev]);
        }
    } catch (e) {
        console.error("Disruption scan failed", e);
    } finally {
        setAnalyzing(false);
    }
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-orange-500 dark:text-orange-400" />;
      default: return <Info className="w-6 h-6 text-blue-500 dark:text-blue-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alert Centre</h1>
          <p className="text-gray-500 dark:text-slate-400">AI-predicted disruptions and monitoring notifications.</p>
          <div className="flex items-center mt-1 text-xs text-gray-400 dark:text-slate-500">
            <Info className="w-3 h-3 mr-1.5" />
            <span>Reports on real-world news stories from the last 7 days that impact these specific locations.</span>
          </div>
        </div>
        <button 
          onClick={handleScanForDisruptions}
          disabled={analyzing || vendors.length === 0}
          className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Scanning Live News...' : 'Scan for Disruptions'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Clear</h3>
                <p className="text-gray-500 dark:text-slate-400">No active threats detected in your supply chain.</p>
            </div>
        ) : (
            alerts.map(alert => (
            <div 
                key={alert.id} 
                className={`bg-white dark:bg-slate-900 rounded-xl p-6 border-l-4 shadow-sm transition-all ${
                    alert.isRead ? 'border-gray-200 dark:border-slate-800 opacity-75' : 
                    alert.severity === 'critical' ? 'border-red-500' : 
                    alert.severity === 'warning' ? 'border-orange-500' : 'border-blue-500'
                }`}
            >
                <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                    {getIcon(alert.severity)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className={`text-lg font-semibold ${alert.isRead ? 'text-gray-700 dark:text-slate-400' : 'text-gray-900 dark:text-white'}`}>
                            {alert.title}
                        </h3>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                            <span>{new Date(alert.date).toLocaleDateString()}</span>
                            {!alert.isRead && alert.sources && (
                              <span className="flex items-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded font-medium">
                                <LinkIcon className="w-3 h-3 mr-1" /> Grounded News
                              </span>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300 mt-2 text-sm leading-relaxed">{alert.description}</p>
                    
                    {/* Sources Section */}
                    {alert.sources && alert.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sources & References</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {alert.sources.map((source, idx) => (
                            <a 
                              key={idx} 
                              href={source.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline group truncate"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0 text-indigo-400 dark:text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                              <span className="truncate">{source.title || source.url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.relatedVendorIds.length > 0 && (
                        <div className="mt-3 flex items-center space-x-2 flex-wrap gap-2">
                            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase">Impacted:</span>
                            {alert.relatedVendorIds.map(id => (
                              <span key={id} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                                {vendors.find(v => v.id === id)?.name || 'Unknown Vendor'}
                              </span>
                            ))}
                        </div>
                    )}
                </div>
                {!alert.isRead && (
                    <button 
                        onClick={() => markAsRead(alert.id)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                        Dismiss
                    </button>
                )}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
