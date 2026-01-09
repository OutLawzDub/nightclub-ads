import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 [Middleware] Request to:', pathname);
  console.log('🔍 [Middleware] Method:', request.method);
  console.log('🔍 [Middleware] Headers:', {
    'user-agent': request.headers.get('user-agent')?.substring(0, 50),
    'referer': request.headers.get('referer'),
  });

  if (pathname.startsWith('/dashboard')) {
    console.log('🔍 [Middleware] Dashboard route detected');
    
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('authToken')?.value;
    
    console.log('🔍 [Middleware] Auth header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'null');
    console.log('🔍 [Middleware] Cookie token:', cookieToken ? `${cookieToken.substring(0, 30)}...` : 'null');

    if (!authHeader && !cookieToken) {
      console.log('⚠️ [Middleware] No auth header or cookie found');
      console.log('ℹ️ [Middleware] Allowing access - authentication will be checked by client component');
    } else {
      console.log('✅ [Middleware] Auth found in header or cookie');
    }
  }

  console.log('✅ [Middleware] Allowing request to proceed');
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
