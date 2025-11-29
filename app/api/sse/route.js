export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Initialize SSE clients array if not exists
      if (!global.sseClients) {
        global.sseClients = new Set();
      }

      const client = {
        write: (data) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('SSE write error:', error);
          }
        }
      };

      global.sseClients.add(client);

      // Send initial connection message
      client.write('data: {"type":"connected"}\n\n');

      // Cleanup on close
      const cleanup = () => {
        global.sseClients?.delete(client);
      };

      return cleanup;
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