import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blonde, brunette, busty, curvy, limit } = request.query;

    let result;
    
    if (blonde === 'true' || brunette === 'true' || busty === 'true' || curvy === 'true') {
      result = await sql`
        SELECT 
          id, first_name, last_name, image_url_1, image_url_2,
          is_blonde, is_brunette, is_busty, is_curvy,
          times_shown, times_guessed,
          onlyfans_url, instagram_url, twitter_url
        FROM actresses
        WHERE 
          image_url_1 IS NOT NULL AND image_url_1 != ''
          AND (${blonde === 'true'} = false OR is_blonde = true)
          AND (${brunette === 'true'} = false OR is_brunette = true)
          AND (${busty === 'true'} = false OR is_busty = true)
          AND (${curvy === 'true'} = false OR is_curvy = true)
        ORDER BY RANDOM()
        LIMIT ${parseInt(limit) || 100}
      `;
    } else {
      result = await sql`
        SELECT 
          id, first_name, last_name, image_url_1, image_url_2,
          is_blonde, is_brunette, is_busty, is_curvy,
          times_shown, times_guessed,
          onlyfans_url, instagram_url, twitter_url
        FROM actresses
        WHERE image_url_1 IS NOT NULL AND image_url_1 != ''
        ORDER BY RANDOM()
        LIMIT ${parseInt(limit) || 100}
      `;
    }

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
      onlyfans: row.onlyfans_url,
      instagram: row.instagram_url,
      twitter: row.twitter_url,
    }));

    return response.status(200).json({ actresses });
  } catch (error) {
    console.error('Get actresses error:', error);
    return response.status(500).json({ error: 'Server error' });
  }
}