import browserSync from 'browser-sync';
import bsConfig from './lib/bs-config.js';

const bs = browserSync.create();

// Start BrowserSync with configuration
bs.init(bsConfig);

console.log(`Development server is running at http://localhost:${bsConfig.port}`);
console.log('Hot reload is enabled - changes will automatically refresh the browser');
console.log('Watching files in docs/ directory for changes...'); 