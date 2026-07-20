const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
const reviewRule = `
      // User Reviews: Users can read all reviews, create reviews for others, delete their own
      match /reviews/{reviewId} {
        allow read: if true;
        allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid && request.resource.data.targetId != request.auth.uid;
        allow update: if isAuthenticated() && resource.data.authorId == request.auth.uid;
        allow delete: if isAdmin() || (isAuthenticated() && resource.data.authorId == request.auth.uid);
      }
`;
rules = rules.replace('match /user_verifications/{uid} {', reviewRule + '\n      match /user_verifications/{uid} {');
fs.writeFileSync('firestore.rules', rules);
