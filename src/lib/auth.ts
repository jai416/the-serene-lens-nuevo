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

export async function registerUser(email: string, password: string, name?: string, username?: string) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "Ya existe una cuenta con este email" }

  let usernameClean: string | undefined
  if (username) {
    usernameClean = username.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
    if (usernameClean.length < 3) return { error: "El nombre de usuario debe tener al menos 3 caracteres" }
    const existingUsername = await db.user.findFirst({ where: { username: usernameClean } })
    if (existingUsername) return { error: "Este nombre de usuario ya está en uso" }
  }

  const authEnv = getAuthEnv()
  const isAdmin = email === authEnv?.ROOT_ADMIN_EMAIL

  const user = await db.user.create({
    data: {
      email,
      name: name || null,
      username: usernameClean || undefined,
      password: await hashPassword(password),
      role: isAdmin ? "ADMIN" : "USER",
      plan: isAdmin ? "PRO_PLUS" : "PREMIUM",
      analysisLimit: 0,
      trialEndsAt: isAdmin ? undefined : new Date(Date.now() + 7 * 86400000),
    },
  })

  if (!isAdmin) {
    try {
      const { sendEmail, buildWelcomeEmail } = await import("@/lib/email")
      const { subject, html } = buildWelcomeEmail(name || "Usuario")
      sendEmail({ to: email, subject, html }).catch(() => {})
    } catch {}
  }

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
          username: user.username,
          latitude: user.latitude,
          longitude: user.longitude,
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

      if (!existingUser) {
        // New OAuth user — assign 7-day trial
        if (user.email && !user.email.endsWith("@theserene.app")) {
          try {
            await db.user.update({
              where: { email: user.email! },
              data: {
                plan: "PREMIUM",
                analysisLimit: 0,
                trialEndsAt: new Date(Date.now() + 7 * 86400000),
              },
            })
          } catch {}
        }
        return true
      }

      // Auto-generate username for Google/GitHub users if not set
      if (!existingUser.username && user.email) {
        let username = user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 20)
        const existingUsername = await db.user.findFirst({ where: { username } })
        if (existingUsername) username += Math.floor(100 + Math.random() * 900)
        await db.user.update({ where: { id: existingUser.id }, data: { username } }).catch(() => {})
      }

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
        token.username = user.username ?? null
        token.latitude = user.latitude ?? null
        token.longitude = user.longitude ?? null
      }
      if (token.sub) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.sub },
            select: { name: true, plan: true, role: true, username: true, latitude: true, longitude: true, trialEndsAt: true },
          })
          if (dbUser) {
            token.name = dbUser.name
            token.picture = dbUser.name ? undefined : token.picture
            token.plan = dbUser.plan
            token.role = dbUser.role
            token.username = dbUser.username
            token.latitude = dbUser.latitude
            token.longitude = dbUser.longitude
            token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.plan = token.plan as string
        session.user.id = token.sub!
        session.user.username = (token.username as string) ?? null
        session.user.latitude = (token.latitude as number) ?? null
        session.user.longitude = (token.longitude as number) ?? null
        session.user.trialEndsAt = (token.trialEndsAt as string) ?? null
      }
      return session
    },
  },
}
