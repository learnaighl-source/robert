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

    // Get updated selected users list
    const selectedUsers = await User.find({ checked: true }).select(
      "userId name"
    );
    const usersList = selectedUsers.map((user) => ({
      id: user.userId,
      name: user.name,
    }));

    // Broadcast to SSE clients with updated users list
    const clientCount = global.sseClients?.size || 0;
    console.log("Broadcasting to", clientCount, "SSE clients");

    global.sseClients?.forEach((client) => {
      client.write(
        `data: ${JSON.stringify({
          type: "userSelectionUpdate",
          selectedUsers: usersList,
          changedUser: { name, checked },
        })}\n\n`
      );
    });

    console.log("User selection update completed successfully");
    return Response.json(
      {
        success: true,
        selectedUsers: usersList,
        message: "User selection updated and events will be refreshed",
      },
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
