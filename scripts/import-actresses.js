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
  // Top 50 - Tu devras ajouter les URLs d'images toi-même
  { first_name: "Lana", last_name: "Rhoades", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Mia", last_name: "Khalifa", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Riley", last_name: "Reid", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Mia", last_name: "Malkova", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: true },
  { first_name: "Angela", last_name: "White", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Abella", last_name: "Danger", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Madison", last_name: "Ivy", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Nicole", last_name: "Aniston", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Brandi", last_name: "Love", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Alexis", last_name: "Texas", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: true },
  { first_name: "Eva", last_name: "Lovia", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Dani", last_name: "Daniels", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Adriana", last_name: "Chechik", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Asa", last_name: "Akira", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Lisa", last_name: "Ann", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Kendra", last_name: "Lust", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Janice", last_name: "Griffith", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Emily", last_name: "Willis", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Gabbie", last_name: "Carter", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Autumn", last_name: "Falls", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Elsa", last_name: "Jean", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Lena", last_name: "Paul", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Valentina", last_name: "Nappi", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Kendra", last_name: "Sunderland", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Peta", last_name: "Jensen", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "August", last_name: "Ames", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Tori", last_name: "Black", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jessa", last_name: "Rhodes", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Lexi", last_name: "Belle", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: false, is_curvy: false },
  { first_name: "Remy", last_name: "Lacroix", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Jynx", last_name: "Maze", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: true },
  { first_name: "Gianna", last_name: "Michaels", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Sasha", last_name: "Grey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Jenna", last_name: "Jameson", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Jesse", last_name: "Jane", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Julia", last_name: "Ann", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Phoenix", last_name: "Marie", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Ava", last_name: "Addams", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Nikki", last_name: "Benz", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Jayden", last_name: "Jaymes", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Rachel", last_name: "Starr", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Bridgette", last_name: "B", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: true },
  { first_name: "Kagney", last_name: "Linn Karter", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Keisha", last_name: "Grey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Karlee", last_name: "Grey", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: false },
  { first_name: "Alina", last_name: "Lopez", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Vina", last_name: "Sky", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: false, is_curvy: false },
  { first_name: "Violet", last_name: "Myers", image_url_1: "", image_url_2: "", is_blonde: false, is_brunette: true, is_busty: true, is_curvy: true },
  { first_name: "Skylar", last_name: "Vox", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
  { first_name: "Blake", last_name: "Blossom", image_url_1: "", image_url_2: "", is_blonde: true, is_brunette: false, is_busty: true, is_curvy: false },
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