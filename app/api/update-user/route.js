import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../lib/models/User';
import { broadcast } from '../websocket/route';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const { userName, checked } = await request.json();
    
    const user = await User.findOneAndUpdate(
      { name: userName },
      { checked: checked },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Broadcast user update with refresh signal
    broadcast({ 
      type: 'userUpdate', 
      userName, 
      checked, 
      timestamp: Date.now(),
      forceRefresh: true 
    });
    
    return NextResponse.json({ success: true }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}