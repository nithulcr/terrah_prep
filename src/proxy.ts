// ============================================
// Terrah Qbank - MIDDLEWARE
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/mock-tests',
  '/bookmarks',
  '/results',
  '/analytics',
];

// Routes that require premium subscription
const premiumRoutes = [
  '/bookmarks',
  '/analytics',
  '/pdf',
];

// Routes that are public (no authentication required)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/pricing',
];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  try {
    // Skip middleware for static files
    if (path.startsWith('/_next') || 
        path.startsWith('/favicon') ||
        path.includes('.') ||
        path === '/'
    ) {
      return NextResponse.next();
    }
    
    // ALLOW ALL ACCESS - client-side will handle authentication
    // This prevents middleware from blocking any routes
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware: Critical error:', error);
    // If middleware fails completely, still allow the request
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
