module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],

    collectCoverage: true,

    collectCoverageFrom: [
        'utils/IsaacTanUtil.js',
        'index.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html'],
    coverageThreshold: {
        'utils/IsaacTanUtil.js': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        }
    },
    verbose: true,
    testTimeout: 10000
};
