import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = request.body;

    // Validation basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return response.status(400).json({ error: 'Invalid email' });
    }

    // Insert dans la DB (UNIQUE constraint gère les doublons)
    await sql`
      INSERT INTO subscribers (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `;

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return response.status(500).json({ error: 'Server error' });
  }
}