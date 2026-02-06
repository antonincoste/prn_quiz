// API pour récupérer les feature flags
// GET /api/features

import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await sql`
      SELECT name, enabled FROM feature_flags
    `;

    // Transformer en objet { featureName: true/false }
    const features = {};
    for (const row of result.rows) {
      features[row.name] = row.enabled;
    }

    // Cache de 60 secondes pour éviter trop d'appels DB
    response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return response.status(200).json({ features });
  } catch (error) {
    console.error('Get features error:', error);
    // En cas d'erreur, retourner tout désactivé
    return response.status(200).json({ features: {} });
  }
}