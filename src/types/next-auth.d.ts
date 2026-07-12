import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      plan: string
      username?: string | null
      latitude?: number | null
      longitude?: number | null
      trialEndsAt?: string | null
    }
  }

  interface User {
    role: string
    plan: string
    username?: string | null
    latitude?: number | null
    longitude?: number | null
    trialEndsAt?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    plan: string
    username?: string | null
    latitude?: number | null
    longitude?: number | null
    trialEndsAt?: string | null
  }
}
