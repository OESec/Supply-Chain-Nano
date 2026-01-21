import React, { useState, useEffect, useRef } from 'react';
import { Vendor, RiskLevel } from '../types';
import { ZoomIn, ZoomOut, X, Globe, Shield, TrendingUp, Layers, FileText, AlertTriangle, Network, Map as MapIcon, ChevronLeft, Activity, Check, Link as LinkIcon, Lock } from 'lucide-react';

interface SupplyChainMapProps {
  vendors: Vendor[];
}

type MapViewMode = 'relational' | 'world';
type RiskCategory = 'cyber' | 'financial' | 'geopolitical' | null;

const SupplyChainMap: React.FC<SupplyChainMapProps> = ({ vendors }) => {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<MapViewMode>('relational');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [displayVendor, setDisplayVendor] = useState<Vendor | null>(null); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<RiskCategory>(null);

  const isProfileOpenRef = useRef(isProfileOpen);
  useEffect(() => {
    isProfileOpenRef.current = isProfileOpen;
  }, [isProfileOpen]);

  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const centerX = 400;
  const centerY = 300;
  const radius = 200;

  /**
   * Geographic mapping helper.
   * Maps Latitude/Longitude to 800x600 SVG space using Equirectangular projection.
   * Map covers 800x400 (2:1 aspect ratio), vertically centered with 100px padding top/bottom.
   */
  const getGeoPosition = (location: string): { x: number, y: number } => {
    const loc = location.toLowerCase();
    let lat = 0;
    let lon = 0;

    // Approximate Coordinates for Demo
    if (loc.includes('austin')) { lat = 30.26; lon = -97.74; }
    else if (loc.includes('hamburg')) { lat = 53.55; lon = 9.99; }
    else if (loc.includes('kinshasa')) { lat = -4.44; lon = 15.26; }
    else if (loc.includes('taipei')) { lat = 25.03; lon = 121.56; }
    else if (loc.includes('taiwan')) { lat = 23.69; lon = 120.96; }
    else if (loc.includes('germany')) { lat = 51.16; lon = 10.45; }
    else if (loc.includes('drc') || loc.includes('congo')) { lat = -4.03; lon = 21.75; }
    else if (loc.includes('usa')) { lat = 37.09; lon = -95.71; }
    else if (loc.includes('london')) { lat = 51.50; lon = -0.12; }
    else if (loc.includes('tokyo')) { lat = 35.67; lon = 139.65; }
    else if (loc.includes('shenzhen')) { lat = 22.54; lon = 114.05; }
    else if (loc.includes('china')) { lat = 35.86; lon = 104.19; }

    // Equirectangular Projection
    // x: -180 to 180 -> 0 to 800
    // y: 90 to -90 -> 0 to 400 (plus 100 offset)
    
    const mapWidth = 800;
    const mapHeight = 400;
    const yOffset = 100;

    const x = (lon + 180) * (mapWidth / 360);
    const y = ((90 - lat) * (mapHeight / 180)) + yOffset;

    return { x, y };
  };

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

  useEffect(() => {
    if (selectedVendor) {
      setDisplayVendor(selectedVendor);
      setActiveCategory(null); // Reset detail view when vendor changes
    }
  }, [selectedVendor]);

  const getNodeColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW: return '#22c55e';
      case RiskLevel.MEDIUM: return '#eab308';
      case RiskLevel.HIGH: return '#f97316';
      case RiskLevel.CRITICAL: return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const closeSidebar = () => {
    setSelectedVendor(null);
    setIsProfileOpen(false);
  };

  const toggleCategory = (category: RiskCategory) => {
    setActiveCategory(prev => prev === category ? null : category);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    if (viewMode === 'world') return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(id);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (draggingId && dragStartRef.current && viewMode === 'relational') {
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

  const handleNodeMouseEnter = (vendor: Vendor) => {
    if (draggingId) return;
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
    if (!draggingId && !isProfileOpenRef.current) {
        closeTimeoutRef.current = setTimeout(() => {
            if (!isProfileOpenRef.current) {
                setSelectedVendor(null);
            }
        }, 400); 
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
        if (!isProfileOpenRef.current) {
            setSelectedVendor(null);
        }
    }, 400);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Supply Chain Map</h1>
          <p className="text-gray-500 dark:text-slate-400">Visualising supplier dependencies and risk nodes.</p>
        </div>
        
        <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
            <button 
                onClick={() => setViewMode('relational')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'relational' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
                <Network className="w-4 h-4" />
                <span>Relational</span>
            </button>
            <button 
                onClick={() => setViewMode('world')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'world' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
                <MapIcon className="w-4 h-4" />
                <span>World Map</span>
            </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 relative overflow-hidden flex">
        <div 
            className="flex-1 relative bg-slate-50 dark:bg-slate-950 cursor-move"
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onMouseLeave={handleStageMouseUp}
        >
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
            <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))} className="p-2 bg-white dark:bg-slate-800 shadow rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <ZoomIn className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            </button>
            <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} className="p-2 bg-white dark:bg-slate-800 shadow rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <ZoomOut className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            </button>
          </div>
          
          <div className="w-full h-full flex items-center justify-center overflow-hidden bg-sky-50 dark:bg-slate-900/50">
            <svg 
              width="800" 
              height="600" 
              viewBox="0 0 800 600" 
              className="transition-transform duration-200 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                     <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-300 dark:fill-slate-600" />
                   </marker>
                   <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                     <feOffset dx="0" dy="2" result="offsetblur" />
                     <feComponentTransfer>
                       <feFuncA type="linear" slope="0.1" />
                     </feComponentTransfer>
                     <feMerge>
                       <feMergeNode />
                       <feMergeNode in="SourceGraphic" />
                     </feMerge>
                   </filter>
                </defs>

                {/* --- PROFESSIONAL WORLD MAP VISUALIZATION --- */}
                {viewMode === 'world' && (
                  <>
                    <rect width="800" height="600" className="fill-sky-50 dark:fill-slate-900" />
                    
                    {/* Map Container Group: Vertically centered (y=100) */}
                    <g transform="translate(0, 100)">
                        {/* High-Fidelity Vector Map (Equirectangular) */}
                        <g className="fill-slate-300 dark:fill-slate-700 stroke-white dark:stroke-slate-800" strokeWidth="0.5">
                             {/* North America */}
                             <path d="M50 80 L70 60 L100 55 L150 45 L200 45 L250 40 L260 70 L240 90 L220 110 L190 120 L180 150 L160 180 L140 160 L120 120 L80 110 Z" />
                             <path d="M120 50 L140 40 L160 45 L150 60 L130 60 Z" /> {/* Greenland-ish */}
                             
                             {/* South America */}
                             <path d="M190 185 L220 190 L240 220 L230 270 L210 300 L190 290 L180 250 L170 210 Z" />
                             
                             {/* Europe */}
                             <path d="M350 110 L370 90 L400 90 L420 85 L440 85 L430 110 L410 120 L390 120 L370 115 Z" />
                             <path d="M340 100 L350 95 L355 105 L345 110 Z" /> {/* UK */}

                             {/* Africa */}
                             <path d="M350 130 L400 130 L420 150 L430 190 L410 240 L380 250 L360 230 L350 190 L340 160 Z" />
                             <path d="M440 210 L450 210 L450 230 L440 220 Z" /> {/* Madagascar */}

                             {/* Asia */}
                             <path d="M430 110 L450 80 L500 70 L600 75 L650 80 L680 100 L660 140 L620 160 L580 180 L540 160 L500 150 L460 130 Z" />
                             <path d="M680 120 L690 115 L695 125 L685 130 Z" /> {/* Japan */}

                             {/* SE Asia Islands */}
                             <path d="M580 200 L610 190 L630 210 L600 220 Z" />
                             <path d="M640 210 L650 210 L650 220 L640 220 Z" />

                             {/* Australia */}
                             <path d="M600 250 L650 250 L660 290 L630 310 L600 290 Z" />
                             <path d="M680 320 L700 330 L690 340 Z" /> {/* NZ */}
                             
                             {/* Antarctica */}
                             <path d="M150 380 L650 380 L620 370 L500 360 L300 360 L180 370 Z" className="fill-slate-200 dark:fill-slate-800" />
                        </g>

                        {/* Grid Lines Overlay */}
                        <g className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3">
                            {[0, 100, 200, 300, 400].map((y, i) => (
                               <line key={`lat-${i}`} x1="0" y1={y} x2="800" y2={y} />
                            ))}
                            {[0, 200, 400, 600, 800].map((x, i) => (
                               <line key={`lon-${i}`} x1={x} y1="0" x2={x} y2="400" />
                            ))}
                        </g>
                        
                         {/* Prime Meridian & Equator Highlights */}
                        <line x1="400" y1="0" x2="400" y2="400" className="stroke-slate-500" strokeWidth="1" opacity="0.4" />
                        <line x1="0" y1="200" x2="800" y2="200" className="stroke-slate-500" strokeWidth="1" opacity="0.4" />
                    </g>
                  </>
                )}

                {/* Relational View Logic */}
                {viewMode === 'relational' && vendors.map((vendor) => {
                    const pos = positions[vendor.id];
                    if (!pos) return null;
                    return (
                        <line 
                            key={`link-${vendor.id}`}
                            x1={centerX} y1={centerY}
                            x2={pos.x} y2={pos.y}
                            className="stroke-slate-300 dark:stroke-slate-600"
                            strokeWidth="2"
                            strokeDasharray={vendor.integrationStatus === 'Manual' ? "5,5" : "0"}
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}

                {viewMode === 'relational' && (
                    <g filter="url(#shadow)">
                        <circle cx={centerX} cy={centerY} r={32} fill="#4f46e5" />
                        <text x={centerX} y={centerY} dy="5" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">HQ</text>
                    </g>
                )}

                {/* Vendor Plotting */}
                {vendors.map((vendor) => {
                    const pos = viewMode === 'world' ? getGeoPosition(vendor.location) : positions[vendor.id];
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
                            style={{ cursor: (draggingId === vendor.id && viewMode === 'relational') ? 'grabbing' : 'pointer' }}
                        >
                            {isHighRisk && (
                                <circle cx={pos.x} cy={pos.y} r="20" fill={getNodeColor(vendor.riskProfile.level)} opacity="0.3">
                                    <animate attributeName="r" values="20;32;20" dur="2.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite" />
                                </circle>
                            )}

                            <circle 
                                cx={pos.x} cy={pos.y} 
                                r={isHovered ? 18 : 16} 
                                fill={getNodeColor(vendor.riskProfile.level)} 
                                stroke={isSelected ? '#1e293b' : 'white'}
                                strokeWidth={isSelected ? 4 : 2}
                                filter={isHovered ? "url(#shadow)" : "none"}
                                className="transition-all duration-300 ease-in-out"
                            />
                            
                            {isHighRisk && (
                                <circle cx={pos.x + 12} cy={pos.y - 12} r={7} fill="#ef4444" stroke="white" strokeWidth="2" />
                            )}
                            
                            <text 
                                x={pos.x} y={pos.y + 35} 
                                textAnchor="middle" 
                                fontSize={isHovered ? "13" : "12"} 
                                fontWeight={isHovered ? "700" : "600"}
                                className={`transition-all duration-300 select-none shadow-sm font-sans ${isHovered ? 'fill-slate-800 dark:fill-white' : 'fill-slate-600 dark:fill-slate-400'}`}
                            >
                                {vendor.name}
                            </text>

                            {isHovered && latestNote && (
                                <g>
                                    <rect 
                                        x={pos.x - 85} 
                                        y={pos.y + 45} 
                                        width="170" 
                                        height="24" 
                                        rx="12" 
                                        className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
                                        strokeWidth="1"
                                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                                    />
                                    <text x={pos.x} y={pos.y + 61} textAnchor="middle" fontSize="11" fontStyle="italic" className="select-none pointer-events-none fill-slate-500 dark:fill-slate-400">
                                        "{latestNote.content.length > 24 ? latestNote.content.substring(0, 24) + '...' : latestNote.content}"
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
          </div>

          {/* Feature Coming Soon Overlay - Only for World Map */}
          {viewMode === 'world' && (
            <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl text-center border border-gray-200 dark:border-slate-800 max-w-md mx-4 animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feature Coming Soon</h2>
                  <p className="text-gray-500 dark:text-slate-400">
                      We are currently upgrading our geospatial visualization engine to support real-time shipment tracking and advanced risk heatmaps.
                  </p>
               </div>
            </div>
          )}

        </div>

        {/* Sidebar Panel */}
        <div 
            className={`w-80 border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-xl transition-transform duration-300 transform ${selectedVendor && !isProfileOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
        >
             {displayVendor && (
                 <>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayVendor.name}</h2>
                        <button onClick={closeSidebar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">&times;</button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Location</span>
                            <p className="text-gray-800 dark:text-white font-medium">{displayVendor.location}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Risk Level</span>
                            <div className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-bold bg-${displayVendor.riskProfile.level === 'High' || displayVendor.riskProfile.level === 'Critical' ? 'red' : 'green'}-100 dark:bg-${displayVendor.riskProfile.level === 'High' || displayVendor.riskProfile.level === 'Critical' ? 'red' : 'green'}-900/30 text-${displayVendor.riskProfile.level === 'High' || displayVendor.riskProfile.level === 'Critical' ? 'red' : 'green'}-800 dark:text-${displayVendor.riskProfile.level === 'High' || displayVendor.riskProfile.level === 'Critical' ? 'red' : 'green'}-300`}>
                                {displayVendor.riskProfile.level}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Key Factors</span>
                            <ul className="mt-2 space-y-1">
                                {displayVendor.riskProfile.keyFactors.map((factor, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 dark:text-slate-400 flex items-start">
                                        <span className="mr-2 text-indigo-500">•</span>
                                        <span className="flex-1">{factor.text}</span>
                                        {factor.sourceUrl && (
                                            <a href={factor.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300" title={factor.sourceUrl}>
                                                <LinkIcon className="w-3 h-3" />
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button onClick={() => setIsProfileOpen(true)} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
                                View Full Profile
                            </button>
                        </div>
                    </div>
                 </>
             )}
        </div>
      </div>

       {/* Full Detail Modal */}
       {selectedVendor && isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] ring-1 ring-slate-900/5 dark:ring-white/10">
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
                            {selectedVendor.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.name}</h2>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400">
                                 <span>{selectedVendor.industry}</span>
                                 <span>•</span>
                                 <Globe className="w-3 h-3" />
                                 <span>{selectedVendor.location}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={closeSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* Reusing the VendorList modal content essentially, but simplified for Map view */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase">Overall Risk Score</p>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.overall}</span>
                                <span className="text-sm text-gray-400 dark:text-slate-500">/100</span>
                            </div>
                        </div>
                         <div className={`px-4 py-2 rounded-lg border ${
                            selectedVendor.riskProfile.level === RiskLevel.LOW ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                            selectedVendor.riskProfile.level === RiskLevel.MEDIUM ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' :
                            selectedVendor.riskProfile.level === RiskLevel.HIGH ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
                            'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                        }`}>
                            <span className="font-bold text-lg">{selectedVendor.riskProfile.level} Risk</span>
                        </div>
                    </div>

                    {/* Basic Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl text-center bg-gray-50/50 dark:bg-slate-800/50">
                            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-500 dark:text-blue-400" />
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.cyberScore}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">Cyber Security</div>
                         </div>
                         <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl text-center bg-gray-50/50 dark:bg-slate-800/50">
                            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500 dark:text-green-400" />
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.financialScore}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">Financial Health</div>
                         </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                             <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Company Description</h3>
                             <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{selectedVendor.description}</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 rounded-b-2xl flex justify-between items-center">
                    <span className="text-xs text-gray-400 dark:text-slate-500">Last updated: {new Date(selectedVendor.riskProfile.lastUpdated).toLocaleDateString()}</span>
                    <button onClick={closeSidebar} className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
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