/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, MapPin, Tag, Sparkles, Search, Plus, Loader2, Trash2, Upload, Image } from 'lucide-react';
import { addServiceCategory, submitCategoryRequest } from '../lib/categories';
import { Service } from '../types';

interface PostServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: Service;
}

export default function PostServiceModal({ isOpen, onClose, editingService }: PostServiceModalProps) {
  const { postService, updateService, triggerSound, serviceCategories, currentUser, showToast, isAdmin } = useApp();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState<'fixed' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'negotiable'>('day');
  const [category, setCategory] = useState(serviceCategories[0]?.id || 'homestay');
  const [location, setLocation] = useState('');
  // Media Fields
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

  useEffect(() => {
    if (editingService) {
      setTitle(editingService.title || '');
      setDescription(editingService.description || '');
      setPrice(editingService.price ? String(editingService.price) : '');
      setPriceUnit(editingService.priceUnit || 'day');
      setCategory(editingService.category || serviceCategories[0]?.id || 'homestay');
      setLocation(editingService.location || '');
      
      setFeaturedImageUrl(editingService.featuredImageUrl || editingService.imageUrls?.[0] || '');
      setImageUrls(editingService.imageUrls || []);
      setVideoUrls(editingService.videoUrls || []);
      setPortfolioUrls(editingService.portfolioUrls || []);
    } else {
      setStep(1);
      setTitle('');
      setDescription('');
      setPrice('');
      setPriceUnit('day');
      setCategory(serviceCategories[0]?.id || 'homestay');
      setLocation('');
      setFeaturedImageUrl('');
      setImageUrls([]);
      setVideoUrls([]);
      setPortfolioUrls([]);
    }
  }, [editingService, isOpen, serviceCategories]);

  const [error, setError] = useState('');

  // Helper functions for media arrays
  const isValidUrl = (url: string) => {
    if (url.startsWith('data:')) return true;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };
  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };
  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const handleAddVideoUrl = () => {
    setVideoUrls([...videoUrls, '']);
  };
  const handleRemoveVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };
  const handleVideoUrlChange = (index: number, val: string) => {
    const updated = [...videoUrls];
    updated[index] = val;
    setVideoUrls(updated);
  };

  const handleAddPortfolioUrl = () => {
    setPortfolioUrls([...portfolioUrls, '']);
  };
  const handleRemovePortfolioUrl = (index: number) => {
    setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index));
  };
  const handlePortfolioUrlChange = (index: number, val: string) => {
    const updated = [...portfolioUrls];
    updated[index] = val;
    setPortfolioUrls(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'featured' | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image file too large! Please upload an image under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'featured') {
        setFeaturedImageUrl(base64String);
        showToast('Featured image uploaded successfully! 📸', 'success');
      } else {
        handleImageUrlChange(target, base64String);
        showToast('Additional image uploaded successfully! 📸', 'success');
      }
      triggerSound('success');
    };
    reader.readAsDataURL(file);
  };
  
  // Category Search & Custom logic
  const [categorySearch, setCategorySearch] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Users should only see approved categories in the list
  const filteredCategories = useMemo(() => {
    return serviceCategories.filter(cat => 
      cat.status === 'approved' &&
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [serviceCategories, categorySearch]);

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsSubmittingCategory(true);
    try {
      if (isAdmin) {
        const categoryId = await addServiceCategory({
          name: newCategoryName.trim(),
          description: 'Admin quick added category',
          icon: 'Sparkles',
          color: 'from-blue-500 to-indigo-600',
          displayOrder: 100,
          status: 'approved',
          createdBy: currentUser.id
        });
        setCategory(categoryId);
        showToast(`Category "${newCategoryName}" created!`, 'success');
      } else {
        await submitCategoryRequest(
          newCategoryName.trim(), 
          currentUser.id, 
          currentUser.email || ''
        );
        showToast(`Request for "${newCategoryName}" submitted to admins!`, 'success');
      }
      setCategorySearch('');
      setIsAddingCustomCategory(false);
      setNewCategoryName('');
      triggerSound('success');
    } catch (err) {
      console.error(err);
      showToast('Failed to process category action', 'error');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  if (!isOpen) return null;

  const handleNext = () => {
    triggerSound('click');
    if (step === 1 && !title.trim()) {
      setError('Please provide a descriptive title.');
      return;
    }
    if (step === 2) {
      if (priceUnit !== 'negotiable' && (!price || isNaN(Number(price)))) {
        setError('Please enter a valid numeric price (ZAR).');
        return;
      }
      if (!location.trim()) {
        setError('Please select a working area.');
        return;
      }
    }
    setError('');
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    triggerSound('click');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || (priceUnit !== 'negotiable' && !price)) {
      setError('Please fill in all required fields.');
      return;
    }

    triggerSound('success');
    const finalPrice = priceUnit === 'negotiable' ? 0 : Number(price);

    // Validation
    const isValid = (url: string) => !url || url.startsWith('http') || url.startsWith('data:');
    if (!isValid(featuredImageUrl) || 
        imageUrls.some(u => !isValid(u)) || 
        videoUrls.some(u => !isValid(u)) || 
        portfolioUrls.some(u => !isValid(u))) {
        setError('Please ensure all image/video/portfolio links are valid URLs.');
        return;
    }

    if (editingService) {
      updateService(editingService.id, {
        title: title.trim(),
        description: description.trim(),
        price: finalPrice,
        priceUnit,
        category,
        categoryId: category,
        location: location.trim(),
        featuredImageUrl,
        imageUrls: [featuredImageUrl, ...imageUrls.filter(url => url !== featuredImageUrl)],
        videoUrls,
        portfolioUrls,
      });
    } else {
      postService(
        title.trim(),
        description.trim(),
        finalPrice,
        priceUnit,
        category,
        location.trim(),
        featuredImageUrl,
        [featuredImageUrl, ...imageUrls.filter(url => url !== featuredImageUrl)],
        videoUrls,
        portfolioUrls
      );
    }
    
    onClose();
    
    // Reset
    setStep(1);
    setTitle('');
    setDescription('');
    setPrice('');
    setPriceUnit('day');
    setCategory(serviceCategories[0]?.id || 'homestay');
    setLocation('');
    setFeaturedImageUrl('');
    setImageUrls([]);
    setVideoUrls([]);
    setPortfolioUrls([]);
    setError('');
  };

  return (
    <div className="absolute inset-0 bg-slate-900/60 z-50 flex flex-col justify-end text-left">
      <div className="flex-1" onClick={onClose} />
      <motion.div
        initial={{ y: 500 }}
        animate={{ y: 0 }}
        exit={{ y: 500 }}
        transition={{ type: 'spring', stiffness: 220, damping: 25 }}
        className="bg-white rounded-t-[32px] p-6 shadow-2xl border-t border-slate-100 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-black text-slate-900">List Your Service</h3>
            <p className="text-xs text-slate-500 font-semibold">Ready to market your skills & start earning</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar steps */}
        <div className="flex justify-between mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s ? 'bg-brand text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    step > s ? 'bg-brand' : 'bg-slate-100'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && <p className="text-xs font-bold text-rose-600 mb-4 bg-rose-50 p-2.5 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pb-4">
          {step === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  What is your skill or service?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Expert Home Cleaning / Professional Painting"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Detailed Description (Qualifications, experience, what is included)
                </label>
                <textarea
                  placeholder="Tell clients about your work. Highlight your PIRB/CIPC status, tools you supply, or any guarantees."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(true)}
                    className="text-[10px] font-black text-brand hover:text-brand-dark flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    Add New
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-[11px] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          triggerSound('click');
                          setCategory(cat.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                          category === cat.id
                            ? 'bg-brand-light border-brand text-brand-dark'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {category === cat.id && <CheckCircle2 className="w-3 h-3 text-brand shrink-0" />}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center">
                      <p className="text-[10px] text-slate-400 font-bold mb-2">No matching categories found</p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewCategoryName(categorySearch);
                          setIsAddingCustomCategory(true);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Plus className="w-3 h-3" />
                        Create "{categorySearch}"
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Pricing Type
                </label>
                <select
                  value={priceUnit}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setPriceUnit(val);
                    if (val === 'negotiable') {
                      setPrice('0');
                    } else if (price === '0') {
                      setPrice('');
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hour">Per Hour</option>
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                  <option value="year">Per Year</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Pricing (South African Rands - ZAR R)
                </label>
                {priceUnit !== 'negotiable' ? (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                      R
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 250"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-black shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="p-3.5 bg-brand/10 border border-brand/20 rounded-xl text-xs font-semibold text-neutral-800 flex items-center gap-2">
                    <span>🤝</span>
                    <span>Price is Negotiable (Quote-based or discussed in Chat)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  Working Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sandton, Johannesburg"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              {/* Featured Image Section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Featured Image *
                </label>

                {/* Device Upload Zone */}
                <div className="border-2 border-dashed border-slate-200 hover:border-brand rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative group">
                  <input
                    type="file"
                    id="featured-image-upload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'featured')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-2.5 bg-brand/10 text-brand-dark rounded-full group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5 text-brand" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      Upload Image from Device
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Drag & drop or tap to choose file (Max 2MB)
                    </span>
                  </div>
                </div>

                {/* Custom URL Field */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Or Paste Custom Image URL</span>
                  <input
                    type="text"
                    placeholder="e.g. https://images.unsplash.com/your-image.jpg"
                    value={featuredImageUrl.startsWith('data:') ? '[Device Uploaded Image]' : featuredImageUrl}
                    disabled={featuredImageUrl.startsWith('data:')}
                    onChange={(e) => setFeaturedImageUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-semibold"
                  />
                  {featuredImageUrl.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() => setFeaturedImageUrl('')}
                      className="text-[9px] font-black text-rose-500 hover:underline block"
                    >
                      Clear Uploaded Image & Choose Another
                    </button>
                  )}
                </div>

                {/* Featured Live Preview */}
                {featuredImageUrl && (featuredImageUrl.trim().startsWith('http') || featuredImageUrl.trim().startsWith('data:')) && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 mt-2">
                    <img src={featuredImageUrl} alt="Featured Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                      Featured Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Additional Images Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Additional Images (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="text-[10px] font-black text-brand hover:text-brand-dark flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Image
                  </button>
                </div>

                <div className="space-y-2">
                  {imageUrls.map((imgUrl, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50/50 p-2 rounded-xl border border-slate-150">
                      {imgUrl && (imgUrl.trim().startsWith('http') || imgUrl.trim().startsWith('data:')) && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                          <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Paste image URL..."
                        value={imgUrl.startsWith('data:') ? '[Device Uploaded Image]' : imgUrl}
                        disabled={imgUrl.startsWith('data:')}
                        onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                      />
                      
                      {/* Upload device button */}
                      <label className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative shrink-0" title="Upload from Device">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, idx)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </label>

                      {imgUrl.startsWith('data:') && (
                        <button
                          type="button"
                          onClick={() => handleImageUrlChange(idx, '')}
                          className="text-[10px] font-black text-rose-500 px-1 hover:underline"
                        >
                          Clear
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-semibold italic">No additional images added.</p>
                  )}
                </div>
              </div>

              {/* Video URLs Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Video Showcase URLs (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="text-[10px] font-black text-brand hover:text-brand-dark flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Video
                  </button>
                </div>

                <div className="space-y-2">
                  {videoUrls.map((videoUrl, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="https://youtube.com/watch?v=... or MP4 URL"
                        value={videoUrl}
                        onChange={(e) => handleVideoUrlChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideoUrl(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {videoUrls.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-semibold italic">No video links added.</p>
                  )}
                </div>
              </div>

              {/* Portfolio Links Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    External Portfolio Links (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPortfolioUrl}
                    className="text-[10px] font-black text-brand hover:text-brand-dark flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Add Link
                  </button>
                </div>

                <div className="space-y-2">
                  {portfolioUrls.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="https://myportfolio.com or work sample"
                        value={link}
                        onChange={(e) => handlePortfolioUrlChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioUrl(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {portfolioUrls.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-semibold italic">No external portfolio links added.</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-brand-light border border-brand/20 rounded-2xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span className="text-[10px] text-brand-dark font-extrabold">
                  Your profile and verified Trust Score badge (TS) will be automatically linked to this service!
                </span>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex justify-between gap-3 bg-white">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-3 border border-slate-150 hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-xs"
              >
                Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-black text-xs text-center shadow-sm"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs text-center shadow-md shadow-emerald-50"
              >
                Publish Now! 🚀
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Add Category Sub-Modal */}
      <AnimatePresence>
        {isAddingCustomCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40 z-[60] flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-black text-slate-900">
                  {isAdmin ? 'Add New Category' : 'Request New Category'}
                </h4>
                <button
                  onClick={() => setIsAddingCustomCategory(false)}
                  className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-relaxed">
                {isAdmin 
                  ? 'As an administrator, you can create a category that immediately goes live and becomes visible to all users.'
                  : 'Suggested categories are reviewed by admins. If approved, they will become active and visible to all users.'}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Mobile Car Wash"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand text-slate-800 text-xs font-bold"
                  />
                </div>

                <button
                  onClick={handleAddCustomCategory}
                  disabled={!newCategoryName.trim() || isSubmittingCategory}
                  className="w-full py-3.5 bg-brand hover:bg-brand-hover disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-brand/10 flex items-center justify-center gap-2"
                >
                  {isSubmittingCategory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isAdmin ? 'Create Category' : 'Submit Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
