import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/server/db/client";
import { verifyPassword } from "@/server/auth/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        if (user.passwordHash) {
          const valid = await verifyPassword(credentials.password, user.passwordHash);

          if (!valid) return null;

          return { id: user.id, email: user.email, name: user.name };
        }

        const isDemoAllowed =
          process.env.NODE_ENV === "development" ||
          process.env.DEMO_LOGIN_ENABLED === "true";

        if (!isDemoAllowed) return null;

        const demoPassword = process.env.DEMO_LOGIN_PASSWORD;

        if (!demoPassword) return null;

        if (credentials.password !== demoPassword) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        const slug = process.env.DEFAULT_TENANT_SLUG;

        if (slug) {
          const tenant = await prisma.tenant.findUnique({ where: { slug } });

          if (tenant) {
            token.tenantId = tenant.id;
          }
        } else {
          const memberships = await prisma.membership.findMany({
            where: { userId: user.id },
          });

          if (memberships.length === 1) {
            token.tenantId = memberships[0].tenantId;
          } else if (memberships.length > 1) {
            throw new Error(
              "Multiple tenants found. Set DEFAULT_TENANT_SLUG env var or implement tenant selector.",
            );
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;

        if (token.tenantId) {
          session.user.tenantId = token.tenantId;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
};
