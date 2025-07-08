import fs from 'fs-extra';
import path from 'path';
import CleanCSS from 'clean-css';
import esbuild from 'esbuild';
import { config, assetManifest, subscribers } from './config.js';
import { hashContent } from './hash.js';
import { generateImageSizes } from './images.js';
import frontMatter from 'front-matter';
import { convertMarkdownToHtml, generatePostsMarkdownList, generateProjectsMarkup } from './markdown.js';
import { generateSocialIconsHtml } from './socials.js';

// Общая функция для обработки изображений
async function processImage(srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed) {
    console.log(`Processing image: ${relPath}`);
    await generateImageSizes(srcPath, destPath, forceRegenerate, addToProcessed);
}

// Обработчики для разных типов файлов
const fileProcessors = {
    // CSS файлы
    '.css': async (srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed) => {
        const cssSrc = await fs.readFile(srcPath, 'utf-8');
        const hash = hashContent(cssSrc);
        const hashedName = entry.name.replace(/\.css$/, `.${hash}.css`);
        const finalDest = path.join(path.dirname(destPath), hashedName);
        
        // Добавляем в манифест для замены в HTML
        assetManifest[`static/${relPath}`] = `static/${path.posix.join(path.dirname(relPath), hashedName)}`;
        
        if (!fs.existsSync(finalDest)) {
            const minified = new CleanCSS({ level: 2 }).minify(cssSrc).styles;
            await fs.writeFile(finalDest, minified);
        }
        if (addToProcessed) addToProcessed(finalDest);
    },

    // JavaScript файлы
    '.js': async (srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed) => {
        const jsSrc = await fs.readFile(srcPath, 'utf-8');
        const hash = hashContent(jsSrc);
        const hashedName = entry.name.replace(/\.js$/, `.${hash}.js`);
        const finalDest = path.join(path.dirname(destPath), hashedName);
        
        // Добавляем в манифест для замены в HTML
        assetManifest[`static/${relPath}`] = `static/${path.posix.join(path.dirname(relPath), hashedName)}`;
        
        if (!fs.existsSync(finalDest)) {
            const result = await esbuild.build({
                stdin: { contents: jsSrc, resolveDir: path.dirname(srcPath), sourcefile: entry.name },
                bundle: false,
                minify: true,
                write: false,
                format: 'iife',
                target: 'es2018'
            });
            const js = result.outputFiles[0].text;
            await fs.writeFile(finalDest, js);
        }
        if (addToProcessed) addToProcessed(finalDest);
    },

    // Markdown файлы
    '.md': async (srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed) => {
        const content = await fs.readFile(srcPath, 'utf-8');
        const { attributes, body } = frontMatter(content);
        let mdBody = body;
        // Специальная обработка для главной страницы
        if (relPath === 'index.md') {
            const proj = generateProjectsMarkup();
            mdBody = mdBody
                .replace(/{{postsList}}/g, generatePostsMarkdownList())
                .replace(/{{projectsFeatured}}/g, proj.featured)
                .replace(/{{projectsGrid}}/g, proj.grid);
        }
        const depth = path.relative(config.outputDir, path.dirname(destPath)).split(path.sep).filter(Boolean).length;
        const rootPrefix = depth === 0 ? '' : Array(depth).fill('..').join('/') + '/';
        let html = convertMarkdownToHtml(mdBody, {
            ...attributes,
            bodyClass: relPath === 'index.md' ? 'home' : (attributes.bodyClass || '')
        }, path.dirname(relPath));
        if (assetManifest['static/css/style.css']) {
            const stylePath = rootPrefix + assetManifest['static/css/style.css'];
            html = html.replace(/{{styleCss}}/g, stylePath);
        } else {
            html = html.replace(/{{styleCss}}/g, rootPrefix + 'static/css/style.css');
        }
        html = html.replace(/{{root}}/g, rootPrefix);
        for (const [orig, hashed] of Object.entries(assetManifest)) {
            const origPath1 = rootPrefix + orig;
            const hashedPath1 = rootPrefix + hashed;
            html = html.split(origPath1).join(hashedPath1);
            html = html.split(orig).join(hashed);
        }
        if (relPath === 'index.md') {
            html = html.replace(/{{socialsWithSubscribers}}/g, generateSocialIconsHtml(subscribers));
        }
        const htmlDest = destPath.replace(/\.md$/, '.html');
        await fs.ensureDir(path.dirname(htmlDest));
        await fs.writeFile(htmlDest, html);
        if (addToProcessed) addToProcessed(htmlDest);
        console.log(`Built: ${htmlDest}`);
    },

    // Изображения
    '.png': processImage,
    '.jpg': processImage,
    '.jpeg': processImage
};

// Обработчик по умолчанию (копирование файла как есть)
const defaultProcessor = async (srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed) => {
    await fs.copy(srcPath, destPath);
    if (addToProcessed) addToProcessed(destPath);
};

// Главная функция для обработки файла
async function processFile(srcPath, destPath, relPath, entry, forceRegenerate = false, addToProcessed = null) {
    const ext = path.extname(entry.name).toLowerCase();
    const processor = fileProcessors[ext] || defaultProcessor;
    
    try {
        await processor(srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed);
    } catch (error) {
        console.error(`Error processing ${relPath}:`, error.message);
        // Fallback к копированию в случае ошибки
        await defaultProcessor(srcPath, destPath);
    }
}

// Главная функция для обработки контентного файла (теперь просто вызывает processFile)
async function processContentFile(srcPath, destPath, relPath, entry, forceRegenerate = false, addToProcessed = null) {
    return await processFile(srcPath, destPath, relPath, entry, forceRegenerate, addToProcessed);
}

export {
    processFile,
    processContentFile,
    fileProcessors
}; 