import * as React from "react"
import type { ComponentType, ReactElement } from "react"

import { runIfFn } from "./utils/function"
import { overridePredefinedKeys, resolveObjValues } from "./utils/object"

type MaybeFunction<T, FnArgs> = T | ((arg: FnArgs) => T)

type RendererEvent = "render" | "remount" | "beforeRender"

interface RendererOverrides<Props, ExtraProperties> {
  data?: MaybeFunction<Partial<ExtraProperties>, { initialData: ExtraProperties }>
  props?: MaybeFunction<
    Partial<Props>,
    { initialData: ExtraProperties; initialProps: Props; nextData: ExtraProperties }
  >
}

type RendererEventCallback<Props, ExtraProperties> = (args: { data: ExtraProperties; props: Props }) => void

type RendererRenderFunction<ExtraProperties, RenderResult> = (
  ui: ReactElement,
  options?: { data: ExtraProperties }
) => RenderResult

type RendererRenderReturn<Props, ExtraProperties, TestingLibraryRenderResult> = ExtraProperties &
  Props & {
    remount: () => Promise<ReturnType<RendererRenderFunction<ExtraProperties, TestingLibraryRenderResult>>>
    renderUtils: ReturnType<RendererRenderFunction<ExtraProperties, TestingLibraryRenderResult>>
  }

class Renderer<
  Props extends object,
  ExtraProperties extends object,
  TestingLibraryRenderResult extends { unmount: () => void } = { unmount: () => void }
> {
  private component?: ComponentType<Props>
  private renderFunction?: RendererRenderFunction<ExtraProperties, TestingLibraryRenderResult>

  private _events: Partial<Record<RendererEvent, RendererEventCallback<Props, ExtraProperties>>> = {}
  private _data: ExtraProperties = {} as ExtraProperties
  private _props: MaybeFunction<Props, ExtraProperties> = {} as Props

  addData<K extends string, V>(
    name: K,
    value: MaybeFunction<V, typeof this._data>
  ): Renderer<Props, ExtraProperties & Record<K, V>> {
    this._data[name as any] = value
    return this as Renderer<Props, ExtraProperties & Record<K, V>>
  }

  setProps<V extends Props>(value: MaybeFunction<V, typeof this._data>): Renderer<V, ExtraProperties> {
    this._props = value
    return this as unknown as Renderer<V, ExtraProperties>
  }

  setComponent(component: ComponentType<Props>) {
    this.component = component
    return this
  }

  setRenderFunction<F extends (ui: ReactElement) => TestingLibraryRenderResult>(
    renderFunction: F
  ): Renderer<Props, ExtraProperties, ReturnType<F>> {
    this.renderFunction = renderFunction
    return this as unknown as Renderer<Props, ExtraProperties, ReturnType<F>>
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

  private async render(
    overrides: RendererOverrides<typeof this._props, typeof this._data> = {}
  ): Promise<RendererRenderReturn<Props, ExtraProperties, TestingLibraryRenderResult>> {
    const Component = this.component as ComponentType<Props>

    const initialData = this._data
    const overrideData = runIfFn(overrides?.data, { initialData })
    let dataWithOverrides = overridePredefinedKeys(initialData, overrideData ?? {})

    dataWithOverrides = resolveObjValues(dataWithOverrides)

    const initialProps = runIfFn(this._props, dataWithOverrides)
    const overrideProps = runIfFn(overrides?.props, { initialData, initialProps, nextData: dataWithOverrides })
    const propsWithOverrides = overridePredefinedKeys(initialProps, overrideProps ?? {})

    await this.triggerEvent("beforeRender", propsWithOverrides, dataWithOverrides)

    const renderOptions = {
      data: dataWithOverrides,
    }

    let renderUtils = this.renderFunction!(<Component {...propsWithOverrides} />, renderOptions)

    await this.triggerEvent("render", propsWithOverrides, dataWithOverrides)

    return {
      ...dataWithOverrides,
      ...propsWithOverrides,
      remount: async () => {
        renderUtils.unmount()
        renderUtils = this.renderFunction!(<Component {...propsWithOverrides} />, renderOptions)
        await this.triggerEvent("remount", propsWithOverrides, dataWithOverrides)

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

    return this.render.bind(this) as typeof this.render
  }
}

export function createRenderer<Props extends object = {}, ExtraProperties extends object = {}>() {
  return new Renderer<Props, ExtraProperties>()
}
