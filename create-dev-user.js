// Script to create a developer user in the database
import 'dotenv/config';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool } from '@neondatabase/serverless';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createDevUser() {
  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if the dev user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      ['developer']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('Developer user already exists with ID:', existingUser.rows[0].id);
      return existingUser.rows[0];
    }
    
    // Hash the password
    const hashedPassword = await hashPassword('developer');
    
    // Create the developer user
    const result = await pool.query(
      `INSERT INTO users 
      (username, password, email, name, created_at, updated_at, email_verified, firebase_uid, profile_image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        'developer',            // username
        hashedPassword,         // password
        'dev@example.com',      // email
        'Developer User',       // name
        new Date(),             // created_at
        new Date(),             // updated_at
        true,                   // email_verified
        'developer-uid',        // firebase_uid
        null                    // profile_image
      ]
    );

    console.log('Created developer user:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating developer user:', error);
    throw error;
  } finally {
    // Release the database connection
    await pool.end();
  }
}

// Run the function
createDevUser()
  .then(() => console.log('Developer user creation process completed'))
  .catch(err => console.error('Failed to create developer user:', err));