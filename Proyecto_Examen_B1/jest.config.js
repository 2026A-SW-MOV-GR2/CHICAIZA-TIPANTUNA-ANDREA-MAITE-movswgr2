module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json' 
    }],
  },
  transformIgnorePatterns: ['node_modules/(?!(@nativescript|nativescript))'],
  testPathIgnorePatterns: ["/node_modules/", "app/test.ts"], 
};