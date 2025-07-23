const { db } = require('./dist/db/index.js');
const { customers, users } = require('./dist/db/schema.js');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

async function resetCustomerPassword() {
  console.log('Resetting password for kbehnan@gmail.com...');
  
  // Find the customer
  const customer = await db.select().from(customers).where(eq(customers.email, 'kbehnan@gmail.com'));
  
  if (!customer[0] || !customer[0].userId) {
    console.log('Customer not found or no user account');
    return;
  }
  
  // Hash new password
  const newPassword = 'password123';
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update user password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, customer[0].userId));
  
  console.log('Password reset to: password123');
  process.exit(0);
}

resetCustomerPassword().catch(console.error);