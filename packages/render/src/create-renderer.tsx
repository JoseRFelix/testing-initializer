import React from "react"
import type { ComponentType } from "react"
import { render, RenderOptions } from "@testing-library/react"

import { runIfFn } from "./utils/function"
import { isNil } from "./utils/assertion"

type Data<Props> = {
  [K in keyof Props]: Props[K] | ((arg: Props) => Props[K])
}

interface Options<Props, ExtraProperties> {
  component: ComponentType<Props>
  data?: ExtraProperties | (() => ExtraProperties)
  props?: Data<Props> | ((data: ExtraProperties) => Data<Props>)
  renderFunction: typeof render
  wrapper?: RenderOptions["wrapper"]
}

function overridePredefinedKeys<Dict extends Record<string, any>, Override extends Partial<Dict>>(
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

function resolveObjValues<Dict extends Record<string, any>>(originalDict: Dict) {
  const newDict = { ...originalDict }
  return Object.entries(newDict).reduce((acc, [key, value]) => {
    acc[key as keyof Dict] = runIfFn(value, acc)
    return acc
  }, newDict)
}

export function createRenderer<Props = {}, ExtraProperties = {}>(options: Options<Props, ExtraProperties>) {
  return (overrides: Partial<typeof options.data & typeof options.props> = {}) => {
    const { component: Component, data = {}, props = {}, renderFunction } = options

    const initialData = runIfFn(data) ?? {}
    const dataWithOverrides = overridePredefinedKeys(initialData, overrides) as ExtraProperties

    const initialProps = runIfFn(props, dataWithOverrides) ?? {}
    let propsWithOverrides = overridePredefinedKeys(initialProps, overrides) as Props

    propsWithOverrides = resolveObjValues(propsWithOverrides)

    const renderUtils = renderFunction(<Component {...propsWithOverrides} />, { wrapper: options.wrapper })

    return {
      ...propsWithOverrides,
      ...dataWithOverrides,
      renderUtils,
    }
  }
}
