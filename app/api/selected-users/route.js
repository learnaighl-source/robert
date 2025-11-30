import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getUserCache, getSelectedUsers, initializeCache } from '@/lib/userCache';

export async function GET() {
  try {
    const cache = getUserCache();
    
    // If cache is empty, load from DB
    if (cache.users.length === 0) {
      await connectDB();
      const dbUsers = await User.find({});
      initializeCache(dbUsers);
    }
    
    const selectedUsers = getSelectedUsers();
    
    return Response.json({ 
      selectedUsers: selectedUsers.map(user => ({
        id: user.userId,
        name: user.name
      })),
      stats: cache.stats
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Selected users API error:', error);
    return Response.json({ error: error.message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}