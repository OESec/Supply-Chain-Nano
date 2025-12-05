import React, { useState, useEffect } from 'react';
import { Vendor, RiskLevel, Note } from '../types';
import { Search, Plus, Loader2, Globe, Shield, FileText, X, AlertTriangle, TrendingUp, Layers, Trash2, Edit2, Save, StickyNote, ExternalLink, ArrowLeft, Check } from 'lucide-react';
import { analyzeVendorRisk } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VendorListProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
}

type ModalMode = 'view' | 'edit' | 'confirm_edit' | 'confirm_delete';

const VendorList: React.FC<VendorListProps> = ({ vendors, setVendors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmingAdd, setIsConfirmingAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Selected Vendor State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editFormData, setEditFormData] = useState<Partial<Vendor>>({});

  // Note State
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Add Form State
  const [newVendor, setNewVendor] = useState({
    name: '',
    industry: '',
    location: '',
    description: '',
    website: ''
  });

  // Reset modal mode when opening a vendor
  const openVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setModalMode('view');
    setEditFormData({});
  };

  const handleAddFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmingAdd(true);
  };

  const handleConfirmedAddVendor = async () => {
    setLoading(true);
    
    try {
      const riskProfile = await analyzeVendorRisk(
        newVendor.name, 
        newVendor.industry, 
        newVendor.location, 
        newVendor.description
      );

      const vendor: Vendor = {
        id: Date.now().toString(),
        name: newVendor.name,
        industry: newVendor.industry,
        location: newVendor.location,
        description: newVendor.description,
        website: newVendor.website,
        riskProfile,
        integrationStatus: 'Manual',
        tier: 1, // Default
        notes: [],
        riskHistory: [
          { date: new Date().toISOString().split('T')[0], score: riskProfile.overall }
        ]
      };

      setVendors(prev => [...prev, vendor]);
      setIsAdding(false);
      setIsConfirmingAdd(false);
      setNewVendor({ name: '', industry: '', location: '', description: '', website: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to analyze vendor risk. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  };

  // --- Edit & Delete Logic ---

  const initiateEdit = () => {
    if (selectedVendor) {
      setEditFormData({
        name: selectedVendor.name,
        industry: selectedVendor.industry,
        location: selectedVendor.location,
        website: selectedVendor.website || '',
        description: selectedVendor.description
      });
      setModalMode('edit');
    }
  };

  const submitEditForm = (e: React.FormEvent) => {
    e.preventDefault();
    setModalMode('confirm_edit');
  };

  const confirmEdit = () => {
    if (selectedVendor) {
      const updatedVendor = {
        ...selectedVendor,
        ...editFormData
      };
      // Persist changes
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? updatedVendor : v));
      setSelectedVendor(updatedVendor);
      setModalMode('view');
    }
  };

  const confirmDelete = () => {
    if (selectedVendor) {
      setVendors(prev => prev.filter(v => v.id !== selectedVendor.id));
      setSelectedVendor(null);
      setModalMode('view');
    }
  };

  // --- Note Logic ---

  const handleAddNote = () => {
    if (!selectedVendor || !newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      createdAt: new Date().toISOString()
    };

    const updatedVendor = {
      ...selectedVendor,
      notes: [note, ...selectedVendor.notes]
    };

    updateVendorInState(updatedVendor);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!selectedVendor) return;
    const updatedVendor = {
      ...selectedVendor,
      notes: selectedVendor.notes.filter(n => n.id !== noteId)
    };
    updateVendorInState(updatedVendor);
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const saveEditedNote = () => {
    if (!selectedVendor || !editingNoteId) return;

    const updatedVendor = {
      ...selectedVendor,
      notes: selectedVendor.notes.map(n => 
        n.id === editingNoteId 
          ? { ...n, content: editingNoteContent, updatedAt: new Date().toISOString() } 
          : n
      )
    };

    updateVendorInState(updatedVendor);
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const updateVendorInState = (updatedVendor: Vendor) => {
    setSelectedVendor(updatedVendor);
    setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
  };

  // Search Logic
  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(lowerSearchTerm) ||
    v.industry.toLowerCase().includes(lowerSearchTerm) ||
    v.location.toLowerCase().includes(lowerSearchTerm)
  );

  const getRiskBadgeColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW: return 'bg-green-100 text-green-800 border-green-200';
      case RiskLevel.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RiskLevel.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
      case RiskLevel.CRITICAL: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500">Monitor your third-party ecosystem.</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setIsConfirmingAdd(false); }}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, industry, or location..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                 <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {vendor.name.substring(0,2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900">{vendor.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-xs text-gray-500">{vendor.industry}</p>
                      <span className="text-gray-300">•</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          vendor.tier === 1 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          vendor.tier === 2 ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                          Tier {vendor.tier}
                      </span>
                    </div>
                 </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRiskBadgeColor(vendor.riskProfile.level)}`}>
                {vendor.riskProfile.level} Risk
              </span>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-start text-sm text-gray-600">
                <Globe className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                <span>{vendor.location}</span>
              </div>
              <div className="flex items-start text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                <span className="line-clamp-2">{vendor.riskProfile.summary}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="text-gray-400">Score: <span className="text-gray-900 font-semibold">{vendor.riskProfile.overall}/100</span></span>
                <button 
                  onClick={() => openVendorDetails(vendor)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  View Details
                </button>
            </div>
          </div>
        ))}
        
        {filteredVendors.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No vendors found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
             
             {!isConfirmingAdd ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Add New Vendor</h2>
                  <form onSubmit={handleAddFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} placeholder="e.g. Foxconn" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                          <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={newVendor.industry} onChange={e => setNewVendor({...newVendor, industry: e.target.value})} placeholder="e.g. Manufacturing" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input required type="text" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={newVendor.location} onChange={e => setNewVendor({...newVendor, location: e.target.value})} placeholder="e.g. Shenzhen, China" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                      <input type="url" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={newVendor.website} onChange={e => setNewVendor({...newVendor, website: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea required className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none h-24" 
                        value={newVendor.description} onChange={e => setNewVendor({...newVendor, description: e.target.value})} placeholder="Briefly describe what they supply..."></textarea>
                      <p className="text-xs text-gray-500 mt-1">Our AI will use this to assess initial risk.</p>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">
                        Review Details
                      </button>
                    </div>
                  </form>
                </>
             ) : (
                <div className="space-y-4">
                   <h2 className="text-xl font-bold mb-4">Confirm Vendor Details</h2>
                   <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-100">
                      <div>
                         <span className="text-xs font-semibold text-gray-500 uppercase">Company Name</span>
                         <p className="font-medium text-gray-900">{newVendor.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Industry</span>
                            <p className="font-medium text-gray-900">{newVendor.industry}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Location</span>
                            <p className="font-medium text-gray-900">{newVendor.location}</p>
                        </div>
                      </div>
                       {newVendor.website && (
                          <div>
                             <span className="text-xs font-semibold text-gray-500 uppercase">Website</span>
                             <p className="font-medium text-gray-900 truncate">{newVendor.website}</p>
                          </div>
                      )}
                      <div>
                         <span className="text-xs font-semibold text-gray-500 uppercase">Description</span>
                         <p className="text-sm text-gray-700">{newVendor.description}</p>
                      </div>
                   </div>
                   
                   <div className="bg-indigo-50 p-3 rounded-lg flex items-start">
                       <Shield className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                       <p className="text-sm text-indigo-800">
                          Clicking "Confirm" will send this data to our AI model for risk assessment. This may take a few seconds.
                       </p>
                   </div>

                   <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsConfirmingAdd(false)} 
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                        >
                            Back to Edit
                        </button>
                        <button 
                            onClick={handleConfirmedAddVendor} 
                            disabled={loading} 
                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                        >
                          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {loading ? 'Analysing Risk...' : 'Confirm & Analyse'}
                        </button>
                   </div>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Vendor Details / Edit / Delete Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* --- HEADER --- */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    {modalMode === 'view' && (
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
                    )}
                    {(modalMode === 'edit' || modalMode === 'confirm_edit') && (
                         <div className="flex items-center space-x-3">
                             <div className="p-2 bg-indigo-100 rounded-lg">
                                 <Edit2 className="w-6 h-6 text-indigo-600" />
                             </div>
                             <h2 className="text-xl font-bold text-gray-900">Edit Vendor</h2>
                         </div>
                    )}
                    {modalMode === 'confirm_delete' && (
                         <div className="flex items-center space-x-3">
                             <div className="p-2 bg-red-100 rounded-lg">
                                 <AlertTriangle className="w-6 h-6 text-red-600" />
                             </div>
                             <h2 className="text-xl font-bold text-red-600">Delete Vendor?</h2>
                         </div>
                    )}

                    <div className="flex items-center space-x-2">
                        {modalMode === 'view' && (
                            <>
                                <button onClick={initiateEdit} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Vendor">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setModalMode('confirm_delete')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Vendor">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                            </>
                        )}
                        <button onClick={() => setSelectedVendor(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>
                
                {/* --- BODY CONTENT --- */}
                <div className="p-6 overflow-y-auto">
                    
                    {/* VIEW MODE */}
                    {modalMode === 'view' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase">Overall Risk Score</p>
                                        <div className="flex items-baseline space-x-2">
                                            <span className="text-4xl font-bold text-gray-900">{selectedVendor.riskProfile.overall}</span>
                                            <span className="text-sm text-gray-400">/100</span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg border ${getRiskBadgeColor(selectedVendor.riskProfile.level)}`}>
                                        <span className="font-bold text-lg">{selectedVendor.riskProfile.level} Risk</span>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        Risk Score History (Last 5 Updates)
                                    </h4>
                                    <div className="h-32 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={selectedVendor.riskHistory}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} tickMargin={10} />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} itemStyle={{color: '#6366f1', fontWeight: 'bold'}} />
                                                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                                        AI Risk Analysis
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 text-sm">
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
                                    <p className="text-sm text-gray-500 mb-3">{selectedVendor.description}</p>
                                    {selectedVendor.website && (
                                        <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                                            Visit Website <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    )}
                                </div>
                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                        <StickyNote className="w-4 h-4 mr-2 text-indigo-500" />
                                        Notes
                                    </h3>
                                    <div className="flex gap-2 mb-4">
                                        <input 
                                            type="text" 
                                            placeholder="Add a new note..." 
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                        />
                                        <button onClick={handleAddNote} disabled={!newNote.trim()} className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                        {selectedVendor.notes && selectedVendor.notes.length > 0 ? (
                                            selectedVendor.notes.map(note => (
                                                <div key={note.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 group relative">
                                                    {editingNoteId === note.id ? (
                                                        <div className="flex items-start gap-2">
                                                            <textarea className="flex-1 bg-white border border-yellow-300 rounded p-2 text-sm focus:outline-none" value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} rows={2} />
                                                            <button onClick={saveEditedNote} className="text-green-600 hover:text-green-700 p-1">
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-gray-800 pr-6 break-words">{note.content}</p>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                                                                <div className="hidden group-hover:flex gap-2">
                                                                    <button onClick={() => startEditingNote(note)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                                        <Edit2 className="w-3 h-3" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic text-center py-2">No notes added yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EDIT FORM */}
                    {modalMode === 'edit' && (
                        <form onSubmit={submitEditForm} className="space-y-6 max-w-2xl mx-auto py-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input required type="text" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editFormData.name || ''} 
                                    onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                    <input required type="text" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={editFormData.industry || ''} 
                                        onChange={e => setEditFormData({...editFormData, industry: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input required type="text" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                        value={editFormData.location || ''} 
                                        onChange={e => setEditFormData({...editFormData, location: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input type="url" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editFormData.website || ''} 
                                    onChange={e => setEditFormData({...editFormData, website: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea required rows={5} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none" 
                                    value={editFormData.description || ''} 
                                    onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                                />
                                <p className="text-xs text-gray-500 mt-2">Note: Changing description will update the record but does not automatically re-run AI risk analysis.</p>
                            </div>
                        </form>
                    )}

                    {/* CONFIRM EDIT */}
                    {modalMode === 'confirm_edit' && (
                        <div className="max-w-xl mx-auto py-8 text-center space-y-6">
                            <div className="bg-indigo-50 p-6 rounded-2xl mx-auto w-fit">
                                <Save className="w-12 h-12 text-indigo-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Save Changes?</h3>
                                <p className="text-gray-500">
                                    You are about to update details for <span className="font-semibold text-gray-800">{selectedVendor.name}</span>. 
                                    Please confirm that you want to apply these changes.
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-3">
                                <div className="grid grid-cols-3 border-b border-gray-200 pb-2 mb-2 font-semibold text-gray-400 uppercase text-xs">
                                    <span>Field</span>
                                    <span>New Value</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-500">Name</span>
                                    <span className="col-span-2 font-medium">{editFormData.name}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-500">Location</span>
                                    <span className="col-span-2 font-medium">{editFormData.location}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-500">Website</span>
                                    <span className="col-span-2 font-medium truncate">{editFormData.website || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONFIRM DELETE */}
                    {modalMode === 'confirm_delete' && (
                        <div className="max-w-xl mx-auto py-8 text-center space-y-6">
                            <div className="bg-red-50 p-6 rounded-2xl mx-auto w-fit">
                                <AlertTriangle className="w-12 h-12 text-red-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Are you sure?</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    This action will permanently delete <span className="font-bold text-gray-900">{selectedVendor.name}</span> along with all its risk history and notes. This cannot be undone.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                    {modalMode === 'view' ? (
                        <>
                             <span className="text-xs text-gray-400">Last updated: {new Date(selectedVendor.riskProfile.lastUpdated).toLocaleDateString()}</span>
                             <button onClick={() => setSelectedVendor(null)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">Close</button>
                        </>
                    ) : (
                        <div className="flex justify-end space-x-3 w-full">
                            {/* Actions for Edit/Delete modes */}
                            {modalMode === 'edit' && (
                                <>
                                    <button onClick={() => setModalMode('view')} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                                    <button onClick={submitEditForm} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Review Changes</button>
                                </>
                            )}
                            {modalMode === 'confirm_edit' && (
                                <>
                                    <button onClick={() => setModalMode('edit')} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Back</button>
                                    <button onClick={confirmEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center">
                                        <Check className="w-4 h-4 mr-2" /> Confirm Save
                                    </button>
                                </>
                            )}
                            {modalMode === 'confirm_delete' && (
                                <>
                                    <button onClick={() => setModalMode('view')} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center">
                                        <Trash2 className="w-4 h-4 mr-2" /> Confirm Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;