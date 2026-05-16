import { withAuth } from "next-auth/middleware"

export default withAuth

export const config = {
  matcher: [
    "/((?!sign-in|_next/static|favicon.ico|api/auth|$).*)",
  ],
};
