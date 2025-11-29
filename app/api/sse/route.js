export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let isConnected = true;
      
      if (!global.sseClients) {
        global.sseClients = new Set();
      }

      const client = {
        write: (data) => {
          if (!isConnected) return false;
          try {
            controller.enqueue(encoder.encode(data));
            return true;
          } catch (error) {
            isConnected = false;
            global.sseClients?.delete(client);
            return false;
          }
        },
        close: () => {
          isConnected = false;
          try {
            controller.close();
          } catch (e) {}
          global.sseClients?.delete(client);
        }
      };

      global.sseClients.add(client);
      client.write('data: {"type":"connected"}\n\n');

      const heartbeat = setInterval(() => {
        if (!client.write('data: {"type":"heartbeat"}\n\n')) {
          clearInterval(heartbeat);
        }
      }, 30000);

      return () => {
        clearInterval(heartbeat);
        client.close();
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