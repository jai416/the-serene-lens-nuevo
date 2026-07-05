import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { db } from "@/lib/db"
import { getEnv } from "@/lib/env"
import { checkRateLimit } from "@/lib/rate-limit"

function getAuthEnv() {
  try {
    return getEnv()
  } catch (e) {
    console.error("[Auth] Failed to load env vars:", e instanceof Error ? e.message : e)
    return null
  }
}

async function get_crypto() {
  return import("crypto")
}

async function hashPassword(password: string): Promise<string> {
  const crypto = await get_crypto()
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) { reject(err); return }
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const crypto = await get_crypto()
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) { reject(err); return }
      resolve(derivedKey.toString("hex") === key)
    })
  })
}

export async function registerUser(email: string, password: string, name?: string) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "Ya existe una cuenta con este email" }

  const authEnv = getAuthEnv()
  const isAdmin = email === authEnv?.ROOT_ADMIN_EMAIL

  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      password: await hashPassword(password),
      role: isAdmin ? "ADMIN" : "USER",
      plan: isAdmin ? "PRO_PLUS" : "FREE",
    },
  })

  return { user: { id: user.id, email: user.email, name: user.name } }
}

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const ip = typeof req?.headers?.["x-forwarded-for"] === "string"
          ? req.headers["x-forwarded-for"].split(",")[0].trim()
          : "unknown"

        const { allowed } = await checkRateLimit(`login:${ip}`, 10, 60000)
        if (!allowed) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null

        const valid = await verifyPassword(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true

      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        include: { accounts: true },
      })

      if (!existingUser) return true

      const hasLinkedAccount = existingUser.accounts.some(
        (a) => a.provider === account.provider
      )

      if (hasLinkedAccount) return true

      const hasPassword = !!existingUser.password

      if (hasPassword) {
        const alreadyLinkedToOther = existingUser.accounts.some(
          (a) => a.provider !== account.provider
        )
        if (alreadyLinkedToOther) return true

        await db.account.create({
          data: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
          },
        })

        user.id = existingUser.id
        return true
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "USER"
        token.plan = user.plan || "FREE"
      }
      if (token.role === "ADMIN" && token.plan !== "PRO_PLUS") {
        try {
          await db.user.update({ where: { id: token.sub! }, data: { plan: "PRO_PLUS" } })
          token.plan = "PRO_PLUS"
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.plan = token.plan as string
        session.user.id = token.sub!
      }
      return session
    },
  },
}
