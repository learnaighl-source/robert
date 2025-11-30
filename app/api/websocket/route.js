let clients = [];

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      clients.push(controller);
      
      const message = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
    cancel() {
      clients = clients.filter(c => c !== this.controller);
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
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  clients = clients.filter(controller => {
    try {
      controller.enqueue(encoder.encode(message));
      return true;
    } catch (error) {
      return false;
    }
  });
}