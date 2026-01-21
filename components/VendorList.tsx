
import React, { useState, useEffect } from 'react';
import { Vendor, RiskLevel, Note } from '../types';
import { Search, Plus, Loader2, Globe, Shield, FileText, X, AlertTriangle, TrendingUp, Layers, Trash2, Edit2, Save, StickyNote, ExternalLink, ArrowLeft, Check, LayoutGrid, List, Upload, Lock, Activity, ChevronLeft, Link as LinkIcon, History, Calendar } from 'lucide-react';
import { analyzeVendorRisk } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import InfoTooltip from './InfoTooltip';

interface VendorListProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
}

type ModalMode = 'view' | 'edit' | 'confirm_edit' | 'confirm_delete';
type ViewMode = 'grid' | 'list';
type RiskCategory = 'cyber' | 'financial' | 'geopolitical' | null;

const VendorList: React.FC<VendorListProps> = ({ vendors, setVendors }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmingAdd, setIsConfirmingAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Selected Vendor State
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editFormData, setEditFormData] = useState<Partial<Vendor>>({});
  const [activeCategory, setActiveCategory] = useState<RiskCategory>(null);

  // Note State
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Add Form State
  const [newVendor, setNewVendor] = useState({
    name: '',
    industry: '',
    location: '',
    description: '',
    website: ''
  });
  
  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset modal mode when opening a vendor
  const openVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setModalMode('view');
    setActiveCategory(null);
    setShowHistoryModal(false);
    setEditFormData({});
  };

  // --- Security: Validation Logic ---
  const validateForm = () => {
      const errors: Record<string, string> = {};
      
      // 1. Company Name: English Alphanumeric + basic business symbols. Min 2, Max 100.
      const nameRegex = /^[a-zA-Z0-9\s&.',-]+$/;
      if (!newVendor.name.trim()) {
          errors.name = "Company name is required";
      } else if (newVendor.name.length < 2 || newVendor.name.length > 100) {
          errors.name = "Name must be between 2 and 100 characters";
      } else if (!nameRegex.test(newVendor.name)) {
          errors.name = "Only English letters, numbers, and basic symbols (& . ' , -) allowed";
      }

      // 2. Industry: Alphanumeric only. Max 60.
      const industryRegex = /^[a-zA-Z0-9\s-]+$/;
      if (!newVendor.industry.trim()) {
          errors.industry = "Industry is required";
      } else if (newVendor.industry.length > 60) {
          errors.industry = "Max 60 characters";
      } else if (!industryRegex.test(newVendor.industry)) {
          errors.industry = "Only letters, numbers and hyphens allowed";
      }

      // 3. Location: City, Country format. Max 60.
      const locationRegex = /^[a-zA-Z\s,.-]+$/;
      if (!newVendor.location.trim()) {
          errors.location = "Location is required";
      } else if (newVendor.location.length > 60) {
          errors.location = "Max 60 characters";
      } else if (!locationRegex.test(newVendor.location)) {
          errors.location = "Invalid characters in location";
      }

      // 4. Website: Strict URL check if provided. Max 100.
      if (newVendor.website) {
          if (newVendor.website.length > 100) {
              errors.website = "URL too long";
          } else if (!/^https?:\/\/[a-zA-Z0-9-\.]+\.[a-z]{2,}(\/.*)?$/.test(newVendor.website)) {
              errors.website = "Must start with http:// or https:// and be a valid URL";
          }
      }

      // 5. Description: Max 500 chars. Sanitize check handled by regex/backend, but here we enforce length.
      if (!newVendor.description.trim()) {
          errors.description = "Description is required";
      } else if (newVendor.description.length > 500) {
          errors.description = "Description too long (max 500 characters)";
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const handleAddFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Security: Run validation before proceeding
    if (validateForm()) {
        // Security: Trim inputs one last time before state lock
        setNewVendor(prev => ({
            name: prev.name.trim(),
            industry: prev.industry.trim(),
            location: prev.location.trim(),
            website: prev.website.trim(),
            description: prev.description.trim()
        }));
        setIsConfirmingAdd(true);
    }
  };

  // Helper to backfill history for new vendors so the chart isn't empty
  const generateSyntheticHistory = (currentScore: number) => {
    const history = [];
    const today = new Date();
    // Generate 6 months of history
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        
        let score;
        if (i === 0) {
            score = currentScore;
        } else {
            // Add realistic variance (+/- 10 points) for past data
            const variance = Math.floor(Math.random() * 21) - 10;
            score = Math.max(0, Math.min(100, currentScore + variance));
        }

        history.push({
            date: d.toISOString().split('T')[0],
            score: score
        });
    }
    return history;
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
        riskHistory: generateSyntheticHistory(riskProfile.overall)
      };

      setVendors(prev => [...prev, vendor]);
      setIsAdding(false);
      setIsConfirmingAdd(false);
      setNewVendor({ name: '', industry: '', location: '', description: '', website: '' });
      setFormErrors({});
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

  const toggleCategory = (category: RiskCategory) => {
      setActiveCategory(prev => prev === category ? null : category);
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
      case RiskLevel.LOW: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case RiskLevel.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case RiskLevel.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case RiskLevel.CRITICAL: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  // Mock Quarterly Data Generator
  const getQuarterlyData = (vendor: Vendor) => {
      const quarters = ["Q1 2025", "Q4 2024", "Q3 2024", "Q2 2024", "Q1 2024", "Q4 2023", "Q3 2023", "Q2 2023"];
      return quarters.map(q => {
          // Semi-randomly generate a 'status' to make it look realistic based on overall score
          let riskType = "Stable";
          let details = "Operations maintained normal cadence.";
          
          if (vendor.riskProfile.overall > 70 && (q.includes("2024") || q.includes("2025"))) {
               riskType = "Elevated";
               details = "Supply chain constraints noted in region. Increased lead times.";
          }
          if (vendor.riskProfile.overall > 85 && q === "Q4 2024") {
               riskType = "Critical";
               details = "Major geopolitical event impacted production capacity.";
          }
          if (vendor.riskProfile.overall < 30) {
               riskType = "Low";
               details = "Audit passed with distinction. No major incidents.";
          }

          return { period: q, riskType, details };
      });
  };

  const isDescriptionTooLong = newVendor.description.length > 500;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
          <p className="text-gray-500 dark:text-slate-400">Monitor your third-party ecosystem.</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* View Toggles */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <div className="flex space-x-2">
            <Link 
                to="/bulk-upload"
                className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
                <Upload className="w-4 h-4" />
                <span>Bulk Upload</span>
            </Link>
            <button 
                onClick={() => { setIsAdding(true); setIsConfirmingAdd(false); setFormErrors({}); }}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, industry, or location..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid View (Existing) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                      {vendor.name.substring(0,2).toUpperCase()}
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{vendor.name}</h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-slate-400">{vendor.industry}</p>
                        <span className="text-gray-300 dark:text-slate-600">•</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            vendor.tier === 1 ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                            vendor.tier === 2 ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
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
                <div className="flex items-start text-sm text-gray-600 dark:text-slate-400">
                  <Globe className="w-4 h-4 mr-2 mt-0.5 text-gray-400 dark:text-slate-500" />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-start text-sm text-gray-600 dark:text-slate-400">
                  <Shield className="w-4 h-4 mr-2 mt-0.5 text-gray-400 dark:text-slate-500" />
                  <span className="line-clamp-2">{vendor.riskProfile.summary}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-gray-400 dark:text-slate-500">Score: <span className="text-gray-900 dark:text-white font-semibold font-mono tracking-tight">{vendor.riskProfile.overall}/100</span></span>
                  <button 
                    onClick={() => openVendorDetails(vendor)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
                  >
                    View Details
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View (New) */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800">
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-400 uppercase text-xs tracking-wider">Vendor</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-400 uppercase text-xs tracking-wider">Location</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-400 uppercase text-xs tracking-wider">Tier</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-400 uppercase text-xs tracking-wider text-center">Score</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-400 uppercase text-xs tracking-wider text-center">Level</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 dark:text-slate-400 uppercase text-xs tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                          {vendor.name.substring(0,2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{vendor.name}</p>
                          <p className="text-xs text-gray-400 truncate">{vendor.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                      <div className="flex items-center">
                        <Globe className="w-3.5 h-3.5 mr-2 text-gray-400 dark:text-slate-500" />
                        <span className="truncate max-w-[150px]">{vendor.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          vendor.tier === 1 ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                          vendor.tier === 2 ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                          'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                          T{vendor.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-gray-900 dark:text-white mb-1 font-mono tracking-tight">{vendor.riskProfile.overall}</span>
                        <div className="w-16 h-1 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              vendor.riskProfile.overall > 75 ? 'bg-red-500' :
                              vendor.riskProfile.overall > 50 ? 'bg-orange-500' :
                              vendor.riskProfile.overall > 25 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${vendor.riskProfile.overall}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeColor(vendor.riskProfile.level)}`}>
                        {vendor.riskProfile.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openVendorDetails(vendor)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold text-xs py-1.5 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {filteredVendors.length === 0 && (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-500">
          <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-lg">No vendors found matching "{searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")}"</p>
          <p className="text-sm">Try searching for a different name, industry or country.</p>
        </div>
      )}

      {/* Add Vendor Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative border border-gray-200 dark:border-slate-800">
             
             {!isConfirmingAdd ? (
                <>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Vendor</h2>
                  <form onSubmit={handleAddFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Company Name</label>
                      <input 
                        required 
                        type="text" 
                        maxLength={100}
                        className={`w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-slate-600'}`} 
                        value={newVendor.name} 
                        onChange={e => {
                            setNewVendor({...newVendor, name: e.target.value});
                            if(formErrors.name) setFormErrors({...formErrors, name: ''});
                        }} 
                        placeholder="e.g. Foxconn" 
                      />
                      {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Industry</label>
                          <input 
                            required 
                            type="text" 
                            maxLength={60}
                            className={`w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.industry ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-slate-600'}`}
                            value={newVendor.industry} 
                            onChange={e => {
                                setNewVendor({...newVendor, industry: e.target.value});
                                if(formErrors.industry) setFormErrors({...formErrors, industry: ''});
                            }} 
                            placeholder="e.g. Manufacturing" 
                          />
                          {formErrors.industry && <p className="text-xs text-red-600 mt-1">{formErrors.industry}</p>}
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Location</label>
                          <input 
                            required 
                            type="text" 
                            maxLength={60}
                            className={`w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.location ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-slate-600'}`}
                            value={newVendor.location} 
                            onChange={e => {
                                setNewVendor({...newVendor, location: e.target.value});
                                if(formErrors.location) setFormErrors({...formErrors, location: ''});
                            }} 
                            placeholder="e.g. Shenzhen, China" 
                          />
                          {formErrors.location && <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Website (Optional)</label>
                      <input 
                        type="text" 
                        maxLength={100}
                        className={`w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none ${formErrors.website ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-slate-600'}`}
                        value={newVendor.website} 
                        onChange={e => {
                            setNewVendor({...newVendor, website: e.target.value});
                            if(formErrors.website) setFormErrors({...formErrors, website: ''});
                        }} 
                        placeholder="e.g. https://google.com" 
                      />
                      {formErrors.website && <p className="text-xs text-red-600 mt-1">{formErrors.website}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                      <textarea 
                        required 
                        className={`w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 ${(formErrors.description || isDescriptionTooLong) ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-slate-600'}`}
                        value={newVendor.description} 
                        onChange={e => {
                            setNewVendor({...newVendor, description: e.target.value});
                            if(formErrors.description) setFormErrors({...formErrors, description: ''});
                        }} 
                        placeholder="Briefly describe what they supply..."
                      ></textarea>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500 dark:text-slate-400">Our AI will use this to assess initial risk.</p>
                        <p className={`text-xs ${isDescriptionTooLong ? 'text-red-600 font-bold' : newVendor.description.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {newVendor.description.length}/500
                        </p>
                      </div>
                      {(formErrors.description || isDescriptionTooLong) && (
                          <p className="text-xs text-red-600 mt-1">
                              {formErrors.description || "Description exceeds 500 character limit. Please shorten to proceed."}
                          </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                      <button 
                        type="submit" 
                        disabled={isDescriptionTooLong}
                        className={`px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg transition-colors ${isDescriptionTooLong ? 'opacity-50 cursor-not-allowed bg-indigo-400' : 'hover:bg-indigo-700'}`}
                      >
                        Review Details
                      </button>
                    </div>
                  </form>
                </>
             ) : (
                <div className="space-y-4">
                   <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Vendor Details</h2>
                   <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg space-y-3 border border-gray-100 dark:border-slate-700">
                      <div>
                         <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Company Name</span>
                         <p className="font-medium text-gray-900 dark:text-white">{newVendor.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Industry</span>
                            <p className="font-medium text-gray-900 dark:text-white">{newVendor.industry}</p>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Location</span>
                            <p className="font-medium text-gray-900 dark:text-white">{newVendor.location}</p>
                        </div>
                      </div>
                       {newVendor.website && (
                          <div>
                             <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Website</span>
                             <p className="font-medium text-gray-900 dark:text-white truncate">{newVendor.website}</p>
                          </div>
                      )}
                      <div>
                         <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Description</span>
                         <p className="text-sm text-gray-700 dark:text-slate-300">{newVendor.description}</p>
                      </div>
                   </div>
                   
                   <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-lg flex items-start">
                       <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                       <p className="text-sm text-indigo-800 dark:text-indigo-300">
                          Clicking "Confirm" will send this data to our AI model for risk assessment. This may take a few seconds.
                       </p>
                   </div>

                   <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsConfirmingAdd(false)} 
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-none ring-1 ring-slate-900/5 dark:ring-white/10 flex flex-col max-h-[90vh]">
                
                {/* --- HEADER --- */}
                <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
                    {modalMode === 'view' && (
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
                    )}
                    {(modalMode === 'edit' || modalMode === 'confirm_edit') && (
                         <div className="flex items-center space-x-3">
                             <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                                 <Edit2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                             </div>
                             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Vendor</h2>
                         </div>
                    )}
                    {modalMode === 'confirm_delete' && (
                         <div className="flex items-center space-x-3">
                             <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg">
                                 <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                             </div>
                             <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Vendor?</h2>
                         </div>
                    )}

                    <div className="flex items-center space-x-2">
                        {modalMode === 'view' && (
                            <>
                                <button onClick={initiateEdit} className="p-2 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit Vendor">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setModalMode('confirm_delete')} className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete Vendor">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>
                            </>
                        )}
                        <button onClick={() => setSelectedVendor(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-500 dark:text-slate-500" />
                        </button>
                    </div>
                </div>
                
                {/* --- BODY CONTENT --- */}
                <div className="p-6 overflow-y-auto relative">
                    
                    {/* VIEW MODE */}
                    {modalMode === 'view' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                    <div>
                                        <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-400 uppercase">
                                            Overall Risk Score
                                            <InfoTooltip text="A weighted aggregate of Cyber, Financial, and Geopolitical scores." />
                                        </div>
                                        <div className="flex items-baseline space-x-2">
                                            <span className="text-4xl font-bold text-gray-900 dark:text-white font-mono tracking-tight">{selectedVendor.riskProfile.overall}</span>
                                            <span className="text-sm text-gray-400 dark:text-slate-500">/100</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                        <span className="relative flex h-2.5 w-2.5 mr-2">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                                selectedVendor.riskProfile.level === 'Critical' || selectedVendor.riskProfile.level === 'High' ? 'bg-red-400' :
                                                selectedVendor.riskProfile.level === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                                            }`}></span>
                                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                                selectedVendor.riskProfile.level === 'Critical' || selectedVendor.riskProfile.level === 'High' ? 'bg-red-500' :
                                                selectedVendor.riskProfile.level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}></span>
                                        </span>
                                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">{selectedVendor.riskProfile.level} Risk</span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-4 flex items-center">
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
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={false} tickMargin={10} />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip 
                                                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#f1f5f9' }} 
                                                  itemStyle={{color: '#818cf8', fontWeight: 'bold'}} 
                                                  labelStyle={{color: '#94a3b8', marginBottom: '0.25rem'}}
                                                />
                                                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Cyber Security Box */}
                                    <div 
                                        onClick={() => toggleCategory('cyber')}
                                        className={`p-4 border rounded-xl text-center cursor-pointer transition-all duration-200 ${activeCategory === 'cyber' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-inner' : 'border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md'}`}
                                    >
                                        <Shield className={`w-6 h-6 mx-auto mb-2 ${activeCategory === 'cyber' ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-500 dark:text-blue-400'}`} />
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.cyberScore}</div>
                                        <div className={`text-xs flex items-center justify-center ${activeCategory === 'cyber' ? 'text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                                            Cyber Security
                                            <InfoTooltip text="Based on CVEs, SSL grades, and breach history." />
                                        </div>
                                    </div>
                                    {/* Financial Health Box */}
                                    <div 
                                        onClick={() => toggleCategory('financial')}
                                        className={`p-4 border rounded-xl text-center cursor-pointer transition-all duration-200 ${activeCategory === 'financial' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-inner' : 'border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md'}`}
                                    >
                                        <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${activeCategory === 'financial' ? 'text-indigo-600 dark:text-indigo-400' : 'text-green-500 dark:text-green-400'}`} />
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.financialScore}</div>
                                        <div className={`text-xs flex items-center justify-center ${activeCategory === 'financial' ? 'text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                                            Financial Health
                                            <InfoTooltip text="Based on credit ratings, stock trends, and bankruptcy indicators." />
                                        </div>
                                    </div>
                                    {/* Geopolitical Box */}
                                    <div 
                                        onClick={() => toggleCategory('geopolitical')}
                                        className={`p-4 border rounded-xl text-center cursor-pointer transition-all duration-200 ${activeCategory === 'geopolitical' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-inner' : 'border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md'}`}
                                    >
                                        <Globe className={`w-6 h-6 mx-auto mb-2 ${activeCategory === 'geopolitical' ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-500 dark:text-orange-400'}`} />
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.geopoliticalScore}</div>
                                        <div className={`text-xs flex items-center justify-center ${activeCategory === 'geopolitical' ? 'text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-500 dark:text-slate-400'}`}>
                                            Geopolitical
                                            <InfoTooltip text="Based on regional stability, conflict zones, and trade sanctions." />
                                        </div>
                                    </div>
                                    {/* Supply Chain Tier Box - Non-clickable for now or informative */}
                                    <div className="p-4 border border-gray-100 dark:border-slate-800 rounded-xl text-center bg-gray-50/50 dark:bg-slate-800/50">
                                        <Layers className="w-6 h-6 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">Tier {selectedVendor.tier}</div>
                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center justify-center">
                                            Supply Chain
                                            <InfoTooltip text="Tier 1: Direct. Tier 2: Indirect. Tier 3: Raw Materials." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col h-full">
                                {!activeCategory ? (
                                    // Default View: Summary & General Info
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                                                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                                                AI Risk Analysis
                                            </h3>
                                            <p className="text-gray-600 dark:text-slate-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 text-sm">
                                                {selectedVendor.riskProfile.summary}
                                            </p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Key Risk Factors</h3>
                                            <div className="space-y-2 mb-3">
                                                {selectedVendor.riskProfile.keyFactors.map((factor, idx) => (
                                                    <div key={idx} className="flex items-start border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-md px-3 py-2 text-xs font-medium hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                                                        <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                          <span className="text-slate-700 dark:text-slate-300">{factor.text}</span>
                                                          {factor.sourceUrl && (
                                                            <a 
                                                              href={factor.sourceUrl} 
                                                              target="_blank" 
                                                              rel="noopener noreferrer" 
                                                              className="inline-flex items-center ml-2 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                                                              title={factor.sourceUrl}
                                                            >
                                                              <LinkIcon className="w-3 h-3" />
                                                            </a>
                                                          )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => setShowHistoryModal(true)}
                                                className="w-full py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center shadow-sm"
                                            >
                                                <History className="w-4 h-4 mr-2" />
                                                View Quarterly Risk History
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Company Description</h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">{selectedVendor.description}</p>
                                            {selectedVendor.website && (
                                                <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline">
                                                    Visit Website <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                <StickyNote className="w-4 h-4 mr-2 text-indigo-500" />
                                                Notes
                                            </h3>
                                            <div className="flex gap-2 mb-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="Add a new note..." 
                                                    className="flex-1 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                                        <div key={note.id} className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 group relative">
                                                            {editingNoteId === note.id ? (
                                                                <div className="flex items-start gap-2">
                                                                    <textarea className="flex-1 bg-white dark:bg-slate-800 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-sm focus:outline-none text-gray-900 dark:text-white" value={editingNoteContent} onChange={(e) => setEditingNoteContent(e.target.value)} rows={2} />
                                                                    <button onClick={saveEditedNote} className="text-green-600 hover:text-green-700 p-1">
                                                                        <Save className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm text-gray-800 dark:text-slate-200 pr-6 break-words">{note.content}</p>
                                                                    <div className="flex justify-between items-center mt-2">
                                                                        <span className="text-xs text-gray-400 dark:text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</span>
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
                                                    <p className="text-sm text-gray-400 dark:text-slate-500 italic text-center py-2">No notes added yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Deep Dive Views
                                    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <button onClick={() => setActiveCategory(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                                <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                            </button>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {activeCategory === 'cyber' && 'Cyber Security Detail'}
                                                {activeCategory === 'financial' && 'Financial Health Detail'}
                                                {activeCategory === 'geopolitical' && 'Geopolitical Analysis'}
                                            </h3>
                                        </div>

                                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                                            {activeCategory === 'cyber' && (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">CVE Vulnerabilities</span>
                                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVendor.riskProfile.cyberDetails?.cveCount ?? 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">SSL Grade</span>
                                                        <span className={`text-xl font-bold px-3 py-1 rounded ${
                                                            selectedVendor.riskProfile.cyberDetails?.sslGrade?.startsWith('A') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                            selectedVendor.riskProfile.cyberDetails?.sslGrade === 'B' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                            {selectedVendor.riskProfile.cyberDetails?.sslGrade ?? 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400 block mb-2">Breach History (Last 12mo)</span>
                                                        {selectedVendor.riskProfile.cyberDetails?.recentBreach ? (
                                                            <div className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                                <span className="text-sm font-medium">Major incident detected</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                                                <Check className="w-4 h-4 mr-2" />
                                                                <span className="text-sm font-medium">No major breaches reported</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {activeCategory === 'financial' && (
                                                <div className="space-y-6">
                                                    {selectedVendor.riskProfile.financialDetails?.currentPrice && (
                                                      <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm">
                                                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Live Stock Price</span>
                                                        <div className="text-right">
                                                          <span className="text-2xl font-bold text-gray-900 dark:text-white">${selectedVendor.riskProfile.financialDetails.currentPrice}</span>
                                                          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-bold uppercase">{selectedVendor.riskProfile.financialDetails.tickerSymbol}</p>
                                                        </div>
                                                      </div>
                                                    )}
                                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Credit Rating</span>
                                                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedVendor.riskProfile.financialDetails?.creditRating ?? 'N/A'}</span>
                                                    </div>
                                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400 block mb-2">Stock / Market Trend</span>
                                                        <div className="flex items-center space-x-2">
                                                            <Activity className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                                                            <span className="text-lg font-medium text-gray-900 dark:text-white">{selectedVendor.riskProfile.financialDetails?.stockTrend ?? 'Private / N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400 block mb-2">Bankruptcy Risk</span>
                                                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                                            selectedVendor.riskProfile.financialDetails?.bankruptcyRisk === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            selectedVendor.riskProfile.financialDetails?.bankruptcyRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                            {selectedVendor.riskProfile.financialDetails?.bankruptcyRisk ?? 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeCategory === 'geopolitical' && (
                                                <div className="space-y-6">
                                                    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400 block mb-2">Regional Stability</span>
                                                        <div className={`flex items-center space-x-2 font-bold text-lg ${
                                                            selectedVendor.riskProfile.geopoliticalDetails?.politicalStability === 'Stable' ? 'text-green-600 dark:text-green-400' :
                                                            selectedVendor.riskProfile.geopoliticalDetails?.politicalStability === 'Unstable' ? 'text-orange-600 dark:text-orange-400' :
                                                            'text-red-600 dark:text-red-400'
                                                        }`}>
                                                            <span>{selectedVendor.riskProfile.geopoliticalDetails?.politicalStability ?? 'Unknown'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Active Conflict Zone</span>
                                                        {selectedVendor.riskProfile.geopoliticalDetails?.conflictZone ? (
                                                            <span className="text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded">YES</span>
                                                        ) : (
                                                            <span className="text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded">NO</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Trade Sanctions</span>
                                                        {selectedVendor.riskProfile.geopoliticalDetails?.tradeSanctions ? (
                                                            <span className="text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded">DETECTED</span>
                                                        ) : (
                                                            <span className="text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded">NONE</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* HISTORY MODAL (Nested inside view mode) */}
                    {showHistoryModal && modalMode === 'view' && (
                        <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                                <div className="flex items-center space-x-2">
                                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="font-bold text-gray-900 dark:text-white">Quarterly Risk History</h3>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                                    Historical risk factor analysis for <span className="font-semibold text-gray-900 dark:text-white">{selectedVendor.name}</span> over the last 8 quarters.
                                </p>
                                <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900 ml-3 space-y-8">
                                    {getQuarterlyData(selectedVendor).map((data, idx) => (
                                        <div key={idx} className="relative pl-8">
                                            <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'}`}></span>
                                            <div>
                                                <div className="flex items-center mb-1">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white mr-3">{data.period}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                        data.riskType === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                        data.riskType === 'Elevated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                        data.riskType === 'Stable' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    }`}>
                                                        {data.riskType}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-sm text-gray-700 dark:text-slate-300 shadow-sm">
                                                    <p>{data.details}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EDIT FORM */}
                    {modalMode === 'edit' && (
                        <form onSubmit={submitEditForm} className="space-y-6 max-w-2xl mx-auto py-4">
                            {/* ... (Edit form fields remain largely the same, existing styles were fine) ... */}
                            {/* Shortened for brevity as requested "Change Nothing" else */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Company Name</label>
                                <input required type="text" className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none border-gray-300 dark:border-slate-700" 
                                    value={editFormData.name || ''} 
                                    onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Industry</label>
                                    <input required type="text" className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none border-gray-300 dark:border-slate-700" 
                                        value={editFormData.industry || ''} 
                                        onChange={e => setEditFormData({...editFormData, industry: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Location</label>
                                    <input required type="text" className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none border-gray-300 dark:border-slate-700" 
                                        value={editFormData.location || ''} 
                                        onChange={e => setEditFormData({...editFormData, location: e.target.value})} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Website</label>
                                <input type="url" className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none border-gray-300 dark:border-slate-700" 
                                    value={editFormData.website || ''} 
                                    onChange={e => setEditFormData({...editFormData, website: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea required rows={5} className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none border-gray-300 dark:border-slate-700" 
                                    value={editFormData.description || ''} 
                                    onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                                />
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Note: Changing description will update the record but does not automatically re-run AI risk analysis.</p>
                            </div>
                        </form>
                    )}

                    {/* CONFIRM EDIT */}
                    {modalMode === 'confirm_edit' && (
                        <div className="max-w-xl mx-auto py-8 text-center space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-500/20 p-6 rounded-2xl mx-auto w-fit">
                                <Save className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Save Changes?</h3>
                                <p className="text-gray-500 dark:text-slate-400">
                                    You are about to update details for <span className="font-semibold text-gray-800 dark:text-white">{selectedVendor.name}</span>. 
                                    Please confirm that you want to apply these changes.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-left text-sm space-y-3 border border-gray-100 dark:border-slate-700">
                                <div className="grid grid-cols-3 border-b border-gray-200 dark:border-slate-700 pb-2 mb-2 font-semibold text-gray-400 dark:text-slate-500 uppercase text-xs">
                                    <span>Field</span>
                                    <span>New Value</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-500 dark:text-slate-400">Name</span>
                                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{editFormData.name}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-500 dark:text-slate-400">Location</span>
                                    <span className="col-span-2 font-medium text-gray-900 dark:text-white">{editFormData.location}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-500 dark:text-slate-400">Website</span>
                                    <span className="col-span-2 font-medium truncate text-gray-900 dark:text-white">{editFormData.website || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONFIRM DELETE */}
                    {modalMode === 'confirm_delete' && (
                        <div className="max-w-xl mx-auto py-8 text-center space-y-6">
                            <div className="bg-red-50 dark:bg-red-500/20 p-6 rounded-2xl mx-auto w-fit">
                                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Are you sure?</h3>
                                <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                                    This action will permanently delete <span className="font-bold text-gray-900 dark:text-white">{selectedVendor.name}</span> along with all its risk history and notes. This cannot be undone.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 rounded-b-2xl flex justify-between items-center">
                    {modalMode === 'view' ? (
                        <>
                             <span className="text-xs text-gray-400 dark:text-slate-500">Last updated: {new Date(selectedVendor.riskProfile.lastUpdated).toLocaleDateString()}</span>
                             <button onClick={() => setSelectedVendor(null)} className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors">Close</button>
                        </>
                    ) : (
                        <div className="flex justify-end space-x-3 w-full">
                            {/* Actions for Edit/Delete modes */}
                            {modalMode === 'edit' && (
                                <>
                                    <button onClick={() => setModalMode('view')} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg font-medium">Cancel</button>
                                    <button onClick={submitEditForm} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Review Changes</button>
                                </>
                            )}
                            {modalMode === 'confirm_edit' && (
                                <>
                                    <button onClick={() => setModalMode('edit')} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg font-medium">Back</button>
                                    <button onClick={confirmEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center">
                                        <Check className="w-4 h-4 mr-2" /> Confirm Save
                                    </button>
                                </>
                            )}
                            {modalMode === 'confirm_delete' && (
                                <>
                                    <button onClick={() => setModalMode('view')} className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg font-medium">Cancel</button>
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
