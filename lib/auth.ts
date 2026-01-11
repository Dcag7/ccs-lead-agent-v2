
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          // Validate email domain
          const allowedDomains = ["ccsapparel.africa", "ccsapparel.co.za"];
          const emailParts = credentials.email.split("@");
          
          if (emailParts.length !== 2 || !emailParts[1]) {
            throw new Error("Invalid email format");
          }
          
          const emailDomain = emailParts[1];
          
          if (!allowedDomains.includes(emailDomain)) {
            throw new Error("Unauthorized email domain");
          }

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          // Log the actual error for debugging
          console.error("Authorization error:", error);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // NextAuth JWT type doesn't include custom fields, but we need role
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // NextAuth Session type doesn't include custom fields, but we need id and role
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
