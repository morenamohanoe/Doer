const fs = require('fs');
let code = fs.readFileSync('src/components/DoerProfileModal.tsx', 'utf8');

// Compute dynamically
code = code.replace(
  "const doerReviews = reviews.filter((r) => r.targetId === profile.id);",
  `const doerReviews = reviews.filter((r) => r.targetId === profile.id);
  const dynamicReviewCount = doerReviews.length;
  const dynamicAverageRating = dynamicReviewCount > 0 
    ? (doerReviews.reduce((acc, curr) => acc + curr.rating, 0) / dynamicReviewCount).toFixed(1)
    : "5.0";`
);

// Replace profile.reviewCount with dynamicReviewCount
code = code.replace(/profile\.reviewCount/g, "dynamicReviewCount");

// Replace profile.rating || 5.0 with dynamicAverageRating
code = code.replace(/profile\.rating \|\| 5\.0/g, "dynamicAverageRating");

fs.writeFileSync('src/components/DoerProfileModal.tsx', code);
