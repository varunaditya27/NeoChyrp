import { NextResponse, type NextRequest } from 'next/server';

import { getRequestUser } from '@/src/lib/auth/requestUser';

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  
  if (user) {
    return NextResponse.json({ 
      session: { user },
      success: true
    });
  } else {
    return NextResponse.json({ 
      session: null,
      success: false
    });
  }
}
