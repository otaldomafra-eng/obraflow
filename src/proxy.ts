import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/sign-in",
  },
});

export const config = {
  matcher: [
    "/((?!setup|sign-in|portal|_next/static|favicon.ico|api/auth|$).*)",
  ],
};
