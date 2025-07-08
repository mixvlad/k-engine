module.exports = {
    server: {
        baseDir: './docs',
        routes: {
            '/': '/index.html'
        }
    },
    port: 3000,
    open: true,
    notify: false,
    files: [
        'docs/**/*.html',
        'docs/**/*.css',
        'docs/**/*.js',
        'docs/**/*.png',
        'docs/**/*.jpg',
        'docs/**/*.jpeg',
        'docs/**/*.gif',
        'docs/**/*.svg',
        'docs/**/*.webp',
        'docs/**/*.avif'
    ],
    watchEvents: ['change', 'add', 'unlink'],
    watch: true,
    reloadDelay: 100,
    reloadDebounce: 250,
    reloadThrottle: 0,
    injectChanges: true,
    codeSync: true,
    // Additional options for better hot reload
    middleware: [],
    plugins: [],
    snippetOptions: {
        ignorePaths: ['node_modules/**/*']
    }
}; 