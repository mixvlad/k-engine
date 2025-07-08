const fs = require('fs-extra');
const { hashContent } = require('./hash');

// Проверка необходимости регенерации файла по контрольной сумме
async function shouldRegenerateFile(sourcePath, destPath, forceRegenerate = false) {
    if (forceRegenerate) {
        console.log(`  Force regenerating ${destPath}`);
        return true;
    }
    try {
        if (!fs.existsSync(destPath)) {
            console.log(`  Regenerating ${destPath} (doesn't exist)`);
            return true;
        }
        const sourceBuf = await fs.readFile(sourcePath);
        const destBuf = await fs.readFile(destPath);
        const sourceHash = hashContent(sourceBuf);
        const destHash = hashContent(destBuf);
        if (sourceHash !== destHash) {
            console.log(`  Regenerating ${destPath} (hash mismatch: ${sourceHash} != ${destHash})`);
            return true;
        }
        return false;
    } catch (error) {
        console.warn(`Warning: Could not compare file hashes for ${sourcePath} vs ${destPath}:`, error.message);
        return true;
    }
}

// Проверка необходимости регенерации генерируемого изображения по времени модификации
async function shouldRegenerateGeneratedImage(sourcePath, destPath, forceRegenerate = false) {
    if (forceRegenerate) {
        console.log(`  Force regenerating generated image ${destPath}`);
        return true;
    }
    try {
        if (!fs.existsSync(destPath)) {
            console.log(`  Regenerating generated image ${destPath} (doesn't exist)`);
            return true;
        }
        
        const sourceStats = await fs.stat(sourcePath);
        const destStats = await fs.stat(destPath);
        
        // Если исходный файл новее целевого, нужно регенерировать
        if (sourceStats.mtime > destStats.mtime) {
            console.log(`  Regenerating generated image ${destPath} (source is newer)`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.warn(`Warning: Could not compare file times for ${sourcePath} vs ${destPath}:`, error.message);
        return true;
    }
}

module.exports = { 
    shouldRegenerateFile,
    shouldRegenerateGeneratedImage
}; 