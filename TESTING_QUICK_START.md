# Testing Quick Start Guide

## 🚀 Getting Started

### Prerequisites
All testing dependencies are already installed in `package.json`:
- Jest (v30.1.3)
- Supertest (v7.1.4)

### Run Tests
```bash
# Install dependencies (if not already installed)
npm install

# Run all tests with coverage report
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with verbose output
npm run test:verbose

# Run specific test file
npm test src/__tests__/utils/punycode.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should convert Arabic"
```

## 📊 Test Coverage Report

After running `npm test`, open `coverage/lcov-report/index.html` in your browser to see detailed coverage.

## 🧪 What's Tested

### 7 Test Suites Created
1. **Punycode Utilities** (63 tests) - International domain conversion
2. **GeoLocation Service** (28 tests) - IP-based location tracking
3. **OTP Service** (19 tests) - Authentication via Authentica API
4. **User Service** (21 tests) - User management operations
5. **Permissions Middleware** (29 tests) - RBAC authorization
6. **Role Controller** (20 tests) - Role management endpoints
7. **QRCode Model** (37 tests) - QR code data model

**Total: 217+ test cases covering 2,574+ lines**

## 📁 Test Structure