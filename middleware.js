import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Hospital workflows intentionally public for demo
  '/hospital-workflow(.*)',
  '/hospital-portal(.*)',
  '/hospital-automation(.*)',
  '/api/hospital(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    try {
      if (typeof auth === 'function') {
        const a = auth();
        if (a && typeof a.protect === 'function') a.protect();
      } else if (auth && typeof auth.protect === 'function') {
        auth.protect();
      }
    } catch (_) {
      // Silently ignore; Clerk will handle unauthorized state downstream
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)'
  ],
};
