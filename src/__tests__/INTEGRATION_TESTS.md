# Integration Tests Guide

## Future Integration Tests

While this test suite focuses on unit tests, here are recommended integration tests to add:

### API Integration Tests
```javascript
// Example: Test complete OTP flow
describe('OTP Flow Integration', () => {
  test('should complete full OTP verification flow', async () => {
    // 1. Request OTP
    // 2. Verify OTP
    // 3. Generate JWT token
    // 4. Access protected resource
  });
});
```

### Database Integration Tests
```javascript
// Example: Test QR Code creation and retrieval
describe('QR Code Database Integration', () => {
  test('should create and retrieve QR code', async () => {
    // 1. Create URL
    // 2. Generate QR Code
    // 3. Retrieve QR Code
    // 4. Update statistics
  });
});
```

### External Service Integration Tests
```javascript
// Example: Test geolocation API integration
describe('Geolocation API Integration', () => {
  test('should fetch real location data', async () => {
    // Use real API with test IP addresses
  });
});
```

## Setting Up Integration Tests

1. Create separate `integration` directory
2. Use separate test database
3. Configure environment variables for integration tests
4. Run integration tests separately from unit tests

```bash
npm run test:integration
```

## Best Practices

- Use test databases that mirror production
- Clean up test data after each test
- Use realistic test data
- Test actual API responses
- Consider rate limits and API quotas