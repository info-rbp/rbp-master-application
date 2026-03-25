
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const imageManifestPath = path.resolve('src/lib/placeholder-images.json');
const outputDir = path.resolve('public/optimized-images');

async function optimizeImages() {
    try {
        await fs.mkdir(outputDir, { recursive: true });

        const imageManifest = JSON.parse(await fs.readFile(imageManifestPath, 'utf-8'));
        const updatedManifest = { ...imageManifest };

        for (const key in imageManifest) {
            const { src, width, height } = imageManifest[key];

            const response = await fetch(src);
            if (!response.ok) {
                console.error(`Failed to fetch image: ${src}`);
                continue;
            }
            const buffer = Buffer.from(await response.arrayBuffer());

            const optimizedImage = await sharp(buffer)
                .resize(width, height)
                .webp({ quality: 80 })
                .toBuffer();

            const outputFileName = `${key}.webp`;
            const outputPath = path.join(outputDir, outputFileName);
            await fs.writeFile(outputPath, optimizedImage);

            updatedManifest[key].src = `/optimized-images/${outputFileName}`;
        }

        await fs.writeFile(imageManifestPath, JSON.stringify(updatedManifest, null, 2));

        console.log('Image optimization complete.');
    } catch (error) {
        console.error('Error optimizing images:', error);
    }
}

optimizeImages();
