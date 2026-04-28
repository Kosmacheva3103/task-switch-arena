import { initSocketServer } from '@/server/socket/server';
import type { NextRequest } from 'next/server';

let initialized = false;

export async function GET(req: NextRequest) {
  if (!initialized) {
    const { Server } = require('http');
    const httpServer = new Server((req: any, res: any) => {});
    
    initSocketServer(httpServer);
    
    httpServer.listen(3001, () => {
      console.log('Socket.io сервер запущен на порту 3001');
    });
    
    initialized = true;
  }

  return new Response('Socket.io сервер запущен', { status: 200 });
}