/**
 * Safely serialize data that might contain BigInt values from Prisma raw queries.
 * JSON.stringify cannot handle BigInt natively.
 */
export function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? Number(value) : value
  )
}

/**
 * Utility to convert any BigInt values in an object to Number.
 * Useful for Prisma raw query results.
 */
export function convertBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return obj.map(convertBigInt)
    }
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = convertBigInt((obj as Record<string, unknown>)[key])
    }
    return result
  }
  return obj
}
