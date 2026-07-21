/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { submitCategoryRequest, addServiceCategory } from '../lib/categories';

interface PostProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const presetImages = [
  { id: '1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
  { id: '2', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
  { id: '3', url: 'https://images.unsplash.com/photo-1526170315870-ef68a6f3dd39?w=400&q=80' }
];

export default function PostProductModal({ isOpen, onClose }: PostProductModalProps) {
  const { postProduct, triggerSound, serviceCategories, currentUser, showToast, isAdmin } = useApp();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(serviceCategories[0]?.id || '');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');

  const [error, setError] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    triggerSound('click');
    if (step === 1 && !title.trim()) {
      setError('Please provide a descriptive product name.');
      return;
    }
    if (step === 2 && (!price || isNaN(Number(price)))) {
      setError('Please enter a valid numeric price (ZAR).');
      return;
    }
    setError('');
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    triggerSound('click');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSubmittingCategory(true);
    try {
      if (isAdmin) {
        const categoryId = await addServiceCategory({
          name: newCategoryName.trim(),
          description: 'Admin quick added product category',
          icon: 'Sparkles',
          color: 'from-emerald-500 to-emerald-600',
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
          currentUser.email || 'user@example.com'
        );
        showToast(`Request for "${newCategoryName}" submitted to admins!`, 'success');
      }
      setIsAddingCustomCategory(false);
      setNewCategoryName('');
    } catch (err) {
      setError('Failed to add category.');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !price) {
      setError('Please fill in all required fields.');
      return;
    }

    triggerSound('success');
    const selectedImg = imageUrl || presetImages[0].url;
    postProduct(title, description, Number(price), category, selectedImg, Number(stock) || 10);
    onClose();
    
    // Reset
    setStep(1);
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory(serviceCategories[0]?.id || '');
    setStock('10');
    setImageUrl('');
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
            <h3 className="text-xl font-black text-slate-900">List Your Product</h3>
            <p className="text-xs text-slate-500 font-semibold">Make sales on South Africa’s leading local marketplace</p>
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
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step >= s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded ${
                    step > s ? 'bg-emerald-600' : 'bg-slate-100'
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
                  Product Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Spicy Beef Drywors (500g)"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Product Description
                </label>
                <textarea
                  placeholder="What makes your product special? Ingredients, size, material, how you deliver, packaging detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Select Product Category
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto mb-2">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        triggerSound('click');
                        setCategory(cat.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                        category === cat.id
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      triggerSound('click');
                      setIsAddingCustomCategory(true);
                    }}
                    className="p-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-left text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Suggest New...
                  </button>
                </div>

                {isAddingCustomCategory && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2"
                  >
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-tight">Request New Category</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCategory}
                        disabled={isSubmittingCategory || !newCategoryName.trim()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-black disabled:opacity-50"
                      >
                        {isSubmittingCategory ? '...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCategory(false)}
                        className="px-2 py-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Retail Price (ZAR R)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                    R
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 195"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 text-xs font-black shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Inventory Stock (In Stock Qty)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Paste Custom Image URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/your-image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 text-xs font-semibold"
                />
              </div>

              {imageUrl && (
                <div className="mt-2 rounded-2xl overflow-hidden h-32 relative border border-slate-150 shadow-inner">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] text-emerald-950 font-extrabold">
                  Products are shipped using tracked door-to-door courier systems. Keep the packaging premium!
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

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs text-center shadow-sm"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs text-center shadow-md shadow-emerald-50"
              >
                List Product Now! 🛍️
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
