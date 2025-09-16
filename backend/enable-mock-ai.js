const fs = require('fs');
const path = require('path');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Add or update USE_MOCK_AI setting
if (envContent.includes('USE_MOCK_AI=')) {
  envContent = envContent.replace(/USE_MOCK_AI=.*/, 'USE_MOCK_AI=true');
} else {
  envContent += '\n# Enable Mock AI Service for Testing (NO RATE LIMITS!)\nUSE_MOCK_AI=true\n';
}

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Mock AI Service enabled for testing!');
console.log('🤖 You can now test your AI tutor without any rate limits!');
console.log('📝 To disable mock AI, set USE_MOCK_AI=false in your .env file');
console.log('🚀 Restart your server to apply changes');
