import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { updateUserInCache, getUserStats } from "@/lib/userCache";

export async function POST(request) {
  try {
    console.log("User selection API called");
    await connectDB();
    const { name, checked } = await request.json();

    console.log("Received data:", { name, checked });

    const result = await User.findOneAndUpdate(
      { name },
      { checked },
      { new: true, upsert: false }
    );

    if (!result) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.log("Database update result:", result);

    // Update cache
    updateUserInCache(result.userId, {
      userId: result.userId,
      name: result.name,
      checked: result.checked
    });

    // Send simple refresh signal to SSE clients
    const clientCount = global.sseClients?.size || 0;
    console.log("Broadcasting refresh to", clientCount, "SSE clients");

    global.sseClients?.forEach((client) => {
      client.write(`data: {"type":"refresh"}\n\n`);
    });

    console.log("User selection update completed successfully");
    return Response.json(
      { success: true, user: result },
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
