// Script de mise à jour des URLs d'images dans la DB
// Usage: node scripts/update-image-urls.js
// Lit image-urls.txt et met à jour la table actresses

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

async function updateImageUrls() {
  console.log('🚀 Starting DB update...\n');

  // Lire le fichier image-urls.txt
  if (!fs.existsSync('./image-urls.txt')) {
    console.log('❌ image-urls.txt not found. Run upload-images.js first.');
    return;
  }

  const content = fs.readFileSync('./image-urls.txt', 'utf-8');
  const lines = content.trim().split('\n');

  let updated = 0;
  let failed = 0;

  for (const line of lines) {
    // Format: "prenom-nom: https://..."
    const [name, url] = line.split(': ');
    if (!name || !url) continue;

    // Convertir "lana-rhoades" en "Lana" et "Rhoades"
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
        console.log(`✅ ${firstName} ${lastName}`);
        updated++;
      } else {
        console.log(`⚠️  ${firstName} ${lastName} - not found in DB`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${firstName} ${lastName}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n🏁 Done! Updated: ${updated}, Failed: ${failed}`);
}

updateImageUrls();