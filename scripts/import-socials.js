// Script pour importer les liens sociaux depuis le CSV validé
// Usage: node scripts/import-socials.js
// Input: socials-validated.csv (copie de socials.csv avec tes corrections)

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';
import fs from 'fs';

config({ path: '.env.local' });

async function importSocials() {
  console.log('🚀 Importing socials from CSV...\n');
  
  // Lire le CSV
  if (!fs.existsSync('./socials-validated.csv')) {
    console.log('❌ socials-validated.csv not found.');
    console.log('1. Run scrape-socials.js first');
    console.log('2. Review/edit socials.csv');
    console.log('3. Save as socials-validated.csv');
    return;
  }
  
  const csv = fs.readFileSync('./socials-validated.csv', 'utf-8');
  const lines = csv.trim().split('\n');
  
  // Skip header
  const rows = lines.slice(1);
  
  let updated = 0;
  let skipped = 0;
  
  for (const row of rows) {
    // Parse CSV (gère les guillemets)
    const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 7) continue;
    
    const clean = (s) => s.replace(/^"|"$/g, '').trim();
    
    const id = parseInt(clean(matches[0]));
    const firstName = clean(matches[1]);
    const lastName = clean(matches[2]);
    const instagramFound = clean(matches[4]); // On utilise la colonne "found"
    const onlyfansFound = clean(matches[6]);
    
    if (!instagramFound && !onlyfansFound) {
      skipped++;
      continue;
    }
    
    try {
      // Update seulement les champs non vides
      if (instagramFound && onlyfansFound) {
        await sql`
          UPDATE actresses 
          SET instagram_url = ${instagramFound}, onlyfans_url = ${onlyfansFound}
          WHERE id = ${id}
        `;
      } else if (instagramFound) {
        await sql`
          UPDATE actresses 
          SET instagram_url = ${instagramFound}
          WHERE id = ${id}
        `;
      } else if (onlyfansFound) {
        await sql`
          UPDATE actresses 
          SET onlyfans_url = ${onlyfansFound}
          WHERE id = ${id}
        `;
      }
      
      console.log(`✅ ${firstName} ${lastName}`);
      updated++;
      
    } catch (error) {
      console.error(`❌ ${firstName} ${lastName}: ${error.message}`);
    }
  }
  
  console.log(`\n🏁 Done! Updated: ${updated}, Skipped: ${skipped}`);
}

importSocials();