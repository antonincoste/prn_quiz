// Script pour créer la table feature_flags
// Usage: node scripts/create-feature-flags.js

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function createFeatureFlags() {
  console.log('🚀 Creating feature_flags table...\n');

  try {
    // Créer la table
    await sql`
      CREATE TABLE IF NOT EXISTS feature_flags (
        name VARCHAR(50) PRIMARY KEY,
        enabled BOOLEAN DEFAULT false,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Table created');

    // Insérer les features V2 (désactivées par défaut)
    const features = [
      { name: 'leaderboard', description: 'Global leaderboard with rankings' },
      { name: 'categories', description: 'Filter by blonde, brunette, etc.' },
      { name: 'extra_spicy', description: 'Third mode with GIF extracts from videos' },
      { name: 'reveal_on_skip', description: 'Show actress name when skipping' },
      { name: 'confetti', description: 'Confetti animation on good score' },
      { name: 'difficulty', description: 'Easy/Normal/Hard timer options' },
      { name: 'high_score', description: 'Save and display personal best score' },
    ];

    for (const feature of features) {
      await sql`
        INSERT INTO feature_flags (name, enabled, description)
        VALUES (${feature.name}, false, ${feature.description})
        ON CONFLICT (name) DO UPDATE SET description = ${feature.description}
      `;
      console.log(`  ➕ ${feature.name}`);
    }

    console.log('\n✅ Feature flags initialized!');
    console.log('\n📝 To enable a feature, run in Neon console:');
    console.log("   UPDATE feature_flags SET enabled = true WHERE name = 'streak';");

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

createFeatureFlags();