// database/seed.js
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🌱 Running Prisma seed via db/seed.js → prisma/seed.js...');

  const seedModulePath = path.join(__dirname, '..', 'prisma', 'seed.js');

  // Dynamically import the Prisma seeder
  const seedModule = await import(seedModulePath);

  // If prisma/seed.js exposes a default function (recommended: runPrismaSeed),
  // we call it. Otherwise, we assume prisma/seed.js runs its own main() on import.
  if (typeof seedModule.default === 'function') {
    console.log('🔁 Detected default export in prisma/seed.js – invoking it...');
    await seedModule.default();
  } else {
    console.log('ℹ️ No default export in prisma/seed.js – assuming it executed on import.');
  }
}

main()
  .then(() => {
    console.log('✅ Database seeded successfully (Prisma seed)');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error while seeding database:');
    console.error(err);
    process.exit(1);
  });
  