// scripts/reset-dev-passwords.js
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

async function resetDevPasswords() {
  const accounts = [
    { email: 'admin@jumuiya.com',   password: 'Admin123!' },
    { email: 'auditor@jumuiya.com', password: 'Auditor123!' },
    { email: 'guide@jumuiya.com',   password: 'Guide123!' },
    { email: 'user@jumuiya.com',    password: 'User123!' },
    { email: 'test@jumuiya.com',    password: 'Test123!' },
  ];

  for (const { email, password } of accounts) {
    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      'UPDATE "User" SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hash, email]
    );

    if (result.rows.length) {
      console.log(`✅ Reset password for ${email}`);
    } else {
      console.log(`⚠️ No user found for ${email}, skipped`);
    }
  }

  process.exit(0);
}

resetDevPasswords().catch((err) => {
  console.error('Error resetting dev passwords:', err);
  process.exit(1);
});
