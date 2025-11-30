import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { updateUserInCache, getUserStats } from "@/lib/userCache";

export async function POST(request) {
  try {
    console.log("User selection API called");
    await connectDB();
    const { name, checked } = await request.json();

    console.log("Received data:", { name, checked });

    // Try to find and update user, create if doesn't exist
    let result = await User.findOneAndUpdate(
      { name },
      { checked },
      { new: true, upsert: false }
    );

    if (!result) {
      console.log(`User '${name}' not found, creating new user`);
      // Create new user if not found
      result = await User.create({
        userId: `temp_${Date.now()}`, // Temporary ID until we get real one
        name,
        checked
      });
      console.log("Created new user:", result);
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
