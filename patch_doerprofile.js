const fs = require('fs');
let code = fs.readFileSync('src/components/DoerProfileModal.tsx', 'utf8');

code = code.replace(
  "import ConfirmationModal from './ConfirmationModal';",
  "import ConfirmationModal from './ConfirmationModal';\nimport ProfileQRCodeModal from './ProfileQRCodeModal';"
);

code = code.replace(
  "const [activeTab, setActiveTab] = useState('portfolio');",
  "const [activeTab, setActiveTab] = useState('portfolio');\n  const [isQRModalOpen, setIsQRModalOpen] = useState(false);"
);

code = code.replace(
  `        {/* Top Header Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => {
              triggerSound('click');
              handleShare(profile.displayName, \`Check out \${profile.displayName}'s profile on our app!\`);
            }}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-all shadow-md backdrop-blur-xs flex items-center justify-center group cursor-pointer"
            title="Share Profile"
          >`,
  `        {/* Top Header Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => {
              triggerSound('click');
              setIsQRModalOpen(true);
            }}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-all shadow-md backdrop-blur-xs flex items-center justify-center group cursor-pointer"
            title="Show QR Code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
          </button>
          <button
            onClick={() => {
              triggerSound('click');
              handleShare(profile.displayName, \`Check out \${profile.displayName}'s profile on our app!\`);
            }}
            className="p-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-all shadow-md backdrop-blur-xs flex items-center justify-center group cursor-pointer"
            title="Share Profile"
          >`
);

code = code.replace(
  "        {/* Full View Content Layer */}",
  `        {/* Full View Content Layer */}
        
        <ProfileQRCodeModal 
          isOpen={isQRModalOpen} 
          onClose={() => setIsQRModalOpen(false)} 
          profileId={profile.id} 
          profileName={profile.displayName} 
        />`
);

fs.writeFileSync('src/components/DoerProfileModal.tsx', code);
