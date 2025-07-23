# Testing Guide - Customer Access Management

This document describes the comprehensive test suite for the Customer Access Management functionality.

## Test Structure

### Frontend Tests (React Components)
Located in: `/client/src/pages/admin/__tests__/`

#### 1. Unit Tests (`CustomerAccessPage.test.tsx`)
Tests individual component functionality:
- **Component Rendering**: Verifies all UI elements render correctly
- **State Management**: Tests form state, search filters, and component state
- **User Interactions**: Button clicks, form submissions, search functionality
- **API Integration**: Mocked API calls and responses
- **Error Handling**: Validation errors, API errors, edge cases
- **Data Display**: Customer lists, badges, status indicators

**Key Test Cases:**
- Initial render with loading state
- Customer access list display
- Search and filter functionality
- Grant access form workflow
- Customer action buttons (suspend, activate, reset password, revoke)
- Empty states and error handling

#### 2. Integration Tests (`CustomerAccessPage.integration.test.tsx`)
Tests complete user workflows:
- **Complete Access Lifecycle**: Grant → Manage → Revoke
- **Status Management**: Active ↔ Suspended transitions
- **Password Reset Workflow**: Full flow with validation
- **Error Scenarios**: API failures, validation errors
- **Search and Filter Workflows**: Complex filtering scenarios

### Backend Tests (API Endpoints)
Located in: `/server/src/routes/__tests__/`

#### API Tests (`admin.test.ts`)
Tests all customer access API endpoints:
- **GET /admin/customer-access**: List customers with access
- **GET /admin/customers-without-access**: List available customers
- **POST /admin/customer-access**: Grant portal access
- **PUT /admin/customer-access/:id/status**: Toggle access status
- **PUT /admin/customer-access/:id/password**: Reset password
- **DELETE /admin/customer-access/:id**: Revoke access

**Test Coverage:**
- ✅ Success scenarios for all endpoints
- ✅ Input validation (required fields, password length, etc.)
- ✅ Business logic validation (customer exists, email uniqueness)
- ✅ Error handling (database errors, not found, conflicts)
- ✅ Authentication and authorization requirements

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# For client tests
cd client && npm install

# For server tests  
cd server && npm install
```

### Client Tests
```bash
# Run all client tests
cd client && npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test CustomerAccessPage.test.tsx

# Run integration tests only
npm test -- --testNamePattern="Integration"
```

### Server Tests
```bash
# Run all server tests
cd server && npm test

# Run specific test file
npm test admin.test.ts

# Run with coverage
npm test -- --coverage
```

### Run All Tests
```bash
# From project root
npm run test:all
```

## Test Configuration

### Client Test Setup
- **Framework**: Jest + React Testing Library
- **Environment**: jsdom (browser simulation)
- **Mocking**: API calls, external components, window methods
- **Coverage**: Component logic, user interactions, error handling

### Server Test Setup
- **Framework**: Jest + Supertest
- **Mocking**: Database operations, authentication middleware
- **Coverage**: API endpoints, validation, business logic, error handling

## Test Data

### Mock Customer Data
```typescript
const mockCustomerAccess = {
  id: 1,
  customerId: 1,
  userId: 1,
  canLogin: true,
  loginEmail: 'customer@example.com',
  customer: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com',
    customerType: 'partner'
  }
}
```

### Mock API Responses
- Success responses with realistic data
- Error responses with proper error messages
- Edge cases (empty lists, validation failures)

## Test Scenarios Covered

### ✅ Happy Path Scenarios
1. **Grant Access**: Select customer → Enter credentials → Submit → Success
2. **Manage Status**: View customer → Toggle status → Confirm → Success  
3. **Reset Password**: View customer → Reset password → Enter new password → Success
4. **Revoke Access**: View customer → Revoke → Confirm → Success
5. **Search Customers**: Enter search term → Filter results → Clear search

### ✅ Error Scenarios
1. **Validation Errors**: Missing fields, weak passwords, invalid emails
2. **Business Logic Errors**: Customer not found, email already in use, already has access
3. **API Errors**: Network failures, server errors, authentication failures
4. **User Cancellation**: Cancel forms, deny confirmations

### ✅ Edge Cases
1. **Empty States**: No customers with access, no customers available
2. **Search Edge Cases**: No results, special characters, case sensitivity
3. **Concurrent Operations**: Multiple users managing access simultaneously
4. **Data Consistency**: Proper state updates after operations

## Coverage Targets

### Client Tests
- **Component Coverage**: >90%
- **Function Coverage**: >85%
- **Line Coverage**: >80%
- **Branch Coverage**: >75%

### Server Tests  
- **Endpoint Coverage**: 100%
- **Function Coverage**: >90%
- **Line Coverage**: >85%
- **Branch Coverage**: >80%

## Continuous Integration

Tests are configured to run automatically on:
- Pull requests
- Main branch pushes
- Pre-commit hooks (optional)

### CI Commands
```bash
# Lint and test
npm run ci:check

# Test with coverage reporting
npm run test:coverage

# Integration test suite
npm run test:integration
```

## Best Practices

### Writing Tests
1. **Descriptive Names**: Test names should clearly describe the scenario
2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
3. **Mock External Dependencies**: API calls, external services, complex components
4. **Test User Behavior**: Focus on what users do, not implementation details
5. **Cover Error Paths**: Test both success and failure scenarios

### Maintaining Tests
1. **Keep Tests Updated**: Update tests when functionality changes
2. **Avoid Test Duplication**: Share common setup and utilities
3. **Regular Review**: Review test coverage and update as needed
4. **Documentation**: Document complex test scenarios and setups

## Debugging Tests

### Common Issues
1. **Async Operations**: Use `waitFor` for async operations
2. **Mock Setup**: Ensure mocks are properly reset between tests
3. **DOM Queries**: Use appropriate queries (getByRole, getByText, etc.)
4. **State Updates**: Wait for component state updates after actions

### Debug Commands
```bash
# Run single test with debug output
npm test -- --testNamePattern="specific test" --verbose

# Debug with browser inspection (client tests)
npm test -- --debug

# Run tests with increased timeout
npm test -- --testTimeout=30000
```

## Future Enhancements

### Planned Test Additions
1. **E2E Tests**: Full browser automation with Playwright/Cypress
2. **Performance Tests**: Component rendering performance
3. **Accessibility Tests**: Screen reader compatibility, keyboard navigation
4. **Visual Regression Tests**: Screenshot comparison tests
5. **Load Tests**: API endpoint performance under load

### Test Infrastructure
1. **Parallel Execution**: Run tests in parallel for faster feedback
2. **Test Database**: Dedicated test database for integration tests
3. **Automated Screenshots**: Visual documentation of test scenarios
4. **Test Reporting**: Enhanced reporting with trends and metrics