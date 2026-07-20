import re

with open('src/components/DoerProfileModal.tsx', 'r') as f:
    content = f.read()

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
    </div>
  );
}"""

content = re.sub(r'    </div>\n  \);\n}', render_additions, content)

with open('src/components/DoerProfileModal.tsx', 'w') as f:
    f.write(content)
