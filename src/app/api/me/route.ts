import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ userId: null, name: null });
    }

    // Декодируем токен (он в формате: token.signature)
    const token = sessionToken.split('.')[0];

    // Ищем сессию в БД
    const db = new Database('auth.db');
    const session = db.prepare('SELECT userId FROM session WHERE token = ?').get(token) as any;
    
    if (!session) {
      db.close();
      return NextResponse.json({ userId: null, name: null });
    }

    // Получаем пользователя
    const user = db.prepare('SELECT id, name, email FROM user WHERE id = ?').get(session.userId) as any;
    db.close();

    if (!user) {
      return NextResponse.json({ userId: null, name: null });
    }

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return NextResponse.json({ userId: null, name: null });
  }
}