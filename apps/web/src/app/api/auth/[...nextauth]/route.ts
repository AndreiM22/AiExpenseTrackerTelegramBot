import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

type CredentialsProps = Record<"email" | "password", string>;

const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const input = credentials as CredentialsProps | null;
        if (!input?.email || !input?.password) {
          throw new Error("Completează email-ul și parola.");
        }
        const expectedEmail = adminEmail || "admin@example.com";
        const expectedPassword = adminPassword || "admin123";
        if (input.email !== expectedEmail || input.password !== expectedPassword) {
          throw new Error("Date de autentificare invalide.");
        }
        return {
          id: "demo-admin",
          email: expectedEmail,
          name: "Expense Admin",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
        };
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
