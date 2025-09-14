/**
 * Debug authentication issues
 * Run with: node debug-auth.js
 */

const { generateToken, verifyToken, JWT_SECRET } = require('./src/utils/jwt');

console.log('🔍 Debugging Authentication Issues...\n');

console.log('1. JWT Secret check:');
console.log('   JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');
console.log('   JWT_SECRET length:', JWT_SECRET ? JWT_SECRET.length : 0);
console.log('');

console.log('2. Environment variables:');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   JWT_SECRET from env:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('');

try {
  console.log('3. Testing token generation...');
  const testUserId = '507f1f77bcf86cd799439011';
  const testEmail = 'test@example.com';
  
  const token = generateToken(testUserId, testEmail);
  console.log('   ✅ Token generated successfully');
  console.log('   Token:', token);
  console.log('');

  console.log('4. Testing token verification...');
  const decoded = verifyToken(token);
  console.log('   ✅ Token verified successfully');
  console.log('   Decoded:', decoded);
  console.log('');

  console.log('5. Testing with different secret...');
  const jwt = require('jsonwebtoken');
  const wrongSecret = 'wrong-secret';
  
  try {
    jwt.verify(token, wrongSecret);
    console.log('   ❌ Token verified with wrong secret (this should not happen)');
  } catch (error) {
    console.log('   ✅ Token correctly rejected with wrong secret');
    console.log('   Error:', error.message);
  }

} catch (error) {
  console.error('❌ Debug failed:', error.message);
  console.error('   Stack:', error.stack);
}

console.log('\n🔧 Troubleshooting Tips:');
console.log('   1. Make sure JWT_SECRET is set in your .env file');
console.log('   2. Check that the token is being sent correctly in Authorization header');
console.log('   3. Verify the token format: "Bearer <token>"');
console.log('   4. Check if the token has expired');
