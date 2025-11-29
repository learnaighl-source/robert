import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    const selectedUsers = await User.find({ checked: true }).select('userId name');
    
    return Response.json({ 
      selectedUsers: selectedUsers.map(user => ({
        id: user.userId,
        name: user.name
      }))
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