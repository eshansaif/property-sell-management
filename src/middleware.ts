import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: { signIn: "/admin/login" },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect every /admin route except the login page itself.
export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
