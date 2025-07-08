const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size');
const { config } = require('./config');

// Генерирует все размеры изображения с проверкой только наличия всех производных файлов
async function generateImageSizes(sourcePath, destPath, forceRegenerate = false, addToProcessed = null) {
    const ext = path.extname(sourcePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
        return;
    }

    const withoutExt = destPath.slice(0, -ext.length);

    // Список всех нужных производных файлов
    let originalSize;
    try {
        originalSize = sizeOf(sourcePath);
    } catch (error) {
        console.warn(`Could not get size for ${sourcePath}:`, error.message);
        return;
    }
    const targets = [];
    // Оригинал
    targets.push(destPath);
    // WebP и AVIF оригинального размера
    targets.push(withoutExt + '.webp');
    targets.push(withoutExt + '.avif');
    // WebP и AVIF для каждого размера
    for (const size of config.images.sizes) {
        if (originalSize.width >= size) {
            targets.push(withoutExt + `-${size}.webp`);
            targets.push(withoutExt + `-${size}.avif`);
        }
    }

    // Проверяем наличие всех производных файлов
    let allExist = true;
    for (const t of targets) {
        if (!fs.existsSync(t)) {
            allExist = false;
            break;
        }
    }
    if (!forceRegenerate && allExist) {
        // Все файлы есть, добавляем их в список обработанных
        if (addToProcessed) {
            for (const t of targets) {
                addToProcessed(t);
            }
        }
        return;
    }

    // Копируем оригинал
    await fs.copy(sourcePath, destPath);
    if (addToProcessed) addToProcessed(destPath);

    // Генерируем WebP и AVIF версии для каждого размера
    for (const size of config.images.sizes) {
        if (originalSize.width >= size) {
            const sizeWebp = withoutExt + `-${size}.webp`;
            const sizeAvif = withoutExt + `-${size}.avif`;
            try {
                console.log(`  Creating ${sizeWebp}`);
                await sharp(sourcePath)
                    .resize(size, null, { withoutEnlargement: true })
                    .toFormat('webp', { quality: config.images.quality.webp })
                    .toFile(sizeWebp);
                if (addToProcessed) addToProcessed(sizeWebp);
            } catch (error) {
                console.warn(`Failed to create ${sizeWebp}:`, error.message);
            }
            try {
                console.log(`  Creating ${sizeAvif}`);
                await sharp(sourcePath)
                    .resize(size, null, { withoutEnlargement: true })
                    .toFormat('avif', { quality: config.images.quality.avif })
                    .toFile(sizeAvif);
                if (addToProcessed) addToProcessed(sizeAvif);
            } catch (error) {
                console.warn(`Failed to create ${sizeAvif}:`, error.message);
            }
        }
    }
    // Генерируем WebP и AVIF версии оригинального размера
    const webpDest = withoutExt + '.webp';
    const avifDest = withoutExt + '.avif';
    try {
        await sharp(sourcePath)
            .toFormat('webp', { quality: config.images.quality.webp })
            .toFile(webpDest);
        if (addToProcessed) addToProcessed(webpDest);
    } catch (error) {
        console.warn(`Failed to create ${webpDest}:`, error.message);
    }
    try {
        await sharp(sourcePath)
            .toFormat('avif', { quality: config.images.quality.avif })
            .toFile(avifDest);
        if (addToProcessed) addToProcessed(avifDest);
    } catch (error) {
        console.warn(`Failed to create ${avifDest}:`, error.message);
    }
}

// Определяет оптимальный размер изображения на основе контекста
function getOptimalImageSize(context = 'default') {
    const sizes = {
        // Основной контент (посты, статьи)
        'content': 575,
        // Основной проект на главной странице
        'featured': 960,
        // Проекты в сетке (3 колонки на desktop)
        'grid': 192,
        // Проекты в сетке на планшете (2 колонки)
        'grid-tablet': 288,
        // Проекты в сетке на мобильном (1 колонка)
        'grid-mobile': 575,
        // По умолчанию
        'default': 575
    };
    
    return sizes[context] || sizes.default;
}

// Создает srcset для изображения
function createSrcset(imagePath, imageName, optimalSize = 960, currentMdDir = '') {
    const baseName = imageName.replace(/\.[^/.]+$/, '');
    const basePath = path.dirname(imagePath);
    let srcset = [];
    // Получаем размер исходника
    let originalWidth = null;
    try {
        const imgPath = path.join(config.sourceDir, currentMdDir, imagePath);
        const { width } = sizeOf(imgPath);
        originalWidth = width;
    } catch {}
    for (const size of config.images.sizes) {
        if (!originalWidth || size <= originalWidth) {
            srcset.push(`${basePath}/${baseName}-${size}.webp ${size}w`);
        }
    }
    return srcset.join(', ');
}

