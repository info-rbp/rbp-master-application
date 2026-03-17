
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/server-auth';

export async function POST(request: Request) {
    const options = {
      name: AUTH_COOKIE_NAME,
      value: '',
      maxAge: -1,
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set(options);

    return response;
}
