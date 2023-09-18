import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV == 'production';

export default defineConfig({
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    minify: isProd,
});
