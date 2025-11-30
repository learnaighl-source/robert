import { NextResponse } from 'next/server';

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
    const response = await fetch(
      'https://services.leadconnectorhq.com/calendars/?locationId=HJMdGIrc4MORK1Ts5Wru',
      {
        headers: {
          'Authorization': 'Bearer pit-f5571c91-b185-4028-b181-7eca7b39e9a3',
          'Version': '2021-04-15',
        },
      }
    );
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}