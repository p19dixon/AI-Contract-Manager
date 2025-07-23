import bcrypt from 'bcryptjs';

// Test password comparison directly
const password = 'admin123';
const hash = '$2a$10$XQq2o2Y2XDG5L4JD9mKCOu7XzXSVzP6P4180jM5StqfGYqfMnkDRy';

console.log('Testing password comparison:');
console.log('Password:', password);
console.log('Hash:', hash);

// Test synchronous comparison
const isValid = bcrypt.compareSync(password, hash);
console.log('\nSync comparison result:', isValid);

// Test async comparison
bcrypt.compare(password, hash)
  .then(result => {
    console.log('Async comparison result:', result);
  })
  .catch(err => {
    console.error('Error:', err);
  });