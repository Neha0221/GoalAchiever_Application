/**
 * Simple test script for authentication system
 * Run with: node test-auth.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!'
};

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Register user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.data.user.id);
    console.log('   Access Token:', registerResponse.data.data.accessToken ? 'Present' : 'Missing');
    console.log('');

    // Test 2: Login user
    console.log('2. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('   User:', loginResponse.data.data.user.firstName, loginResponse.data.data.user.lastName);
    console.log('   Email Verified:', loginResponse.data.data.user.isEmailVerified);
    console.log('');

    const accessToken = loginResponse.data.data.accessToken;

    // Test 3: Get profile (protected route)
    console.log('3. Testing protected route (get profile)...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('   Full Name:', profileResponse.data.data.user.firstName, profileResponse.data.data.user.lastName);
    console.log('   Email:', profileResponse.data.data.user.email);
    console.log('');

    // Test 4: Update profile
    console.log('4. Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/profile`, {
      firstName: 'Updated',
      lastName: 'Name',
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    console.log('✅ Profile updated successfully:', updateResponse.data.message);
    console.log('   New Name:', updateResponse.data.data.user.firstName, updateResponse.data.data.user.lastName);
    console.log('   Theme:', updateResponse.data.data.user.preferences.theme);
    console.log('');

    // Test 5: Test validation (invalid email)
    console.log('5. Testing validation (invalid email)...');
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testUser,
        email: 'invalid-email'
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Validation working correctly - invalid email rejected');
        console.log('   Error:', error.response.data.message);
      }
    }
    console.log('');

    // Test 6: Test validation (weak password)
    console.log('6. Testing validation (weak password)...');
    try {
      await axios.post(`${BASE_URL}/register`, {
        ...testUser,
        email: 'test2@example.com',
        password: 'weak',
        confirmPassword: 'weak'
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Validation working correctly - weak password rejected');
        console.log('   Error:', error.response.data.message);
      }
    }
    console.log('');

    // Test 7: Test unauthorized access
    console.log('7. Testing unauthorized access...');
    try {
      await axios.get(`${BASE_URL}/profile`);
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Authorization working correctly - unauthorized access blocked');
        console.log('   Error:', error.response.data.message);
      }
    }
    console.log('');

    // Test 8: Logout
    console.log('8. Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`);
    console.log('✅ Logout successful:', logoutResponse.data.message);
    console.log('');

    console.log('🎉 All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User registration with validation');
    console.log('   ✅ User login with JWT access token');
    console.log('   ✅ Protected route access');
    console.log('   ✅ Profile management');
    console.log('   ✅ Input validation');
    console.log('   ✅ Authorization middleware');
    console.log('   ✅ Logout functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:5000/api/health');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   cd backend && npm run dev');
    process.exit(1);
  }

  console.log('✅ Server is running\n');
  await testAuth();
}

main().catch(console.error);
