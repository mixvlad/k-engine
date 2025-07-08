const fs = require('fs-extra');
const path = require('path');
const { 
    config, 
    isDev, 
    shouldClean, 
    forceRegenerate, 
    assetManifest, 
    subscribers,
    hashContent,
    shouldRegenerateFile,
    createRedirects,
    generateImageSizes,
    processContentFile,
    processFile
} = require('./lib');

// Available command line flags:
// --watch: Enable watch mode for development
// --clean: Clean output directory before building
// --force-regenerate: Force regeneration of all images (useful for Windows debugging)

// Создаем выходную директорию
fs.ensureDirSync(config.outputDir);

// Helper to walk source directory recursively
async function processDir(srcDir) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name);
        const relPath = path.relative(config.sourceDir, fullPath);
        const destPath = path.join(config.outputDir, relPath);

        if (entry.isDirectory()) {
            await fs.ensureDir(destPath);
            await processDir(fullPath);
        } else if (entry.isFile()) {
            await processContentFile(fullPath, destPath, relPath, entry, forceRegenerate);
        }
    }
}

// Функция для безопасного копирования статических файлов
async function copyStaticFiles() {
    // Ищем статические файлы в текущей директории проекта
    let staticSrc = 'static';
    if (!fs.existsSync(staticSrc)) {
        // Если не найдены в текущей директории, используем из пакета k-engine
        staticSrc = path.join(__dirname, 'static');
        if (!fs.existsSync(staticSrc)) {
            console.log('No static files found, skipping static file copy');
            return;
        }
    }
    
    const staticDest = path.join(config.outputDir, 'static');
    await fs.ensureDir(staticDest);

    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name);
            const relPath = path.relative(staticSrc, srcPath).replace(/\\/g, '/');
            const destPath = path.join(staticDest, relPath);

            if (entry.isDirectory()) {
                await fs.ensureDir(destPath);
                await walk(srcPath);
                continue;
            }

            await processFile(srcPath, destPath, relPath, entry, forceRegenerate);
        }
    }

    await walk(staticSrc);
}

// Обрабатываем все Markdown файлы и копируем ресурсы
async function build() {
    if (shouldClean) {
        await fs.emptyDir(config.outputDir);
    } else {
        await fs.ensureDir(config.outputDir);
    }
    await copyStaticFiles();
    await processDir(config.sourceDir);

    // Create .nojekyll file for GitHub Pages
    await fs.writeFile(path.join(config.outputDir, '.nojekyll'), '# This file tells GitHub Pages not to use Jekyll');

    // Ensure CNAME file exists for custom domain
    const cnameContent = 'koz.tv';
    await fs.writeFile(path.join(config.outputDir, 'CNAME'), cnameContent);

    // After main content copied, create legacy redirects
    await createRedirects();
}

// Функция для наблюдения за изменениями
async function watch() {
    console.log('Watching for changes...');

    // WebSocket server removed - live reload now handled by BrowserSync
    function notifyClients() {
        /* no-op */
    }

    // Debounce / queue to избегать одновременных билдов
    let building = false;
    let buildQueued = false;
    async function safeBuild() {
        if (building) {
            buildQueued = true;
            return;
        }
        building = true;
        try {
            await build();
        } catch (err) {
            console.error('Build failed:', err);
        } finally {
            building = false;
            if (buildQueued) {
                buildQueued = false;
                // Запускаем ещё один билд, если был запланирован
                safeBuild();
            } else {
                // Шлём уведомление только после успешного (последнего) билда
                notifyClients();
            }
        }
    }
    
    // Наблюдаем за изменениями в директории с контентом (рекурсивно на Windows/mac)
    fs.watch(config.sourceDir, { recursive: true }, async (eventType, filename) => {
        if (filename) {
            console.log(`Change detected in ${filename}`);
            safeBuild();
        }
    });
    
    // Наблюдаем за изменениями во всех шаблонах
    const templatesDir = fs.existsSync('templates') ? 'templates' : path.join(__dirname, 'templates');
    if (fs.existsSync(templatesDir)) {
        fs.watch(templatesDir, async (eventType, filename) => {
            if (filename && filename.endsWith('.html')) {
                console.log(`Template ${filename} has been changed`);
                safeBuild();
            }
        });
    }
    
    // Наблюдаем за изменениями во всех CSS
    const staticDir = fs.existsSync('static') ? 'static' : path.join(__dirname, 'static');
    if (fs.existsSync(staticDir)) {
        fs.watch(path.join(staticDir, 'css'), async (eventType, filename) => {
            if (filename && filename.endsWith('.css')) {
                console.log(`CSS ${filename} has been changed`);
                safeBuild();
            }
        });
        
        // Наблюдаем за изменениями в статических файлах (остальное)
        fs.watch(staticDir, async (eventType, filename) => {
            if (filename && !filename.endsWith('.css')) {
                console.log(`Static file ${filename} has been changed`);
                safeBuild();
            }
        });
    }
}

// Проверяем, запущен ли скрипт в режиме наблюдения
if (process.argv.includes('--watch')) {
    build().then(watch).catch(console.error);
} else {
    build().catch(console.error);
} 