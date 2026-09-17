// Runs once before the whole test suite (wired up via vite.config.js's
// test.setupFiles). Adds jest-dom's matchers — toBeInTheDocument(),
// toHaveTextContent(), etc. — to every test file's `expect`, so
// individual test files don't each need to import this themselves.
import '@testing-library/jest-dom'