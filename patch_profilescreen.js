const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileScreen.tsx', 'utf8');

code = code.replace(
  "import DynamicPricingCalculator from './DynamicPricingCalculator';",
  "import DynamicPricingCalculator from './DynamicPricingCalculator';\nimport ProfileQRCodeModal from './ProfileQRCodeModal';"
);

code = code.replace(
  "const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);",
  "const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);\n  const [isQRModalOpen, setIsQRModalOpen] = useState(false);"
);

// Add the Share button next to Edit Profile
code = code.replace(
  "          {/* Interactive Edit Profile Toggle */}",
  `          {/* Interactive Edit Profile Toggle */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => {
                triggerSound('click');
                setIsEditing(!isEditing);
              }}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" /> {isEditing ? 'Close Editor' : 'Edit Profile'}
            </button>
            <button
              onClick={() => {
                triggerSound('click');
                setIsQRModalOpen(true);
              }}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg> Share QR Code
            </button>
          </div>`
);

// Remove the old button
code = code.replace(
  `          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                triggerSound('click');
                setIsEditing(!isEditing);
              }}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border border-slate-200 transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" /> {isEditing ? 'Close Editor' : 'Edit Profile & Media URLs'}
            </button>
          </div>`,
  ""
);

// Add the ProfileQRCodeModal at the end
code = code.replace(
  "      <VerificationDetailsModal",
  `      <ProfileQRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        profileId={profile.id} 
        profileName={profile.displayName} 
      />\n\n      <VerificationDetailsModal`
);

fs.writeFileSync('src/components/ProfileScreen.tsx', code);
