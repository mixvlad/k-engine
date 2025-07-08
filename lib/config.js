// Конфигурация
const path = require('path');
const fs = require('fs-extra');

// Функция для поиска файла шаблона с fallback
function findTemplateFile(templatePath) {
    // Сначала ищем в текущей директории проекта
    const localPath = path.resolve(templatePath);
    if (fs.existsSync(localPath)) {
        return localPath;
    }
    
    // Если не найден, ищем в директории k-engine пакета
    const packagePath = path.resolve(__dirname, '..', templatePath);
    if (fs.existsSync(packagePath)) {
        return packagePath;
    }
    
    throw new Error(`Template file not found: ${templatePath}`);
}

const config = {
    sourceDir: 'content',
    outputDir: 'docs',
    templateFile: findTemplateFile('templates/post.html'),
    // Конфигурация изображений
    images: {
        // Размеры для генерации (в пикселях)
        sizes: [480, 960],
        // Максимальный размер (если исходное изображение больше, используем его)
        maxSize: 960,
        // Качество для разных форматов
        quality: {
            webp: 82,
            avif: 55
        },
        // Настройки для responsive изображений
        responsive: {
            // Брейкпоинты (ширина экрана в пикселях)
            breakpoints: [
                { maxWidth: 480, width: '96vw' },
                { maxWidth: 960, width: '90vw' }
            ],
            // Максимальная ширина изображения на больших экранах
            maxWidth: '960px'
        }
    }
};

// Флаги командной строки
const isDev = process.argv.includes('--watch');
const shouldClean = process.argv.includes('--clean');
const forceRegenerate = process.argv.includes('--force-regenerate');

// Глобальные переменные
const assetManifest = {}; // original relative path -> hashed path
let currentMdDir = '';

// Чтение статистики по подписчикам
let subscribers = {};
try {
    const fs = require('fs-extra');
    subscribers = fs.readJsonSync('subscribers.json');
} catch (e) {
    subscribers = {};
}

module.exports = {
    config,
    isDev,
    shouldClean,
    forceRegenerate,
    assetManifest,
    currentMdDir,
    subscribers
}; 