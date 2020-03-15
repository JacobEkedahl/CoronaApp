export const fbConfig = {
  apiKey: "AIzaSyAtmYK_5Wvl6pvzEu5BwuUWqi3kg1awLng",
  authDomain: "corona-live-updates.firebaseapp.com",
  databaseURL: "https://corona-live-updates.firebaseio.com",
  projectId: "corona-live-updates",
  storageBucket: "corona-live-updates.appspot.com",
  messagingSenderId: "770208119300",
  appId: "1:770208119300:web:6cdc18adacf346c2eb1351",
  measurementId: "G-S9GTCFE311"
};

export const rfConfig = {
  userProfile: "users", // root that user profiles are written to
  useFirestoreForProfile: true, // Save profile to Firestore instead of Real Time Database
  useFirestoreForStorageMeta: true // Metadata associated with storage file uploads goes to Firestore
};
