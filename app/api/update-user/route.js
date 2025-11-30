import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../lib/models/User';

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}