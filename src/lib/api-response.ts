import { NextResponse } from "next/server"
import { ErrorCode, ErrorCodes, ErrorMessages } from "@/lib/error-codes"

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(code: ErrorCode, message?: string, status?: number) {
  const resolvedStatus = status ?? errorStatus(code)
  const resolvedMessage = message ?? ErrorMessages[code]
  return NextResponse.json(
    { success: false, error: { code, message: resolvedMessage } },
    { status: resolvedStatus }
  )
}

export function ok<T>(data: T, status = 200) {
  return apiResponse(data, status)
}

export function error(message: string, status = 400) {
  return apiError(ErrorCodes.VALIDATION_ERROR, message, status)
}

export function unauthorized(message?: string) {
  return apiError(ErrorCodes.UNAUTHORIZED, message)
}

export function forbidden(message?: string) {
  return apiError(ErrorCodes.FORBIDDEN, message)
}

export function notFound(message?: string) {
  return apiError(ErrorCodes.NOT_FOUND, message)
}

export function serverError(e?: unknown) {
  const errMsg = process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined
  console.error("[API Error]", e)
  return apiError(ErrorCodes.INTERNAL_ERROR, errMsg)
}

function errorStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCodes.UNAUTHORIZED:
      return 401
    case ErrorCodes.FORBIDDEN:
      return 403
    case ErrorCodes.NOT_FOUND:
      return 404
    case ErrorCodes.RATE_LIMITED:
      return 429
    case ErrorCodes.VALIDATION_ERROR:
      return 400
    case ErrorCodes.CONFLICT:
      return 409
    case ErrorCodes.UPGRADE_REQUIRED:
      return 403
    case ErrorCodes.PAYMENT_ERROR:
      return 402
    default:
      return 500
  }
}
