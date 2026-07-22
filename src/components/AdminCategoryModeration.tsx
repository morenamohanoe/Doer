import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import RoleGuard from './auth/RoleGuard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  X, 
  Shield, 
  Search, 
  Trash2, 
  Plus, 
  Edit, 
  Archive, 
  ArchiveRestore, 
  Inbox, 
  Clock, 
  User, 
  FolderPlus, 
  Grid, 
  ListOrdered, 
  ThumbsDown,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { 
  addServiceCategory, 
  updateServiceCategory, 
  deleteCategory, 
  approveCategoryRequest, 
  rejectCategoryRequest 
} from '../lib/categories';
import CategoryIcon, { POPULAR_ICONS } from './CategoryIcon';
import ConfirmationModal from './ConfirmationModal';
import GlobalSystemCutSettings from './admin/GlobalSystemCutSettings';
import { AdminAnalyticsDashboard } from './admin/analytics/AdminAnalyticsDashboard';
import { logError } from '../lib/logger';

const PRESET_GRADIENTS = [
  { name: 'Sunset Red', class: 'from-orange-500 to-red-600' },
  { name: 'Ocean Breeze', class: 'from-blue-500 to-indigo-600' },
  { name: 'Tropical Cyan', class: 'from-teal-500 to-cyan-600' },
  { name: 'Forest Emerald', class: 'from-emerald-500 to-teal-600' },
  { name: 'Rose Petal', class: 'from-pink-500 to-rose-600' },
  { name: 'Royal Purple', class: 'from-purple-500 to-indigo-600' },
  { name: 'Golden Amber', class: 'from-amber-500 to-orange-600' },
  { name: 'Slate Gray', class: 'from-slate-600 to-slate-800' }
];

