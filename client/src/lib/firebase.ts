import { initializeApp, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";

// Your web app's Firebase configuration
// Use environment variables when available, fallback to hardcoded values for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCcee7zDDBdRxERO4r7XIeiyGPDOr62mWU",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "sonata-cde46"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sonata-cde46",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "sonata-cde46"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:250480997888:web:617bdcb3b0bc6b154c8ae5",
  measurementId: "G-2WJ4NNT10C"
};

// Initialize Firebase only once - prevent duplicate initialization
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  // If the app is already initialized, get the existing one
  if (error.code === 'app/duplicate-app') {
    console.warn('Firebase app already initialized, using existing instance');
    app = getApp(); // Get the existing app instance
  } else {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google sign-in function
export const signInWithGoogle = async () => {
  try {
    // Add domain verification check to provide better error messages
    const currentDomain = window.location.hostname;
    // Add additional scopes for email and profile
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    
    // Use signInWithPopup for better compatibility across browsers
    const result = await signInWithPopup(auth, googleProvider);
    // This just returns the user object, since we're not using token verification
    const user = result.user;
    
    // Add domain to console for debugging
    console.log(`Successfully authenticated on domain: ${currentDomain}`);
    
    // Return user for client-side auth
    return { user };
  } catch (error: any) {
    console.error("Error during Google sign in:", error);
    // Check for specific Firebase auth errors
    if (error.code === 'auth/unauthorized-domain') {
      console.error(`Domain ${window.location.hostname} is not authorized in Firebase.`);
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.warn("Sign-in popup was closed by the user before completing the sign-in.");
    }
    throw error;
  }
};

// Sign out function
export const firebaseSignOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error: any) {
    console.error("Error signing out:", error);
    return false;
  }
};

export { auth };