import re

with open('src/components/ProfileScreen.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'ImageCropperModal' not in content:
    content = content.replace("import PortfolioGalleryWithLightbox from './PortfolioGalleryWithLightbox';", "import PortfolioGalleryWithLightbox from './PortfolioGalleryWithLightbox';\nimport ImageCropperModal from './ImageCropperModal';")

# Add cropModalData and viewingImage state
state_code = """  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [cropModalData, setCropModalData] = useState<{ isOpen: boolean; imageSrc: string; type: 'profile' | 'cover', aspectRatio: number }>({ isOpen: false, imageSrc: '', type: 'profile', aspectRatio: 1 });"""

if 'setCropModalData' not in content:
    content = content.replace("const [savingProfile, setSavingProfile] = useState(false);", f"const [savingProfile, setSavingProfile] = useState(false);\n{state_code}")

# Replace upload handlers
new_handlers = """  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropModalData({ isOpen: true, imageSrc: reader.result as string, type: 'profile', aspectRatio: 1 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropModalData({ isOpen: true, imageSrc: reader.result as string, type: 'cover', aspectRatio: 21 / 9 });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };"""

old_handlers = """  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingMedia(prev => ({ ...prev, profile: true }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFields(prev => ({ ...prev, customProfileUrl: reader.result as string }));
        setTimeout(() => setIsProcessingMedia(prev => ({ ...prev, profile: false })), 600);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingMedia(prev => ({ ...prev, cover: true }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFields(prev => ({ ...prev, customCoverUrl: reader.result as string }));
        setEditUseCustomCoverUrl(true);
        setTimeout(() => setIsProcessingMedia(prev => ({ ...prev, cover: false })), 800);
      };
      reader.readAsDataURL(file);
    }
  };"""

content = content.replace(old_handlers, new_handlers)

# Add CropperModal and Lightbox to render at the end
render_additions = """      {/* Modals */}
      <ImageCropperModal
        isOpen={cropModalData.isOpen}
        imageSrc={cropModalData.imageSrc}
        aspectRatio={cropModalData.aspectRatio}
        onClose={() => setCropModalData(prev => ({ ...prev, isOpen: false }))}
        onCropComplete={(croppedImageUrl) => {
          if (cropModalData.type === 'profile') {
            setEditFields(prev => ({ ...prev, customProfileUrl: croppedImageUrl }));
          } else {
            setEditFields(prev => ({ ...prev, customCoverUrl: croppedImageUrl }));
            setEditUseCustomCoverUrl(true);
          }
        }}
      />
      <AnimatePresence>
        {viewingImage && (
          <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4">
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2">
              <X className="w-8 h-8" />
            </button>
            <img src={viewingImage} alt="Fullscreen View" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}"""

content = re.sub(r'    </div>\n  \);\n}', render_additions, content)

# Make Cover and Profile clickable in non-edit mode, and add hover edit overlay in edit mode
# Let's find Cover Banner Display in non-edit mode
cover_banner_old = """        {/* Cover Banner Display */}
        <div className="h-24 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100">
          {profile?.coverImageUrl ? (
            <img src={profile.coverImageUrl} alt="Cover Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-950 flex items-center justify-center text-slate-400 text-[9px] uppercase tracking-wider font-extrabold">
              Standard Banner Active
            </div>
          )}
        </div>"""

cover_banner_new = """        {/* Cover Banner Display */}
        <div className="h-24 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100 group">
          {profile?.coverImageUrl ? (
            <img onClick={() => !isEditing && setViewingImage(profile.coverImageUrl)} src={profile.coverImageUrl} alt="Cover Banner" className={`w-full h-full object-cover ${!isEditing ? 'cursor-pointer' : ''}`} />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-950 flex items-center justify-center text-slate-400 text-[9px] uppercase tracking-wider font-extrabold">
              Standard Banner Active
            </div>
          )}
          {isEditing && (
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-[10px] font-black uppercase tracking-wider">Change Cover</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
            </label>
          )}
        </div>"""

content = content.replace(cover_banner_old, cover_banner_new)

# Avatar Display
avatar_old = """            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>"""

avatar_new = """            <div className="relative group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white relative">
                <img onClick={() => !isEditing && setViewingImage(currentUser.avatarUrl)} src={currentUser.avatarUrl} alt="Avatar" className={`w-full h-full object-cover ${!isEditing ? 'cursor-pointer' : ''}`} />
                {isEditing && (
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                    <Camera className="w-5 h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                  </label>
                )}
              </div>
            </div>"""

content = content.replace(avatar_old, avatar_new)

with open('src/components/ProfileScreen.tsx', 'w') as f:
    f.write(content)

