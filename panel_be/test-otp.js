const jwt = require('jsonwebtoken');

// Generate a test token for user ID 1 with correct email
const token = jwt.sign(
  { userId: 1, email: 'info@samplizy.com', role: 'admin' },
  'fallback_secret',
  { expiresIn: '7d' }
);

console.log('Generated token:', token);

// Test the endpoint using curl
const { exec } = require('child_process');

const curlCommand = `curl -X POST http://localhost:5001/api/auth/request-password-change-otp -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{}'`;

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  console.log('Response:', stdout);
}); 