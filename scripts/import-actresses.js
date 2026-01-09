// Script d'import des actrices
// Usage: node scripts/import-actresses.js
// Nécessite: npm install @vercel/postgres dotenv

import { createPool } from '@vercel/postgres';
import { config } from 'dotenv';

// Charge .env.local (créé par `vercel env pull .env.local`)
config({ path: '.env.local' });

// Crée une connexion avec l'URL non-pooling pour les scripts
const pool = createPool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
});

const actresses = [
  {
    first_name: "Lana",
    last_name: "Rhoades",
    image_url_1: "https://example.com/lana1.jpg",
    image_url_2: "https://example.com/lana2.jpg",
    is_blonde: false,
    is_brunette: true,
    is_busty: true,
    is_curvy: false,
  },
  {
    first_name: "Mia",
    last_name: "Malkova",
    image_url_1: "https://example.com/mia1.jpg",
    image_url_2: "https://example.com/mia2.jpg",
    is_blonde: true,
    is_brunette: false,
    is_busty: false,
    is_curvy: true,
  },
  // Ajoute tes actrices ici...
  // {
  //   first_name: "",
  //   last_name: "",
  //   image_url_1: "",
  //   image_url_2: "",
  //   is_blonde: false,
  //   is_brunette: false,
  //   is_busty: false,
  //   is_curvy: false,
  // },
];

async function importActresses() {
  console.log('🚀 Starting import...');
  
  let imported = 0;
  let skipped = 0;

  for (const actress of actresses) {
    try {
      await pool.sql`
        INSERT INTO actresses (
          first_name, 
          last_name, 
          image_url_1, 
          image_url_2, 
          is_blonde, 
          is_brunette, 
          is_busty, 
          is_curvy
        )
        VALUES (
          ${actress.first_name},
          ${actress.last_name},
          ${actress.image_url_1},
          ${actress.image_url_2 || null},
          ${actress.is_blonde},
          ${actress.is_brunette},
          ${actress.is_busty},
          ${actress.is_curvy}
        )
        ON CONFLICT DO NOTHING
      `;
      console.log(`✅ ${actress.first_name} ${actress.last_name}`);
      imported++;
    } catch (error) {
      console.error(`❌ ${actress.first_name} ${actress.last_name}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n🏁 Done! Imported: ${imported}, Skipped: ${skipped}`);
}

importActresses();