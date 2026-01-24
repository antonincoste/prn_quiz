// Script pour renommer les images avec l'ID de l'actrice
// Usage: node scripts/rename-images.js
// 
// Ce script :
// 1. Récupère toutes les actrices avec leurs images actuelles
// 2. Télécharge chaque image depuis Vercel Blob
// 3. Ré-upload avec le nouveau nom (ID.ext)
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
    SELECT id, first_name, last_name, image_url_1 
    FROM actresses 
    WHERE image_url_1 IS NOT NULL AND image_url_1 != ''
  `;

  const actresses = result.rows;
  console.log(`Found ${actresses.length} actresses with images\n`);

  let renamed = 0;
  let skipped = 0;
  let failed = 0;

  for (const actress of actresses) {
    const oldUrl = actress.image_url_1;
    
    // Vérifier si déjà renommé (URL contient juste un ID)
    const filename = oldUrl.split('/').pop().split('?')[0];
    const nameWithoutExt = filename.split('.')[0];
    
    if (nameWithoutExt === String(actress.id)) {
      console.log(`⏭️  ${actress.first_name} ${actress.last_name} - already renamed`);
      skipped++;
      continue;
    }

    // Extraire l'extension
    const ext = filename.split('.').pop();
    const newFilename = `${actress.id}.${ext}`;

    try {
      // Télécharger l'image
      console.log(`📥 Downloading ${filename}...`);
      const response = await fetch(oldUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      const imageBuffer = await response.arrayBuffer();

      // Ré-uploader avec le nouveau nom
      console.log(`📤 Uploading as ${newFilename}...`);
      const blob = await put(`actresses/${newFilename}`, imageBuffer, {
        access: 'public',
        contentType: response.headers.get('content-type') || 'image/jpeg',
      });

      // Mettre à jour l'URL en DB
      await sql`
        UPDATE actresses 
        SET image_url_1 = ${blob.url}
        WHERE id = ${actress.id}
      `;

      // Supprimer l'ancienne image
      try {
        await del(oldUrl);
        console.log(`🗑️  Deleted old image`);
      } catch (delError) {
        console.log(`⚠️  Could not delete old image: ${delError.message}`);
      }

      console.log(`✅ ${actress.first_name} ${actress.last_name} → ${newFilename}\n`);
      renamed++;

    } catch (error) {
      console.error(`❌ ${actress.first_name} ${actress.last_name}: ${error.message}\n`);
      failed++;
    }
  }

  console.log('─'.repeat(40));
  console.log(`🏁 Done!`);
  console.log(`   Renamed: ${renamed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
}

renameImages();