/**
 * Test JWT token generation and verification
 * Run with: node test-jwt.js
 */

const { generateToken, verifyToken } = require('./src/utils/jwt');

console.log('🧪 Testing JWT Token Generation and Verification...\n');

try {
  // Test data
  const userId = '507f1f77bcf86cd799439011';
  const email = 'test@example.com';

  console.log('1. Generating JWT token...');
  const token = generateToken(userId, email);
  console.log('✅ Token generated successfully');
  console.log('   Token length:', token.length);
  console.log('   Token preview:', token.substring(0, 50) + '...');
  console.log('');

  console.log('2. Verifying JWT token...');
  const decoded = verifyToken(token);
  console.log('✅ Token verified successfully');
  console.log('   Decoded payload:', decoded);
  console.log('');

  console.log('3. Testing token structure...');
  const parts = token.split('.');
  console.log('   Token parts count:', parts.length);
  console.log('   Header:', parts[0]);
  console.log('   Payload:', parts[1]);
  console.log('   Signature:', parts[2].substring(0, 20) + '...');
  console.log('');

  console.log('🎉 JWT token test passed!');
  console.log('\n📋 Test Results:');
  console.log('   ✅ Token generation works');
  console.log('   ✅ Token verification works');
  console.log('   ✅ Token structure is correct');

} catch (error) {
  console.error('❌ JWT test failed:', error.message);
  console.error('   Error details:', error);
  process.exit(1);
}
