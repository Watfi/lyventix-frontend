const http = require('http');

const data = JSON.stringify({
  username: 'testuser' + Math.floor(Math.random() * 1000),
  email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  phone: '1234567890',
  businessName: 'Test Business',
  businessType: 'RETAIL',
  country: 'Colombia',
  address: '123 Test St',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  theme: 'amber',
  language: 'es',
  currency: 'COP'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
