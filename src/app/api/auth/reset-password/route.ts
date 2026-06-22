import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex")
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json()

    if (!email || !token || !password) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const stored = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    })

    if (!stored) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    if (new Date() > stored.expires) {
      await db.verificationToken.delete({ where: { token: stored.token } }).catch(() => {})
      return NextResponse.json({ error: "El token ha expirado. Solicita uno nuevo." }, { status: 400 })
    }

    const hashed = await hashPassword(password)
    await db.user.update({
      where: { email },
      data: { password: hashed },
    })

    await db.verificationToken.delete({ where: { token: stored.token } })

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
