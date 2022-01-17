import React from "react"
import type { ComponentType } from "react"
import { createDatabase } from "@react-testing/data"
import { render, RenderOptions } from "@testing-library/react"

import { runIfFn } from "./utils/function"

type TestingDatabase = ReturnType<typeof createDatabase>

type Data<Database, Props> = {
  [K in keyof Props]: Props[K] | ((db: Database) => Props[K])
}

interface Options<Database, Props, ExtraProperties> {
  component: ComponentType<Props>
  data: Data<Database, Props> & ExtraProperties
  renderFunction: typeof render
  wrapper?: RenderOptions["wrapper"]
}

export function createRenderer<Database extends TestingDatabase, Props = {}, ExtraProperties = {}>(
  db: any,
  options: Options<Database, Props, ExtraProperties>
) {
  const { component: Component, data, renderFunction } = options

  let props: Record<string, any> = {}

  Object.entries(data).forEach(([key, value]) => {
    props = {
      ...props,
      [key]: runIfFn(value, db),
    }
  })

  return (overrides: Partial<typeof options.data> = {}) => {
    const propsWithOverrides = {
      ...props,
      ...overrides,
    } as Props & ExtraProperties

    const renderUtils = renderFunction(<Component {...propsWithOverrides} />, { wrapper: options.wrapper })

    return {
      ...propsWithOverrides,
      renderUtils,
    }
  }
}
