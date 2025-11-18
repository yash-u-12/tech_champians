import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Bypass authentication completely for hospital routes
  if (
    pathname.startsWith('/hospital-workflow') ||
    pathname.startsWith('/hospital-portal') ||
    pathname.startsWith('/hospital-automation') ||
    pathname.startsWith('/api/hospital')
  ) {
    return NextResponse.next();
  }

  // For now, allow all other routes to proceed without auth
  // You can add Clerk back later when you have valid keys
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
