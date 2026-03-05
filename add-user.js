import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Hash password function
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Directly adding a user to the database
async function addUser() {
  const USER_EMAIL = 'matt.d.wright88@gmail.com';
  const USER_PASSWORD = 'Password123!';
  const USER_NAME = 'Matt Wright';
  
  try {
    // Hash the password
    const hashedPassword = await hashPassword(USER_PASSWORD);
    
    // Create SQL query to insert the user
    const query = `
      INSERT INTO users (username, password, name, email)
      VALUES ('${USER_EMAIL}', '${hashedPassword}', '${USER_NAME}', '${USER_EMAIL}')
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, name, email;
    `;
    
    console.log('SQL query prepared:', query);
    console.log('User credentials to try: ' + USER_EMAIL + ' / ' + USER_PASSWORD);
    console.log('Please run this SQL query using the execute_sql_tool');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
addUser();