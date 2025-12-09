import Admin from "../../../models/Admin";
import dbConnect from "../../../lib/mongodb";

export async function POST(request) {
  try {
    const { newPassword } = await request.json();

    await dbConnect();
    await Admin.updateOne({}, { key: newPassword }, { upsert: true });

    return Response.json(
      {
        success: true,
        message: "Key updated successfully",
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
    return Response.json(
      {
        success: false,
        error: "Server error",
      },
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
