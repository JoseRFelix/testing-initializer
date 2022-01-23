import * as React from "react"
import type { ComponentType, ReactElement } from "react"
import type { RenderOptions } from "@testing-library/react"

import { runIfFn } from "./utils/function"
import { overridePredefinedKeys, resolveObjValues } from "./utils/object"

type Data<Props> = {
  [K in keyof Props]: Props[K] | ((arg: Props) => Props[K])
}

export interface CreateRendererOptions<Props, ExtraProperties> {
  component: ComponentType<Props>
  data?: ExtraProperties | (() => ExtraProperties)
  props?: Data<Props> | ((data: ExtraProperties) => Data<Props>)
  renderFunction: (ui: ReactElement, options?: RenderOptions) => any
  wrapper?: RenderOptions["wrapper"]
}

export function createRenderer<Props = {}, ExtraProperties = {}>(
  options: CreateRendererOptions<Props, ExtraProperties>
) {
  return (overrides: Partial<typeof options.data & typeof options.props> = {}) => {
    const { component: Component, data = {}, props = {}, renderFunction } = options

    const initialData = runIfFn(data)
    const dataWithOverrides = overridePredefinedKeys(initialData, overrides) as ExtraProperties

    const initialProps = runIfFn(props, dataWithOverrides)
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
