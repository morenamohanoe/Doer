import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ai-studio-doer-5d4a57f4-3066-4fec-a081-9fae989dbe87');

async function run() {
  console.log("Searching users with email morenamohanoe@gmail.com...");
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', 'morenamohanoe@gmail.com'));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("No user found with email morenamohanoe@gmail.com");
  } else {
    snap.forEach((doc) => {
      console.log("USER DOC ID:", doc.id);
      console.log("USER DATA:", JSON.stringify(doc.data(), null, 2));
    });
  }

  console.log("Searching doer_profiles...");
  const doerRef = collection(db, 'doer_profiles');
  const doerSnap = await getDocs(doerRef);
  doerSnap.forEach((doc) => {
    const data = doc.data();
    if (data.displayName?.toLowerCase().includes('morena') || data.userId === snap.docs[0]?.id || doc.id === snap.docs[0]?.id) {
      console.log("DOER_PROFILE DOC ID:", doc.id);
      console.log("DOER_PROFILE DATA:", JSON.stringify(data, null, 2));
    }
  });
}

run().catch(console.error);
