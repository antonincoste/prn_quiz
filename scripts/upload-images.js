// Script d'upload des images vers Vercel Blob
// Usage: node scripts/upload-images.js
// 
// Structure attendue:
// images/
//   lana-rhoades.jpg        (SFW - image_url_1)
//   lana-rhoades_nsfw.jpg   (NSFW - image_url_2)
//   mia-khalifa.jpg
//   mia-khalifa_nsfw.jpg
//   ...
//
// Après upload, les images sont déplacées dans images/archive/

import { put } from '@vercel/blob';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const IMAGES_DIR = './images'; // Dossier contenant tes images
const ARCHIVE_DIR = './images/archive'; // Dossier archive

async function uploadImages() {
  console.log('🚀 Starting upload to Vercel Blob...\n');

  // Vérifie que le dossier existe
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log(`❌ Folder "${IMAGES_DIR}" not found.`);
    console.log('Create it and add your images:');
    console.log('  images/');
    console.log('    lana-rhoades.jpg        (SFW)');
    console.log('    lana-rhoades_nsfw.jpg   (NSFW)');
    console.log('    ...');
    return;
  }

  // Crée le dossier archive s'il n'existe pas
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(f => 
    (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp'))
    && !fs.statSync(path.join(IMAGES_DIR, f)).isDirectory()
  );

  if (files.length === 0) {
    console.log('❌ No images found in folder.');
    return;
  }

  console.log(`Found ${files.length} images\n`);

  const sfwResults = [];
  const nsfwResults = [];

  for (const file of files) {
    try {
      const filePath = path.join(IMAGES_DIR, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      // Détecter si c'est une image NSFW
      const isNsfw = file.includes('_nsfw');
      const folder = isNsfw ? 'actresses-nsfw' : 'actresses';
      
      const blob = await put(`${folder}/${file}`, fileBuffer, {
        access: 'public',
        contentType: `image/${file.split('.').pop()}`,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      const type = isNsfw ? '🔞 NSFW' : '✅ SFW';
      console.log(`${type} ${file}`);
      console.log(`   ${blob.url}`);

      // Extraire le nom sans le suffixe _nsfw et sans extension
      const baseName = file
        .replace('_nsfw', '')
        .replace(/\.(jpg|jpeg|png|webp)$/, '');

      if (isNsfw) {
        nsfwResults.push({ name: baseName, url: blob.url });
      } else {
        sfwResults.push({ name: baseName, url: blob.url });
      }

      // Déplacer vers archive
      const archivePath = path.join(ARCHIVE_DIR, file);
      fs.renameSync(filePath, archivePath);
      console.log(`   📦 Moved to archive\n`);

    } catch (error) {
      console.error(`❌ ${file}: ${error.message}\n`);
    }
  }

  // Génère les fichiers avec les URLs
  if (sfwResults.length > 0) {
    const output = sfwResults.map(r => `${r.name}: ${r.url}`).join('\n');
    fs.writeFileSync('./image-urls.txt', output);
    console.log('📝 SFW URLs saved to image-urls.txt');
  }

  if (nsfwResults.length > 0) {
    const output = nsfwResults.map(r => `${r.name}: ${r.url}`).join('\n');
    fs.writeFileSync('./image-urls-nsfw.txt', output);
    console.log('📝 NSFW URLs saved to image-urls-nsfw.txt');
  }

  console.log(`\n🏁 Done!`);
  console.log(`   SFW uploaded: ${sfwResults.length}`);
  console.log(`   NSFW uploaded: ${nsfwResults.length}`);
}

uploadImages();