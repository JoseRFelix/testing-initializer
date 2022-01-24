import { isNil } from "./assertion"
import { runIfFn } from "./function"

export function overridePredefinedKeys<Dict extends Record<string, any>, Override extends Partial<Dict>>(
  originalDict: Dict,
  overrideDict: Override
): Record<string, any> {
  const originalKeys = Object.keys(originalDict)
  const newDict = { ...originalDict }

  Object.entries(overrideDict).map(([key, value]) => {
    if (originalKeys.includes(key) && !isNil(value)) {
      newDict[key as keyof Dict] = value
    }
  })

  return newDict
}

export function resolveObjValues<Dict extends Record<string, any>>(originalDict: Dict) {
  const newDict = { ...originalDict }
  return Object.entries(newDict).reduce((acc, [key, value]) => {
    acc[key as keyof Dict] = runIfFn(value, acc)
    return acc
  }, newDict)
}
