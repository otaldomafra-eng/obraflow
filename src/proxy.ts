import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/sign-in",
  },
});

export const config = {
  matcher: [
    "/((?!sign-in|_next/static|favicon.ico|api/auth|$).*)",
  ],
};
