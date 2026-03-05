import { db } from '../server/db';
import { users } from '../shared/schema';

async function seed() {
  const result = await db.insert(users).values({ username: 'matt', password: 'thirdweb-auth', walletAddress: 'mattwright.eth' }).returning();
  console.log('Seeded user:', JSON.stringify(result));
  process.exit(0);
}

seed();
