/**
 * FIREBASE SETUP INSTRUCTIONS
 * ===========================
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Firestore Database (production mode)
 * 3. Enable Authentication → Email/Password (for admin only)
 * 4. Create an admin user in Authentication
 * 5. Add a document in Firestore: admins/{adminUserUid} with { role: "admin" }
 * 6. Replace the config below with your project credentials
 * 7. Deploy rules: firebase deploy --only firestore:rules,firestore:indexes
 * 8. Update js/firebase-config.js and deploy to Netlify
 */
const firebaseConfig = {
  apiKey: "AIzaSyDlGSGhSQBgCoaiKZvJTp_gKNUC2wrvcWg",
  authDomain: "udbhoron--19-predictor-fwc-26.firebaseapp.com",
  projectId: "udbhoron--19-predictor-fwc-26",
  storageBucket: "udbhoron--19-predictor-fwc-26.firebasestorage.app",
  messagingSenderId: "774806617321",
  appId: "1:774806617321:web:ffcd4da39f786688954478"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
