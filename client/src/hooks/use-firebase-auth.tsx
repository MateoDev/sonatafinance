import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, firebaseSignOut } from '@/lib/firebase';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface FirebaseAuthContextProps {
  firebaseUser: User | null;
  loading: boolean;
  handleGoogleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextProps | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // Clear any previous auth state data to ensure a clean login
      sessionStorage.removeItem('wasAuthenticated');
      localStorage.removeItem('dashboard_accessible');
      
      setLoading(true);
      
      // Attempt to sign in with Google using our Firebase helper
      const { user } = await signInWithGoogle();
      
      if (user) {
        console.log("Google sign in successful, user:", user.displayName);
        
        // Structure the user data in a format that works with both auth endpoints
        const fbUserData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          // Add additional metadata to help with debugging
          lastLoginAt: new Date().toISOString(),
          domain: window.location.hostname
        };
        
        // Send user data directly to our backend in a format compatible with both endpoints
        // This endpoint will create a new user if one doesn't exist
        const response = await apiRequest('POST', '/api/auth/firebase', { 
          userData: fbUserData,
          firebaseUser: fbUserData // Include both formats to be compatible with all endpoints
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to authenticate with server');
        }
        
        const authUserData = await response.json();
        
        // Update auth data in the query client directly
        queryClient.setQueryData(['/api/user'], authUserData);
        
        // Refresh any queries that may depend on auth status
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        
        // Store authentication state in session storage
        sessionStorage.setItem('wasAuthenticated', 'true');
        localStorage.setItem('dashboard_accessible', 'true');
        
        toast({
          title: 'Success',
          description: `Welcome ${authUserData.name || authUserData.username || user.displayName}!`,
        });
        
        // Redirect to dashboard using Wouter's setLocation
        // This keeps React state intact during navigation
        setTimeout(() => {
          setLocation('/dashboard');
        }, 300);
      } else {
        // This shouldn't happen normally as an error would be thrown earlier,
        // but handle it gracefully just in case
        throw new Error('No user returned from Google sign in');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      
      // Show a more helpful message for common Firebase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const currentDomain = window.location.hostname;
        
        // Handle specific Firebase error codes
        switch(error.code) {
          case 'auth/unauthorized-domain':
            toast({
              title: 'Domain Not Authorized',
              description: `This domain (${currentDomain}) needs to be added to Firebase authorized domains. Please add it in the Firebase console under Authentication > Settings > Authorized domains.`,
              variant: 'destructive',
            });
            break;
            
          case 'auth/popup-closed-by-user':
            toast({
              title: 'Sign In Cancelled',
              description: 'You closed the sign in popup before completing authentication.',
              variant: 'default',
            });
            break;
            
          case 'auth/popup-blocked':
            toast({
              title: 'Popup Blocked',
              description: 'The sign in popup was blocked by your browser. Please allow popups for this site and try again.',
              variant: 'destructive',
            });
            break;
            
          default:
            toast({
              title: 'Sign In Failed',
              description: error.message || 'Failed to sign in with Google',
              variant: 'destructive',
            });
        }
      } else {
        // Generic error handling for non-Firebase errors
        toast({
          title: 'Sign In Failed',
          description: error instanceof Error ? error.message : 'Failed to sign in with Google',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
      // Call our backend logout endpoint to clear the session
      await apiRequest('POST', '/api/logout');
      
      // Clear query client data
      queryClient.clear();
      
      // Clear stored auth state
      sessionStorage.removeItem('wasAuthenticated');
      localStorage.removeItem('dashboard_accessible');
      
      toast({
        title: 'Signed Out',
        description: 'You have been signed out successfully',
      });
      
      // Redirect to home page
      setLocation('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign Out Failed',
        description: 'Failed to sign out properly',
        variant: 'destructive',
      });
    }
  };

  return (
    <FirebaseAuthContext.Provider
      value={{
        firebaseUser,
        loading,
        handleGoogleSignIn,
        handleSignOut,
      }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}