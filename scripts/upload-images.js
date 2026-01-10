// Script d'upload des images vers Vercel Blob
// Usage: node scripts/upload-images.js
// 
// Structure attendue:
// images/
//   lana-rhoades.jpg
//   mia-khalifa.jpg
//   ...

import { put } from '@vercel/blob';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const IMAGES_DIR = './images'; // Dossier contenant tes images

async function uploadImages() {
  console.log('🚀 Starting upload to Vercel Blob...\n');

  // Vérifie que le dossier existe
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`❌ Folder "${IMAGES_DIR}" not found.`);
    console.log('Create it and add your images:');
    console.log('  images/');
    console.log('    lana-rhoades.jpg');
    console.log('    mia-khalifa.jpg');
    console.log('    ...');
    return;
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(f => 
    f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp')
  );

  if (files.length === 0) {
    console.log('❌ No images found in folder.');
    return;
  }

  console.log(`Found ${files.length} images\n`);

  const results = [];

  for (const file of files) {
    try {
      const filePath = path.join(IMAGES_DIR, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      const blob = await put(`actresses/${file}`, fileBuffer, {
        access: 'public',
        contentType: `image/${file.split('.').pop()}`,
      });

      console.log(`✅ ${file}`);
      console.log(`   ${blob.url}\n`);

      results.push({
        name: file.replace(/\.(jpg|jpeg|png|webp)$/, ''),
        url: blob.url,
      });
    } catch (error) {
      console.error(`❌ ${file}: ${error.message}\n`);
    }
  }

  // Génère un fichier avec les URLs pour faciliter la mise à jour
  if (results.length > 0) {
    const output = results.map(r => `${r.name}: ${r.url}`).join('\n');
    fs.writeFileSync('./image-urls.txt', output);
    console.log('\n📝 URLs saved to image-urls.txt');
  }

  console.log(`\n🏁 Done! Uploaded: ${results.length}/${files.length}`);
}

uploadImages();