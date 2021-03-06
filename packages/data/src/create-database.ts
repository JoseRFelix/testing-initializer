import { factory, primaryKey } from "@mswjs/data"
import { KeyType, PrimaryKeyType } from "@mswjs/data/lib/glossary"
import { ManyOf, OneOf } from "@mswjs/data/lib/relations/Relation"
import { PrimaryKeyGetter } from "@mswjs/data/lib/primaryKey"

import { generateId } from "./utils/id"
import { isNil } from "./utils/assertion"
import { runIfFn } from "./utils/function"

export type ModelDictionary = Record<KeyType, any>
export type MaybeFunction<T, FnArgs> = T | ((arg: FnArgs) => T)

export type ModelDefinitionValues<NestedDict> = {
  [K in keyof NestedDict]: NestedDict[K] extends any[]
    ? ManyOf<any, boolean> | (() => NestedDict[K]) // If type is an array
    : NestedDict[K] extends Record<any, any>
    ? OneOf<any, boolean> | (() => NestedDict[K]) // If type is a record
    : () => NestedDict[K] // Default if none match
}

type ParamModelDefinition<Dict> = {
  [K in keyof Dict]: MaybeFunction<ModelDefinitionValues<Dict[K]>, {}>
}

export type ModelDefinition<Dict> = {
  [K in keyof Dict]: ModelDefinitionValues<Dict[K]>
}

export function createDatabase<Dict extends ModelDictionary>(dictionary: ParamModelDefinition<Dict>) {
  const modelDefinition = { ...dictionary }

  Object.entries(modelDefinition).forEach(([k, v]) => {
    const key = k as keyof Dict
    const value = runIfFn(v) as ModelDefinitionValues<Dict[typeof key]>

    const hasId = !isNil(value["id"]) && typeof value.id === "function"
    const idFunction = hasId ? (value["id"] as PrimaryKeyGetter<PrimaryKeyType>) : () => generateId(`${String(key)}-pk`)
    const primaryKeyObjectKey = hasId ? "id" : "__pk"

    modelDefinition[key] = {
      ...value,
      [primaryKeyObjectKey]: primaryKey(idFunction),
    }
  })

  return factory(modelDefinition as ModelDefinition<Dict>)
}
