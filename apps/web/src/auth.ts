import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

type CredentialsProps = Record<"email" | "password", string>;

const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();

const credentialsProvider = Credentials({
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
});

const authConfig = {
  providers: [credentialsProvider],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const nextAuth = NextAuth(authConfig);
export const { handlers, auth, signIn, signOut } = nextAuth;
export default nextAuth;
