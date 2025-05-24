module.exports = {
  roots: ['<rootDir>/app'], // Targeting tests within the 'app' directory
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        // esModuleInterop allows for default imports of CommonJS modules, helpful for some mocks
        esModuleInterop: true,
        // Ensure JSX is handled correctly by ts-jest for React components
        jsx: 'react-jsx', // or 'react' if preferred, 'react-jsx' is newer
        // allowJs is useful if you have JS files that need to be processed,
        // but ensure your test files are .ts or .tsx for ts-jest to pick them up by default
        allowJs: true,
      },
    }],
  },
  moduleNameMapper: {
    // Handle CSS imports (if you have them)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    // Alias for @/ path, ensure this matches your tsconfig.json paths
    '^@/(.*)$': '<rootDir>/$1', 
    // If next-auth/react is used in components under test and not always via the mock file in __mocks__
    // you might need to explicitly point to the mock if issues persist with auto-mocking.
    // However, placing the mock in __mocks__/next-auth/react.js should be sufficient.
  },
  // preset: 'ts-jest', // This is not needed when defining transform as above
};
