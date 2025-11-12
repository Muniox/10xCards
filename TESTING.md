# Testing Guide for 10x-cards

This document provides comprehensive information about the testing setup and practices for the 10x-cards application.

## Quick Start

### Running All Tests

```bash
# Run unit tests (Vitest)
npm test

# Run E2E tests (Playwright)  
npm run test:e2e

# Run all tests in CI mode
npm test -- --run && npm run test:e2e
```

### First Time Setup

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Install Playwright browsers** (first time only):
```bash
npx playwright install
```

3. **Verify setup**:
```bash
npm test -- --run
npm run test:e2e
```

## Testing Stack

- **[Vitest](https://vitest.dev/)** - Fast unit and integration test runner with Vite-powered testing
- **[React Testing Library](https://testing-library.com/react)** - User-centric React component testing
- **[Happy DOM](https://github.com/capricorn86/happy-dom)** - Fast DOM implementation for Vitest
- **[Playwright](https://playwright.dev/)** - End-to-end testing across browsers (Chromium, Firefox, WebKit)
- **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** - Automated accessibility testing

## Configuration

### Vitest Configuration (`vitest.config.ts`)

Key configuration settings:
- **Environment**: `happy-dom` - Fast DOM implementation for component tests
- **Globals**: `true` - Enables global test APIs (describe, it, expect) without imports
- **Setup Files**: `./src/tests/setup.ts` - Loads jest-dom matchers for enhanced assertions
- **Coverage**: V8 provider with HTML, JSON, and text reports
- **Path Alias**: `@` points to `./src` for cleaner imports

### Playwright Configuration (`playwright.config.ts`)

Key configuration settings:
- **Base URL**: `http://localhost:3000` - Matches Astro dev server port
- **Test Directory**: `./e2e` - All E2E tests location
- **Browsers**: Chromium, Firefox, and WebKit (Safari)
- **Web Server**: Automatically starts dev server before tests
- **Retries**: 2 retries on CI, 0 locally
- **Trace**: Captured on first retry for debugging
- **Screenshots**: Taken only on test failure

## Project Structure

```
10x-cards/
├── src/
│   ├── tests/
│   │   ├── setup.ts           # Vitest setup and global test configuration
│   │   └── test-utils.tsx     # Custom render functions and testing utilities
│   ├── components/            # Component tests alongside components
│   │   └── *.test.tsx
│   └── lib/
│       └── **/*.test.ts       # Unit tests for utilities and services
├── e2e/
│   ├── helpers/
│   │   └── test-helpers.ts    # E2E test helper functions
│   └── *.spec.ts              # E2E test files
├── vitest.config.ts           # Vitest configuration
└── playwright.config.ts       # Playwright configuration
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Writing Tests

### Creating a New Test File

**For components**: Create a `.test.tsx` file next to the component:
```
src/components/MyComponent.tsx
src/components/MyComponent.test.tsx  ← Test file here
```

**For utilities**: Create a `.test.ts` file next to the utility:
```
src/lib/utils/myUtil.ts
src/lib/utils/myUtil.test.ts  ← Test file here
```

**For E2E tests**: Create a `.spec.ts` file in the `e2e` directory:
```
e2e/feature-name.spec.ts
```

### Unit Tests

Unit tests should focus on testing individual functions, utilities, and business logic in isolation.

**Example:**

```typescript
// src/lib/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });
});
```

### Component Tests

Component tests verify that React components render correctly and handle user interactions properly.

**Example:**

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/tests/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

E2E tests verify complete user workflows across the application.

**Example:**

```typescript
// e2e/authentication.spec.ts
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  // Navigate to registration page
  await page.goto('/register');

  // Fill registration form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/app/dashboard');
});
```

**Note**: Playwright automatically starts the dev server (configured in `playwright.config.ts`) before running tests.

### Accessibility Tests

Include accessibility checks in your E2E tests:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
```

## Test Coverage Goals

Based on our test plan, we aim for:

