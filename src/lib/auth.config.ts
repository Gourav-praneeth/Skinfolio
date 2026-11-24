import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-safe auth config (no Prisma). Used by middleware.
 * Full providers + adapter live in auth.ts for Node runtimes.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    // Placeholder so the config type-checks on Edge; real authorize is in auth.ts
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async () => null,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const publicPaths = ["/", "/login", "/register", "/disclaimer"];
      const isPublic =
        publicPaths.includes(pathname) ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next");
      if (isPublic) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
