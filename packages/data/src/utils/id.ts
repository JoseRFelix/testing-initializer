/** Used to generate unique IDs. */
const idCounter: Record<string, number> = {}

export function generateId(cacheKey = "$RT$") {
  if (!idCounter[cacheKey]) {
    idCounter[cacheKey] = 0
  }

  const id = ++idCounter[cacheKey]

  return id
}
