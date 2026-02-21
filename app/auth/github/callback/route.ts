import { NextRequest, NextResponse } from 'next/server';

// Redirect to NextAuth's callback handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Redirect to NextAuth's GitHub callback
  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (state) params.set('state', state);

  return NextResponse.redirect(
    new URL(`/api/auth/callback/github?${params.toString()}`, request.url)
  );
}
