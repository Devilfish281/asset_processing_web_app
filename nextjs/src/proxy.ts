// nextjs/src/proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// TODO: add public and private routes
// Public routes (no auth needed)
const isPublicRoute = createRouteMatcher(["/", "/pricing"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect everything that is NOT public
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
