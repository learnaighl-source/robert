import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    console.log("User selection API called");
    await connectDB();
    const { name, checked } = await request.json();

    console.log("Received data:", { name, checked });

    const result = await User.updateOne(
      { name },
      { checked },
      { upsert: false }
    );

    console.log("Database update result:", result);

    // Broadcast to SSE clients
    const clientCount = global.sseClients?.size || 0;
    console.log("Broadcasting to", clientCount, "SSE clients");

    global.sseClients?.forEach((client) => {
      client.write(`data: ${JSON.stringify({ name, checked })}\n\n`);
    });

    console.log("User selection update completed successfully");
    return Response.json(
      { success: true },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("User selection API error:", error);
    return Response.json(
      { success: false, error: error.message },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
