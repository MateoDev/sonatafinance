import { storage } from './server/storage.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Hash password function
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// User information
const USER_EMAIL = 'matt.d.wright88@gmail.com';
const USER_PASSWORD = 'Password123!';
const USER_NAME = 'Matt Wright';

async function createUser() {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(USER_EMAIL);
    
    if (existingUser) {
      console.log(`User with email ${USER_EMAIL} already exists. No need to create a new account.`);
      return existingUser;
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(USER_PASSWORD);
    
    // Create user object
    const userToCreate = {
      username: USER_EMAIL,
      email: USER_EMAIL,
      password: hashedPassword,
      name: USER_NAME
    };
    
    // Create the user
    const createdUser = await storage.createUser(userToCreate);
    console.log(`User created successfully with email: ${USER_EMAIL}`);
    
    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Execute the create user function
createUser().then(user => {
  if (user) {
    console.log('User account setup complete.');
    console.log(`Login credentials: ${USER_EMAIL} / ${USER_PASSWORD}`);
    console.log('User details:', user);
  }
  process.exit(0);
}).catch(err => {
  console.error('Fatal error during user creation:', err);
  process.exit(1);
});