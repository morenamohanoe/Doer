const fs = require('fs');
let code = fs.readFileSync('src/components/DoerProfileModal.tsx', 'utf8');

// Replace the fallback for dynamicAverageRating
code = code.replace(
  '    : "5.0";',
  '    : "0.0";'
);

fs.writeFileSync('src/components/DoerProfileModal.tsx', code);