// Создает оптимальный src для изображения
function createOptimalSrc(imagePath, imageName, optimalSize = 960, currentMdDir = '') {
    const baseName = imageName.replace(/\.[^/.]+$/, '');
    const basePath = path.dirname(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    // Получаем размер исходника
    let originalWidth = null;
    try {
        const imgPath = path.join(config.sourceDir, currentMdDir, imagePath);
        const { width } = sizeOf(imgPath);
        originalWidth = width;
    } catch {}
    // Если исходник меньше всех размеров — возвращаем оригинал
    if (originalWidth && Math.min(...config.images.sizes) > originalWidth) {
        return imagePath;
    }
    // Выбираем оптимальный размер из доступных
    let bestSize = null;
    for (const size of config.images.sizes) {
        if (size >= optimalSize && (!originalWidth || size <= originalWidth)) {
            bestSize = size;
            break;
        }
    }
    // Если не нашли подходящий размер, берем самый большой доступный, но не больше исходника
    if (bestSize === null && originalWidth) {
        bestSize = Math.max(...config.images.sizes.filter(s => s <= originalWidth));
    }
    if (bestSize !== null) {
        const webpPath = `${basePath}/${baseName}-${bestSize}.webp`;
        if (fs.existsSync(path.join(config.outputDir, webpPath))) {
            return webpPath;
        }
    }
    // Иначе используем оригинал
    return imagePath;
}

// Создает sizes атрибут для responsive изображений
function createSizes() {
    const { responsive } = config.images;
    const parts = [];
    
    // Добавляем брейкпоинты
    for (const bp of responsive.breakpoints) {
        parts.push(`(max-width: ${bp.maxWidth}px) ${bp.width}`);
    }
    
    // Добавляем максимальную ширину для больших экранов
    parts.push(responsive.maxWidth);
    
    return parts.join(', ');
}

// Создает HTML для изображения с поддержкой WebP/AVIF и responsive sizes
function createImageHtml(href, title, text, currentMdDir = '', context = 'default') {
    if (href.startsWith('/')) href = href.substring(1);
    const ext = path.extname(href).toLowerCase();
    const supportsPicture = ['.png', '.jpg', '.jpeg'].includes(ext);
    const alt = text || title || '';
    
    if (!supportsPicture) {
        // Для неподдерживаемых форматов - обычная обработка
        let base = `<img src="${href}" alt="${alt}"`;
        
        // Добавляем размеры если можем их получить
        try {
            const imgPath = path.join(config.sourceDir, currentMdDir, href);
            const { width, height } = sizeOf(imgPath);
            if (width && height) {
                base += ` width="${width}" height="${height}" style="aspect-ratio:${width}/${height}"`;
            }
        } catch {}
        
        return base + ' loading="lazy" decoding="async" />';
    }
    
    const withoutExt = href.replace(/\.[^/.]+$/, '');
    const avif = withoutExt + '.avif';
    const webp = withoutExt + '.webp';
    
    // Получаем размеры для width/height атрибутов
    let dimAttrs = '';
    try {
        const imgPath = path.join(config.sourceDir, currentMdDir, href);
        const { width, height } = sizeOf(imgPath);
        if (width && height) {
            dimAttrs = ` width="${width}" height="${height}" style="aspect-ratio:${width}/${height}"`;
        }
    } catch {}
    
    // Определяем оптимальный размер на основе контекста
    const optimalSize = getOptimalImageSize(context);
    
    // Создаем srcset для responsive изображений
    const srcset = createSrcset(href, path.basename(href), optimalSize, currentMdDir);
    const sizes = createSizes();
    
    // Используем оптимальный src
    const optimalSrc = createOptimalSrc(href, path.basename(href), optimalSize, currentMdDir);
    
    return `<picture>
        <source type="image/avif" srcset="${avif}">
        <source type="image/webp" srcset="${webp}">
        <img loading="lazy" decoding="async" src="${optimalSrc}" alt="${alt}"${dimAttrs} srcset="${srcset}" sizes="${sizes}">
    </picture>`;
}

module.exports = {
    generateImageSizes,
    createImageHtml,
    createSrcset,
    createSizes,
    createOptimalSrc,
    getOptimalImageSize
}; 