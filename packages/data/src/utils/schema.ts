import { PrimaryKeyType } from "@mswjs/data/lib/glossary"

type Schema<Obj> = {
  [K in keyof Obj]: () => Obj[K]
} & { __pk: PrimaryKeyType }

export function schema<Obj>(obj: Schema<Obj>) {
  return obj
}
