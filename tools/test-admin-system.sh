#!/bin/bash

# Comprehensive Admin System Test
# Tests all admin endpoints to ensure they're working correctly

BASE_URL="http://localhost:3002"
AUTH_TOKEN=""

echo "🚀 Starting Admin System Tests..."
echo ""

# Test utilities
log() {
    echo "✅ $1"
}

error() {
    echo "❌ $1"
}

info() {
    echo "ℹ️  $1"
}

# Test login
test_login() {
    info "Testing login..."
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@test.com","password":"password123"}')
    
    if echo "$response" | grep -q '"success":true'; then
        AUTH_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        log "Login successful"
        return 0
    else
        error "Login failed: $response"
        return 1
    fi
}

# Test user management
test_user_management() {
    info "Testing user management..."
    
    # Get all users
    response=$(curl -s -X GET "$BASE_URL/api/admin/users" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        user_count=$(echo "$response" | grep -o '"data":\[.*\]' | tr ',' '\n' | wc -l)
        log "Found users in system"
    else
        error "Failed to get users: $response"
        return 1
    fi
    
    return 0
}

# Test system settings
test_system_settings() {
    info "Testing system settings..."
    
    # Get settings
    response=$(curl -s -X GET "$BASE_URL/api/admin/settings" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        log "Settings retrieved successfully"
    else
        error "Failed to get settings: $response"
        return 1
    fi
    
    return 0
}

# Test customer access management
test_customer_access() {
    info "Testing customer access management..."
    
    # Get customer access list
    response=$(curl -s -X GET "$BASE_URL/api/admin/customer-access" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        log "Customer access list retrieved successfully"
    else
        error "Failed to get customer access: $response"
        return 1
    fi
    
    return 0
}

# Test staff routes
test_staff_routes() {
    info "Testing staff routes..."
    
    # Get staff customers
    response=$(curl -s -X GET "$BASE_URL/api/staff/customers" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        log "Staff customers retrieved successfully"
    else
        error "Failed to get staff customers: $response"
        return 1
    fi
    
    # Get staff statistics
    response=$(curl -s -X GET "$BASE_URL/api/staff/stats" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        log "Staff statistics retrieved successfully"
    else
        error "Failed to get staff stats: $response"
        return 1
    fi
    
    return 0
}

# Test backup functionality
test_backup() {
    info "Testing backup functionality..."
    
    response=$(curl -s -X POST "$BASE_URL/api/admin/backup" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$response" | grep -q '"success":true'; then
        log "Backup created successfully"
    else
        error "Failed to create backup: $response"
        return 1
    fi
    
    return 0
}

# Main test runner
run_tests() {
    local passed=0
    local failed=0
    
    # Test login first
    if ! test_login; then
        echo ""
        echo "❌ Login failed - cannot proceed with other tests"
        return 1
    fi
    
    # Run all tests
    declare -a tests=("User Management:test_user_management" 
                      "System Settings:test_system_settings" 
                      "Customer Access Management:test_customer_access" 
                      "Staff Routes:test_staff_routes" 
                      "Backup Functionality:test_backup")
    
    for test_info in "${tests[@]}"; do
        IFS=':' read -r test_name test_func <<< "$test_info"
        echo ""
        echo "📋 Running $test_name tests..."
        
        if $test_func; then
            ((passed++))
            log "$test_name tests passed"
        else
            ((failed++))
            error "$test_name tests failed"
        fi
    done
    
    echo ""
    echo "📊 Test Results:"
    echo "✅ Passed: $passed"
    echo "❌ Failed: $failed"
    
    if [ $failed -eq 0 ]; then
        echo ""
        echo "🎉 All tests passed! Admin system is working correctly."
    else
        echo ""
        echo "⚠️  Some tests failed. Please check the errors above."
    fi
}

# Run the tests
run_tests