const browserSync = require('browser-sync').create();
const bsConfig = require('./lib/bs-config.js');

// Start BrowserSync with configuration
browserSync.init(bsConfig);

console.log(`Development server is running at http://localhost:${bsConfig.port}`);
console.log('Hot reload is enabled - changes will automatically refresh the browser');
console.log('Watching files in docs/ directory for changes...'); 