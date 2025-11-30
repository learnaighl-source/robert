import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    // Get checked users from DB (single source of truth)
    const dbUsers = await User.find({ checked: true });
    
    if (dbUsers.length === 0) {
      return Response.json({ users: [] });
    }

    // Get GHL data for checked users only
    const ghlResponse = await fetch(
      "https://services.leadconnectorhq.com/users/?locationId=HJMdGIrc4MORK1Ts5Wru",
      {
        headers: {
          Authorization: "Bearer pit-f5571c91-b185-4028-b181-7eca7b39e9a3",
          Version: "2021-07-28",
        },
      }
    );
    
    const ghlData = await ghlResponse.json();
    
    // Merge DB state with GHL data
    const mergedUsers = dbUsers.map(dbUser => {
      const ghlUser = ghlData.users?.find(u => u.id === dbUser.userId);
      return {
        id: dbUser.userId,
        name: dbUser.name,
        checked: true, // Always true from DB
        ...ghlUser // Add GHL availability data
      };
    });

    return Response.json({ users: mergedUsers });
    
  } catch (error) {
    console.error("Calendar state error:", error);
    return Response.json({ error: "Failed to get calendar state" }, { status: 500 });
  }
}