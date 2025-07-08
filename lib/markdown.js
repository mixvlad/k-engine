import fs from 'fs-extra';
import path from 'path';
import { marked } from 'marked';
import frontMatter from 'front-matter';
import sizeOf from 'image-size';
import { config } from './config.js';
import { createImageHtml, createSrcset, createSizes } from './images.js';

let currentMdDir = '';

// Настраиваем marked для обработки ссылок
const renderer = new marked.Renderer();
const originalLinkRenderer = renderer.link.bind(renderer);
renderer.link = (href, title, text) => {
    // Если ссылка начинается с /, убираем слеш
    if (href.startsWith('/')) {
        href = href.substring(1);
    }
    // Remove index.html at end of href
    if (href.endsWith('index.html')) {
        href = href.slice(0, -'index.html'.length);
    }
    return originalLinkRenderer(href, title, text);
};

const originalImageRenderer = renderer.image.bind(renderer);
renderer.image = (href, title, text) => {
    return createImageHtml(href, title, text, currentMdDir, 'content');
};

marked.setOptions({ renderer });

// Читаем шаблон
const template = fs.readFileSync(config.templateFile, 'utf-8');

// Функция для конвертации Markdown в HTML
function convertMarkdownToHtml(markdown, metadata, mdDirRel) {
    const prevDir = currentMdDir;
    currentMdDir = mdDirRel || '';
    const content = marked.parse(markdown);
    currentMdDir = prevDir;
    let dateStr = metadata.date || '';
    if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().slice(0, 10);
    }
    const devScript = '';
    const yearStr = new Date().getFullYear();
    return template
        .replace(/{{title}}/g, metadata.title || '')
        .replace(/{{date}}/g, dateStr)
        .replace(/{{bodyClass}}/g, metadata.bodyClass || '')
        .replace(/{{year}}/g, yearStr)
        .replace(/{{devReload}}/g, devScript)
        .replace('{{content}}', content);
}

// Generate markdown bullet list of posts sorted by date desc
function generatePostsMarkdownList() {
    const postsRoot = path.join(config.sourceDir, 'posts');
    const slugs = fs.readdirSync(postsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    const metas = slugs.map(slug => {
        const mdPath = path.join(postsRoot, slug, 'index.md');
        try {
            const mdContent = fs.readFileSync(mdPath, 'utf-8');
            const { attributes } = frontMatter(mdContent);
            const date = attributes.date || '1970-01-01';
            const title = attributes.title || slug;
            return { slug, title, date };
        } catch {
            return null;
        }
    }).filter(Boolean);
    metas.sort((a, b) => {
        const ta = Date.parse(a.date);
        const tb = Date.parse(b.date);
        return tb - ta;
    });
    return metas.map(m => `* [${m.title}](posts/${m.slug}/)`).join('\n');
}

// Generate HTML markup for projects section
function generateProjectsMarkup() {
    const projectsRoot = path.join(config.sourceDir, 'projects');
    if (!fs.existsSync(projectsRoot)) return { featured: '', grid: '' };

    const dirs = fs.readdirSync(projectsRoot, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

    const metas = dirs.map(slug => {
        const mdPath = path.join(projectsRoot, slug, 'index.md');
        let title = slug;
        let date = '1970-01-01';
        let featured = false;
        if (fs.existsSync(mdPath)) {
            const { attributes } = frontMatter(fs.readFileSync(mdPath, 'utf-8'));
            title = attributes.title || title;
            date = attributes.date || date;
            featured = !!attributes.featured;
        }

        // find cover image
        const dirFiles = fs.readdirSync(path.join(projectsRoot, slug));
        let cover = dirFiles.find(f => /^cover\.(png|jpe?g|gif|svg|webp)$/i.test(f));
        if (!cover) {
            cover = dirFiles.find(f => /image1\.(png|jpe?g|gif|svg|webp)$/i.test(f));
        }
        const hasVideo = fs.existsSync(path.join(projectsRoot, slug, 'video.mp4'));

        return { slug, title, date, cover, hasVideo, featured };
    });

    metas.sort((a,b)=> Date.parse(b.date) - Date.parse(a.date));

    let featuredProject = metas.find(m=>m.featured);
    if(!featuredProject && metas.length) featuredProject = metas[0];
    const others = metas.filter(m=>m!==featuredProject);

    const makeAnchor = m => {
        const videoAttr = m.hasVideo ? ' data-video' : '';
        const imgSrc = m.cover ? `projects/${m.slug}/${m.cover}` : '';
        let dimAttr = '';
        if (imgSrc) {
            try {
                const { width, height } = sizeOf(path.join(projectsRoot, m.slug, m.cover));
                if (width && height) {
                    dimAttr = ` width="${width}" height="${height}" style="aspect-ratio:${width}/${height}"`;
                }
            } catch {}
        }
        const ratioStyle = m.cover && dimAttr ? ` style="aspect-ratio:${dimAttr.match(/width=\"(\d+)/)[1]}/${dimAttr.match(/height=\"(\d+)/)[1]}"` : '';
        let imgTag = '';
        if (imgSrc) {
            // Используем контекст для определения оптимального размера
            const context = m === featuredProject ? 'featured' : 'grid';
            imgTag = createImageHtml(imgSrc, m.title, m.title, '', context);
        }
        return `<a class="project-item${m===featuredProject?' full':''}" href="projects/${m.slug}/"${videoAttr}${ratioStyle}>${imgTag}<span class="caption">${m.title}</span></a>`;
    };

    return {
        featured: featuredProject ? makeAnchor(featuredProject) : '',
        grid: others.map(makeAnchor).join('\n\n')
    };
}

export {
    convertMarkdownToHtml,
    generatePostsMarkdownList,
    generateProjectsMarkup
}; 