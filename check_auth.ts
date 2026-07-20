import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import "dotenv/config";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    const userCred = await signInWithEmailAndPassword(auth, "morenamohanoe@gmail.com", "password123");
    console.log("Provider Data:", userCred.user.providerData);
  } catch(e) {
    console.log("error", e.message);
  }
  process.exit(0);
}
test();
