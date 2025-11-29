export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const startTime = startOfDay.getTime();
    const endTime = endOfDay.getTime();

    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/events?locationId=HJMdGIrc4MORK1Ts5Wru&startTime=${startTime}&endTime=${endTime}&userId=${userId}`,
      {
        headers: {
          Authorization: "Bearer pit-f5571c91-b185-4028-b181-7eca7b39e9a3",
          Version: "2021-04-15",
        },
      }
    );

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}