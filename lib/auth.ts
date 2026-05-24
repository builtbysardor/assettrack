import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "HR" | "MANAGER" | "VIEWER";
    };
  }
  interface User {
    id: string;
    role: "ADMIN" | "HR" | "MANAGER" | "VIEWER";
  }
}

type UserRole = "ADMIN" | "HR" | "MANAGER" | "VIEWER";
type AuthToken = { id?: string; role?: UserRole; [key: string]: unknown };

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role as UserRole };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      const t = token as AuthToken;
      if (user) {
        t.id = user.id;
        t.role = user.role as UserRole;
      }
      return token;
    },
    session({ session, token }) {
      const t = token as AuthToken;
      if (t.id) session.user.id = t.id;
      if (t.role) session.user.role = t.role;
      return session;
    },
  },
});
