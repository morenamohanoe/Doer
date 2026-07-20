import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { PortfolioProject, PortfolioImage } from '../types';
import { useApp } from '../context/AppContext';
import PortfolioLightbox from './PortfolioLightbox';
import PortfolioProjectDetailModal from './PortfolioProjectDetailModal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PortfolioGalleryProps {
  userId: string;
}

export default function PortfolioGallery({ userId }: PortfolioGalleryProps) {
  const { currentUser } = useApp();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [lightboxImages, setLightboxImages] = useState<PortfolioImage[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'portfolio_projects'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioProject));
      setProjects(projs);
    });
    return unsubscribe;
  }, [userId]);

  const openLightbox = (project: PortfolioProject, images: PortfolioImage[]) => {
    setSelectedProject(project);
    setLightboxImages(images);
    setIsLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            {project.cover_image && (
              <img src={project.cover_image} alt={project.title} className="w-full h-40 object-cover rounded-lg" />
            )}
            <h3 className="font-bold text-lg">{project.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
            <button 
              onClick={() => setSelectedProject(project)}
              className="text-xs font-black text-brand uppercase tracking-wider hover:underline"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {selectedProject && (
        <PortfolioProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onViewImages={(images) => openLightbox(selectedProject, images)}
        />
      )}

      {isLightboxOpen && selectedProject && (
        <PortfolioLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={lightboxImages}
          projectTitle={selectedProject.title}
          projectDescription={selectedProject.description}
        />
      )}
    </div>
  );
}
