export function isNil(x: any): boolean {
  return x == null
}

export function isFunction(value: any): value is Function {
  return typeof value === "function"
}
