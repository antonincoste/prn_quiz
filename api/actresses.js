import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer les paramètres de filtre (pour V2)
    const { blonde, brunette, busty, curvy, limit } = request.query;

    // Construction de la requête de base
    let result;
    
    // Si des filtres sont présents (V2)
    if (blonde === 'true' || brunette === 'true' || busty === 'true' || curvy === 'true') {
      result = await sql`
        SELECT 
          id, 
          first_name, 
          last_name, 
          image_url_1, 
          image_url_2,
          is_blonde,
          is_brunette,
          is_busty,
          is_curvy,
          times_shown,
          times_guessed
        FROM actresses
        WHERE 
          (${blonde === 'true'} = false OR is_blonde = true)
          AND (${brunette === 'true'} = false OR is_brunette = true)
          AND (${busty === 'true'} = false OR is_busty = true)
          AND (${curvy === 'true'} = false OR is_curvy = true)
        ORDER BY RANDOM()
        LIMIT ${parseInt(limit) || 50}
      `;
    } else {
      // Pas de filtre - retourne toutes les actrices (V1)
      result = await sql`
        SELECT 
          id, 
          first_name, 
          last_name, 
          image_url_1, 
          image_url_2,
          is_blonde,
          is_brunette,
          is_busty,
          is_curvy,
          times_shown,
          times_guessed
        FROM actresses
        ORDER BY RANDOM()
        LIMIT ${parseInt(limit) || 50}
      `;
    }

    // Transformer pour matcher le format attendu par le front
    const actresses = result.rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      image: row.image_url_1,
      image2: row.image_url_2,
      isBlonde: row.is_blonde,
      isBrunette: row.is_brunette,
      isBusty: row.is_busty,
      isCurvy: row.is_curvy,
      timesShown: row.times_shown,
      timesGuessed: row.times_guessed,
    }));

    return response.status(200).json({ actresses });
  } catch (error) {
    console.error('Get actresses error:', error);
    return response.status(500).json({ error: 'Server error' });
  }
}