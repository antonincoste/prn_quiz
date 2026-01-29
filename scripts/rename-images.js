// Script pour renommer les images avec l'ID de l'actrice
// Usage: node scripts/rename-images.js
// 
// Ce script :
// 1. Récupère toutes les actrices avec leurs images actuelles
// 2. Télécharge chaque image depuis Vercel Blob
// 3. Ré-upload avec le nouveau nom (ID.ext pour SFW, ID_nsfw.ext pour NSFW)
// 4. Met à jour l'URL en DB
// 5. Supprime l'ancienne image

import { sql } from '@vercel/postgres';
import { put, del } from '@vercel/blob';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function renameImages() {
  console.log('🚀 Starting image renaming...\n');

  // Récupérer toutes les actrices avec images
  const result = await sql`
    SELECT id, first_name, last_name, image_url_1, image_url_2 
    FROM actresses 
    WHERE (image_url_1 IS NOT NULL AND image_url_1 != '')
       OR (image_url_2 IS NOT NULL AND image_url_2 != '')
  `;

  const actresses = result.rows;
  console.log(`Found ${actresses.length} actresses with images\n`);

  let renamed = 0;
  let skipped = 0;
  let failed = 0;

  for (const actress of actresses) {
    // Traiter image_url_1 (SFW)
    if (actress.image_url_1) {
      const resultSfw = await processImage(
        actress.id,
        actress.first_name,
        actress.last_name,
        actress.image_url_1,
        'image_url_1',
        false // not NSFW
      );
      if (resultSfw === 'renamed') renamed++;
      else if (resultSfw === 'skipped') skipped++;
      else failed++;
    }

    // Traiter image_url_2 (NSFW)
    if (actress.image_url_2) {
      const resultNsfw = await processImage(
        actress.id,
        actress.first_name,
        actress.last_name,
        actress.image_url_2,
        'image_url_2',
        true // NSFW
      );
      if (resultNsfw === 'renamed') renamed++;
      else if (resultNsfw === 'skipped') skipped++;
      else failed++;
    }
  }

  console.log('─'.repeat(40));
  console.log(`🏁 Done!`);
  console.log(`   Renamed: ${renamed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

async function processImage(actressId, firstName, lastName, oldUrl, column, isNsfw) {
  const type = isNsfw ? 'NSFW' : 'SFW';
  const filename = oldUrl.split('/').pop().split('?')[0];
  const nameWithoutExt = filename.split('.')[0];
  const expectedName = isNsfw ? `${actressId}_nsfw` : String(actressId);

  // Vérifier si déjà renommé
  if (nameWithoutExt === expectedName) {
    console.log(`⏭️  ${firstName} ${lastName} (${type}) - already renamed`);
    return 'skipped';
  }

  // Extraire l'extension
  const ext = filename.split('.').pop();
  const newFilename = `${expectedName}.${ext}`;
  const folder = isNsfw ? 'actresses-nsfw' : 'actresses';

  try {
    // Télécharger l'image
    console.log(`📥 Downloading ${filename} (${type})...`);
    const response = await fetch(oldUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }
    const imageBuffer = await response.arrayBuffer();

    // Ré-uploader avec le nouveau nom
    console.log(`📤 Uploading as ${newFilename}...`);
    const blob = await put(`${folder}/${newFilename}`, imageBuffer, {
      access: 'public',
      contentType: response.headers.get('content-type') || 'image/jpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Mettre à jour l'URL en DB
    if (column === 'image_url_1') {
      await sql`UPDATE actresses SET image_url_1 = ${blob.url} WHERE id = ${actressId}`;
    } else {
      await sql`UPDATE actresses SET image_url_2 = ${blob.url} WHERE id = ${actressId}`;
    }

    // Supprimer l'ancienne image
    try {
      await del(oldUrl);
      console.log(`🗑️  Deleted old image`);
    } catch (delError) {
      console.log(`⚠️  Could not delete old image: ${delError.message}`);
    }

    console.log(`✅ ${firstName} ${lastName} (${type}) → ${newFilename}\n`);
    return 'renamed';

  } catch (error) {
    console.error(`❌ ${firstName} ${lastName} (${type}): ${error.message}\n`);
    return 'failed';
  }
}

renameImages();