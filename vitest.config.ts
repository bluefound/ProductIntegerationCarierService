import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/index.ts'],
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@/domain': resolve(__dirname, './src/domain'),
            '@/carriers': resolve(__dirname, './src/carriers'),
            '@/services': resolve(__dirname, './src/services'),
            '@/validation': resolve(__dirname, './src/validation'),
            '@/errors': resolve(__dirname, './src/errors'),
            '@/config': resolve(__dirname, './src/config'),
        },
    },
});
