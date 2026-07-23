import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { motion } from 'motion/react';
import { ShieldCheck, Eye } from 'lucide-react';
import { PortfolioProject, PortfolioImage } from '../types';
import { useApp } from '../context/AppContext';
import PortfolioLightbox from './PortfolioLightbox';
import PortfolioProjectDetailModal from './PortfolioProjectDetailModal';

interface PortfolioMasonryGridProps {
  projects: PortfolioProject[];
}

export default function PortfolioMasonryGrid({ projects }: PortfolioMasonryGridProps) {
  const { portfolioImages, incrementProjectViews, triggerSound, serviceCategories, reviews } = useApp();
  
  // Lightbox & Detail control state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<PortfolioProject | null>(null);
  const [activeImages, setActiveImages] = useState<PortfolioImage[]>([]);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);

  // Define breakpoints optimized for display inside modal
  const breakpointCols = {
    default: 2,
    1100: 2,
    768: 2,
    500: 1
  };

  const handleCardClick = (project: PortfolioProject) => {
    triggerSound('click');
    incrementProjectViews(project.id);
    setActiveProject(project);
    
    // Gather all related images: cover, before (if exists), after (if exists), and gallery
    const list: PortfolioImage[] = [];
    
    // 1. Cover Image (original size)
    list.push({
      id: `cover-${project.id}`,
      projectId: project.id,
      imageUrl: project.cover_image, // Original large size
      thumbnailUrl: project.cover_image,
      caption: 'Project Cover Overview',
      sortOrder: 0
    });

    // 2. Before Image (if exists)
    if (project.beforeImage) {
      list.push({
        id: `before-${project.id}`,
        projectId: project.id,
        imageUrl: project.beforeImage,
        thumbnailUrl: project.beforeImage,
        caption: 'BEFORE Work Commenced',
        sortOrder: 1
      });
    }

    // 3. After Image (if exists)
    if (project.afterImage) {
      list.push({
        id: `after-${project.id}`,
        projectId: project.id,
        imageUrl: project.afterImage,
        thumbnailUrl: project.afterImage,
        caption: 'AFTER Work Completed',
        sortOrder: 2
      });
    }

    // 4. Other related gallery items
    const relatedGallery = portfolioImages.filter((img) => img.projectId === project.id);
    relatedGallery.forEach((img, index) => {
      list.push({
        ...img,
        sortOrder: list.length + index
      });
    });

    setActiveImages(list);
    setCurrentLightboxIndex(0);
    setDetailModalOpen(true);
  };

  return (
    <div className="w-full">
      {/* react-masonry-css grid container */}
      <Masonry
        breakpointCols={breakpointCols}
        className="flex w-auto gap-4 select-none"
        columnClassName="bg-clip-padding flex flex-col gap-4 min-w-0 flex-1"
      >
        {projects.map((project, idx) => {
          const isVerified = project.isVerified || (project as any).is_verified;
          const catObj = serviceCategories.find((c) => c.id === project.category_id);
          const categoryName = catObj ? catObj.name : (project.category_id || 'Services');
          
          const doerReviews = reviews.filter(
            (r) => r.targetId === project.userId || r.targetId === (project as any).doerId
          );
          const realRatingVal = doerReviews.length > 0
            ? (doerReviews.reduce((sum, r) => sum + r.rating, 0) / doerReviews.length).toFixed(1)
            : "0.0";

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.35), type: 'spring', damping: 20, stiffness: 220 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(project)}
              className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col h-full text-left"
              style={{ contentVisibility: 'auto' }} // Native lazy-loading / performance rendering support
            >
              {/* Cover Thumbnail Image */}
              <div className="relative overflow-hidden aspect-video bg-slate-50 flex-shrink-0">
                <img
                  src={project.cover_image} // Loads compact/medium cover_image in grid
                  alt={project.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Verified by DOER overlay badge banner */}
                {isVerified && (
                  <div className="absolute top-3 left-3 bg-zinc-950/80 border border-brand/40 text-brand text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-md">
                    <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                    <span>Verified Project</span>
                  </div>
                )}

                {/* Floating view count metadata */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-xs">
                  <Eye className="w-2.5 h-2.5" />
                  <span>{project.views} views</span>
                </div>
              </div>

              {/* Text metadata section */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-1.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest truncate max-w-[120px]">
                      {categoryName}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-slate-400">
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 group-hover:text-brand-dark transition-colors mt-0.5 line-clamp-1">
                    {project.title}
                  </h4>
                  
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Bottom interactive footer card details */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 text-[9px] text-slate-400 font-bold mt-1">
                  <span className={`flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-full ${
                    parseFloat(realRatingVal) > 0 
                      ? 'text-amber-700 bg-amber-50 border border-amber-200/50' 
                      : 'text-slate-500 bg-slate-100'
                  }`}>
                    ★ {realRatingVal === "0.0" ? "0.0 (Unrated)" : `${realRatingVal} (${doerReviews.length} ${doerReviews.length === 1 ? 'review' : 'reviews'})`}
                  </span>
                  {project.clientFeedback && (
                    <span className="text-indigo-600 line-clamp-1 max-w-[100px]" title={project.clientFeedback}>
                      💬 feedback
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </Masonry>

      {/* RENDER DYNAMIC FULLSCREEN LIGHTBOX GALLEY ON CARD SELECTION */}
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

      {/* RENDER BEAUTIFUL PROJECT DETAIL modal CASE STUDY */}
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
    </div>
  );
}
