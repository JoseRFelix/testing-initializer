import { factory, primaryKey } from "@mswjs/data"
import { KeyType, NestedModelDefinition, ModelValueType } from "@mswjs/data/lib/glossary"
import { ManyOf, OneOf } from "@mswjs/data/lib/relations/Relation"

import { generateId } from "./utils/id"

export type ModelDictionary = Record<KeyType, any>

type ModelDefinitionValues<NestedDict> = {
  [K in keyof NestedDict]: NestedDict[K] extends any[]
    ? ManyOf<any, boolean> | (() => NestedDict[K]) // If type is an array
    : NestedDict[K] extends Record<any, any>
    ? OneOf<any, boolean> | (() => NestedDict[K]) // If type is a record
    : () => NestedDict[K] // Default if none match
}

export type ModelDefinition<Dict> = {
  [K in keyof Dict]: ModelDefinitionValues<Dict[K]>
}

export function createDatabase<Dict extends ModelDictionary>(dictionary: ModelDefinition<Dict>) {
  const modelDefinition = { ...dictionary }

  Object.entries(modelDefinition).forEach(([k, v]) => {
    const key = k as keyof Dict

    modelDefinition[key] = {
      __pk: primaryKey(() => generateId(`${key}-pk`)),
      ...v,
    }
  })

  return factory(modelDefinition)
}
