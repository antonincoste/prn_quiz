import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { actressId, guessed } = request.body;

    if (!actressId) {
      return response.status(400).json({ error: 'actressId required' });
    }

    if (guessed) {
      // La personne a trouvé → incrémenter times_shown ET times_guessed
      await sql`
        UPDATE actresses
        SET 
          times_shown = times_shown + 1,
          times_guessed = times_guessed + 1
        WHERE id = ${actressId}
      `;
    } else {
      // La personne n'a pas trouvé (skip ou mauvaise réponse) → incrémenter seulement times_shown
      await sql`
        UPDATE actresses
        SET times_shown = times_shown + 1
        WHERE id = ${actressId}
      `;
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Update stats error:', error);
    return response.status(500).json({ error: 'Server error' });
  }
}