import type { UserConfig } from 'vite';

export default {
    base: '/Mines/',
    root: 'src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
    },
} satisfies UserConfig;
