const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiaW5mb0BzYW1wbGl6eS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTIyOTI0MzgsImV4cCI6MTc1Mjg5NzIzOH0.i-z9Yia1PO5cu50Me1rrXXx6pmhhEzAGj30fApOGJEc';

try {
  const decoded = jwt.verify(token, 'fallback_secret');
  console.log('✅ Token verified successfully');
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
} 