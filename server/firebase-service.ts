import { storage } from './storage';
import { hashPassword } from './auth';

// Since we're not using the Admin SDK due to service account restrictions,
// we'll use the Firebase user's information sent directly from the client
// This function processes the user data sent from the client after Firebase authentication
export async function processFirebaseUser(firebaseUser: any) {
  try {
    console.log('Processing Firebase user data:', JSON.stringify(firebaseUser, null, 2));
    
    if (!firebaseUser || !firebaseUser.email) {
      console.error('Invalid Firebase user data received:', firebaseUser);
      throw new Error('Invalid Firebase user data: missing email');
    }
    
    // Check if user exists by email
    let user = await storage.getUserByEmail(firebaseUser.email);
    console.log('Existing user found by email?', !!user);
    
    // If user doesn't exist, create a new user
    if (!user) {
      // Generate a random password for the user (they'll authenticate via Firebase)
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hashPassword(randomPassword);
      
      const newUserData = {
        username: firebaseUser.email?.split('@')[0] || `user_${Date.now()}`,
        email: firebaseUser.email,
        password: hashedPassword,
        name: firebaseUser.displayName || '',
        firebaseUid: firebaseUser.uid,
        emailVerified: firebaseUser.emailVerified || false,
        profileImage: firebaseUser.photoURL || null
      };
      
      console.log('Creating new user with data:', { 
        ...newUserData, 
        password: '******' // Hide password in logs
      });
      
      user = await storage.createUser(newUserData);
      console.log(`New user created from Firebase: ${user.id}`);
    } else {
      // Update existing user with Firebase data
      await storage.updateUserFirebaseInfo(
        user.id, 
        firebaseUser.uid, 
        firebaseUser.emailVerified || false,
        firebaseUser.photoURL || null
      );
      console.log(`Updated existing user ${user.id} with Firebase data`);
      
      // Refresh the user object
      user = await storage.getUserById(user.id);
    }
    
    return user;
  } catch (error) {
    console.error('Error processing Firebase user:', error);
    throw error;
  }
}