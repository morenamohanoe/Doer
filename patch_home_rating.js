const fs = require('fs');
let code = fs.readFileSync('src/components/HomeFeed.tsx', 'utf8');

code = code.replace(
  '    : "5.0";',
  '    : "0.0";'
);
code = code.replace(
  '    : "5.0";',
  '    : "0.0";'
);
code = code.replace(
  '/ dr.length : 5.0;',
  '/ dr.length : 0.0;'
);

fs.writeFileSync('src/components/HomeFeed.tsx', code);
