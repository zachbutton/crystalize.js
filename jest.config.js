module.exports = {
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['js', 'ts'],
    coverageReporters: ['json-summary', 'html'],
    coverageReporters: ['json-summary', 'html'],
};
