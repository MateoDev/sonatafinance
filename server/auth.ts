import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

// Enhanced password hashing with more secure parameters
export async function hashPassword(password: string) {
  // Using a larger salt for increased security
  const salt = randomBytes(32).toString("hex");
  // Increase key length for better security
  const buf = (await scryptAsync(password, salt, 128)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    // Use same parameters as in hashPassword
    const suppliedBuf = (await scryptAsync(supplied, salt, 128)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false; // Secure failure mode
  }
}

// Function to generate secure random tokens for password reset
export async function generateResetToken() {
  return randomBytes(40).toString('hex');
}

export function setupAuth(app: Express) {
  // Use the session store from the storage implementation
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "personal-finance-app-session-secret",
    resave: false,
    saveUninitialized: false, // Only create session when user logs in
    store: storage.sessionStore,
    name: 'sonata.sid', // Custom name to avoid default name
    cookie: {
      secure: true, // Always secure for HTTPS domains
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      sameSite: 'none', // Required for cross-origin between domain and Replit
      domain: '.sonatafinance.ai', // Allow subdomains
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        // Always use the constant-time comparison function
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Update last login timestamp
        await storage.updateUserLastLogin(user.id);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint with stronger validation
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        // Send user info without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  });

  // Standard login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        // Send user info without password
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Firebase auth integration endpoint
  app.post("/api/auth/firebase", async (req, res, next) => {
    try {
      // Support both formats: userData format from routes.ts and firebaseUser format from auth.ts
      // Extract the user data from the appropriate field based on what's available
      const firebaseUser = req.body.firebaseUser || req.body.userData;
      
      console.log('Firebase auth endpoint in auth.ts called with:', JSON.stringify({
        body: req.body,
        extractedUser: firebaseUser
      }, null, 2));
      
      if (!firebaseUser || !firebaseUser.uid) {
        return res.status(400).json({ error: "Invalid Firebase user data" });
      }
      
      // First try finding user by Firebase UID
      let user = await storage.getUserByFirebaseUid(firebaseUser.uid);
      
      // If not found by Firebase UID, try by email as they might have registered with email before
      if (!user && firebaseUser.email) {
        user = await storage.getUserByEmail(firebaseUser.email);
        
        // If found by email, update their Firebase UID
        if (user) {
          console.log(`User found by email ${firebaseUser.email}, updating their Firebase UID`);
          await storage.updateUserFirebaseInfo(
            user.id, 
            firebaseUser.uid, 
            firebaseUser.emailVerified || false,
            firebaseUser.photoURL || null
          );
        }
      }
      
      // If still no user, create a new one
      if (!user) {
        console.log(`Creating new user for ${firebaseUser.email} with Firebase UID ${firebaseUser.uid}`);
        // The password is a random string that can't be used for direct login
        // since the user will authenticate via Firebase
        const randomPassword = await hashPassword(randomBytes(32).toString('hex'));
        
        // Generate a unique username using timestamp to avoid conflicts
        const timestamp = Date.now().toString(36);
        const emailPrefix = firebaseUser.email.split('@')[0];
        const uniqueUsername = `${emailPrefix}_${timestamp}`;
        
        // Create the new user - first create with basic info
        user = await storage.createUser({
          username: uniqueUsername,
          password: randomPassword,
          email: firebaseUser.email,
          name: firebaseUser.displayName || '',
          profileImage: firebaseUser.photoURL || ''
        });
        
        // Then update with Firebase-specific fields
        await db.update(users)
          .set({ 
            firebaseUid: firebaseUser.uid,
            emailVerified: firebaseUser.emailVerified || false,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Firebase auth error:", error);
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        // Clear the cookie on the client
        res.clearCookie('sonata.sid');
        res.sendStatus(200);
      });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    // Send user info without password
    const { password, ...userWithoutPassword } = req.user as Express.User;
    res.json(userWithoutPassword);
  });

  // Request password reset endpoint
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    try {
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        // Generate a reset token and store it with expiry
        const resetToken = await generateResetToken();
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour
        
        await storage.updateUserResetToken(user.id, resetToken, resetTokenExpiry);
        
        // For production: Use SendGrid to send email with reset link
        if (process.env.SENDGRID_API_KEY) {
          // Import SendGrid only when needed and key is available
          const emailService = await import('./email-service');
          const { sendEmail } = emailService;
          
          const resetUrl = `${process.env.APP_URL || 'https://sonata.replit.app'}/reset-password?token=${resetToken}`;
          
          await sendEmail({
            to: email,
            from: 'noreply@sonata-finance.app',
            subject: 'Reset Your Sonata Password',
            html: `
              <h1>Reset Your Password</h1>
              <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
              <a href="${resetUrl}">Reset Password</a>
            `
          });
        } else {
          // For development, just log the token
          console.log(`Password reset token for ${email}: ${resetToken}`);
        }
      }
      
      // Always return success regardless of whether email exists for security
      res.status(200).json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link will be sent."
      });
    } catch (error) {
      console.error('Error in forgot password:', error);
      // Still return success to not leak information about registered emails
      res.status(200).json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link will be sent."
      });
    }
  });
  
  // Reset password endpoint
  app.post("/api/reset-password", async (req, res, next) => {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }
    
    try {
      // Find user by reset token and check if token is not expired
      const user = await storage.getUserByResetToken(token);
      
      if (!user || !user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      // Update password and clear token
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clear the reset token
      await storage.clearUserResetToken(user.id);
      
      res.status(200).json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  });
}