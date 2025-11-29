import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      // Get specific user by name
      const user = await User.findOne({ name });
      return Response.json({ user });
    } else {
      // Get all users (fallback for existing functionality)
      const response = await fetch(
        "https://services.leadconnectorhq.com/users/?locationId=HJMdGIrc4MORK1Ts5Wru",
        {
          headers: {
            Authorization: "Bearer pit-f5571c91-b185-4028-b181-7eca7b39e9a3",
            Version: "2021-07-28",
          },
        }
      );
      
      const data = await response.json();
      return Response.json(data);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}