import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection: gate /platform and /dashboard behind the presence of the
// auth cookie. Role-level checks (super_admin vs vendor staff) still happen
// client-side via AuthContext/API responses -- this only stops an
// unauthenticated visitor from loading the shell.
export function proxy(request: NextRequest) {
  const token = request.cookies.get("billing_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*", "/dashboard/:path*"],
};
