import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Image as ImageIcon, Plus, ShieldCheck, Tag, Sparkles, Check, Trash2, X } from 'lucide-react';
import { PortfolioProject, PortfolioImage } from '../types';
import { useApp } from '../context/AppContext';
import PortfolioLightbox from './PortfolioLightbox';
import PortfolioProjectDetailModal from './PortfolioProjectDetailModal';

interface PortfolioGalleryProps {
  userId: string;
}

interface PortfolioImageDropzoneProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  placeholder?: string;
}

function PortfolioImageDropzone({ label, value, onChange, onClear, placeholder = 'Upload Photo' }: PortfolioImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-1 text-left">
      <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative h-24 border border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all overflow-hidden ${
          value
            ? 'border-brand/40 bg-brand/5'
            : isDragging
              ? 'border-brand bg-slate-50 scale-[1.02]'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 active:scale-95 transition-transform cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2">
            <Plus className="w-4 h-4 text-slate-400 mb-1" />
            <span className="text-[9px] font-extrabold text-slate-700">{placeholder}</span>
            <span className="text-[8px] text-slate-400 font-bold mt-0.5">Drag & drop or Click</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processFile(file);
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

// South African Presets for Portfolio Creation
const UNSPLASH_Plumbing_PRESETS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585338087338-3f70dbfeec31?w=600&auto=format&fit=crop&q=80'
];

const UNSPLASH_Gardening_PRESETS = [
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530731141654-5961fe27689c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80'
];

const UNSPLASH_Construction_PRESETS = [
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=80'
];

export default function PortfolioGalleryWithLightbox({ userId }: PortfolioGalleryProps) {
  const { portfolioProjects, portfolioImages, triggerSound, addPortfolioProject, showToast, currentUser, serviceCategories } = useApp();

  const isOwnProfile = userId === currentUser?.id || userId === 'my-doer-profile' || currentUser?.id === 'current-user-uuid';

  // Add Portfolio Form state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjCategory, setNewProjCategory] = useState('plumbing');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjCover, setNewProjCover] = useState('');
  const [newProjBefore, setNewProjBefore] = useState('');
  const [newProjAfter, setNewProjAfter] = useState('');
  const [newProjExtraImages, setNewProjExtraImages] = useState<{ imageUrl: string; caption: string }[]>([
    { imageUrl: '', caption: '' }
  ]);

  useEffect(() => {
    if (serviceCategories && serviceCategories.length > 0 && !serviceCategories.some(c => c.id === newProjCategory)) {
      setNewProjCategory(serviceCategories[0].id);
    }
  }, [serviceCategories, newProjCategory]);

  const handlePresetSelect = (url: string) => {
    triggerSound('click');
    if (!newProjCover) setNewProjCover(url);
    else if (!newProjBefore) setNewProjBefore(url);
    else if (!newProjAfter) setNewProjAfter(url);
  };

  const handleAddExtraImageField = () => {
    triggerSound('click');
    setNewProjExtraImages((prev) => [...prev, { imageUrl: '', caption: '' }]);
  };

  const handleRemoveExtraImageField = (idx: number) => {
    triggerSound('click');
    setNewProjExtraImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateExtraImage = (idx: number, field: 'imageUrl' | 'caption', val: string) => {
    setNewProjExtraImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, [field]: val } : img))
    );
  };

  const handleSubmitPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) {
      showToast('Please provide a project title and description.', 'error');
      return;
    }

    const defaultCover = newProjCategory === 'plumbing' 
      ? UNSPLASH_Plumbing_PRESETS[0] 
      : newProjCategory === 'gardening' 
        ? UNSPLASH_Gardening_PRESETS[0] 
        : UNSPLASH_Construction_PRESETS[0];

    addPortfolioProject(
      newProjTitle,
      newProjDesc,
      newProjCategory,
      newProjCover || defaultCover,
      newProjBefore || undefined,
      newProjAfter || undefined,
      newProjExtraImages.filter((img) => img.imageUrl.trim() !== '')
    );

    // Reset Form
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjCover('');
    setNewProjBefore('');
    setNewProjAfter('');
    setNewProjExtraImages([{ imageUrl: '', caption: '' }]);
    setShowAddProjectModal(false);
  };

  // Filter existing doer projects
  const doerProjects = portfolioProjects.filter((p) => p.userId === userId);

  // Use uploaded portfolio projects
  const projectsToDisplay = doerProjects;

  // Lightbox State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeImages, setActiveImages] = useState<PortfolioImage[]>([]);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);

  const handleOpenGallery = (project: PortfolioProject) => {
    triggerSound('click');
    setActiveProject(project);

    // Formulate a clean gallery order for the selected project
    const imagesList: PortfolioImage[] = [];

    // 1. Cover image
    imagesList.push({
      id: `cover-${project.id}`,
      projectId: project.id,
      imageUrl: project.cover_image,
      thumbnailUrl: project.cover_image,
      caption: 'Completed Project Overview',
      sortOrder: 0
    });

    // 2. Before image if exists
    if (project.beforeImage) {
      imagesList.push({
        id: `before-${project.id}`,
        projectId: project.id,
        imageUrl: project.beforeImage,
        thumbnailUrl: project.beforeImage,
        caption: 'Before Work Commenced (Preparatory Phase)',
        sortOrder: 1
      });
    }

    // 3. After image if exists
    if (project.afterImage) {
      imagesList.push({
        id: `after-${project.id}`,
        projectId: project.id,
        imageUrl: project.afterImage,
        thumbnailUrl: project.afterImage,
        caption: 'Final Handover Phase (After Completion)',
        sortOrder: 2
      });
    }

    // 4. Any other specific sub-images uploaded
    const relatedImages = portfolioImages.filter((img) => img.projectId === project.id);
    relatedImages.forEach((img, idx) => {
      imagesList.push({
        ...img,
        sortOrder: imagesList.length + idx
      });
    });

    // If it is a sample project, add a couple of beautiful extra photos
    if (project.id === 'sample-p1' && !project.afterImage) {
      imagesList.push({
        id: 'sample-p1-extra',
        projectId: project.id,
        imageUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=300&fit=crop&q=80',
        caption: 'Precision dovetail joints and bespoke finishing',
        sortOrder: 3
      });
    }

    setActiveImages(imagesList);
    setCurrentLightboxIndex(0);
    setDetailModalOpen(true);
  };

  return (
    <motion.div
      className="bg-white p-5 geom-card border border-slate-100 shadow-xs space-y-4 text-left hover:shadow-lg transition-all duration-300"
      whileHover={{
        scale: 1.02
      }}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-brand" /> Portfolio Work Gallery
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Interactive showcase of completed craft projects and service work proofs
          </p>
        </div>
        {isOwnProfile && (
          <button
            onClick={() => {
              triggerSound('click');
              setShowAddProjectModal(true);
            }}
            className="px-2.5 py-1.5 bg-brand text-white hover:bg-brand-hover rounded-lg text-[9px] font-black uppercase shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Project
          </button>
        )}
      </div>
      {/* Grid of Portfolio Works */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {projectsToDisplay.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenGallery(project)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 flex flex-col h-56 shadow-2xs hover:shadow-md transition-all duration-300"
          >
            {/* Project Cover Image */}
            <div className="relative w-full h-36 bg-slate-200 overflow-hidden">
              <img
                src={project.cover_image}
                alt={project.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <span className="bg-white text-zinc-950 font-black uppercase text-[9px] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                  <Eye className="w-3 h-3 text-brand" /> Expand Gallery
                </span>
              </div>

              {/* Verified Overlay badge */}
              {project.isVerified && (
                <div className="absolute top-2.5 left-2.5 bg-zinc-900/85 border border-brand/35 text-brand text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 backdrop-blur-md">
                  <ShieldCheck className="w-3 h-3 fill-brand/10" />
                  <span>Verified</span>
                </div>
              )}

              {/* Category tag overlay */}
              <div className="absolute top-2.5 right-2.5 bg-white/95 text-slate-700 text-[8px] font-extrabold uppercase px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs border border-slate-100">
                <Tag className="w-2.5 h-2.5 text-brand" />
                <span>{serviceCategories.find(c => c.id === project.category_id)?.name || project.category_id || 'Services'}</span>
              </div>
            </div>

            {/* Project metadata */}
            <div className="p-3 flex-1 flex flex-col justify-between text-left">
              <div>
                <h5 className="font-black text-slate-800 text-xs line-clamp-1 group-hover:text-brand transition-colors">
                  {project.title}
                </h5>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-0.5 leading-tight">
                  {project.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[8px] text-slate-400 font-extrabold mt-1">
                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ★ {project.rating === 0 ? "0.0" : project.rating || "0.0"} Score
                </span>
                <span>{project.views} views</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* FOOTER INFO */}
      {doerProjects.length === 0 && (
        <div className="text-center p-3 bg-orange-50/45 border border-dashed border-orange-100 rounded-xl text-[10px] text-orange-700/80 font-bold flex items-center justify-between gap-2 flex-wrap">
          <span>💡 These are premium portfolio samples to demonstrate lightbox viewing.</span>
          {isOwnProfile && (
            <button
              onClick={() => {
                triggerSound('click');
                setShowAddProjectModal(true);
              }}
              className="bg-brand hover:bg-brand-hover text-zinc-950 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
            >
              <Plus className="w-3 h-3" /> Start adding yours!
            </button>
          )}
        </div>
      )}
      {/* FULLSCREEN GALLERIES LIGHTBOX */}
      {lightboxOpen && activeProject && (
        <PortfolioLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={activeImages}
          currentIndex={currentLightboxIndex}
          setCurrentIndex={setCurrentLightboxIndex}
          projectTitle={activeProject.title}
          projectDescription={activeProject.description}
        />
      )}
      {/* DYNAMIC CASE STUDY PROJECT DETAIL MODAL */}
      {detailModalOpen && activeProject && (
        <PortfolioProjectDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          project={activeProject}
          images={activeImages}
          onOpenLightbox={(index) => {
            setCurrentLightboxIndex(index);
            setLightboxOpen(true);
          }}
        />
      )}
      {/* ➕ ADD PORTFOLIO PROJECT MODAL */}
      <AnimatePresence>
        {showAddProjectModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white rounded-2xl border border-slate-150 shadow-2xl p-5 flex flex-col max-h-[90vh] overflow-hidden text-xs font-semibold"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <span className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-brand" /> Publish Portfolio Entry
                </span>
                <button
                  onClick={() => setShowAddProjectModal(false)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmitPortfolio} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Project Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bathroom Modernization"
                      value={newProjTitle}
                      onChange={(e) => setNewProjTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-brand transition-colors text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Service Category *</label>
                    <select
                      value={newProjCategory}
                      onChange={(e) => setNewProjCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-hidden focus:border-brand transition-colors text-xs"
                    >
                      {serviceCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Project Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the problem, steps to resolve, products used, and final details."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium leading-relaxed focus:outline-hidden focus:border-brand transition-colors text-xs"
                  />
                </div>

                {/* Cover, Before, After image inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <PortfolioImageDropzone
                    label="Cover Image"
                    value={newProjCover}
                    onChange={(val) => setNewProjCover(val)}
                    onClear={() => setNewProjCover('')}
                    placeholder="Cover Photo"
                  />
                  <PortfolioImageDropzone
                    label="Before Photo"
                    value={newProjBefore}
                    onChange={(val) => setNewProjBefore(val)}
                    onClear={() => setNewProjBefore('')}
                    placeholder="Before Photo"
                  />
                  <PortfolioImageDropzone
                    label="After Photo"
                    value={newProjAfter}
                    onChange={(val) => setNewProjAfter(val)}
                    onClear={() => setNewProjAfter('')}
                    placeholder="After Photo"
                  />
                </div>

                {/* Preset Picker */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span>💡 Quick Pick High-Res Presets</span>
                    <span className="text-[8px] text-slate-400 font-semibold normal-case">(Click one to fill Cover/Before/After)</span>
                  </span>
                  <div className="flex gap-2.5 flex-wrap">
                    {(newProjCategory === 'plumbing' ? UNSPLASH_Plumbing_PRESETS : newProjCategory === 'gardening' ? UNSPLASH_Gardening_PRESETS : UNSPLASH_Construction_PRESETS).map((url, i) => (
                      <div
                        key={i}
                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={() => handlePresetSelect(url)}
                      >
                        <img src={url} alt="Preset" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white text-[8px] font-black uppercase">Pick</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional gallery list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Additional Gallery Images</span>
                    <button
                      type="button"
                      onClick={handleAddExtraImageField}
                      className="text-brand font-black text-[9px] uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Photo
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newProjExtraImages.map((img, idx) => {
                      const handleImgFile = (file: File) => {
                        if (file && file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleUpdateExtraImage(idx, 'imageUrl', reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };

                      return (
                        <div key={idx} className="flex gap-3 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          {/* Thumbnail / Upload zone */}
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleImgFile(file);
                            }}
                            className="relative w-14 h-14 rounded-lg border border-dashed border-slate-200 bg-white flex-shrink-0 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-slate-50"
                          >
                            {img.imageUrl ? (
                              <>
                                <img src={img.imageUrl} alt="Extra" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateExtraImage(idx, 'imageUrl', '')}
                                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-1 text-center">
                                <Plus className="w-3 h-3 text-slate-400 mb-0.5" />
                                <span className="text-[8px] font-black uppercase text-slate-500">Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImgFile(file);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          {/* Caption and delete action */}
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              placeholder="Brief caption (e.g. Copper pipes installation)"
                              value={img.caption}
                              onChange={(e) => handleUpdateExtraImage(idx, 'caption', e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-hidden"
                            />
                            <div className="flex justify-between items-center text-[8px] text-slate-400">
                              <span>Drag & drop photo supported</span>
                              {newProjExtraImages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExtraImageField(idx)}
                                  className="text-red-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove Photo
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand hover:bg-brand-hover text-zinc-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer mt-2"
                >
                  Publish Project Proof (+5 Trust Points)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
