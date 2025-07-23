import bcrypt from 'bcryptjs';

const password = 'admin123';
const saltRounds = 10;

console.log('Generating hash for password:', password);

// Generate hash
const hash = bcrypt.hashSync(password, saltRounds);
console.log('\nGenerated hash:', hash);

// Verify it works
const isValid = bcrypt.compareSync(password, hash);
console.log('Verification:', isValid ? 'SUCCESS' : 'FAILED');

console.log('\nSQL to update admin user:');
console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@caplocations.com';`);