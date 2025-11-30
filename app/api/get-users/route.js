import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../lib/models/User';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET() {
  try {
    await dbConnect();
    
    const users = await User.find({}, 'name checked');
    
    return NextResponse.json({ users }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}