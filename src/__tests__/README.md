# URL Shortener Test Suite

This directory contains comprehensive unit tests for the URL Shortener application's backend services.

## Test Coverage

### Services
- **otpService.test.js** - Tests for OTP sending and verification via Authentica API
- **geoLocationService.test.js** - Tests for IP-based geolocation functionality
- **userService.test.js** - Tests for user management operations

### Utilities
- **punycode.test.js** - Tests for international domain name (IDN) conversion

### Middleware
- **permissions.test.js** - Tests for RBAC (Role-Based Access Control) middleware

### Controllers
- **roleController.test.js** - Tests for role and permission management endpoints

### Models
- **QRCode.test.js** - Tests for QR Code model schema, validations, and methods

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm run test:verbose

# Run tests for a specific file
npm test -- src/__tests__/services/otpService.test.js

# Run tests with coverage
npm test -- --coverage
```

## Test Structure

Each test file follows this structure:
- **Describe blocks** - Group related tests by functionality
- **BeforeEach hooks** - Set up test data and mocks
- **Test cases** - Cover happy paths, edge cases, and error scenarios
- **Mock cleanup** - Clear mocks between tests

## Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Key Testing Patterns

### Mocking Dependencies
```javascript
jest.mock('../../models/User');
const User = require('../../models/User');
```

### Testing Async Functions
```javascript
test('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Handling
```javascript
test('should handle errors gracefully', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  await expect(functionUnderTest()).rejects.toThrow();
});
```

## Test Categories

### 1. Pure Function Tests
- Input/output validation
- Edge case handling
- Type checking

### 2. Service Tests
- API integration
- Business logic
- Error handling
- External service mocking

### 3. Middleware Tests
- Authentication checks
- Authorization logic
- Request/response handling

### 4. Controller Tests
- Request validation
- Response formatting
- Status codes
- Error responses

### 5. Model Tests
- Schema validation
- Instance methods
- Static methods
- Hooks and middleware

## Best Practices

1. **Descriptive Test Names** - Use clear, descriptive test names that explain what is being tested
2. **Arrange-Act-Assert** - Structure tests with clear setup, execution, and verification
3. **Mock External Dependencies** - Isolate units under test
4. **Test Edge Cases** - Include boundary conditions and error scenarios
5. **Keep Tests Independent** - Each test should run in isolation
6. **Use Before/After Hooks** - Set up and tear down test state properly

## Debugging Tests

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run a single test file with debugging
node --inspect-brk node_modules/.bin/jest src/__tests__/services/otpService.test.js
```

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline before deployment. All tests must pass for deployment to proceed.

## Adding New Tests

When adding new functionality:
1. Create a test file in the appropriate subdirectory
2. Follow existing naming conventions (*.test.js)
3. Include comprehensive test coverage
4. Update this README if adding new test categories

## Common Issues

### Issue: Tests timing out
**Solution**: Increase timeout in jest.config.js or specific tests

### Issue: Mock not working
**Solution**: Ensure mocks are cleared between tests with `jest.clearAllMocks()`

### Issue: Database connection errors
**Solution**: Tests should not connect to real databases; use mocks instead

## Dependencies

- **Jest** - Testing framework
- **Supertest** - HTTP assertion library (for integration tests)

## Contributing

When contributing tests:
1. Ensure all tests pass locally
2. Maintain or improve code coverage
3. Follow existing test patterns
4. Add comments for complex test logic