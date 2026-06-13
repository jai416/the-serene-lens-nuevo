import { NextResponse } from "next/server"

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function unauthorized(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(error?: unknown) {
  console.error(error)
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
}
