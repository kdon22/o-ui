// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Mock Monaco Editor for testing environment
global.monaco = {
  editor: {
    createModel: jest.fn().mockReturnValue({
      dispose: jest.fn(),
      getLineContent: jest.fn().mockReturnValue(''),
      getVersionId: jest.fn().mockReturnValue(1),
      getLineCount: jest.fn().mockReturnValue(10)
    })
  },
  Position: jest.fn().mockImplementation((line, column) => ({
    lineNumber: line,
    column: column
  }))
}

// Mock window object
Object.defineProperty(window, 'monaco', {
  value: global.monaco,
  writable: true
})

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// }