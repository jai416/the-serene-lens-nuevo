export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { maxRetries?: number; baseDelayMs?: number; onRetry?: (attempt: number, error: unknown) => void }
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, onRetry } = options || {}
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      if (onRetry) onRetry(i + 1, error)
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, i)))
    }
  }
  throw new Error("Unreachable")
}
