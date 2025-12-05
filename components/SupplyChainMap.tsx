import React, { useState, useEffect, useRef } from 'react';
import { Vendor, RiskLevel } from '../types';
import { ZoomIn, ZoomOut, X, Globe, Shield, TrendingUp, Layers, FileText, AlertTriangle } from 'lucide-react';

interface SupplyChainMapProps {
  vendors: Vendor[];
}

const SupplyChainMap: React.FC<SupplyChainMapProps> = ({ vendors }) => {
  const [zoom, setZoom] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [displayVendor, setDisplayVendor] = useState<Vendor | null>(null); // For transition persist
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Fix: Use a ref to track profile open state for use inside setTimeout closures
  const isProfileOpenRef = useRef(isProfileOpen);
  useEffect(() => {
    isProfileOpenRef.current = isProfileOpen;
  }, [isProfileOpen]);

  // Dynamic Map State
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  // Initialize or update positions when vendors change
  useEffect(() => {
    setPositions((prev) => {
        const newPositions = { ...prev };
        let hasChanges = false;
        
        vendors.forEach((v, i) => {
            if (!newPositions[v.id]) {
                const angle = (i / vendors.length) * 2 * Math.PI - Math.PI / 2;
                newPositions[v.id] = {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle),
                };
                hasChanges = true;
            }
        });
        
        return hasChanges ? newPositions : prev;
    });
  }, [vendors]);

  // Update display vendor for transitions
  useEffect(() => {
    if (selectedVendor) {
      setDisplayVendor(selectedVendor);
    }
  }, [selectedVendor]);

  const getNodeColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW: return '#22c55e'; // Green
      case RiskLevel.MEDIUM: return '#eab308'; // Yellow
      case RiskLevel.HIGH: return '#f97316'; // Orange
      case RiskLevel.CRITICAL: return '#ef4444'; // Red
      default: return '#94a3b8';
    }
  };

  const closeSidebar = () => {
    setSelectedVendor(null);
    setIsProfileOpen(false);
  };

  // --- Drag Logic ---
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (draggingId && dragStartRef.current) {
        e.preventDefault();
        const dx = (e.clientX - dragStartRef.current.x) / zoom;
        const dy = (e.clientY - dragStartRef.current.y) / zoom;
        
        setPositions(prev => ({
            ...prev,
            [draggingId]: {
                x: prev[draggingId].x + dx,
                y: prev[draggingId].y + dy
            }
        }));
        
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleStageMouseUp = () => {
      setDraggingId(null);
      dragStartRef.current = null;
  };

  // --- Hover / Sidebar Logic ---
  const handleNodeMouseEnter = (vendor: Vendor) => {
    if (draggingId) return; // Ignore hover while dragging

    if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
    }

    setHoveredNode(vendor.id);
    if (!isProfileOpen) {
        setSelectedVendor(vendor);
    }
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    // Use the Ref to check if profile is open, ensuring we don't close if user just clicked "View Profile"
    if (!draggingId && !isProfileOpenRef.current) {
        closeTimeoutRef.current = setTimeout(() => {
            // Check Ref again inside timeout to handle race conditions
            if (!isProfileOpenRef.current) {
                setSelectedVendor(null);
            }
        }, 400); // 400ms grace period
    }
  };

  const handleSidebarMouseEnter = () => {
    if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
    }
  };

  const handleSidebarMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
        // Only close if the profile modal is NOT open
        if (!isProfileOpenRef.current) {
            setSelectedVendor(null);
        }
    }, 400);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Supply Chain Map</h1>
        <p className="text-gray-500">Visualising supplier dependencies and risk nodes.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 relative overflow-hidden flex">
        {/* Map Area */}
        <div 
            className="flex-1 relative bg-slate-50 cursor-move"
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onMouseLeave={handleStageMouseUp}
        >
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
            <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} className="p-2 bg-white shadow rounded hover:bg-gray-50">
                <ZoomIn className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))} className="p-2 bg-white shadow rounded hover:bg-gray-50">
                <ZoomOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <svg width="800" height="600" viewBox="0 0 800 600" style={{ transform: `scale(${zoom})`, transition: 'transform 0.1s linear' }}>
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                     <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                   </marker>
                </defs>

                {/* Connections */}
                {vendors.map((vendor) => {
                    const pos = positions[vendor.id];
                    if (!pos) return null;
                    return (
                        <line 
                            key={`link-${vendor.id}`}
                            x1={centerX} y1={centerY}
                            x2={pos.x} y2={pos.y}
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            strokeDasharray={vendor.integrationStatus === 'Manual' ? "5,5" : "0"}
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}

                {/* Central Node (My SME) */}
                <circle cx={centerX} cy={centerY} r={30} fill="#4f46e5" filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.2))" />
                <text x={centerX} y={centerY} dy="5" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">ME</text>

                {/* Vendor Nodes */}
                {vendors.map((vendor) => {
                    const pos = positions[vendor.id];
                    if (!pos) return null;

                    const isSelected = selectedVendor?.id === vendor.id;
                    const isHovered = hoveredNode === vendor.id;
                    const isHighRisk = vendor.riskProfile.level === RiskLevel.HIGH || vendor.riskProfile.level === RiskLevel.CRITICAL;
                    const latestNote = vendor.notes && vendor.notes.length > 0 ? vendor.notes[0] : null;
                    
                    return (
                        <g 
                            key={vendor.id} 
                            onClick={(e) => { 
                                e.stopPropagation();
                                setSelectedVendor(vendor); 
                                setIsProfileOpen(false); 
                            }}
                            onMouseDown={(e) => handleNodeMouseDown(e, vendor.id)}
                            onMouseEnter={() => handleNodeMouseEnter(vendor)}
                            onMouseLeave={handleNodeMouseLeave}
                            style={{ cursor: draggingId === vendor.id ? 'grabbing' : 'grab' }}
                        >
                            {/* Pulsing Aura for High Risk */}
                            {isHighRisk && (
                                <circle 
                                    cx={pos.x} cy={pos.y} r="20" 
                                    fill={getNodeColor(vendor.riskProfile.level)} 
                                    opacity="0.3"
                                >
                                    <animate attributeName="r" values="20;35;20" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                                </circle>
                            )}

                            {/* Main Node */}
                            <circle 
                                cx={pos.x} cy={pos.y} 
                                r={isHovered ? 25 : 20} 
                                fill={getNodeColor(vendor.riskProfile.level)} 
                                stroke={isSelected ? '#1e293b' : 'white'}
                                strokeWidth={isSelected ? 3 : 2}
                                className="transition-all duration-300 ease-in-out"
                            />
                            
                            {/* Alert indicator if High Risk (Fixed bubble) */}
                            {isHighRisk && (
                                <circle cx={pos.x + 15} cy={pos.y - 15} r={8} fill="#ef4444" stroke="white" strokeWidth="2" />
                            )}
                            
                            {/* 
                                Removed 'pointer-events-none' so hovering the text keeps the sidebar open.
                                This fixes the issue where moving cursor to the name would close the sidebar.
                            */}
                            <text 
                                x={pos.x} y={pos.y + 40} 
                                textAnchor="middle" 
                                fill={isHovered ? "#1e293b" : "#475569"} 
                                fontSize={isHovered ? "14" : "12"} 
                                fontWeight={isHovered ? "700" : "500"}
                                className="transition-all duration-300 select-none"
                            >
                                {vendor.name}
                            </text>

                            {/* Latest Note Snippet on Hover */}
                            {isHovered && latestNote && (
                                <g>
                                    <rect 
                                        x={pos.x - 75} 
                                        y={pos.y + 48} 
                                        width="150" 
                                        height="22" 
                                        rx="11" 
                                        fill="white" 
                                        stroke="#e2e8f0" 
                                        strokeWidth="1"
                                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))"
                                    />
                                    <text 
                                        x={pos.x} 
                                        y={pos.y + 63} 
                                        textAnchor="middle" 
                                        fill="#64748b" 
                                        fontSize="10"
                                        fontStyle="italic"
                                        className="select-none pointer-events-none"
                                    >
                                        "{latestNote.content.length > 22 ? latestNote.content.substring(0, 22) + '...' : latestNote.content}"
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
          </div>
        </div>

        {/* Details Sidebar overlay */}
        <div 
            className={`w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-xl transition-transform duration-300 transform ${selectedVendor && !isProfileOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
        >
             {displayVendor && (
                 <>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-900">{displayVendor.name}</h2>
                        <button onClick={closeSidebar} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Location</span>
                            <p className="text-gray-800 font-medium">{displayVendor.location}</p>
                        </div>

                        <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase">Risk Level</span>
                            <div className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-bold bg-${displayVendor.riskProfile.level === 'High' ? 'red' : 'green'}-100`}>
                                {displayVendor.riskProfile.level}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase">Key Factors</span>
                            <ul className="mt-2 space-y-1">
                                {displayVendor.riskProfile.keyFactors.map((factor, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                                        <span className="mr-2 text-indigo-500">•</span>
                                        {factor}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-4 border-t">
                            <button 
                                onClick={() => setIsProfileOpen(true)}
                                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                                View Full Profile
                            </button>
                        </div>
                    </div>
                 </>
             )}
        </div>
      </div>

       {/* Full Profile Modal (Reused Logic) */}
       {selectedVendor && isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                            {selectedVendor.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedVendor.name}</h2>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                 <span>{selectedVendor.industry}</span>
                                 <span>•</span>
                                 <Globe className="w-3 h-3" />
                                 <span>{selectedVendor.location}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={closeSidebar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* Risk Score Header */}
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Overall Risk Score</p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-bold text-gray-900">{selectedVendor.riskProfile.overall}</span>
                                <span className="text-sm text-gray-400">/100</span>
                            </div>
                        </div>
                         <div className={`px-4 py-2 rounded-lg border ${
                            selectedVendor.riskProfile.level === RiskLevel.LOW ? 'bg-green-100 text-green-800 border-green-200' :
                            selectedVendor.riskProfile.level === RiskLevel.MEDIUM ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            selectedVendor.riskProfile.level === RiskLevel.HIGH ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-red-100 text-red-800 border-red-200'
                        }`}>
                            <span className="font-bold text-lg">{selectedVendor.riskProfile.level} Risk</span>
                        </div>
                    </div>

                    {/* Detailed Scores Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                         <div className="p-4 border border-gray-100 rounded-xl text-center">
                            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                            <div className="text-2xl font-bold text-gray-900">{selectedVendor.riskProfile.cyberScore}</div>
                            <div className="text-xs text-gray-500">Cyber Security</div>
                         </div>
                         <div className="p-4 border border-gray-100 rounded-xl text-center">
                            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                            <div className="text-2xl font-bold text-gray-900">{selectedVendor.riskProfile.financialScore}</div>
                            <div className="text-xs text-gray-500">Financial Health</div>
                         </div>
                         <div className="p-4 border border-gray-100 rounded-xl text-center">
                            <Globe className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                            <div className="text-2xl font-bold text-gray-900">{selectedVendor.riskProfile.geopoliticalScore}</div>
                            <div className="text-xs text-gray-500">Geopolitical</div>
                         </div>
                         <div className="p-4 border border-gray-100 rounded-xl text-center">
                            <Layers className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
                            <div className="text-2xl font-bold text-gray-900">Tier {selectedVendor.tier}</div>
                            <div className="text-xs text-gray-500">Supply Chain</div>
                         </div>
                    </div>

                    {/* Analysis */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                                AI Risk Analysis
                            </h3>
                            <p className="text-gray-600 leading-relaxed bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                                {selectedVendor.riskProfile.summary}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Key Risk Factors</h3>
                            <div className="space-y-2">
                                {selectedVendor.riskProfile.keyFactors.map((factor, idx) => (
                                    <div key={idx} className="flex items-center text-sm text-gray-700">
                                        <AlertTriangle className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" />
                                        {factor}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                             <h3 className="font-semibold text-gray-900 mb-2">Company Description</h3>
                             <p className="text-sm text-gray-500">{selectedVendor.description}</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                    <span className="text-xs text-gray-400">Last updated: {new Date(selectedVendor.riskProfile.lastUpdated).toLocaleDateString()}</span>
                    <button 
                      onClick={closeSidebar}
                      className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SupplyChainMap;