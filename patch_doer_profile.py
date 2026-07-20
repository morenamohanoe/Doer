import re

with open('src/components/DoerProfileModal.tsx', 'r') as f:
    content = f.read()

# Add viewingImage state
state_code = """  const [viewingImage, setViewingImage] = useState<string | null>(null);"""

if 'setViewingImage' not in content:
    content = content.replace("const [showEduTooltip, setShowEduTooltip] = useState(false);", f"const [showEduTooltip, setShowEduTooltip] = useState(false);\n{state_code}")

# Update Cover image to be clickable
cover_old = """        {/* PROFILE COVER BANNER */}
        <div className="h-40 md:h-48 w-full relative bg-slate-200 overflow-hidden">
          {profile.coverImageUrl ? (
            <img src={profile.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          ) : ("""

cover_new = """        {/* PROFILE COVER BANNER */}
        <div className="h-40 md:h-48 w-full relative bg-slate-200 overflow-hidden">
          {profile.coverImageUrl ? (
            <img onClick={() => setViewingImage(profile.coverImageUrl)} src={profile.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover cursor-pointer" />
          ) : ("""
content = content.replace(cover_old, cover_new)

# Update Avatar to be clickable
avatar_src_logic = "src={profile.profileImageUrl || profile.avatarUrl || (profile.id === 'doer-1' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80' : profile.id === 'doer-2' ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop&q=80' : profile.id === 'doer-4' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80' : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&fit=crop&q=80')}"
avatar_alt = "alt={isOwnProfile ? `${currentUser.firstName} ${currentUser.lastName}` : profile.title}"

avatar_old = f"""            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-white flex-shrink-0">
              <img
                {avatar_src_logic}
                {avatar_alt}
                className="w-full h-full object-cover"
              />
            </div>"""

avatar_new = f"""            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-white flex-shrink-0">
              <img
                onClick={{(e) => setViewingImage(e.currentTarget.src)}}
                {avatar_src_logic}
                {avatar_alt}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>"""

content = content.replace(avatar_old, avatar_new)

# Add Lightbox at the end
render_additions = """      <AnimatePresence>
        {viewingImage && (
          <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4">
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2">
              <X className="w-8 h-8" />
            </button>
            <img src={viewingImage} alt="Fullscreen View" className="max-w-full max-h-full object-contain" />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}"""

content = re.sub(r'    </motion\.div>\n  \);\n}', render_additions, content)

with open('src/components/DoerProfileModal.tsx', 'w') as f:
    f.write(content)
