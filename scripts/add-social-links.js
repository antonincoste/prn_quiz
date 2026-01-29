// Script de migration pour ajouter les colonnes de liens sociaux
// Usage: node scripts/add-social-links.js

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function addSocialLinks() {
  console.log('🚀 Adding social links columns...\n');

  try {
    // Ajouter la colonne onlyfans_url
    await sql`
      ALTER TABLE actresses 
      ADD COLUMN IF NOT EXISTS onlyfans_url TEXT
    `;
    console.log('✅ Added onlyfans_url column');

    // Ajouter la colonne instagram_url
    await sql`
      ALTER TABLE actresses 
      ADD COLUMN IF NOT EXISTS instagram_url TEXT
    `;
    console.log('✅ Added instagram_url column');

    // Ajouter la colonne twitter_url
    await sql`
      ALTER TABLE actresses 
      ADD COLUMN IF NOT EXISTS twitter_url TEXT
    `;
    console.log('✅ Added twitter_url column');

    console.log('\n🏁 Done! Social links columns added.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSocialLinks();