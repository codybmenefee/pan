/**
 * Sanitize data to remove Convex internal fields that cause UUID validation errors.
 * Braintrust expects UUIDs in 'id' fields, but Convex uses custom ID strings.
 */
export function sanitizeForBraintrust(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForBraintrust(item))
  }

  if (typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Skip Convex internal fields
      if (key === '_id' || key === '_creationTime' || key === '_deletionTime') {
        continue
      }

      // Convert Convex IDs to strings (not UUIDs, but at least not objects)
      if (key === 'id' && typeof value === 'object' && value !== null && 'toString' in value) {
        sanitized[key] = String(value)
      } else {
        sanitized[key] = sanitizeForBraintrust(value)
      }
    }
    return sanitized
  }

  return data
}
