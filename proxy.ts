import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSalesRoute = createRouteMatcher(["/sales(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isSalesRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};