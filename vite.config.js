import { defineConfig } from 'vite';

export default defineConfig({
    base: '/Mines/',
    root: 'src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
    },
});
