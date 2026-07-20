const fs = require('fs');
let code = fs.readFileSync('src/components/HomeFeed.tsx', 'utf8');

// Insert declarations before return
code = code.replace(
  '  // Dynamic Category Rendering\n\n  return (',
  `  // Dynamic Category Rendering

  const selectedDoerReviews = selectedService ? reviews.filter((r) => r.targetId === selectedService.doerId) : [];
  const selectedComputedRating = selectedDoerReviews.length > 0
    ? (selectedDoerReviews.reduce((acc, curr) => acc + curr.rating, 0) / selectedDoerReviews.length).toFixed(1)
    : "5.0";
  const selectedReviewCount = selectedDoerReviews.length;

  return (`
);

fs.writeFileSync('src/components/HomeFeed.tsx', code);
