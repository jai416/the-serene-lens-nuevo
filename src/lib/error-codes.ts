export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UPGRADE_REQUIRED: "UPGRADE_REQUIRED",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  CONFLICT: "CONFLICT",
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.UNAUTHORIZED]: "No autorizado",
  [ErrorCodes.FORBIDDEN]: "Acceso denegado",
  [ErrorCodes.NOT_FOUND]: "No encontrado",
  [ErrorCodes.VALIDATION_ERROR]: "Datos inválidos",
  [ErrorCodes.RATE_LIMITED]: "Demasiadas solicitudes. Intenta de nuevo más tarde.",
  [ErrorCodes.INTERNAL_ERROR]: "Error interno del servidor",
  [ErrorCodes.UPGRADE_REQUIRED]: "Actualiza tu plan para acceder a esta función",
  [ErrorCodes.PAYMENT_ERROR]: "Error al procesar el pago",
  [ErrorCodes.NOT_IMPLEMENTED]: "Función no implementada",
  [ErrorCodes.CONFLICT]: "Conflicto con el estado actual",
}
