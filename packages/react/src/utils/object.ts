import { isNil } from "./assertion"
import { runIfFn } from "./function"

export function overridePredefinedKeys<Dict extends Record<string, any>, Override extends Partial<Dict>>(
  originalDict: Dict,
  overrideDict: Override
): Dict {
  const originalKeys = Object.keys(originalDict)
  const newDict = { ...originalDict }

  Object.entries(overrideDict).map(([key, value]) => {
    if (originalKeys.includes(key)) {
      newDict[key as keyof Dict] = value
    }
  })

  return newDict
}

type ResolveDictValueFunctions<Dict> = {
  [K in keyof Dict]: Dict[K] extends (...args: any[]) => any ? ReturnType<Dict[K]> : Dict[K]
}

export function resolveObjValues<Dict extends Record<string, any>, Args>(
  originalDict: Dict
): ResolveDictValueFunctions<Dict> {
  const newDict = { ...originalDict }
  return Object.entries(newDict).reduce((acc, [key, value]) => {
    acc[key as keyof Dict] = runIfFn(value, acc)
    return acc
  }, newDict)
}