export default function AdminCategoryModeration() {
  const { serviceCategories, categoryRequests, triggerSound, showToast, currentUser } = useApp();
  
  // Search and Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'archived'>('all');
  
  // Category Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('Sparkles');
  const [formColor, setFormColor] = useState('from-blue-500 to-indigo-600');
  const [formDisplayOrder, setFormDisplayOrder] = useState('0');
  const [formStatus, setFormStatus] = useState<'approved' | 'pending' | 'archived'>('approved');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conversion / Request approval Modal State
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [activeTab, setActiveTab] = useState<'analytics' | 'manage' | 'requests' | 'fees'>('analytics');
  
  // Manage Category Filtering
  const filteredCategories = serviceCategories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase()) || 
                          (cat.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Category Request Filtering
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const filteredRequests = categoryRequests.filter(req => {
    const matchesSearch = req.name.toLowerCase().includes(search.toLowerCase()) || 
                          (req.requestedByEmail || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = requestFilter === 'all' ? true : req.status === requestFilter;
    return matchesSearch && matchesStatus;
  });

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingCategoryId(null);
    setFormName('');
    setFormDescription('');
    setFormIcon('Sparkles');
    setFormColor('from-blue-500 to-indigo-600');
    setFormDisplayOrder('0');
    setFormStatus('approved');
    setIsFormOpen(true);
    triggerSound('click');
  };

  // Open Form for Edit
  const handleOpenEdit = (cat: any) => {
    setEditingCategoryId(cat.id);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormIcon(cat.icon || 'Sparkles');
    setFormColor(cat.color || 'from-blue-500 to-indigo-600');
    setFormDisplayOrder(String(cat.displayOrder || 0));
    setFormStatus(cat.status || 'approved');
    setIsFormOpen(true);
    triggerSound('click');
  };

  // Submit Category Create or Update
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        // Edit Mode
        await updateServiceCategory(editingCategoryId, {
          name: formName.trim(),
          description: formDescription.trim(),
          icon: formIcon,
          color: formColor,
          displayOrder: Number(formDisplayOrder) || 0,
          status: formStatus
        });
        showToast(`Category "${formName}" updated successfully!`, 'success');
      } else {
        // Create Mode
        await addServiceCategory({
          name: formName.trim(),
          description: formDescription.trim(),
          icon: formIcon,
          color: formColor,
          displayOrder: Number(formDisplayOrder) || 0,
          status: formStatus,
          createdBy: currentUser?.id || 'admin'
        });
        showToast(`Category "${formName}" created successfully!`, 'success');
      }
      setIsFormOpen(false);
      triggerSound('success');
    } catch (err) {
      logError(err);
      showToast('Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (cat: any) => {
    try {
      const newStatus = cat.status === 'archived' ? 'approved' : 'archived';
      await updateServiceCategory(cat.id, { status: newStatus });
      triggerSound('click');
      showToast(
        `Category "${cat.name}" ${newStatus === 'archived' ? 'archived' : 'restored'}`, 
        'info'
      );
    } catch (err) {
      showToast('Failed to change status', 'error');
    }
  };

  // Delete Category
  const handleDeleteCategory = (cat: any) => {
    triggerSound('click');
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category Permanently',
      message: `Are you absolutely sure you want to delete "${cat.name}"? This cannot be undone and will permanently remove this service category.`,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          triggerSound('success');
          showToast(`Category "${cat.name}" deleted permanently`, 'success');
        } catch (err) {
          showToast('Failed to delete category', 'error');
        }
      }
    });
  };

  // Open Approval Flow for Category Request
  const handleOpenApproveRequest = (req: any) => {
    setApprovingRequestId(req.id);
    setFormName(req.name);
    setFormDescription(`Custom category requested by user.`);
    setFormIcon('Sparkles');
    setFormColor('from-blue-500 to-indigo-600');
    setFormDisplayOrder('0');
    triggerSound('click');
  };

  // Confirm Approval (Saves category and updates status)
  const handleConfirmApproveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequestId) return;
    setIsSubmitting(true);
    try {
      await approveCategoryRequest(approvingRequestId, {
        name: formName.trim(),
        description: formDescription.trim(),
        icon: formIcon,
        color: formColor,
        displayOrder: Number(formDisplayOrder) || 0,
        createdBy: currentUser?.id || 'admin'
      });
      setApprovingRequestId(null);
      showToast(`Category request approved and created!`, 'success');
      triggerSound('success');
    } catch (err) {
      logError(err);
      showToast('Failed to approve request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Category Request
  const handleRejectRequest = (id: string, name: string) => {
    triggerSound('click');
    setConfirmModal({
      isOpen: true,
      title: 'Reject Category Request',
      message: `Are you sure you want to reject the category request for "${name}"?`,
      onConfirm: async () => {
        try {
          await rejectCategoryRequest(id);
          triggerSound('click');
          showToast(`Category request "${name}" rejected`, 'info');
        } catch (err) {
          showToast('Failed to reject request', 'error');
        }
      }
    });
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Header section */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand/10 text-brand rounded-lg">
                <Shield className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Category Command Center</h2>
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
              Admin Only Access • Dynamic Collections Moderation
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-black rounded-xl transition-all shadow-md shadow-brand/10 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-4 mt-6 border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('analytics'); triggerSound('click'); }}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase transition-all relative flex items-center gap-1.5 shrink-0 ${
              activeTab === 'analytics' 
                ? 'text-brand' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-brand" />
            Analytics & BI Dashboard
            {activeTab === 'analytics' && (
              <motion.div layoutId="adminTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('manage'); triggerSound('click'); }}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase transition-all relative shrink-0 ${
              activeTab === 'manage' 
                ? 'text-brand' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Manage Categories ({serviceCategories.length})
            {activeTab === 'manage' && (
              <motion.div layoutId="adminTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('requests'); triggerSound('click'); }}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase transition-all relative flex items-center gap-1.5 shrink-0 ${
              activeTab === 'requests' 
                ? 'text-brand' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            User Requests
            {categoryRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            ({categoryRequests.length})
            {activeTab === 'requests' && (
              <motion.div layoutId="adminTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab('fees'); triggerSound('click'); }}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase transition-all relative flex items-center gap-1.5 shrink-0 ${
              activeTab === 'fees' 
                ? 'text-brand' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Service Fees
            {activeTab === 'fees' && (
              <motion.div layoutId="adminTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        </div>

        {/* Global Search & Filters bar */}
        {(activeTab === 'manage' || activeTab === 'requests') && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'manage' ? "Search dynamic categories..." : "Search user category requests..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-xs font-bold transition-all"
              />
            </div>

            {activeTab === 'manage' ? (
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
                {(['all', 'approved', 'archived'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      statusFilter === f 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setRequestFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      requestFilter === f 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <div className="max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'analytics' ? (
              <motion.div
                key="analytics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AdminAnalyticsDashboard />
              </motion.div>
          ) : activeTab === 'manage' ? (
            <motion.div
              key="manage-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((cat) => (
                    <motion.div
                      key={cat.id}
                      layout
                      className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Title bar */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${cat.color || 'from-slate-100 to-slate-200'} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                            <CategoryIcon name={cat.icon} className="w-5 h-5 text-white" />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              cat.status === 'approved' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : cat.status === 'archived'
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {cat.status}
                            </span>
                            
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 border border-slate-100 rounded-full flex items-center gap-0.5" title="Display Order">
                              <ListOrdered className="w-3 h-3 text-slate-400" />
                              {cat.displayOrder || 0}
                            </span>
                          </div>
                        </div>

                        {/* Text details */}
                        <h3 className="text-sm font-black text-slate-800 tracking-tight">{cat.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                          {cat.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Action Row */}
                      <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 text-[10px] text-slate-400 font-bold">
                        <span className="truncate max-w-[100px] text-[10px]">ID: {cat.id}</span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:text-slate-800 text-slate-600 rounded-xl transition-all"
                            title="Edit Category"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleArchive(cat)}
                            className={`p-1.5 border rounded-xl transition-all ${
                              cat.status === 'archived'
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                            }`}
                            title={cat.status === 'archived' ? 'Restore/Approve' : 'Archive Category'}
                          >
                            {cat.status === 'archived' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white text-rose-600 rounded-xl transition-all"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-150 p-6 shadow-sm">
                  <Grid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700">No categories match the active filter</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try expanding your search or filtering options.</p>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'requests' ? (
            <motion.div
              key="requests-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {filteredRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      layout
                      className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            req.status === 'pending' 
                              ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                              : req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}>
                            {req.status}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            {req.createdAt?.seconds 
                              ? new Date(req.createdAt.seconds * 1000).toLocaleDateString()
                              : 'Recent'}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-800 tracking-tight">"{req.name}"</h3>
                        
                        <div className="mt-3 flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Requested By: {req.requestedByEmail || 'Anonymous User'}</span>
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 border-t border-slate-100 mt-4 pt-4">
                          <button
                            onClick={() => handleOpenApproveRequest(req)}
                            className="flex-1 py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100"
                          >
                            <Check className="w-4 h-4" />
                            Approve & Build
                          </button>

                          <button
                            onClick={() => handleRejectRequest(req.id, req.name)}
                            className="flex-1 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-150 p-6 shadow-sm">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700">No category requests found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Users haven't requested any custom categories matching these filters yet.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
                key="fees-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
            >
                <GlobalSystemCutSettings />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* --- FORM MODAL FOR CREATE / EDIT CATEGORY --- */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <FolderPlus className="w-5 h-5 text-brand" />
                    {editingCategoryId ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Define metadata & active styles</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wellness Spa"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description / Catchy Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a clean summary of services listed under this category..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* Status & Display Order Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                    >
                      <option value="approved">Approved / Active</option>
                      <option value="pending">Pending Admin Review</option>
                      <option value="archived">Archived / Hidden</option>
                    </select>
                  </div>
                </div>

                {/* Icon Grid Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Icon ({formIcon})
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-150 max-h-36 overflow-y-auto">
                    {POPULAR_ICONS.map(ic => (
                      <button
                        type="button"
                        key={ic}
                        onClick={() => { setFormIcon(ic); triggerSound('click'); }}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                          formIcon === ic
                            ? 'bg-brand border-brand text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-brand/40'
                        }`}
                        title={ic}
                      >
                        <CategoryIcon name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Display Gradient Color Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_GRADIENTS.map(grad => (
                      <button
                        type="button"
                        key={grad.name}
                        onClick={() => { setFormColor(grad.class); triggerSound('click'); }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          formColor === grad.class
                            ? 'border-slate-800 ring-2 ring-slate-800/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${grad.class} shrink-0`} />
                        <span className="text-[10px] font-bold text-slate-700 truncate">{grad.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-black rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-brand/10 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : editingCategoryId ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL FOR CONVERTING REQUEST TO ACTIVE CATEGORY --- */}
      <AnimatePresence>
        {approvingRequestId && (
          <div className="fixed inset-0 bg-slate-950/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                    Approve & Build Category
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Customize metadata to release category</p>
                </div>
                <button
                  onClick={() => setApprovingRequestId(null)}
                  className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleConfirmApproveRequest} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Approved Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Icon ({formIcon})
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-150 max-h-36 overflow-y-auto">
                    {POPULAR_ICONS.map(ic => (
                      <button
                        type="button"
                        key={ic}
                        onClick={() => { setFormIcon(ic); triggerSound('click'); }}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                          formIcon === ic
                            ? 'bg-brand border-brand text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-brand/40'
                        }`}
                      >
                        <CategoryIcon name={ic} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gradient Picker */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Display Gradient Color Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_GRADIENTS.map(grad => (
                      <button
                        type="button"
                        key={grad.name}
                        onClick={() => { setFormColor(grad.class); triggerSound('click'); }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          formColor === grad.class
                            ? 'border-slate-800 ring-2 ring-slate-800/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-gradient-to-br ${grad.class} shrink-0`} />
                        <span className="text-[10px] font-bold text-slate-700 truncate">{grad.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setApprovingRequestId(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-black rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApproveRequest}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center"
                >
                  {isSubmitting ? 'Approving...' : 'Approve & Release'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      </div>
    </RoleGuard>
  );
}
