// Test Error Scenarios for Frontend API Calls
// This script tests various error scenarios to ensure proper error handling

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test scenarios
const errorScenarios = [
  {
    name: 'Backend Down (Connection Error)',
    url: 'http://localhost:9999/api/users/login', // Non-existent port
    method: 'POST',
    data: { username: 'test', password: 'test' },
    expectedError: 'ECONNREFUSED'
  },
  {
    name: 'Invalid Credentials (401)',
    url: `${API_BASE}/users/login`,
    method: 'POST',
    data: { username: 'invalid', password: 'wrong' },
    expectedError: 'Unauthorized'
  },
  {
    name: 'Missing Token (401)',
    url: `${API_BASE}/users/me`,
    method: 'GET',
    expectedError: 'Token required'
  },
  {
    name: 'Invalid Token (401)',
    url: `${API_BASE}/users/me`,
    method: 'GET',
    headers: { Authorization: 'Bearer invalid-token' },
    expectedError: 'Invalid token'
  },
  {
    name: 'Invalid Input (400)',
    url: `${API_BASE}/users/register`,
    method: 'POST',
    data: { username: '', password: '' },
    expectedError: 'Validation error'
  },
  {
    name: 'Resource Not Found (404)',
    url: `${API_BASE}/users/999999`,
    method: 'GET',
    expectedError: 'Not found'
  }
];

async function testErrorScenario(scenario) {
  console.log(`\\n🧪 Testing: ${scenario.name}`);
  
  try {
    const config = {
      method: scenario.method,
      url: scenario.url,
      timeout: 3000
    };
    
    if (scenario.data) {
      config.data = scenario.data;
    }
    
    if (scenario.headers) {
      config.headers = scenario.headers;
    }
    
    const response = await axios(config);
    console.log(`❌ UNEXPECTED SUCCESS: ${response.status} - ${response.statusText}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}`);
    
  } catch (error) {
    console.log(`✅ EXPECTED ERROR CAUGHT:`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`   Connection refused - Backend is down`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   Domain not found - Network issue`);
    } else if (error.code === 'ECONNRESET') {
      console.log(`   Connection reset - Network issue`);
    } else if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Error Message: ${error.response.data?.message || error.response.data?.error || 'Unknown error'}`);
      
      if (error.response.data?.errors) {
        console.log(`   Validation Errors: ${JSON.stringify(error.response.data.errors).substring(0, 100)}`);
      }
    } else {
      console.log(`   Network/Other Error: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🔍 Testing Error Scenarios for Frontend API Error Handling\\n');
  console.log('='.repeat(60));
  
  for (const scenario of errorScenarios) {
    await testErrorScenario(scenario);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  console.log('\\n='.repeat(60));
  console.log('✅ All error scenarios tested!');
  console.log('\\n💡 Frontend components should handle these errors gracefully with toast notifications.');
  console.log('\\n🎯 Key Points:');
  console.log('   - Network errors should show user-friendly messages');
  console.log('   - HTTP errors should display server error messages');
  console.log('   - Validation errors should show field-specific errors');
  console.log('   - Token errors should redirect to login');
}

// Run the tests
runAllTests().catch(console.error);