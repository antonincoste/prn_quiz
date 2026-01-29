// Script de mise à jour des URLs d'images dans la DB
// Usage: node scripts/update-image-urls.js
// Lit image-urls.txt (SFW) et image-urls-nsfw.txt (NSFW) et met à jour la table actresses

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

async function updateImageUrls() {
  console.log('🚀 Starting DB update...\n');

  let totalUpdated = 0;
  let totalFailed = 0;

  // Traiter les images SFW (image_url_1)
  if (fs.existsSync('./image-urls.txt')) {
    console.log('📷 Processing SFW images (image_url_1)...\n');
    const content = fs.readFileSync('./image-urls.txt', 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      const [name, url] = line.split(': ');
      if (!name || !url) continue;

      const parts = name.split('-');
      const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const lastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

      try {
        const result = await sql`
          UPDATE actresses 
          SET image_url_1 = ${url}
          WHERE LOWER(first_name) = ${firstName.toLowerCase()} 
          AND LOWER(last_name) = ${lastName.toLowerCase()}
        `;

        if (result.rowCount > 0) {
          console.log(`✅ ${firstName} ${lastName} (SFW)`);
          totalUpdated++;
        } else {
          console.log(`⚠️  ${firstName} ${lastName} - not found in DB`);
          totalFailed++;
        }
      } catch (error) {
        console.error(`❌ ${firstName} ${lastName}: ${error.message}`);
        totalFailed++;
      }
    }
  } else {
    console.log('ℹ️  No image-urls.txt found, skipping SFW images\n');
  }

  // Traiter les images NSFW (image_url_2)
  if (fs.existsSync('./image-urls-nsfw.txt')) {
    console.log('\n🔞 Processing NSFW images (image_url_2)...\n');
    const content = fs.readFileSync('./image-urls-nsfw.txt', 'utf-8');
    const lines = content.trim().split('\n');

    for (const line of lines) {
      const [name, url] = line.split(': ');
      if (!name || !url) continue;

      const parts = name.split('-');
      const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const lastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

      try {
        const result = await sql`
          UPDATE actresses 
          SET image_url_2 = ${url}
          WHERE LOWER(first_name) = ${firstName.toLowerCase()} 
          AND LOWER(last_name) = ${lastName.toLowerCase()}
        `;

        if (result.rowCount > 0) {
          console.log(`✅ ${firstName} ${lastName} (NSFW)`);
          totalUpdated++;
        } else {
          console.log(`⚠️  ${firstName} ${lastName} - not found in DB`);
          totalFailed++;
        }
      } catch (error) {
        console.error(`❌ ${firstName} ${lastName}: ${error.message}`);
        totalFailed++;
      }
    }
  } else {
    console.log('ℹ️  No image-urls-nsfw.txt found, skipping NSFW images\n');
  }

  console.log(`\n🏁 Done! Updated: ${totalUpdated}, Failed: ${totalFailed}`);
}

updateImageUrls();