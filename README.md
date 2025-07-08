# k-engine

Static site generator for KozTV projects. Simple and fast tool for creating blogs and portfolios.

## Installation

```bash
npm install k-engine
```

## Usage

### Global installation
```bash
npm install -g k-engine
k-engine build
k-engine serve
```

### Local usage
```bash
npx k-engine build
npx k-engine serve
```

## Project Structure

```
project/
├── content/          # Source content
│   ├── posts/        # Blog posts in Markdown
│   └── projects/     # Projects with images and videos
├── static/           # Static files (CSS, JS, images)
├── templates/        # HTML templates (optional)
├── docs/            # Generated site
└── subscribers.json  # Email subscribers list
```

## Commands

### Build site
```bash
npm run build
```

### Start dev server
```bash
npm run serve
```

### Development mode with auto-rebuild
```bash
npm run build -- --watch
```

### Force regenerate all images
```bash
npm run build -- --force-regenerate
```

### Clean output directory before build
```bash
npm run build -- --clean
```

## Features

### Automatic image processing
- WebP and AVIF format generation
- Responsive images with different sizes
- Automatic quality optimization

### Automatic cleanup
- Removes files from `docs/` that no longer exist in source content
- Cleans up empty directories
- Real-time change tracking

### Hot Reload
- Automatic browser refresh on changes
- BrowserSync for cross-device synchronization

### GitHub Pages ready
- Automatic `.nojekyll` file creation
- CNAME support for custom domains (configurable)

## Configuration

### Image settings
In `lib/config.js` you can configure:
- Generation sizes (default: 480px, 960px)
- Quality for different formats
- Responsive breakpoints

### Template customization
- Add `templates/` folder in project root
- Override `templates/page.html` to change design

### Override static files
- Add `static/` folder in project root
- Your files will be copied over default ones

### CNAME и другие настройки через внешний файл

Создайте `k-engine.config.json` или `config.json` в корне проекта. Вы можете переопределить любые параметры:

```json
{
  "cname": "your-domain.com",
  "sourceDir": "content",
  "outputDir": "docs",
  "googleAnalytics": "G-XXXXXXXXXX",
  "images": {
    "sizes": [320, 640, 1280],
    "quality": { "webp": 90, "avif": 60 }
  }
}
```

Если параметр не задан, используется значение по умолчанию. Если `cname` не указан или равен `null`, файл CNAME не будет создан. Если `googleAnalytics` не указан, Google Analytics не будет подключен.

## Publishing to npm

### Preparation for publishing

1. **Update version in package.json:**
   ```bash
   npm version patch  # 1.0.3 -> 1.0.4
   npm version minor  # 1.0.3 -> 1.1.0
   npm version major  # 1.0.3 -> 2.0.0
   ```

2. **Check package.json contents:**
   - Make sure `files` contains all necessary files
   - Check `bin` section for CLI command
   - Update `description` and `keywords` if needed

3. **Test locally:**
   ```bash
   npm pack
   npm install -g ./k-engine-1.0.4.tgz
   k-engine build
   ```

### Publishing

1. **Login to npm:**
   ```bash
   npm login
   ```

2. **Publish package:**
   ```bash
   npm publish
   ```

3. **For publishing with tag (optional):**
   ```bash
   npm publish --tag beta
   ```

### Publishing updates

1. **Update version:**
   ```bash
   npm version patch
   ```

2. **Publish:**
   ```bash
   npm publish
   ```

### Version rollback (if needed)

1. **Undo last version commit:**
   ```bash
   git reset --hard HEAD~1
   ```

2. **Or delete tag:**
   ```bash
   git tag -d v1.0.4
   git push origin :refs/tags/v1.0.4
   ```

## Dependencies

- **Node.js** >= 18
- **Main packages:**
  - `sharp` - image processing
  - `marked` - Markdown parsing
  - `browser-sync` - dev server
  - `express` - web server
  - `esbuild` - JavaScript bundling

## License

MIT 