#!/usr/bin/env node

/**
 * Comprehensive Admin System Test
 * Tests all admin endpoints to ensure they're working correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';
let authToken = null;

// Test utilities
const log = (message) => console.log(`✅ ${message}`);
const error = (message) => console.log(`❌ ${message}`);
const info = (message) => console.log(`ℹ️  ${message}`);

// HTTP utilities
const request = async (method, endpoint, data = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const result = await response.json();
  
  return {
    status: response.status,
    data: result,
    ok: response.ok
  };
};

// Test login
async function testLogin() {
  info('Testing login...');
  
  const response = await request('POST', '/api/auth/login', {
    email: 'admin@test.com',
    password: 'password123'
  });

  if (response.ok && response.data.token) {
    authToken = response.data.token;
    log('Login successful');
    return true;
  } else {
    error('Login failed: ' + JSON.stringify(response.data));
    return false;
  }
}

// Test user management
async function testUserManagement() {
  info('Testing user management...');
  
  // Get all users
  const usersResponse = await request('GET', '/api/admin/users');
  if (usersResponse.ok) {
    log(`Found ${usersResponse.data.data.length} users`);
  } else {
    error('Failed to get users: ' + JSON.stringify(usersResponse.data));
    return false;
  }

  // Create a test user
  const createUserResponse = await request('POST', '/api/admin/users', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'viewer'
  });

  if (createUserResponse.ok) {
    log('User created successfully');
    
    // Update the user
    const userId = createUserResponse.data.data.id;
    const updateResponse = await request('PUT', `/api/admin/users/${userId}`, {
      name: 'Updated Test User',
      role: 'support'
    });

    if (updateResponse.ok) {
      log('User updated successfully');
    } else {
      error('Failed to update user: ' + JSON.stringify(updateResponse.data));
    }

    // Delete the user
    const deleteResponse = await request('DELETE', `/api/admin/users/${userId}`);
    if (deleteResponse.ok) {
      log('User deleted successfully');
    } else {
      error('Failed to delete user: ' + JSON.stringify(deleteResponse.data));
    }
  } else {
    error('Failed to create user: ' + JSON.stringify(createUserResponse.data));
    return false;
  }

  return true;
}

// Test system settings
async function testSystemSettings() {
  info('Testing system settings...');
  
  // Get settings
  const getResponse = await request('GET', '/api/admin/settings');
  if (getResponse.ok) {
    log('Settings retrieved successfully');
    
    // Update settings
    const settings = getResponse.data.data;
    settings.companyName = 'Test Company Updated';
    
    const updateResponse = await request('PUT', '/api/admin/settings', settings);
    if (updateResponse.ok) {
      log('Settings updated successfully');
    } else {
      error('Failed to update settings: ' + JSON.stringify(updateResponse.data));
    }
  } else {
    error('Failed to get settings: ' + JSON.stringify(getResponse.data));
    return false;
  }

  return true;
}

// Test customer access management
async function testCustomerAccessManagement() {
  info('Testing customer access management...');
  
  // Get customer access list
  const accessResponse = await request('GET', '/api/admin/customer-access');
  if (accessResponse.ok) {
    log(`Found ${accessResponse.data.data.length} customers with access`);
  } else {
    error('Failed to get customer access: ' + JSON.stringify(accessResponse.data));
    return false;
  }

  // Get customers without access
  const noAccessResponse = await request('GET', '/api/admin/customers-without-access');
  if (noAccessResponse.ok) {
    log(`Found ${noAccessResponse.data.data.length} customers without access`);
  } else {
    error('Failed to get customers without access: ' + JSON.stringify(noAccessResponse.data));
    return false;
  }

  return true;
}

// Test staff routes
async function testStaffRoutes() {
  info('Testing staff routes...');
  
  // Get staff customers
  const customersResponse = await request('GET', '/api/staff/customers');
  if (customersResponse.ok) {
    log(`Found ${customersResponse.data.data.length} customers in staff view`);
  } else {
    error('Failed to get staff customers: ' + JSON.stringify(customersResponse.data));
    return false;
  }

  // Get staff statistics
  const statsResponse = await request('GET', '/api/staff/stats');
  if (statsResponse.ok) {
    log(`Staff stats: ${JSON.stringify(statsResponse.data.data)}`);
  } else {
    error('Failed to get staff stats: ' + JSON.stringify(statsResponse.data));
    return false;
  }

  return true;
}

// Test backup functionality
async function testBackup() {
  info('Testing backup functionality...');
  
  const backupResponse = await request('POST', '/api/admin/backup');
  if (backupResponse.ok) {
    log('Backup created successfully');
    log(`Backup info: ${JSON.stringify(backupResponse.data.data)}`);
  } else {
    error('Failed to create backup: ' + JSON.stringify(backupResponse.data));
    return false;
  }

  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Admin System Tests...\n');

  try {
    // Test login first
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Login failed - cannot proceed with other tests');
      return;
    }

    // Run all tests
    const tests = [
      { name: 'User Management', fn: testUserManagement },
      { name: 'System Settings', fn: testSystemSettings },
      { name: 'Customer Access Management', fn: testCustomerAccessManagement },
      { name: 'Staff Routes', fn: testStaffRoutes },
      { name: 'Backup Functionality', fn: testBackup }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`\n📋 Running ${test.name} tests...`);
      try {
        const result = await test.fn();
        if (result) {
          passed++;
          log(`${test.name} tests passed`);
        } else {
          failed++;
          error(`${test.name} tests failed`);
        }
      } catch (err) {
        failed++;
        error(`${test.name} tests failed with error: ${err.message}`);
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Admin system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('💥 Test runner failed:', error);
  }
}

// Run the tests
runTests();