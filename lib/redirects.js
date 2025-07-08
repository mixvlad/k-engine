const fs = require('fs-extra');
const path = require('path');
const { config } = require('./config');

// Generate simple HTML redirect page
function redirectPage(to) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"></head></html>`;
}

async function createRedirects() {
    // 1. /portfolio/ -> /
    const portfolioDir = path.join(config.outputDir, 'portfolio');
    await fs.ensureDir(portfolioDir);
    await fs.writeFile(path.join(portfolioDir, 'index.html'), redirectPage('../'));

    // 2. /portfolio/<project>/ -> /projects/<project>/
    const projectsRoot = path.join(config.sourceDir, 'projects');
    const projectSlugs = (await fs.readdir(projectsRoot, { withFileTypes: true }))
        .filter(d => d.isDirectory())
        .map(d => d.name);
    for (const slug of projectSlugs) {
        const legacyDir = path.join(portfolioDir, slug);
        await fs.ensureDir(legacyDir);
        await fs.writeFile(path.join(legacyDir, 'index.html'), redirectPage(`../../projects/${slug}/`));
    }

    // 3. Root /<post>/ -> /posts/<post>/
    const postsRoot = path.join(config.sourceDir, 'posts');
    const postSlugs = (await fs.readdir(postsRoot, { withFileTypes: true }))
        .filter(d => d.isDirectory())
        .map(d => d.name);
    for (const slug of postSlugs) {
        const legacyDir = path.join(config.outputDir, slug);
        await fs.ensureDir(legacyDir);
        await fs.writeFile(path.join(legacyDir, 'index.html'), redirectPage(`../posts/${slug}/`));
    }
}

module.exports = { createRedirects }; 