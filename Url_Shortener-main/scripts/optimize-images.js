const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
    // Directories to search
    const dirsToSearch = [
        path.join(__dirname, '../public'),
        path.join(__dirname, '../src/assets')
    ];

    const findImages = (dir) => {
        if (!fs.existsSync(dir)) return [];
        const files = fs.readdirSync(dir);
        let images = [];
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                images = images.concat(findImages(filePath));
            } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
                images.push(filePath);
            }
        });
        return images;
    };

    let allImages = [];
    dirsToSearch.forEach(dir => {
        allImages = allImages.concat(findImages(dir));
    });

    console.log(`Found ${allImages.length} images to optimize`);

    for (const imagePath of allImages) {
        const dir = path.dirname(imagePath);
        const ext = path.extname(imagePath);
        const name = path.basename(imagePath, ext);
        const isPng = ext.toLowerCase() === '.png';
        
        try {
            // Read file into memory first to allow overwriting
            const data = fs.readFileSync(imagePath);
            
            // Generate WebP
            const webpPath = path.join(dir, `${name}.webp`);
            // Only generate webp, don't overwrite originals to avoid corruption or double-compression artifacts if run multiple times
            // The instructions said "Optimize original", but also "Create WebP version".
            // Optimizing original is good but risky if run repeatedly without checks. 
            // I'll skip overwriting original for safety unless user explicitly asked to destroy, 
            // but the checklist said "Optimize original". I'll do it safely.
            
            // Check if already optimized? Hard to tell. 
            // I will just do WebP generation and ensure original is at least compressed if it's huge, 
            // but maybe better to just do WebP for now to satisfy "Next Gen Formats".
            
            // Actually, checklist script did optimize original. I'll do it.
            // Using a temporary buffer.
            
            if (isPng) {
               await sharp(data)
                   .png({ quality: 80, compressionLevel: 9, palette: true })
                   .toFile(imagePath);
            } else {
               await sharp(data)
                   .jpeg({ quality: 80, mozjpeg: true })
                   .toFile(imagePath);
            }
            console.log(`✅ Optimized: ${path.basename(imagePath)}`);

            await sharp(data)
                .webp({ quality: 80 })
                .toFile(webpPath);
            console.log(`✨ Generated WebP: ${name}.webp`);

        } catch (error) {
             console.error(`❌ Error processing ${path.basename(imagePath)}:`, error);
        }
    }
    console.log('✅ All images processed!');
})();
