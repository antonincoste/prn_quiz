import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validation basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Insert dans la DB (UNIQUE constraint gère les doublons)
    await sql`
      INSERT INTO subscribers (email)
      VALUES (${email})
      ON CONFLICT (email) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}