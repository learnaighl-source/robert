import { NextResponse } from 'next/server';

const clients = new Set();

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      
      return () => {
        clients.delete(controller);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function broadcast(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(controller => {
    try {
      controller.enqueue(message);
    } catch (error) {
      clients.delete(controller);
    }
  });
}