// Script pour ajouter la colonne gif_url (Extra Spicy mode)
// Usage: node scripts/add-gif-column.js

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function addGifColumn() {
  console.log('🚀 Adding gif_url column to actresses table...\n');

  try {
    // Ajouter la colonne gif_url
    await sql`
      ALTER TABLE actresses 
      ADD COLUMN IF NOT EXISTS gif_url TEXT
    `;
    
    console.log('✅ Column gif_url added!');
    console.log('\n📝 Structure:');
    console.log('   - image_url_1: SFW image');
    console.log('   - image_url_2: NSFW image');
    console.log('   - gif_url: Extra Spicy GIF');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

addGifColumn();