- **80%+ code coverage** for critical business logic (services, utilities)
- **100% of critical user flows** covered by E2E tests (auth, flashcard CRUD, generation)
- **Zero accessibility violations** on core pages (landing, dashboard, flashcards)

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Coverage reports are generated in:
# - HTML: coverage/index.html (open in browser)
# - JSON: coverage/coverage-final.json
# - Text: displayed in terminal
```

**Coverage exclusions** (configured in `vitest.config.ts`):
- `node_modules/`
- Test files (`src/tests/`, `**/*.test.ts`, `**/*.spec.ts`)
- Type definitions (`**/*.d.ts`)
- Configuration files (`**/*.config.*`)
- Build output (`dist/`, `.astro/`)

## Best Practices

### General

1. **Test behavior, not implementation** - Focus on what the user sees and does
2. **Write descriptive test names** - Tests should read like documentation
3. **Keep tests independent** - Each test should be able to run in isolation
4. **Use data-testid sparingly** - Prefer semantic queries (role, label, text)

### Unit Tests

1. **Mock external dependencies** - Isolate the code under test
2. **Test edge cases** - Include error conditions and boundary values
3. **Keep tests fast** - Unit tests should run in milliseconds

### Component Tests

1. **Query by role and accessible name** - Improves accessibility
2. **Use userEvent over fireEvent** - More realistic user interactions
3. **Test from the user's perspective** - What do they see/do?
4. **Always import `vi` from vitest** - Required for mocking (vi.fn(), vi.mock())
5. **Setup userEvent properly** - Use `userEvent.setup()` before user interactions

### E2E Tests

1. **Test critical paths first** - Registration, login, core features
2. **Use Page Object Model** - For complex flows, create helper functions
3. **Handle flakiness** - Use proper waits (waitForLoadState, etc.)
4. **Test across browsers** - Playwright runs tests on Chromium, Firefox, and WebKit

## CI/CD Integration

Tests are automatically run in the GitHub Actions pipeline:

- **On every push** - Unit and integration tests
- **On Pull Request** - Full test suite including E2E
- **Before deployment** - All tests must pass

## Debugging Tests

### Common Issues and Solutions

#### Vitest Issues

**Problem**: `toBeInTheDocument()` or other jest-dom matchers not working
```
Error: Invalid Chai property: toBeInTheDocument
```
**Solution**: Ensure `setupFiles` is uncommented in `vitest.config.ts`:
```typescript
setupFiles: ["./src/tests/setup.ts"],
```

**Problem**: `vi is not defined`
```
ReferenceError: vi is not defined
```
**Solution**: Import `vi` from vitest:
```typescript
import { describe, it, expect, vi } from 'vitest';
```

**Problem**: userEvent is undefined or has no method 'setup'
```
TypeError: Cannot read properties of undefined (reading 'setup')
```
**Solution**: Import userEvent correctly from test-utils:
```typescript
import { render, screen, userEvent } from '@/tests/test-utils';
const user = userEvent.setup();
```

#### Playwright Issues

**Problem**: Tests timeout waiting for server
**Solution**: Check if dev server is running on port 3000 (configured in `astro.config.mjs`)

**Problem**: Element not found
**Solution**: Use proper waits:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('selector');
```

### Debugging Vitest Tests

```bash
# Run specific test file
npm run test src/components/Button.test.tsx

# Run tests matching a pattern
npm run test -- --grep "should render"

# Use the UI for debugging
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Debugging Playwright Tests

```bash
# Use debug mode (opens DevTools)
npm run test:e2e:debug

# Use UI mode (visual test runner)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/authentication.spec.ts
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Guide](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testing-library.com/docs/queries/about)
- [Accessibility Testing with Axe](https://github.com/dequelabs/axe-core)

## Getting Help

If you encounter issues with tests:

1. Check the test output for error messages
2. Review this documentation
3. Check the example tests in the codebase
4. Consult the official documentation for the testing tools
5. Ask the team for help

---

Happy Testing! 🧪
