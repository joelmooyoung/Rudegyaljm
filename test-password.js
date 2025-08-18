const bcrypt = require('bcryptjs');

async function testPasswords() {
  const storedHash = '$2b$12$HO054Mcqt49KWYBRM6nC2.HZmQDrFA4JToLtN2v0mTHwzSKSGXH4W';
  
  console.log('Testing Admin123:', await bcrypt.compare('Admin123', storedHash));
  console.log('Testing admin123:', await bcrypt.compare('admin123', storedHash));
  console.log('Testing ADMIN123:', await bcrypt.compare('ADMIN123', storedHash));
}

testPasswords().catch(console.error);
