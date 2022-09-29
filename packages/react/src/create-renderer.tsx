import * as React from "react"
import type { ComponentType, ReactElement } from "react"
import { Assign } from "utility-types"

import { runIfFn } from "./utils/function"
import { overridePredefinedKeys, resolveObjValues } from "./utils/object"

type MaybeFunction<T, FnArgs> = T | ((arg: FnArgs) => T)

type RendererEvent = "onRender" | "onRemount" | "onBeforeRender"

interface RendererOverrides<Props, ExtraProperties> {
  data?: MaybeFunction<Partial<ExtraProperties>, { initialData: ExtraProperties }>
  props?: MaybeFunction<
    Partial<Props>,
    { initialData: ExtraProperties; initialProps: Props; nextData: ExtraProperties }
  >
}

type RendererEventCallback<Props, ExtraProperties> = (args: { data: ExtraProperties; props: Props }) => void

class Renderer<Props extends object, ExtraProperties extends object> {
  private component?: ComponentType<Props>
  private renderFunction?: (ui: ReactElement) => any

  _events: Partial<Record<RendererEvent, RendererEventCallback<Props, ExtraProperties>>> = {}
  _data: ExtraProperties = {} as ExtraProperties
  _props: MaybeFunction<Props, ExtraProperties> = {} as Props

  addData<K extends string, V>(
    name: K,
    value: MaybeFunction<V, this["_data"]>
  ): Renderer<Props, Assign<ExtraProperties, Record<K, V>>> {
    this._data[name as any] = value
    return this as Renderer<Props, Assign<ExtraProperties, Record<K, V>>>
  }

  setProps<V extends Props>(value: MaybeFunction<V, this["_data"]>): Renderer<V, ExtraProperties> {
    this._props = value
    return this as unknown as Renderer<V, ExtraProperties>
  }

  setComponent(component: ComponentType<Props>) {
    this.component = component
    return this
  }

  setRenderFunction(renderFunction: (ui: ReactElement) => any) {
    this.renderFunction = renderFunction
    return this
  }

  on(eventName: RendererEvent, callback: RendererEventCallback<Props, ExtraProperties>) {
    this._events[eventName] = callback
    return this
  }

  private async triggerEvent(eventName: RendererEvent, props: Props, data: ExtraProperties) {
    const eventCallback = this._events[eventName]
    if (!eventCallback) return
    await eventCallback({ data, props })
  }

  private async render(overrides: RendererOverrides<this["_props"], this["_data"]> = {}) {
    const Component = this.component as ComponentType<Props>

    const initialData = this._data
    const overrideData = runIfFn(overrides?.data, { initialData })
    let dataWithOverrides = overridePredefinedKeys(initialData, overrideData ?? {})

    dataWithOverrides = resolveObjValues(dataWithOverrides)

    const initialProps = runIfFn(this._props, dataWithOverrides)
    const overrideProps = runIfFn(overrides?.props, { initialData, initialProps, nextData: dataWithOverrides })
    const propsWithOverrides = overridePredefinedKeys(initialProps, overrideProps ?? {})

    await this.triggerEvent("onBeforeRender", propsWithOverrides, dataWithOverrides)

    let renderUtils = this.renderFunction!(<Component {...propsWithOverrides} />)

    await this.triggerEvent("onRender", propsWithOverrides, dataWithOverrides)

    return {
      ...dataWithOverrides,
      ...propsWithOverrides,
      remount: async () => {
        renderUtils.unmount()
        renderUtils = this.renderFunction!(<Component {...propsWithOverrides} />)
        await this.triggerEvent("onRemount", propsWithOverrides, dataWithOverrides)

        return renderUtils
      },
      renderUtils,
    }
  }

  build() {
    if (!this.component) {
      throw new Error("Component is not set")
    }

    if (!this.renderFunction) {
      throw new Error("Render function is not set")
    }

    return this.render.bind(this)
  }
}

export function createRenderer<Props extends object = {}, ExtraProperties extends object = {}>() {
  return new Renderer<Props, ExtraProperties>()
}
