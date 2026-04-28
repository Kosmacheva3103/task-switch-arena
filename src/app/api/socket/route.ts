import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'Socket.io endpoint ready',
    message: 'WebSocket сервер настраивается через кастомный сервер',
  });
}